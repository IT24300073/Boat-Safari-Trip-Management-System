package SE.BOAT.SAFARI.Invoice;

import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class InvoiceService {

    @Autowired
    private BookingService bookingService;

    // Generate PDF dynamically
    public byte[] generateInvoicePdf(int bookingId) throws Exception {
        // Always get booking info
        Booking booking = bookingService.getBookingById(bookingId);

        String customerName = booking.getName();
        String customerEmail = booking.getEmail();
        String boatName = booking.getBoat() != null ? booking.getBoat().getName() : "N/A";
        String tripName = booking.getTrip() != null ? booking.getTrip().getName() : "N/A";
        double totalPrice = booking.getTotalPrice();

        // Generate PDF using iText 5
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);
        document.open();

        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);

        document.add(new Paragraph("Boat Safari Invoice", titleFont));
        document.add(new Paragraph("Invoice ID: " + bookingId));
        document.add(new Paragraph("Date: " + java.time.LocalDate.now()));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Customer Details", boldFont));
        document.add(new Paragraph("Name: " + customerName));
        document.add(new Paragraph("Email: " + customerEmail));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Booking Details", boldFont));
        document.add(new Paragraph("Boat: " + boatName));
        document.add(new Paragraph("Trip: " + tripName));
        document.add(new Paragraph("Total Price: LKR " + totalPrice));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Thank you for booking with Boat Safari!"));

        document.close();

        return baos.toByteArray();
    }
}
