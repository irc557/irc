const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const db = require('./mysql'); // Ensure this is createPool
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');
const multer = require('multer');
const moment = require('moment'); // install with: npm install moment
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const fs = require('fs');
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const port = process.env.PORT || 5000;
// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // âœ… Save directly to public/uploads (no subfolder)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.body.staffId || 'file'}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 400 * 1024 }, // 400KB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPEG and PNG images are allowed.'));
        }
        cb(null, true);
    }
});
// NEW: For memorization videos/audio only (MP4, MP3, etc.)
const uploadVideo = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads'),
        filename: (req, file, cb) => {
            const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `video-${unique}${path.extname(file.originalname)}`);
        }
    }),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video and audio files allowed'));
        }
    }
});


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key', // Replace with a strong, unique secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true for HTTPS
}));

const errorLog = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });

function log(msg, data = null) {
  const line = `[${new Date().toISOString()}] ${msg}${data ? ' | ' + JSON.stringify(data) : ''}\n`;
  console.log(line);
  errorLog.write(line);
}

// Global error handler – NEVER return HTML
app.use((err, req, res, next) => {
  log(`UNHANDLED ERROR: ${req.method} ${req.url}`, err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});
// Initialize SuperAdmin if not exists
function initializeSuperAdmin() {
    const checkSuperAdminQuery = 'SELECT COUNT(*) as count FROM admins WHERE role = "SuperAdmin"';
    db.query(checkSuperAdminQuery, (err, results) => {
        if (err) {
            console.error('Error checking SuperAdmin count:', err);
            return;
        }
        const superAdminCount = results[0].count;
        if (superAdminCount === 0) {
            const defaultPassword = bcrypt.hashSync('admin', 10);
            const insertQuery = 'INSERT INTO admins (username, password, name, phone, security_question, security_answer, role, first_login) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)';
            db.query(insertQuery, ['admin', defaultPassword, 'Default Admin', '1234567890', 'What is your pet\'s name?', 'DOG', 'SuperAdmin'], (err) => {
                if (err) console.error('Error creating default SuperAdmin:', err);
                else console.log('Default SuperAdmin created.');
            });
        }
    });
}
initializeSuperAdmin();

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/admin-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});
app.get('/staff-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'staff_login.html'));
});

app.get('/public', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_reports.html'));
});
app.get('/staff-dashboard', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/staff-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'staff_dashboard.html'));
});
app.get('/student-dashboard', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/student-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'student_dashboard.html'));
});
app.get('/student-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student_login.html'));
});


// Admin login route
app.post('/api/admin-login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM admins WHERE username = ?';
    db.query(query, [username.trim()], async (err, results) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const admin = results[0];

        try {
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch || (admin.role === 'SuperAdmin' && password === 'admin' && username.trim().toLowerCase() === 'admin')) {
                req.session.isAuthenticated = true;
                req.session.username = username.trim();
                req.session.role = admin.role;
                return res.status(200).json({
                    success: true,
                    message: admin.first_login ? 'First-time login detected. Please update credentials.' : 'Login successful.',
                    redirect: admin.first_login ? '/admin-dashboard?first_login=true' : '/admin-dashboard'
                });
            } else {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }
        } catch (error) {
            console.error('Error comparing passwords:', error);
            return res.status(500).json({ success: false, message: 'Server error during password verification.' });
        }
    });
});

// Update admin credentials on first login
// Update admin credentials on first login (with debug logs)
app.post('/api/update-admin-credentials', async (req, res) => {
    try {
        console.log("Incoming request body:", req.body);

        const { username, newUsername, newPassword, newPhone, securityQuestion, securityAnswer, newName } = req.body;

        // Require only the essentials
        if (!username || !newUsername || !newPassword) {
            console.warn("Missing required fields:", { username, newUsername, newPassword });
            return res.status(400).json({ success: false, message: 'Username, new username, and new password are required.' });
        }

        const trimmedUsername = newUsername.trim();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log("Checking if new username already exists:", trimmedUsername);

        // Check if another user already has the new username
        const checkQuery = 'SELECT * FROM admins WHERE username = ? AND username != ?';
        db.query(checkQuery, [trimmedUsername, username.trim()], (err, results) => {
            if (err) {
                console.error('DB error checking username:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            console.log("Check query results:", results);

            if (results.length > 0) {
                console.warn("Username already exists:", trimmedUsername);
                return res.status(400).json({ success: false, message: 'Username already exists.' });
            }

            // Build update dynamically
            let updateFields = ['username = ?', 'password = ?', 'first_login = FALSE'];
            let values = [trimmedUsername, hashedPassword];

            if (newName) {
                updateFields.push('name = ?');
                values.push(newName);
            }
            if (newPhone) {
                updateFields.push('phone = ?');
                values.push(newPhone);
            }
            if (securityQuestion) {
                updateFields.push('security_question = ?');
                values.push(securityQuestion);
            }
            if (securityAnswer) {
                updateFields.push('security_answer = ?');
                values.push(securityAnswer.trim().toUpperCase());
            }

            values.push(username.trim());

            const updateQuery = `UPDATE admins SET ${updateFields.join(', ')} WHERE username = ?`;
            console.log("Executing update query:", updateQuery);
            console.log("With values:", values);

            db.query(updateQuery, values, (err, result) => {
                if (err) {
                    console.error('DB error updating credentials:', err);
                    return res.status(500).json({ success: false, message: 'Database error.' });
                }

                console.log("Update result:", result);

                if (result.affectedRows === 0) {
                    console.warn("Admin not found for username:", username.trim());
                    return res.status(404).json({ success: false, message: 'Admin not found.' });
                }

                req.session.username = trimmedUsername;
                console.log("Credentials updated successfully for:", trimmedUsername);

                res.status(200).json({
                    success: true,
                    message: 'Credentials updated successfully.',
                    redirect: '/admin-dashboard'
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error updating credentials:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

 // ====================================================================
// STAFF LOGIN AND FIRST-TIME UPDATE ROUTES
// ====================================================================

// Staff Login
app.post('/api/staff-login', async (req, res) => {
    const { staffId, password } = req.body;
    const trimmedStaffId = staffId ? staffId.trim() : null;

    if (!trimmedStaffId || !password) {
        return res.status(400).json({ success: false, message: 'Staff ID and password are required.' });
    }

    const query = 'SELECT staff_id, password, first_login, role FROM staff WHERE staff_id = ? AND status = "Active"';

    db.query(query, [trimmedStaffId], async (err, results) => {
        if (err) {
            console.error('[DB_ERROR] Login query failed:', err);
            return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
        }

        const staff = results[0];
        let isAuthenticated = false;

        // 1. Check for FIRST-TIME LOGIN (default password, plain text check)
        if (staff.first_login && password === 'default') {
            isAuthenticated = true;
        } 
        // 2. Standard Login (compare with HASHED password)
        else if (!staff.first_login && staff.password) {
            try {
                isAuthenticated = await bcrypt.compare(password, staff.password);
            } catch (error) {
                console.error('[BCRYPT_ERROR] Comparison failed:', error.message);
                isAuthenticated = false;
            }
        }
        
        if (isAuthenticated) {
            // Set session variables
            req.session.isAuthenticated = true;
            req.session.staffId = staff.staff_id;
            req.session.role = staff.role;
            req.session.userType = 'staff';
            
            const isFirstLogin = staff.first_login;

            return res.status(200).json({
                success: true,
                message: isFirstLogin ? 'First-time login detected. Please update credentials.' : 'Login successful.',
                redirect: isFirstLogin ? '/staff-dashboard?first_login=true' : '/staff-dashboard'
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
    });
});

// Update staff credentials on first login
app.post('/api/update-staff-credentials', async (req, res) => {
    // Note: We are using the original staffId (from the hidden field) to find the record.
    const { staffId, newStaffId, newPassword, newPhone, newName, newEmail, securityQuestion, securityAnswer } = req.body;

    if (!staffId || !newStaffId || !newPassword || !newPhone || !newName || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ success: false, message: 'All fields except email are required.' });
    }

    if (securityQuestion.trim().length === 0 || securityAnswer.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Security question and answer cannot be empty.' });
    }
    
    if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
        const trimmedStaffId = newStaffId.trim();
        const trimmedName = newName.trim();
        const trimmedPhone = newPhone.trim();
        const trimmedQuestion = securityQuestion.trim().toUpperCase();
        const trimmedAnswer = securityAnswer.trim().toUpperCase();
        
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10); 

        // 1. Check if the new Staff ID is already taken by another user
        const checkQuery = 'SELECT * FROM staff WHERE staff_id = ? AND staff_id != ?';
        db.query(checkQuery, [trimmedStaffId, staffId.trim()], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
            }
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'New Staff ID already exists.' });
            }

            // 2. Perform the update
            const updateQuery = `
                UPDATE staff 
                SET staff_id = ?, password = ?, name = ?, phone = ?, email = ?, 
                    security_question = ?, security_answer = ?, first_login = FALSE 
                WHERE staff_id = ?
            `;
            db.query(
                updateQuery,
                [trimmedStaffId, hashedPassword, trimmedName, trimmedPhone, newEmail || null, trimmedQuestion, trimmedAnswer, staffId.trim()],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ success: false, message: 'Staff not found.' });
                    }
                    
                    // Update session with the new staff ID
                    req.session.staffId = trimmedStaffId;
                    
                    res.status(200).json({
                        success: true,
                        message: 'Credentials updated successfully.',
                        redirect: '/staff-dashboard'
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
});

// ====================================================================
// FORGOT PASSWORD ROUTES
// ====================================================================

// Verify Staff ID
app.post('/api/staff/forgot-password/verify-staff-id', (req, res) => {
    const { staff_id } = req.body;
    if (!staff_id || staff_id.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Staff ID is required.' });
    }

    const query = 'SELECT security_question FROM staff WHERE staff_id = ?';
    db.query(query, [staff_id.trim()], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff ID not found.' });
        }
        // Check if security question is set (required for reset)
        if (!results[0].security_question || results[0].security_question.trim().length === 0) {
             return res.status(404).json({ success: false, message: 'Security question not set. Contact administrator.' });
        }
        res.status(200).json({ success: true, securityQuestion: results[0].security_question });
    });
});

// Verify Security Answer
app.post('/api/staff/forgot-password/verify-answer', (req, res) => {
    const { staff_id, securityAnswer } = req.body;

    if (!staff_id || !securityAnswer || staff_id.trim().length === 0 || securityAnswer.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Staff ID and security answer are required.' });
    }

    const query = 'SELECT security_answer FROM staff WHERE staff_id = ?';
    db.query(query, [staff_id.trim()], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff ID not found.' });
        }

        const storedAnswer = results[0].security_answer;
        // NOTE: Comparing the uppercased answer (as stored during update)
        const inputAnswer = securityAnswer.trim().toUpperCase();
        
        if (inputAnswer === storedAnswer) {
            res.status(200).json({ success: true, message: 'Security answer verified.' });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect security answer.' });
        }
    });
});

// Reset Password
app.post('/api/staff/forgot-password/reset-password', async (req, res) => {
    const { staff_id, newPassword } = req.body;

    if (!staff_id || !newPassword || staff_id.trim().length === 0 || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Staff ID and new password are required.' });
    }
    
    if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10); 
        // Resetting password sets first_login to FALSE, ensuring they don't get the update prompt on next login
        const query = 'UPDATE staff SET password = ?, first_login = FALSE WHERE staff_id = ?';
        db.query(query, [hashedPassword, staff_id.trim()], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Staff ID not found.' });
            }
            
            res.status(200).json({
                success: true,
                message: 'Password reset successfully. Please log in with your new password.',
                redirect: '/staff-login'
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error processing password: ${error.message}` });
    }
});

// ====================================================================
// PROFILE PICTURE ROUTES
// ====================================================================

// Upload staff profile picture
app.post('/api/staff/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { staffId } = req.body;

    if (!staffId) {
        return res.status(400).json({ success: false, message: 'Staff ID is required.' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
        const filePath = `uploads/${req.file.filename}`;
        const query = 'UPDATE staff SET profile_picture = ? WHERE id = ?';

        db.query(query, [filePath, staffId], (err, result) => {
            if (err) {
                console.error('Error uploading staff profile picture:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Staff member not found.' });
            }
            res.status(200).json({ success: true, message: 'Staff Records Save successfully.', filePath });
        });
    } catch (error) {
        console.error('Error processing profile picture:', error);
        res.status(500).json({ success: false, message: 'Error processing image.' });
    }
});

// Retrieve staff profile picture
app.get('/api/staff/profile-picture/:id', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const staffId = req.params.id;
    const query = 'SELECT profile_picture FROM staff WHERE id = ?';

    db.query(query, [staffId], (err, results) => {
        if (err) {
            console.error('Error fetching staff profile picture:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length === 0 || !results[0].profile_picture) {
            return res.status(200).json({ success: true, data: 'uploads/default.jpg' }); // Default image
        }
        res.status(200).json({ success: true, data: results[0].profile_picture });
    });
});



// Staff Session (to fetch numeric staff ID)
app.get('/api/staff-session', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const query = 'SELECT id FROM staff WHERE staff_id = ? AND status = "Active"';
    db.query(query, [req.session.staffId], (err, results) => {
        if (err) {
            console.error('Error fetching staff ID:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff not found.' });
        }
        res.status(200).json({ success: true, data: { staff_id: results[0].id } });
    });
});

// Staff Logout
app.post('/api/staff-logout', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
});


app.get('/api/classes', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = `
        SELECT class_id AS id, class_name AS name, 1 AS section_id FROM Classes
        UNION
        SELECT western_class_id AS id, class_name AS name, 2 AS section_id FROM Western_Classes
        ORDER BY name
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }
        console.log('Classes fetched:', results); // Debug
        res.status(200).json({ success: true, data: results });
    });
});

// Staff Students
app.get('/api/staff-students/:staffId', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const { staffId } = req.params;
    const { section_id, class_id } = req.query;
    const query = `
        SELECT 
            s.student_id,
            s.full_name,
            s.gender
        FROM staff st
        JOIN staff_classes sc ON st.id = sc.staff_id
        JOIN Student_Enrollments se ON sc.section_id = se.section_id AND 
            ((sc.section_id = 1 AND sc.class_id = se.class_ref) OR 
             (sc.section_id = 2 AND sc.western_class_id = se.class_ref))
        JOIN Students s ON se.student_id = s.id
        WHERE st.id = ? AND sc.section_id = ? AND 
              ((sc.section_id = 1 AND sc.class_id = ?) OR 
               (sc.section_id = 2 AND sc.western_class_id = ?))
    `;
    db.query(query, [staffId, section_id, class_id, class_id], (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Staff Subjects
app.get('/api/staff-subjects/:staffId', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const { staffId } = req.params;
    const { section_id } = req.query;
    const query = `
        SELECT DISTINCT su.subject_id, su.subject_name
        FROM staff st
        JOIN staff_subjects ss ON st.id = ss.staff_id
        JOIN Subjects su ON ss.subject_id = su.subject_id
        WHERE st.id = ? AND ss.section_id = ?
    `;
    db.query(query, [staffId, section_id], (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Staff Assessments
app.get('/api/staff-assessments/:staffId', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const { staffId } = req.params;
    const { section_id, class_id, subject_id } = req.query;
    const query = `
        SELECT 
            s.full_name AS student_name,
            se.enrollment_id,
            ssa.ca1_score,
            ssa.ca2_score,
            ssa.exam_score,
            ssa.comments
        FROM staff st
        JOIN staff_classes sc ON st.id = sc.staff_id
        JOIN Student_Enrollments se ON sc.section_id = se.section_id AND 
            ((sc.section_id = 1 AND sc.class_id = se.class_ref) OR 
             (sc.section_id = 2 AND sc.western_class_id = se.class_ref))
        JOIN Students s ON se.student_id = s.id
        LEFT JOIN Student_Subject_Assessments ssa ON se.enrollment_id = ssa.enrollment_id 
            AND ssa.subject_id = ? AND ssa.term = 1
        WHERE st.id = ? AND sc.section_id = ? AND 
              ((sc.section_id = 1 AND sc.class_id = ?) OR 
               (sc.section_id = 2 AND sc.western_class_id = ?))
    `;
    db.query(query, [subject_id, staffId, section_id, class_id, class_id], (err, results) => {
        if (err) {
            console.error('Error fetching assessments:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

app.post('/api/staff-assessments/:staffId', (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { staffId } = req.params;
  const { section_id, class_id, subject_id, term, session, assessments } = req.body; // ✅ include session

  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    const deleteQuery = `
      DELETE ssa FROM Student_Subject_Assessments ssa
      JOIN Student_Enrollments se ON ssa.enrollment_id = se.enrollment_id
      JOIN staff_classes sc ON se.section_id = sc.section_id AND 
        ((sc.section_id = 1 AND sc.class_id = se.class_ref) OR
         (sc.section_id = 2 AND sc.western_class_id = se.class_ref))
      JOIN staff st ON sc.staff_id = st.id
      WHERE st.id = ? AND sc.section_id = ? AND
        ((sc.section_id = 1 AND sc.class_id = ?) OR
         (sc.section_id = 2 AND sc.western_class_id = ?))
      AND ssa.subject_id = ? AND ssa.term = ? AND ssa.session_year = ?
    `;

    db.query(deleteQuery, [staffId, section_id, class_id, class_id, subject_id, term, session], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error deleting old assessments:', err);
          res.status(500).json({ success: false, message: 'Database error.' });
        });
      }

      // ✅ Added session_year
      const insertQuery = `
        INSERT INTO Student_Subject_Assessments 
        (enrollment_id, subject_id, term, session_year, ca1_score, ca2_score, exam_score, comments, date)
        VALUES ?
      `;

      const today = new Date().toISOString().split('T')[0];
      const values = assessments.map(record => [
        record.enrollment_id,
        subject_id,
        term,
        session,           // ✅ include session_year
        record.ca1_score,
        record.ca2_score,
        record.exam_score,
        record.comments,
        record.date || today // ✅ use provided date or fallback to today
      ]);

      db.query(insertQuery, [values], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error saving assessments:', err);
            res.status(500).json({ success: false, message: 'Database error.' });
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Commit error:', err);
              res.status(500).json({ success: false, message: 'Database error.' });
            });
          }

          res.status(200).json({ success: true, message: 'Assessments saved.' });
        });
      });
    });
  });
});

app.get("/api/subject-results", (req, res) => {
  const { section_id, class_id, subject_id, term, session } = req.query;
  const sql = `SELECT s.full_name, s.student_id, ssa.ca1_score, ssa.ca2_score, ssa.exam_score
               FROM Student_Enrollments se
               JOIN Students s ON se.student_id = s.id
               LEFT JOIN Student_Subject_Assessments ssa ON ssa.enrollment_id = se.enrollment_id
                 AND ssa.subject_id = ? AND ssa.term = ? AND ssa.session_year = ?
               WHERE se.section_id = ? AND se.class_ref = ?
               ORDER BY s.full_name`;
  db.query(sql, [subject_id, term, session, section_id, class_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: rows });
  });
});
// Fetch all classes
app.get('/api/classes', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const query = `
        SELECT class_id AS id, class_name AS name, 1 AS section_id FROM Classes
        UNION
        SELECT western_class_id AS id, class_name AS name, 2 AS section_id FROM Western_Classes
        ORDER BY name
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch all subjects
app.get('/api/subjects', (req, res) => {
    const query = `
        SELECT 
            s.subject_id AS id,
            s.subject_name AS name,
            d.section_id
        FROM Subjects s
        JOIN Departments d ON s.dept_id = d.dept_id
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err.sqlMessage || err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.json({ success: true, data: results });
    });
});

