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

// Get all payroll settings with user info
const listPayrollSettings = async (req, res) => {
  try {
    const settings = await db.PayrollSetting.findAll({
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'position', 'department', 'basicSalary', 'currency']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(settings);
  } catch (err) {
    console.error('Error listing payroll settings:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil data payroll settings' });
  }
};

// Get payroll setting for a specific user
const getPayrollSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const setting = await db.PayrollSetting.findOne({
      where: { userId },
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'username', 'employeeId', 'position', 'department', 'basicSalary', 'currency']
      }]
    });
    
    if (!setting) {
      // Return default settings if not found
      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }
      return res.json({
        userId: parseInt(userId),
        alphaDeduction: 0,
        izinDeduction: 0,
        lateDeduction: 0,
        breakLateDeduction: 0,
        earlyLeaveDeduction: 0,
        noReportDeduction: 0,
        maxLateAllowed: 0,
        maxBreakLateAllowed: 0,
        maxEarlyLeaveAllowed: 0,
        deductionType: 'percentage',
        perfectAttendanceBonus: 0,
        allReportsBonus: 0,
        isActive: true,
        User: user
      });
    }
    
    res.json(setting);
  } catch (err) {
    console.error('Error getting payroll setting:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil data payroll setting' });
  }
};

// Create or update payroll setting for a user
const upsertPayrollSetting = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      alphaDeduction,
      izinDeduction,
      lateDeduction,
      breakLateDeduction,
      earlyLeaveDeduction,
      noReportDeduction,
      maxLateAllowed,
      maxBreakLateAllowed,
      maxEarlyLeaveAllowed,
      deductionType,
      perfectAttendanceBonus,
      allReportsBonus,
      isActive
    } = req.body;

    // Validate userId exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Check if setting exists
    const existing = await db.PayrollSetting.findOne({ where: { userId } });
    
    let setting;
    if (existing) {
      // Update existing
      await db.PayrollSetting.update({
        alphaDeduction: alphaDeduction !== undefined ? alphaDeduction : existing.alphaDeduction,
        izinDeduction: izinDeduction !== undefined ? izinDeduction : existing.izinDeduction,
        lateDeduction: lateDeduction !== undefined ? lateDeduction : existing.lateDeduction,
        breakLateDeduction: breakLateDeduction !== undefined ? breakLateDeduction : existing.breakLateDeduction,
        earlyLeaveDeduction: earlyLeaveDeduction !== undefined ? earlyLeaveDeduction : existing.earlyLeaveDeduction,
        noReportDeduction: noReportDeduction !== undefined ? noReportDeduction : existing.noReportDeduction,
        maxLateAllowed: maxLateAllowed !== undefined ? maxLateAllowed : existing.maxLateAllowed,
        maxBreakLateAllowed: maxBreakLateAllowed !== undefined ? maxBreakLateAllowed : existing.maxBreakLateAllowed,
        maxEarlyLeaveAllowed: maxEarlyLeaveAllowed !== undefined ? maxEarlyLeaveAllowed : existing.maxEarlyLeaveAllowed,
        deductionType: deductionType || existing.deductionType,
        perfectAttendanceBonus: perfectAttendanceBonus !== undefined ? perfectAttendanceBonus : existing.perfectAttendanceBonus,
        allReportsBonus: allReportsBonus !== undefined ? allReportsBonus : existing.allReportsBonus,
        isActive: isActive !== undefined ? isActive : existing.isActive
      }, { where: { userId } });
      
      setting = await db.PayrollSetting.findOne({
        where: { userId },
        include: [{ model: db.User, attributes: ['id', 'name', 'username', 'employeeId', 'position', 'department', 'basicSalary', 'currency'] }]
      });
    } else {
      // Create new
      setting = await db.PayrollSetting.create({
        userId: parseInt(userId),
        alphaDeduction: alphaDeduction || 0,
        izinDeduction: izinDeduction || 0,
        lateDeduction: lateDeduction || 0,
        breakLateDeduction: breakLateDeduction || 0,
        earlyLeaveDeduction: earlyLeaveDeduction || 0,
        noReportDeduction: noReportDeduction || 0,
        maxLateAllowed: maxLateAllowed || 0,
        maxBreakLateAllowed: maxBreakLateAllowed || 0,
        maxEarlyLeaveAllowed: maxEarlyLeaveAllowed || 0,
        deductionType: deductionType || 'percentage',
        perfectAttendanceBonus: perfectAttendanceBonus || 0,
        allReportsBonus: allReportsBonus || 0,
        isActive: isActive !== undefined ? isActive : true
      });
      
      setting = await db.PayrollSetting.findOne({
        where: { id: setting.id },
        include: [{ model: db.User, attributes: ['id', 'name', 'username', 'employeeId', 'position', 'department', 'basicSalary', 'currency'] }]
      });
    }

    res.json(setting);
  } catch (err) {
    console.error('Error upserting payroll setting:', err);
    res.status(400).json({ message: err.message || 'Gagal menyimpan payroll setting' });
  }
};

