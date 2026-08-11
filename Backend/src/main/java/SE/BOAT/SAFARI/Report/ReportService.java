package SE.BOAT.SAFARI.Report;




import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Report generateAndSaveReport() {
        List<Booking> bookings = bookingRepository.findAll();

        int totalBookings = bookings.size();
        int totalAdults = bookings.stream().mapToInt(Booking::getAdults).sum();
        int totalChildren = bookings.stream().mapToInt(Booking::getChildren).sum();
        double totalRevenue = bookings.stream().mapToDouble(Booking::getTotalPrice).sum();

        Report report = new Report(totalBookings, totalAdults, totalChildren, totalRevenue);
        return reportRepository.save(report);
    }
}
