package SE.BOAT.SAFARI.Booking;

import SE.BOAT.SAFARI.BoatManagement.Boat;
import SE.BOAT.SAFARI.Trip.Trip;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "safari_date")
    private LocalDate safariDate;

    @Column(name = "time_slot")
    private String timeSlot; // e.g. "08:00 AM - 10:00 AM"

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(nullable = false)
    private int passengers;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "boat_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Boat boat;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "trip_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Trip trip;


    @Column(nullable = false)
    private int adults;

    @Column(nullable = false)
    private int children;

    @Column(nullable = false)
    private double totalPrice;

    private String paymentMethod = "CARD"; // "CARD", "PAYPAL", "CASH"

    private String paymentStatus = "PAID_CONFIRMED"; // "PAID_CONFIRMED", "PENDING_CASH"

    private String transactionReference; // e.g. "TXN-847291039"

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }
}
