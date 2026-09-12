package SE.BOAT.SAFARI.Feedback;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    // Save feedback with automatic low-rating threshold check
    public Feedback saveFeedback(Feedback feedback) {
        // Agreed rating threshold rule: Auto-flag any feedback with rating <= 3 stars
        if (feedback.getRating() <= 3) {
            feedback.setFlagged(true);
            feedback.setFlagReason("Low Rating Alert (" + feedback.getRating() + "/5 Stars)");
        } else {
            feedback.setFlagged(false);
            feedback.setFlagReason(null);
        }
        return feedbackRepository.save(feedback);
    }

    // Get feedbacks (filterable by name, email, rating, or flagged status)
    public List<Feedback> getFeedbacks(String name, String email, Integer rating, Boolean flagged) {
        Specification<Feedback> spec = null;

        if (name != null && !name.isEmpty()) {
            spec = (spec == null ? nameEquals(name) : spec.and(nameEquals(name)));
        }

        if (email != null && !email.isEmpty()) {
            spec = (spec == null ? emailEquals(email) : spec.and(emailEquals(email)));
        }

        if (rating != null) {
            spec = (spec == null ? ratingEquals(rating) : spec.and(ratingEquals(rating)));
        }

        if (flagged != null) {
            spec = (spec == null ? flaggedEquals(flagged) : spec.and(flaggedEquals(flagged)));
        }

        org.springframework.data.domain.Sort sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id");
        return spec == null ? feedbackRepository.findAll(sortOrder) : feedbackRepository.findAll(spec, sortOrder);
    }

    // Get single feedback by ID
    public Feedback getFeedbackById(int id) {
        return feedbackRepository.findById(id).orElse(null);
    }

    // Mark a flagged feedback as reviewed by admin
    public Feedback markAsReviewed(int id) {
        Optional<Feedback> existingFeedback = feedbackRepository.findById(id);
        if (existingFeedback.isPresent()) {
            Feedback f = existingFeedback.get();
            f.setReviewed(true);
            return feedbackRepository.save(f);
        }
        return null;
    }

    // Update feedback
    public Feedback updateFeedback(int id, Feedback feedback) {
        Optional<Feedback> existingFeedback = feedbackRepository.findById(id);
        if (existingFeedback.isPresent()) {
            Feedback f = existingFeedback.get();
            f.setName(feedback.getName());
            f.setEmail(feedback.getEmail());
            f.setMessage(feedback.getMessage());
            f.setRating(feedback.getRating());
            if (f.getRating() <= 3) {
                f.setFlagged(true);
                f.setFlagReason("Low Rating Alert (" + f.getRating() + "/5 Stars)");
            }
            return feedbackRepository.save(f);
        }
        return null;
    }

    // Delete feedback
    public boolean deleteFeedback(int id) {
        Optional<Feedback> existingFeedback = feedbackRepository.findById(id);
        if (existingFeedback.isPresent()) {
            feedbackRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // ----- Specifications -----
    private Specification<Feedback> nameEquals(String name) {
        return (root, query, builder) -> builder.equal(root.get("name"), name);
    }

    private Specification<Feedback> emailEquals(String email) {
        return (root, query, builder) -> builder.equal(root.get("email"), email);
    }

    private Specification<Feedback> ratingEquals(int rating) {
        return (root, query, builder) -> builder.equal(root.get("rating"), rating);
    }

    private Specification<Feedback> flaggedEquals(boolean flagged) {
        return (root, query, builder) -> builder.equal(root.get("flagged"), flagged);
    }
}
