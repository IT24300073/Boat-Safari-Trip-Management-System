package SE.BOAT.SAFARI;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println(">>> [MIGRATION] Checking and altering 'users' table columns on Supabase...");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE");
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
        } catch (Exception e) {
            System.err.println(">>> [MIGRATION ERROR]: " + e.getMessage());
        }
    }
}
