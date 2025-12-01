const db = require('../models');
const attendanceController = require('./attendanceController');

const listRequests = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin'){
      const all = await db.LeaveRequest.findAll({ 
        include: [{ model: db.User, attributes: ['id','name','username'] }],
        order: [['createdAt', 'DESC']]
      });
      return res.json(all);
    }
    const mine = await db.LeaveRequest.findAll({ 
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(mine);
  } catch (err) {
    console.error('Error listing leave requests:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil data izin/cuti' });
  }
}

// Get pending leave requests for notifications (admin only)
const getPendingRequests = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.json([]);
    }
    const pending = await db.LeaveRequest.findAll({
      where: { status: 'Pending' },
      include: [{ model: db.User, attributes: ['id','name','username'] }],
      order: [['createdAt', 'DESC']],
      limit: 10 // Limit to latest 10 requests
    });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// Get pending attendance status requests for notifications (admin only)
const getPendingAttendanceStatusRequests = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.json([]);
    }
    const pending = await db.AttendanceStatusRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: db.User, attributes: ['id','name','username'] },
        { model: db.Attendance, attributes: ['id','date'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10 // Limit to latest 10 requests
    });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// Helper function to calculate days between two dates (inclusive)
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Set to midnight to avoid timezone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  // Calculate difference in days and add 1 to include both start and end dates
  const diffTime = end - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to include both start and end dates
}

const createRequest = async (req, res) => {
  try{
    const userId = req.user.id;
    const { startDate, endDate, reason, type } = req.body;
    
    // Validate type
    if (type && !['Izin', 'Cuti'].includes(type)) {
      return res.status(400).json({ message: 'Type must be "Izin" or "Cuti"' });
    }
    
    // If type is Cuti, check if user has enough leave quota
    if (type === 'Cuti') {
      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      
      // Calculate days between startDate and endDate
      const daysDiff = calculateDays(startDate, endDate);
      
      // Get user's leave quota (use leaveQuotaOther if exists, otherwise use leaveQuota)
      const leaveQuota = user.leaveQuotaOther ? user.leaveQuotaOther : (user.leaveQuota || 12);
      const usedQuota = user.usedLeaveQuota || 0;
      const remainingQuota = leaveQuota - usedQuota;
      
      console.log(`[Create Request] User ${userId}: Total Quota: ${leaveQuota}, Used: ${usedQuota}, Remaining: ${remainingQuota}, Requested: ${daysDiff} days`);
      
      // Check if user has any remaining quota
      if (remainingQuota <= 0) {
        return res.status(400).json({ 
          message: `Anda tidak memiliki jatah cuti tersisa. Jatah cuti Anda sudah habis (${leaveQuota} hari telah digunakan).` 
        });
      }
      
      // Check if requested days exceed remaining quota
      if (daysDiff > remainingQuota) {
        return res.status(400).json({ 
          message: `Jatah cuti tidak cukup. Sisa jatah cuti: ${remainingQuota} hari, butuh: ${daysDiff} hari` 
        });
      }
    }
    
    const r = await db.LeaveRequest.create({ userId, startDate, endDate, reason, type: type || 'Izin' });
    res.json(r);
  } catch (err) {
    console.error('Error creating leave request:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validasi error: ${errors}` });
    }
    res.status(400).json({ message: err.message || 'Gagal membuat request cuti/izin' });
  }
}

