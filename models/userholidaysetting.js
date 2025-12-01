module.exports = (sequelize, DataTypes) => {
  const UserHolidaySetting = sequelize.define('UserHolidaySetting', {
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
    day1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'First day off (0=Sunday, 1=Monday, ..., 6=Saturday)'
    },
    day2: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Second day off (optional, null if only one day off)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this holiday setting is active'
    }
  }, {
    tableName: 'user_holiday_settings',
    timestamps: true
  });

  return UserHolidaySetting;
};

