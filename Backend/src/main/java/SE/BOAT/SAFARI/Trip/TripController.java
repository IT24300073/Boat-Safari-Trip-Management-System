package SE.BOAT.SAFARI.Trip;


import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "http://localhost:3000") // React front-end
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) { this.tripService = tripService; }

    @GetMapping
    public List<Trip> getAllTrips() { return tripService.getAllTrips(); }

    @PostMapping
    public Trip createTrip(@RequestBody Trip trip) { return tripService.saveTrip(trip); }

    @PutMapping("/{id}")
    public Trip updateTrip(@PathVariable Long id, @RequestBody Trip trip) {
        Trip existing = tripService.getTripById(id);
        if(existing == null) return null;
        existing.setName(trip.getName());
        existing.setType(trip.getType());
        existing.setAdultPrice(trip.getAdultPrice());
        existing.setChildPrice(trip.getChildPrice());
        existing.setStartingTime(trip.getStartingTime());
        existing.setDuration(trip.getDuration());
        existing.setDescription(trip.getDescription());
        return tripService.saveTrip(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteTrip(@PathVariable Long id) { tripService.deleteTrip(id); }
}
