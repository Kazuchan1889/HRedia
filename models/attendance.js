module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    checkIn: { type: DataTypes.TIME },
    checkOut: { type: DataTypes.TIME },
    checkInPhoto: { type: DataTypes.TEXT },
    checkOutPhoto: { type: DataTypes.TEXT },
    checkInPhotoPath: { type: DataTypes.STRING },
    checkOutPhotoPath: { type: DataTypes.STRING },
    breakTaken: { type: DataTypes.BOOLEAN, defaultValue: false },
    breakStart: { type: DataTypes.TIME },
    breakEnd: { type: DataTypes.TIME },
    breakPhotoPath: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('Hadir','Izin','Sakit','Alfa'), defaultValue: 'Hadir' },
    checkInStatus: { type: DataTypes.ENUM('early', 'onTime', 'almostLate', 'late'), allowNull: true },
    breakLate: { type: DataTypes.BOOLEAN, defaultValue: false },
    earlyLeave: { type: DataTypes.BOOLEAN, defaultValue: false },
    workStartTime: { type: DataTypes.TIME }, // Waktu mulai perhitungan jam kerja
    workHours: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Total jam kerja dalam desimal
    breakDurationMinutes: { type: DataTypes.INTEGER, defaultValue: 0 }, // Total durasi break dalam menit
    note: { type: DataTypes.STRING }
  }, { tableName: 'attendances' });

  return Attendance;
};
