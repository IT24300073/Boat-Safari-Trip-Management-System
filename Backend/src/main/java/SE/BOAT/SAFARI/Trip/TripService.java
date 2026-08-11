package SE.BOAT.SAFARI.Trip;



import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TripService {

    private final TripRepository tripRepository;

    public TripService(TripRepository tripRepository) { this.tripRepository = tripRepository; }

    public List<Trip> getAllTrips() { return tripRepository.findAll(); }

    public Trip saveTrip(Trip trip) { return tripRepository.save(trip); }

    public void deleteTrip(Long id) { tripRepository.deleteById(id); }

    public Trip getTripById(Long id) { return tripRepository.findById(id).orElse(null); }
}
