const db = require('../models');

// Get all user holiday settings
const listHolidaySettings = async (req, res) => {
  try {
    const settings = await db.UserHolidaySetting.findAll({
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }],
      order: [['userId', 'ASC']]
    });
    res.json(settings);
  } catch (err) {
    console.error('Error listing holiday settings:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil pengaturan hari libur' });
  }
};

// Get holiday setting for a specific user
const getHolidaySetting = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    const setting = await db.UserHolidaySetting.findOne({
      where: { userId: parseInt(userId) },
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }]
    });

    if (!setting) {
      return res.status(404).json({ message: 'Pengaturan hari libur tidak ditemukan untuk user ini' });
    }

    res.json(setting);
  } catch (err) {
    console.error('Error getting holiday setting:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil pengaturan hari libur' });
  }
};

// Create or update holiday setting for a user
const upsertHolidaySetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const { day1, day2, isActive = true } = req.body;

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    // Validate day1
    if (day1 === undefined || day1 === null || isNaN(parseInt(day1))) {
      return res.status(400).json({ message: 'Hari libur pertama (day1) wajib diisi (0-6)' });
    }

    const day1Num = parseInt(day1);
    if (day1Num < 0 || day1Num > 6) {
      return res.status(400).json({ message: 'Hari libur pertama harus antara 0 (Minggu) hingga 6 (Sabtu)' });
    }

    // Validate day2 if provided
    if (day2 !== null && day2 !== undefined) {
      const day2Num = parseInt(day2);
      if (isNaN(day2Num) || day2Num < 0 || day2Num > 6) {
        return res.status(400).json({ message: 'Hari libur kedua harus antara 0 (Minggu) hingga 6 (Sabtu) atau kosong' });
      }
      
      // Ensure day1 and day2 are different
      if (day1Num === day2Num) {
        return res.status(400).json({ message: 'Hari libur pertama dan kedua tidak boleh sama' });
      }
    }

    // Check if user exists
    const user = await db.User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Upsert holiday setting
    const [setting, created] = await db.UserHolidaySetting.upsert({
      userId: parseInt(userId),
      day1: day1Num,
      day2: day2 !== null && day2 !== undefined ? parseInt(day2) : null,
      isActive: isActive === true || isActive === 'true' || isActive === 1
    }, {
      returning: true
    });

    const settingWithUser = await db.UserHolidaySetting.findByPk(setting.id, {
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'department']
      }]
    });

    res.json({
      message: created ? 'Pengaturan hari libur berhasil dibuat' : 'Pengaturan hari libur berhasil diperbarui',
      setting: settingWithUser
    });
  } catch (err) {
    console.error('Error upserting holiday setting:', err);
    res.status(500).json({ message: err.message || 'Gagal menyimpan pengaturan hari libur' });
  }
};

// Bulk assign holiday settings to multiple users
const bulkAssignHolidaySettings = async (req, res) => {
  try {
    const { userIds, day1, day2, isActive = true } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs wajib diisi (array)' });
    }

    // Validate day1
    if (day1 === undefined || day1 === null || isNaN(parseInt(day1))) {
      return res.status(400).json({ message: 'Hari libur pertama (day1) wajib diisi (0-6)' });
    }

    const day1Num = parseInt(day1);
    if (day1Num < 0 || day1Num > 6) {
      return res.status(400).json({ message: 'Hari libur pertama harus antara 0 (Minggu) hingga 6 (Sabtu)' });
    }

    // Validate day2 if provided
    let day2Num = null;
    if (day2 !== null && day2 !== undefined && day2 !== '') {
      day2Num = parseInt(day2);
      if (isNaN(day2Num) || day2Num < 0 || day2Num > 6) {
        return res.status(400).json({ message: 'Hari libur kedua harus antara 0 (Minggu) hingga 6 (Sabtu) atau kosong' });
      }
      
      if (day1Num === day2Num) {
        return res.status(400).json({ message: 'Hari libur pertama dan kedua tidak boleh sama' });
      }
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

        // Upsert holiday setting
        const [setting, created] = await db.UserHolidaySetting.upsert({
          userId: parseInt(userId),
          day1: day1Num,
          day2: day2Num,
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
      message: `Pengaturan hari libur berhasil di-assign ke ${results.length} user`,
      success: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error bulk assigning holiday settings:', err);
    res.status(500).json({ message: err.message || 'Gagal assign pengaturan hari libur' });
  }
};

// Delete holiday setting for a user
const deleteHolidaySetting = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'User ID tidak valid' });
    }

    const setting = await db.UserHolidaySetting.findOne({
      where: { userId: parseInt(userId) }
    });

    if (!setting) {
      return res.status(404).json({ message: 'Pengaturan hari libur tidak ditemukan' });
    }

    await setting.destroy();
    res.json({ message: 'Pengaturan hari libur berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting holiday setting:', err);
    res.status(500).json({ message: err.message || 'Gagal menghapus pengaturan hari libur' });
  }
};

module.exports = {
  listHolidaySettings,
  getHolidaySetting,
  upsertHolidaySetting,
  bulkAssignHolidaySettings,
  deleteHolidaySetting
};

