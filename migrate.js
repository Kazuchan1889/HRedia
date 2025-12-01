const db = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function migrate() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
    
    // First, handle existing users table and fix null values
    // This MUST happen before sync to avoid constraint violations
    try {
      // Check if users table exists
      const [tableCheck] = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"
      );
      
      if (tableCheck && tableCheck[0] && tableCheck[0].exists) {
        // Get all users
        const users = await db.sequelize.query('SELECT id, username, role FROM users', {
          type: db.sequelize.QueryTypes.SELECT
        });
        
        if (Array.isArray(users) && users.length > 0) {
          // First, ensure columns exist as nullable (if they don't exist)
          // Handle startDate separately as it needs to be DATE type
          const stringColumns = ['email', 'employeeId', 'position', 'employmentStatus'];
          for (const col of stringColumns) {
            try {
              const colName = col === 'employeeId' || col === 'employmentStatus' 
                ? `"${col}"` : col;
              await db.sequelize.query(`
                DO $$ 
                BEGIN 
                  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='${col}') THEN
                    ALTER TABLE users ADD COLUMN ${colName} VARCHAR(255);
                  END IF;
                END $$;
              `);
            } catch (e) {
              // Column might already exist, ignore
            }
          }
          
          // Handle startDate separately - convert if exists as VARCHAR, or create as DATE
          try {
            const [colInfo] = await db.sequelize.query(`
              SELECT data_type FROM information_schema.columns 
              WHERE table_name='users' AND column_name='startDate'
            `);
            
            if (colInfo && colInfo.length > 0) {
              // Column exists, check if it's VARCHAR and needs conversion
              if (colInfo[0].data_type === 'character varying') {
                // Convert VARCHAR to DATE
                await db.sequelize.query(`
                  ALTER TABLE users 
                  ALTER COLUMN "startDate" TYPE DATE USING "startDate"::date;
                `);
                console.log('Converted startDate from VARCHAR to DATE');
              }
            } else {
              // Column doesn't exist, create as DATE
              await db.sequelize.query(`
                ALTER TABLE users ADD COLUMN "startDate" DATE;
              `);
            }
          } catch (e) {
            console.log('Note: Could not handle startDate column:', e.message);
          }
          
          // Add profilePicture column if it doesn't exist
          try {
            await db.sequelize.query(`
              DO $$ 
              BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='profilePicture') THEN
                  ALTER TABLE users ADD COLUMN "profilePicture" VARCHAR(255);
                END IF;
              END $$;
            `);
          } catch (e) {
            console.log('Note: Could not add profilePicture column:', e.message);
          }
          
          // Update attendances table for breakStart and breakEnd
          try {
            // Check if breakStart column exists
            const [breakStartCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='breakStart'
            `);
            
            if (!breakStartCheck || breakStartCheck.length === 0) {
              // Add breakStart column
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "breakStart" TIME;
              `);
              console.log('Added breakStart column to attendances');
            }
            
            // Check if breakEnd is DATE, convert to TIME if needed
            const [breakEndCheck] = await db.sequelize.query(`
              SELECT data_type FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='breakEnd'
            `);
            
            if (breakEndCheck && breakEndCheck.length > 0) {
              if (breakEndCheck[0].data_type === 'timestamp without time zone' || breakEndCheck[0].data_type === 'date') {
                // Convert breakEnd from DATE/TIMESTAMP to TIME
                await db.sequelize.query(`
                  ALTER TABLE attendances 
                  ALTER COLUMN "breakEnd" TYPE TIME USING "breakEnd"::time;
                `);
                console.log('Converted breakEnd to TIME');
              }
            } else {
              // Add breakEnd as TIME if doesn't exist
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "breakEnd" TIME;
              `);
              console.log('Added breakEnd column to attendances');
            }
            
            // Add new status columns for attendance
            // First check and add checkInStatus
            const [checkInStatusCheck] = await db.sequelize.query(`
              SELECT column_name, data_type FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='checkInStatus'
            `);
            
            if (!checkInStatusCheck || checkInStatusCheck.length === 0) {
              // Create ENUM type if it doesn't exist
              await db.sequelize.query(`
                DO $$ 
                BEGIN
                  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkinstatus_enum') THEN
                    CREATE TYPE checkinstatus_enum AS ENUM ('early', 'onTime', 'almostLate', 'late');
                  END IF;
                END $$;
              `);
              // Add column with ENUM type
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "checkInStatus" checkinstatus_enum;
              `);
              console.log('Added checkInStatus column to attendances');
            } else if (checkInStatusCheck[0].data_type === 'character varying') {
              // Convert VARCHAR to ENUM if it exists as VARCHAR
              try {
                await db.sequelize.query(`
                  DO $$ 
                  BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkinstatus_enum') THEN
                      CREATE TYPE checkinstatus_enum AS ENUM ('early', 'onTime', 'almostLate', 'late');
                    END IF;
                  END $$;
                `);
                await db.sequelize.query(`
                  ALTER TABLE attendances 
                  ALTER COLUMN "checkInStatus" TYPE checkinstatus_enum 
                  USING "checkInStatus"::checkinstatus_enum;
                `);
                console.log('Converted checkInStatus from VARCHAR to ENUM');
              } catch (e) {
                console.log('Note: Could not convert checkInStatus to ENUM:', e.message);
              }
            } else {
              // ENUM already exists, add 'early' value if it doesn't exist
              try {
                // First, find the actual ENUM type name used by the column
                const [enumTypeCheck] = await db.sequelize.query(`
                  SELECT 
                    t.typname as enum_name
                  FROM pg_type t 
                  JOIN pg_enum e ON t.oid = e.enumtypid
                  JOIN pg_attribute a ON a.atttypid = t.oid
                  JOIN pg_class c ON a.attrelid = c.oid
                  WHERE c.relname = 'attendances' 
                    AND a.attname = 'checkInStatus'
                  LIMIT 1;
                `);
                
                if (enumTypeCheck && enumTypeCheck.length > 0) {
                  const enumTypeName = enumTypeCheck[0].enum_name;
                  
                  // Check if 'early' value already exists
                  const [earlyCheck] = await db.sequelize.query(`
                    SELECT 1 FROM pg_enum 
                    WHERE enumlabel = 'early' 
                    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumTypeName}')
                  `);
                  
                  if (!earlyCheck || earlyCheck.length === 0) {
                    // Add 'early' value to the ENUM
                    await db.sequelize.query(`
                      ALTER TYPE ${enumTypeName} ADD VALUE IF NOT EXISTS 'early' BEFORE 'onTime';
                    `);
                    console.log(`Added early value to ${enumTypeName} ENUM`);
                  } else {
                    console.log(`'early' value already exists in ${enumTypeName} ENUM`);
                  }
                } else {
                  // Try to find ENUM type by checking all ENUMs
                  const [allEnums] = await db.sequelize.query(`
                    SELECT typname FROM pg_type 
                    WHERE typtype = 'e' 
                    AND typname LIKE '%check%status%' OR typname LIKE '%checkinstatus%'
                  `);
                  
                  if (allEnums && allEnums.length > 0) {
                    const enumTypeName = allEnums[0].typname;
                    await db.sequelize.query(`
                      ALTER TYPE ${enumTypeName} ADD VALUE IF NOT EXISTS 'early' BEFORE 'onTime';
                    `);
                    console.log(`Added early value to ${enumTypeName} ENUM`);
                  } else {
                    console.log('Could not find checkInStatus ENUM type');
                  }
                }
              } catch (e) {
                console.log('Note: Could not add early to checkInStatus ENUM:', e.message);
                // Try alternative: use ALTER TYPE with IF NOT EXISTS (PostgreSQL 9.1+)
                try {
                  await db.sequelize.query(`
                    DO $$ 
                    BEGIN
                      IF EXISTS (SELECT 1 FROM pg_type WHERE typname LIKE '%check%status%') THEN
                        EXECUTE 'ALTER TYPE ' || (SELECT typname FROM pg_type WHERE typname LIKE '%check%status%' LIMIT 1) || ' ADD VALUE IF NOT EXISTS ''early'' BEFORE ''onTime''';
                      END IF;
                    END $$;
                  `);
                  console.log('Added early value using alternative method');
                } catch (e2) {
                  console.log('Alternative method also failed:', e2.message);
                }
              }
            }
            
            // Add breakLate column
            const [breakLateCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='breakLate'
            `);
            
            if (!breakLateCheck || breakLateCheck.length === 0) {
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "breakLate" BOOLEAN DEFAULT false;
              `);
              console.log('Added breakLate column to attendances');
            }
            
            // Add earlyLeave column
            const [earlyLeaveCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='earlyLeave'
            `);
            
            if (!earlyLeaveCheck || earlyLeaveCheck.length === 0) {
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "earlyLeave" BOOLEAN DEFAULT false;
              `);
              console.log('Added earlyLeave column to attendances');
            }
            
            // Add workStartTime column
            const [workStartTimeCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='workStartTime'
            `);
            
            if (!workStartTimeCheck || workStartTimeCheck.length === 0) {
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "workStartTime" TIME;
              `);
              console.log('Added workStartTime column to attendances');
            }
            
            // Add workHours column
            const [workHoursCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='workHours'
            `);
            
            if (!workHoursCheck || workHoursCheck.length === 0) {
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "workHours" DECIMAL(10, 2) DEFAULT 0;
              `);
              console.log('Added workHours column to attendances');
            }
            
            // Add breakDurationMinutes column
            const [breakDurationMinutesCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='breakDurationMinutes'
            `);
            
            if (!breakDurationMinutesCheck || breakDurationMinutesCheck.length === 0) {
              await db.sequelize.query(`
                ALTER TABLE attendances ADD COLUMN "breakDurationMinutes" INTEGER DEFAULT 0;
              `);
              console.log('Added breakDurationMinutes column to attendances');
            }
            
            // Remove old breakTime column if exists (migrate data first)
            const [breakTimeCheck] = await db.sequelize.query(`
              SELECT column_name FROM information_schema.columns 
              WHERE table_name='attendances' AND column_name='breakTime'
            `);
            
            if (breakTimeCheck && breakTimeCheck.length > 0) {
              // Migrate breakTime to breakStart if breakStart is null
              await db.sequelize.query(`
                UPDATE attendances 
                SET "breakStart" = "breakTime" 
                WHERE "breakStart" IS NULL AND "breakTime" IS NOT NULL;
              `);
              // Drop breakTime column
              await db.sequelize.query(`
                ALTER TABLE attendances DROP COLUMN IF EXISTS "breakTime";
              `);
              console.log('Migrated breakTime to breakStart and removed breakTime column');
            }
          } catch (e) {
            console.log('Note: Could not update attendances table:', e.message);
          }
          
          // Now update all null values
          for (const user of users) {
            const updates = {};
            const setParts = [];
            const replacements = { id: user.id };
            
            // Check what's null and needs updating
            const [current] = await db.sequelize.query(
              `SELECT email, "employeeId", position, "startDate", "employmentStatus" 
               FROM users WHERE id = :id`,
              { replacements: { id: user.id }, type: db.sequelize.QueryTypes.SELECT }
            );
            
            const data = current && current[0] ? current[0] : {};
            
            if (!data.email) {
              setParts.push('email = :email');
              replacements.email = `${user.username}@example.com`;
            }
            if (!data.employeeId) {
              setParts.push('"employeeId" = :employeeId');
              replacements.employeeId = `EMP${String(user.id).padStart(3, '0')}`;
            }
            if (!data.position) {
              setParts.push('position = :position');
              replacements.position = user.role === 'admin' ? 'Administrator' : 'Staff';
            }
            if (!data.startDate) {
              setParts.push('"startDate" = :startDate');
              replacements.startDate = new Date().toISOString().split('T')[0];
            }
            if (!data.employmentStatus) {
              setParts.push('"employmentStatus" = :employmentStatus');
              replacements.employmentStatus = 'Tetap';
            }
            
            if (setParts.length > 0) {
              await db.sequelize.query(
                `UPDATE users SET ${setParts.join(', ')} WHERE id = :id`,
                { replacements }
              );
              console.log(`Updated user ${user.username} with missing fields`);
            }
          }
        }
      }
    } catch (updateErr) {
      console.log('Note: Could not update existing users (table might not exist yet):', updateErr.message);
    }
    
    // Update role enum to include 'head' if it doesn't exist
    try {
      // First check if enum type exists
      const [enumCheck] = await db.sequelize.query(`
        SELECT typname FROM pg_type WHERE typname = 'enum_users_role'
      `);
      
      if (enumCheck && enumCheck.length > 0) {
        // Enum exists, check if 'head' value exists
        const [headCheck] = await db.sequelize.query(`
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'head' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_users_role')
        `);
        
        if (!headCheck || headCheck.length === 0) {
          // Add 'head' to the enum
          await db.sequelize.query(`
            ALTER TYPE enum_users_role ADD VALUE 'head';
          `);
          console.log('Added head to role enum');
        } else {
          console.log('head already exists in role enum');
        }
      } else {
        console.log('enum_users_role does not exist yet, will be created by Sequelize sync');
      }
    } catch (e) {
      console.log('Note: Could not update role enum:', e.message);
    }
    
    // Add basicSalary and currency columns if they don't exist
    try {
      // Add basicSalary column if it doesn't exist
      const [basicSalaryCheck] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='users' AND column_name='basicSalary'
      `);
      
      if (!basicSalaryCheck || basicSalaryCheck.length === 0) {
        await db.sequelize.query(`
          ALTER TABLE users ADD COLUMN "basicSalary" DECIMAL(15, 2);
        `);
        console.log('Added column basicSalary to users table');
      } else {
        console.log('Column basicSalary already exists');
      }
      
      // Check if currency column exists and its type
      const [currencyCheck] = await db.sequelize.query(`
        SELECT column_name, udt_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='currency'
      `);
      
      if (!currencyCheck || currencyCheck.length === 0) {
        // Create ENUM type if it doesn't exist
        await db.sequelize.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_enum') THEN
              CREATE TYPE currency_enum AS ENUM ('USD', 'IDR');
            END IF;
          END $$;
        `);
        
        await db.sequelize.query(`
          ALTER TABLE users ADD COLUMN currency currency_enum DEFAULT 'IDR';
        `);
        console.log('Added column currency to users table');
      } else {
        // Check if currency column uses the correct enum type
        const currencyType = currencyCheck[0].udt_name;
        if (currencyType !== 'currency_enum' && currencyType !== 'enum_users_currency') {
          // If it's not using the correct enum, we need to handle it
          console.log(`Currency column exists with type: ${currencyType}`);
        } else {
          console.log('Column currency already exists with correct type');
        }
      }
    } catch (e) {
      console.log('Note: Could not add salary columns:', e.message);
    }

    // Add leave quota columns to users table
    try {
      const [leaveQuotaCheck] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='leaveQuota'
      `);
      if (!leaveQuotaCheck || leaveQuotaCheck.length === 0) {
        await db.sequelize.query(`
          ALTER TABLE users ADD COLUMN "leaveQuota" INTEGER DEFAULT 12;
        `);
        console.log('Added column leaveQuota to users table');
      }
      
      const [leaveQuotaOtherCheck] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='leaveQuotaOther'
      `);
      if (!leaveQuotaOtherCheck || leaveQuotaOtherCheck.length === 0) {
        await db.sequelize.query(`
          ALTER TABLE users ADD COLUMN "leaveQuotaOther" INTEGER;
        `);
        console.log('Added column leaveQuotaOther to users table');
      }
      
      const [usedLeaveQuotaCheck] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='usedLeaveQuota'
      `);
      if (!usedLeaveQuotaCheck || usedLeaveQuotaCheck.length === 0) {
        await db.sequelize.query(`
          ALTER TABLE users ADD COLUMN "usedLeaveQuota" INTEGER DEFAULT 0;
        `);
        console.log('Added column usedLeaveQuota to users table');
      }
    } catch (e) {
      console.log('Note: Could not add leave quota columns:', e.message);
    }

    // Add type column to leave_requests table
    try {
      const [typeCheck] = await db.sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='leave_requests' AND column_name='type'
      `);
      if (!typeCheck || typeCheck.length === 0) {
        // Create ENUM type for leave request type if it doesn't exist
        await db.sequelize.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_leave_requests_type') THEN
              CREATE TYPE enum_leave_requests_type AS ENUM ('Izin', 'Cuti');
            END IF;
          END $$;
        `);
        
        await db.sequelize.query(`
          ALTER TABLE leave_requests ADD COLUMN type enum_leave_requests_type DEFAULT 'Izin';
        `);
        console.log('Added column type to leave_requests table');
      }
    } catch (e) {
      console.log('Note: Could not add type column to leave_requests:', e.message);
    }

    // Sync the database schema - use sync without alter to avoid ENUM conflicts
    // We've already manually added basicSalary and currency columns above
    try {
      // Only sync to ensure models are loaded, but don't alter existing columns
      // This prevents Sequelize from trying to change ENUM types
      await db.sequelize.sync({ alter: false });
      console.log('Database models synced (no alterations)');
    } catch (syncError) {
      console.log('Note: Sync completed with warnings:', syncError.message);
      // Continue anyway as we've manually handled the columns
    }

    // seed default admin if not exists
    const adminUser = await db.User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      const admin = await db.User.create({ 
        name: 'Admin', 
        username: 'admin', 
        password: 'admin123', 
        email: 'admin@example.com',
        employeeId: 'EMP001',
        position: 'Administrator',
        startDate: new Date().toISOString().split('T')[0],
        employmentStatus: 'Tetap',
        role: 'admin' 
      });
      console.log('Created default admin -> username: admin password: admin123');
    }

    const demoUser = await db.User.findOne({ where: { username: 'user1' } });
    if (!demoUser) {
      await db.User.create({ 
        name: 'User Satu', 
        username: 'user1', 
        password: 'user123', 
        email: 'user1@example.com',
        employeeId: 'EMP002',
        position: 'Staff',
        startDate: new Date().toISOString().split('T')[0],
        employmentStatus: 'Tetap',
        role: 'user' 
      });
      console.log('Created demo user -> username: user1 password: user123');
    }

    // Create attendance_status_requests table if not exists
    try {
      // Create ENUM type for status if it doesn't exist
      await db.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_request_status_enum') THEN
            CREATE TYPE attendance_status_request_status_enum AS ENUM ('Pending', 'Approved', 'Rejected');
          END IF;
        END $$;
      `);
      
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'attendance_status_requests'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        await db.sequelize.query(`
          CREATE TABLE attendance_status_requests (
            id SERIAL PRIMARY KEY,
            "attendanceId" INTEGER NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
            "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            "currentStatus" VARCHAR(255) NOT NULL,
            "requestedStatus" VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status attendance_status_request_status_enum DEFAULT 'Pending',
            "adminNote" TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Created attendance_status_requests table');
      } else {
        // Check if status column needs to be converted to ENUM
        const [statusCheck] = await db.sequelize.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'attendance_status_requests' AND column_name = 'status'
        `);
        
        if (statusCheck && statusCheck.length > 0 && statusCheck[0].data_type === 'character varying') {
          // Convert VARCHAR to ENUM
          try {
            await db.sequelize.query(`
              ALTER TABLE attendance_status_requests 
              ALTER COLUMN status TYPE attendance_status_request_status_enum 
              USING status::attendance_status_request_status_enum;
            `);
            console.log('Converted status column to ENUM in attendance_status_requests');
          } catch (e) {
            console.log('Note: Could not convert status to ENUM:', e.message);
          }
        }
        console.log('attendance_status_requests table already exists');
      }
    } catch (err) {
      console.error('Error creating attendance_status_requests table:', err.message);
    }

    // Create daily_reports table if not exists
    try {
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'daily_reports'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        // Create ENUM type for approvalStatus if it doesn't exist
        await db.sequelize.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'daily_report_approval_status_enum') THEN
              CREATE TYPE daily_report_approval_status_enum AS ENUM ('pending', 'approved', 'rejected');
            END IF;
          END $$;
        `);
        
        await db.sequelize.query(`
          CREATE TABLE daily_reports (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            content TEXT NOT NULL,
            "filePath" VARCHAR(255),
            "fileName" VARCHAR(255),
            "fileType" VARCHAR(50),
            "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "isLate" BOOLEAN DEFAULT false,
            "approvalStatus" daily_report_approval_status_enum DEFAULT 'pending',
            "approvedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
            "approvedAt" TIMESTAMP WITH TIME ZONE,
            "rejectionNote" TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("userId", date)
          )
        `);
        console.log('Created daily_reports table');
      } else {
        console.log('daily_reports table already exists');
        
        // Add approval columns if they don't exist
        try {
          // Create ENUM type if it doesn't exist
          await db.sequelize.query(`
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'daily_report_approval_status_enum') THEN
                CREATE TYPE daily_report_approval_status_enum AS ENUM ('pending', 'approved', 'rejected');
              END IF;
            END $$;
          `);
          
          // Check and add approvalStatus column
          const [approvalStatusCheck] = await db.sequelize.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='daily_reports' AND column_name='approvalStatus'
          `);
          
          if (!approvalStatusCheck || approvalStatusCheck.length === 0) {
            await db.sequelize.query(`
              ALTER TABLE daily_reports 
              ADD COLUMN "approvalStatus" daily_report_approval_status_enum DEFAULT 'pending';
            `);
            console.log('Added approvalStatus column to daily_reports');
          }
          
          // Check and add approvedBy column
          const [approvedByCheck] = await db.sequelize.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='daily_reports' AND column_name='approvedBy'
          `);
          
          if (!approvedByCheck || approvedByCheck.length === 0) {
            await db.sequelize.query(`
              ALTER TABLE daily_reports 
              ADD COLUMN "approvedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL;
            `);
            console.log('Added approvedBy column to daily_reports');
          }
          
          // Check and add approvedAt column
          const [approvedAtCheck] = await db.sequelize.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='daily_reports' AND column_name='approvedAt'
          `);
          
          if (!approvedAtCheck || approvedAtCheck.length === 0) {
            await db.sequelize.query(`
              ALTER TABLE daily_reports 
              ADD COLUMN "approvedAt" TIMESTAMP WITH TIME ZONE;
            `);
            console.log('Added approvedAt column to daily_reports');
          }
          
          // Check and add rejectionNote column
          const [rejectionNoteCheck] = await db.sequelize.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='daily_reports' AND column_name='rejectionNote'
          `);
          
          if (!rejectionNoteCheck || rejectionNoteCheck.length === 0) {
            await db.sequelize.query(`
              ALTER TABLE daily_reports 
              ADD COLUMN "rejectionNote" TEXT;
            `);
            console.log('Added rejectionNote column to daily_reports');
          }
        } catch (err) {
          console.error('Error adding approval columns to daily_reports:', err.message);
        }
      }
    } catch (err) {
      console.error('Error creating daily_reports table:', err.message);
    }

    // Create daily_report_edit_requests table if not exists
    try {
      // Create ENUM type for status if it doesn't exist
      await db.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'daily_report_edit_request_status_enum') THEN
            CREATE TYPE daily_report_edit_request_status_enum AS ENUM ('Pending', 'Approved', 'Rejected');
          END IF;
        END $$;
      `);
      
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'daily_report_edit_requests'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        await db.sequelize.query(`
          CREATE TABLE daily_report_edit_requests (
            id SERIAL PRIMARY KEY,
            "dailyReportId" INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
            "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            "newContent" TEXT NOT NULL,
            "newFilePath" VARCHAR(255),
            "newFileName" VARCHAR(255),
            "newFileType" VARCHAR(50),
            reason TEXT,
            status daily_report_edit_request_status_enum DEFAULT 'Pending',
            "adminNote" TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Created daily_report_edit_requests table');
      } else {
        console.log('daily_report_edit_requests table already exists');
      }
    } catch (err) {
      console.error('Error creating daily_report_edit_requests table:', err.message);
    }

    // Create payroll_settings table if not exists
    try {
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'payroll_settings'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        // Create ENUM type for deductionType if it doesn't exist
        await db.sequelize.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_payroll_settings_deduction_type') THEN
              CREATE TYPE enum_payroll_settings_deduction_type AS ENUM ('percentage', 'fixed');
            END IF;
          END $$;
        `);
        
        await db.sequelize.query(`
          CREATE TABLE payroll_settings (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            "alphaDeduction" DECIMAL(10, 2) DEFAULT 0,
            "izinDeduction" DECIMAL(10, 2) DEFAULT 0,
            "lateDeduction" DECIMAL(10, 2) DEFAULT 0,
            "breakLateDeduction" DECIMAL(10, 2) DEFAULT 0,
            "earlyLeaveDeduction" DECIMAL(10, 2) DEFAULT 0,
            "noReportDeduction" DECIMAL(10, 2) DEFAULT 0,
            "maxLateAllowed" INTEGER DEFAULT 0,
            "maxBreakLateAllowed" INTEGER DEFAULT 0,
            "maxEarlyLeaveAllowed" INTEGER DEFAULT 0,
            "deductionType" enum_payroll_settings_deduction_type DEFAULT 'percentage',
            "perfectAttendanceBonus" DECIMAL(10, 2) DEFAULT 0,
            "allReportsBonus" DECIMAL(10, 2) DEFAULT 0,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
          )
        `);
        console.log('Created payroll_settings table');
      } else {
        console.log('payroll_settings table already exists');
      }
    } catch (err) {
      console.error('Error creating payroll_settings table:', err.message);
    }

    // Create user_holiday_settings table if not exists
    try {
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_holiday_settings'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        await db.sequelize.query(`
          CREATE TABLE user_holiday_settings (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            day1 INTEGER NOT NULL CHECK (day1 >= 0 AND day1 <= 6),
            day2 INTEGER CHECK (day2 >= 0 AND day2 <= 6),
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            CONSTRAINT check_different_days CHECK (day1 != day2 OR day2 IS NULL)
          )
        `);
        console.log('Created user_holiday_settings table');
      } else {
        console.log('user_holiday_settings table already exists');
      }
    } catch (err) {
      console.error('Error creating user_holiday_settings table:', err.message);
    }

    // Create user_time_settings table if not exists
    try {
      const [tableCheck] = await db.sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_time_settings'
        )
      `);
      
      if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
        await db.sequelize.query(`
          CREATE TABLE user_time_settings (
            id SERIAL PRIMARY KEY,
            "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            "checkInTime" TIME NOT NULL DEFAULT '08:00',
            "checkOutTime" TIME NOT NULL DEFAULT '17:00',
            "breakStartTime" TIME NOT NULL DEFAULT '12:00',
            "breakEndTime" TIME NOT NULL DEFAULT '13:00',
            "checkInTolerance" INTEGER NOT NULL DEFAULT 15,
            "breakDuration" INTEGER NOT NULL DEFAULT 60,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
          )
        `);
        console.log('Created user_time_settings table');
      } else {
        console.log('user_time_settings table already exists');
      }
    } catch (err) {
      console.error('Error creating user_time_settings table:', err.message);
    }

    // seed default settings
    const defaultSettings = [
      { key: 'breakDuration', value: '60' },
      { key: 'dailyRate', value: '100000' },
      { key: 'checkInTime', value: '08:00' },
      { key: 'checkOutTime', value: '17:00' },
      { key: 'breakStartTime', value: '12:00' },
      { key: 'breakEndTime', value: '13:00' },
      { key: 'checkInTolerance', value: '15' },
      { key: 'reportStartTime', value: '08:00' },
      { key: 'reportEndTime', value: '18:00' }
    ];
    
    for (const setting of defaultSettings) {
      const existing = await db.Setting.findOne({ where: { key: setting.key } });
      if (!existing) {
        await db.Setting.create(setting);
        console.log(`Created default setting ${setting.key}=${setting.value}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

migrate();
