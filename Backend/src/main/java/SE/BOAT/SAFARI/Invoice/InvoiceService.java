package SE.BOAT.SAFARI.Invoice;

import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BookingService bookingService;

    // Fetch invoice from DB or throw exception
    public Invoice getInvoiceByBookingId(int bookingId) {
        return invoiceRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for booking " + bookingId));
    }

    // Generate PDF dynamically
    public byte[] generateInvoicePdf(int bookingId) throws Exception {
        // Try to get invoice from DB
        Optional<Invoice> invoiceOpt = invoiceRepository.findByBookingId(bookingId);

        // Always get booking info
        Booking booking = bookingService.getBookingById(bookingId);

        // Use DB invoice if exists, else create temporary one from booking
        Invoice invoice = invoiceOpt.orElseGet(() -> {
            Invoice temp = new Invoice();
            temp.setBookingId(booking.getId());
            temp.setCustomerName(booking.getName());
            temp.setCustomerEmail(booking.getEmail());
            temp.setBoatName(booking.getBoat() != null ? booking.getBoat().getName() : "N/A");
            temp.setTripName(booking.getTrip() != null ? booking.getTrip().getName() : "N/A");
            temp.setTotalPrice(booking.getTotalPrice());
            return temp;
        });

        // Generate PDF using iText 5
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, baos);
        document.open();

        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);

        document.add(new Paragraph("Boat Safari Invoice", titleFont));
        document.add(new Paragraph("Invoice ID: " + invoice.getBookingId()));
        document.add(new Paragraph("Date: " + java.time.LocalDate.now()));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Customer Details", boldFont));
        document.add(new Paragraph("Name: " + invoice.getCustomerName()));
        document.add(new Paragraph("Email: " + invoice.getCustomerEmail()));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Booking Details", boldFont));
        document.add(new Paragraph("Boat: " + invoice.getBoatName()));
        document.add(new Paragraph("Trip: " + invoice.getTripName()));
        document.add(new Paragraph("Total Price: LKR " + invoice.getTotalPrice()));
        document.add(Chunk.NEWLINE);

        document.add(new Paragraph("Thank you for booking with Boat Safari!"));

        document.close();

        return baos.toByteArray();
    }
}
