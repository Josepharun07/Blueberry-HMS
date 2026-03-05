const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = 'Manager123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hash);
}

hashPassword();
