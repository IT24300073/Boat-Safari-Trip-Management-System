package SE.BOAT.SAFARI.Guide;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GuideRepository extends JpaRepository<Guide, Long> {
    Optional<Guide> findByNameIgnoreCase(String name);
    Optional<Guide> findByLicenseNumberIgnoreCase(String licenseNumber);
    List<Guide> findByStatus(String status);
}
