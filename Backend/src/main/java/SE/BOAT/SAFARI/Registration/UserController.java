package SE.BOAT.SAFARI.Registration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        User savedUser = userService.registerUser(user);
        return savedUser != null
                ? ResponseEntity.ok(savedUser)
                : ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {
        UserService.LoginResult result = userService.processLogin(loginUser);

        switch (result.getStatus()) {
            case SUCCESS:
                return ResponseEntity.ok(result.getUser());
            case ACCOUNT_LOCKED:
                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(Map.of("message", result.getMessage(), "accountLocked", true));
            case INVALID_CREDENTIALS:
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", result.getMessage(), "remainingAttempts", result.getRemainingAttempts()));
            case USER_NOT_FOUND:
            default:
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials. Please check your details and try again."));
        }
    }

    @PutMapping("/{id}/unlock")
    public ResponseEntity<Void> unlockUser(@PathVariable Integer id) {
        boolean unlocked = userService.unlockUser(id);
        return unlocked ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @GetMapping
    public List<User> getUsers() {
        return userService.getUsers();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User updatedUser) {
        User user = userService.updateUser(id, updatedUser);
        return user != null
                ? ResponseEntity.ok(user)
                : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {

        String newPassword = body.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password cannot be empty."));
        }

        Integer userId = null;
        try {
            userId = Integer.parseInt(id);
        } catch (NumberFormatException ignored) {}

        String email = body.get("email");
        boolean updated = false;

        if (userId != null) {
            updated = userService.updatePassword(userId, newPassword);
        }
        
        if (!updated && email != null && !email.trim().isEmpty()) {
            updated = userService.updatePasswordByEmail(email.trim(), newPassword);
        }

        if (updated) {
            return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User account not found."));
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePasswordWithoutId(@RequestBody java.util.Map<String, String> body) {
        return updatePassword("undefined", body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        return userService.deleteUser(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
