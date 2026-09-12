package SE.BOAT.SAFARI.Schedule;

import SE.BOAT.SAFARI.BoatManagement.Boat;
import SE.BOAT.SAFARI.BoatManagement.BoatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SafariScheduleService {

    @Autowired
    private SafariScheduleRepository safariScheduleRepository;

    @Autowired
    private BoatRepository boatRepository;

    public void validateScheduleConflict(SafariSchedule schedule, Long excludeId) {
        // 1. Validate Boat status (not in maintenance)
        Optional<Boat> boatOpt = boatRepository.findById(schedule.getBoatId());
        if (boatOpt.isPresent()) {
            Boat boat = boatOpt.get();
            if ("MAINTENANCE".equalsIgnoreCase(boat.getStatus()) || "UNAVAILABLE".equalsIgnoreCase(boat.getStatus())) {
                throw new IllegalStateException("Selected boat '" + boat.getName() + "' is currently under maintenance / unavailable for safari scheduling.");
            }
            if (schedule.getBoatName() == null || schedule.getBoatName().isEmpty()) {
                schedule.setBoatName(boat.getName());
            }
        }

        // 2. Validate Boat schedule collision
        if (schedule.getBoatId() > 0 && schedule.getScheduleDate() != null && schedule.getTimeSlot() != null) {
            List<SafariSchedule> boatConflicts = safariScheduleRepository.findByBoatIdAndScheduleDateAndTimeSlot(
                    schedule.getBoatId(), schedule.getScheduleDate(), schedule.getTimeSlot()
            );

            for (SafariSchedule existing : boatConflicts) {
                if (!"CANCELLED".equalsIgnoreCase(existing.getStatus()) && (excludeId == null || !existing.getId().equals(excludeId))) {
                    throw new IllegalStateException("Conflict: Boat '" + existing.getBoatName() + "' is already scheduled for trip '" + existing.getTripName() + "' on " + schedule.getScheduleDate() + " during " + schedule.getTimeSlot() + ".");
                }
            }
        }

        // 3. Validate Guide schedule collision
        if (schedule.getGuideName() != null && !schedule.getGuideName().trim().isEmpty() && schedule.getScheduleDate() != null && schedule.getTimeSlot() != null) {
            String guide = schedule.getGuideName().trim();
            List<SafariSchedule> guideConflicts = safariScheduleRepository.findByGuideNameIgnoreCaseAndScheduleDateAndTimeSlot(
                    guide, schedule.getScheduleDate(), schedule.getTimeSlot()
            );

            for (SafariSchedule existing : guideConflicts) {
                if (!"CANCELLED".equalsIgnoreCase(existing.getStatus()) && (excludeId == null || !existing.getId().equals(excludeId))) {
                    throw new IllegalStateException("Conflict: Guide '" + existing.getGuideName() + "' is already assigned to trip '" + existing.getTripName() + "' on " + schedule.getScheduleDate() + " during " + schedule.getTimeSlot() + ".");
                }
            }
        }
    }

    public SafariSchedule createSchedule(SafariSchedule schedule) {
        validateScheduleConflict(schedule, null);
        schedule.setStatus("SCHEDULED");
        schedule.setCreatedAt(LocalDateTime.now());
        return safariScheduleRepository.save(schedule);
    }

    @Autowired
    private SE.BOAT.SAFARI.Notification.NotificationService notificationService;

    public SafariSchedule updateSchedule(Long id, SafariSchedule scheduleDetails) {
        Optional<SafariSchedule> existingOpt = safariScheduleRepository.findById(id);
        if (existingOpt.isPresent()) {
            SafariSchedule existing = existingOpt.get();
            existing.setTripName(scheduleDetails.getTripName());
            existing.setScheduleDate(scheduleDetails.getScheduleDate());
            existing.setTimeSlot(scheduleDetails.getTimeSlot());
            existing.setBoatId(scheduleDetails.getBoatId());
            existing.setBoatName(scheduleDetails.getBoatName());
            existing.setGuideName(scheduleDetails.getGuideName());
            if (scheduleDetails.getCancelReason() != null) existing.setCancelReason(scheduleDetails.getCancelReason());
            if (scheduleDetails.getRemarks() != null) existing.setRemarks(scheduleDetails.getRemarks());
            if (scheduleDetails.getStatus() != null) existing.setStatus(scheduleDetails.getStatus());

            if (!"CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                validateScheduleConflict(existing, id);
            }

            SafariSchedule saved = safariScheduleRepository.save(existing);
            notificationService.notifyAffectedTourists(saved, "SCHEDULE_UPDATED", "Schedule details updated by Operations Manager.");
            return saved;
        }
        return null;
    }

    public SafariSchedule cancelSchedule(Long id, String cancelReason) {
        Optional<SafariSchedule> existingOpt = safariScheduleRepository.findById(id);
        if (existingOpt.isPresent()) {
            SafariSchedule existing = existingOpt.get();
            existing.setStatus("CANCELLED");
            String reasonStr = cancelReason != null && !cancelReason.trim().isEmpty() ? cancelReason.trim() : "Cancelled by Operations Manager";
            existing.setCancelReason(reasonStr);

            SafariSchedule saved = safariScheduleRepository.save(existing);
            notificationService.notifyAffectedTourists(saved, "SCHEDULE_CANCELLED", reasonStr);
            return saved;
        }
        return null;
    }

    public Map<String, Object> checkRealtimeAvailability(int boatId, String guideName, String dateStr, String timeSlot) {
        Map<String, Object> response = new HashMap<>();
        boolean boatAvailable = true;
        boolean guideAvailable = true;
        String boatMessage = "Boat is available";
        String guideMessage = "Guide is available";

        LocalDate date = LocalDate.parse(dateStr);

        // Check Boat
        if (boatId > 0) {
            Optional<Boat> boatOpt = boatRepository.findById(boatId);
            if (boatOpt.isPresent() && ("MAINTENANCE".equalsIgnoreCase(boatOpt.get().getStatus()) || "UNAVAILABLE".equalsIgnoreCase(boatOpt.get().getStatus()))) {
                boatAvailable = false;
                boatMessage = "Boat '" + boatOpt.get().getName() + "' is currently under maintenance.";
            } else {
                List<SafariSchedule> boatConflicts = safariScheduleRepository.findByBoatIdAndScheduleDateAndTimeSlot(boatId, date, timeSlot);
                boolean busy = boatConflicts.stream().anyMatch(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()));
                if (busy) {
                    boatAvailable = false;
                    boatMessage = "Boat is already scheduled during " + timeSlot;
                }
            }
        }

        // Check Guide
        if (guideName != null && !guideName.trim().isEmpty()) {
            List<SafariSchedule> guideConflicts = safariScheduleRepository.findByGuideNameIgnoreCaseAndScheduleDateAndTimeSlot(guideName.trim(), date, timeSlot);
            boolean busy = guideConflicts.stream().anyMatch(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()));
            if (busy) {
                guideAvailable = false;
                guideMessage = "Guide '" + guideName + "' is already assigned to another safari during " + timeSlot;
            }
        }

        response.put("boatAvailable", boatAvailable);
        response.put("boatMessage", boatMessage);
        response.put("guideAvailable", guideAvailable);
        response.put("guideMessage", guideMessage);
        return response;
    }

    public boolean deleteSchedule(Long id) {
        if (safariScheduleRepository.existsById(id)) {
            safariScheduleRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Autowired
    private SE.BOAT.SAFARI.Booking.BookingRepository bookingRepository;

    private void enrichScheduleSeatAvailability(SafariSchedule schedule) {
        if (schedule == null) return;

        int capacity = 10;
        String status = "AVAILABLE";

        if (schedule.getBoatId() > 0) {
            Optional<Boat> boatOpt = boatRepository.findById(schedule.getBoatId());
            if (boatOpt.isPresent()) {
                Boat boat = boatOpt.get();
                capacity = boat.getCapacity();
                if ("MAINTENANCE".equalsIgnoreCase(boat.getStatus()) || "UNAVAILABLE".equalsIgnoreCase(boat.getStatus())) {
                    status = "MAINTENANCE";
                }
            }
        }

        if ("MAINTENANCE".equals(status)) {
            schedule.setTotalCapacity(capacity);
            schedule.setBookedSeats(0);
            schedule.setRemainingSeats(0);
            schedule.setSeatStatus("MAINTENANCE");
            return;
        }

        if ("CANCELLED".equalsIgnoreCase(schedule.getStatus())) {
            schedule.setTotalCapacity(capacity);
            schedule.setBookedSeats(0);
            schedule.setRemainingSeats(0);
            schedule.setSeatStatus("CANCELLED");
            return;
        }

        int bookedSeats = 0;
        if (schedule.getBoatId() > 0 && schedule.getScheduleDate() != null) {
            List<SE.BOAT.SAFARI.Booking.Booking> bookings = bookingRepository.findByBoatIdAndSafariDate(
                    schedule.getBoatId(), schedule.getScheduleDate()
            );
            bookedSeats = bookings.stream()
                    .mapToInt(b -> b.getPassengers() > 0 ? b.getPassengers() : (b.getAdults() + b.getChildren()))
                    .sum();
        }

        int remaining = Math.max(0, capacity - bookedSeats);
        String seatStatus = remaining == 0 ? "FULL" : (remaining <= 3 ? "LIMITED" : "AVAILABLE");

        schedule.setTotalCapacity(capacity);
        schedule.setBookedSeats(bookedSeats);
        schedule.setRemainingSeats(remaining);
        schedule.setSeatStatus(seatStatus);
    }

    public List<SafariSchedule> getAllSchedules() {
        List<SafariSchedule> list = safariScheduleRepository.findAll();
        list.forEach(this::enrichScheduleSeatAvailability);
        return list;
    }

    public List<SafariSchedule> searchAvailableSchedules(String dateStr, String timeSlot) {
        LocalDate date = (dateStr != null && !dateStr.trim().isEmpty()) ? LocalDate.parse(dateStr.trim()) : null;
        String slot = (timeSlot != null && !timeSlot.trim().isEmpty() && !"ALL".equalsIgnoreCase(timeSlot.trim())) ? timeSlot.trim() : null;

        List<SafariSchedule> results;
        if (date != null && slot != null) {
            results = safariScheduleRepository.findByScheduleDateAndTimeSlotAndStatus(date, slot, "SCHEDULED");
        } else if (date != null) {
            results = safariScheduleRepository.findByScheduleDateAndStatus(date, "SCHEDULED");
        } else if (slot != null) {
            results = safariScheduleRepository.findByTimeSlotAndStatus(slot, "SCHEDULED");
        } else {
            results = safariScheduleRepository.findByStatus("SCHEDULED");
        }

        results.forEach(this::enrichScheduleSeatAvailability);
        return results;
    }
}
