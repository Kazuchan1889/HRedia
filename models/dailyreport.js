module.exports = (sequelize, DataTypes) => {
  const DailyReport = sequelize.define('DailyReport', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: true },
    fileName: { type: DataTypes.STRING, allowNull: true },
    fileType: { type: DataTypes.STRING, allowNull: true }, // 'image' or 'pdf'
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    isLate: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'daily_reports' });

  return DailyReport;
};

