module.exports = (sequelize, DataTypes) => {
  const PayrollSetting = sequelize.define('PayrollSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // One setting per user
    },
    // Deduction settings (in percentage or fixed amount)
    alphaDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0, // Percentage or fixed amount
      comment: 'Deduction for alpha (percentage or fixed)'
    },
    izinDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Deduction for izin (percentage or fixed)'
    },
    lateDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Deduction for late check-in (percentage or fixed)'
    },
    breakLateDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Deduction for break late (percentage or fixed)'
    },
    earlyLeaveDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Deduction for early leave (percentage or fixed)'
    },
    noReportDeduction: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Deduction for missing daily report (percentage or fixed)'
    },
    // Threshold settings
    maxLateAllowed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Maximum late occurrences allowed before deduction'
    },
    maxBreakLateAllowed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Maximum break late occurrences allowed before deduction'
    },
    maxEarlyLeaveAllowed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Maximum early leave occurrences allowed before deduction'
    },
    // Deduction type: 'percentage' or 'fixed'
    deductionType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage',
      comment: 'Type of deduction: percentage or fixed amount'
    },
    // Bonus settings
    perfectAttendanceBonus: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Bonus for perfect attendance (no alpha, izin, late, etc)'
    },
    allReportsBonus: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Bonus for submitting all daily reports'
    },
    // Active status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this payroll setting is active'
    }
  }, {
    tableName: 'payroll_settings',
    timestamps: true
  });

  return PayrollSetting;
};