// ================== Fetch all staff ==================


app.get('/api/staff', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = `
        SELECT 
            s.id,
            s.staff_id,
            s.name,
            s.email,
            s.phone,
            s.role,
            s.profile_picture,
            GROUP_CONCAT(DISTINCT 
                COALESCE(c.class_name, wc.class_name)
                ORDER BY c.class_name, wc.class_name SEPARATOR ', '
            ) AS classes_taught,
            GROUP_CONCAT(DISTINCT 
                sub.subject_name
                ORDER BY sub.subject_name SEPARATOR ', '
            ) AS subjects_taught,
            GROUP_CONCAT(DISTINCT 
                CASE 
                    WHEN sfm.section_id = 1 THEN CONCAT('Form Master: ', c_fm.class_name)
                    WHEN sfm.section_id = 2 THEN CONCAT('Form Master: ', wc_fm.class_name)
                    ELSE NULL
                END SEPARATOR ' | '
            ) AS form_master_info
        FROM staff s
        LEFT JOIN staff_classes sc ON s.id = sc.staff_id
        LEFT JOIN Classes c ON sc.class_id = c.class_id AND sc.section_id = 1
        LEFT JOIN Western_Classes wc ON sc.western_class_id = wc.western_class_id AND sc.section_id = 2
        LEFT JOIN staff_subjects ss ON s.id = ss.staff_id
        LEFT JOIN Subjects sub ON ss.subject_id = sub.subject_id
        LEFT JOIN staff_form_master sfm ON s.id = sfm.staff_id AND sfm.term = (SELECT MAX(term) FROM staff_form_master)
        LEFT JOIN Classes c_fm ON sfm.class_id = c_fm.class_id AND sfm.section_id = 1
        LEFT JOIN Western_Classes wc_fm ON sfm.western_class_id = wc_fm.western_class_id AND sfm.section_id = 2
        GROUP BY s.id, s.staff_id, s.name, s.email, s.phone, s.role, s.profile_picture
        ORDER BY s.id DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching staff:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// ================== Fetch single staff ==================
app.get('/api/staff/:id', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const staffId = req.params.id;
    const staffQuery = 'SELECT id, staff_id, name, email, phone, role, profile_picture FROM staff WHERE id = ?';

    db.query(staffQuery, [staffId], (err, staffResults) => {
        if (err) {
            console.error('Error fetching staff details:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (staffResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const staff = staffResults[0];

        const classesQuery = 'SELECT class_id, western_class_id, section_id FROM staff_classes WHERE staff_id = ?;';
        const subjectsQuery = 'SELECT subject_id, section_id FROM staff_subjects WHERE staff_id = ?;'; // ✅ include section_id
        const formMasterQuery = `
            SELECT class_id, western_class_id, section_id 
            FROM staff_form_master 
            WHERE staff_id = ? 
            AND term = (SELECT MAX(term) FROM staff_form_master) 
            LIMIT 1;
        `;

        db.query(classesQuery, [staffId], (err, classesResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Classes fetch error.' });

            db.query(subjectsQuery, [staffId], (err, subjectsResults) => {
                if (err) return res.status(500).json({ success: false, message: 'Subjects fetch error.' });

                db.query(formMasterQuery, [staffId], (err, formMasterResults) => {
                    if (err) return res.status(500).json({ success: false, message: 'Form Master fetch error.' });

                    staff.classes = classesResults.map(r => ({
                        class_id: r.class_id || r.western_class_id,
                        section_id: r.section_id
                    }));

                    staff.subjects = subjectsResults.map(r => ({
                        subject_id: r.subject_id,
                        section_id: r.section_id
                    }));

                    staff.formMaster = formMasterResults.length > 0 ? {
                        class_id: formMasterResults[0].class_id || formMasterResults[0].western_class_id,
                        section_id: formMasterResults[0].section_id
                    } : null;

                    res.status(200).json({ success: true, data: staff });
                });
            });
        });
    });
});

// ================== Add or Update staff ==================
app.post('/api/staff', async (req, res) => {
    if (!req.session.isAuthenticated) {
        console.error('Unauthorized access attempt to /api/staff');
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { id, staff_id, name, email, phone, role, password, classes_taught, subjects_taught, form_master_class } = req.body;

    if (!staff_id || !name || !phone || !role) {
        console.error('Missing required fields:', { staff_id, name, phone, role });
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const isUpdate = !!id;
    const term = 1; // default term

    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        if (!isUpdate) {
            const rawPassword = password || "default";
            bcrypt.hash(rawPassword, 10, (err, hash) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Hashing error:', err);
                        res.status(500).json({ success: false, message: 'Error hashing password.' });
                    });
                }
                insertStaff(hash);
            });
        } else {
            updateStaff();
        }

        function insertStaff(hashedPassword) {
            const createQuery = 'INSERT INTO staff (staff_id, name, email, phone, role, password, profile_picture) VALUES (?, ?, ?, ?, ?, ?, NULL)';
            db.query(createQuery, [staff_id, name, email, phone, role, hashedPassword], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error creating staff:', err);
                        res.status(500).json({ success: false, message: 'Database error.' });
                    });
                }
                const newStaffId = result.insertId; // Capture the new ID
                console.log(`Created staff with ID: ${newStaffId}, staff_id: ${staff_id}`);
                insertRelationships(newStaffId);
            });
        }

        function updateStaff() {
            const updateQuery = 'UPDATE staff SET staff_id = ?, name = ?, email = ?, phone = ?, role = ? WHERE id = ?';
            db.query(updateQuery, [staff_id, name, email, phone, role, id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error updating staff:', err);
                        res.status(500).json({ success: false, message: 'Database error.' });
                    });
                }
                deleteOldRelationships(id);
            });
        }

        function deleteOldRelationships(staffId) {
            db.query('DELETE FROM staff_classes WHERE staff_id = ?', [staffId], (err) => {
                if (err) return rollbackError('Error deleting staff classes:', err);

                db.query('DELETE FROM staff_subjects WHERE staff_id = ?', [staffId], (err) => {
                    if (err) return rollbackError('Error deleting staff subjects:', err);

                    db.query('DELETE FROM staff_form_master WHERE staff_id = ? AND term = ?', [staffId, term], (err) => {
                        if (err) return rollbackError('Error deleting form master:', err);
                        insertRelationships(staffId);
                    });
                });
            });
        }

        function insertRelationships(staffId) {
            if (classes_taught && Array.isArray(classes_taught) && classes_taught.length > 0) {
                const classValues = classes_taught.map(cls => {
                    const [section_id, class_id] = cls.split(':').map(Number);
                    return [
                        staffId,
                        section_id === 1 ? class_id : null,
                        section_id === 2 ? class_id : null,
                        section_id,
                        term
                    ];
                }).filter(row => row[1] !== null || row[2] !== null);

                if (classValues.length > 0) {
                    const classInsertQuery = `
                        INSERT INTO staff_classes (staff_id, class_id, western_class_id, section_id, term)
                        VALUES ?
                    `;
                    db.query(classInsertQuery, [classValues], (err) => {
                        if (err) return rollbackError('Error inserting staff classes:', err);
                    });
                }
            }

            if (subjects_taught && Array.isArray(subjects_taught) && subjects_taught.length > 0) {
                const subjectValues = subjects_taught.map(subject => {
                    const [section_id, subject_id] = subject.split(':').map(Number);
                    return [staffId, subject_id, section_id, term];
                }).filter(row => row[1] && row[2]);

                if (subjectValues.length > 0) {
                    const subjectInsertQuery = `
                        INSERT INTO staff_subjects (staff_id, subject_id, section_id, term)
                        VALUES ?
                    `;
                    db.query(subjectInsertQuery, [subjectValues], (err) => {
                        if (err) {
                            console.error('Error inserting staff subjects:', err);
                            return rollbackError('Error inserting staff subjects:', err);
                        }
                    });
                }
            }

            if (form_master_class) {
                const [section_id, class_id] = form_master_class.split(':').map(Number);
                const fmInsertQuery = `
                    INSERT INTO staff_form_master (staff_id, class_id, western_class_id, section_id, term)
                    VALUES (?, ?, ?, ?, ?)
                `;
                db.query(fmInsertQuery, [staffId, section_id === 1 ? class_id : null, section_id === 2 ? class_id : null, section_id, term], (err) => {
                    if (err) return rollbackError('Error inserting form master:', err);
                });
            }

            db.commit((err) => {
                if (err) return rollbackError('Commit error:', err);

                fetchEnrichedStaff(staffId, (staff) => {
                    if (!staff) {
                        console.error('Failed to fetch enriched staff data for ID:', staffId);
                        return res.status(500).json({ success: false, message: 'Failed to fetch staff data.' });
                    }
                    console.log(`Returning staff data for ID: ${staffId}, staff_id: ${staff.staff_id}, profile_picture: ${staff.profile_picture || 'NULL'}`);
                    res.status(200).json({ 
                        success: true, 
                        message: isUpdate ? 'Staff updated successfully.' : 'Staff created successfully.',
                        data: staff,
                        id: staffId // Explicitly return the staff ID
                    });
                });
            });
        }

        function rollbackError(msg, err) {
            return db.rollback(() => {
                console.error(msg, err);
                res.status(500).json({ success: false, message: 'Database error.' });
            });
        }
    });
});

// Helper: Fetch Enriched Staff
function fetchEnrichedStaff(staffId, callback) {
    const staffQuery = 'SELECT id, staff_id, name, email, phone, role, profile_picture FROM staff WHERE id = ?';
    const classesQuery = 'SELECT class_id, western_class_id, section_id FROM staff_classes WHERE staff_id = ?';
    const subjectsQuery = 'SELECT subject_id, section_id FROM staff_subjects WHERE staff_id = ?';
    const formMasterQuery = `
        SELECT class_id, western_class_id, section_id 
        FROM staff_form_master 
        WHERE staff_id = ? 
        AND term = (SELECT MAX(term) FROM staff_form_master) 
        LIMIT 1
    `;

    db.query(staffQuery, [staffId], (err, staffResults) => {
        if (err || staffResults.length === 0) {
            console.error('Error fetching staff:', err || `No staff found for ID: ${staffId}`);
            return callback(null);
        }

        const staff = staffResults[0];
        console.log(`Fetched staff: ID=${staff.id}, staff_id=${staff.staff_id}, profile_picture=${staff.profile_picture || 'NULL'}`);

        db.query(classesQuery, [staffId], (err, classesResults) => {
            if (err) {
                console.error('Error fetching classes for staff ID:', staffId, err);
                return callback(null);
            }
            staff.classes = classesResults.map(r => ({
                class_id: r.class_id || r.western_class_id,
                section_id: r.section_id
            }));

            db.query(subjectsQuery, [staffId], (err, subjectsResults) => {
                if (err) {
                    console.error('Error fetching subjects for staff ID:', staffId, err);
                    return callback(null);
                }
                staff.subjects = subjectsResults.map(r => ({
                    subject_id: r.subject_id,
                    section_id: r.section_id
                }));

                db.query(formMasterQuery, [staffId], (err, formMasterResults) => {
                    if (err) {
                        console.error('Error fetching form master for staff ID:', staffId, err);
                        return callback(null);
                    }
                    staff.formMaster = formMasterResults.length > 0 ? {
                        class_id: formMasterResults[0].class_id || formMasterResults[0].western_class_id,
                        section_id: formMasterResults[0].section_id
                    } : null;

                    console.log(`Enriched staff data for ID: ${staffId}, profile_picture: ${staff.profile_picture || 'NULL'}`);
                    callback(staff);
                });
            });
        });
    });
}
// ==========================
// PUT UPDATE STAFF (SAFE UPDATE)
// ==========================
app.put("/api/staff/:id", async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }

  const id = req.params.id
  const { staff_id, name, email, phone, role, classes_taught, subjects_taught, form_master_class } = req.body
  const term = 1

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction start error:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }

    // 🔹 Build dynamic UPDATE for staff table
    const updateFields = []
    const params = []

    if (staff_id) {
      updateFields.push("staff_id = ?")
      params.push(staff_id.trim())
    }
    if (name) {
      updateFields.push("name = ?")
      params.push(name.trim())
    }
    if (email !== undefined) {
      updateFields.push("email = ?")
      params.push(email || null)
    }
    if (phone) {
      updateFields.push("phone = ?")
      params.push(phone.trim())
    }
    if (req.body.hasOwnProperty("role")) {
      updateFields.push("role = ?")
      params.push(role ? role.trim() : null)
    }

    params.push(id)

    if (updateFields.length > 0) {
      const sql = `UPDATE staff SET ${updateFields.join(", ")} WHERE id = ?`
      db.query(sql, params, (err, result) => {
        if (err) return rollbackError("Error updating staff table:", err)
        if (result.affectedRows === 0) {
          return db.rollback(() => res.status(404).json({ success: false, message: "Staff not found." }))
        }
        updateRelations(id)
      })
    } else {
      updateRelations(id) // no basic fields changed, go straight to relations
    }

    // 🔹 Update relations only if provided
    function updateRelations(staffId) {
      if (req.body.hasOwnProperty("classes_taught")) {
        db.query("DELETE FROM staff_classes WHERE staff_id = ?", [staffId], (err) => {
          if (err) return rollbackError("Error clearing old classes:", err)

          // If array has items, insert them
          if (Array.isArray(classes_taught) && classes_taught.length > 0) {
            const classValues = classes_taught.map((cls) => {
              const [section_id, class_id] = cls.split(":").map(Number)
              return [staffId, section_id === 1 ? class_id : null, section_id === 2 ? class_id : null, section_id, term]
            })

            db.query(
              "INSERT INTO staff_classes (staff_id, class_id, western_class_id, section_id, term) VALUES ?",
              [classValues],
              (err) => {
                if (err) return rollbackError("Error inserting classes:", err)
                updateSubjects(staffId)
              },
            )
          } else {
            // Empty array means clear all classes
            updateSubjects(staffId)
          }
        })
      } else {
        // Field not sent, preserve existing data
        updateSubjects(staffId)
      }
    }

    function updateSubjects(staffId) {
      if (req.body.hasOwnProperty("subjects_taught")) {
        db.query("DELETE FROM staff_subjects WHERE staff_id = ?", [staffId], (err) => {
          if (err) return rollbackError("Error clearing old subjects:", err)

          // If array has items, insert them
          if (Array.isArray(subjects_taught) && subjects_taught.length > 0) {
            const subjectValues = subjects_taught.map((sub) => {
              const [section_id, subject_id] = sub.split(":").map(Number)
              return [staffId, subject_id, section_id, term]
            })

            db.query(
              "INSERT INTO staff_subjects (staff_id, subject_id, section_id, term) VALUES ?",
              [subjectValues],
              (err) => {
                if (err) return rollbackError("Error inserting subjects:", err)
                updateFormMaster(staffId)
              },
            )
          } else {
            // Empty array means clear all subjects
            updateFormMaster(staffId)
          }
        })
      } else {
        // Field not sent, preserve existing data
        updateFormMaster(staffId)
      }
    }

    function updateFormMaster(staffId) {
      if (req.body.hasOwnProperty("form_master_class")) {
        // Clear existing form master first
        db.query("DELETE FROM staff_form_master WHERE staff_id = ?", [staffId], (err) => {
          if (err) return rollbackError("Error clearing form master:", err)

          // If value provided, insert new record
          if (form_master_class && form_master_class !== "") {
            const [section_id, class_id] = form_master_class.split(":").map(Number)
            db.query(
              "INSERT INTO staff_form_master (staff_id, class_id, western_class_id, section_id, term) VALUES (?, ?, ?, ?, ?)",
              [staffId, section_id === 1 ? class_id : null, section_id === 2 ? class_id : null, section_id, term],
              (err) => {
                if (err) return rollbackError("Error inserting form master:", err)
                finish(staffId)
              },
            )
          } else {
            // Empty/null value means clear form master (already deleted above)
            finish(staffId)
          }
        })
      } else {
        // Field not sent, preserve existing data
        finish(staffId)
      }
    }

    // Commit and return data
    function finish(staffId) {
      db.commit((err) => {
        if (err) return rollbackError("Commit error:", err)

        fetchEnrichedStaff(staffId, (staff) => {
          res.status(200).json({
            success: true,
            message: "Staff updated successfully.",
            data: staff,
          })
        })
      })
    }

    function rollbackError(msg, err) {
      return db.rollback(() => {
        console.error(msg, err)
        res.status(500).json({ success: false, message: msg })
      })
    }
  })
})

// ================== Helper: Fetch Enriched Staff ==================
function fetchEnrichedStaff(staffId, callback) {
    const staffQuery = 'SELECT id, staff_id, name, email, phone, role, profile_picture FROM staff WHERE id = ?';
    const classesQuery = 'SELECT class_id, western_class_id, section_id FROM staff_classes WHERE staff_id = ?;';
    const subjectsQuery = 'SELECT subject_id, section_id FROM staff_subjects WHERE staff_id = ?;';
    const formMasterQuery = `
        SELECT class_id, western_class_id, section_id 
        FROM staff_form_master 
        WHERE staff_id = ? 
        AND term = (SELECT MAX(term) FROM staff_form_master) 
        LIMIT 1;
    `;

    db.query(staffQuery, [staffId], (err, staffResults) => {
        if (err || staffResults.length === 0) return callback(null);

        const staff = staffResults[0];

        db.query(classesQuery, [staffId], (err, classesResults) => {
            staff.classes = classesResults.map(r => ({
                class_id: r.class_id || r.western_class_id,
                section_id: r.section_id
            }));

            db.query(subjectsQuery, [staffId], (err, subjectsResults) => {
                staff.subjects = subjectsResults.map(r => ({
                    subject_id: r.subject_id,
                    section_id: r.section_id
                }));

                db.query(formMasterQuery, [staffId], (err, formMasterResults) => {
                    staff.formMaster = formMasterResults.length > 0 ? {
                        class_id: formMasterResults[0].class_id || formMasterResults[0].western_class_id,
                        section_id: formMasterResults[0].section_id
                    } : null;

                    callback(staff);
                });
            });
        });
    });
}

// Delete staff member
app.delete('/api/staff/:id', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    } 

    const staffId = req.params.id;
    const query = 'DELETE FROM staff WHERE id = ?';

    db.query(query, [staffId], (err, result) => {
        if (err) {
            console.error('Error deleting staff:', err);
            return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }
        res.status(200).json({ success: true, message: 'Staff member deleted successfully.' });
    });
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.', redirect: '/admin-login' });
    });
});

// Create Admin route (SuperAdmin only)
app.post('/api/create-admin', async (req, res) => {
    if (req.session.role !== 'SuperAdmin') {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const { username, password, name, phone, role, securityQuestion, securityAnswer } = req.body;
    if (!username || !password || !name || !phone || !role || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimmedUsername = username.trim();
    const trimmedAnswer = securityAnswer.trim().toUpperCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkQuery = 'SELECT * FROM admins WHERE username = ?';
    db.query(checkQuery, [trimmedUsername], (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        const insertQuery = 'INSERT INTO admins (username, password, name, phone, security_question, security_answer, role, first_login) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)';
        db.query(insertQuery, [trimmedUsername, hashedPassword, name, phone, securityQuestion, trimmedAnswer, role], (err, result) => {
            if (err) {
                console.error('Error creating admin:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            res.status(200).json({ success: true, message: `${role} created successfully.`, id: result.insertId });
        });
    });
});

// Fetch all admins
app.get('/api/admins', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = 'SELECT id, username, name, phone, role, security_question, security_answer FROM admins';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching admins:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch single admin
app.get('/api/admins/:id', (req, res) => {
    if (!req.session.isAuthenticated || req.session.role !== 'SuperAdmin') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const adminId = req.params.id;
    const query = 'SELECT id, username, name, phone, role, security_question, security_answer FROM admins WHERE id = ?';
    db.query(query, [adminId], (err, results) => {
        if (err) {
            console.error('Error fetching admin:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
        res.status(200).json({ success: true, data: results[0] });
    });
});

// Update admin (SuperAdmin only)
app.put('/api/admins/:id', async (req, res) => {
    if (req.session.role !== 'SuperAdmin') {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const adminId = req.params.id;
    const { username, name, phone, role, securityQuestion, securityAnswer, password } = req.body;

    if (!username || !name || !phone || !role || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ success: false, message: 'All fields except password are required.' });
    }

    const trimmedUsername = username.trim();
    const trimmedAnswer = securityAnswer.trim().toUpperCase();

    const checkQuery = 'SELECT * FROM admins WHERE username = ? AND id != ?';
    db.query(checkQuery, [trimmedUsername, adminId], async (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'Username already exists.' });
        }

        let updateQuery = 'UPDATE admins SET username = ?, name = ?, phone = ?, role = ?, security_question = ?, security_answer = ?';
        const queryParams = [trimmedUsername, name, phone, role, securityQuestion, trimmedAnswer];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?, first_login = TRUE';
            queryParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(adminId);

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating admin:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Admin not found.' });
            }
            res.status(200).json({ success: true, message: 'Admin updated successfully.' });
        });
    });
});

// Delete admin (SuperAdmin only, cannot delete SuperAdmin)
app.delete('/api/admins/:id', (req, res) => {
    if (req.session.role !== 'SuperAdmin') {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const adminId = req.params.id;
    const checkQuery = 'SELECT role FROM admins WHERE id = ?';
    db.query(checkQuery, [adminId], (err, results) => {
        if (err) {
            console.error('Error checking admin role:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }
        if (results[0].role === 'SuperAdmin') {
            return res.status(403).json({ success: false, message: 'Cannot delete SuperAdmin.' });
        }

        const deleteQuery = 'DELETE FROM admins WHERE id = ?';
        db.query(deleteQuery, [adminId], (err, result) => {
            if (err) {
                console.error('Error deleting admin:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Admin not found.' });
            }
            res.status(200).json({ success: true, message: 'Admin deleted successfully.' });
        });
    });
});

// Forgot Password APIs
app.post('/api/forgot-password/verify-username', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const query = 'SELECT security_question FROM admins WHERE username = ?';
    db.query(query, [username.trim()], (err, results) => {
        if (err) {
            console.error('Database error during username verification:', err);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Username not found.' });
        }
        res.status(200).json({ success: true, securityQuestion: results[0].security_question });
    });
});

app.post('/api/forgot-password/verify-answer', (req, res) => {
    const { username, securityAnswer } = req.body;
    if (!username || !securityAnswer) {
        return res.status(400).json({ success: false, message: 'Username and security answer are required.' });
    }

    const query = 'SELECT security_answer FROM admins WHERE username = ?';
    db.query(query, [username.trim()], (err, results) => {
        if (err) {
            console.error('Database error during security answer verification:', err);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Username not found.' });
        }

        const storedAnswer = results[0].security_answer;
        if (securityAnswer.trim().toUpperCase() === storedAnswer) {
            res.status(200).json({ success: true, message: 'Security answer verified.' });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect security answer.' });
        }
    });
});

app.post('/api/forgot-password/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
        return res.status(400).json({ success: false, message: 'Username and new password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = 'UPDATE admins SET password = ?, first_login = FALSE WHERE username = ?';
        db.query(query, [hashedPassword, username.trim()], (err, result) => {
            if (err) {
                console.error('Database error during password reset:', err);
                return res.status(500).json({ success: false, message: 'Server error.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Username not found.' });
            }
            res.status(200).json({ success: true, message: 'Password reset successfully.' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ success: false, message: 'Error processing password.' });
    }
});

// User details route
app.get('/api/user-details', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const username = req.session.username;
    const query = 'SELECT username, name, role, first_login FROM admins WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            data: {
                username: results[0].username,
                name: results[0].name,
                role: results[0].role,
                firstLogin: results[0].first_login
            }
        });
    });
});

// Fetch all bookings
app.get('/api/bookings', (req, res) => {
    if (!req.session.isAuthenticated || req.session.role !== 'SuperAdmin') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = 'SELECT id, name, email, gender, date_of_birth, phone, address, message, time_sent FROM bookings ORDER BY time_sent ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching bookings:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Route to handle booking submission
app.post('/api/bookings', (req, res) => {
    const { name, email, gender, date_of_birth, phone, address, message } = req.body;

    if (!name || !gender || !date_of_birth || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Name, Gender, Date of Birth, Phone, and Address are required.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
        return res.status(400).json({ success: false, message: 'Invalid Date of Birth format. Use YYYY-MM-DD.' });
    }

    if (!['Male', 'Female', 'Other'].includes(gender)) {
        return res.status(400).json({ success: false, message: 'Gender must be Male, Female, or Other.' });
    }

    const query = `
        INSERT INTO bookings (name, email, gender, date_of_birth, phone, address, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [name, email || null, gender, date_of_birth, phone, address, message || null], (err, result) => {
        if (err) {
            console.error('Error inserting booking:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, message: 'Booking submitted successfully!' });
    });
});

// Fetch all classes for dynamic dropdowns
app.get('/api/academic/classes', (req, res) => {
    if (!req.session.isAuthenticated) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    
    const query = `
        SELECT class_id as id, class_name as name, level, section_id FROM Classes 
        UNION ALL
        SELECT western_class_id as id, class_name as name, level, section_id FROM Western_Classes;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all classes:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});


// ========================== // GET ALL STUDENTS // ========================== 
// ==========================
// GET ALL STUDENTS
// ==========================
// ==========================
// GET ALL STUDENTS
// ==========================
app.get('/api/students', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = `
        SELECT 
            s.id,
            s.student_id,
            s.full_name AS name,
            s.gender,
            s.guardian_phone,
            s.address,
            DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
            s.email,
            s.profile_picture,
            GROUP_CONCAT(CONCAT(se.section_id, ':', se.class_ref) SEPARATOR ',') AS classes,
            GROUP_CONCAT(DISTINCT sub.subject_name ORDER BY sub.subject_name SEPARATOR ', ') AS subjects
        FROM Students s
        LEFT JOIN Student_Enrollments se ON s.id = se.student_id
        LEFT JOIN Student_Subjects ss ON se.enrollment_id = ss.enrollment_id
        LEFT JOIN Subjects sub ON ss.subject_id = sub.subject_id
        GROUP BY s.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        results.forEach(student => {
            // ✅ Profile picture handling
            student.profile_picture = student.profile_picture
                ? 'Uploads/' + student.profile_picture.split('/').pop()
                : 'Uploads/default.jpg';

            // ✅ Convert comma-separated classes to array
            student.classes = student.classes ? student.classes.split(',') : [];

            // ✅ Convert comma-separated subject names to array
            student.subjects = student.subjects ? student.subjects.split(', ') : [];
        });

        res.status(200).json({ success: true, data: results });
    });
});