// Calculate payroll for a user based on settings and attendance/reports
const calculatePayroll = async (req, res) => {
  try {
    const { userId, month } = req.query; // month format: YYYY-MM
    
    if (!userId || !month) {
      return res.status(400).json({ message: 'userId dan month (YYYY-MM) wajib diisi' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Get payroll setting
    const setting = await db.PayrollSetting.findOne({ where: { userId } });
    if (!setting || !setting.isActive) {
      return res.json({
        userId: parseInt(userId),
        month,
        baseSalary: user.basicSalary || 0,
        currency: user.currency || 'IDR',
        deductions: 0,
        bonuses: 0,
        finalSalary: user.basicSalary || 0,
        details: {
          message: 'Payroll setting tidak ditemukan atau tidak aktif'
        }
      });
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Format month harus YYYY-MM' });
    }
    
    // Calculate date range
    const startDate = month + '-01';
    const endDate = getEndDateOfMonth(month);

    // Get attendance data
    const attendances = await db.Attendance.findAll({
      where: {
        userId,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    // Get daily reports
    const dailyReports = await db.DailyReport.findAll({
      where: {
        userId,
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    // Count occurrences
    const alphaCount = attendances.filter(a => a.status === 'Alfa').length;
    const izinCount = attendances.filter(a => a.status === 'Izin').length;
    const lateCount = attendances.filter(a => a.checkInStatus === 'late').length;
    const breakLateCount = attendances.filter(a => a.breakLate === true).length;
    const earlyLeaveCount = attendances.filter(a => a.earlyLeave === true).length;
    
    // Count working days (days with attendance)
    const workingDays = attendances.filter(a => a.status === 'Hadir' && a.checkIn).length;
    const [year, monthNum] = month.split('-').map(Number);
    const totalDaysInMonth = getLastDayOfMonth(year, monthNum);
    const expectedReports = workingDays;
    const missingReports = expectedReports - dailyReports.length;

    // Calculate base salary
    const baseSalary = parseFloat(user.basicSalary) || 0;

    // Calculate deductions
    let totalDeductions = 0;
    const deductionDetails = {};

    if (setting.deductionType === 'percentage') {
      // Percentage-based deductions
      if (alphaCount > 0) {
        const deduction = (baseSalary * parseFloat(setting.alphaDeduction) / 100) * alphaCount;
        totalDeductions += deduction;
        deductionDetails.alpha = { count: alphaCount, deduction };
      }
      
      if (izinCount > 0) {
        const deduction = (baseSalary * parseFloat(setting.izinDeduction) / 100) * izinCount;
        totalDeductions += deduction;
        deductionDetails.izin = { count: izinCount, deduction };
      }
      
      const lateDeductionCount = Math.max(0, lateCount - (setting.maxLateAllowed || 0));
      if (lateDeductionCount > 0) {
        const deduction = (baseSalary * parseFloat(setting.lateDeduction) / 100) * lateDeductionCount;
        totalDeductions += deduction;
        deductionDetails.late = { count: lateDeductionCount, deduction };
      }
      
      const breakLateDeductionCount = Math.max(0, breakLateCount - (setting.maxBreakLateAllowed || 0));
      if (breakLateDeductionCount > 0) {
        const deduction = (baseSalary * parseFloat(setting.breakLateDeduction) / 100) * breakLateDeductionCount;
        totalDeductions += deduction;
        deductionDetails.breakLate = { count: breakLateDeductionCount, deduction };
      }
      
      const earlyLeaveDeductionCount = Math.max(0, earlyLeaveCount - (setting.maxEarlyLeaveAllowed || 0));
      if (earlyLeaveDeductionCount > 0) {
        const deduction = (baseSalary * parseFloat(setting.earlyLeaveDeduction) / 100) * earlyLeaveDeductionCount;
        totalDeductions += deduction;
        deductionDetails.earlyLeave = { count: earlyLeaveDeductionCount, deduction };
      }
      
      if (missingReports > 0) {
        const deduction = (baseSalary * parseFloat(setting.noReportDeduction) / 100) * missingReports;
        totalDeductions += deduction;
        deductionDetails.missingReports = { count: missingReports, deduction };
      }
    } else {
      // Fixed amount deductions
      if (alphaCount > 0) {
        const deduction = parseFloat(setting.alphaDeduction) * alphaCount;
        totalDeductions += deduction;
        deductionDetails.alpha = { count: alphaCount, deduction };
      }
      
      if (izinCount > 0) {
        const deduction = parseFloat(setting.izinDeduction) * izinCount;
        totalDeductions += deduction;
        deductionDetails.izin = { count: izinCount, deduction };
      }
      
      const lateDeductionCount = Math.max(0, lateCount - (setting.maxLateAllowed || 0));
      if (lateDeductionCount > 0) {
        const deduction = parseFloat(setting.lateDeduction) * lateDeductionCount;
        totalDeductions += deduction;
        deductionDetails.late = { count: lateDeductionCount, deduction };
      }
      
      const breakLateDeductionCount = Math.max(0, breakLateCount - (setting.maxBreakLateAllowed || 0));
      if (breakLateDeductionCount > 0) {
        const deduction = parseFloat(setting.breakLateDeduction) * breakLateDeductionCount;
        totalDeductions += deduction;
        deductionDetails.breakLate = { count: breakLateDeductionCount, deduction };
      }
      
      const earlyLeaveDeductionCount = Math.max(0, earlyLeaveCount - (setting.maxEarlyLeaveAllowed || 0));
      if (earlyLeaveDeductionCount > 0) {
        const deduction = parseFloat(setting.earlyLeaveDeduction) * earlyLeaveDeductionCount;
        totalDeductions += deduction;
        deductionDetails.earlyLeave = { count: earlyLeaveDeductionCount, deduction };
      }
      
      if (missingReports > 0) {
        const deduction = parseFloat(setting.noReportDeduction) * missingReports;
        totalDeductions += deduction;
        deductionDetails.missingReports = { count: missingReports, deduction };
      }
    }

    // Calculate bonuses
    let totalBonuses = 0;
    const bonusDetails = {};

    // Perfect attendance bonus (no alpha, izin, late, breakLate, earlyLeave)
    if (alphaCount === 0 && izinCount === 0 && lateCount === 0 && breakLateCount === 0 && earlyLeaveCount === 0 && workingDays > 0) {
      if (setting.deductionType === 'percentage') {
        totalBonuses += (baseSalary * parseFloat(setting.perfectAttendanceBonus) / 100);
      } else {
        totalBonuses += parseFloat(setting.perfectAttendanceBonus);
      }
      bonusDetails.perfectAttendance = { bonus: setting.deductionType === 'percentage' ? (baseSalary * parseFloat(setting.perfectAttendanceBonus) / 100) : parseFloat(setting.perfectAttendanceBonus) };
    }

    // All reports bonus
    if (missingReports === 0 && expectedReports > 0) {
      if (setting.deductionType === 'percentage') {
        totalBonuses += (baseSalary * parseFloat(setting.allReportsBonus) / 100);
      } else {
        totalBonuses += parseFloat(setting.allReportsBonus);
      }
      bonusDetails.allReports = { bonus: setting.deductionType === 'percentage' ? (baseSalary * parseFloat(setting.allReportsBonus) / 100) : parseFloat(setting.allReportsBonus) };
    }

    // Calculate final salary
    const finalSalary = Math.max(0, baseSalary - totalDeductions + totalBonuses);

    res.json({
      userId: parseInt(userId),
      month,
      baseSalary,
      currency: user.currency || 'IDR',
      deductions: totalDeductions,
      bonuses: totalBonuses,
      finalSalary,
      details: {
        workingDays,
        totalDaysInMonth,
        alphaCount,
        izinCount,
        lateCount,
        breakLateCount,
        earlyLeaveCount,
        expectedReports,
        submittedReports: dailyReports.length,
        missingReports,
        deductionDetails,
        bonusDetails
      }
    });
  } catch (err) {
    console.error('Error calculating payroll:', err);
    res.status(500).json({ message: err.message || 'Gagal menghitung payroll' });
  }
};

module.exports = {
  listPayrollSettings,
  getPayrollSetting,
  upsertPayrollSetting,
  calculatePayroll
};

