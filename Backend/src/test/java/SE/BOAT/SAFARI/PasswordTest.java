package SE.BOAT.SAFARI;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class PasswordTest {

    @Test
    public void testBCryptHashingAndMatching() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Pasan@4444";
        String encoded = encoder.encode(rawPassword);

        assertNotNull(encoded);
        assertNotEquals(rawPassword, encoded);
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));
        assertTrue(encoder.matches(rawPassword, encoded));
        assertFalse(encoder.matches("WrongPassword", encoded));
    }

    @Test
    public void testBCryptRegexDetection() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Admin@1234");
        String plain = "123456789";

        String regex = "^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$";
        assertTrue(hash.matches(regex));
        assertFalse(plain.matches(regex));
    }
}