// ==========================
// GET SINGLE STUDENT
// ==========================
app.get('/api/students/:id', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const studentId = req.params.id;

    const studentQuery = `
        SELECT 
            s.id,
            s.student_id,
            s.full_name AS name,
            s.gender,
            DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
            s.guardian_phone,
            s.address,
            s.email,
            s.profile_picture,
            GROUP_CONCAT(
                CONCAT(se.section_id, ':', se.class_ref)
                ORDER BY se.section_id, se.class_ref SEPARATOR ','
            ) AS classes,
            GROUP_CONCAT(
                DISTINCT sub.subject_name
                ORDER BY sub.subject_name SEPARATOR ', '
            ) AS subjects
        FROM Students s
        LEFT JOIN Student_Enrollments se ON s.id = se.student_id
        LEFT JOIN Student_Subjects ss ON se.enrollment_id = ss.enrollment_id
        LEFT JOIN Subjects sub ON ss.subject_id = sub.subject_id
        WHERE s.id = ?
        GROUP BY s.id
    `;

    db.query(studentQuery, [studentId], (err, studentResults) => {
        if (err) {
            console.error('Error fetching student:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }

        if (studentResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const student = studentResults[0];

        // ✅ Profile picture handling
        student.profile_picture = student.profile_picture
            ? 'Uploads/' + student.profile_picture.split('/').pop()
            : 'Uploads/default.jpg';

        // ✅ Convert comma-separated classes to array
        student.classes = student.classes ? student.classes.split(',') : [];

        // ✅ Convert comma-separated subject names to array
        student.subjects = student.subjects ? student.subjects.split(', ') : [];

        res.status(200).json({ success: true, data: student });
    });
});

// ==========================
// POST ADD STUDENT
// ==========================
app.post('/api/students', upload.single('profile_picture'), (req, res) => {
    const {
        student_id, full_name, guardian_phone, email, address, gender,
        date_of_birth, level = 1, term = 1
    } = req.body;

    // Updated: Handle both classes/classes[] and subjects/subjects[]
    const classes = req.body['classes[]'] || req.body.classes
        ? (Array.isArray(req.body['classes[]'] || req.body.classes)
            ? (req.body['classes[]'] || req.body.classes)
            : [(req.body['classes[]'] || req.body.classes)])
        : [];
    const subjects = req.body['subjects[]'] || req.body.subjects
        ? (Array.isArray(req.body['subjects[]'] || req.body.subjects)
            ? (req.body['subjects[]'] || req.body.subjects).map(s => s.includes(':') ? s.split(':')[1] : s)
            : [(req.body['subjects[]'] || req.body.subjects).includes(':') ? (req.body['subjects[]'] || req.body.subjects).split(':')[1] : (req.body['subjects[]'] || req.body.subjects)])
        : [];

    console.log('Received request body:', req.body); // Debug
    console.log('Processed classes:', classes); // Debug
    console.log('Processed subjects:', subjects); // Debug

    // Validate inputs
    if (!student_id || !full_name || !guardian_phone || !address || !gender || !date_of_birth) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    if (classes.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one class is required.' });
    }

    // Validate classes
    const classQueries = classes.map(cls => {
        const [section_id, class_ref] = cls.split(':').map(Number);
        const table = section_id === 1 ? 'Classes' : 'Western_Classes';
        const idField = section_id === 1 ? 'class_id' : 'western_class_id';
        return `SELECT ${idField} FROM ${table} WHERE ${idField} = ${class_ref}`;
    });

    db.query(classQueries.join(' UNION '), (err, validClasses) => {
        if (err) {
            console.error('Error validating classes:', err);
            return res.status(500).json({ success: false, message: 'Failed to validate classes.', error: err.message });
        }
        const validClassIds = validClasses.map(c => c.class_id || c.western_class_id);
        const invalidClasses = classes.filter(cls => {
            const [, class_ref] = cls.split(':').map(Number);
            return !validClassIds.includes(class_ref);
        });
        if (invalidClasses.length > 0) {
            return res.status(400).json({ success: false, message: 'Invalid class IDs provided.' });
        }

        // Validate subjects
        if (subjects.length > 0) {
            db.query(`SELECT subject_id FROM Subjects WHERE subject_id IN (?)`, [subjects.map(Number)], (err2, validSubjects) => {
                if (err2) {
                    console.error('Error validating subjects:', err2);
                    return res.status(500).json({ success: false, message: 'Failed to validate subjects.', error: err2.message });
                }
                const validSubjectIds = validSubjects.map(s => s.subject_id);
                const invalidSubjects = subjects.filter(sub => !validSubjectIds.includes(Number(sub)));
                if (invalidSubjects.length > 0) {
                    return res.status(400).json({ success: false, message: 'Invalid subject IDs provided.' });
                }
                proceedWithInsert();
            });
        } else {
            proceedWithInsert();
        }
    });

    function proceedWithInsert() {
        // Validate date_of_birth
        let parsedDob;
        if (date_of_birth.includes('/')) {
            parsedDob = moment(date_of_birth, 'DD/MM/YYYY', true);
            if (!parsedDob.isValid()) return res.status(400).json({ success: false, message: 'Invalid Date of Birth format. Use DD/MM/YYYY.' });
        } else {
            parsedDob = moment(date_of_birth, 'YYYY-MM-DD', true);
            if (!parsedDob.isValid()) return res.status(400).json({ success: false, message: 'Invalid Date of Birth format. Use YYYY-MM-DD.' });
        }
        const formattedDob = parsedDob.format('YYYY-MM-DD');

        const profilePic = req.file ? req.file.filename : null;

        // Insert student
        const insertStudentSql = `
            INSERT INTO Students (student_id, full_name, guardian_phone, email, address, gender, date_of_birth, profile_picture)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertStudentSql, [student_id, full_name, guardian_phone, email || null, address, gender, formattedDob, profilePic], (err, result) => {
            if (err) {
                console.error('Error inserting student:', err);
                return res.status(500).json({ success: false, message: 'Failed to save student.', error: err.message });
            }

            const studentDbId = result.insertId;

            // Insert enrollments
            const enrollSql = `
                INSERT INTO Student_Enrollments (student_id, section_id, class_ref, level, term)
                VALUES ?
            `;
            const enrollValues = classes.map(cls => {
                const [section_id, class_ref] = cls.split(':').map(Number);
                return [studentDbId, section_id, class_ref, level, term];
            });

            db.query(enrollSql, [enrollValues], (err2, enrResult) => {
                if (err2) {
                    console.error('Error inserting enrollments:', err2);
                    return res.status(500).json({ success: false, message: 'Failed to save enrollments.', error: err2.message });
                }

                if (subjects.length > 0) {
                    // Fetch enrollment IDs
                    db.query(`SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ?`, [studentDbId], (err3, enrollments) => {
                        if (err3) {
                            console.error('Error fetching enrollments:', err3);
                            return res.status(500).json({ success: false, message: 'Failed to fetch enrollments.', error: err3.message });
                        }

                        const subjSql = `INSERT INTO Student_Subjects (enrollment_id, subject_id, term) VALUES ?`;
                        const subjValues = enrollments.reduce((acc, enrollment) => {
                            subjects.forEach(sub => {
                                acc.push([enrollment.enrollment_id, Number(sub), term]);
                            });
                            return acc;
                        }, []);

                        if (subjValues.length > 0) {
                            db.query(subjSql, [subjValues], (err4) => {
                                if (err4) {
                                    console.error('Error inserting subjects:', err4);
                                    return res.status(500).json({ success: false, message: 'Failed to save subjects.', error: err4.message });
                                }
                                res.json({ success: true, data: { id: studentDbId } });
                            });
                        } else {
                            res.json({ success: true, data: { id: studentDbId } });
                        }
                    });
                } else {
                    res.json({ success: true, data: { id: studentDbId } });
                }
            });
        });
    }
});

// ==========================
// PUT UPDATE STUDENT (SAFE UPDATE)
// ==========================
// ==========================
// PUT UPDATE STUDENT (Partial Update)
// ==========================
app.put('/api/students/:id', upload.single('profile_picture'), (req, res) => {
    const studentDbId = req.params.id;
    
    // Helper function to safely get and standardize array input from form data
    const getFormDataArray = (key) => {
        // Checks for 'key' (e.g., 'classes') or 'key[]' (e.g., 'classes[]')
        let values = req.body[key] || req.body[`${key}[]`];
        
        if (!values) return [];
        
        // Ensure values is an array (converts string to array if only one item selected)
        if (!Array.isArray(values)) {
            values = [values];
        }
        return values;
    };

    // 1. Safely parse classes and subjects (FIX: Ensures they are arrays)
    const classes = getFormDataArray('classes');
    
    // Subjects array should contain simple IDs, as determined by client-side logic
    const subjects = getFormDataArray('subjects');
    const simpleSubjectIds = subjects.map(s => {
        const strS = String(s);
        // We use the simple ID here since the client-side form submit handler sends the simple ID.
        return strS.includes(':') ? strS.split(':')[1] : strS;
    });

    const {
        student_id, full_name, guardian_phone, email, address, gender,
        date_of_birth, level = 1, term = 1
    } = req.body;
    
    // Helper to check if a field exists in the body (needed for partial update of core fields)
    const hasField = (key) => Object.prototype.hasOwnProperty.call(req.body, key);

    // Build UPDATE dynamically only with provided fields
    const updateFields = [];
    const params = [];

    // Use the `hasField` check to ensure we process fields even if they are empty strings or zero
    if (hasField('student_id')) { updateFields.push("student_id = ?"); params.push(student_id); }
    if (hasField('full_name')) { updateFields.push("full_name = ?"); params.push(full_name); }
    if (hasField('guardian_phone')) { updateFields.push("guardian_phone = ?"); params.push(guardian_phone); }
    if (hasField('email')) { updateFields.push("email = ?"); params.push(email); } 
    if (hasField('address')) { updateFields.push("address = ?"); params.push(address); }
    if (hasField('gender')) { updateFields.push("gender = ?"); params.push(gender); }
    if (hasField('date_of_birth')) { updateFields.push("date_of_birth = ?"); params.push(date_of_birth); }

    if (req.file) { // only if profile picture uploaded
        updateFields.push("profile_picture = ?");
        params.push(req.file.filename);
    }

    params.push(studentDbId);

    // If we have fields to update, run UPDATE first
    const updateSql = updateFields.length > 0
        ? `UPDATE Students SET ${updateFields.join(", ")} WHERE id = ?`
        : null;

    function proceed() {
        // Now using the reliably parsed 'classes' and 'simpleSubjectIds' arrays
        updateClasses(() => updateSubjects(() => {
            return res.json({ success: true, message: "Student updated successfully" });
        }));
    }

    if (updateSql) {
        db.query(updateSql, params, (err) => {
            if (err) {
                console.error("Error updating student:", err);
                return res.status(500).json({ success: false, message: "Failed to update student." });
            }
            proceed();
        });
    } else {
        proceed(); // nothing to update in Students table, go to relations
    }

    // ====================
    // Update Classes only if provided (uses the parsed 'classes' array)
    // FIX: Added deletion of Student_Subjects before Student_Enrollments
    // ====================
    function updateClasses(next) {
        // The client-side logic ensures classes are sent if anything related to relations changes
        if (classes.length > 0) {
            
            // 1. IMPORTANT FIX: Delete dependent Student_Subjects first to satisfy Foreign Key constraints
            db.query("DELETE FROM Student_Subjects WHERE enrollment_id IN (SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ?)", [studentDbId], (errSub) => {
                if (errSub) {
                    console.error("Error clearing associated subjects before enrollments:", errSub);
                    return res.status(500).json({ success: false, message: "Failed to clear associated subjects before updating classes." });
                }

                // 2. Now safely delete the Student_Enrollments (Classes)
                db.query("DELETE FROM Student_Enrollments WHERE student_id = ?", [studentDbId], (errEnroll) => {
                    if (errEnroll) {
                        console.error("Error clearing old classes/enrollments:", errEnroll);
                        return res.status(500).json({ success: false, message: "Failed to clear old classes." }); 
                    }

                    // 3. Insert new enrollments
                    const enrollValues = classes.map(cls => {
                        const [section_id, class_ref] = String(cls).split(":").map(Number);
                        return [studentDbId, section_id, class_ref, level, term];
                    });

                    db.query("INSERT INTO Student_Enrollments (student_id, section_id, class_ref, level, term) VALUES ?", [enrollValues], (err2) => {
                        if (err2) {
                            console.error("Error inserting new classes:", err2);
                            return res.status(500).json({ success: false, message: "Failed to insert classes." });
                        }
                        next();
                    });
                });
            });
        } else {
            next(); // skip classes if not provided
        }
    }

    // ====================
    // Update Subjects only if provided (uses the parsed 'simpleSubjectIds' array)
    // NOTE: The delete logic here is mostly redundant if updateClasses ran, but kept for safety.
    // ====================
    function updateSubjects(next) {
        // The client-side logic ensures subjects are sent if anything related to relations changes
        if (simpleSubjectIds.length > 0) {
            // Delete old subjects based on enrollments related to this student
            db.query("DELETE FROM Student_Subjects WHERE enrollment_id IN (SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ?)", [studentDbId], (err) => {
                if (err) return res.status(500).json({ success: false, message: "Failed to clear old subjects." });

                // Fetch current enrollment IDs (these are the newly inserted ones from updateClasses)
                db.query("SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ?", [studentDbId], (err2, enrollments) => {
                    if (err2) return res.status(500).json({ success: false, message: "Failed to fetch enrollments." });

                    const subjValues = [];
                    enrollments.forEach(enr => {
                        simpleSubjectIds.forEach(subId => subjValues.push([enr.enrollment_id, Number(subId), term]));
                    });

                    if (subjValues.length > 0) {
                        db.query("INSERT INTO Student_Subjects (enrollment_id, subject_id, term) VALUES ?", [subjValues], (err3) => {
                            if (err3) return res.status(500).json({ success: false, message: "Failed to insert subjects." });
                            next();
                        });
                    } else {
                        next();
                    }
                });
            });
        } else {
            next(); // skip subjects if not provided
        }
    }
});

// ==========================
// Delete student
// ==========================
app.delete('/api/students/:id', (req, res) => {
    if (!req.session.isAuthenticated)
        return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const studentId = req.params.id;

    db.beginTransaction(err => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'Transaction start error.', error: err.message });
        }

        // Delete subjects
        const deleteSubjectsQuery = `
            DELETE FROM Student_Subjects 
            WHERE enrollment_id IN (
                SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ?
            )
        `;
        db.query(deleteSubjectsQuery, [studentId], err => {
            if (err) {
                console.error('Error deleting subjects:', err);
                return db.rollback(() => res.status(500).json({ success: false, message: 'Database error deleting subjects.', error: err.message }));
            }

            // Delete enrollments
            const deleteEnrollmentsQuery = `DELETE FROM Student_Enrollments WHERE student_id = ?`;
            db.query(deleteEnrollmentsQuery, [studentId], err => {
                if (err) {
                    console.error('Error deleting enrollments:', err);
                    return db.rollback(() => res.status(500).json({ success: false, message: 'Database error deleting enrollments.', error: err.message }));
                }

                // Delete student
                const deleteStudentQuery = `DELETE FROM Students WHERE id = ?`;
                db.query(deleteStudentQuery, [studentId], (err, result) => {
                    if (err) {
                        console.error('Error deleting student:', err);
                        return db.rollback(() => res.status(500).json({ success: false, message: 'Database error deleting student.', error: err.message }));
                    }
                    if (result.affectedRows === 0) {
                        return db.rollback(() => res.status(404).json({ success: false, message: 'Student not found.' }));
                    }

                    db.commit(err => {
                        if (err) {
                            console.error('Commit error:', err);
                            return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error.', error: err.message }));
                        }
                        res.status(200).json({ success: true, message: 'Student deleted successfully.' });
                    });
                });
            });
        });
    });
});

// ==========================
// Upload student profile picture
// ==========================
app.post('/api/students/upload-profile-picture', upload.single('profile_picture'), (req, res) => {
    if (!req.session.isAuthenticated)
        return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const studentId = req.body.studentId;
    const profilePicture = req.file ? `Uploads/${req.file.filename}` : null;

    if (!studentId || !profilePicture) {
        console.log('Missing studentId or profile picture:', { studentId, profilePicture });
        return res.status(400).json({ success: false, message: 'Student ID and profile picture are required.' });
    }

    const updateQuery = `
        UPDATE Students
        SET profile_picture = ?
        WHERE id = ?
    `;
    db.query(updateQuery, [profilePicture, studentId], (err, result) => {
        if (err) {
            console.error('Error updating profile picture:', err);
            return res.status(500).json({ success: false, message: 'Database error updating profile picture.', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }
        res.status(200).json({ success: true, message: 'Profile picture uploaded successfully.', profile_picture: profilePicture });
    });
});



// Demographics route
app.get('/api/demographics', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = `
        SELECT
            CASE WHEN e.section_id = 1 THEN c.class_name ELSE w.class_name END AS class_name,
            SUM(CASE WHEN s.gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
            SUM(CASE WHEN s.gender = 'Female' THEN 1 ELSE 0 END) AS female_count,
            COUNT(*) AS total_class_count
        FROM Students s
        JOIN Student_Enrollments e ON s.student_id = e.student_id
        LEFT JOIN Classes c ON e.class_ref = c.class_id AND e.section_id = 1
        LEFT JOIN Western_Classes w ON e.class_ref = w.western_class_id AND e.section_id = 2
        GROUP BY class_name
        WITH ROLLUP
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching demographics:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        const formattedData = results.map(row => {
            if (row.class_name === null) {
                return { class_name: 'Total', male_count: row.male_count || 0, female_count: row.female_count || 0, total_class_count: row.total_class_count || 0 };
            }
            return row;
        });

        res.status(200).json({ success: true, data: formattedData });
    });
});

// Generate ID card
app.post('/api/generate-id-card', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { entityType, entityId } = req.body;
    if (!entityType || !entityId) {
        return res.status(400).json({ success: false, message: 'Entity type and ID are required.' });
    }

    if (!['student', 'admin'].includes(entityType)) {
        return res.status(400).json({ success: false, message: 'Invalid entity type.' });
    }

    let query;
    if (entityType === 'student') {
        query = `
            SELECT s.student_id AS id, s.name, s.gender, s.date_of_birth, s.phone, s.address,
                   CASE WHEN e.section_id = 1 THEN c.class_name ELSE w.class_name END AS class_name
            FROM Students s
            JOIN Student_Enrollments e ON s.student_id = e.student_id
            LEFT JOIN Classes c ON e.class_ref = c.class_id AND e.section_id = 1
            LEFT JOIN Western_Classes w ON e.class_ref = w.western_class_id AND e.section_id = 2
            WHERE s.student_id = ?
        `;
    } else {
        query = 'SELECT id, username, name, phone, role FROM admins WHERE id = ?';
    }

    db.query(query, [entityId], (err, results) => {
        if (err) {
            console.error(`Error fetching ${entityType} for ID card:`, err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found.` });
        }
        res.status(200).json({ success: true, message: 'ID card data fetched successfully.', data: results[0] });
    });
});


// Student Login (from previous response)
app.post('/api/student-login', async (req, res) => {
    const { studentId, password } = req.body;
    const trimmedStudentId = studentId ? studentId.trim() : null;

    if (!trimmedStudentId || !password) {
        return res.status(400).json({ success: false, message: 'Student ID and password are required.' });
    }

    const query = 'SELECT id, student_id, full_name FROM Students WHERE student_id = ?';

    db.query(query, [trimmedStudentId], async (err, results) => {
        if (err) {
            console.error('[DB_ERROR] Login query failed:', err);
            return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const student = results[0];
        let isAuthenticated = false;

        if (password.trim().toUpperCase() === student.student_id.trim().toUpperCase()) {
            isAuthenticated = true;
        }

        if (isAuthenticated) {
            req.session.isAuthenticated = true;
            req.session.studentId = student.student_id;
            req.session.userType = 'student';

            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                redirect: '/student-dashboard'
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
    });
});

// Student Details (from previous response)
// Fetch student details (enriched with classes and subjects)
app.get('/api/student-details', (req, res) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'student') {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const studentId = req.session.studentId; // e.g., 'HIR/25/TAH/1322222'

    const studentQuery = `
        SELECT 
            s.id,
            s.student_id,
            s.full_name AS name,
            s.gender,
            DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
            s.guardian_phone,
            s.address,
            s.email,
            s.profile_picture,
            GROUP_CONCAT(
                DISTINCT CASE 
                    WHEN se.section_id = 1 THEN c.class_name
                    WHEN se.section_id = 2 THEN w.class_name
                    ELSE NULL
                END ORDER BY se.section_id, COALESCE(c.class_name, w.class_name) SEPARATOR ', '
            ) AS classes,
            GROUP_CONCAT(
                DISTINCT su.subject_name ORDER BY su.subject_name SEPARATOR ', '
            ) AS subjects
        FROM Students s
        LEFT JOIN Student_Enrollments se ON s.id = se.student_id
        LEFT JOIN Classes c ON se.class_ref = c.class_id AND se.section_id = 1
        LEFT JOIN Western_Classes w ON se.class_ref = w.western_class_id AND se.section_id = 2
        LEFT JOIN Student_Subjects ss ON se.enrollment_id = ss.enrollment_id
        LEFT JOIN Subjects su ON ss.subject_id = su.subject_id
        WHERE s.student_id = ?
        GROUP BY s.id, s.student_id, s.full_name, s.gender, s.date_of_birth, s.guardian_phone, s.address, s.email, s.profile_picture
    `;

    db.query(studentQuery, [studentId], (err, studentResults) => {
        if (err) {
            console.error('Error fetching student details:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }

        if (studentResults.length === 0) {
            console.error(`No student found for student_id: ${studentId}`);
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const student = studentResults[0];
        console.log('Raw student query result:', student); // Debug

        // Debug: Check enrollments and subjects
        db.query('SELECT * FROM Student_Enrollments WHERE student_id = ?', [student.id], (err, enrollments) => {
            console.log('Student_Enrollments for student_id:', student.id, enrollments);
        });
        db.query(`
            SELECT ss.*, su.subject_name 
            FROM Student_Subjects ss 
            JOIN Student_Enrollments se ON ss.enrollment_id = se.enrollment_id 
            JOIN Subjects su ON ss.subject_id = su.subject_id 
            WHERE se.student_id = ?
        `, [student.id], (err, subjects) => {
            console.log('Student_Subjects for student_id:', student.id, subjects);
        });

        student.profile_picture = student.profile_picture
            ? 'Uploads/' + student.profile_picture.split('/').pop()
            : 'Uploads/default.jpg';
        student.classes = student.classes ? student.classes.split(', ').filter(cls => cls && cls !== 'null') : [];
        student.subjects = student.subjects ? student.subjects.split(', ').filter(sub => sub && sub !== 'null') : [];

        console.log('Processed student data:', student); // Debug
        res.status(200).json({ success: true, data: student });
    });
});
// Student Logout Route
app.post('/api/student-logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.', redirect: '/student-login' });
    });
});


// ================================================================
//  FEES MANAGEMENT – FULLY UPDATED BACKEND
//  Supports: Student ID → Payment → Auto-create Student_Fees
// ================================================================

// GET sessions
app.get('/api/sessions', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const query = `
        SELECT session_year, is_current
        FROM Sessions
        ORDER BY start_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching sessions:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// GET student by admission number (for modal)
app.get('/api/students/by-admission/:admission', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const admission = req.params.admission.trim();
    const sql = `
        SELECT 
            s.id,
            s.full_name,
            s.student_id AS admission_no,
            se.section_id,
            se.class_ref
        FROM Students s
        LEFT JOIN Student_Enrollments se ON s.id = se.student_id
        WHERE s.student_id = ?
        LIMIT 1
    `;

    db.query(sql, [admission], (err, rows) => {
        if (err || !rows.length) {
            console.error('Student not found:', err);
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: rows[0] });
    });
});

// GET fee structures (overview)
app.get('/api/fees/structures', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { session, term } = req.query;
    if (!session) {
        return res.status(400).json({ success: false, message: 'Session year is required.' });
    }

    const params = [session];
    let termClause = '';
    if (term) {
        termClause = ` AND term = ?`;
        params.push(parseInt(term));
    }

    const query = `
        SELECT 
            structure_id, 
            class_id AS class_ref, 
            1 AS section_id, 
            total_fee, 
            term, 
            description, 
            session_year
        FROM Islamic_Fee_Structures
        WHERE session_year = ? ${termClause}
        UNION
        SELECT 
            structure_id, 
            western_class_id AS class_ref, 
            2 AS section_id, 
            total_fee, 
            term, 
            description, 
            session_year
        FROM Western_Fee_Structures
        WHERE session_year = ? ${termClause}
    `;

    const finalParams = term ? [session, parseInt(term), session, parseInt(term)] : [session, session];

    db.query(query, finalParams, (err, results) => {
        if (err) {
            console.error('Error fetching fee structures:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// POST set fee structure + auto-create Student_Fees
app.post('/api/fees/set', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { section_id, class_ref, total_fee, term, description, session_year } = req.body;

    if (!section_id || !class_ref || !total_fee || !term || !session_year) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error.' });

        const feeTable = section_id === 1 ? 'Islamic_Fee_Structures' : 'Western_Fee_Structures';
        const classColumn = section_id === 1 ? 'class_id' : 'western_class_id';

        const insertFeeQuery = `
            INSERT INTO ${feeTable} (${classColumn}, term, total_fee, description, session_year)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                total_fee = VALUES(total_fee),
                description = VALUES(description)
        `;

        db.query(insertFeeQuery, [class_ref, term, total_fee, description || null, session_year], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error saving fee structure:', err);
                    res.status(500).json({ success: false, message: 'Failed to save fee structure.' });
                });
            }

            const structure_id = result.insertId || null;

            // Get structure_id if not new
            if (!structure_id) {
                const getIdQuery = `SELECT structure_id FROM ${feeTable} WHERE ${classColumn} = ? AND term = ? AND session_year = ?`;
                db.query(getIdQuery, [class_ref, term, session_year], (err, rows) => {
                    if (err || !rows.length) return db.rollback(() => res.status(500).json({ success: false }));
                    upsertStudentFees(rows[0].structure_id);
                });
            } else {
                upsertStudentFees(structure_id);
            }

            function upsertStudentFees(structure_id) {
                const upsertQuery = `
                    INSERT INTO Student_Fees (enrollment_id, structure_id, section_id, total_fee, session_year)
                    SELECT se.enrollment_id, ?, ?, ?, ?
                    FROM Student_Enrollments se
                    WHERE se.section_id = ? AND se.class_ref = ? AND se.term = ?
                    ON DUPLICATE KEY UPDATE
                        total_fee = VALUES(total_fee),
                        structure_id = VALUES(structure_id),
                        updated_date = CURRENT_TIMESTAMP
                `;

                db.query(upsertQuery, [structure_id, section_id, total_fee, session_year, section_id, class_ref, term], err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error updating Student_Fees:', err);
                            res.status(500).json({ success: false, message: 'Failed to update student fees.' });
                        });
                    }

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        res.json({ success: true, message: 'Fee structure and student fees updated.' });
                    });
                });
            }
        });
    });
});

