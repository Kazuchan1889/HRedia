const db = require('../models');

const getSettings = async (req, res) => {
  try {
    const settings = await db.Setting.findAll({
      order: [['key', 'ASC']]
    });
    res.json(settings); // Return array instead of object
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil settings' });
  }
}

const setSetting = async (req, res) => {
  try{
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'Key required' });
    const [s, created] = await db.Setting.upsert({ key, value });
    res.json({ message: 'Saved' });
  }catch(err){
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getSettings, setSetting };
