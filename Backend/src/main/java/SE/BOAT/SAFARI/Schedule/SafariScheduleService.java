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
        if (schedule.getId() != null) {
            List<SE.BOAT.SAFARI.Booking.Booking> bookingsBySchedule = bookingRepository.findByScheduleId(schedule.getId());
            if (!bookingsBySchedule.isEmpty()) {
                bookedSeats = bookingsBySchedule.stream()
                        .mapToInt(b -> b.getPassengers() > 0 ? b.getPassengers() : (b.getAdults() + b.getChildren()))
                        .sum();
            }
        }

        // If no bookings found by direct scheduleId, check by boatId, scheduleDate, and timeSlot
        if (bookedSeats == 0 && schedule.getBoatId() > 0 && schedule.getScheduleDate() != null) {
            List<SE.BOAT.SAFARI.Booking.Booking> bookings;
            if (schedule.getTimeSlot() != null && !schedule.getTimeSlot().trim().isEmpty()) {
                bookings = bookingRepository.findByBoatIdAndSafariDateAndTimeSlot(
                        schedule.getBoatId(), schedule.getScheduleDate(), schedule.getTimeSlot().trim()
                );
            } else {
                bookings = bookingRepository.findByBoatIdAndSafariDate(
                        schedule.getBoatId(), schedule.getScheduleDate()
                );
            }

            bookedSeats = bookings.stream()
                    .filter(b -> schedule.getTripName() == null
                            || b.getTrip() == null
                            || b.getTrip().getName() == null
                            || b.getTrip().getName().trim().equalsIgnoreCase(schedule.getTripName().trim()))
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

    @Autowired
    private SE.BOAT.SAFARI.Trip.TripRepository tripRepository;

    public List<SafariSchedule> getAllSchedules() {
        List<SafariSchedule> list = safariScheduleRepository.findAll();
        list.forEach(this::enrichScheduleSeatAvailability);
        return list;
    }

    private String formatTripTimeSlot(String startingTime, String duration) {
        if (startingTime == null || startingTime.trim().isEmpty()) {
            return "Flexible Departure";
        }
        if (startingTime.contains("AM") || startingTime.contains("PM") || startingTime.contains("-")) {
            return startingTime;
        }
        try {
            String[] parts = startingTime.trim().split(":");
            int hour = Integer.parseInt(parts[0]);
            int min = Integer.parseInt(parts[1]);

            int durMinutes = 120;
            if (duration != null) {
                String dLower = duration.toLowerCase();
                if (dLower.contains("3.5")) durMinutes = 210;
                else if (dLower.contains("2.5")) durMinutes = 150;
                else if (dLower.contains("1.5")) durMinutes = 90;
                else if (dLower.contains("3")) durMinutes = 180;
                else if (dLower.contains("1")) durMinutes = 60;
            }

            int endMinutesTotal = hour * 60 + min + durMinutes;
            int endHour = (endMinutesTotal / 60) % 24;
            int endMin = endMinutesTotal % 60;

            String startFormatted = String.format("%02d:%02d %s", (hour == 0 || hour == 12) ? 12 : hour % 12, min, hour >= 12 ? "PM" : "AM");
            String endFormatted = String.format("%02d:%02d %s", (endHour == 0 || endHour == 12) ? 12 : endHour % 12, endMin, endHour >= 12 ? "PM" : "AM");
            return startFormatted + " - " + endFormatted;
        } catch (Exception e) {
            return startingTime + (duration != null ? " (" + duration + ")" : "");
        }
    }

    private boolean matchesTimeFilter(String slotText, String filter) {
        if (filter == null || filter.trim().isEmpty() || "ALL".equalsIgnoreCase(filter)) {
            return true;
        }
        if (slotText == null) return false;
        String s = slotText.trim().toUpperCase();
        String f = filter.trim().toUpperCase();

        // Extract start time part (before the hyphen if present)
        String startTimePart = s;
        if (s.contains("-")) {
            startTimePart = s.split("-")[0].trim();
        }

        // Parse hour in 24-hour format
        int hour24 = -1;
        try {
            String timeOnly = startTimePart.replaceAll("[^0-9:]", "");
            if (timeOnly.contains(":")) {
                int h = Integer.parseInt(timeOnly.split(":")[0]);
                if (startTimePart.contains("PM") && h < 12) {
                    h += 12;
                } else if (startTimePart.contains("AM") && h == 12) {
                    h = 0;
                }
                hour24 = h;
            }
        } catch (Exception ignored) {}

        if (f.equals("MORNING") || f.contains("MORNING") || f.contains("08:00")) {
            if (hour24 >= 0) return hour24 >= 5 && hour24 < 11;
            return startTimePart.contains("AM");
        }
        if (f.equals("MIDDAY") || f.contains("MIDDAY") || f.contains("11:00")) {
            if (hour24 >= 0) return hour24 >= 11 && hour24 < 14;
            return startTimePart.contains("11:") || startTimePart.contains("12:") || startTimePart.contains("01:00 PM");
        }
        if (f.equals("AFTERNOON") || f.contains("AFTERNOON") || f.contains("02:00")) {
            if (hour24 >= 0) return hour24 >= 14 && hour24 < 16;
            return startTimePart.contains("02:") || startTimePart.contains("03:00") || startTimePart.contains("01:00 PM");
        }
        if (f.equals("SUNSET") || f.contains("SUNSET") || f.contains("04:30") || f.contains("03:30")) {
            if (hour24 >= 0) return hour24 >= 16 && hour24 < 19;
            return startTimePart.contains("04:") || startTimePart.contains("05:") || startTimePart.contains("03:30");
        }
        if (f.equals("NIGHT") || f.contains("NIGHT") || f.contains("07:00")) {
            if (hour24 >= 0) return hour24 >= 19 || hour24 < 5;
            return startTimePart.contains("07:") || startTimePart.contains("08:") || startTimePart.contains("09:") || startTimePart.contains("10:");
        }

        return s.contains(f);
    }

    public List<SafariSchedule> searchAvailableSchedules(String dateStr, String timeSlot) {
        LocalDate date = (dateStr != null && !dateStr.trim().isEmpty()) ? LocalDate.parse(dateStr.trim()) : LocalDate.now();
        String slot = (timeSlot != null && !timeSlot.trim().isEmpty() && !"ALL".equalsIgnoreCase(timeSlot.trim())) ? timeSlot.trim() : null;

        List<SafariSchedule> dbSchedules;
        if (date != null) {
            dbSchedules = safariScheduleRepository.findByScheduleDateAndStatus(date, "SCHEDULED");
        } else {
            dbSchedules = safariScheduleRepository.findByStatus("SCHEDULED");
        }

        List<SafariSchedule> combined = new java.util.ArrayList<>(dbSchedules);

        // Ensure all active safari packages are available on the selected date
        if (date != null) {
            List<SE.BOAT.SAFARI.Trip.Trip> allTrips = tripRepository.findAll();
            List<Boat> allBoats = boatRepository.findAll().stream()
                    .filter(b -> !"MAINTENANCE".equalsIgnoreCase(b.getStatus()) && !"UNAVAILABLE".equalsIgnoreCase(b.getStatus()))
                    .toList();

            List<SE.BOAT.SAFARI.Booking.Booking> bookingsOnDate = bookingRepository.findAll().stream()
                    .filter(b -> date.equals(b.getSafariDate()))
                    .toList();

            java.util.Set<Integer> allocatedBoatIds = new java.util.HashSet<>();
            for (SafariSchedule s : dbSchedules) {
                if (s.getBoatId() > 0) allocatedBoatIds.add(s.getBoatId());
            }

            String[] guides = {"Captain Fernando", "Captain Nimal", "Captain Sunimal", "Captain Perera", "Captain Silva"};
            long virtualIdCounter = -1000;

            for (int i = 0; i < allTrips.size(); i++) {
                SE.BOAT.SAFARI.Trip.Trip trip = allTrips.get(i);
                boolean alreadyScheduled = combined.stream()
                        .anyMatch(s -> s.getTripName() != null && s.getTripName().equalsIgnoreCase(trip.getName()));

                if (!alreadyScheduled) {
                    // Check if this trip already has active bookings on this date
                    List<SE.BOAT.SAFARI.Booking.Booking> tripBookings = bookingsOnDate.stream()
                            .filter(b -> b.getTrip() != null && (
                                    b.getTrip().getId().equals(trip.getId()) ||
                                    (b.getTrip().getName() != null && b.getTrip().getName().equalsIgnoreCase(trip.getName()))
                            ))
                            .toList();

                    // Group tripBookings by boat if any
                    java.util.Map<Integer, List<SE.BOAT.SAFARI.Booking.Booking>> bookingsByBoat = tripBookings.stream()
                            .filter(b -> b.getBoat() != null)
                            .collect(java.util.stream.Collectors.groupingBy(b -> b.getBoat().getId()));

                    if (!bookingsByBoat.isEmpty()) {
                        for (java.util.Map.Entry<Integer, List<SE.BOAT.SAFARI.Booking.Booking>> entry : bookingsByBoat.entrySet()) {
                            Boat bookedBoat = entry.getValue().get(0).getBoat();
                            allocatedBoatIds.add(bookedBoat.getId());

                            String guide = guides[i % guides.length];
                            SafariSchedule virtualSlot = new SafariSchedule();
                            virtualSlot.setId(virtualIdCounter--);
                            virtualSlot.setTripName(trip.getName());
                            virtualSlot.setScheduleDate(date);
                            virtualSlot.setTimeSlot(formatTripTimeSlot(trip.getStartingTime(), trip.getDuration()));
                            virtualSlot.setBoatId(bookedBoat.getId());
                            virtualSlot.setBoatName(bookedBoat.getName());
                            virtualSlot.setTotalCapacity(bookedBoat.getCapacity());
                            virtualSlot.setGuideName(guide);
                            virtualSlot.setStatus("SCHEDULED");
                            combined.add(virtualSlot);
                        }
                    } else {
                        // Trip has no bookings yet today: assign an available unallocated boat
                        Boat assignedBoat = allBoats.stream()
                                .filter(b -> !allocatedBoatIds.contains(b.getId()))
                                .findFirst()
                                .orElse(allBoats.isEmpty() ? null : allBoats.get(i % allBoats.size()));

                        if (assignedBoat != null) {
                            allocatedBoatIds.add(assignedBoat.getId());
                        }

                        String guide = guides[i % guides.length];
                        SafariSchedule virtualSlot = new SafariSchedule();
                        virtualSlot.setId(virtualIdCounter--);
                        virtualSlot.setTripName(trip.getName());
                        virtualSlot.setScheduleDate(date);
                        virtualSlot.setTimeSlot(formatTripTimeSlot(trip.getStartingTime(), trip.getDuration()));

                        if (assignedBoat != null) {
                            virtualSlot.setBoatId(assignedBoat.getId());
                            virtualSlot.setBoatName(assignedBoat.getName());
                            virtualSlot.setTotalCapacity(assignedBoat.getCapacity());
                        } else {
                            virtualSlot.setBoatId(1);
                            virtualSlot.setBoatName("Aloka Fleet Boat");
                            virtualSlot.setTotalCapacity(10);
                        }
                        virtualSlot.setGuideName(guide);
                        virtualSlot.setStatus("SCHEDULED");
                        combined.add(virtualSlot);
                    }
                }
            }
        }

        // Apply timeSlot filter if specified
        List<SafariSchedule> filtered = combined.stream()
                .filter(s -> matchesTimeFilter(s.getTimeSlot(), slot))
                .toList();

        filtered.forEach(this::enrichScheduleSeatAvailability);
        return filtered;
    }
}
