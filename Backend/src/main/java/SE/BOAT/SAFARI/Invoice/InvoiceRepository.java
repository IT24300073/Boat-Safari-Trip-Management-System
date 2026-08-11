package SE.BOAT.SAFARI.Invoice;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    Optional<Invoice> findByBookingId(int bookingId);
}
