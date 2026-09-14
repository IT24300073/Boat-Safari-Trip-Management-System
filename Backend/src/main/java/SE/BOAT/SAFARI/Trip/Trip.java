package SE.BOAT.SAFARI.Trip;
import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // Shared, Private, Cabin

    @Column(name="adult_price", nullable = false)
    private Double adultPrice;

    @Column(name="child_price")
    private Double childPrice;


    @Column(name="starting_time", nullable = true)
    private String startingTime = "Managed in Schedule";

    @Column(nullable = false)
    private String duration = "2 Hours";

    private String description;
}
