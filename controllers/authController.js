const db = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_absensi_change_me', { expiresIn: '8h' });
    
    // Return user data including profilePicture
    const userData = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      profilePicture: user.profilePicture || null,
      email: user.email || null,
      employeeId: user.employeeId || null,
      position: user.position || null
    };
    
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login };
