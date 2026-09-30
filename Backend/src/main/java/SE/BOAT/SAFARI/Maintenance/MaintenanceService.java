package SE.BOAT.SAFARI.Maintenance;

import SE.BOAT.SAFARI.BoatManagement.Boat;
import SE.BOAT.SAFARI.BoatManagement.BoatRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {

    @Autowired
    private MaintenanceIssueRepository maintenanceIssueRepository;

    @Autowired
    private BoatRepository boatRepository;

    @PostConstruct
    public void seedInitialMaintenanceHistory() {
        try {
            if (maintenanceIssueRepository.count() == 0) {
                List<Boat> boats = boatRepository.findAll();
                if (!boats.isEmpty()) {
                    List<MaintenanceIssue> seedList = new ArrayList<>();

                    Boat b1 = boats.get(0);
                    MaintenanceIssue m1 = new MaintenanceIssue();
                    m1.setBoatId(b1.getId());
                    m1.setBoatName(b1.getName());
                    m1.setGuideName("Captain Sunimal Fernando");
                    m1.setDescription("Routine oil change, fuel line flush, and safety vest inspection.");
                    m1.setSeverity("LOW");
                    m1.setStatus("RESOLVED");
                    m1.setReportedAt(LocalDateTime.now().minusDays(25));
                    seedList.add(m1);

                    MaintenanceIssue m2 = new MaintenanceIssue();
                    m2.setBoatId(b1.getId());
                    m2.setBoatName(b1.getName());
                    m2.setGuideName("Captain Sunimal Fernando");
                    m2.setDescription("Propeller blade nick repaired and engine cooling impeller serviced.");
                    m2.setSeverity("MEDIUM");
                    m2.setStatus("RESOLVED");
                    m2.setReportedAt(LocalDateTime.now().minusDays(10));
                    seedList.add(m2);

                    if (boats.size() > 1) {
                        Boat b2 = boats.get(1);
                        MaintenanceIssue m3 = new MaintenanceIssue();
                        m3.setBoatId(b2.getId());
                        m3.setBoatName(b2.getName());
                        m3.setGuideName("Captain Nimal Perera");
                        m3.setDescription("High vibration at cruising RPM. Bilge pump electrical relay replaced.");
                        m3.setSeverity("HIGH");
                        m3.setStatus("RESOLVED");
                        m3.setReportedAt(LocalDateTime.now().minusDays(18));
                        seedList.add(m3);

                        MaintenanceIssue m4 = new MaintenanceIssue();
                        m4.setBoatId(b2.getId());
                        m4.setBoatName(b2.getName());
                        m4.setGuideName("Captain Rohan Fernando");
                        m4.setDescription("Port-side steering cable tightness inspected and calibrated.");
                        m4.setSeverity("LOW");
                        m4.setStatus("RESOLVED");
                        m4.setReportedAt(LocalDateTime.now().minusDays(5));
                        seedList.add(m4);
                    }

                    if (boats.size() > 2) {
                        Boat b3 = boats.get(2);
                        MaintenanceIssue m5 = new MaintenanceIssue();
                        m5.setBoatId(b3.getId());
                        m5.setBoatName(b3.getName());
                        m5.setGuideName("Captain Samantha Silva");
                        m5.setDescription("Severe hull delamination near transom and recurring engine cylinder overheat. High risk of water seepage.");
                        m5.setSeverity("CRITICAL");
                        m5.setStatus("RESOLVED");
                        m5.setReportedAt(LocalDateTime.now().minusDays(40));
                        seedList.add(m5);

                        MaintenanceIssue m6 = new MaintenanceIssue();
                        m6.setBoatId(b3.getId());
                        m6.setBoatName(b3.getName());
                        m6.setGuideName("Captain Samantha Silva");
                        m6.setDescription("Crack detected along lower hull stringer during post-voyage haul-out.");
                        m6.setSeverity("CRITICAL");
                        m6.setStatus("RESOLVED");
                        m6.setReportedAt(LocalDateTime.now().minusDays(14));
                        seedList.add(m6);

                        MaintenanceIssue m7 = new MaintenanceIssue();
                        m7.setBoatId(b3.getId());
                        m7.setBoatName(b3.getName());
                        m7.setGuideName("Captain Chaminda Dias");
                        m7.setDescription("Starter motor failure and heavy exhaust smoking during morning start.");
                        m7.setSeverity("HIGH");
                        m7.setStatus("RESOLVED");
                        m7.setReportedAt(LocalDateTime.now().minusDays(2));
                        seedList.add(m7);
                    }

                    maintenanceIssueRepository.saveAll(seedList);
                    System.out.println(">>> [MAINTENANCE] Seeded realistic maintenance history records.");
                }
            }
        } catch (Exception e) {
            System.err.println(">>> [MAINTENANCE SEED ERROR]: " + e.getMessage());
        }
    }

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
                    if (!"DECOMMISSIONED".equalsIgnoreCase(boat.getStatus())) {
                        boat.setStatus("AVAILABLE");
                        boatRepository.save(boat);
                    }
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

    // Comprehensive Maintenance History Report for a Single Boat
    public Map<String, Object> getBoatMaintenanceHistory(int boatId) {
        Optional<Boat> boatOpt = boatRepository.findById(boatId);
        if (boatOpt.isEmpty()) {
            return null;
        }
        Boat boat = boatOpt.get();
        List<MaintenanceIssue> issues = maintenanceIssueRepository.findByBoatId(boatId);
        issues.sort((a, b) -> {
            if (a.getReportedAt() == null || b.getReportedAt() == null) return 0;
            return b.getReportedAt().compareTo(a.getReportedAt());
        });

        return buildBoatMaintenanceProfile(boat, issues);
    }

    // Fleet Maintenance Summary Report for All Boats
    public List<Map<String, Object>> getFleetMaintenanceSummary() {
        List<Boat> boats = boatRepository.findAll();
        List<MaintenanceIssue> allIssues = maintenanceIssueRepository.findAll();

        Map<Integer, List<MaintenanceIssue>> issuesByBoat = allIssues.stream()
                .collect(Collectors.groupingBy(MaintenanceIssue::getBoatId));

        List<Map<String, Object>> fleetReports = new ArrayList<>();
        for (Boat boat : boats) {
            List<MaintenanceIssue> boatIssues = issuesByBoat.getOrDefault(boat.getId(), Collections.emptyList());
            boatIssues.sort((a, b) -> {
                if (a.getReportedAt() == null || b.getReportedAt() == null) return 0;
                return b.getReportedAt().compareTo(a.getReportedAt());
            });
            fleetReports.add(buildBoatMaintenanceProfile(boat, boatIssues));
        }
        return fleetReports;
    }

    private Map<String, Object> buildBoatMaintenanceProfile(Boat boat, List<MaintenanceIssue> issues) {
        int total = issues.size();
        long critical = issues.stream().filter(i -> "CRITICAL".equalsIgnoreCase(i.getSeverity())).count();
        long high = issues.stream().filter(i -> "HIGH".equalsIgnoreCase(i.getSeverity())).count();
        long medium = issues.stream().filter(i -> "MEDIUM".equalsIgnoreCase(i.getSeverity())).count();
        long low = issues.stream().filter(i -> "LOW".equalsIgnoreCase(i.getSeverity())).count();

        long openCount = issues.stream().filter(i -> "OPEN".equalsIgnoreCase(i.getStatus())).count();
        long resolvedCount = issues.stream().filter(i -> "RESOLVED".equalsIgnoreCase(i.getStatus())).count();

        // Calculate wear / decommission fatigue score (0 - 100)
        int fatigueScore = (int) Math.min(100, (critical * 35) + (high * 20) + (medium * 10) + (low * 5));

        String recommendationCode;
        String advisoryBadge;
        String advisoryText;

        if ("DECOMMISSIONED".equalsIgnoreCase(boat.getStatus())) {
            recommendationCode = "DECOMMISSIONED";
            advisoryBadge = "DECOMMISSIONED / RETIRED";
            advisoryText = "Vessel permanently retired from fleet operations due to accumulated structural wear or end-of-life status.";
        } else if (critical >= 2 || fatigueScore >= 70) {
            recommendationCode = "DECOMMISSION_CANDIDATE";
            advisoryBadge = "⚠️ DECOMMISSION CANDIDATE";
            advisoryText = "High structural or powertrain fatigue observed. Recurring critical failures present ongoing safety risks. Decommissioning survey and vessel retirement strongly advised.";
        } else if (high >= 2 || fatigueScore >= 45) {
            recommendationCode = "MAJOR_OVERHAUL";
            advisoryBadge = "🛠️ MAJOR OVERHAUL REQUIRED";
            advisoryText = "Elevated mechanical wear detected. Complete dockyard haul-out, hull recertification, and engine overhaul required before authorizing further safari voyages.";
        } else if (openCount > 0) {
            recommendationCode = "ACTIVE_REPAIR";
            advisoryBadge = "🔧 ACTIVE SHOP REPAIR";
            advisoryText = "Vessel has active maintenance tickets. Keep vessel offline until repairs are inspected and cleared.";
        } else if (total > 0) {
            recommendationCode = "MONITOR";
            advisoryBadge = "📋 ROUTINE MAINTENANCE CYCLE";
            advisoryText = "Vessel operating normally with minor historical issues. Maintain standard preventive inspection cadence.";
        } else {
            recommendationCode = "OPTIMAL";
            advisoryBadge = "✅ OPTIMAL / PRISTINE CONDITION";
            advisoryText = "Zero defect history recorded. Vessel is in excellent condition and cleared for maximum passenger voyages.";
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("boatId", boat.getId());
        profile.put("boatName", boat.getName());
        profile.put("boatType", boat.getBoatType());
        profile.put("capacity", boat.getCapacity());
        profile.put("status", boat.getStatus());
        profile.put("price", boat.getPrice());
        profile.put("totalIncidents", total);
        profile.put("criticalCount", critical);
        profile.put("highCount", high);
        profile.put("mediumCount", medium);
        profile.put("lowCount", low);
        profile.put("openCount", openCount);
        profile.put("resolvedCount", resolvedCount);
        profile.put("decommissionRiskScore", fatigueScore);
        profile.put("recommendationCode", recommendationCode);
        profile.put("advisoryBadge", advisoryBadge);
        profile.put("advisoryText", advisoryText);
        profile.put("issues", issues);

        return profile;
    }

    // Administrator action: Decommission Boat
    public Boat decommissionBoat(int boatId, String reason) {
        Optional<Boat> boatOpt = boatRepository.findById(boatId);
        if (boatOpt.isPresent()) {
            Boat boat = boatOpt.get();
            boat.setStatus("DECOMMISSIONED");
            Boat saved = boatRepository.save(boat);

            // Log a formal decommission record
            MaintenanceIssue decommissionLog = new MaintenanceIssue();
            decommissionLog.setBoatId(boat.getId());
            decommissionLog.setBoatName(boat.getName());
            decommissionLog.setGuideName("Fleet Operations Administrator");
            decommissionLog.setDescription("FORMAL FLEET DECOMMISSION: " + (reason != null && !reason.trim().isEmpty() ? reason.trim() : "Retired based on cumulative maintenance history audit."));
            decommissionLog.setSeverity("CRITICAL");
            decommissionLog.setStatus("RESOLVED");
            decommissionLog.setReportedAt(LocalDateTime.now());
            maintenanceIssueRepository.save(decommissionLog);

            return saved;
        }
        return null;
    }

    // Administrator action: Restore/Re-commission Boat
    public Boat restoreBoat(int boatId) {
        Optional<Boat> boatOpt = boatRepository.findById(boatId);
        if (boatOpt.isPresent()) {
            Boat boat = boatOpt.get();
            boat.setStatus("AVAILABLE");
            Boat saved = boatRepository.save(boat);

            MaintenanceIssue restoreLog = new MaintenanceIssue();
            restoreLog.setBoatId(boat.getId());
            restoreLog.setBoatName(boat.getName());
            restoreLog.setGuideName("Fleet Operations Administrator");
            restoreLog.setDescription("FLEET RE-COMMISSION: Vessel recertified and restored to active commercial safari service.");
            restoreLog.setSeverity("LOW");
            restoreLog.setStatus("RESOLVED");
            restoreLog.setReportedAt(LocalDateTime.now());
            maintenanceIssueRepository.save(restoreLog);

            return saved;
        }
        return null;
    }
}
