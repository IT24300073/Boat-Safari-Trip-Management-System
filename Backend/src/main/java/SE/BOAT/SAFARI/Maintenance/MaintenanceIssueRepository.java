package SE.BOAT.SAFARI.Maintenance;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceIssueRepository extends JpaRepository<MaintenanceIssue, Long> {
    List<MaintenanceIssue> findByBoatId(int boatId);
    List<MaintenanceIssue> findByStatus(String status);
}
