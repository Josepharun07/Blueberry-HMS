const bcrypt = require('bcryptjs');

const testPassword = 'Admin@12345';
const testHash = '$2b$10$3DPYourActualHashHere...'; // We'll get this from DB

async function test() {
  console.log('Testing bcryptjs...');
  
  // Test 1: Hash a password
  const newHash = await bcrypt.hash('Admin@12345', 10);
  console.log('New hash:', newHash);
  
  // Test 2: Compare with wrong password
  const wrongResult = await bcrypt.compare('WrongPassword', newHash);
  console.log('Wrong password:', wrongResult);
  
  // Test 3: Compare with correct password
  const correctResult = await bcrypt.compare('Admin@12345', newHash);
  console.log('Correct password:', correctResult);
}

test();
