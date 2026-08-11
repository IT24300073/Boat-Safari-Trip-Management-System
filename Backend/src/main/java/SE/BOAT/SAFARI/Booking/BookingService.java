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

    public Booking saveBooking(Booking booking) {
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

    public Booking getBookingById(int id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public Booking updateBooking(int id, Booking booking) {
        return bookingRepository.findById(id)
                .map(existing -> {
                    existing.setName(booking.getName());
                    existing.setEmail(booking.getEmail());
                    existing.setSafariDate(booking.getSafariDate());
                    existing.setPassengers(booking.getPassengers());
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
