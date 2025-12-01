module.exports = (sequelize, DataTypes) => {
  const AttendanceCorrectionRequest = sequelize.define('AttendanceCorrectionRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendanceId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    currentStatus: { type: DataTypes.STRING, allowNull: false }, // 'late', 'earlyLeave', 'breakLate'
    requestedStatus: { type: DataTypes.STRING, allowNull: false }, // 'onTime', 'normal', etc
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' }
  }, { tableName: 'attendance_correction_requests' });

  return AttendanceCorrectionRequest;
};

