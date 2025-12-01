const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Authentication & Basic Info (Required)
    name: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin','user','head'), defaultValue: 'user' },
    
    // Data Pribadi (Personal Data)
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    profilePicture: { type: DataTypes.STRING }, // Path to profile picture
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING },
    birthDate: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('Laki-laki', 'Perempuan') },
    maritalStatus: { type: DataTypes.ENUM('Belum Menikah', 'Menikah', 'Cerai') },
    nationality: { type: DataTypes.STRING, defaultValue: 'Indonesia' },
    
    // Data Pekerjaan (Work Data)
    employeeId: { type: DataTypes.STRING, allowNull: false, unique: true },
    position: { type: DataTypes.STRING, allowNull: false },
    department: { type: DataTypes.STRING },
    division: { type: DataTypes.STRING },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    supervisor: { type: DataTypes.STRING },
    employmentStatus: { type: DataTypes.ENUM('Tetap', 'Kontrak', 'Magang', 'Freelance'), allowNull: false },
    jobHistory: { type: DataTypes.TEXT }, // JSON string untuk riwayat jabatan
    salary: { type: DataTypes.DECIMAL(15, 2) },
    benefits: { type: DataTypes.TEXT }, // JSON string untuk tunjangan dan fasilitas
    // Gaji Pokok
    basicSalary: { type: DataTypes.DECIMAL(15, 2) },
    currency: { type: DataTypes.ENUM('USD', 'IDR'), defaultValue: 'IDR' },
    
    // Jatah Cuti
    leaveQuota: { type: DataTypes.INTEGER, defaultValue: 12 }, // 12, 24, or custom
    leaveQuotaOther: { type: DataTypes.INTEGER }, // Custom value when leaveQuota is "other"
    usedLeaveQuota: { type: DataTypes.INTEGER, defaultValue: 0 }, // Jatah cuti yang sudah digunakan
    
    // Pendidikan dan Kualifikasi (Education)
    education: { type: DataTypes.STRING }, // Pendidikan terakhir
    institution: { type: DataTypes.STRING },
    degree: { type: DataTypes.STRING },
    certifications: { type: DataTypes.TEXT }, // JSON array untuk sertifikasi
    skills: { type: DataTypes.TEXT } // JSON array untuk keahlian
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
  }

  return User;
};
