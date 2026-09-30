package SE.BOAT.SAFARI.Guide;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GuideService {

    @Autowired
    private GuideRepository guideRepository;

    @PostConstruct
    public void seedDefaultGuides() {
        try {
            if (guideRepository.count() == 0) {
                List<Guide> defaultGuides = new ArrayList<>();

                Guide g1 = new Guide();
                g1.setName("Captain Sunimal Fernando");
                g1.setLicenseNumber("SL-NAV-4401");
                g1.setQualification("Master Boat Captain & River Safari Naturalist");
                g1.setCertifiedBoatTypes("Standard, Luxury, Speed Boat");
                g1.setExperienceYears(10);
                g1.setContactPhone("+94 77 123 4567");
                g1.setRating(4.9);
                g1.setStatus("ACTIVE");
                defaultGuides.add(g1);

                Guide g2 = new Guide();
                g2.setName("Captain Nimal Perera");
                g2.setLicenseNumber("SL-NAV-3912");
                g2.setQualification("Senior Marine Operator & First Aid Specialist");
                g2.setCertifiedBoatTypes("Standard, Speed Boat, Fishing");
                g2.setExperienceYears(8);
                g2.setContactPhone("+94 71 987 6543");
                g2.setRating(4.8);
                g2.setStatus("ACTIVE");
                defaultGuides.add(g2);

                Guide g3 = new Guide();
                g3.setName("Captain Samantha Silva");
                g3.setLicenseNumber("SL-NAV-5102");
                g3.setQualification("Luxury Eco-Tour Guide & Bird Watching Expert");
                g3.setCertifiedBoatTypes("Luxury, Standard, Pontoon");
                g3.setExperienceYears(6);
                g3.setContactPhone("+94 76 555 1234");
                g3.setRating(4.9);
                g3.setStatus("ACTIVE");
                defaultGuides.add(g3);

                Guide g4 = new Guide();
                g4.setName("Captain Rohan Fernando");
                g4.setLicenseNumber("SL-NAV-2890");
                g4.setQualification("Offshore Navigation & High-Speed Vessel Commander");
                g4.setCertifiedBoatTypes("Speed Boat, Luxury, Standard");
                g4.setExperienceYears(12);
                g4.setContactPhone("+94 72 333 4455");
                g4.setRating(5.0);
                g4.setStatus("ACTIVE");
                defaultGuides.add(g4);

                Guide g5 = new Guide();
                g5.setName("Captain Chaminda Dias");
                g5.setLicenseNumber("SL-NAV-6014");
                g5.setQualification("Certified Estuary Pilot & Wildlife Conservationist");
                g5.setCertifiedBoatTypes("Standard, Luxury");
                g5.setExperienceYears(5);
                g5.setContactPhone("+94 78 444 8899");
                g5.setRating(4.7);
                g5.setStatus("ACTIVE");
                defaultGuides.add(g5);

                guideRepository.saveAll(defaultGuides);
                System.out.println(">>> [GUIDES] Default qualified safari guides seeded successfully!");
            }
        } catch (Exception e) {
            System.err.println(">>> [GUIDES SEED ERROR]: " + e.getMessage());
        }
    }

    public List<Guide> getAllGuides() {
        return guideRepository.findAll();
    }

    public Optional<Guide> getGuideById(Long id) {
        return guideRepository.findById(id);
    }

    public Guide saveGuide(Guide guide) {
        return guideRepository.save(guide);
    }

    public Guide updateGuide(Long id, Guide updated) {
        return guideRepository.findById(id).map(g -> {
            g.setName(updated.getName());
            g.setLicenseNumber(updated.getLicenseNumber());
            g.setQualification(updated.getQualification());
            g.setCertifiedBoatTypes(updated.getCertifiedBoatTypes());
            g.setExperienceYears(updated.getExperienceYears());
            g.setContactPhone(updated.getContactPhone());
            g.setRating(updated.getRating());
            g.setStatus(updated.getStatus());
            return guideRepository.save(g);
        }).orElse(null);
    }

    public boolean deleteGuide(Long id) {
        if (guideRepository.existsById(id)) {
            guideRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean isGuideQualifiedForBoatType(Guide guide, String boatType) {
        if (guide == null || boatType == null || boatType.trim().isEmpty()) return true;
        if (guide.getCertifiedBoatTypes() == null || guide.getCertifiedBoatTypes().trim().isEmpty()) return true;

        String[] certified = guide.getCertifiedBoatTypes().split("[,;|/]");
        for (String c : certified) {
            if (c.trim().equalsIgnoreCase(boatType.trim()) ||
                boatType.toLowerCase().contains(c.trim().toLowerCase()) ||
                c.toLowerCase().contains(boatType.trim().toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
