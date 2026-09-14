package SE.BOAT.SAFARI.Registration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Register a new user
    public User registerUser(User user) {
        String email = user.getEmail() != null ? user.getEmail().trim() : null;
        if (email != null && email.isEmpty()) email = null;

        String phone = user.getPhone() != null ? user.getPhone().trim() : null;
        if (phone != null && phone.isEmpty()) phone = null;

        String password = user.getPassword() != null ? user.getPassword().trim() : "";

        // Require at least email or phone
        if (email == null && phone == null) {
            return null;
        }

        // Enforce exactly 10 digits for mobile number if provided
        if (phone != null && !phone.matches("^\\d{10}$")) {
            return null;
        }

        if (email != null && userRepository.existsByEmail(email)) {
            return null;
        }

        if (phone != null && userRepository.existsByPhone(phone)) {
            return null;
        }

        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(password);
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }

    // Get all users
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public enum LoginStatus {
        SUCCESS,
        INVALID_CREDENTIALS,
        ACCOUNT_LOCKED,
        USER_NOT_FOUND
    }

    public static class LoginResult {
        private LoginStatus status;
        private User user;
        private String message;
        private int remainingAttempts;

        public LoginResult(LoginStatus status, User user, String message, int remainingAttempts) {
            this.status = status;
            this.user = user;
            this.message = message;
            this.remainingAttempts = remainingAttempts;
        }

        public LoginStatus getStatus() { return status; }
        public User getUser() { return user; }
        public String getMessage() { return message; }
        public int getRemainingAttempts() { return remainingAttempts; }
    }

    // Process login with attempt tracking and account locking
    public LoginResult processLogin(User loginUser) {
        String identifier = "";
        if (loginUser.getEmail() != null && !loginUser.getEmail().trim().isEmpty()) {
            identifier = loginUser.getEmail().trim();
        } else if (loginUser.getPhone() != null && !loginUser.getPhone().trim().isEmpty()) {
            identifier = loginUser.getPhone().trim();
        }

        if (identifier.isEmpty()) {
            return new LoginResult(LoginStatus.USER_NOT_FOUND, null, "Identifier cannot be empty.", 0);
        }

        String password = loginUser.getPassword() != null ? loginUser.getPassword().trim() : "";

        Optional<User> userOptional = userRepository.findByEmail(identifier);
        if (!userOptional.isPresent()) {
            userOptional = userRepository.findByPhone(identifier);
        }

        if (!userOptional.isPresent()) {
            return new LoginResult(LoginStatus.USER_NOT_FOUND, null, "User not found.", 0);
        }

        User user = userOptional.get();

        if (user.isAccountLocked()) {
            return new LoginResult(LoginStatus.ACCOUNT_LOCKED, user, "Account is locked due to 5 consecutive failed login attempts. Please contact admin to unlock.", 0);
        }

        if (user.getPassword().trim().equals(password)) {
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
            return new LoginResult(LoginStatus.SUCCESS, user, "Login successful.", 5);
        } else {
            int failedAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failedAttempts);

            if (failedAttempts >= 5) {
                user.setAccountLocked(true);
                userRepository.save(user);
                return new LoginResult(LoginStatus.ACCOUNT_LOCKED, user, "Account has been locked after 5 consecutive failed login attempts.", 0);
            } else {
                userRepository.save(user);
                int remaining = 5 - failedAttempts;
                return new LoginResult(LoginStatus.INVALID_CREDENTIALS, user, "Invalid password. " + remaining + " attempt(s) remaining before account lockout.", remaining);
            }
        }
    }

    // Legacy login helper
    public User login(User loginUser) {
        LoginResult result = processLogin(loginUser);
        return result.getStatus() == LoginStatus.SUCCESS ? result.getUser() : null;
    }

    // Unlock user account
    public boolean unlockUser(Integer id) {
        Optional<User> existingUserOptional = userRepository.findById(id);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
            existingUser.setAccountLocked(false);
            existingUser.setFailedLoginAttempts(0);
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }

    // Update user info
    public User updateUser(Integer id, User updatedUser) {
        Optional<User> existingUserOptional = userRepository.findById(id);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();

            if (updatedUser.getName() != null) existingUser.setName(updatedUser.getName());
            if (updatedUser.getEmail() != null) {
                String e = updatedUser.getEmail().trim();
                existingUser.setEmail(e.isEmpty() ? null : e);
            }
            if (updatedUser.getPhone() != null) {
                String p = updatedUser.getPhone().trim();
                existingUser.setPhone(p.isEmpty() ? null : p);
            }
            if (updatedUser.getPassword() != null) existingUser.setPassword(updatedUser.getPassword().trim());
            if (updatedUser.getRole() != null) existingUser.setRole(updatedUser.getRole());

            return userRepository.save(existingUser);
        }
        return null;
    }

    public boolean updatePassword(Integer id, String newPassword) {
        Optional<User> existingUserOptional = userRepository.findById(id);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
            existingUser.setPassword(newPassword.trim());
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }

    public boolean updatePasswordByEmail(String email, String newPassword) {
        if (email == null || email.trim().isEmpty()) return false;
        Optional<User> existingUserOptional = userRepository.findByEmail(email.trim());
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
            existingUser.setPassword(newPassword.trim());
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }


    // Delete user
    public boolean deleteUser(Integer id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
