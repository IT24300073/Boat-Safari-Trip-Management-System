package SE.BOAT.SAFARI.Maintenance;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class MaintenanceIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private int boatId;

    private String boatName;

    @Column(nullable = false)
    private String guideName;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, RESOLVED

    private LocalDateTime reportedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getBoatId() { return boatId; }
    public void setBoatId(int boatId) { this.boatId = boatId; }

    public String getBoatName() { return boatName; }
    public void setBoatName(String boatName) { this.boatName = boatName; }

    public String getGuideName() { return guideName; }
    public void setGuideName(String guideName) { this.guideName = guideName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime reportedAt) { this.reportedAt = reportedAt; }
}
