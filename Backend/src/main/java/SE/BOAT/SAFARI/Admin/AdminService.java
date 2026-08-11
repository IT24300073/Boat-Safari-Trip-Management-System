package SE.BOAT.SAFARI.Admin;

import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingService;
import SE.BOAT.SAFARI.BoatManagement.Boat;
import SE.BOAT.SAFARI.BoatManagement.BoatService;
import SE.BOAT.SAFARI.Registration.User;
import SE.BOAT.SAFARI.Registration.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    @Autowired private BookingService bookingService;
    @Autowired private BoatService boatService;
    @Autowired private UserService userService;

    public AdminData getAdminDashboardData() {
        List<Booking> bookings = bookingService.getBookings(null, null, null, null);
        List<Boat> boats = boatService.getBoats();
        List<User> users = userService.getUsers();

        return new AdminData(bookings, boats, users);
    }

    public static class AdminData {
        private List<Booking> bookings;
        private List<Boat> boats;
        private List<User> users;

        public AdminData(List<Booking> bookings, List<Boat> boats,
                         List<User> users) {
            this.bookings = bookings;
            this.boats = boats;
            this.users = users;
        }

        public List<Booking> getBookings() { return bookings; }
        public List<Boat> getBoats() { return boats; }
        public List<User> getUsers() { return users; }
    }
}
