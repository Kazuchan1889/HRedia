const db = require('../models');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const listUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({ 
      attributes: {
        exclude: ['password'] // Jangan kirim password ke frontend
        // Email akan otomatis di-include karena tidak ada di exclude
      },
      order: [['createdAt', 'DESC']]
    });
    // Ensure email is included in response
    const usersWithEmail = users.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        email: userData.email || null // Ensure email field exists
      };
    });
    res.json(usersWithEmail);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ message: 'Gagal memuat data user' });
  }
}

// Function to generate Employee ID automatically
// Format: EMP-YYYYMMDD-XXX (e.g., EMP-20241201-001)
async function generateEmployeeId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `EMP-${dateStr}-`;
  
  // Find the latest employee ID for today
  const latestUser = await db.User.findOne({
    where: {
      employeeId: {
        [db.Sequelize.Op.like]: `${prefix}%`
      }
    },
    order: [['employeeId', 'DESC']]
  });
  
  let nextNumber = 1;
  if (latestUser && latestUser.employeeId) {
    // Extract number from latest employee ID (e.g., EMP-20241201-001 -> 1)
    const match = latestUser.employeeId.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  // Format with leading zeros (3 digits)
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}${formattedNumber}`;
}

const createUser = async (req, res) => {
  try {
    const {
      // Required fields
      name, username, password, email, employeeId, position, startDate, employmentStatus,
      // Optional personal data
      address, phone, birthDate, gender, maritalStatus, nationality,
      // Optional work data
      department, division, supervisor, jobHistory, salary, benefits,
      // Optional education
      education, institution, degree, certifications, skills,
      // Salary
      basicSalary, currency,
      // Leave Quota
      leaveQuota, leaveQuotaOther,
      role = 'user'
    } = req.body;

    // Validate required fields for personal data
    if (!name || !username || !password || !email) {
      return res.status(400).json({ message: 'Nama, username, password, dan email wajib diisi' });
    }
    
    // Trim email to remove whitespace
    const trimmedEmail = email.trim();
    
    // Validate email is not empty after trim
    if (!trimmedEmail) {
      return res.status(400).json({ message: 'Email tidak boleh kosong' });
    }
    
    // Validate email is not example.com
    if (trimmedEmail.includes('@example.com')) {
      return res.status(400).json({ message: 'Email tidak boleh menggunakan domain example.com. Silakan gunakan email yang valid.' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }
    
    // Generate Employee ID automatically (always generate, ignore if provided)
    let finalEmployeeId = await generateEmployeeId();
    
    // Set startDate automatically to today (always set, ignore if provided)
    let finalStartDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Validate required fields for work data (wajib saat create user)
    if (!position || !employmentStatus) {
      return res.status(400).json({ message: 'Posisi dan Status Karyawan wajib diisi' });
    }
    
    // Validate required fields for education (wajib saat create user)
    if (!education || !institution || !degree) {
      return res.status(400).json({ message: 'Pendidikan, Institusi, dan Gelar wajib diisi' });
    }

    // Parse JSON fields if they're strings
    let parsedJobHistory = jobHistory;
    let parsedBenefits = benefits;
    let parsedCertifications = certifications;
    let parsedSkills = skills;

    try {
      if (typeof jobHistory === 'string') parsedJobHistory = JSON.parse(jobHistory);
      if (typeof benefits === 'string') parsedBenefits = JSON.parse(benefits);
      if (typeof certifications === 'string') parsedCertifications = JSON.parse(certifications);
      if (typeof skills === 'string') parsedSkills = JSON.parse(skills);
    } catch (e) {
      // If not valid JSON, keep as string
    }

    // Log untuk debugging - pastikan email sesuai input admin
    console.log('Creating user with:', {
      name, 
      username, 
      email: trimmedEmail, // Email yang akan disimpan ke database
      employeeId: finalEmployeeId,
      position,
      startDate: finalStartDate,
      employmentStatus
    });

    // PASTIKAN: Email yang disimpan adalah email yang diinput admin, TIDAK diubah menjadi example.com
    const user = await db.User.create({
      name, username, password, email: trimmedEmail, employeeId: finalEmployeeId, position, startDate: finalStartDate, employmentStatus,
      address, phone, birthDate, gender, maritalStatus, nationality,
      department, division, supervisor,
      jobHistory: typeof parsedJobHistory === 'object' ? JSON.stringify(parsedJobHistory) : parsedJobHistory,
      salary, 
      benefits: typeof parsedBenefits === 'object' ? JSON.stringify(parsedBenefits) : parsedBenefits,
      education, institution, degree,
      certifications: typeof parsedCertifications === 'object' ? JSON.stringify(parsedCertifications) : parsedCertifications,
      skills: typeof parsedSkills === 'object' ? JSON.stringify(parsedSkills) : parsedSkills,
      basicSalary, currency,
      leaveQuota: leaveQuota ? parseInt(leaveQuota) : 12,
      leaveQuotaOther: leaveQuotaOther ? parseInt(leaveQuotaOther) : null,
      role
    });

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    // Log untuk memastikan email yang disimpan sesuai dengan input admin
    console.log('User created successfully. Email saved to database:', userResponse.email);
    
    res.json(userResponse);
  } catch (err) {
    console.error('Error creating user:', err);
    // Provide more specific error messages
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validasi error: ${errors}` });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Username atau Employee ID sudah digunakan' });
    }
    res.status(400).json({ message: err.message || 'Gagal membuat user' });
  }
}

