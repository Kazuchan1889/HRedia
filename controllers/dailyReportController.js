const db = require('../models');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Helper function to convert time string (HH:MM:SS) to minutes
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to get report settings
async function getReportSettings() {
  const settings = await db.Setting.findAll({
    where: {
      key: ['reportStartTime', 'reportEndTime', 'reportFrequency']
    }
  });
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value });
  return {
    reportStartTime: settingsObj.reportStartTime || '08:00',
    reportEndTime: settingsObj.reportEndTime || '18:00',
    reportFrequency: settingsObj.reportFrequency || 'daily' // 'daily' or 'weekly'
  };
}

// Create daily report
const createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, file, date } = req.body;
    const today = date || new Date().toISOString().slice(0, 10);

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if report already exists for this date
    const existingReport = await db.DailyReport.findOne({
      where: { userId, date: today }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'Report already submitted for this date' });
    }

    // Get settings to check if late
    const settings = await getReportSettings();
    const nowTime = new Date().toTimeString().split(' ')[0];
    const nowMinutes = timeToMinutes(nowTime);
    const endTimeMinutes = timeToMinutes(settings.reportEndTime);
    const isLate = nowMinutes > endTimeMinutes;

    let filePath = null;
    let fileName = null;
    let fileType = null;

    // Handle file upload if provided
    if (file) {
      const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const data = matches[2];
        
        // Determine file type and extension
        let ext = 'jpg';
        if (mimeType.includes('pdf')) {
          ext = 'pdf';
          fileType = 'pdf';
        } else if (mimeType.includes('image')) {
          ext = mimeType.split('/').pop() || 'jpg';
          fileType = 'image';
        } else {
          return res.status(400).json({ message: 'File must be an image or PDF' });
        }

        const filename = `u${userId}_${today}_report_${Date.now()}.${ext}`;
        const fullPath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
        filePath = `/uploads/reports/${filename}`;
        fileName = filename;
      }
    }

    const report = await db.DailyReport.create({
      userId,
      date: today,
      content: content.trim(),
      filePath,
      fileName,
      fileType,
      isLate,
      submittedAt: new Date()
    });

    const reportWithUser = await db.DailyReport.findByPk(report.id, {
      include: [{ model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] }]
    });

    res.json(reportWithUser);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(400).json({ message: err.message || 'Failed to create report' });
  }
};

// List reports (admin sees all, user sees only their own)
const listReports = async (req, res) => {
  try {
    const user = req.user;
    let reports;

    if (user.role === 'admin') {
      // Admin sees all reports
      reports = await db.DailyReport.findAll({
        include: [{ model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] }],
        order: [['date', 'DESC'], ['submittedAt', 'DESC']]
      });
    } else {
      // User sees only their own reports
      reports = await db.DailyReport.findAll({
        where: { userId: user.id },
        include: [{ model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] }],
        order: [['date', 'DESC'], ['submittedAt', 'DESC']]
      });
    }

    res.json(reports);
  } catch (err) {
    console.error('Error listing reports:', err);
    res.status(400).json({ message: err.message || 'Failed to list reports' });
  }
};

// Get report settings (admin only)
const getReportSettingsController = async (req, res) => {
  try {
    const settings = await getReportSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error getting report settings:', err);
    res.status(400).json({ message: err.message || 'Failed to get settings' });
  }
};

// Update report settings (admin only)
const updateReportSettings = async (req, res) => {
  try {
    const { reportStartTime, reportEndTime, reportFrequency } = req.body;

    if (reportStartTime) {
      await db.Setting.upsert({
        key: 'reportStartTime',
        value: reportStartTime
      });
    }

    if (reportEndTime) {
      await db.Setting.upsert({
        key: 'reportEndTime',
        value: reportEndTime
      });
    }

    if (reportFrequency) {
      // Validate frequency value
      if (!['daily', 'weekly'].includes(reportFrequency)) {
        return res.status(400).json({ message: 'reportFrequency must be "daily" or "weekly"' });
      }
      await db.Setting.upsert({
        key: 'reportFrequency',
        value: reportFrequency
      });
    }

    const settings = await getReportSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error updating report settings:', err);
    res.status(400).json({ message: err.message || 'Failed to update settings' });
  }
};

module.exports = {
  createReport,
  listReports,
  getReportSettings: getReportSettingsController,
  updateReportSettings
};

