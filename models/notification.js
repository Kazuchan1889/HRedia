module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    title: { type: DataTypes.STRING },
    body: { type: DataTypes.TEXT },
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'notifications' });

  return Notification;
};
