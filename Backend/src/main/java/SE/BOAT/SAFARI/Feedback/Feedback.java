package SE.BOAT.SAFARI.Feedback;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Column(nullable = false)
    private String name; // user name

    @Column(nullable = false)
    private String email; // user email

    @Column(nullable = false, length = 1000)
    private String message; // feedback message

    @Column(nullable = false)
    private int rating; // rating (1-5 stars)

    @Column(nullable = false)
    private boolean flagged = false; // automatically flagged if rating <= 3

    @Column(nullable = true)
    private String flagReason; // e.g. "Low Rating Alert (<= 3 Stars)"

    @Column(nullable = false)
    private boolean reviewed = false; // whether admin has reviewed/resolved the alert
}
