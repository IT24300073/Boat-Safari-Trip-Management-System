package SE.BOAT.SAFARI.Maintenance;

import SE.BOAT.SAFARI.BoatManagement.Boat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/fleet-summary")
    public ResponseEntity<List<Map<String, Object>>> getFleetSummary() {
        List<Map<String, Object>> summary = maintenanceService.getFleetMaintenanceSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/boat/{boatId}/history")
    public ResponseEntity<Map<String, Object>> getBoatHistory(@PathVariable int boatId) {
        Map<String, Object> history = maintenanceService.getBoatMaintenanceHistory(boatId);
        return history != null ? ResponseEntity.ok(history) : ResponseEntity.notFound().build();
    }

    @PutMapping("/boat/{boatId}/decommission")
    public ResponseEntity<Boat> decommissionBoat(
            @PathVariable int boatId,
            @RequestBody(required = false) Map<String, String> payload) {
        String reason = payload != null ? payload.get("reason") : "Decommissioned by Fleet Administrator";
        Boat boat = maintenanceService.decommissionBoat(boatId, reason);
        return boat != null ? ResponseEntity.ok(boat) : ResponseEntity.notFound().build();
    }

    @PutMapping("/boat/{boatId}/restore")
    public ResponseEntity<Boat> restoreBoat(@PathVariable int boatId) {
        Boat boat = maintenanceService.restoreBoat(boatId);
        return boat != null ? ResponseEntity.ok(boat) : ResponseEntity.notFound().build();
    }
}
