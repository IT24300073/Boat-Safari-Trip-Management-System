package SE.BOAT.SAFARI.Maintenance;

import SE.BOAT.SAFARI.BoatManagement.Boat;
import SE.BOAT.SAFARI.BoatManagement.BoatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceService {

    @Autowired
    private MaintenanceIssueRepository maintenanceIssueRepository;

    @Autowired
    private BoatRepository boatRepository;

    // Report new maintenance issue and mark boat unavailable
    public MaintenanceIssue reportIssue(MaintenanceIssue issue) {
        Optional<Boat> boatOpt = boatRepository.findById(issue.getBoatId());
        if (boatOpt.isPresent()) {
            Boat boat = boatOpt.get();
            boat.setStatus("MAINTENANCE");
            boatRepository.save(boat);

            if (issue.getBoatName() == null || issue.getBoatName().isEmpty()) {
                issue.setBoatName(boat.getName());
            }
        }

        issue.setStatus("OPEN");
        issue.setReportedAt(LocalDateTime.now());
        return maintenanceIssueRepository.save(issue);
    }

    // Get all maintenance issues
    public List<MaintenanceIssue> getAllIssues() {
        return maintenanceIssueRepository.findAll();
    }

    // Resolve maintenance issue and restore boat availability
    public MaintenanceIssue resolveIssue(Long issueId) {
        Optional<MaintenanceIssue> issueOpt = maintenanceIssueRepository.findById(issueId);
        if (issueOpt.isPresent()) {
            MaintenanceIssue issue = issueOpt.get();
            issue.setStatus("RESOLVED");
            MaintenanceIssue savedIssue = maintenanceIssueRepository.save(issue);

            // Check if boat has any other open maintenance issues before marking AVAILABLE
            List<MaintenanceIssue> openIssues = maintenanceIssueRepository.findByBoatId(issue.getBoatId())
                    .stream()
                    .filter(i -> "OPEN".equalsIgnoreCase(i.getStatus()))
                    .toList();

            if (openIssues.isEmpty()) {
                Optional<Boat> boatOpt = boatRepository.findById(issue.getBoatId());
                if (boatOpt.isPresent()) {
                    Boat boat = boatOpt.get();
                    boat.setStatus("AVAILABLE");
                    boatRepository.save(boat);
                }
            }

            return savedIssue;
        }
        return null;
    }

    // Delete maintenance issue record
    public boolean deleteIssue(Long id) {
        if (maintenanceIssueRepository.existsById(id)) {
            maintenanceIssueRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
