package SE.BOAT.SAFARI.Booking;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> saveBooking(@RequestBody Booking booking) {
        try {
            Booking saved = bookingService.saveBooking(booking);
            return ResponseEntity.ok(saved);
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage(), "conflict", true));
        }
    }

    @GetMapping
    public List<Booking> getBookings(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String venueName) {
        if (email != null && !email.trim().isEmpty() && name == null && date == null && venueName == null) {
            return bookingService.getBookingsByUserEmail(email);
        }
        return bookingService.getBookings(name, email, date, venueName);
    }

    @GetMapping("/user/{email}")
    public List<Booking> getBookingsByUserEmail(@PathVariable String email) {
        return bookingService.getBookingsByUserEmail(email);
    }

    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable int id) {
        return bookingService.getBookingById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable int id, @RequestBody Booking booking) {
        try {
            Booking updated = bookingService.updateBooking(id, booking);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage(), "conflict", true));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable int id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Cancelled by Staff / Operations";
        Booking cancelled = bookingService.cancelBooking(id, reason);
        return cancelled != null ? ResponseEntity.ok(cancelled) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable int id) {
        bookingService.deleteBooking(id);
    }
}
