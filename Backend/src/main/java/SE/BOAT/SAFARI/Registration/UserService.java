package SE.BOAT.SAFARI.Registration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Check if a password string is already a BCrypt hash
    public boolean isBCryptHash(String password) {
        if (password == null) {
            return false;
        }
        return password.matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
    }

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
        // Hash password with BCrypt
        if (!password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        } else {
            user.setPassword("");
        }
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

        String storedPassword = user.getPassword() != null ? user.getPassword().trim() : "";
        boolean isMatch = false;

        if (isBCryptHash(storedPassword)) {
            try {
                isMatch = passwordEncoder.matches(password, storedPassword);
            } catch (Exception e) {
                isMatch = false;
            }
        } else {
            // Support legacy plain text passwords and upgrade them seamlessly
            if (storedPassword.equals(password)) {
                isMatch = true;
                // Auto-upgrade plain text to BCrypt hash
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
            }
        }

        if (isMatch) {
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
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().trim().isEmpty()) {
                String raw = updatedUser.getPassword().trim();
                if (isBCryptHash(raw)) {
                    existingUser.setPassword(raw);
                } else {
                    existingUser.setPassword(passwordEncoder.encode(raw));
                }
            }
            if (updatedUser.getRole() != null) existingUser.setRole(updatedUser.getRole());

            return userRepository.save(existingUser);
        }
        return null;
    }

    public boolean updatePassword(Integer id, String newPassword) {
        Optional<User> existingUserOptional = userRepository.findById(id);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();
            String pwd = newPassword != null ? newPassword.trim() : "";
            existingUser.setPassword(passwordEncoder.encode(pwd));
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
            String pwd = newPassword != null ? newPassword.trim() : "";
            existingUser.setPassword(passwordEncoder.encode(pwd));
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }

    // Automatically migrate any legacy plain text passwords in the database to BCrypt hashes
    public void migrateLegacyPasswords() {
        try {
            List<User> users = userRepository.findAll();
            int count = 0;
            for (User u : users) {
                String pwd = u.getPassword();
                if (pwd != null && !pwd.trim().isEmpty() && !pwd.trim().equalsIgnoreCase("EMPTY") && !isBCryptHash(pwd.trim())) {
                    u.setPassword(passwordEncoder.encode(pwd.trim()));
                    userRepository.save(u);
                    count++;
                }
            }
            if (count > 0) {
                System.out.println(">>> [MIGRATION] Successfully hashed " + count + " legacy plain text user password(s) with BCrypt.");
            }
        } catch (Exception e) {
            System.err.println(">>> [MIGRATION ERROR] Could not migrate legacy passwords: " + e.getMessage());
        }
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