// GET payment tracking (supports session, term, class filters)
app.get('/api/fees/payments', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { session, term, class: classValue, student_id } = req.query;
    if (!session) {
        return res.status(400).json({ success: false, message: 'Session year is required.' });
    }

    let query = `
        SELECT 
            sf.student_fee_id,
            s.id AS student_id,
            s.full_name AS student_name,
            s.student_id AS admission_no,
            s.guardian_phone,
            se.section_id,
            se.class_ref,
            sf.total_fee,
            COALESCE(SUM(p.payment_amount), 0) AS amount_paid,
            sf.total_fee - COALESCE(SUM(p.payment_amount), 0) AS remaining_amount,
            CASE WHEN sf.total_fee - COALESCE(SUM(p.payment_amount), 0) <= 0 THEN 'Completed' ELSE 'Pending' END AS status
        FROM Student_Fees sf
        JOIN Student_Enrollments se ON sf.enrollment_id = se.enrollment_id
        JOIN Students s ON se.student_id = s.id
        LEFT JOIN Student_Fee_Payments p 
            ON p.student_fee_id = sf.student_fee_id
            AND p.session_year = ?
            ${term ? 'AND p.term = ?' : ''}
        WHERE sf.session_year = ?
    `;

    const params = [session];
    if (term) params.push(parseInt(term));
    params.push(session);

    if (classValue) {
        const [section_id, class_ref] = classValue.split(':').map(Number);
        query += ` AND se.section_id = ? AND se.class_ref = ?`;
        params.push(section_id, class_ref);
    }

    if (student_id) {
        query += ` AND s.id = ?`;
        params.push(parseInt(student_id));
    }

    query += ` GROUP BY sf.student_fee_id ORDER BY s.full_name`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching payments:', err);
            return res.status(500).json({ success: false, message: 'Database error.', error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// POST add payment (creates Student_Fees if missing)
app.post('/api/fees/payments', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const {
        student_fee_id, payment_amount, payment_method, notes,
        term, session_year, class_ref, section_id,
        student_name, total_fee, remaining_amount
    } = req.body;

    const missing = [];
if (!payment_amount || payment_amount <= 0) missing.push('payment_amount');
if (!term) missing.push('term');
if (!session_year) missing.push('session_year');
if (!class_ref) missing.push('class_ref');
if (!section_id) missing.push('section_id');

if (missing.length > 0) {
    console.error("❌ Missing Fields:", missing, "Received:", req.body);
    return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missing.join(', ')}`,
        received: req.body
    });

    }

    db.beginTransaction(async err => {
        if (err) return res.status(500).json({ success: false });

        try {
            // 1. Verify session
            const [sess] = await queryPromise(`SELECT session_year FROM Sessions WHERE session_year = ?`, [session_year]);
            if (!sess) throw new Error('Invalid session');

            let feeId = student_fee_id;

            // 2. If no student_fee_id → create Student_Fees
            if (!feeId) {
                const [enrollment] = await queryPromise(`
                    SELECT enrollment_id FROM Student_Enrollments 
                    WHERE student_id = (SELECT id FROM Students WHERE student_id = ?)
                    AND section_id = ? AND class_ref = ? AND term = ?
                `, [req.body.student_admission || '', section_id, class_ref, term]);

                if (!enrollment) throw new Error('Student not enrolled in this term');

                // Get structure_id
                const table = section_id === 1 ? 'Islamic_Fee_Structures' : 'Western_Fee_Structures';
                const col = section_id === 1 ? 'class_id' : 'western_class_id';
                const [structure] = await queryPromise(`
                    SELECT structure_id FROM ${table} 
                    WHERE ${col} = ? AND term = ? AND session_year = ?
                `, [class_ref, term, session_year]);

                if (!structure) throw new Error('Fee structure not set');

                const [insertRes] = await queryPromise(`
                    INSERT INTO Student_Fees (enrollment_id, structure_id, section_id, total_fee, session_year, amount_paid, remaining_amount, status)
                    VALUES (?, ?, ?, ?, ?, 0, ?, 'Pending')
                `, [enrollment.enrollment_id, structure.structure_id, section_id, total_fee || 0, session_year, total_fee || 0]);

                feeId = insertRes.insertId;
            }

            // 3. Insert payment
            await queryPromise(`
                INSERT INTO Student_Fee_Payments 
                (student_fee_id, payment_amount, payment_method, notes, payment_date, term, session_year, class_ref, section_id)
                VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
            `, [feeId, payment_amount, payment_method || null, notes || null, term, session_year, class_ref, section_id]);

            // 4. Update Student_Fees
            const [fee] = await queryPromise(`
                SELECT total_fee, amount_paid FROM Student_Fees WHERE student_fee_id = ?
            `, [feeId]);

            const newPaid = (fee.amount_paid || 0) + payment_amount;
            const newRemaining = fee.total_fee - newPaid;
            const status = newRemaining <= 0 ? 'Completed' : 'Pending';

            await queryPromise(`
                UPDATE Student_Fees 
                SET amount_paid = ?, remaining_amount = ?, status = ?
                WHERE student_fee_id = ?
            `, [newPaid, newRemaining, status, feeId]);

            // 5. Return data for receipt
            const [payment] = await queryPromise(`
                SELECT * FROM Student_Fee_Payments WHERE student_fee_id = ? ORDER BY payment_id DESC LIMIT 1
            `, [feeId]);

            db.commit(err => {
                if (err) throw err;
                res.json({
                    success: true,
                    data: {
                        student_fee_id: feeId,
                        payment_amount,
                        total_fee: fee.total_fee,
                        remaining_amount: newRemaining,
                        student_name: student_name || 'N/A',
                        session_year,
                        term,
                        class_ref,
                        section_id,
                        payment_method: payment_method || 'N/A',
                        notes: notes || 'None'
                    }
                });
            });
        } catch (error) {
            db.rollback(() => {
                console.error('Payment error:', error);
                res.status(500).json({ success: false, message: error.message || 'Payment failed' });
            });
        }
    });
});

// Helper: Promise wrapper for db.query
function queryPromise(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// ================================================================
// 1. SEARCH STUDENTS BY ID OR NAME (for dropdown)
// ================================================================
app.get('/api/students/search', (req, res) => {
    if (!req.session.isAuthenticated) return res.status(401).json({ success: false });

    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    const sql = `
        SELECT 
            s.id,
            s.student_id AS admission_no,
            s.full_name AS name,
            se.section_id,
            se.class_ref,
            COALESCE(c.class_name, w.western_class_name) AS class_name
        FROM Students s
        LEFT JOIN Student_Enrollments se ON s.id = se.student_id
        LEFT JOIN Classes c ON se.section_id = 1 AND c.class_id = se.class_ref
        LEFT JOIN Western_Classes w ON se.section_id = 2 AND w.western_class_id = se.class_ref
        WHERE s.student_id LIKE ? OR s.full_name LIKE ?
        LIMIT 20
    `;

    const like = `%${q}%`;
    db.query(sql, [like, like], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, data: rows });
    });
});

// ================================================================
// 2. GET FEE DETAILS FOR STUDENT + SESSION + TERM
// ================================================================
app.get('/api/fees/student-balance', (req, res) => {
    if (!req.session.isAuthenticated) return res.status(401).json({ success: false });

    const { admission_no, session_year, term } = req.query;
    if (!admission_no || !session_year || !term) {
        return res.status(400).json({ success: false, message: 'Missing params' });
    }

    const sql = `
        SELECT 
            sf.student_fee_id,
            sf.total_fee,
            COALESCE(SUM(p.payment_amount), 0) AS amount_paid,
            (sf.total_fee - COALESCE(SUM(p.payment_amount), 0)) AS remaining_amount,
            s.full_name,
            s.student_id,
            se.section_id,
            se.class_ref,
            COALESCE(c.class_name, w.western_class_name) AS class_name
        FROM Students s
        JOIN Student_Enrollments se ON s.id = se.student_id
        LEFT JOIN Student_Fees sf ON sf.enrollment_id = se.enrollment_id
            AND sf.session_year = ? AND sf.term = ?
        LEFT JOIN Student_Fee_Payments p ON p.student_fee_id = sf.student_fee_id
        LEFT JOIN Classes c ON se.section_id = 1 AND c.class_id = se.class_ref
        LEFT JOIN Western_Classes w ON se.section_id = 2 AND w.western_class_id = se.class_ref
        WHERE s.student_id = ? AND se.term = ?
        GROUP BY sf.student_fee_id
        LIMIT 1
    `;

    db.query(sql, [session_year, term, admission_no, term], (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        if (!rows.length || !rows[0].student_fee_id) {
            return res.json({ success: true, data: null }); // No fee yet
        }
        res.json({ success: true, data: rows[0] });
    });
});
//end of payment codes


app.get("/api/sessions", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }
  const query = "SELECT * FROM Sessions ORDER BY start_date DESC"
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sessions:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }
    res.status(200).json({ success: true, data: results })
  })
})

app.get("/api/staff/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }
  const { staffId } = req.params

  const staffQuery = `
        SELECT s.id, s.staff_id, s.name, s.role, s.email, s.phone
        FROM staff s
        WHERE s.id = ? AND s.status = 'Active'
    `

  db.query(staffQuery, [staffId], (err, staffResults) => {
    if (err) {
      console.error("Error fetching staff info:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }
    if (staffResults.length === 0) {
      return res.status(404).json({ success: false, message: "Staff not found." })
    }

    const staff = staffResults[0]

    // Check if form master
    const formMasterQuery = `
            SELECT section_id, class_id, western_class_id
            FROM staff_form_master
            WHERE staff_id = ?
            ORDER BY term DESC
            LIMIT 1
        `

    db.query(formMasterQuery, [staffId], (err, formMasterResults) => {
      if (err) {
        console.error("Error fetching form master info:", err)
        return res.status(500).json({ success: false, message: "Database error." })
      }

      staff.formMaster = formMasterResults.length > 0 ? formMasterResults[0] : null

      // Get classes
      const classesQuery = `
                SELECT DISTINCT sc.section_id, sc.class_id, sc.western_class_id
                FROM staff_classes sc
                WHERE sc.staff_id = ?
            `

      db.query(classesQuery, [staffId], (err, classesResults) => {
        if (err) {
          console.error("Error fetching classes:", err)
          return res.status(500).json({ success: false, message: "Database error." })
        }

        staff.classes = classesResults
        res.status(200).json({ success: true, data: staff })
      })
    })
  })
})
// =============================
// MEMORIZATION ENDPOINTS
// =============================

// 1. GET: Ayat range for a specific week + day
app.get("/api/staff-memorization-schemes", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff")
    return res.status(401).json({ success: false, message: "Unauthorized." });

  const { class_id, term, week, day, session } = req.query;
  if (!class_id || !term || !week || !day || !session)
    return res.status(400).json({ success: false, message: "Missing parameters." });

  const sql = `
    SELECT id, week, day, from_surah_ayah, to_surah_ayah
    FROM Daily_Memorization_Scheme
    WHERE class_id = ? AND term = ? AND week = ? AND day = ? AND session_year = ?
    LIMIT 1`;

  db.query(sql, [class_id, term, week, day, session], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "DB error." });
    if (!rows.length) return res.status(404).json({ success: false, message: "No scheme." });
    res.json({ success: true, data: rows });
  });
});

// 2. GET: Available weeks (dropdown)
app.get("/api/staff-memorization-weeks", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff")
    return res.status(401).json({ success: false, message: "Unauthorized." });

  const { class_id, term, session } = req.query;
  if (!class_id || !term || !session)
    return res.status(400).json({ success: false, message: "Missing parameters." });

  const sql = `
    SELECT DISTINCT week
    FROM Daily_Memorization_Scheme
    WHERE class_id = ? AND term = ? AND session_year = ?
    ORDER BY week`;

  db.query(sql, [class_id, term, session], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: rows.map(r => ({ week: r.week })) });
  });
});

// 3. GET: Load students + existing grades for a scheme
app.get("/api/staff-memorization/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff")
    return res.status(401).json({ success: false, message: "Unauthorized." });

  const { staffId } = req.params;
  const { section_id, class_id, scheme_id, session, term } = req.query;

  if (!section_id || !class_id || !scheme_id || !session || !term)
    return res.status(400).json({ success: false, message: "Missing required query params." });

  const sql = `
    SELECT
      s.id               AS student_id,
      s.full_name        AS student_name,
      e.enrollment_id,
      a.daily_grade,
      sme.exam_grade     AS grade,
      a.comments
    FROM Student_Enrollments e
    JOIN Students s ON s.id = e.student_id
    LEFT JOIN Student_Memorization_Assessments a
      ON a.enrollment_id = e.enrollment_id
     AND a.scheme_id     = ?
     AND a.session_year  = ?
     AND a.term          = ?
    LEFT JOIN Student_Memorization_Exam sme
      ON sme.enrollment_id = e.enrollment_id
     AND sme.term          = ?
     AND sme.session_year  = ?
    WHERE e.section_id = ? AND e.class_ref = ?
    ORDER BY s.full_name`;

  db.query(sql, [scheme_id, session, term, term, session, section_id, class_id], (err, rows) => {
    if (err) {
      console.error("Student fetch error:", err);
      return res.status(500).json({ success: false, message: "DB error." });
    }
    if (!rows.length) return res.status(404).json({ success: false, message: "No students." });
    res.json({ success: true, data: rows });
  });
});

// 4. POST: Save grades – **unique per (scheme_id, week, day)**
app.post("/api/staff-memorization/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff")
    return res.status(401).json({ success: false, message: "Unauthorized." });

  const { staffId } = req.params;
  const { term, week, day, session, scheme_id, memorization } = req.body;

  if (
    !term || !week || !day ||
    !session || !scheme_id || !Array.isArray(memorization) || !memorization.length
  )
    return res.status(400).json({ success: false, message: "Invalid payload." });

  db.beginTransaction(async (trErr) => {
    if (trErr) return res.status(500).json({ success: false });

    const today = new Date().toISOString().slice(0, 10);

    try {
      // ---------- 1️⃣ Separate daily / exam ----------
      const dailyGrades = [];
      const examGradesMap = new Map();               // deduplicate per student+term+session (ignore scheme_id)

      memorization.forEach(r => {
        // ----- daily -----
        if (r.daily_grade) {
          dailyGrades.push([
            r.enrollment_id,
            scheme_id,
            r.daily_grade,
            null,                     // exam_grade
            r.comments || "",
            today,
            session,
            term,
            week,
            r.from_surah_ayah,
            r.to_surah_ayah,
            day
          ]);
        }

        // ----- exam (once per term+session) -----
        if (r.grade != null) {
          const key = `${r.enrollment_id}_${term}_${session}`;
          examGradesMap.set(key, [
            r.enrollment_id,
            term,
            session,
            r.grade
          ]);
        }
      });

      const examGrades = Array.from(examGradesMap.values());

      // ---------- 2️⃣ Daily grades (unchanged) ----------
      if (dailyGrades.length) {
        const insertDailySql = `
          INSERT INTO Student_Memorization_Assessments
            (enrollment_id, scheme_id, daily_grade, exam_grade, comments,
             date, session_year, term, week,
             from_surah_ayah, to_surah_ayah, assessed_day)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            daily_grade = VALUES(daily_grade),
            comments    = VALUES(comments),
            from_surah_ayah = VALUES(from_surah_ayah),
            to_surah_ayah   = VALUES(to_surah_ayah),
            date            = VALUES(date)
        `;
        await new Promise((resolve, reject) =>
          db.query(insertDailySql, [dailyGrades], err => err ? reject(err) : resolve())
        );
      }

      // ---------- 3️⃣ Exam grades (updated: no scheme_id) ----------
      if (examGrades.length) {
        const examValues = examGrades.map(
          ([enrollment_id, term, session_year, exam_grade]) => [
            enrollment_id, term, session_year, exam_grade
          ]
        );

        const insertExamSql = `
          INSERT INTO Student_Memorization_Exam
            (enrollment_id, term, session_year, exam_grade)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            exam_grade = VALUES(exam_grade)
        `;

        await new Promise((resolve, reject) =>
          db.query(insertExamSql, [examValues], err => err ? reject(err) : resolve())
        );
      }

      // ---------- 4️⃣ Commit ----------
      db.commit(commitErr => {
        if (commitErr) return db.rollback(() => res.status(500).json({ success: false }));
        res.json({ success: true, message: "Saved successfully." });
      });
    } catch (err) {
      console.error("Error saving memorization:", err);
      db.rollback(() => res.status(500).json({ success: false }));
    }
  });
});


// 7. GET: All assessments for a class (overall result)
app.get("/api/class-memorization-assessments", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff")
    return res.status(401).json({ success: false, message: "Unauthorized." });

  const { section_id, class_id, session_year, term } = req.query;
  if (!section_id || !class_id || !session_year || !term)
    return res.status(400).json({ success: false, message: "Missing parameters." });

  const sql = `
    SELECT
      s.student_id, s.full_name,
      sma.daily_grade, sme.exam_grade,
      sma.comments, sma.date, sma.session_year, sma.term, sma.week,
      sma.from_surah_ayah, sma.to_surah_ayah, sma.assessed_day
    FROM Student_Memorization_Assessments sma
    JOIN Student_Enrollments e ON sma.enrollment_id = e.enrollment_id
    JOIN Students s ON e.student_id = s.id
    LEFT JOIN Student_Memorization_Exam sme
      ON sme.enrollment_id = e.enrollment_id
     AND sme.term = sma.term
     AND sme.session_year = sma.session_year
    WHERE e.section_id = ? AND e.class_ref = ? AND sma.session_year = ? AND sma.term = ?`;

  db.query(sql, [section_id, class_id, session_year, term], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "DB error." });
    res.json({ success: true, data: rows });
  });
});
//get Attendance
app.get("/api/staff-students/:staffId", (req, res) => {
  const { staffId } = req.params;
  const { section_id, class_id, term } = req.query;

  // Validate input
  if (!section_id || !class_id || !term) {
    return res.status(400).json({ success: false, message: "Missing required query parameters: section_id, class_id, term." });
  }

  const query = `
    SELECT 
      s.student_id,
      s.full_name,
      se.enrollment_id
    FROM Students s
    JOIN Student_Enrollments se ON s.id = se.student_id
    JOIN staff_form_master sfm ON se.section_id = sfm.section_id
    JOIN staff st ON sfm.staff_id = st.id
    WHERE st.id = ?
      AND se.section_id = ?
      AND (sfm.class_id = ? OR sfm.western_class_id = ?)
      AND sfm.term = ?
      AND se.term = ?
  `;

  db.query(query, [staffId, section_id, class_id, class_id, term, term], (err, results) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "No students found for this class/section/term." });
    }

    res.status(200).json({ success: true, data: results });
  });
});

//load student for attendance
app.get("/api/staff-students/:staffId", (req, res) => {
  const { staffId } = req.params;
  const { section_id, class_id, term } = req.query;

  // Validate input
  if (!section_id || !class_id || !term) {
    return res.status(400).json({ success: false, message: "Missing required query parameters: section_id, class_id, term." });
  }

  const query = `
    SELECT 
      s.student_id,
      s.full_name,
      se.enrollment_id
    FROM Students s
    JOIN Student_Enrollments se ON s.id = se.student_id
    JOIN staff_form_master sfm ON se.section_id = sfm.section_id
    JOIN staff st ON sfm.staff_id = st.id
    WHERE st.id = ?
      AND se.section_id = ?
      AND (sfm.class_id = ? OR sfm.western_class_id = ?)
      AND sfm.term = ?
      AND se.term = ?
  `;

  db.query(query, [staffId, section_id, class_id, class_id, term, term], (err, results) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "No students found for this class/section/term." });
    }

    res.status(200).json({ success: true, data: results });
  });
});

//student attendance
// ✅ FIXED VERSION — student attendance
app.post("/api/staff-attendance/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  const { staffId } = req.params;
  const { section_id, class_id, session, term, day, week_number, attendance } = req.body;

  // Validate input
  if (
    !section_id ||
    !class_id ||
    !session ||
    !term ||
    !week_number ||
    !day ||
    !attendance ||
    !Array.isArray(attendance) ||
    attendance.length === 0
  ) {
    console.error("Missing fields:", { section_id, class_id, session, term, day, week_number, attendance });
    return res.status(400).json({ success: false, message: "Missing or invalid required fields." });
  }

  if (![1, 2, 3].includes(parseInt(term))) {
    return res.status(400).json({ success: false, message: "Invalid term. Must be 1, 2, or 3." });
  }

  if (parseInt(week_number) < 1 || parseInt(week_number) > 14) {
    return res.status(400).json({ success: false, message: "Invalid week number. Must be between 1 and 14." });
  }

  if (!/^\d{4}\/\d{4}$/.test(session)) {
    return res.status(400).json({ success: false, message: `Invalid session format: "${session}". Must be YYYY/YYYY.` });
  }

  // Use current timestamp but store selected day
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction start error:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    // Delete existing attendance for this week/class/term/session
    const deleteQuery = `
      DELETE sa
      FROM Student_Attendance sa
      JOIN staff_form_master sfm 
        ON sfm.section_id = sa.section_id
      JOIN staff st 
        ON st.id = sfm.staff_id
      WHERE st.id = ?
        AND sfm.section_id = ?
        AND ((sfm.section_id = 1 AND sfm.class_id = ?) OR (sfm.section_id = 2 AND sfm.western_class_id = ?))
        AND sa.term = ?
        AND sa.week_number = ?
        AND sa.session_year = ?
        AND sa.day_name = ?;
    `;

    db.query(
      deleteQuery,
      [staffId, section_id, class_id, class_id, term, week_number, session, day],
      (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error deleting old attendance:", err);
            res.status(500).json({ success: false, message: "Database error deleting old attendance." });
          });
        }

        // Insert new attendance records
        const insertQuery = `
          INSERT INTO Student_Attendance 
          (student_id, section_id, attendance_status, week_number, term, session_year, day_name, timestamp, is_active)
          VALUES ?
        `;

        const attendanceValues = attendance.map((record) => [
          record.student_id,
          section_id,
          record.attendance_status,
          week_number,
          term,
          session,
          day,
          timestamp,
          true,
        ]);

        db.query(insertQuery, [attendanceValues], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error saving attendance:", err);
              res.status(500).json({ success: false, message: "Database error saving attendance." });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("Commit error:", err);
                res.status(500).json({ success: false, message: "Database commit error." });
              });
            }
            res.status(200).json({ success: true, message: "Attendance saved successfully." });
          });
        });
      }
    );
  });
});

// === FIXED WEEKLY ATTENDANCE VIEW ===
app.get("/api/staff-attendance-weekly/:staffId", (req, res) => {
  const { staffId } = req.params;
  const { section_id, term, session, week } = req.query;

  // Validation
  if (!staffId || !section_id || !term || !session || !week) {
    return res.status(400).json({
      success: false,
      message: "Missing required query parameters (staffId, section_id, term, session, week).",
    });
  }

  const query = `
    SELECT 
      sa.student_id,
      s.full_name,
      sa.attendance_status,
      sa.day_name,
      sa.timestamp
    FROM Student_Attendance sa
    JOIN Students s ON sa.student_id = s.student_id
    WHERE sa.section_id = ?
      AND sa.term = ?
      AND sa.week_number = ?
      AND sa.session_year = ?
      AND sa.is_active = 1
    ORDER BY s.full_name, sa.timestamp;
  `;

  db.query(query, [section_id, term, week, session], (err, results) => {
    if (err) {
      console.error("Error fetching weekly attendance:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the selected week.",
      });
    }

    // Group attendance by student
    const grouped = {};
    results.forEach((r) => {
      if (!grouped[r.student_id]) {
        grouped[r.student_id] = {
          student_id: r.student_id,
          student_name: r.full_name,
          days: {},
        };
      }

      // Use day_name directly from DB (not DAYNAME())
      if (r.day_name) {
        grouped[r.student_id].days[r.day_name] = r.attendance_status;
      }
    });

    const finalData = Object.values(grouped);

    res.json({
      success: true,
      data: finalData,
    });
  });
});

// ──────────────────────────────────────────────────────────────
// MIDDLEWARE: verifyStaffSession – RETURN JSON ONLY
// ──────────────────────────────────────────────────────────────
async function verifyStaffSession(req, res, next) {
  try {
    const sessionRes = await fetch("/api/staff-session", { credentials: "include" }); // or use cookie
    const sessionData = await sessionRes.json();

    if (!sessionData.success || !sessionData.data?.staff_id) {
      logError(`Unauthorized access: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
      return res.status(401).json({ success: false, message: "Unauthorized – login required" });
    }

    req.staff = sessionData.data;
    next();
  } catch (err) {
    logError(`Session check failed: ${req.originalUrl}`, err);
    return res.status(401).json({ success: false, message: "Session error" });
  }
}

// BEST & FINAL VERSION — USE ONLY THIS ONE
app.get("/api/staff-classes/:staffId", verifyStaffSession, async (req, res) => {
  const staffId = req.params.staffId;

  try {
    const [rows] = await pool.query(`
      SELECT 
        sc.section_id,
        COALESCE(c.class_name, wc.class_name) AS class_name,
        sc.class_id,
        sc.western_class_id
      FROM staff_classes sc
      LEFT JOIN Classes c ON sc.section_id = 1 AND sc.class_id = c.class_id
      LEFT JOIN Western_Classes wc ON sc.section_id = 2 AND sc.western_class_id = wc.western_class_id
      WHERE sc.staff_id = ?
      GROUP BY sc.section_id, sc.class_id, sc.western_class_id, class_name
      ORDER BY sc.section_id, class_name
    `, [staffId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error in /api/staff-classes (final):", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ──────────────────────────────────────────────────────────────
// 2. DASHBOARD STATS (FIX 404 + JSON)
// ──────────────────────────────────────────────────────────────
// FIXED DASHBOARD STATS – NO HTML, NO 500
app.get("/api/staff-dashboard-stats/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { staffId } = req.params;

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM staff_classes WHERE staff_id = ?) AS totalClasses,
      (SELECT COUNT(DISTINCT se.student_id) 
       FROM student_enrollments se
       JOIN staff_classes sc ON se.class_ref = sc.class_id AND se.section_id = sc.section_id
       WHERE sc.staff_id = ?) AS totalStudents,
      (SELECT COUNT(*) FROM staff_subjects WHERE staff_id = ?) AS totalSubjects
  `;

  db.query(query, [staffId, staffId, staffId], (err, results) => {
    if (err) {
      console.error("Dashboard stats error:", err);
      return res.status(500).json({ success: false, message: "Stats error" });
    }

    const row = results[0] || {};
    res.json({
      success: true,
      data: {
        totalClasses: parseInt(row.totalClasses) || 0,
        totalStudents: parseInt(row.totalStudents) || 0,
        totalSubjects: parseInt(row.totalSubjects) || 0
      }
    });
  });
});
// ================================================================
// 1. TAHFIZ REPORT – FINAL VERSION (WORKS WITH YOUR REAL TABLE)
// ================================================================
app.get("/api/tahfiz-report", (req, res) => {
  const { student_id, session, term } = req.query;

  if (!student_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // Step 1: Get student name (student_id is already the full string)
  const studentInfoSql = `
    SELECT full_name, student_id 
    FROM Students 
    WHERE student_id = ?
  `;

  // CORRECT ATTENDANCE — Uses student_id as string directly!
  const attendanceSql = `
    SELECT 
      COUNT(*) AS total_days,
      SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present_days
    FROM Student_Attendance
    WHERE student_id = ?
      AND session_year = ?
      AND term = ?
  `;

  // Daily records & grades
  const detailSql = `
    SELECT week, assessed_day AS day, from_surah_ayah, to_surah_ayah, daily_grade, comments AS comment
    FROM Student_Memorization_Assessments sma
    JOIN Student_Enrollments se ON sma.enrollment_id = se.enrollment_id
    JOIN Students s ON se.student_id = s.id
    WHERE s.student_id = ? AND sma.session_year = ? AND sma.term = ?
    ORDER BY week, assessed_day
  `;

  const dailyGradesSql = `
    SELECT daily_grade FROM Student_Memorization_Assessments sma
    JOIN Student_Enrollments se ON sma.enrollment_id = se.enrollment_id
    WHERE se.student_id = (SELECT id FROM Students WHERE student_id = ?)
      AND sma.session_year = ? AND sma.term = ?
  `;

  const examSql = `
    SELECT exam_grade FROM Student_Memorization_Exam sme
    JOIN Student_Enrollments se ON sme.enrollment_id = se.enrollment_id
    WHERE se.student_id = (SELECT id FROM Students WHERE student_id = ?)
      AND sme.session_year = ? AND sme.term = ?
  `;

  Promise.all([
    new Promise((resolve, reject) => db.query(studentInfoSql, [student_id], (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.query(detailSql, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.query(dailyGradesSql, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.query(examSql, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.query(attendanceSql, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows)))
  ])
  .then(([infoRows, detailRows, dailyRows, examRows, attRows]) => {
    if (!infoRows.length || !detailRows.length) {
      return res.json({ success: false, message: "No data found" });
    }

    const full_name = infoRows[0].full_name;
    const sid = infoRows[0].student_id;

    // ATTENDANCE — NOW 100% CORRECT
    const att = attRows[0] || { total_days: 0, present_days: 0 };
    const totalDays = att.total_days || 1;
    const presentDays = att.present_days || 0;
    const attendancePercent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) + "%" : "0%";

    // Grade calculation
    const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
    const dailyPoints = dailyRows.map(r => gradePoints[r.daily_grade] || 0);
    const avgDailyPoint = dailyPoints.length ? dailyPoints.reduce((a,b) => a+b, 0) / dailyPoints.length : 0;
    const dailyScore = (avgDailyPoint / 5) * 80;
    const examGrade = examRows[0]?.exam_grade || "F";
    const examScore = (gradePoints[examGrade] || 0) / 5 * 20;
    const totalScore = dailyScore + examScore;

    let finalGrade = "F";
    if (totalScore >= 70) finalGrade = "A";
    else if (totalScore >= 60) finalGrade = "B";
    else if (totalScore >= 50) finalGrade = "C";
    else if (totalScore >= 40) finalGrade = "D";

    res.json({
      success: true,
      data: {
        full_name,
        student_id: sid,
        daily_records: detailRows,
        exam_score: examScore.toFixed(1),
        daily_score: dailyScore.toFixed(1),
        total_score: totalScore.toFixed(1),
        final_grade: finalGrade,
        attendance: {
          present: presentDays,
          total: totalDays,
          percentage: attendancePercent
        },
        teacher_remark: "Excellent memorization consistency. Masha Allah!"
      }
    });
  })
  .catch(err => {
    console.error("Tahfiz Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  });
});

// ================================================================
// 2. COMPLETE STUDENT REPORT – FINAL CLEAN VERSION (NO TAHFIZ, NO POSITION)
// ================================================================
app.get("/api/student-report", (req, res) => {
  const { student_id, session, term } = req.query;

  if (!student_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const sqlSubjects = `
    SELECT 
      s.full_name,
      s.student_id,
      sub.subject_name, 
      ssa.ca1_score AS ca1, 
      ssa.ca2_score AS ca2, 
      ssa.exam_score AS exam,
      (COALESCE(ssa.ca1_score,0) + COALESCE(ssa.ca2_score,0) + COALESCE(ssa.exam_score,0)) AS total
    FROM Student_Enrollments se
    JOIN Student_Subject_Assessments ssa ON ssa.enrollment_id = se.enrollment_id
    JOIN Subjects sub ON sub.subject_id = ssa.subject_id
    JOIN Students s ON s.id = se.student_id
    WHERE s.student_id = ? 
      AND ssa.session_year = ? 
      AND ssa.term = ?
  `;

  const sqlAttendance = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present
    FROM Student_Attendance 
    WHERE student_id = ? AND session_year = ? AND term = ?
  `;

  Promise.all([
    new Promise((resolve, reject) => db.query(sqlSubjects, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.query(sqlAttendance, [student_id, session, term], (err, rows) => err ? reject(err) : resolve(rows)))
  ])
  .then(([subjects, attRows]) => {
    if (!subjects.length) {
      return res.json({ success: false, message: "No academic records found" });
    }

    const full_name = subjects[0].full_name;
    const sid = subjects[0].student_id;

    // Add grades only (no position!)
    subjects.forEach(s => {
      const total = Number(s.total);
      s.grade = total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 40 ? "D" : "F";
      // REMOVED: s.position = "-";
      delete s.position; // Clean remove
    });

    const att = attRows[0] || { total: 0, present: 0 };
    const attendancePercent = att.total > 0 
      ? ((att.present / att.total) * 100).toFixed(1) + "%" 
      : "0%";

    res.json({
      success: true,
      data: {
        full_name,
        student_id: sid,
        subjects,
        // REMOVED: tahfiz_grade, tahfiz_total
        attendance_present: att.present,
        attendance_total: att.total,
        attendance_percent: attendancePercent,
        // REMOVED: position_in_class

      }
    });
  })
  .catch(err => {
    console.error("Student Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  });
});
// =============================================
// MEMORIZATION VIDEOS – ULTIMATE FINAL BACKEND (DELETE + FILTERS FIXED)
// =============================================

// GET: All videos for staff's classes
app.get("/api/memorization-videos/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const staffId = req.params.staffId;

  const sql = `
    SELECT 
      v.id,
      v.video_url,
      v.session,
      v.term,
      v.week,
      v.day,  
      v.from_ayah,
      v.to_ayah,
      v.class_id,
      v.section_id,
      COALESCE(c.class_name, wc.class_name) AS class_name,
      v.uploaded_at
    FROM Memorization_Videos v
    JOIN staff_classes sc ON v.section_id = sc.section_id 
      AND ((sc.section_id = 1 AND v.class_id = sc.class_id) 
        OR (sc.section_id = 2 AND v.class_id = sc.western_class_id))
    LEFT JOIN Classes c ON v.section_id = 1 AND v.class_id = c.class_id
    LEFT JOIN Western_Classes wc ON v.section_id = 2 AND v.class_id = wc.western_class_id
    WHERE sc.staff_id = ?
    ORDER BY v.uploaded_at DESC
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) {
      console.error("Error fetching videos:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, data: rows });
  });
});

// NEW ENDPOINT: Get staff's sessions & classes for filters AND upload form
app.get("/api/staff-classes-sessions/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const staffId = req.params.staffId;

  const sql = `
    SELECT DISTINCT
      sc.section_id,
      COALESCE(c.class_id, wc.western_class_id) AS class_id,
      COALESCE(c.class_name, wc.class_name) AS class_name,
      sc.session
    FROM staff_classes sc
    LEFT JOIN Classes c ON sc.section_id = 1 AND sc.class_id = c.class_id
    LEFT JOIN Western_Classes wc ON sc.section_id = 2 AND sc.western_class_id = wc.western_class_id
    WHERE sc.staff_id = ?
    ORDER BY sc.session DESC, class_name
  `;

  db.query(sql, [staffId], (err, rows) => {
    if (err) {
      console.error("Error fetching staff classes/sessions:", err);
      return res.status(500).json({ success: false });
    }

    const sessions = [...new Set(rows.map(r => r.session))].sort((a, b) => b.localeCompare(a));
    const classes = rows.map(r => ({
      value: `${r.section_id}:${r.class_id}`,
      name: `${r.class_name} - ${r.session}`
    }));

    res.json({ success: true, sessions, classes });
  });
});

// POST: Upload memorization video – replace if same class/session/term/week/day
app.post("/api/upload-memorization-video", uploadVideo.single("video"), (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No video file uploaded" });
  }

  const {
    class_id,
    section_id,
    session,
    term,
    week,
    day,
    from_ayah,
    to_ayah
  } = req.body;

  if (!class_id || !section_id || !session || !term || !week || !day || !from_ayah || !to_ayah) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const video_url = `/uploads/${req.file.filename}`;

  const checkSql = `
    SELECT id, video_url FROM Memorization_Videos
    WHERE class_id=? AND section_id=? AND session=? AND term=? AND week=? AND day=?
  `;

  db.query(checkSql, [class_id, section_id, session, term, week, day], (err, rows) => {
    if (err) {
      console.error("Check error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (rows.length > 0) {
      const oldVideo = rows[0];
      const oldFilePath = path.join(process.cwd(), 'public', 'uploads', path.basename(oldVideo.video_url));

      fs.unlink(oldFilePath, (err) => {
        if (err && err.code !== 'ENOENT') console.warn("Failed to delete old video:", err);
      });

      db.query("DELETE FROM Memorization_Videos WHERE id=?", [oldVideo.id], (err) => {
        if (err) console.error("Failed to delete old record:", err);
      });
    }

    const insertSql = `
      INSERT INTO Memorization_Videos 
      (class_id, section_id, session, term, week, day, from_ayah, to_ayah, video_url, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(insertSql, [class_id, section_id, session, term, week, day, from_ayah, to_ayah, video_url], (err) => {
      if (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Video uploaded successfully" });
    });
  });
});

// DELETE: Fixed with staffId in URL
app.delete("/api/delete-memorization-video/:id/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false });
  }

  const videoId = req.params.id;
  const staffId = req.params.staffId;

  const getSql = `
    SELECT v.video_url FROM Memorization_Videos v
    JOIN staff_classes sc ON v.section_id = sc.section_id
      AND ((sc.section_id = 1 AND v.class_id = sc.class_id)
        OR (sc.section_id = 2 AND v.class_id = sc.western_class_id))
    WHERE v.id = ? AND sc.staff_id = ?
  `;

  db.query(getSql, [videoId, staffId], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found or unauthorized" });
    }

    const video_url = rows[0].video_url;

    db.query("DELETE FROM Memorization_Videos WHERE id=?", [videoId], (err) => {
      if (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ success: false });
      }

      const filePath = path.join(process.cwd(), 'public', 'uploads', path.basename(video_url));
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn("Failed to delete video file:", err);
        }
      });

      res.json({ success: true, message: "Video deleted successfully" });
    });
  });
});
// ADMIN: Get ALL classes (Islamic + Western)
app.get("/api/admin-classes", (req, res) => {
  const query = `
    SELECT 'Islamic' AS type, class_id AS value, class_name AS name FROM Classes WHERE section_id = 1
    UNION ALL
    SELECT 'Western' AS type, western_class_id AS value, class_name AS name FROM Western_Classes WHERE section_id = 2
    ORDER BY name
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

// ADMIN: Get all sessions (from Sessions table)
app.get("/api/admin-sessions", (req, res) => {
  const query = `SELECT session_year FROM Sessions ORDER BY session_year DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

// ==============================
// ADMIN: Weekly Attendance – FINAL VERSION (7 Days + Full Words + Smart 5-Day %)
// ==============================
app.get("/api/admin-attendance-weekly", (req, res) => {
  const { class_id, session, term, week } = req.query;

  if (!class_id || !session || !term || !week) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // Step 1: Find section_id and class_ref
  const findClassQuery = `
    SELECT section_id, class_id AS class_ref FROM Classes WHERE class_id = ?
    UNION ALL
    SELECT section_id, western_class_id AS class_ref FROM Western_Classes WHERE western_class_id = ?
  `;

  db.query(findClassQuery, [class_id, class_id], (err, classResult) => {
    if (err || classResult.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { section_id } = classResult[0];

    // Step 2: Fetch raw attendance (same as staff)
    const attendanceQuery = `
      SELECT 
        sa.student_id,
        s.full_name AS student_name,
        sa.attendance_status,
        sa.day_name
      FROM Student_Attendance sa
      JOIN Students s ON sa.student_id = s.student_id
      WHERE sa.section_id = ?
        AND sa.session_year = ?
        AND sa.term = ?
        AND sa.week_number = ?
        AND sa.is_active = 1
      ORDER BY s.full_name, sa.day_name
    `;

    db.query(attendanceQuery, [section_id, session, term, week], (err, results) => {
      if (err) {
        console.error("Error:", err);
        return res.status(500).json({ success: false });
      }

      if (results.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Group by student
      const grouped = {};
      results.forEach(r => {
        if (!grouped[r.student_id]) {
          grouped[r.student_id] = {
            student_id: r.student_id,
            student_name: r.student_name,
            days: {}
          };
        }
        // FULL WORDS: Present or Absent
        grouped[r.student_id].days[r.day_name] = r.attendance_status;
      });

      const allDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      const finalData = Object.values(grouped).map(student => {
        let presentCount = 0;
        let markedDays = 0;  // Only count days that were actually marked (not -)

        allDays.forEach(day => {
          const status = student.days[day];
          if (status === "Present" || status === "Absent") {
            markedDays++;
            if (status === "Present") presentCount++;
          }
          // Fill missing days with "-"
          if (!student.days[day]) student.days[day] = "-";
        });

        const percentage = markedDays > 0 
          ? ((presentCount / markedDays) * 100).toFixed(1) + "%" 
          : "0%";

        const total = `${presentCount}/${markedDays || 0}`;

        return {
          student_id: student.student_id,
          student_name: student.student_name,
          Saturday: student.days.Saturday,
          Sunday: student.days.Sunday,
          Monday: student.days.Monday,
          Tuesday: student.days.Tuesday,
          Wednesday: student.days.Wednesday,
          Thursday: student.days.Thursday,
          Friday: student.days.Friday,
          total,
          percentage
        };
      });

      res.json({ success: true, data: finalData });
    });
  });
});
// ==============================
// ADMIN: CUMULATIVE Attendance up to selected week
// ==============================
app.get("/api/admin-cumulative-attendance", (req, res) => {
  const { class_id, session, term, up_to_week } = req.query;

  if (!class_id || !session || !term || !up_to_week) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const findClassQuery = `
    SELECT section_id, class_id AS class_ref FROM Classes WHERE class_id = ?
    UNION ALL
    SELECT section_id, western_class_id AS class_ref FROM Western_Classes WHERE western_class_id = ?
  `;

  db.query(findClassQuery, [class_id, class_id], (err, classResult) => {
    if (err || classResult.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const { section_id } = classResult[0];

    const query = `
      SELECT 
        sa.student_id,
        s.full_name AS student_name,
        sa.attendance_status,
        sa.week_number,
        sa.day_name
      FROM Student_Attendance sa
      JOIN Students s ON sa.student_id = s.student_id
      WHERE sa.section_id = ?
        AND sa.session_year = ?
        AND sa.term = ?
        AND sa.week_number <= ?
        AND sa.is_active = 1
      ORDER BY s.full_name, sa.week_number, sa.day_name
    `;

    db.query(query, [section_id, session, term, up_to_week], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }

      if (results.length === 0) {
        return res.json({ success: true, data: [] });
      }

      const grouped = {};
      results.forEach(r => {
        if (!grouped[r.student_id]) {
          grouped[r.student_id] = {
            student_id: r.student_id,
            student_name: r.student_name,
            present: 0,
            total_days: 0
          };
        }
        // Only count actual marked days (not -)
        if (r.attendance_status === "Present" || r.attendance_status === "Absent") {
          grouped[r.student_id].total_days++;
          if (r.attendance_status === "Present") {
            grouped[r.student_id].present++;
          }
        }
      });

      const finalData = Object.values(grouped).map(s => {
        const percentage = s.total_days > 0 
          ? ((s.present / s.total_days) * 100).toFixed(1) + "%" 
          : "0%";

        return {
          student_id: s.student_id,
          student_name: s.student_name,
          total_present: s.present,
          total_days: s.total_days,
          percentage
        };
      });

      res.json({ success: true, data: finalData });
    });
  });
});

// ==============================
// STAFF: CUMULATIVE Attendance up to selected week
// No staff-class assignment check
// ==============================
app.get("/api/staff-cumulative-attendance/:staffId", (req, res) => {
  const { staffId } = req.params;
  const { class_id, session, term, up_to_week } = req.query;

  if (!class_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  const effectiveUpToWeek = up_to_week ? parseInt(up_to_week) : 999;

  const findClassQuery = `
    SELECT section_id FROM Classes WHERE class_id = ?
    UNION ALL
    SELECT section_id FROM Western_Classes WHERE western_class_id = ?
    LIMIT 1
  `;

  db.query(findClassQuery, [class_id, class_id], (err, classResult) => {
    if (err || classResult.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const section_id = classResult[0].section_id;

    const query = `
      SELECT 
        sa.student_id,
        s.full_name AS student_name,
        sa.attendance_status,
        sa.week_number
      FROM Student_Attendance sa
      JOIN Students s ON sa.student_id = s.student_id
      WHERE sa.section_id = ?
        AND sa.session_year = ?
        AND sa.term = ?
        AND sa.week_number <= ?
        AND sa.is_active = 1
      ORDER BY s.full_name, sa.week_number
    `;

    db.query(query, [section_id, session, term, effectiveUpToWeek], (err, results) => {
      if (err) {
        console.error("Cumulative Error:", err);
        return res.status(500).json({ success: false });
      }

      if (!results.length) return res.json({ success: true, data: [] });

      const grouped = {};
      results.forEach(r => {
        if (!grouped[r.student_id]) {
          grouped[r.student_id] = { student_id: r.student_id, student_name: r.student_name, present: 0, total_days: 0 };
        }
        if (r.attendance_status === "Present" || r.attendance_status === "Absent") {
          grouped[r.student_id].total_days++;
          if (r.attendance_status === "Present") grouped[r.student_id].present++;
        }
      });

      const finalData = Object.values(grouped).map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        total_present: s.present,
        total_days: s.total_days,
        percentage: s.total_days > 0 ? ((s.present / s.total_days) * 100).toFixed(1) + "%" : "0%"
      }));

      res.json({ success: true, data: finalData });
    });
  });
});
// GET ALL CLASSES – Admin only
app.get("/api/classes", (req, res) => {
  // Security check
  if (!req.session?.isAuthenticated || req.session.userType !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const sql = `SELECT id, name, level 
               FROM Classes 
               ORDER BY level, name`; // always order them nicely

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching classes:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: rows });
  });
});

