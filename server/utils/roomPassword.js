const bcrypt = require('bcryptjs');

// Hash a room password
const hashRoomPassword = async (password) => {
  try {
    if (!password || password.trim().length === 0) {
      return null;
    }

    console.log('🔐 Hashing room password');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password.toString(), salt);
    console.log('✅ Password hashed');
    return hashed;
  } catch (error) {
    console.error('❌ Error hashing password:', error.message);
    throw error;
  }
};

// Verify room password
const verifyRoomPassword = async (enteredPassword, hashedPassword) => {
  try {
    if (!enteredPassword || !hashedPassword) {
      return false;
    }

    console.log('🔐 Verifying room password');
    const isMatch = await bcrypt.compare(enteredPassword.toString(), hashedPassword);
    console.log(isMatch ? '✅ Password verified' : '❌ Password incorrect');
    return isMatch;
  } catch (error) {
    console.error('❌ Error verifying password:', error.message);
    return false;
  }
};

module.exports = {
  hashRoomPassword,
  verifyRoomPassword
};
