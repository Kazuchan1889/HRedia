const db = require('../models');

// Helper function to get last day of month
function getLastDayOfMonth(year, month) {
  // month is 0-indexed in JavaScript Date, so we subtract 1
  return new Date(year, month, 0).getDate();
}

// Helper function to get end date of month (YYYY-MM-DD format)
function getEndDateOfMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = getLastDayOfMonth(year, month);
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

// simple payroll generator: dailyRate from settings * presentDays
const generatePayroll = async (req,res) => {
  try{
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: 'month=YYYY-MM required' });
    
    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Format month harus YYYY-MM' });
    }
    
    const start = month + '-01';
    const end = getEndDateOfMonth(month);
    const setting = await db.Setting.findOne({ where: { key: 'dailyRate' } });
    const dailyRate = setting ? parseFloat(setting.value) : 100000;

    const users = await db.User.findAll({ attributes: ['id','name','username'] });
    const rows = [];
    for (const u of users){
      const present = await db.Attendance.count({ where: { userId: u.id, date: { [db.Sequelize.Op.between]: [start,end] }, checkIn: { [db.Sequelize.Op.not]: null } } });
      const salary = present * dailyRate;
      rows.push({ user: u.name, username: u.username, presentDays: present, dailyRate, salary });
    }
    // CSV
    const headers = ['user','username','presentDays','dailyRate','salary'];
    const lines = [headers.join(',')];
    for(const r of rows){
      lines.push([`"${r.user}"`,`"${r.username}"`,r.presentDays,r.dailyRate,r.salary].join(','));
    }
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payroll_${month}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) {
    console.error('Error generating payroll:', err);
    res.status(500).json({ message: err.message || 'Gagal generate payroll' });
  }
}

// List all payrolls for admin
const listAllPayrolls = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: 'month=YYYY-MM required' });
    
    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Format month harus YYYY-MM' });
    }
    
    const start = month + '-01';
    const end = getEndDateOfMonth(month);
    const setting = await db.Setting.findOne({ where: { key: 'dailyRate' } });
    const dailyRate = setting ? parseFloat(setting.value) : 100000;

    const users = await db.User.findAll({ 
      attributes: ['id','name','username','employeeId','position','department'],
      order: [['name', 'ASC']]
    });
    const rows = [];
    for (const u of users){
      const present = await db.Attendance.count({ 
        where: { 
          userId: u.id, 
          date: { [db.Sequelize.Op.between]: [start,end] }, 
          checkIn: { [db.Sequelize.Op.not]: null } 
        } 
      });
      const salary = present * dailyRate;
      rows.push({ 
        userId: u.id,
        name: u.name, 
        username: u.username,
        employeeId: u.employeeId,
        position: u.position,
        department: u.department,
        presentDays: present, 
        dailyRate, 
        salary 
      });
    }
    res.json(rows);
  } catch (err) {
    console.error('Error listing payrolls:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil data payroll' });
  }
}

// Get user's own payroll
const getMyPayroll = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: 'month=YYYY-MM required' });
    
    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Format month harus YYYY-MM' });
    }
    
    const start = month + '-01';
    const end = getEndDateOfMonth(month);
    const setting = await db.Setting.findOne({ where: { key: 'dailyRate' } });
    const dailyRate = setting ? parseFloat(setting.value) : 100000;

    const userId = req.user.id;
    const present = await db.Attendance.count({ 
      where: { 
        userId, 
        date: { [db.Sequelize.Op.between]: [start,end] }, 
        checkIn: { [db.Sequelize.Op.not]: null } 
      } 
    });
    const salary = present * dailyRate;

    res.json({ 
      month,
      presentDays: present, 
      dailyRate, 
      salary 
    });
  } catch (err) {
    console.error('Error getting my payroll:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil data payroll' });
  }
}

module.exports = { generatePayroll, listAllPayrolls, getMyPayroll };
