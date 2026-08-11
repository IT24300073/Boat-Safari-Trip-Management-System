package SE.BOAT.SAFARI.Admin;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    private int totalBookings;
    private int totalPassengers;
    private int totalBoats;

    // You can add more summary fields as needed
}
