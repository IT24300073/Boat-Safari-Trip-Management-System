package SE.BOAT.SAFARI.Notification;

import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingRepository;
import SE.BOAT.SAFARI.Schedule.SafariSchedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // Automatically notify all tourists whose bookings match a changed/cancelled schedule
    public void notifyAffectedTourists(SafariSchedule schedule, String changeType, String details) {
        if (schedule == null || schedule.getScheduleDate() == null) return;

        List<Booking> allBookings = bookingRepository.findAll();

        for (Booking b : allBookings) {
            boolean matchesScheduleId = b.getScheduleId() != null && b.getScheduleId().equals(schedule.getId());
            boolean matchesDate = b.getSafariDate() != null && schedule.getScheduleDate().equals(b.getSafariDate());
            boolean matchesSlot = schedule.getTimeSlot() == null || b.getTimeSlot() == null ||
                    schedule.getTimeSlot().trim().equalsIgnoreCase(b.getTimeSlot().trim());
            boolean matchesBoat = b.getBoat() != null && b.getBoat().getId() == schedule.getBoatId();
            boolean matchesTrip = b.getTrip() != null && schedule.getTripName() != null &&
                    b.getTrip().getName().equalsIgnoreCase(schedule.getTripName());

            boolean isAffected = matchesScheduleId || (matchesDate && matchesSlot && (matchesBoat || matchesTrip));

            if (isAffected && b.getEmail() != null && !b.getEmail().trim().isEmpty()) {
                Notification n = new Notification();
                n.setRecipientEmail(b.getEmail().trim());
                n.setRecipientName(b.getName());
                n.setType(changeType);

                if ("SCHEDULE_CANCELLED".equalsIgnoreCase(changeType)) {
                    n.setTitle("⚠️ Safari Schedule Cancelled Alert");
                    n.setMessage(String.format(
                            "Dear %s, your booked safari '%s' scheduled for %s (%s) has been CANCELLED due to: %s. Please contact support or reschedule.",
                            b.getName(), schedule.getTripName(), schedule.getScheduleDate(), schedule.getTimeSlot(), details
                    ));
                } else {
                    n.setTitle("📅 Safari Schedule Update Notification");
                    n.setMessage(String.format(
                            "Dear %s, your booked safari '%s' on %s has been updated. Assigned Boat: %s | Guide: %s | Time Slot: %s.",
                            b.getName(), schedule.getTripName(), schedule.getScheduleDate(), schedule.getBoatName(), schedule.getGuideName(), schedule.getTimeSlot()
                    ));
                }

                n.setRead(false);
                n.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        }
    }

    public void notifyBookingStatusChange(Booking booking, String status) {
        if (booking == null || booking.getEmail() == null || booking.getEmail().trim().isEmpty()) return;

        Notification n = new Notification();
        n.setRecipientEmail(booking.getEmail().trim());
        n.setRecipientName(booking.getName());
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            n.setType("BOOKING_APPROVED");
            n.setTitle("✅ Group Booking Approved!");
            n.setMessage(String.format(
                    "Dear %s, great news! Your group booking for %d passengers on %s has been APPROVED. Your safari is confirmed.",
                    booking.getName(), booking.getPassengers(), booking.getSafariDate()
            ));
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            n.setType("BOOKING_REJECTED");
            n.setTitle("❌ Group Booking Rejected");
            n.setMessage(String.format(
                    "Dear %s, unfortunately your group booking on %s could not be accommodated and was rejected by Operations.",
                    booking.getName(), booking.getSafariDate()
            ));
        } else {
            return;
        }
        
        notificationRepository.save(n);
    }

    public List<Notification> getNotificationsForUser(String email) {
        return notificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(email);
    }

    public List<Notification> getUnreadNotificationsForUser(String email) {
        return notificationRepository.findByRecipientEmailIgnoreCaseAndIsReadFalse(email);
    }

    public boolean markAsRead(Long notificationId) {
        Optional<Notification> nOpt = notificationRepository.findById(notificationId);
        if (nOpt.isPresent()) {
            Notification n = nOpt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }
        return false;
    }

    public void markAllAsRead(String email) {
        List<Notification> unread = notificationRepository.findByRecipientEmailIgnoreCaseAndIsReadFalse(email);
        for (Notification n : unread) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }
}
