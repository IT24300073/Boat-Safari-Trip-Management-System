package SE.BOAT.SAFARI.Guide;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/guides")
public class GuideController {

    @Autowired
    private GuideService guideService;

    @GetMapping
    public List<Guide> getAllGuides() {
        return guideService.getAllGuides();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guide> getGuideById(@PathVariable Long id) {
        return guideService.getGuideById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Guide> createGuide(@RequestBody Guide guide) {
        Guide saved = guideService.saveGuide(guide);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Guide> updateGuide(@PathVariable Long id, @RequestBody Guide guide) {
        Guide updated = guideService.updateGuide(id, guide);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuide(@PathVariable Long id) {
        return guideService.deleteGuide(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/check-qualification")
    public ResponseEntity<Map<String, Object>> checkGuideQualification(
            @RequestParam(required = false) Long guideId,
            @RequestParam(required = false) String guideName,
            @RequestParam(required = false) String boatType) {

        List<Guide> all = guideService.getAllGuides();
        Optional<Guide> matched = Optional.empty();

        if (guideId != null) {
            matched = all.stream().filter(g -> g.getId().equals(guideId)).findFirst();
        } else if (guideName != null && !guideName.trim().isEmpty()) {
            matched = all.stream().filter(g -> g.getName().equalsIgnoreCase(guideName.trim())).findFirst();
        }

        Map<String, Object> res = new HashMap<>();
        if (matched.isPresent()) {
            Guide g = matched.get();
            boolean qualified = guideService.isGuideQualifiedForBoatType(g, boatType);
            res.put("found", true);
            res.put("guide", g);
            res.put("isQualified", qualified);
            res.put("licenseNumber", g.getLicenseNumber());
            res.put("qualification", g.getQualification());
            res.put("message", qualified
                    ? "Guide " + g.getName() + " is qualified & certified for " + (boatType != null ? boatType : "all boats")
                    : "Warning: Guide " + g.getName() + " is not formally certified for vessel type '" + boatType + "'. Recommended certifications: " + g.getCertifiedBoatTypes());
        } else {
            res.put("found", false);
            res.put("isQualified", false);
            res.put("message", "Operator not found in qualified guides registry.");
        }

        return ResponseEntity.ok(res);
    }
}
