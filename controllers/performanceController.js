const db = require('../models');

// Helper function to calculate hours between two times
function calculateHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  
  const [inHours, inMinutes] = checkIn.split(':').map(Number);
  const [outHours, outMinutes] = checkOut.split(':').map(Number);
  
  const inTotalMinutes = inHours * 60 + inMinutes;
  const outTotalMinutes = outHours * 60 + outMinutes;
  
  const diffMinutes = outTotalMinutes - inTotalMinutes;
  return diffMinutes / 60; // Convert to hours
}

// Helper function to get work hours from attendance record
// Uses workHours field if available, otherwise calculates from checkIn/checkOut
function getWorkHours(attendance) {
  // If workHours is already calculated, use it
  if (attendance.workHours != null && attendance.workHours > 0) {
    return parseFloat(attendance.workHours);
  }
  
  // Fallback: calculate from checkIn and checkOut (old method)
  if (attendance.checkIn && attendance.checkOut) {
    return calculateHours(attendance.checkIn, attendance.checkOut);
  }
  
  return 0;
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

// Helper function to get last day of month
function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// Helper function to get end date of month (YYYY-MM-DD format)
function getEndDateOfMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const lastDay = getLastDayOfMonth(year, month);
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

// Get KPI for all users
const getAllUsersKPI = async (req, res) => {
  try {
    const { month, year, mode = 'monthly' } = req.query; // mode: 'monthly' or 'yearly'
    
    let startDate, endDate, periodLabel;
    
    if (mode === 'yearly') {
      // Yearly mode
      let targetYear = year;
      if (!targetYear) {
        const now = new Date();
        targetYear = now.getFullYear().toString();
      }
      
      // Validate year format
      if (!/^\d{4}$/.test(targetYear)) {
        return res.status(400).json({ message: 'Format year harus YYYY' });
      }
      
      startDate = `${targetYear}-01-01`;
      endDate = `${targetYear}-12-31`;
      periodLabel = targetYear;
    } else {
      // Monthly mode (default)
      let targetMonth = month;
      if (!targetMonth) {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        targetMonth = `${year}-${monthNum}`;
      }
      
      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        return res.status(400).json({ message: 'Format month harus YYYY-MM' });
      }
      
      startDate = targetMonth + '-01';
      endDate = getEndDateOfMonth(targetMonth);
      periodLabel = targetMonth;
    }
    
    // Get all users
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'username', 'employeeId', 'position', 'department'],
      where: { role: 'user' }, // Only regular users, not admin
      order: [['name', 'ASC']]
    });
    
    const kpiData = [];
    
    // Calculate KPI for each user
    for (const user of users) {
      // Get attendance data
      const attendances = await db.Attendance.findAll({
        where: {
          userId: user.id,
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Calculate total work hours
      let totalWorkHours = 0;
      let presentDays = 0;
      attendances.forEach(att => {
        if (att.checkIn && att.checkOut && att.status === 'Hadir') {
          const hours = getWorkHours(att);
          totalWorkHours += hours;
          presentDays++;
        }
      });
      
      // Count izin (leave requests with type 'Izin')
      // For yearly, we need to count days, not just requests
      let izinCount = 0;
      if (mode === 'yearly') {
        const izinRequests = await db.LeaveRequest.findAll({
          where: {
            userId: user.id,
            type: 'Izin',
            status: 'Approved',
            startDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          }
        });
        // Calculate total days
        izinRequests.forEach(req => {
          const days = calculateDays(req.startDate, req.endDate);
          izinCount += days;
        });
      } else {
        izinCount = await db.LeaveRequest.count({
          where: {
            userId: user.id,
            type: 'Izin',
            status: 'Approved',
            startDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          }
        });
      }
      
      // Count cuti (leave requests with type 'Cuti')
      // For yearly, we need to count days, not just requests
      let cutiCount = 0;
      if (mode === 'yearly') {
        const cutiRequests = await db.LeaveRequest.findAll({
          where: {
            userId: user.id,
            type: 'Cuti',
            status: 'Approved',
            startDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          }
        });
        // Calculate total days
        cutiRequests.forEach(req => {
          const days = calculateDays(req.startDate, req.endDate);
          cutiCount += days;
        });
      } else {
        cutiCount = await db.LeaveRequest.count({
          where: {
            userId: user.id,
            type: 'Cuti',
            status: 'Approved',
            startDate: {
              [db.Sequelize.Op.between]: [startDate, endDate]
            }
          }
        });
      }
      
      // Get report frequency setting
      const reportSetting = await db.Setting.findOne({ where: { key: 'reportFrequency' } });
      const reportFrequency = reportSetting ? reportSetting.value : 'daily';
      
      // Count daily reports
      const reportCount = await db.DailyReport.count({
        where: {
          userId: user.id,
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Calculate KPI score (0-100)
      // Formula: 
      // - Work hours: 40% weight (normalized to 8 hours/day * working days)
      // - Reports: 30% weight (normalized to expected reports based on frequency)
      // - Izin: 15% weight (penalty, less is better)
      // - Cuti: 15% weight (penalty, less is better)
      
      const expectedWorkHours = presentDays * 8; // 8 hours per day
      const workHoursScore = expectedWorkHours > 0 
        ? Math.min(100, (totalWorkHours / expectedWorkHours) * 100) 
        : 0;
      
      // Calculate expected reports based on frequency
      let expectedReports;
      if (reportFrequency === 'weekly') {
        // For weekly: count number of weeks in the period
        if (mode === 'yearly') {
          // For yearly: approximately 52 weeks (or 53 for leap years)
          const year = parseInt(periodLabel);
          const isLeapYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
          expectedReports = isLeapYear ? 53 : 52;
        } else {
          // For monthly: count weeks in the month
          // Calculate total days in month
          const [year, month] = periodLabel.split('-').map(Number);
          const totalDaysInMonth = getLastDayOfMonth(year, month);
          // Count weeks: divide total days by 7 and round up
          expectedReports = Math.ceil(totalDaysInMonth / 7);
        }
      } else {
        // For daily: expected reports = present days (hari kerja)
        expectedReports = presentDays;
      }
      
      const reportsScore = expectedReports > 0 
        ? Math.min(100, (reportCount / expectedReports) * 100) 
        : 0;
      
      // Penalty for izin and cuti (less is better)
      let totalDays;
      if (mode === 'yearly') {
        // For yearly, use 365 days (or 366 for leap year)
        const year = parseInt(periodLabel);
        totalDays = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
      } else {
        const [year, month] = periodLabel.split('-').map(Number);
        totalDays = getLastDayOfMonth(year, month);
      }
      const izinPenalty = Math.max(0, 100 - (izinCount / totalDays) * 100);
      const cutiPenalty = Math.max(0, 100 - (cutiCount / totalDays) * 100);
      
      // Calculate final KPI score
      const kpiScore = (
        workHoursScore * 0.40 +
        reportsScore * 0.30 +
        izinPenalty * 0.15 +
        cutiPenalty * 0.15
      );
      
      kpiData.push({
        userId: user.id,
        name: user.name,
        username: user.username,
        employeeId: user.employeeId,
        position: user.position,
        department: user.department,
        metrics: {
          totalWorkHours: Math.round(totalWorkHours * 100) / 100,
          presentDays,
          izinCount,
          cutiCount,
          reportCount,
          expectedReports,
          reportFrequency
        },
        kpiScore: Math.round(kpiScore * 100) / 100
      });
    }
    
    // Calculate average KPI
    const avgKPI = kpiData.length > 0
      ? kpiData.reduce((sum, item) => sum + item.kpiScore, 0) / kpiData.length
      : 0;
    
    // Mark users below average
    const kpiDataWithWarning = kpiData.map(item => ({
      ...item,
      isBelowAverage: item.kpiScore < avgKPI,
      warning: item.kpiScore < avgKPI 
        ? `KPI di bawah rata-rata (${Math.round(avgKPI * 100) / 100})` 
        : null
    }));
    
    res.json({
      mode,
      period: periodLabel,
      averageKPI: Math.round(avgKPI * 100) / 100,
      users: kpiDataWithWarning.sort((a, b) => b.kpiScore - a.kpiScore) // Sort by KPI descending
    });
  } catch (err) {
    console.error('Error calculating KPI:', err);
    res.status(500).json({ message: err.message || 'Gagal menghitung KPI' });
  }
};

// Get KPI for a specific user
const getUserKPI = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, mode = 'monthly' } = req.query;
    
    let startDate, endDate, periodLabel;
    
    if (mode === 'yearly') {
      // Yearly mode
      let targetYear = year;
      if (!targetYear) {
        const now = new Date();
        targetYear = now.getFullYear().toString();
      }
      
      // Validate year format
      if (!/^\d{4}$/.test(targetYear)) {
        return res.status(400).json({ message: 'Format year harus YYYY' });
      }
      
      startDate = `${targetYear}-01-01`;
      endDate = `${targetYear}-12-31`;
      periodLabel = targetYear;
    } else {
      // Monthly mode (default)
      let targetMonth = month;
      if (!targetMonth) {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        targetMonth = `${year}-${monthNum}`;
      }
      
      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        return res.status(400).json({ message: 'Format month harus YYYY-MM' });
      }
      
      startDate = targetMonth + '-01';
      endDate = getEndDateOfMonth(targetMonth);
      periodLabel = targetMonth;
    }
    
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    // Get attendance data
    const attendances = await db.Attendance.findAll({
      where: {
        userId: user.id,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate total work hours
    let totalWorkHours = 0;
    let presentDays = 0;
    attendances.forEach(att => {
      if (att.checkIn && att.checkOut && att.status === 'Hadir') {
          const hours = getWorkHours(att);
        totalWorkHours += hours;
        presentDays++;
      }
    });
    
    // Count izin
    let izinCount = 0;
    if (mode === 'yearly') {
      const izinRequests = await db.LeaveRequest.findAll({
        where: {
          userId: user.id,
          type: 'Izin',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      izinRequests.forEach(req => {
        const days = calculateDays(req.startDate, req.endDate);
        izinCount += days;
      });
    } else {
      izinCount = await db.LeaveRequest.count({
        where: {
          userId: user.id,
          type: 'Izin',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
    }
    
    // Count cuti
    let cutiCount = 0;
    if (mode === 'yearly') {
      const cutiRequests = await db.LeaveRequest.findAll({
        where: {
          userId: user.id,
          type: 'Cuti',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      cutiRequests.forEach(req => {
        const days = calculateDays(req.startDate, req.endDate);
        cutiCount += days;
      });
    } else {
      cutiCount = await db.LeaveRequest.count({
        where: {
          userId: user.id,
          type: 'Cuti',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
    }
    
    // Get report frequency setting
    const reportSetting = await db.Setting.findOne({ where: { key: 'reportFrequency' } });
    const reportFrequency = reportSetting ? reportSetting.value : 'daily';
    
    // Count daily reports
    const reportCount = await db.DailyReport.count({
      where: {
        userId: user.id,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate KPI score
    const expectedWorkHours = presentDays * 8;
    const workHoursScore = expectedWorkHours > 0 
      ? Math.min(100, (totalWorkHours / expectedWorkHours) * 100) 
      : 0;
    
    // Calculate expected reports based on frequency
    let expectedReports;
    if (reportFrequency === 'weekly') {
      // For weekly: count number of weeks in the period
      if (mode === 'yearly') {
        // For yearly: approximately 52 weeks (or 53 for leap years)
        const year = parseInt(periodLabel);
        const isLeapYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
        expectedReports = isLeapYear ? 53 : 52;
      } else {
        // For monthly: count weeks in the month
        // Calculate total days in month
        const [year, month] = periodLabel.split('-').map(Number);
        const totalDaysInMonth = getLastDayOfMonth(year, month);
        // Count weeks: divide total days by 7 and round up
        expectedReports = Math.ceil(totalDaysInMonth / 7);
      }
    } else {
      // For daily: expected reports = present days (hari kerja)
      expectedReports = presentDays;
    }
    
    const reportsScore = expectedReports > 0 
      ? Math.min(100, (reportCount / expectedReports) * 100) 
      : 0;
    
    let totalDays;
    if (mode === 'yearly') {
      const year = parseInt(periodLabel);
      totalDays = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    } else {
      const [year, month] = periodLabel.split('-').map(Number);
      totalDays = getLastDayOfMonth(year, month);
    }
    const izinPenalty = Math.max(0, 100 - (izinCount / totalDays) * 100);
    const cutiPenalty = Math.max(0, 100 - (cutiCount / totalDays) * 100);
    
    const kpiScore = (
      workHoursScore * 0.40 +
      reportsScore * 0.30 +
      izinPenalty * 0.15 +
      cutiPenalty * 0.15
    );
    
    res.json({
      userId: user.id,
      name: user.name,
      username: user.username,
      mode,
      period: periodLabel,
      metrics: {
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        presentDays,
        izinCount,
        cutiCount,
        reportCount,
        expectedReports,
        reportFrequency
      },
      kpiScore: Math.round(kpiScore * 100) / 100,
      breakdown: {
        workHoursScore: Math.round(workHoursScore * 100) / 100,
        reportsScore: Math.round(reportsScore * 100) / 100,
        izinPenalty: Math.round(izinPenalty * 100) / 100,
        cutiPenalty: Math.round(cutiPenalty * 100) / 100
      }
    });
  } catch (err) {
    console.error('Error calculating user KPI:', err);
    res.status(500).json({ message: err.message || 'Gagal menghitung KPI user' });
  }
};

// Get current user's own KPI
const getMyKPI = async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    const { month, year, mode = 'monthly' } = req.query;
    
    let startDate, endDate, periodLabel;
    
    if (mode === 'yearly') {
      // Yearly mode
      let targetYear = year;
      if (!targetYear) {
        const now = new Date();
        targetYear = now.getFullYear().toString();
      }
      
      // Validate year format
      if (!/^\d{4}$/.test(targetYear)) {
        return res.status(400).json({ message: 'Format year harus YYYY' });
      }
      
      startDate = `${targetYear}-01-01`;
      endDate = `${targetYear}-12-31`;
      periodLabel = targetYear;
    } else {
      // Monthly mode (default)
      let targetMonth = month;
      if (!targetMonth) {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        targetMonth = `${year}-${monthNum}`;
      }
      
      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        return res.status(400).json({ message: 'Format month harus YYYY-MM' });
      }
      
      startDate = targetMonth + '-01';
      endDate = getEndDateOfMonth(targetMonth);
      periodLabel = targetMonth;
    }
    
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    // Get attendance data
    const attendances = await db.Attendance.findAll({
      where: {
        userId: user.id,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate total work hours
    let totalWorkHours = 0;
    let presentDays = 0;
    attendances.forEach(att => {
      if (att.checkIn && att.checkOut && att.status === 'Hadir') {
          const hours = getWorkHours(att);
        totalWorkHours += hours;
        presentDays++;
      }
    });
    
    // Count izin
    let izinCount = 0;
    if (mode === 'yearly') {
      const izinRequests = await db.LeaveRequest.findAll({
        where: {
          userId: user.id,
          type: 'Izin',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      izinRequests.forEach(req => {
        const days = calculateDays(req.startDate, req.endDate);
        izinCount += days;
      });
    } else {
      izinCount = await db.LeaveRequest.count({
        where: {
          userId: user.id,
          type: 'Izin',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
    }
    
    // Count cuti
    let cutiCount = 0;
    if (mode === 'yearly') {
      const cutiRequests = await db.LeaveRequest.findAll({
        where: {
          userId: user.id,
          type: 'Cuti',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
      cutiRequests.forEach(req => {
        const days = calculateDays(req.startDate, req.endDate);
        cutiCount += days;
      });
    } else {
      cutiCount = await db.LeaveRequest.count({
        where: {
          userId: user.id,
          type: 'Cuti',
          status: 'Approved',
          startDate: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      });
    }
    
    // Get report frequency setting
    const reportSetting = await db.Setting.findOne({ where: { key: 'reportFrequency' } });
    const reportFrequency = reportSetting ? reportSetting.value : 'daily';
    
    // Count daily reports
    const reportCount = await db.DailyReport.count({
      where: {
        userId: user.id,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });
    
    // Calculate KPI score
    const expectedWorkHours = presentDays * 8;
    const workHoursScore = expectedWorkHours > 0 
      ? Math.min(100, (totalWorkHours / expectedWorkHours) * 100) 
      : 0;
    
    // Calculate expected reports based on frequency
    let expectedReports;
    if (reportFrequency === 'weekly') {
      // For weekly: count number of weeks in the period
      if (mode === 'yearly') {
        // For yearly: approximately 52 weeks (or 53 for leap years)
        const year = parseInt(periodLabel);
        const isLeapYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
        expectedReports = isLeapYear ? 53 : 52;
      } else {
        // For monthly: count weeks in the month
        // Calculate total days in month
        const [year, month] = periodLabel.split('-').map(Number);
        const totalDaysInMonth = getLastDayOfMonth(year, month);
        // Count weeks: divide total days by 7 and round up
        expectedReports = Math.ceil(totalDaysInMonth / 7);
      }
    } else {
      // For daily: expected reports = present days (hari kerja)
      expectedReports = presentDays;
    }
    
    const reportsScore = expectedReports > 0 
      ? Math.min(100, (reportCount / expectedReports) * 100) 
      : 0;
    
    let totalDays;
    if (mode === 'yearly') {
      const year = parseInt(periodLabel);
      totalDays = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    } else {
      const [year, month] = periodLabel.split('-').map(Number);
      totalDays = getLastDayOfMonth(year, month);
    }
    const izinPenalty = Math.max(0, 100 - (izinCount / totalDays) * 100);
    const cutiPenalty = Math.max(0, 100 - (cutiCount / totalDays) * 100);
    
    const kpiScore = (
      workHoursScore * 0.40 +
      reportsScore * 0.30 +
      izinPenalty * 0.15 +
      cutiPenalty * 0.15
    );
    
    res.json({
      userId: user.id,
      name: user.name,
      username: user.username,
      mode,
      period: periodLabel,
      metrics: {
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        presentDays,
        izinCount,
        cutiCount,
        reportCount,
        expectedReports,
        reportFrequency
      },
      kpiScore: Math.round(kpiScore * 100) / 100,
      breakdown: {
        workHoursScore: Math.round(workHoursScore * 100) / 100,
        reportsScore: Math.round(reportsScore * 100) / 100,
        izinPenalty: Math.round(izinPenalty * 100) / 100,
        cutiPenalty: Math.round(cutiPenalty * 100) / 100
      }
    });
  } catch (err) {
    console.error('Error calculating my KPI:', err);
    res.status(500).json({ message: err.message || 'Gagal menghitung KPI' });
  }
};

module.exports = {
  getAllUsersKPI,
  getUserKPI,
  getMyKPI
};

