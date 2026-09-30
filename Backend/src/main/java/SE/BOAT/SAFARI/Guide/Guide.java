package SE.BOAT.SAFARI.Guide;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "guides")
@Data
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private String qualification; // e.g. "Certified Master Captain & River Safari Naturalist"

    @Column(nullable = false)
    private String certifiedBoatTypes; // e.g. "Standard, Luxury, Speed Boat"

    @Column(nullable = false)
    private int experienceYears = 5;

    private String contactPhone;

    private double rating = 5.0;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, ON_DUTY, LEAVE

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getCertifiedBoatTypes() { return certifiedBoatTypes; }
    public void setCertifiedBoatTypes(String certifiedBoatTypes) { this.certifiedBoatTypes = certifiedBoatTypes; }

    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
