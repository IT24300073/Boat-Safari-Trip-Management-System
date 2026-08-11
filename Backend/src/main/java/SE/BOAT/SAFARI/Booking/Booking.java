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
}
