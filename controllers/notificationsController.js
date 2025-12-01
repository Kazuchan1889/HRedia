const db = require('../models');

const listNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notes = await db.Notification.findAll({ 
      where: { userId: user.id }, 
      order: [['id', 'DESC']] 
    });
    res.json(notes);
  } catch (err) {
    console.error('Error listing notifications:', err);
    res.status(500).json({ message: err.message || 'Gagal memuat notifications' });
  }
}

const createNotification = async (userId, title, body) => {
  try {
    await db.Notification.create({ userId, title, body });
  } catch (err) {
    console.error('Error creating notification:', err);
    // Don't throw error, just log it - notifications are not critical
  }
}

module.exports = { listNotifications, createNotification };
