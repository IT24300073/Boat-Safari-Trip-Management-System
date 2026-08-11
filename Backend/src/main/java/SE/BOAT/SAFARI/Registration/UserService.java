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
        String email = user.getEmail().trim();
        String password = user.getPassword().trim();

        if (userRepository.existsByEmail(email)) {
            return null;
        }

        user.setEmail(email);
        user.setPassword(password);
        user.setRole("USER");
        return userRepository.save(user);
    }

    // Get all users
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    // Login user
    public User login(User loginUser) {
        String email = loginUser.getEmail().trim();
        String password = loginUser.getPassword().trim();

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword().trim().equals(password)) {
                return user;
            }
        }
        return null;
    }

    // Update user info
    public User updateUser(Integer id, User updatedUser) {
        Optional<User> existingUserOptional = userRepository.findById(id);
        if (existingUserOptional.isPresent()) {
            User existingUser = existingUserOptional.get();

            if (updatedUser.getName() != null) existingUser.setName(updatedUser.getName());
            if (updatedUser.getEmail() != null) existingUser.setEmail(updatedUser.getEmail().trim());
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


    // Delete user
    public boolean deleteUser(Integer id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
