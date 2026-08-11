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

    // Get all boats
    @GetMapping
    public List<Boat> getAllBoats() {
        return boatService.getBoats();
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
