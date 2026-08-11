package SE.BOAT.SAFARI.Invoice;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private int bookingId;  // must match Booking ID type
    private String customerName;
    private String customerEmail;
    private String boatName;
    private String tripName;
    private int adults;
    private int children;
    private double totalPrice;
    private LocalDateTime invoiceDate = LocalDateTime.now();
}
