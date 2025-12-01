const db = require('../models');
const { createNotification } = require('./notificationsController');

const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attendanceId, currentStatus, requestedStatus, description } = req.body;

    if (!attendanceId || !currentStatus || !requestedStatus || !description) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    // Verify attendance belongs to user
    const attendance = await db.Attendance.findOne({ where: { id: attendanceId, userId } });
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance tidak ditemukan' });
    }

    // Check if user has already made a request for this date (once per day limit)
    const attendanceDate = attendance.date; // Use attendance date
    
    // Find all pending requests by this user
    const pendingRequests = await db.AttendanceStatusRequest.findAll({
      where: { 
        userId,
        status: 'Pending'
      },
      include: [{
        model: db.Attendance,
        attributes: ['id', 'date']
      }]
    });
    
    // Check if any pending request is for the same date
    const existingRequestToday = pendingRequests.find(req => req.Attendance && req.Attendance.date === attendanceDate);
    
    if (existingRequestToday) {
      return res.status(400).json({ 
        message: `Anda sudah membuat request perubahan status absensi untuk tanggal ${attendanceDate}. Setiap user hanya dapat membuat 1 request per hari.` 
      });
    }

    const request = await db.AttendanceStatusRequest.create({
      attendanceId,
      userId,
      currentStatus,
      requestedStatus,
      description,
      status: 'Pending'
    });

    // Get user info for notification
    const user = await db.User.findByPk(userId);
    
    // Create notification for all admins
    const admins = await db.User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'Request Perubahan Status Absensi',
        `${user.name} mengajukan perubahan status absensi tanggal ${attendance.date}. Status: ${currentStatus} → ${requestedStatus}`
      );
    }

    res.json(request);
  } catch (err) {
    console.error('Error creating attendance status request:', err);
    const errorMessage = err.message || 'Gagal membuat request';
    res.status(400).json({ message: errorMessage });
  }
};

const listRequests = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'admin') {
      // Admin sees all requests
      const requests = await db.AttendanceStatusRequest.findAll({
        include: [
          { model: db.User, attributes: ['id', 'name', 'username'] },
          { model: db.Attendance, attributes: ['id', 'date', 'checkIn', 'checkOut'] }
        ],
        order: [['id', 'DESC']]
      });
      return res.json(requests);
    } else {
      // User sees only their own requests
      const requests = await db.AttendanceStatusRequest.findAll({
        where: { userId: user.id },
        include: [
          { model: db.Attendance, attributes: ['id', 'date', 'checkIn', 'checkOut'] }
        ],
        order: [['id', 'DESC']]
      });
      return res.json(requests);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const requests = await db.AttendanceStatusRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: db.User, attributes: ['id', 'name', 'username', 'department'] },
        { model: db.Attendance, attributes: ['id', 'date', 'checkIn', 'checkOut', 'checkInStatus'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang dapat mengubah status request' });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const request = await db.AttendanceStatusRequest.findOne({
      where: { id },
      include: [{ model: db.Attendance }, { model: db.User }]
    });

    if (!request) {
      return res.status(404).json({ message: 'Request tidak ditemukan' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request sudah diproses' });
    }

    // Update request status
    await db.AttendanceStatusRequest.update(
      { status, adminNote },
      { where: { id } }
    );

    // If approved, update attendance status
    if (status === 'Approved') {
      const attendance = request.Attendance;
      const updates = {};

      if (request.requestedStatus === 'onTime') {
        updates.checkInStatus = 'onTime';
      } else if (request.requestedStatus === 'almostLate') {
        updates.checkInStatus = 'almostLate';
      } else if (request.requestedStatus === 'early') {
        updates.checkInStatus = 'early';
      } else if (request.requestedStatus === 'normal') {
        // For break late or early leave, just remove the flag
        if (request.currentStatus === 'breakLate') {
          updates.breakLate = false;
        } else if (request.currentStatus === 'earlyLeave') {
          updates.earlyLeave = false;
        }
      } else if (request.requestedStatus === 'onTimeCheckout') {
        updates.earlyLeave = false;
      }

      if (Object.keys(updates).length > 0) {
        await db.Attendance.update(updates, { where: { id: attendance.id } });
      }
    }

    // Notify user about the decision
    await createNotification(
      request.userId,
      `Request Perubahan Status ${status === 'Approved' ? 'Disetujui' : 'Ditolak'}`,
      `Request perubahan status absensi tanggal ${request.Attendance.date} telah ${status === 'Approved' ? 'disetujui' : 'ditolak'}.${adminNote ? ` Catatan: ${adminNote}` : ''}`
    );

    res.json({ message: 'Request berhasil diproses' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createRequest, listRequests, updateRequest, getPendingRequests };