// ============================================================
// ADMIN: Get all sessions – Admin only
// ============================================================
app.get("/api/sessions", (req, res) => {
  if (!req.session?.isAuthenticated || req.session.userType !== "admin") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const sql = `
    SELECT session_year, is_current 
    FROM Sessions 
    ORDER BY session_year DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching sessions:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: rows });
  });
});

// ============================================================
// ADMIN: Get all students for report (Simplified, works like staff)
// ============================================================
app.get("/api/students/for-report", (req, res) => {
  const { class: classId, session, term } = req.query;

  if (!classId || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // Fetch all students enrolled in the class (any type)
  const sql = `
    SELECT s.full_name, s.student_id, s.id AS internal_id
    FROM Students s
    JOIN Student_Enrollments se ON se.student_id = s.id
    WHERE se.class_ref = ? OR se.class_ref = ?
    ORDER BY s.full_name
  `;

  db.query(sql, [classId, classId], (err, rows) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ success: false });
    }

    res.json({ success: true, data: { students: rows } });
  });
});

// ============================================================
// ADMIN: Tahfiz Overall (Simplified, works like staff)
// ============================================================
// =============================================
// ADMIN: Tahfiz OVERALL (Class + Session + Term) – Fixed
// =============================================
app.get("/api/tahfiz/overall", (req, res) => {
  const { class: classId, session, term } = req.query;

  if (!classId || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // Detect section_id
  const classSql = `
    SELECT section_id FROM Classes WHERE class_id = ?
    UNION ALL
    SELECT section_id FROM Western_Classes WHERE western_class_id = ?
  `;

  db.query(classSql, [classId, classId], (err, classRows) => {
    if (err || classRows.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const section_id = classRows[0].section_id;

    // Get students in this class
    const studentsSql = `
      SELECT s.full_name, s.student_id, s.id AS internal_id
      FROM Students s
      JOIN Student_Enrollments se ON s.id = se.student_id
      WHERE se.class_ref = ? AND se.section_id = ?
      ORDER BY s.full_name
    `;

    db.query(studentsSql, [classId, section_id], (err, students) => {
      if (err) return res.status(500).json({ success: false });

      if (students.length === 0) {
        return res.json({ success: true, data: { students: [] } });
      }

      const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

      const tasks = students.map(std => {
        return new Promise(resolve => {
          const dailySql = `
            SELECT daily_grade FROM Student_Memorization_Assessments sma
            JOIN Student_Enrollments se ON sma.enrollment_id = se.enrollment_id
            WHERE se.student_id = ? AND sma.session_year = ? AND sma.term = ?
          `;

          const examSql = `
            SELECT exam_grade FROM Student_Memorization_Exam sme
            JOIN Student_Enrollments se ON sme.enrollment_id = se.enrollment_id
            WHERE se.student_id = ? AND sme.session_year = ? AND sme.term = ?
          `;

          Promise.all([
            new Promise((res2, rej2) =>
              db.query(dailySql, [std.internal_id, session, term], (e, r) => e ? rej2(e) : res2(r))
            ),
            new Promise((res2, rej2) =>
              db.query(examSql, [std.internal_id, session, term], (e, r) => e ? rej2(e) : res2(r))
            )
          ])
          .then(([dailyRows, examRows]) => {
            const dailyPointsList = dailyRows.map(r => gradePoints[r.daily_grade] || 0);
            const avgDailyPoint = dailyPointsList.length
              ? dailyPointsList.reduce((a, b) => a + b, 0) / dailyPointsList.length
              : 0;
            const dailyScore = (avgDailyPoint / 5) * 80;

            const examGrade = examRows[0]?.exam_grade || "F";
            const examScore = ((gradePoints[examGrade] || 0) / 5) * 20;

            const total = dailyScore + examScore;

            let finalGrade = "F";
            if (total >= 70) finalGrade = "A";
            else if (total >= 60) finalGrade = "B";
            else if (total >= 50) finalGrade = "C";
            else if (total >= 40) finalGrade = "D";

            // Return all numbers safely as proper numbers
            resolve({
              fullname: std.full_name,
              student_id: std.student_id,
              avg_daily: Number(avgDailyPoint.toFixed(1)) || 0,
              daily_mark: Number(dailyScore.toFixed(1)) || 0,
              daily_total: 80,
              exam_mark: Number(examScore.toFixed(1)) || 0,
              exam_total: 20,
              total: Number(total.toFixed(1)) || 0,
              grade: finalGrade
            });
          })
          .catch(() => resolve({
            fullname: std.full_name,
            student_id: std.student_id,
            avg_daily: 0,
            daily_mark: 0,
            daily_total: 80,
            exam_mark: 0,
            exam_total: 20,
            total: 0,
            grade: "F"
          }));
        });
      });

      Promise.all(tasks).then(list => {
        res.json({ success: true, data: { students: list.filter(x => x) } });
      });
    });
  });
});

// ============================================================
// ADMIN: Complete Report HTML, PDF & ZIP (reuse existing functions)
// ============================================================
app.get("/api/report/complete/html", (req, res) => {
  const { student, session, term } = req.query;
  if (!student || !session || !term) return res.status(400).send("Missing required parameters");

  generateCompleteReportHTML(student, session, term)
    .then(html => {
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    })
    .catch(err => {
      console.error("Error generating HTML:", err);
      res.status(500).send("Error generating complete report preview");
    });
});

app.get("/api/report/complete/pdf", (req, res) => {
  const { student, session, term } = req.query;
  generateCompleteReportPDF(student, session, term)
    .then(filePath => res.download(filePath))
    .catch(err => {
      console.error(err);
      res.status(500).json({ success: false });
    });
});

app.get("/api/report/complete/zip", (req, res) => {
  const { class: classId, session, term } = req.query;
  generateZipForCompleteReports(classId, session, term)
    .then(filePath => res.download(filePath))
    .catch(err => {
      console.error(err);
      res.status(500).json({ success: false });
    });
});
// 1. PUBLIC CLASSES ENDPOINT (No Auth Required)
app.get("/api/public/classes", (req, res) => {
  const sql = `
    SELECT DISTINCT 
      c.class_id,
      c.class_name AS name,
      c.level,
      c.section_id,
      COUNT(DISTINCT se.student_id) AS student_count
    FROM Classes c
    LEFT JOIN Student_Enrollments se ON se.class_ref = c.class_id
    GROUP BY c.class_id, c.class_name, c.level, c.section_id
    ORDER BY c.level, c.class_name
  `

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("[v0] Error fetching classes:", err)
      return res.status(500).json({ success: false, message: "Server error" })
    }
    res.json({ success: true, data: rows || [] })
  })
})

// 2. PUBLIC SESSIONS ENDPOINT (No Auth Required)
app.get("/api/public/sessions", (req, res) => {
  const sql = `
    SELECT session_year, is_current
    FROM Sessions
    ORDER BY start_date DESC
  `

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("[v0] Error fetching sessions:", err)
      return res.status(500).json({ success: false, message: "Server error" })
    }

    res.json({ success: true, data: rows })
  })
})

// 3. PUBLIC STUDENTS ENDPOINT (No Auth Required)
// Returns students by class_id, section_id, session, and term
app.get("/api/public/students", (req, res) => {
  const { class_id, section_id, session, term } = req.query

  if (!class_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" })
  }

  const sql = `
    SELECT DISTINCT
      s.id,
      s.student_id,
      s.full_name,
      se.enrollment_id,
      se.level
    FROM Student_Enrollments se
    JOIN Students s ON s.id = se.student_id
    WHERE se.class_ref = ?
      AND se.session_year = ?
      AND se.term = ?
    ORDER BY s.full_name
  `

  db.query(sql, [class_id, session, term], (err, rows) => {
    if (err) {
      console.error("[v0] Error fetching students:", err)
      return res.status(500).json({ success: false, message: "Server error" })
    }
    res.json({ success: true, data: rows || [] })
  })
})

// 4. PUBLIC TAHFIZ REPORT ENDPOINT (No Auth Required)
app.get("/api/public/tahfiz-report", (req, res) => {
  const { student_id, session, term } = req.query

  if (!student_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" })
  }

  // Step 1: Get numeric id from string student_id
  const getIdSql = `SELECT id FROM Students WHERE student_id = ?`

  db.query(getIdSql, [student_id], (err, idRows) => {
    if (err || !idRows.length) {
      console.error("[v0] Student not found:", student_id)
      return res.json({ success: false, message: "Student not found" })
    }

    const numericId = idRows[0].id

    // Step 2: Get student info
    const studentInfoSql = `
      SELECT full_name, student_id FROM Students WHERE id = ?
    `

    // Step 3: Get attendance
    const attendanceSql = `
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present_days
      FROM Student_Attendance
      WHERE student_id = ? AND session_year = ? AND term = ?
    `

    // Step 4: Get daily records & grades
    const detailSql = `
      SELECT week, assessed_day AS day, from_surah_ayah, to_surah_ayah, daily_grade, comments AS comment
      FROM Student_Memorization_Assessments
      WHERE enrollment_id IN (
        SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ? AND session_year = ? AND term = ?
      )
      ORDER BY week, assessed_day
    `

    // Step 5: Get daily grades for average
    const dailyGradesSql = `
      SELECT daily_grade 
      FROM Student_Memorization_Assessments
      WHERE enrollment_id IN (
        SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ? AND session_year = ? AND term = ?
      )
    `

    // Step 6: Get exam grade
    const examSql = `
      SELECT exam_grade 
      FROM Student_Memorization_Exam
      WHERE enrollment_id IN (
        SELECT enrollment_id FROM Student_Enrollments WHERE student_id = ? AND session_year = ? AND term = ?
      )
      LIMIT 1
    `

    Promise.all([
      new Promise((resolve, reject) =>
        db.query(studentInfoSql, [numericId], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
      new Promise((resolve, reject) =>
        db.query(attendanceSql, [student_id, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
      new Promise((resolve, reject) =>
        db.query(detailSql, [numericId, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
      new Promise((resolve, reject) =>
        db.query(dailyGradesSql, [numericId, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
      new Promise((resolve, reject) =>
        db.query(examSql, [numericId, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
    ])
      .then(([infoRows, attRows, detailRows, dailyRows, examRows]) => {
        if (!infoRows.length) {
          return res.json({ success: false, message: "No student data found" })
        }

        const full_name = infoRows[0].full_name
        const sid = infoRows[0].student_id

        // Calculate attendance percentage
        const att = attRows[0] || { total_days: 0, present_days: 0 }
        const totalDays = att.total_days || 1
        const presentDays = att.present_days || 0
        const attendancePercent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) + "%" : "0%"

        // Calculate grades
        const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }
        const dailyPoints = dailyRows.map((r) => gradePoints[r.daily_grade] || 0)
        const avgDailyPoint = dailyPoints.length ? dailyPoints.reduce((a, b) => a + b, 0) / dailyPoints.length : 0
        const dailyScore = (avgDailyPoint / 5) * 80
        const examGrade = examRows[0]?.exam_grade || "F"
        const examScore = ((gradePoints[examGrade] || 0) / 5) * 20
        const totalScore = dailyScore + examScore

        let finalGrade = "F"
        if (totalScore >= 70) finalGrade = "A"
        else if (totalScore >= 60) finalGrade = "B"
        else if (totalScore >= 50) finalGrade = "C"
        else if (totalScore >= 40) finalGrade = "D"

        res.json({
          success: true,
          data: {
            full_name,
            student_id: sid,
            daily_records: detailRows,
            exam_score: examScore.toFixed(1),
            daily_score: dailyScore.toFixed(1),
            total_score: totalScore.toFixed(1),
            final_grade: finalGrade,
            attendance: {
              present: presentDays,
              total: totalDays,
              percentage: attendancePercent,
            },
            teacher_remark: "Excellent memorization consistency. Masha Allah!",
          },
        })
      })
      .catch((err) => {
        console.error("[v0] Tahfiz Report Error:", err)
        res.status(500).json({ success: false, message: "Server error" })
      })
  })
})

// 5. PUBLIC COMPLETE REPORT ENDPOINT (No Auth Required)
app.get("/api/public/complete-report", (req, res) => {
  const { student_id, session, term } = req.query

  if (!student_id || !session || !term) {
    return res.status(400).json({ success: false, message: "Missing parameters" })
  }

  const getIdSql = `SELECT id FROM Students WHERE student_id = ?`

  db.query(getIdSql, [student_id], (err, idRows) => {
    if (err || !idRows.length) {
      console.error("[v0] Student not found:", student_id)
      return res.json({ success: false, message: "Student not found" })
    }

    const numericId = idRows[0].id

    const sqlSubjects = `
      SELECT 
        s.full_name,
        s.student_id,
        sub.subject_name, 
        ssa.ca1_score AS ca1, 
        ssa.ca2_score AS ca2, 
        ssa.exam_score AS exam,
        (COALESCE(ssa.ca1_score,0) + COALESCE(ssa.ca2_score,0) + COALESCE(ssa.exam_score,0)) AS total
      FROM Student_Enrollments se
      JOIN Student_Subject_Assessments ssa ON ssa.enrollment_id = se.enrollment_id
      JOIN Subjects sub ON sub.subject_id = ssa.subject_id
      JOIN Students s ON s.id = se.student_id
      WHERE s.id = ? 
        AND ssa.session_year = ? 
        AND ssa.term = ?
    `

    const sqlAttendance = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present
      FROM Student_Attendance 
      WHERE student_id = ? AND session_year = ? AND term = ?
    `

    Promise.all([
      new Promise((resolve, reject) =>
        db.query(sqlSubjects, [numericId, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
      new Promise((resolve, reject) =>
        db.query(sqlAttendance, [student_id, session, term], (err, rows) => (err ? reject(err) : resolve(rows))),
      ),
    ])
      .then(([subjects, attRows]) => {
        if (!subjects.length) {
          return res.json({ success: false, message: "No academic records found" })
        }

        const full_name = subjects[0].full_name
        const sid = subjects[0].student_id

        // Add grades
        subjects.forEach((s) => {
          const total = Number(s.total)
          s.grade = total >= 70 ? "A" : total >= 60 ? "B" : total >= 50 ? "C" : total >= 40 ? "D" : "F"
        })

        const att = attRows[0] || { total: 0, present: 0 }
        const attendancePercent = att.total > 0 ? ((att.present / att.total) * 100).toFixed(1) + "%" : "0%"

        res.json({
          success: true,
          data: {
            full_name,
            student_id: sid,
            subjects,
            attendance_present: att.present,
            attendance_total: att.total,
            attendance_percent: attendancePercent,
          },
        })
      })
      .catch((err) => {
        console.error("[v0] Complete Report Error:", err)
        res.status(500).json({ success: false, message: "Server error" })
      })
  })
})


// ================================================
// FULLY UPDATED BACKEND - 100% WORKING (DEC 2025)
// Supports multiple classes | No more N/A or Unknown Class
// ================================================

// 1. STUDENT SESSION VERIFICATION
app.get("/api/student-verify-session", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false, message: "Session expired" });
  }
  res.json({
    success: true,
    studentId: req.session.studentId,
    message: "Session valid",
  });
});

