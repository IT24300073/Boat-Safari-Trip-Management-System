package SE.BOAT.SAFARI.Schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface SafariScheduleRepository extends JpaRepository<SafariSchedule, Long> {
    List<SafariSchedule> findByBoatIdAndScheduleDateAndTimeSlot(int boatId, LocalDate scheduleDate, String timeSlot);
    List<SafariSchedule> findByGuideNameIgnoreCaseAndScheduleDateAndTimeSlot(String guideName, LocalDate scheduleDate, String timeSlot);
    List<SafariSchedule> findByScheduleDate(LocalDate scheduleDate);
    List<SafariSchedule> findByScheduleDateAndStatus(LocalDate scheduleDate, String status);
    List<SafariSchedule> findByScheduleDateAndTimeSlotAndStatus(LocalDate scheduleDate, String timeSlot, String status);
    List<SafariSchedule> findByTimeSlotAndStatus(String timeSlot, String status);
    List<SafariSchedule> findByStatus(String status);
}
