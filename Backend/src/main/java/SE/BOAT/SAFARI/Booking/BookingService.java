package SE.BOAT.SAFARI.Booking;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SE.BOAT.SAFARI.BoatManagement.BoatRepository boatRepository;

    @Autowired(required = false)
    private SE.BOAT.SAFARI.Schedule.SafariScheduleRepository safariScheduleRepository;

    public void validateAssignmentConflict(Booking booking, Integer excludeBookingId) {
        // 1. If linked to a SafariSchedule, verify schedule state and inherit date/slot
        if (booking.getScheduleId() != null && safariScheduleRepository != null) {
            java.util.Optional<SE.BOAT.SAFARI.Schedule.SafariSchedule> schedOpt = safariScheduleRepository.findById(booking.getScheduleId());
            if (schedOpt.isPresent()) {
                SE.BOAT.SAFARI.Schedule.SafariSchedule sched = schedOpt.get();
                if ("CANCELLED".equalsIgnoreCase(sched.getStatus())) {
                    throw new IllegalStateException("This expedition slot has been CANCELLED by Safari Operations: "
                            + (sched.getCancelReason() != null ? sched.getCancelReason() : "Adverse river/weather conditions"));
                }
                if (booking.getTimeSlot() == null || booking.getTimeSlot().trim().isEmpty()) {
                    booking.setTimeSlot(sched.getTimeSlot());
                }
                if (booking.getSafariDate() == null) {
                    booking.setSafariDate(sched.getScheduleDate());
                }
            }
        }

        if (booking.getBoat() == null) {
            return;
        }

        int boatId = booking.getBoat().getId();

        // 2. Verify Boat maintenance status
        SE.BOAT.SAFARI.BoatManagement.Boat boat = boatRepository.findById(boatId).orElse(booking.getBoat());
        if (boat != null && ("MAINTENANCE".equalsIgnoreCase(boat.getStatus()) || "UNAVAILABLE".equalsIgnoreCase(boat.getStatus()))) {
            throw new IllegalStateException("Selected boat '" + boat.getName() + "' is currently under maintenance / unavailable for trip assignment.");
        }

        // 3. Validate boat assignment and capacity per time slot on the safari date
        if (booking.getSafariDate() != null) {
            List<Booking> existingMatches;
            if (booking.getScheduleId() != null) {
                existingMatches = bookingRepository.findByScheduleId(booking.getScheduleId());
            } else if (booking.getTimeSlot() != null && !booking.getTimeSlot().trim().isEmpty()) {
                existingMatches = bookingRepository.findByBoatIdAndSafariDateAndTimeSlot(boatId, booking.getSafariDate(), booking.getTimeSlot().trim());
            } else {
                existingMatches = bookingRepository.findByBoatIdAndSafariDate(boatId, booking.getSafariDate());
            }

            int totalExistingPassengers = 0;

            for (Booking existing : existingMatches) {
                if (excludeBookingId == null || existing.getId() != excludeBookingId) {
                    // Prevent assigning the same boat to two different trips during the same time slot
                    if (existing.getTrip() != null && booking.getTrip() != null
                            && !existing.getTrip().getId().equals(booking.getTrip().getId())) {
                        String slotSuffix = booking.getTimeSlot() != null ? " (" + booking.getTimeSlot() + ")" : "";
                        throw new IllegalStateException("Assignment Conflict: Boat '" + (boat != null ? boat.getName() : "ID " + boatId)
                                + "' is already assigned to trip '" + existing.getTrip().getName() + "' on " + booking.getSafariDate() + slotSuffix + ".");
                    }

                    totalExistingPassengers += existing.getPassengers() > 0
                            ? existing.getPassengers()
                            : (existing.getAdults() + existing.getChildren());
                }
            }

            int newPassengers = booking.getPassengers() > 0
                    ? booking.getPassengers()
                    : (booking.getAdults() + booking.getChildren());

            int capacity = boat != null ? boat.getCapacity() : 10;
            if (totalExistingPassengers + newPassengers > capacity) {
                int remaining = Math.max(0, capacity - totalExistingPassengers);
                String slotInfo = booking.getTimeSlot() != null ? " for departure slot " + booking.getTimeSlot() : "";
                throw new IllegalStateException("Capacity Exceeded: Boat '" + (boat != null ? boat.getName() : "ID " + boatId)
                        + "' only has " + remaining + " seat(s) available on " + booking.getSafariDate() + slotInfo + " (attempted to reserve " + newPassengers + " seats).");
            }
        }
    }

    public Booking saveBooking(Booking booking) {
        validateAssignmentConflict(booking, null);

        if (booking.getPassengers() <= 0) {
            booking.setPassengers(booking.getAdults() + booking.getChildren());
        }

        if (booking.getTransactionReference() == null || booking.getTransactionReference().trim().isEmpty()) {
            booking.setTransactionReference("TXN-" + System.currentTimeMillis());
        }
        if (booking.getPaymentStatus() == null || booking.getPaymentStatus().trim().isEmpty()) {
            booking.setPaymentStatus("PAID_CONFIRMED");
        }

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookings(String name, String email, String date, String venueName) {
        // Build specification filters
        Specification<Booking> spec = null;

        if (name != null && !name.isEmpty()) spec = (spec == null ? nameEquals(name) : spec.and(nameEquals(name)));
        if (email != null && !email.isEmpty()) spec = (spec == null ? emailEquals(email) : spec.and(emailEquals(email)));
        if (date != null && !date.isEmpty()) spec = (spec == null ? dateEquals(date) : spec.and(dateEquals(date)));
        if (venueName != null && !venueName.isEmpty()) spec = (spec == null ? venueEquals(venueName) : spec.and(venueEquals(venueName)));

        // Fetch bookings with Boat and Trip eagerly
        List<Booking> bookings;
        if (spec == null) {
            bookings = bookingRepository.findAll(); // @EntityGraph in repo ensures Boat & Trip are fetched
        } else {
            bookings = bookingRepository.findAll(spec);
        }

        return bookings;
    }

    public List<Booking> getBookingsByUserEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return bookingRepository.findByEmailIgnoreCaseOrderBySafariDateDesc(email.trim());
    }

    public Booking getBookingById(int id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public Booking updateBooking(int id, Booking booking) {
        validateAssignmentConflict(booking, id);
        return bookingRepository.findById(id)
                .map(existing -> {
                    existing.setName(booking.getName());
                    existing.setEmail(booking.getEmail());
                    existing.setSafariDate(booking.getSafariDate());
                    int pass = booking.getPassengers() > 0 ? booking.getPassengers() : (booking.getAdults() + booking.getChildren());
                    existing.setPassengers(pass);
                    existing.setBoat(booking.getBoat());
                    existing.setTrip(booking.getTrip());
                    existing.setAdults(booking.getAdults());
                    existing.setChildren(booking.getChildren());
                    existing.setTotalPrice(booking.getTotalPrice());
                    return bookingRepository.save(existing);
                }).orElse(null);
    }

    public boolean deleteBooking(int id) {
        if (bookingRepository.existsById(id)) {
            bookingRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- Specification filters ---
    private Specification<Booking> nameEquals(String name) {
        return (root, query, builder) -> builder.equal(root.get("name"), name);
    }

    private Specification<Booking> emailEquals(String email) {
        return (root, query, builder) -> builder.equal(root.get("email"), email);
    }

    private Specification<Booking> dateEquals(String date) {
        LocalDate localDate = LocalDate.parse(date);
        return (root, query, builder) -> builder.equal(root.get("safariDate"), localDate);
    }

    private Specification<Booking> venueEquals(String venueName) {
        return (root, query, builder) -> builder.equal(root.get("boat").get("name"), venueName);
    }
}