const updateRequest = async (req, res) => {
  try{
    const id = req.params.id;
    const payload = req.body;
    const reqRecord = await db.LeaveRequest.findOne({ where: { id } });
    
    if (!reqRecord) {
      return res.status(404).json({ message: 'Leave request tidak ditemukan' });
    }
    
    // Get the request type (handle both old and new data)
    // Normalize type to handle case sensitivity and null/undefined
    let requestType = reqRecord.type;
    if (!requestType || typeof requestType !== 'string') {
      requestType = 'Izin';
    } else {
      requestType = requestType.trim();
      // Normalize to match ENUM values
      if (requestType.toLowerCase() === 'cuti') {
        requestType = 'Cuti';
      } else {
        requestType = 'Izin';
      }
    }
    
    console.log(`[Update Request] ID: ${id}, Current Status: ${reqRecord.status}, New Status: ${payload.status}, Type: ${requestType} (original: ${reqRecord.type})`);
    
    // If status changed to Approved and type is Cuti, reduce leave quota
    if (payload.status === 'Approved' && reqRecord.status !== 'Approved' && requestType === 'Cuti') {
      console.log(`[Leave Quota] Processing Cuti approval for request ${id}`);
      const user = await db.User.findByPk(reqRecord.userId);
      if (user) {
        // Calculate days between startDate and endDate
        const daysDiff = calculateDays(reqRecord.startDate, reqRecord.endDate);
        
        // Get user's leave quota
        const leaveQuota = user.leaveQuotaOther ? user.leaveQuotaOther : (user.leaveQuota || 12);
        const currentUsed = user.usedLeaveQuota || 0;
        const remainingQuota = leaveQuota - currentUsed;
        
        console.log(`[Leave Quota] Before approval - User ${user.id} (${user.name}): Total: ${leaveQuota}, Used: ${currentUsed}, Remaining: ${remainingQuota}, Requested: ${daysDiff} days`);
        
        // Check if user has enough quota
        if (daysDiff > remainingQuota) {
          return res.status(400).json({ 
            message: `Jatah cuti tidak cukup. Sisa jatah cuti: ${remainingQuota} hari, butuh: ${daysDiff} hari` 
          });
        }
        
        // Update used leave quota BEFORE updating the request status
        const newUsedQuota = currentUsed + daysDiff;
        const [updateCount] = await db.User.update(
          { usedLeaveQuota: newUsedQuota },
          { where: { id: reqRecord.userId } }
        );
        
        // Verify the update was successful
        if (updateCount === 0) {
          console.error(`[Leave Quota] ERROR: Failed to update leave quota for user ${reqRecord.userId}`);
          return res.status(500).json({ message: 'Gagal memperbarui jatah cuti' });
        }
        
        // Reload user to verify the update
        await user.reload();
        console.log(`[Leave Quota] After approval - User ${user.id} (${user.name}): Used: ${currentUsed} -> ${user.usedLeaveQuota}, Remaining: ${leaveQuota - user.usedLeaveQuota}, Update count: ${updateCount}`);
      }
    }
    
    // If status changed from Approved to Rejected and type is Cuti, restore leave quota
    if (payload.status === 'Rejected' && reqRecord.status === 'Approved' && requestType === 'Cuti') {
      const user = await db.User.findByPk(reqRecord.userId);
      if (user) {
        // Calculate days between startDate and endDate
        const daysDiff = calculateDays(reqRecord.startDate, reqRecord.endDate);
        
        // Restore leave quota
        const currentUsed = user.usedLeaveQuota || 0;
        const newUsedQuota = Math.max(0, currentUsed - daysDiff);
        const [updateCount] = await db.User.update(
          { usedLeaveQuota: newUsedQuota },
          { where: { id: reqRecord.userId } }
        );
        
        // Reload user to verify the update
        await user.reload();
        console.log(`[Leave Quota] User ${user.id} (${user.name}): Restored ${daysDiff} days. Used: ${currentUsed} -> ${user.usedLeaveQuota}, Update count: ${updateCount}`);
      }
    }
    
    await db.LeaveRequest.update(payload, { where: { id } });
    
    // Sync attendance status for all dates in the leave request range
    if (payload.status) {
      const userId = reqRecord.userId;
      const startDate = new Date(reqRecord.startDate);
      const endDate = new Date(reqRecord.endDate);
      const currentDate = new Date(startDate);
      
      // Sync attendance for each date in the range
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        await attendanceController.syncAttendanceStatus(userId, dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // notify user if status changed
      const typeLabel = requestType === 'Cuti' ? 'cuti' : 'izin';
      const title = `Pengajuan ${typeLabel} Anda ${payload.status}`;
      const body = `Pengajuan ${typeLabel} Anda tanggal ${reqRecord.startDate} - ${reqRecord.endDate} telah ${payload.status}.`;
      await db.Notification.create({ userId, title, body });
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Error updating leave request:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validasi error: ${errors}` });
    }
    res.status(400).json({ message: err.message || 'Gagal update request izin/cuti' });
  }
}

module.exports = { listRequests, createRequest, updateRequest, getPendingRequests };
