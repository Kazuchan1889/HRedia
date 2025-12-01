const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const attendanceController = require('../controllers/attendanceController');
const settingsController = require('../controllers/settingsController');
const leaveController = require('../controllers/leaveController');
const reportsController = require('../controllers/reportsController');
const payrollController = require('../controllers/payrollController');
const payrollSettingController = require('../controllers/payrollSettingController');
const notificationsController = require('../controllers/notificationsController');
const attendanceStatusRequestController = require('../controllers/attendanceStatusRequestController');
const dailyReportController = require('../controllers/dailyReportController');
const dailyReportEditRequestController = require('../controllers/dailyReportEditRequestController');
const performanceController = require('../controllers/performanceController');
const userHolidaySettingController = require('../controllers/userHolidaySettingController');
const userTimeSettingController = require('../controllers/userTimeSettingController');
const auth = require('../middleware/auth');

// Auth
router.post('/auth/login', authController.login);

// User profile (self) - MUST be before /users/:id to avoid route conflict
router.get('/users/me', auth(), (req, res, next) => {
  console.log('Route matched: GET /users/me');
  next();
}, userController.getMyProfile);
router.put('/users/me', auth(), (req, res, next) => {
  console.log('Route matched: PUT /users/me');
  next();
}, userController.updateMyProfile);

// Users (admin)
router.get('/users', auth('admin'), userController.listUsers);
router.post('/users', auth('admin'), userController.createUser);
// Only match numeric IDs to prevent "me" from matching
router.put('/users/:id', auth('admin'), (req, res, next) => {
  console.log('Route matched: PUT /users/:id with id =', req.params.id);
  // Prevent "me" from being treated as ID
  if (req.params.id === 'me') {
    console.error('ERROR: "me" matched /users/:id route! This should not happen.');
    return res.status(400).json({ message: 'Invalid user ID. Use /users/me for your own profile.' });
  }
  if (isNaN(parseInt(req.params.id))) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  next();
}, userController.updateUser);
router.delete('/users/:id', auth('admin'), (req, res, next) => {
  console.log('Route matched: DELETE /users/:id with id =', req.params.id);
  // Prevent "me" from being treated as ID
  if (req.params.id === 'me') {
    console.error('ERROR: "me" matched /users/:id route! This should not happen.');
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  if (isNaN(parseInt(req.params.id))) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  next();
}, userController.deleteUser);

// Attendance
router.get('/attendances', auth('admin'), attendanceController.listAll);
router.get('/attendances/me', auth(), attendanceController.listByUser);
router.get('/attendances/user/:userId', auth('admin'), attendanceController.listByUser);
router.post('/attendances', auth(), attendanceController.createAttendance);
router.post('/attendances/action', auth(), attendanceController.actionAttendance);
router.put('/attendances/:id', auth('admin'), attendanceController.updateAttendance);
router.delete('/attendances/:id', auth('admin'), attendanceController.deleteAttendance);

// Settings
router.get('/settings', auth('admin'), settingsController.getSettings);
router.post('/settings', auth('admin'), settingsController.setSetting);

// Leave requests
router.get('/leaverequests', auth(), leaveController.listRequests);
router.get('/leaverequests/pending', auth('admin'), leaveController.getPendingRequests);
router.post('/leaverequests', auth(), leaveController.createRequest);
router.put('/leaverequests/:id', auth('admin'), leaveController.updateRequest);

// Reports
router.get('/reports/attendances', auth('admin'), reportsController.attendancesCsv);
router.get('/reports/leaves', auth('admin'), reportsController.leavesCsv);
router.get('/reports/export-excel', auth('admin'), reportsController.exportAttendanceAndReports);

// Payroll
router.get('/payroll/generate', auth('admin'), payrollController.generatePayroll);
router.get('/payroll', auth('admin'), payrollController.listAllPayrolls);
router.get('/payroll/me', auth(), payrollController.getMyPayroll);

// Payroll Settings
router.get('/payroll-settings', auth('admin'), payrollSettingController.listPayrollSettings);
router.get('/payroll-settings/user/:userId', auth('admin'), payrollSettingController.getPayrollSetting);
router.post('/payroll-settings/user/:userId', auth('admin'), payrollSettingController.upsertPayrollSetting);
router.put('/payroll-settings/user/:userId', auth('admin'), payrollSettingController.upsertPayrollSetting);
router.get('/payroll-settings/calculate', auth('admin'), payrollSettingController.calculatePayroll);

// Notifications
router.get('/notifications', auth(), notificationsController.listNotifications);

// Attendance Status Requests
router.post('/attendance-status-requests', auth(), attendanceStatusRequestController.createRequest);
router.get('/attendance-status-requests', auth(), attendanceStatusRequestController.listRequests);
router.get('/attendance-status-requests/pending', auth('admin'), attendanceStatusRequestController.getPendingRequests);
router.put('/attendance-status-requests/:id', auth('admin'), attendanceStatusRequestController.updateRequest);

// Daily Reports
router.post('/daily-reports', auth(), dailyReportController.createReport);
router.get('/daily-reports', auth(), dailyReportController.listReports);
router.get('/daily-reports/settings', auth('admin'), dailyReportController.getReportSettings);
router.put('/daily-reports/settings', auth('admin'), dailyReportController.updateReportSettings);

// Daily Report Edit Requests
router.post('/daily-report-edit-requests', auth(), dailyReportEditRequestController.createRequest);
router.get('/daily-report-edit-requests', auth(), dailyReportEditRequestController.listRequests);
router.get('/daily-report-edit-requests/pending', auth('admin'), dailyReportEditRequestController.getPendingRequests);
router.put('/daily-report-edit-requests/:id', auth('admin'), dailyReportEditRequestController.updateRequest);

// Performance / KPI
router.get('/performance', auth('admin'), performanceController.getAllUsersKPI);
router.get('/performance/me', auth(), performanceController.getMyKPI); // User's own KPI
router.get('/performance/user/:userId', auth('admin'), performanceController.getUserKPI);

// User Holiday Settings
router.get('/user-holiday-settings', auth('admin'), userHolidaySettingController.listHolidaySettings);
router.get('/user-holiday-settings/user/:userId', auth('admin'), userHolidaySettingController.getHolidaySetting);
router.post('/user-holiday-settings/user/:userId', auth('admin'), userHolidaySettingController.upsertHolidaySetting);
router.put('/user-holiday-settings/user/:userId', auth('admin'), userHolidaySettingController.upsertHolidaySetting);
router.post('/user-holiday-settings/bulk-assign', auth('admin'), userHolidaySettingController.bulkAssignHolidaySettings);
router.delete('/user-holiday-settings/user/:userId', auth('admin'), userHolidaySettingController.deleteHolidaySetting);

// User Time Settings
router.get('/user-time-settings', auth('admin'), userTimeSettingController.listTimeSettings);
router.get('/user-time-settings/user/:userId', auth('admin'), userTimeSettingController.getTimeSetting);
router.post('/user-time-settings/user/:userId', auth('admin'), userTimeSettingController.upsertTimeSetting);
router.put('/user-time-settings/user/:userId', auth('admin'), userTimeSettingController.upsertTimeSetting);
router.post('/user-time-settings/bulk-assign', auth('admin'), userTimeSettingController.bulkAssignTimeSettings);
router.delete('/user-time-settings/user/:userId', auth('admin'), userTimeSettingController.deleteTimeSetting);

module.exports = router;
