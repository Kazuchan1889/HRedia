const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Attendance = require('./attendance')(sequelize, Sequelize.DataTypes);
db.LeaveRequest = require('./leaverequest')(sequelize, Sequelize.DataTypes);
db.Setting = require('./setting')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notification')(sequelize, Sequelize.DataTypes);
db.AttendanceStatusRequest = require('./attendancestatusrequest')(sequelize, Sequelize.DataTypes);
db.DailyReport = require('./dailyreport')(sequelize, Sequelize.DataTypes);
db.DailyReportEditRequest = require('./dailyreporteditrequest')(sequelize, Sequelize.DataTypes);
db.PayrollSetting = require('./payrollsetting')(sequelize, Sequelize.DataTypes);
db.UserHolidaySetting = require('./userholidaysetting')(sequelize, Sequelize.DataTypes);
db.UserTimeSetting = require('./usertimesetting')(sequelize, Sequelize.DataTypes);

// Associations
db.User.hasMany(db.Attendance, { foreignKey: 'userId' });
db.Attendance.belongsTo(db.User, { foreignKey: 'userId' });

// Settings - no associations

db.User.hasMany(db.LeaveRequest, { foreignKey: 'userId' });
db.LeaveRequest.belongsTo(db.User, { foreignKey: 'userId' });

db.Notification.belongsTo(db.User, { foreignKey: 'userId' });

db.Attendance.hasMany(db.AttendanceStatusRequest, { foreignKey: 'attendanceId' });
db.AttendanceStatusRequest.belongsTo(db.Attendance, { foreignKey: 'attendanceId' });
db.User.hasMany(db.AttendanceStatusRequest, { foreignKey: 'userId' });
db.AttendanceStatusRequest.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.DailyReport, { foreignKey: 'userId' });
db.DailyReport.belongsTo(db.User, { foreignKey: 'userId' });

db.DailyReport.hasMany(db.DailyReportEditRequest, { foreignKey: 'dailyReportId' });
db.DailyReportEditRequest.belongsTo(db.DailyReport, { foreignKey: 'dailyReportId' });
db.User.hasMany(db.DailyReportEditRequest, { foreignKey: 'userId' });
db.DailyReportEditRequest.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasOne(db.PayrollSetting, { foreignKey: 'userId' });
db.PayrollSetting.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasOne(db.UserHolidaySetting, { foreignKey: 'userId' });
db.UserHolidaySetting.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasOne(db.UserTimeSetting, { foreignKey: 'userId' });
db.UserTimeSetting.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
