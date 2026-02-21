const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

(async () => {
    try {
        await client.connect();
        // Reset passwords for all admin accounts to 'admin123'
        await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('admin123', gen_salt('bf')),
          email_confirmed_at = NOW()
      WHERE email IN ('admin@mirai.com', 'admin@kikancloud.com');
    `);
        console.log("Passwords for admin@mirai.com & admin@kikancloud.com reset to: admin123");
    } catch (err) {
        console.error("Connection error", err.stack);
    } finally {
        await client.end();
    }
})();