// 2. STUDENT LOGOUT
app.get("/api/student-logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// 3. GET STUDENT PROFILE + ALL CLASSES (CRITICAL FIX)
app.get("/api/student-profile", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const studentId = req.session.studentId;

  const query = `
    SELECT 
      s.id AS internal_id,
      s.student_id,
      s.full_name,
      s.gender,
      s.date_of_birth,
      s.profile_picture,
      se.enrollment_id,
      se.section_id,
      se.class_ref AS class_id,
      COALESCE(c.class_name, wc.class_name) AS class_name
    FROM Students s
    LEFT JOIN Student_Enrollments se ON s.id = se.student_id
    LEFT JOIN Classes c ON se.class_ref = c.class_id AND se.section_id = 1
    LEFT JOIN Western_Classes wc ON se.class_ref = wc.western_class_id AND se.section_id = 2
    WHERE s.student_id = ?
    ORDER BY se.section_id
  `;

  db.query(query, [studentId], (err, results) => {
    if (err || !results.length) {
      console.error("Profile error:", err);
      return res.status(500).json({ success: false, message: "Student not found" });
    }

    const student = results[0];
    const classes = results
      .filter(r => r.enrollment_id)
      .map(r => ({
        enrollment_id: r.enrollment_id,
        section_id: r.section_id,
        class_id: r.class_id,
        class_name: r.class_name || "Unknown Class",
        class_ref: `${r.section_id}:${r.class_id}`
      }));

    if (student.profile_picture) {
      student.profile_picture = `/uploads/${student.profile_picture.split("/").pop()}`;
    }

    res.json({
      success: true,
      data: {
        student_id: student.student_id,
        full_name: student.full_name,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        profile_picture: student.profile_picture,
        classes: classes
      }
    });
  });
});

