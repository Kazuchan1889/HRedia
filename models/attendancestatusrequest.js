module.exports = (sequelize, DataTypes) => {
  const AttendanceStatusRequest = sequelize.define('AttendanceStatusRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendanceId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    currentStatus: { type: DataTypes.STRING, allowNull: false }, // 'late', 'breakLate', 'earlyLeave'
    requestedStatus: { type: DataTypes.STRING, allowNull: false }, // 'onTime', 'almostLate', 'normal', 'onTimeCheckout'
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
    adminNote: { type: DataTypes.TEXT }
  }, { tableName: 'attendance_status_requests' });

  return AttendanceStatusRequest;
};

