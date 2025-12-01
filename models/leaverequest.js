module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT },
    type: { type: DataTypes.ENUM('Izin', 'Cuti'), defaultValue: 'Izin' }, // Izin or Cuti
    status: { type: DataTypes.ENUM('Pending','Approved','Rejected'), defaultValue: 'Pending' }
  }, { tableName: 'leave_requests' });

  return LeaveRequest;
};