// 4. GET STUDENT VIDEOS - FILTERED BY CLASS_REF
app.get("/api/student-videos", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { class_ref } = req.query;
  if (!class_ref) {
    return res.json({ success: true, data: [] });
  }

  const [section_id, class_id] = class_ref.split(":");

  const query = `
    SELECT 
      v.id,
      v.video_url,
      v.week,
      v.day,
      v.from_ayah,
      v.to_ayah,
      v.uploaded_at
    FROM Memorization_Videos v
    WHERE v.section_id = ? AND v.class_id = ?
    ORDER BY v.uploaded_at DESC
  `;

  db.query(query, [section_id, class_id], (err, results) => {
    if (err) {
      console.error("Videos error:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, data: results || [] });
  });
});

// 5. CUMULATIVE ATTENDANCE - FILTERED BY CLASS_REF
app.get("/api/student-cumulative-attendance", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false });
  }

  const { session, term, class_ref } = req.query;
  if (!session || !term || !class_ref) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const [section_id, class_id] = class_ref.split(":");

  const query = `
    SELECT 
      COUNT(*) AS total_days,
      SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present_days
    FROM Student_Attendance sa
    JOIN Students s ON sa.student_id = s.id
    JOIN Student_Enrollments se ON s.id = se.student_id
    WHERE s.student_id = ?
      AND se.section_id = ? AND se.class_ref = ?
      AND sa.session_year = ? AND sa.term = ?
      AND sa.is_active = 1
  `;

  db.query(query, [req.session.studentId, section_id, class_id, session, term], (err, results) => {
    if (err) {
      console.error("Cumulative attendance error:", err);
      return res.status(500).json({ success: false });
    }

    const row = results[0] || { total_days: 0, present_days: 0 };
    const percentage = row.total_days > 0 ? ((row.present_days / row.total_days) * 100).toFixed(1) + "%" : "0%";

    res.json({
      success: true,
      data: {
        total_days: row.total_days,
        present_days: row.present_days,
        attendance_percentage: percentage
      }
    });
  });
});

