const db = require('../models');
const fs = require('fs');
const path = require('path');
const { createNotification } = require('./notificationsController');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dailyReportId, newContent, file, reason } = req.body;

    if (!dailyReportId || !newContent || !newContent.trim()) {
      return res.status(400).json({ message: 'Daily report ID dan konten baru wajib diisi' });
    }

    // Verify report belongs to user
    const report = await db.DailyReport.findOne({ where: { id: dailyReportId, userId } });
    if (!report) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    }

    // Check if there's already a pending request for this report
    const existingRequest = await db.DailyReportEditRequest.findOne({
      where: { 
        dailyReportId, 
        status: 'Pending'
      }
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Sudah ada request edit yang pending untuk laporan ini' });
    }

    let newFilePath = null;
    let newFileName = null;
    let newFileType = null;

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
          newFileType = 'pdf';
        } else if (mimeType.includes('image')) {
          ext = mimeType.split('/').pop() || 'jpg';
          newFileType = 'image';
        } else {
          return res.status(400).json({ message: 'File harus berupa gambar atau PDF' });
        }

        const filename = `u${userId}_edit_${dailyReportId}_${Date.now()}.${ext}`;
        const fullPath = path.join(UPLOAD_DIR, filename);
        fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
        newFilePath = `/uploads/reports/${filename}`;
        newFileName = filename;
      }
    }

    const request = await db.DailyReportEditRequest.create({
      dailyReportId,
      userId,
      newContent: newContent.trim(),
      newFilePath,
      newFileName,
      newFileType,
      reason: reason || null,
      status: 'Pending'
    });

    // Get user info for notification
    const user = await db.User.findByPk(userId);
    
    // Create notification for all admins
    const admins = await db.User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'Request Edit Laporan',
        `${user.name} mengajukan edit laporan tanggal ${report.date}`
      );
    }

    const requestWithRelations = await db.DailyReportEditRequest.findByPk(request.id, {
      include: [
        { model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] },
        { model: db.DailyReport, include: [{ model: db.User, attributes: ['id', 'name', 'username'] }] }
      ]
    });

    res.json(requestWithRelations);
  } catch (err) {
    console.error('Error creating edit request:', err);
    res.status(400).json({ message: err.message || 'Gagal membuat request edit' });
  }
};

const listRequests = async (req, res) => {
  try {
    const user = req.user;
    let requests;

    if (user.role === 'admin') {
      // Admin sees all requests
      requests = await db.DailyReportEditRequest.findAll({
        include: [
          { model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] },
          { model: db.DailyReport, include: [{ model: db.User, attributes: ['id', 'name', 'username'] }] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // User sees only their own requests
      requests = await db.DailyReportEditRequest.findAll({
        where: { userId: user.id },
        include: [
          { model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] },
          { model: db.DailyReport, include: [{ model: db.User, attributes: ['id', 'name', 'username'] }] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json(requests);
  } catch (err) {
    console.error('Error listing edit requests:', err);
    res.status(400).json({ message: err.message || 'Gagal mengambil daftar request' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await db.DailyReportEditRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] },
        { model: db.DailyReport, include: [{ model: db.User, attributes: ['id', 'name', 'username'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    console.error('Error getting pending requests:', err);
    res.status(400).json({ message: err.message || 'Gagal mengambil pending requests' });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus Approved atau Rejected' });
    }

    const request = await db.DailyReportEditRequest.findByPk(id, {
      include: [
        { model: db.DailyReport },
        { model: db.User }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request sudah diproses' });
    }

    // Update request status
    await request.update({
      status,
      adminNote: adminNote || null
    });

    // If approved, update the daily report
    if (status === 'Approved') {
      const report = request.DailyReport;
      
      // Delete old file if exists and new file is provided
      if (report.filePath && request.newFilePath) {
        const oldFilePath = path.join(__dirname, '..', report.filePath);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old file:', err);
          }
        }
      }

      await report.update({
        content: request.newContent,
        filePath: request.newFilePath || report.filePath,
        fileName: request.newFileName || report.fileName,
        fileType: request.newFileType || report.fileType
      });

      // Create notification for user
      await createNotification(
        request.userId,
        'Request Edit Laporan Disetujui',
        `Request edit laporan tanggal ${report.date} telah disetujui`
      );
    } else {
      // Create notification for user
      await createNotification(
        request.userId,
        'Request Edit Laporan Ditolak',
        `Request edit laporan tanggal ${request.DailyReport.date} telah ditolak${adminNote ? ': ' + adminNote : ''}`
      );
    }

    const updatedRequest = await db.DailyReportEditRequest.findByPk(id, {
      include: [
        { model: db.User, attributes: ['id', 'name', 'username', 'profilePicture'] },
        { model: db.DailyReport, include: [{ model: db.User, attributes: ['id', 'name', 'username'] }] }
      ]
    });

    res.json(updatedRequest);
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(400).json({ message: err.message || 'Gagal update request' });
  }
};

module.exports = {
  createRequest,
  listRequests,
  getPendingRequests,
  updateRequest
};

