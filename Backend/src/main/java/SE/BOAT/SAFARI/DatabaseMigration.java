package SE.BOAT.SAFARI;

import SE.BOAT.SAFARI.Registration.User;
import SE.BOAT.SAFARI.Registration.UserRepository;
import SE.BOAT.SAFARI.Registration.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println(">>> [MIGRATION] Checking and altering 'users' table columns on Supabase...");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255)");
            jdbcTemplate.execute("UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL");
            jdbcTemplate.execute("UPDATE users SET account_locked = false WHERE account_locked IS NULL");
            jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS users_id_seq");
            jdbcTemplate.execute("SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false)");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')");
            System.out.println(">>> [MIGRATION] 'users' table schema updated successfully on Supabase!");

            // Drop legacy foreign key constraints and duplicate tables
            jdbcTemplate.execute("ALTER TABLE booking DROP CONSTRAINT IF EXISTS fkrlgbu237cakb9uoe8u9mlrd09");
            jdbcTemplate.execute("DROP TABLE IF EXISTS boats CASCADE");
            jdbcTemplate.execute("DROP TABLE IF EXISTS admins CASCADE");
            jdbcTemplate.execute("UPDATE booking SET passengers = adults + children WHERE passengers IS NULL OR passengers <= 0");

            // Operator & Schedule columns migration
            jdbcTemplate.execute("ALTER TABLE safari_schedule ADD COLUMN IF NOT EXISTS guide_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE safari_schedule ADD COLUMN IF NOT EXISTS guide_license VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE safari_schedule ADD COLUMN IF NOT EXISTS operator_confirmed BOOLEAN DEFAULT TRUE");
            jdbcTemplate.execute("UPDATE safari_schedule SET operator_confirmed = TRUE WHERE operator_confirmed IS NULL");

            // Guides table migration
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS guides (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "license_number VARCHAR(255) UNIQUE NOT NULL, " +
                    "qualification VARCHAR(255) NOT NULL, " +
                    "certified_boat_types VARCHAR(255) NOT NULL, " +
                    "experience_years INT DEFAULT 5, " +
                    "contact_phone VARCHAR(255), " +
                    "rating DOUBLE PRECISION DEFAULT 5.0, " +
                    "status VARCHAR(50) DEFAULT 'ACTIVE')");

            // Migrate any plain text passwords to BCrypt
            userService.migrateLegacyPasswords();

            // Ensure default admin user exists
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@gmail.com");
                admin.setPhone("0770000000");
                admin.setPassword(passwordEncoder.encode("123456789"));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                System.out.println(">>> [MIGRATION] Admin account created: admin@gmail.com");
            }

            // Ensure default staff user exists
            if (!userRepository.existsByEmail("staff@gmail.com")) {
                User staff = new User();
                staff.setName("Staff");
                staff.setEmail("staff@gmail.com");
                staff.setPhone("0770000001");
                staff.setPassword(passwordEncoder.encode("123456"));
                staff.setRole("STAFF");
                userRepository.save(staff);
                System.out.println(">>> [MIGRATION] Staff account created: staff@gmail.com");
            }
        } catch (Exception e) {
            System.err.println(">>> [MIGRATION ERROR]: " + e.getMessage());
        }
    }
}
