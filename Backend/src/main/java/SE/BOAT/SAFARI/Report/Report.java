package SE.BOAT.SAFARI.Report;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int totalBookings;
    private int totalAdults;
    private int totalChildren;
    private double totalRevenue;

    private LocalDateTime generatedAt;

    public Report() {}

    public Report(int totalBookings, int totalAdults, int totalChildren, double totalRevenue) {
        this.totalBookings = totalBookings;
        this.totalAdults = totalAdults;
        this.totalChildren = totalChildren;
        this.totalRevenue = totalRevenue;
        this.generatedAt = LocalDateTime.now();
    }

    // Getters and Setters3

    public Long getId() { return id; }
    public int getTotalBookings() { return totalBookings; }
    public void setTotalBookings(int totalBookings) { this.totalBookings = totalBookings; }
    public int getTotalAdults() { return totalAdults; }
    public void setTotalAdults(int totalAdults) { this.totalAdults = totalAdults; }
    public int getTotalChildren() { return totalChildren; }
    public void setTotalChildren(int totalChildren) { this.totalChildren = totalChildren; }
    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
