// create-admin.js
const bcrypt = require('bcrypt');

async function createAdminPassword() {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('='.repeat(70));
    console.log('ADMIN USER CREATION');
    console.log('='.repeat(70));
    console.log('\nPassword:', password);
    console.log('Hash:', hash);
    console.log('\n' + '='.repeat(70));
    console.log('Copy and run this SQL in pgAdmin:');
    console.log('='.repeat(70));
    console.log('\n');
    console.log(`INSERT INTO users (name, email, password_hash, address, role) 
VALUES (
    'System Administrator User', 
    'admin@storerate.com', 
    '${hash}', 
    '123 Admin Street, City, State, ZIP', 
    'admin'
);`);
    console.log('\n' + '='.repeat(70));
    console.log('Login Credentials:');
    console.log('='.repeat(70));
    console.log('Email: admin@storerate.com');
    console.log('Password: Admin@123');
    console.log('='.repeat(70));
}

createAdminPassword().catch(err => {
    console.error('Error:', err);
});
