const db = require('../models');
const XLSX = require('xlsx');

function toCsv(rows, headers){
  const lines = [headers.join(',')];
  for(const r of rows){
    const line = headers.map(h => {
      const v = r[h]===undefined || r[h]===null ? '' : String(r[h]).replace(/"/g,'""');
      return `"${v}"`;
    }).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

const attendancesCsv = async (req,res) => {
  try {
    const { month } = req.query; // format YYYY-MM
    const where = {};
    if (month){
      const start = month + '-01';
      const end = month + '-31';
      where.date = { [db.Sequelize.Op.between]: [start, end] };
    }
    const rows = await db.Attendance.findAll({ where, include: [{ model: db.User, attributes: ['id','name','username'] }], order:[['date','ASC']] });
    const data = rows.map(r => ({ user: r.User?.name || '', username: r.User?.username || '', date: r.date, checkIn: r.checkIn, checkOut: r.checkOut, breakTime: r.breakTime, status: r.status }));
    const csv = toCsv(data, ['user','username','date','checkIn','breakTime','checkOut','status']);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="attendances.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error generating attendances CSV:', err);
    res.status(500).json({ message: err.message || 'Gagal generate CSV attendances' });
  }
}

const leavesCsv = async (req,res) => {
  try {
    const { month } = req.query;
    const where = {};
    if (month){
      const start = month + '-01';
      const end = month + '-31';
      where.startDate = { [db.Sequelize.Op.between]: [start, end] };
    }
    const rows = await db.LeaveRequest.findAll({ where, include: [{ model: db.User, attributes: ['id','name','username'] }], order:[['startDate','ASC']] });
    const data = rows.map(r=> ({ user: r.User?.name||'', username: r.User?.username||'', startDate: r.startDate, endDate: r.endDate, reason: r.reason, status: r.status }));
    const csv = toCsv(data, ['user','username','startDate','endDate','reason','status']);
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="leaves.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error generating leaves CSV:', err);
    res.status(500).json({ message: err.message || 'Gagal generate CSV leaves' });
  }
}

const exportAttendanceAndReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate dan endDate wajib diisi (format: YYYY-MM-DD)' });
    }

    // Get attendance data
    const attendances = await db.Attendance.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [{ 
        model: db.User, 
        attributes: ['id', 'name', 'username', 'employeeId', 'position'] 
      }],
      order: [['date', 'ASC'], ['userId', 'ASC']]
    });

    // Get daily reports data
    const dailyReports = await db.DailyReport.findAll({
      where: {
        date: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [{ 
        model: db.User, 
        attributes: ['id', 'name', 'username', 'employeeId', 'position'] 
      }],
      order: [['date', 'ASC'], ['userId', 'ASC']]
    });

    // Create a map of reports by userId and date for quick lookup
    const reportsMap = new Map();
    dailyReports.forEach(r => {
      const key = `${r.userId}_${r.date}`;
      reportsMap.set(key, r);
    });

    // Prepare attendance data for Excel
    const attendanceData = attendances.map(a => {
      const reportKey = `${a.userId}_${a.date}`;
      const report = reportsMap.get(reportKey);
      
      // Get first 100 characters of report content for preview
      const reportContentPreview = report && report.content 
        ? (report.content.length > 100 ? report.content.substring(0, 100) + '...' : report.content)
        : '';

      return {
        'Nama': a.User?.name || '',
        'Username': a.User?.username || '',
        'Employee ID': a.User?.employeeId || '',
        'Posisi': a.User?.position || '',
        'Tanggal': a.date || '',
        'Check In': a.checkIn || '',
        'Check Out': a.checkOut || '',
        'Break Start': a.breakStart || '',
        'Break End': a.breakEnd || '',
        'Status': a.status || '',
        'Check In Status': a.checkInStatus || '',
        'Break Late': a.breakLate ? 'Ya' : 'Tidak',
        'Early Leave': a.earlyLeave ? 'Ya' : 'Tidak',
        'Ada Laporan': report ? 'Ya' : 'Tidak',
        'Konten Laporan': reportContentPreview,
        'Laporan Terlambat': report && report.isLate ? 'Ya' : (report ? 'Tidak' : ''),
        'Note': a.note || ''
      };
    });

    // Prepare daily reports data for Excel
    const reportsData = dailyReports.map(r => ({
      'Nama': r.User?.name || '',
      'Username': r.User?.username || '',
      'Employee ID': r.User?.employeeId || '',
      'Posisi': r.User?.position || '',
      'Tanggal': r.date || '',
      'Konten Laporan': r.content || '',
      'File Name': r.fileName || '',
      'File Type': r.fileType || '',
      'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString('id-ID') : '',
      'Terlambat': r.isLate ? 'Ya' : 'Tidak'
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create attendance sheet
    const attendanceWS = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceWS, 'Data Absensi');

    // Create reports sheet
    const reportsWS = XLSX.utils.json_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportsWS, 'Data Laporan');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    const filename = `export_absensi_laporan_${startDate}_${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting Excel:', err);
    res.status(500).json({ message: err.message || 'Gagal export Excel' });
  }
};

module.exports = { attendancesCsv, leavesCsv, exportAttendanceAndReports };