const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Validate that id is a valid integer
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const payload = req.body;
    
    // Validate email is not example.com if email is being updated
    if (payload.email) {
      // Trim email to remove whitespace
      const trimmedEmail = payload.email.trim();
      
      // Validate email is not empty after trim
      if (!trimmedEmail) {
        return res.status(400).json({ message: 'Email tidak boleh kosong' });
      }
      
      // Validate email is not example.com
      if (trimmedEmail.includes('@example.com')) {
        return res.status(400).json({ message: 'Email tidak boleh menggunakan domain example.com. Silakan gunakan email yang valid.' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: 'Format email tidak valid' });
      }
      
      // PASTIKAN: Email yang disimpan adalah email yang diinput admin, TIDAK diubah menjadi example.com
      payload.email = trimmedEmail;
      
      console.log('Updating user email to:', trimmedEmail);
    }

    // Parse JSON fields if needed
    ['jobHistory', 'benefits', 'certifications', 'skills'].forEach(field => {
      if (payload[field] && typeof payload[field] === 'string') {
        try {
          const parsed = JSON.parse(payload[field]);
          payload[field] = typeof parsed === 'object' ? JSON.stringify(parsed) : payload[field];
        } catch (e) {
          // Keep as string if not valid JSON
        }
      } else if (payload[field] && typeof payload[field] === 'object') {
        payload[field] = JSON.stringify(payload[field]);
      }
    });

    // Handle leave quota
    if (payload.leaveQuota !== undefined) {
      if (payload.leaveQuota === null || payload.leaveQuota === '') {
        // If leaveQuota is null/empty, use leaveQuotaOther
        payload.leaveQuota = payload.leaveQuotaOther ? parseInt(payload.leaveQuotaOther) : 12;
        payload.leaveQuotaOther = null;
      } else {
        payload.leaveQuota = parseInt(payload.leaveQuota) || 12;
        payload.leaveQuotaOther = null;
      }
    }
    if (payload.leaveQuotaOther !== undefined && payload.leaveQuotaOther !== null && payload.leaveQuotaOther !== '') {
      payload.leaveQuotaOther = parseInt(payload.leaveQuotaOther);
    }

    await db.User.update(payload, { where: { id: id } });
    const updatedUser = await db.User.findByPk(id, { attributes: { exclude: ['password'] } });
    
    // Log untuk memastikan email yang disimpan sesuai dengan input admin
    if (payload.email) {
      console.log('User email updated successfully. Email saved to database:', updatedUser.email);
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || 'Gagal update user' });
  }
}

