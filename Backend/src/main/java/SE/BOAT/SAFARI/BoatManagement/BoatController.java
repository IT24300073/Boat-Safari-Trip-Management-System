package SE.BOAT.SAFARI.BoatManagement;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/boats")
public class BoatController {

    @Autowired
    private BoatService boatService;

    @Autowired
    private SE.BOAT.SAFARI.Booking.BookingRepository bookingRepository;

    // Get all boats
    @GetMapping
    public List<Boat> getAllBoats() {
        return boatService.getBoats();
    }

    @GetMapping("/availability-realtime")
    public List<java.util.Map<String, Object>> getRealtimeBoatAvailability(@RequestParam(required = false) String date) {
        java.time.LocalDate safariDate = (date != null && !date.isEmpty()) ? java.time.LocalDate.parse(date) : java.time.LocalDate.now();
        List<Boat> boats = boatService.getBoats();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();

        for (Boat boat : boats) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("boatId", boat.getId());
            map.put("name", boat.getName());
            map.put("capacity", boat.getCapacity());
            map.put("status", boat.getStatus());
            map.put("price", boat.getPrice());
            map.put("boatType", boat.getBoatType());

            if ("MAINTENANCE".equalsIgnoreCase(boat.getStatus()) || "UNAVAILABLE".equalsIgnoreCase(boat.getStatus())) {
                map.put("bookedSeats", 0);
                map.put("remainingSeats", 0);
                map.put("seatStatus", "MAINTENANCE");
            } else {
                List<SE.BOAT.SAFARI.Booking.Booking> bookings = bookingRepository.findByBoatIdAndSafariDate(boat.getId(), safariDate);
                int bookedSeats = bookings.stream()
                        .mapToInt(b -> b.getPassengers() > 0 ? b.getPassengers() : (b.getAdults() + b.getChildren()))
                        .sum();
                int remaining = Math.max(0, boat.getCapacity() - bookedSeats);
                String seatStatus = remaining == 0 ? "FULL" : (remaining <= 3 ? "LIMITED" : "AVAILABLE");

                map.put("bookedSeats", bookedSeats);
                map.put("remainingSeats", remaining);
                map.put("seatStatus", seatStatus);
            }
            result.add(map);
        }
        return result;
    }

    // Get boat by ID
    @GetMapping("/{id}")
    public ResponseEntity<Boat> getBoatById(@PathVariable int id) {
        return boatService.getBoatById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Add new boat
    @PostMapping
    public Boat createBoat(@RequestBody Boat boat) {
        return boatService.saveBoat(boat);
    }

    // Update boat
    @PutMapping("/{id}")
    public ResponseEntity<Boat> updateBoat(@PathVariable int id, @RequestBody Boat boatDetails) {
        return boatService.getBoatById(id)
                .map(existingBoat -> {
                    existingBoat.setName(boatDetails.getName());
                    existingBoat.setCapacity(boatDetails.getCapacity());
                    existingBoat.setBoatType(boatDetails.getBoatType());
                    existingBoat.setPrice(boatDetails.getPrice());
                    if (boatDetails.getStatus() != null && !boatDetails.getStatus().isEmpty()) {
                        existingBoat.setStatus(boatDetails.getStatus());
                    }

                    Boat updatedBoat = boatService.saveBoat(existingBoat);
                    return ResponseEntity.ok(updatedBoat);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoat(@PathVariable int id) {
        return boatService.getBoatById(id)
                .map(existingBoat -> {
                    boatService.deleteBoat(id);
                    return ResponseEntity.noContent().<Void>build(); // ✅ now ResponseEntity<Void>
                })
                .orElse(ResponseEntity.notFound().<Void>build());   // ✅ also ResponseEntity<Void>
    }

}
