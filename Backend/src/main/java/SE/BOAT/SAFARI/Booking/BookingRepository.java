package SE.BOAT.SAFARI.Booking;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer>,
        JpaSpecificationExecutor<Booking> {

    // Eagerly fetch Boat and Trip with every findAll() call
    @Override
    @EntityGraph(attributePaths = {"boat", "trip"})
    List<Booking> findAll();
}
