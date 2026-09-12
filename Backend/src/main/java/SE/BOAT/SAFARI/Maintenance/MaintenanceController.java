package SE.BOAT.SAFARI.Maintenance;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    @GetMapping
    public List<MaintenanceIssue> getAllIssues() {
        return maintenanceService.getAllIssues();
    }

    @PostMapping
    public ResponseEntity<MaintenanceIssue> reportIssue(@RequestBody MaintenanceIssue issue) {
        MaintenanceIssue savedIssue = maintenanceService.reportIssue(issue);
        return ResponseEntity.ok(savedIssue);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<MaintenanceIssue> resolveIssue(@PathVariable Long id) {
        MaintenanceIssue resolvedIssue = maintenanceService.resolveIssue(id);
        return resolvedIssue != null ? ResponseEntity.ok(resolvedIssue) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long id) {
        return maintenanceService.deleteIssue(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
