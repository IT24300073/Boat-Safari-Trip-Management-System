package SE.BOAT.SAFARI.Schedule;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/schedules")
public class SafariScheduleController {

    @Autowired
    private SafariScheduleService safariScheduleService;

    @GetMapping
    public List<SafariSchedule> getAllSchedules() {
        return safariScheduleService.getAllSchedules();
    }

    @GetMapping("/search")
    public List<SafariSchedule> searchSchedules(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String timeSlot) {
        return safariScheduleService.searchAvailableSchedules(date, timeSlot);
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody SafariSchedule schedule) {
        try {
            SafariSchedule created = safariScheduleService.createSchedule(schedule);
            return ResponseEntity.ok(created);
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage(), "conflict", true));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody SafariSchedule schedule) {
        try {
            SafariSchedule updated = safariScheduleService.updateSchedule(id, schedule);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", ex.getMessage(), "conflict", true));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<SafariSchedule> cancelSchedule(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String reason = payload.getOrDefault("reason", "Cancelled by Operations Manager");
        SafariSchedule cancelled = safariScheduleService.cancelSchedule(id, reason);
        return cancelled != null ? ResponseEntity.ok(cancelled) : ResponseEntity.notFound().build();
    }

    @GetMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam(defaultValue = "0") int boatId,
            @RequestParam(defaultValue = "") String guideName,
            @RequestParam String date,
            @RequestParam String timeSlot) {
        Map<String, Object> result = safariScheduleService.checkRealtimeAvailability(boatId, guideName, date, timeSlot);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        return safariScheduleService.deleteSchedule(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
