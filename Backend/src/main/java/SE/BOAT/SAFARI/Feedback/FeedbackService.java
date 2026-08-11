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

    // Save feedback
    public Feedback saveFeedback(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }

    // Get feedbacks (filterable by name, email, or rating)
    public List<Feedback> getFeedbacks(String name, String email, Integer rating) {
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

        return spec == null ? feedbackRepository.findAll() : feedbackRepository.findAll(spec);
    }

    // Get single feedback by ID
    public Feedback getFeedbackById(int id) {
        return feedbackRepository.findById(id).orElse(null);
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
}
