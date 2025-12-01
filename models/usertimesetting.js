module.exports = (sequelize, DataTypes) => {
  const UserTimeSetting = sequelize.define('UserTimeSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One setting per user
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    checkInTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '08:00'
    },
    checkOutTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '17:00'
    },
    breakStartTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '12:00'
    },
    breakEndTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '13:00'
    },
    checkInTolerance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      comment: 'Tolerance in minutes for check-in'
    },
    breakDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      comment: 'Break duration in minutes'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this time setting is active'
    }
  }, {
    tableName: 'user_time_settings',
    timestamps: true
  });

  return UserTimeSetting;
};

