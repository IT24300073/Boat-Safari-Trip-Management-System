package SE.BOAT.SAFARI.Report;

import SE.BOAT.SAFARI.Booking.Booking;
import SE.BOAT.SAFARI.Booking.BookingRepository;
import SE.BOAT.SAFARI.Schedule.SafariSchedule;
import SE.BOAT.SAFARI.Schedule.SafariScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SafariScheduleRepository safariScheduleRepository;

    private void syncScheduleStatus(Booking booking) {
        if (booking != null && booking.getScheduleId() != null && safariScheduleRepository != null) {
            safariScheduleRepository.findById(booking.getScheduleId()).ifPresent(sched -> {
                if ("CANCELLED".equalsIgnoreCase(sched.getStatus())) {
                    booking.setBookingStatus("CANCELLED");
                    if (booking.getCancelReason() == null || booking.getCancelReason().trim().isEmpty()) {
                        booking.setCancelReason(sched.getCancelReason() != null ? sched.getCancelReason() : "Cancelled by Safari Operations");
                    }
                }
            });
        }
    }

    public Report generateAndSaveReport() {
        List<Booking> bookings = bookingRepository.findAll();
        bookings.forEach(this::syncScheduleStatus);

        List<Booking> confirmedBookings = bookings.stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());

        int totalBookings = confirmedBookings.size();
        int totalAdults = confirmedBookings.stream().mapToInt(Booking::getAdults).sum();
        int totalChildren = confirmedBookings.stream().mapToInt(Booking::getChildren).sum();
        double totalRevenue = confirmedBookings.stream().mapToDouble(Booking::getTotalPrice).sum();

        Report report = new Report(totalBookings, totalAdults, totalChildren, totalRevenue);
        return reportRepository.save(report);
    }

    public Map<String, Object> getPerformanceAnalytics(String startDateStr, String endDateStr, String period) {
        LocalDate today = LocalDate.now();
        LocalDate start = today;
        LocalDate end = today;

        if (period != null && !period.isEmpty()) {
            switch (period.toLowerCase()) {
                case "today":
                    start = today;
                    end = today;
                    break;
                case "week":
                    start = today.with(DayOfWeek.MONDAY);
                    end = today.with(DayOfWeek.SUNDAY);
                    break;
                case "month":
                    start = today.withDayOfMonth(1);
                    end = today.with(TemporalAdjusters.lastDayOfMonth());
                    break;
                case "year":
                    start = today.withDayOfYear(1);
                    end = today.with(TemporalAdjusters.lastDayOfYear());
                    break;
                case "custom":
                    if (startDateStr != null && !startDateStr.isEmpty()) start = LocalDate.parse(startDateStr);
                    if (endDateStr != null && !endDateStr.isEmpty()) end = LocalDate.parse(endDateStr);
                    break;
                default:
                    start = today.withDayOfMonth(1);
                    end = today.with(TemporalAdjusters.lastDayOfMonth());
                    break;
            }
        } else if (startDateStr != null && !startDateStr.isEmpty() && endDateStr != null && !endDateStr.isEmpty()) {
            start = LocalDate.parse(startDateStr);
            end = LocalDate.parse(endDateStr);
        } else {
            start = today.withDayOfMonth(1);
            end = today.with(TemporalAdjusters.lastDayOfMonth());
        }

        final LocalDate finalStart = start;
        final LocalDate finalEnd = end;

        List<Booking> allBookings = bookingRepository.findAll();
        allBookings.forEach(this::syncScheduleStatus);

        List<Booking> filteredBookings = allBookings.stream()
                .filter(b -> b.getSafariDate() != null &&
                        !b.getSafariDate().isBefore(finalStart) &&
                        !b.getSafariDate().isAfter(finalEnd))
                .collect(Collectors.toList());

        List<Booking> confirmedBookings = filteredBookings.stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());

        List<Booking> cancelledBookings = filteredBookings.stream()
                .filter(b -> "CANCELLED".equalsIgnoreCase(b.getBookingStatus()))
                .collect(Collectors.toList());

        int totalBookings = confirmedBookings.size();
        int totalAdults = confirmedBookings.stream().mapToInt(Booking::getAdults).sum();
        int totalChildren = confirmedBookings.stream().mapToInt(Booking::getChildren).sum();
        int totalPassengers = totalAdults + totalChildren;
        double totalRevenue = confirmedBookings.stream().mapToDouble(Booking::getTotalPrice).sum();

        List<SafariSchedule> allSchedules = safariScheduleRepository.findAll();
        List<SafariSchedule> filteredSchedules = allSchedules.stream()
                .filter(s -> s.getScheduleDate() != null &&
                        !s.getScheduleDate().isBefore(finalStart) &&
                        !s.getScheduleDate().isAfter(finalEnd))
                .collect(Collectors.toList());

        long totalSchedules = filteredSchedules.size();
        long standaloneCancelledSchedules = filteredSchedules.stream()
                .filter(s -> "CANCELLED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> filteredBookings.stream().noneMatch(b -> s.getId().equals(b.getScheduleId())))
                .count();

        int totalCancellations = cancelledBookings.size() + (int) standaloneCancelledSchedules;
        double cancelledRevenue = cancelledBookings.stream().mapToDouble(Booking::getTotalPrice).sum();

        // Breakdown by Safari Trip Package (confirmed bookings)
        Map<String, Map<String, Object>> packageBreakdown = new HashMap<>();
        for (Booking b : confirmedBookings) {
            String tripName = (b.getTrip() != null && b.getTrip().getName() != null) ? b.getTrip().getName() : "Standard Safari";
            packageBreakdown.putIfAbsent(tripName, new HashMap<>());
            Map<String, Object> metrics = packageBreakdown.get(tripName);
            int count = (int) metrics.getOrDefault("count", 0) + 1;
            double rev = (double) metrics.getOrDefault("revenue", 0.0) + b.getTotalPrice();
            int passengers = (int) metrics.getOrDefault("passengers", 0) + (b.getPassengers() > 0 ? b.getPassengers() : (b.getAdults() + b.getChildren()));

            metrics.put("count", count);
            metrics.put("revenue", rev);
            metrics.put("passengers", passengers);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", finalStart.toString());
        result.put("endDate", finalEnd.toString());
        result.put("period", period != null ? period : "month");
        result.put("totalBookings", totalBookings);
        result.put("totalRevenue", totalRevenue);
        result.put("cancellationsCount", totalCancellations);
        result.put("cancelledBookingsCount", cancelledBookings.size());
        result.put("cancelledRevenue", cancelledRevenue);
        result.put("totalAdults", totalAdults);
        result.put("totalChildren", totalChildren);
        result.put("totalPassengers", totalPassengers);
        result.put("totalSchedules", totalSchedules);
        result.put("packageBreakdown", packageBreakdown);
        result.put("bookings", filteredBookings);
        return result;
    }

    public Map<String, Object> getPaymentReconciliation(String startDateStr, String endDateStr, String paymentMethod) {
        LocalDate today = LocalDate.now();
        LocalDate start = (startDateStr != null && !startDateStr.isEmpty()) ? LocalDate.parse(startDateStr) : today.withDayOfMonth(1);
        LocalDate end = (endDateStr != null && !endDateStr.isEmpty()) ? LocalDate.parse(endDateStr) : today.with(TemporalAdjusters.lastDayOfMonth());

        final LocalDate finalStart = start;
        final LocalDate finalEnd = end;
        final String targetMethod = (paymentMethod != null && !paymentMethod.isEmpty() && !"ALL".equalsIgnoreCase(paymentMethod)) ? paymentMethod.toUpperCase() : null;

        List<Booking> allBookings = bookingRepository.findAll();
        allBookings.forEach(this::syncScheduleStatus);

        List<Booking> filtered = allBookings.stream()
                .filter(b -> b.getSafariDate() != null &&
                        !b.getSafariDate().isBefore(finalStart) &&
                        !b.getSafariDate().isAfter(finalEnd))
                .filter(b -> targetMethod == null || (b.getPaymentMethod() != null && b.getPaymentMethod().toUpperCase().contains(targetMethod)))
                .collect(Collectors.toList());

        double cardRevenue = 0.0;
        int cardCount = 0;
        double paypalRevenue = 0.0;
        int paypalCount = 0;
        double cashRevenue = 0.0;
        int cashCount = 0;

        double cancelledRevenue = 0.0;
        int cancelledCount = 0;

        for (Booking b : filtered) {
            boolean isCancelled = "CANCELLED".equalsIgnoreCase(b.getBookingStatus()) || "REFUNDED".equalsIgnoreCase(b.getPaymentStatus());
            if (isCancelled) {
                cancelledRevenue += b.getTotalPrice();
                cancelledCount++;
                continue;
            }

            String method = b.getPaymentMethod() != null ? b.getPaymentMethod().toUpperCase() : "CARD";
            if (method.contains("PAYPAL")) {
                paypalRevenue += b.getTotalPrice();
                paypalCount++;
            } else if (method.contains("CASH")) {
                cashRevenue += b.getTotalPrice();
                cashCount++;
            } else {
                cardRevenue += b.getTotalPrice();
                cardCount++;
            }
        }

        double totalReconciledRevenue = cardRevenue + paypalRevenue + cashRevenue;
        int totalSettledCount = cardCount + paypalCount + cashCount;

        Map<String, Object> response = new HashMap<>();
        response.put("startDate", finalStart.toString());
        response.put("endDate", finalEnd.toString());
        response.put("paymentMethodFilter", targetMethod != null ? targetMethod : "ALL");
        response.put("cardRevenue", cardRevenue);
        response.put("cardCount", cardCount);
        response.put("paypalRevenue", paypalRevenue);
        response.put("paypalCount", paypalCount);
        response.put("cashRevenue", cashRevenue);
        response.put("cashCount", cashCount);
        response.put("totalReconciledRevenue", totalReconciledRevenue);
        response.put("totalSettledCount", totalSettledCount);
        response.put("cancelledRevenue", cancelledRevenue);
        response.put("cancelledCount", cancelledCount);
        response.put("totalTransactionsCount", filtered.size());
        response.put("transactions", filtered);
        return response;
    }

    public byte[] generateReconciliationCsv(String startDateStr, String endDateStr, String paymentMethod) {
        Map<String, Object> data = getPaymentReconciliation(startDateStr, endDateStr, paymentMethod);
        @SuppressWarnings("unchecked")
        List<Booking> transactions = (List<Booking>) data.get("transactions");

        StringBuilder csv = new StringBuilder();
        csv.append("Transaction Ref,Invoice ID,Customer Name,Email Address,Safari Date,Payment Method,Booking Status,Settlement Status,Total Amount (LKR),Cancellation / Notes\n");

        if (transactions != null) {
            for (Booking b : transactions) {
                String txnRef = b.getTransactionReference() != null ? b.getTransactionReference() : ("TXN-" + b.getId() + "84920");
                String method = b.getPaymentMethod() != null ? b.getPaymentMethod().toUpperCase() : "CARD";
                String bookingStatus = b.getBookingStatus() != null ? b.getBookingStatus() : "CONFIRMED";
                boolean isCancelled = "CANCELLED".equalsIgnoreCase(bookingStatus) || "REFUNDED".equalsIgnoreCase(b.getPaymentStatus());
                String settlementStatus = isCancelled ? "VOID / CANCELLED" : "SETTLED";
                String notes = b.getCancelReason() != null ? b.getCancelReason() : "";

                csv.append(escapeCsv(txnRef)).append(",")
                   .append(b.getId()).append(",")
                   .append(escapeCsv(b.getName())).append(",")
                   .append(escapeCsv(b.getEmail())).append(",")
                   .append(b.getSafariDate()).append(",")
                   .append(escapeCsv(method)).append(",")
                   .append(escapeCsv(bookingStatus)).append(",")
                   .append(escapeCsv(settlementStatus)).append(",")
                   .append(String.format(Locale.US, "%.2f", b.getTotalPrice())).append(",")
                   .append(escapeCsv(notes)).append("\n");
            }
        }

        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escapeCsv(String input) {
        if (input == null) return "\"\"";
        String escaped = input.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
