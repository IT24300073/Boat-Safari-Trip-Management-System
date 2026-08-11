package SE.BOAT.SAFARI.BoatManagement;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BoatService {

    @Autowired
    private BoatRepository boatRepository;

    // Add or update boat
    public Boat saveBoat(Boat boat) {
        return boatRepository.save(boat);
    }

    // Get all boats
    public List<Boat> getBoats() {
        return boatRepository.findAll();
    }

    // Get boat by ID
    public Optional<Boat> getBoatById(int id) {
        return boatRepository.findById(id);
    }

    // Delete boat
    public void deleteBoat(int id) {
        boatRepository.deleteById(id);
    }

}
