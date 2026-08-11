package SE.BOAT.SAFARI.Admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    // Get all admin dashboard data
    @GetMapping("/dashboard")
    public AdminService.AdminData getAdminDashboard() {
        return adminService.getAdminDashboardData();
    }
}