// 6. TAHFIZ REPORT - FULLY CLASS FILTERED + CLASS NAME
app.get("/api/student-tahfiz-report", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false });
  }

  const { session, term, class_ref } = req.query;
  if (!session || !term || !class_ref) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const [section_id, class_id] = class_ref.split(":");

  const getEnrollment = `
    SELECT se.enrollment_id, COALESCE(c.class_name, wc.class_name) AS class_name
    FROM Student_Enrollments se
    LEFT JOIN Classes c ON se.class_ref = c.class_id AND se.section_id = 1
    LEFT JOIN Western_Classes wc ON se.class_ref = wc.western_class_id AND se.section_id = 2
    WHERE se.student_id = (SELECT id FROM Students WHERE student_id = ?) 
      AND se.section_id = ? AND se.class_ref = ?
  `;

  db.query(getEnrollment, [req.session.studentId, section_id, class_id], (err, rows) => {
    if (err || !rows.length) {
      return res.json({ success: false, message: "Enrollment not found" });
    }

    const { enrollment_id, class_name } = rows[0];

    const queries = {
      info: `SELECT full_name FROM Students WHERE student_id = ?`,
      details: `SELECT week, assessed_day AS day, from_surah_ayah, to_surah_ayah, daily_grade, comments 
                FROM Student_Memorization_Assessments 
                WHERE enrollment_id = ? AND session_year = ? AND term = ? 
                ORDER BY week, assessed_day`,
      dailyGrades: `SELECT daily_grade FROM Student_Memorization_Assessments WHERE enrollment_id = ? AND session_year = ? AND term = ?`,
      exam: `SELECT exam_grade FROM Student_Memorization_Exam WHERE enrollment_id = ? AND session_year = ? AND term = ?`,
      attendance: `SELECT COUNT(*) AS total_days, SUM(CASE WHEN attendance_status='Present' THEN 1 ELSE 0 END) AS present_days
                   FROM Student_Attendance WHERE student_id = (SELECT id FROM Students WHERE student_id = ?) 
                     AND session_year = ? AND term = ? AND is_active = 1`
    };

    Promise.all([
      new Promise((resolve, reject) => db.query(queries.info, [req.session.studentId], (e, r) => e ? reject(e) : resolve(r))),
      new Promise((resolve, reject) => db.query(queries.details, [enrollment_id, session, term], (e, r) => e ? reject(e) : resolve(r))),
      new Promise((resolve, reject) => db.query(queries.dailyGrades, [enrollment_id, session, term], (e, r) => e ? reject(e) : resolve(r))),
      new Promise((resolve, reject) => db.query(queries.exam, [enrollment_id, session, term], (e, r) => e ? reject(e) : resolve(r))),
      new Promise((resolve, reject) => db.query(queries.attendance, [req.session.studentId, session, term], (e, r) => e ? reject(e) : resolve(r)))
    ])
    .then(([info, details, daily, exam, att]) => {
      const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
      const points = daily.map(r => gradePoints[r.daily_grade] || 0);
      const avg = points.length ? points.reduce((a,b) => a+b, 0) / points.length : 0;
      const dailyScore = (avg / 5) * 80;
      const examGrade = exam[0]?.exam_grade || "F";
      const examScore = (gradePoints[examGrade] / 5) * 20;
      const totalScore = dailyScore + examScore;
      let finalGrade = totalScore >= 70 ? "A" : totalScore >= 60 ? "B" : totalScore >= 50 ? "C" : totalScore >= 40 ? "D" : "F";

      const attendanceRow = att[0] || { total_days: 0, present_days: 0 };
      const attendancePercent = attendanceRow.total_days ? ((attendanceRow.present_days / attendanceRow.total_days) * 100).toFixed(1) + "%" : "0%";

      res.json({
        success: true,
        data: {
          full_name: info[0].full_name,
          student_id: req.session.studentId,
          class_name: class_name,
          session, term,
          daily_records: details,
          daily_score: dailyScore.toFixed(2),
          exam_score: examScore.toFixed(2),
          total_score: totalScore.toFixed(2),
          final_grade: finalGrade,
          attendance_present: attendanceRow.present_days,
          attendance_total: attendanceRow.total_days,
          attendance_percent: attendancePercent
        }
      });
    })
    .catch(err => {
      console.error("Tahfiz report error:", err);
      res.status(500).json({ success: false });
    });
  });
});

// 7. COMPLETE REPORT - FULLY CLASS FILTERED + CLASS NAME
app.get("/api/student-complete-report", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") {
    return res.status(401).json({ success: false });
  }

  const { session, term, class_ref } = req.query;
  if (!session || !term || !class_ref) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  const [section_id, class_id] = class_ref.split(":");

  const getEnrollment = `
    SELECT se.enrollment_id, COALESCE(c.class_name, wc.class_name) AS class_name, s.full_name
    FROM Student_Enrollments se
    JOIN Students s ON se.student_id = s.id
    LEFT JOIN Classes c ON se.class_ref = c.class_id AND se.section_id = 1
    LEFT JOIN Western_Classes wc ON se.class_ref = wc.western_class_id AND se.section_id = 2
    WHERE s.student_id = ? AND se.section_id = ? AND se.class_ref = ?
  `;

  db.query(getEnrollment, [req.session.studentId, section_id, class_id], (err, rows) => {
    if (err || !rows.length) {
      return res.json({ success: false, message: "Enrollment not found" });
    }

    const { enrollment_id, class_name, full_name } = rows[0];

    const sqlSubjects = `
      SELECT sub.subject_name, ssa.ca1_score AS ca1, ssa.ca2_score AS ca2, ssa.exam_score AS exam,
             (COALESCE(ssa.ca1_score,0) + COALESCE(ssa.ca2_score,0) + COALESCE(ssa.exam_score,0)) AS total
      FROM Student_Subject_Assessments ssa
      JOIN Subjects sub ON ssa.subject_id = sub.subject_id
      WHERE ssa.enrollment_id = ? AND ssa.session_year = ? AND ssa.term = ?
    `;

    const sqlAttendance = `
      SELECT COUNT(*) AS total, SUM(CASE WHEN attendance_status='Present' THEN 1 ELSE 0 END) AS present
      FROM Student_Attendance 
      WHERE student_id = (SELECT id FROM Students WHERE student_id = ?) 
        AND session_year = ? AND term = ? AND is_active = 1
    `;

    Promise.all([
      new Promise((resolve, reject) => db.query(sqlSubjects, [enrollment_id, session, term], (e, r) => e ? reject(e) : resolve(r))),
      new Promise((resolve, reject) => db.query(sqlAttendance, [req.session.studentId, session, term], (e, r) => e ? reject(e) : resolve(r)))
    ])
    .then(([subjects, att]) => {
      subjects.forEach(s => {
        const t = Number(s.total);
        s.grade = t >= 70 ? "A" : t >= 60 ? "B" : t >= 50 ? "C" : t >= 40 ? "D" : "F";
      });

      const attendanceRow = att[0] || { total: 0, present: 0 };
      const attendancePercent = attendanceRow.total > 0 ? ((attendanceRow.present / attendanceRow.total) * 100).toFixed(1) + "%" : "0%";

      res.json({
        success: true,
        data: {
          full_name,
          student_id: req.session.studentId,
          class_name,
          session,
          term,
          subjects,
          attendance_present: attendanceRow.present,
          attendance_total: attendanceRow.total,
          attendance_percent: attendancePercent
        }
      });
    })
    .catch(err => {
      console.error("Complete report error:", err);
      res.status(500).json({ success: false });
    });
  });
});

// 8. KEEP YOUR OTHER ENDPOINTS (sessions, terms, weeks) - THEY ARE FINE
app.get("/api/student-sessions", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") return res.status(401).json({ success: false });
  const query = `SELECT DISTINCT session_year AS session FROM Student_Enrollments se JOIN Students s ON se.student_id = s.id WHERE s.student_id = ? ORDER BY session_year DESC`;
  db.query(query, [req.session.studentId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results.map(r => r.session) });
  });
});

app.get("/api/student-terms", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "student") return res.status(401).json({ success: false });
  const query = `SELECT DISTINCT term FROM Student_Enrollments se JOIN Students s ON se.student_id = s.id WHERE s.student_id = ? ORDER BY term`;
  db.query(query, [req.session.studentId], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results.map(r => r.term) });
  });
});


//server listen to port 5000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});