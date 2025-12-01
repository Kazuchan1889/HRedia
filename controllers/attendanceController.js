const db = require('../models');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const listAll = async (req, res) => {
  try {
    const attendances = await db.Attendance.findAll({ 
      include: [{ 
        model: db.User, 
        attributes: ['id','name','username','profilePicture'] 
      }],
      order: [['date', 'DESC']]
    });
    
    // Sync status for all attendances (without check-in)
    // This ensures status is up-to-date with leave requests
    for (const attendance of attendances) {
      if (!attendance.checkIn) {
        await syncAttendanceStatus(attendance.userId, attendance.date);
      }
    }
    
    // Reload attendances to get updated status
    const updatedAttendances = await db.Attendance.findAll({ 
      include: [{ 
        model: db.User, 
        attributes: ['id','name','username','profilePicture'] 
      }],
      order: [['date', 'DESC']]
    });
    
    res.json(updatedAttendances);
  } catch (err) {
    console.error('Error listing all attendances:', err);
    res.status(500).json({ message: err.message });
  }
}

const listByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Get user to check start date (if exists)
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine date range: from user startDate or last 30 days, whichever is more recent
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let startDate = thirtyDaysAgo.toISOString().split('T')[0];
    if (user.startDate) {
      const userStartDate = new Date(user.startDate);
      if (userStartDate > thirtyDaysAgo) {
        startDate = userStartDate.toISOString().split('T')[0];
      }
    }
    
    const endDate = today.toISOString().split('T')[0];
    
    // Generate missing attendance records
    await generateAttendanceRecords(userId, startDate, endDate);
    
    // Sync all attendance statuses with leave requests
    const allAttendances = await db.Attendance.findAll({ 
      where: { 
        userId,
        date: { [db.Sequelize.Op.between]: [startDate, endDate] }
      }
    });
    
    // Sync each attendance record
    for (const attendance of allAttendances) {
      await syncAttendanceStatus(userId, attendance.date);
    }
    
    // Get updated attendances
    const attendances = await db.Attendance.findAll({ 
      where: { userId },
      order: [['date', 'DESC']]
    });
    
    res.json(attendances);
  } catch (err) {
    console.error('Error listing attendances by user:', err);
    res.status(500).json({ message: err.message });
  }
}

// Helper function to convert time string (HH:MM:SS) to minutes
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to get settings
async function getAttendanceSettings() {
  const settings = await db.Setting.findAll({
    where: {
      key: ['checkInTime', 'checkOutTime', 'breakStartTime', 'breakEndTime', 'checkInTolerance', 'breakDuration']
    }
  });
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value });
  return {
    checkInTime: settingsObj.checkInTime || '08:00',
    checkOutTime: settingsObj.checkOutTime || '17:00',
    breakStartTime: settingsObj.breakStartTime || '12:00',
    breakEndTime: settingsObj.breakEndTime || '13:00',
    checkInTolerance: parseInt(settingsObj.checkInTolerance) || 15,
    breakDuration: parseInt(settingsObj.breakDuration) || 60
  };
}

// Helper function to check if a date is a holiday for a user
async function isUserHoliday(userId, date) {
  try {
    const holidaySetting = await db.UserHolidaySetting.findOne({
      where: {
        userId,
        isActive: true
      }
    });

    if (!holidaySetting) {
      return false; // No holiday setting means user works all days
    }

    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Check if this day matches day1 or day2
    return holidaySetting.day1 === dayOfWeek || 
           (holidaySetting.day2 !== null && holidaySetting.day2 === dayOfWeek);
  } catch (err) {
    console.error('Error checking user holiday:', err);
    return false; // Default to not holiday if error
  }
}

// Helper function to check if user has approved leave request for a specific date
async function hasApprovedLeaveRequest(userId, date) {
  const leaveRequest = await db.LeaveRequest.findOne({
    where: {
      userId,
      status: 'Approved',
      startDate: { [db.Sequelize.Op.lte]: date },
      endDate: { [db.Sequelize.Op.gte]: date }
    }
  });
  return leaveRequest;
}

// Helper function to determine attendance status based on check-in and leave requests
async function determineAttendanceStatus(userId, date, checkIn) {
  // If user has check in, status is always 'Hadir'
  if (checkIn) {
    return 'Hadir';
  }
  
  // Check if this date is today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);
  const isTodayOrFuture = attendanceDate >= today;
  
  // If it's today or future date and no check in yet, don't set as Alfa
  // Wait until the day has passed (after 00:00 of the next day)
  if (isTodayOrFuture) {
    // Check if user has approved leave request
    const leaveRequest = await hasApprovedLeaveRequest(userId, date);
    if (leaveRequest) {
      return leaveRequest.type === 'Izin' ? 'Izin' : 'Izin';
    }
    // If today/future and no check in and no leave request, keep as default 'Hadir'
    // This will be updated to 'Alfa' automatically when the day passes (after 00:00)
    return 'Hadir'; // Default status, will be updated to Alfa after 00:00 if no check in
  }
  
  // For past dates (date < today), check if user has approved leave request
  const leaveRequest = await hasApprovedLeaveRequest(userId, date);
  if (leaveRequest) {
    return leaveRequest.type === 'Izin' ? 'Izin' : 'Izin';
  }
  
  // Past date with no check in and no leave request = Alfa
  return 'Alfa';
}

