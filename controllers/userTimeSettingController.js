const db = require('../models');

// Get all user time settings
const listTimeSettings = async (req, res) => {
  try {
    const settings = await db.UserTimeSetting.findAll({
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }],
      order: [['userId', 'ASC']]
    });
    res.json(settings);
  } catch (err) {
    console.error('Error listing time settings:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil pengaturan waktu' });
  }
};

// Get time setting for a specific user
const getTimeSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    const setting = await db.UserTimeSetting.findOne({
      where: { userId: parseInt(userId) },
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Pengaturan waktu tidak ditemukan untuk user ini' });
    }

    res.json(setting);
  } catch (err) {
    console.error('Error getting time setting:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil pengaturan waktu' });
  }
};

// Create or update time setting for a user
const upsertTimeSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const { checkInTime, checkOutTime, breakStartTime, breakEndTime, checkInTolerance, breakDuration, isActive = true } = req.body;

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    // Validate required fields
    if (!checkInTime || !checkOutTime || !breakStartTime || !breakEndTime) {
      return res.status(400).json({ message: 'Semua waktu wajib diisi' });
    }

    // Check if user exists
    const user = await db.User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Upsert time setting
    const [setting, created] = await db.UserTimeSetting.upsert({
      userId: parseInt(userId),
      checkInTime,
      checkOutTime,
      breakStartTime,
      breakEndTime,
      checkInTolerance: parseInt(checkInTolerance) || 15,
      breakDuration: parseInt(breakDuration) || 60,
      isActive: isActive === true || isActive === 'true' || isActive === 1
    }, {
      returning: true
    });

    const settingWithUser = await db.UserTimeSetting.findByPk(setting.id, {
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }]
    });

    res.json({
      message: created ? 'Pengaturan waktu berhasil dibuat' : 'Pengaturan waktu berhasil diperbarui',
      setting: settingWithUser
    });
  } catch (err) {
    console.error('Error upserting time setting:', err);
    res.status(500).json({ message: err.message || 'Gagal menyimpan pengaturan waktu' });
  }
};

// Bulk assign time settings to multiple users
const bulkAssignTimeSettings = async (req, res) => {
  try {
    const { userIds, checkInTime, checkOutTime, breakStartTime, breakEndTime, checkInTolerance, breakDuration, isActive = true } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs wajib diisi (array)' });
    }

    if (!checkInTime || !checkOutTime || !breakStartTime || !breakEndTime) {
      return res.status(400).json({ message: 'Semua waktu wajib diisi' });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
          errors.push({ userId, error: 'User ID tidak valid' });
          continue;
        }

        // Check if user exists
        const user = await db.User.findByPk(parseInt(userId));
        if (!user) {
          errors.push({ userId, error: 'User tidak ditemukan' });
          continue;
        }

        // Upsert time setting
        const [setting, created] = await db.UserTimeSetting.upsert({
          userId: parseInt(userId),
          checkInTime,
          checkOutTime,
          breakStartTime,
          breakEndTime,
          checkInTolerance: parseInt(checkInTolerance) || 15,
          breakDuration: parseInt(breakDuration) || 60,
          isActive: isActive === true || isActive === 'true' || isActive === 1
        }, {
          returning: true
        });

        results.push({
          userId: parseInt(userId),
          userName: user.name,
          status: created ? 'created' : 'updated'
        });
      } catch (err) {
        errors.push({ userId, error: err.message || 'Gagal menyimpan pengaturan' });
      }
    }

    res.json({
      message: `Pengaturan waktu berhasil di-assign ke ${results.length} user`,
      success: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error bulk assigning time settings:', err);
    res.status(500).json({ message: err.message || 'Gagal assign pengaturan waktu' });
  }
};

// Delete time setting for a user
const deleteTimeSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    const setting = await db.UserTimeSetting.findOne({
      where: { userId: parseInt(userId) }
    });

    if (!setting) {
      return res.status(404).json({ message: 'Pengaturan waktu tidak ditemukan' });
    }

    await setting.destroy();
    res.json({ message: 'Pengaturan waktu berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting time setting:', err);
    res.status(500).json({ message: err.message || 'Gagal menghapus pengaturan waktu' });
  }
};

module.exports = {
  listTimeSettings,
  getTimeSetting,
  upsertTimeSetting,
  bulkAssignTimeSettings,
  deleteTimeSetting
};

