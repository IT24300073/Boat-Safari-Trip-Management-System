package SE.BOAT.SAFARI.Report;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport() {
        Report report = reportService.generateAndSaveReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "month") String period) {
        Map<String, Object> analytics = reportService.getPerformanceAnalytics(startDate, endDate, period);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<Map<String, Object>> getReconciliation(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "ALL") String paymentMethod) {
        Map<String, Object> reconciliation = reportService.getPaymentReconciliation(startDate, endDate, paymentMethod);
        return ResponseEntity.ok(reconciliation);
    }

    @GetMapping("/reconciliation/csv")
    public ResponseEntity<byte[]> downloadReconciliationCsv(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false, defaultValue = "ALL") String paymentMethod) {
        byte[] csvBytes = reportService.generateReconciliationCsv(startDate, endDate, paymentMethod);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"payment_reconciliation.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