// Helper function to generate attendance records for a user for a date range
async function generateAttendanceRecords(userId, startDate, endDate) {
  const records = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if record already exists
    const existing = await db.Attendance.findOne({
      where: { userId, date: dateStr }
    });
    
    if (!existing) {
      // Determine initial status
      const status = await determineAttendanceStatus(userId, dateStr, null);
      
      // Create record with default status
      const record = await db.Attendance.create({
        userId,
        date: dateStr,
        status: status
      });
      records.push(record);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return records;
}

// Helper function to sync attendance status with leave requests
async function syncAttendanceStatus(userId, date) {
  const attendance = await db.Attendance.findOne({
    where: { userId, date }
  });
  
  if (!attendance) {
    return null;
  }
  
  // If user already checked in, don't change status
  if (attendance.checkIn) {
    return attendance;
  }
  
  // Determine status based on leave requests
  const newStatus = await determineAttendanceStatus(userId, date, attendance.checkIn);
  
  // Update if status changed
  if (attendance.status !== newStatus) {
    await attendance.update({ status: newStatus });
  }
  
  return attendance;
}

// single endpoint to perform actions: checkin, break, checkout
const actionAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, photo, date } = req.body; // action: 'checkin'|'break'|'checkout'
    const today = date || new Date().toISOString().slice(0,10);

    let record = await db.Attendance.findOne({ where: { userId, date: today } });
    if (!record) {
      record = await db.Attendance.create({ userId, date: today });
    }

    const nowTime = new Date().toTimeString().split(' ')[0];
    const settings = await getAttendanceSettings();

    if (action === 'checkin'){
      if (record.checkIn) return res.status(400).json({ message: 'Already checked in today' });
      if (!photo) return res.status(400).json({ message: 'Photo required for checkin' });
      
      // Check if today is a holiday for this user
      const isHoliday = await isUserHoliday(userId, today);
      // Note: We allow check-in on holidays (user might be working overtime)
      // But we can include this info in the response
      // save photo file
      const matches = photo.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid photo data' });
      const ext = matches[1].split('/').pop() || 'jpg';
      const data = matches[2];
      const filename = `u${userId}_${today}_checkin_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      const relativePath = `/uploads/${filename}`;
      
      // Calculate check-in status
      const checkInMinutes = timeToMinutes(nowTime);
      const expectedCheckInMinutes = timeToMinutes(settings.checkInTime);
      const toleranceMinutes = settings.checkInTolerance;
      let checkInStatus = 'onTime';
      let workStartTime = nowTime; // Default: mulai dari check in
      
      if (checkInMinutes < expectedCheckInMinutes) {
        // Check in before expected time = early
        // Perhitungan jam kerja mulai dari check in
        checkInStatus = 'early';
        workStartTime = nowTime;
      } else if (checkInMinutes > expectedCheckInMinutes) {
        // Check in after expected time
        const lateMinutes = checkInMinutes - expectedCheckInMinutes;
        if (lateMinutes > toleranceMinutes) {
          // Late: perhitungan jam kerja mulai dari jam yang ditentukan (bukan dari check in)
          checkInStatus = 'late';
          workStartTime = settings.checkInTime;
        } else {
          // Almost late: perhitungan jam kerja mulai dari jam yang ditentukan (bukan dari check in)
          checkInStatus = 'almostLate';
          workStartTime = settings.checkInTime;
        }
      } else {
        // Exactly on time
        checkInStatus = 'onTime';
        workStartTime = nowTime; // atau settings.checkInTime, sama saja
      }
      
      // Update record with check in info
      // Status is always 'Hadir' when user checks in
      await record.update({ 
        checkIn: nowTime, 
        checkInPhotoPath: relativePath, 
        status: 'Hadir',
        checkInStatus: checkInStatus,
        workStartTime: workStartTime,
        workHours: 0, // Reset work hours
        breakDurationMinutes: 0 // Reset break duration
      });
      
      // Reload record to get updated data
      await record.reload();
      return res.json({ message: 'Checked in', record });
    }

    if (action === 'break'){
      // Check if break is already started
      if (record.breakStart && !record.breakEnd) {
        // End break - Get back to work
        // Calculate work hours from workStartTime to breakStart
        // Then add break duration to total break time
        const breakStartMinutes = timeToMinutes(record.breakStart);
        const breakEndMinutes = timeToMinutes(nowTime);
        const breakDurationMinutes = breakEndMinutes - breakStartMinutes;
        const expectedBreakDuration = settings.breakDuration;
        const breakLate = breakDurationMinutes > expectedBreakDuration;
        
        // Calculate work hours before break
        if (record.workStartTime) {
          const workStartMinutes = timeToMinutes(record.workStartTime);
          const workBeforeBreakMinutes = breakStartMinutes - workStartMinutes;
          const workBeforeBreakHours = workBeforeBreakMinutes / 60;
          
          // Update work hours (add work before break)
          const currentWorkHours = parseFloat(record.workHours) || 0;
          const newWorkHours = currentWorkHours + workBeforeBreakHours;
          
          // Update break duration
          const currentBreakDuration = parseInt(record.breakDurationMinutes) || 0;
          const newBreakDuration = currentBreakDuration + breakDurationMinutes;
          
          // Update workStartTime to now (resume work)
          await record.update({ 
            breakEnd: nowTime,
            breakLate: breakLate,
            workHours: newWorkHours,
            breakDurationMinutes: newBreakDuration,
            workStartTime: nowTime // Resume work from now
          });
        } else {
          await record.update({ 
            breakEnd: nowTime,
            breakLate: breakLate
          });
        }
        
        await record.reload();
        return res.json({ message: 'Get back to work', record });
      } else if (record.breakStart && record.breakEnd) {
        return res.status(400).json({ message: 'Break already completed today' });
      } else {
        // Start break - Pause work calculation
        // Calculate work hours from workStartTime to now
        if (record.workStartTime) {
          const workStartMinutes = timeToMinutes(record.workStartTime);
          const nowMinutes = timeToMinutes(nowTime);
          const workMinutes = nowMinutes - workStartMinutes;
          const workHours = workMinutes / 60;
          
          // Add to existing work hours
          const currentWorkHours = parseFloat(record.workHours) || 0;
          const newWorkHours = currentWorkHours + workHours;
          
          await record.update({ 
            breakStart: nowTime,
            workHours: newWorkHours,
            workStartTime: null // Pause work calculation
          });
        } else {
          await record.update({ breakStart: nowTime });
        }
        
        await record.reload();
        return res.json({ message: 'Break started', record });
      }
    }

    if (action === 'checkout'){
      if (record.checkOut) return res.status(400).json({ message: 'Already checked out today' });
      if (!photo) return res.status(400).json({ message: 'Photo required for checkout' });
      // save photo
      const matches = photo.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid photo data' });
      const ext = matches[1].split('/').pop() || 'jpg';
      const data = matches[2];
      const filename = `u${userId}_${today}_checkout_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      const relativePath = `/uploads/${filename}`;
      
      // Check if early leave
      const checkOutMinutes = timeToMinutes(nowTime);
      const expectedCheckOutMinutes = timeToMinutes(settings.checkOutTime);
      const earlyLeave = checkOutMinutes < expectedCheckOutMinutes;
      
      // Calculate final work hours
      let finalWorkHours = parseFloat(record.workHours) || 0;
      
      // If work is still running (workStartTime exists), add work from workStartTime to now
      if (record.workStartTime) {
        const workStartMinutes = timeToMinutes(record.workStartTime);
        const nowMinutes = timeToMinutes(nowTime);
        const workMinutes = nowMinutes - workStartMinutes;
        const workHours = workMinutes / 60;
        finalWorkHours = finalWorkHours + workHours;
      }
      
      // Stop work calculation (set workStartTime to null)
      await record.update({ 
        checkOut: nowTime, 
        checkOutPhotoPath: relativePath,
        earlyLeave: earlyLeave,
        workHours: finalWorkHours,
        workStartTime: null // Stop work calculation
      });
      
      await record.reload();
      return res.json({ message: 'Checked out', record });
    }

    res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    console.error('Error in actionAttendance:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validasi error: ${errors}` });
    }
    res.status(500).json({ message: err.message || 'Gagal melakukan aksi absensi' });
  }
}

const createAttendance = async (req, res) => {
  try {
    const { date, checkIn, checkOut, status, note } = req.body;
    const userId = req.body.userId || req.user.id;
    const a = await db.Attendance.create({ userId, date, checkIn, checkOut, status, note });
    res.json(a);
  } catch (err) {
    console.error('Error creating attendance:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validasi error: ${errors}` });
    }
    res.status(400).json({ message: err.message || 'Gagal membuat attendance' });
  }
}

const updateAttendance = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid attendance ID' });
    }
    await db.Attendance.update(req.body, { where: { id } });
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ message: err.message || 'Gagal update attendance' });
  }
}

const deleteAttendance = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid attendance ID' });
    }
    await db.Attendance.destroy({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ message: err.message || 'Gagal menghapus attendance' });
  }
}

module.exports = { 
  listAll, 
  listByUser, 
  actionAttendance, 
  createAttendance, 
  updateAttendance, 
  deleteAttendance,
  syncAttendanceStatus,
  generateAttendanceRecords
};