const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Validate that id is a valid integer
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    await db.User.destroy({ where: { id: id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(400).json({ message: err.message || 'Gagal delete user' });
  }
}

// Get current user's profile
const getMyProfile = async (req, res) => {
  try {
    // CRITICAL: Use userId from token, NOT from req.params.id
    const userId = parseInt(req.user.id);
    if (isNaN(userId) || userId <= 0) {
      console.error('getMyProfile: Invalid userId from token:', req.user.id);
      return res.status(401).json({ message: 'Invalid user ID in token' });
    }
    const user = await db.User.findByPk(userId, { 
      attributes: { exclude: ['password'] } 
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Convert to plain object and handle null values
    const userData = user.toJSON();
    
    // Ensure all fields have default values if null
    const profileData = {
      id: userData.id,
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      address: userData.address || '',
      birthDate: userData.birthDate || '',
      gender: userData.gender || '',
      maritalStatus: userData.maritalStatus || '',
      nationality: userData.nationality || 'Indonesia',
      employeeId: userData.employeeId || '',
      position: userData.position || '',
      department: userData.department || '',
      division: userData.division || '',
      startDate: userData.startDate || '',
      supervisor: userData.supervisor || '',
      employmentStatus: userData.employmentStatus || '',
      education: userData.education || '',
      institution: userData.institution || '',
      degree: userData.degree || '',
      profilePicture: userData.profilePicture || null,
      role: userData.role || 'user',
      // Leave quota fields
      leaveQuota: userData.leaveQuota || 12,
      leaveQuotaOther: userData.leaveQuotaOther || null,
      usedLeaveQuota: userData.usedLeaveQuota || 0,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    res.json(profileData);
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ message: err.message || 'Gagal mengambil profile' });
  }
}

// Update current user's profile (user can only update their own profile)
const updateMyProfile = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.log('updateMyProfile: No user in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // CRITICAL: Use userId from token, NOT from req.params.id
    // req.params.id might be "me" if route matching fails
    const userId = parseInt(req.user.id);
    if (isNaN(userId) || userId <= 0) {
      console.error('updateMyProfile: Invalid userId from token:', req.user.id);
      return res.status(401).json({ message: 'Invalid user ID in token' });
    }
    
    console.log('updateMyProfile: Updating profile for user ID:', userId, 'from token (NOT from params)');
    const payload = { ...req.body };

    // Only allow users to update personal data fields
    // Data pekerjaan dan pendidikan hanya bisa diubah oleh admin
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'birthDate', 
      'gender', 'maritalStatus', 'nationality', 'profilePicture', 'password'
    ];
    
    // Remove all fields that are not in allowedFields
    Object.keys(payload).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete payload[key];
      }
    });
    
    // Prevent users from changing role, employeeId, username (extra safety)
    delete payload.role;
    delete payload.employeeId;
    delete payload.username;
    delete payload.id;
    
    // Handle password update
    if (payload.password) {
      // Password update is handled by model hooks
      // Only update if password is provided and not empty
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
    } else {
      delete payload.password;
    }

    // Remove confirmPassword from payload
    delete payload.confirmPassword;

    // Handle profile picture upload (base64)
    if (payload.profilePicture && payload.profilePicture.startsWith('data:image')) {
      try {
        const matches = payload.profilePicture.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1].split('/').pop() || 'jpg';
          const data = matches[2];
          const filename = `profile_u${userId}_${Date.now()}.${ext}`;
          const filePath = path.join(UPLOAD_DIR, filename);
          
          // Delete old profile picture if exists
          const oldUser = await db.User.findByPk(userId);
          if (oldUser && oldUser.profilePicture) {
            const oldFilePath = path.join(__dirname, '..', oldUser.profilePicture);
            if (fs.existsSync(oldFilePath)) {
              try {
                fs.unlinkSync(oldFilePath);
              } catch (e) {
                console.log('Could not delete old profile picture:', e.message);
              }
            }
          }
          
          fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
          payload.profilePicture = `/uploads/${filename}`;
        } else {
          delete payload.profilePicture; // Invalid format
        }
      } catch (err) {
        console.error('Error saving profile picture:', err);
        delete payload.profilePicture; // Remove if error
      }
    } else if (payload.profilePicture === '' || payload.profilePicture === null) {
      // Delete profile picture if empty string or null
      const oldUser = await db.User.findByPk(userId);
      if (oldUser && oldUser.profilePicture) {
        const oldFilePath = path.join(__dirname, '..', oldUser.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (e) {
            console.log('Could not delete profile picture:', e.message);
          }
        }
      }
      payload.profilePicture = null;
    }

    // Parse JSON fields if needed
    ['jobHistory', 'benefits', 'certifications', 'skills'].forEach(field => {
      if (payload[field] && typeof payload[field] === 'string') {
        try {
          const parsed = JSON.parse(payload[field]);
          payload[field] = typeof parsed === 'object' ? JSON.stringify(parsed) : payload[field];
        } catch (e) {
          // Keep as string if not valid JSON
        }
      } else if (payload[field] && typeof payload[field] === 'object') {
        payload[field] = JSON.stringify(payload[field]);
      }
    });

    // Remove empty strings for optional fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' && key !== 'password') {
        payload[key] = null;
      }
    });

    await db.User.update(payload, { where: { id: userId } });
    const updatedUser = await db.User.findByPk(userId, { attributes: { exclude: ['password'] } });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return formatted response
    const userData = updatedUser.toJSON();
    const profileData = {
      id: userData.id,
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      phone: userData.phone || '',
      address: userData.address || '',
      birthDate: userData.birthDate || '',
      gender: userData.gender || '',
      maritalStatus: userData.maritalStatus || '',
      nationality: userData.nationality || 'Indonesia',
      employeeId: userData.employeeId || '',
      position: userData.position || '',
      department: userData.department || '',
      division: userData.division || '',
      startDate: userData.startDate || '',
      supervisor: userData.supervisor || '',
      employmentStatus: userData.employmentStatus || '',
      education: userData.education || '',
      institution: userData.institution || '',
      degree: userData.degree || '',
      profilePicture: userData.profilePicture || null,
      role: userData.role || 'user',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    res.json(profileData);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(400).json({ message: err.message || 'Gagal update profile' });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, getMyProfile, updateMyProfile };
