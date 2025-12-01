module.exports = (sequelize, DataTypes) => {
  const DailyReportEditRequest = sequelize.define('DailyReportEditRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dailyReportId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    newContent: { type: DataTypes.TEXT, allowNull: false },
    newFilePath: { type: DataTypes.STRING, allowNull: true },
    newFileName: { type: DataTypes.STRING, allowNull: true },
    newFileType: { type: DataTypes.STRING, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
    adminNote: { type: DataTypes.TEXT, allowNull: true }
  }, { tableName: 'daily_report_edit_requests' });

  return DailyReportEditRequest;
};

