const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./mysql'); // Assumes this exports a mysql.createPool connection
const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.isAuthenticated || req.session.userType !== 'staff') {
        console.warn('Unauthorized access attempt', { path: req.originalUrl });
        return res.status(401).json({ success: false, message: 'Unauthorized.', redirect: '/staff-login' });
    }
    next();
};
router.get('/staff-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'staff_login.html'));
});

//staff dashboard  
router.get('/staff-dashboard', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/staff-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'staff_dashboard.html'));
});

// Staff Login
router.post('/staff-login', async (req, res) => {
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
router.post('/update-staff-credentials', requireAuth, async (req, res) => {
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

        // Check if the new Staff ID is already taken by another user
        const checkQuery = 'SELECT * FROM staff WHERE staff_id = ? AND staff_id != ?';
        db.query(checkQuery, [trimmedStaffId, staffId.trim()], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
            }
            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'New Staff ID already exists.' });
            }

            // Perform the update
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

// Forgot Password: Verify Staff ID
router.post('/staff/forgot-password/verify-staff-id', (req, res) => {
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
        if (!results[0].security_question || results[0].security_question.trim().length === 0) {
            return res.status(404).json({ success: false, message: 'Security question not set. Contact administrator.' });
        }
        res.status(200).json({ success: true, securityQuestion: results[0].security_question });
    });
});

// Forgot Password: Verify Security Answer
router.post('/staff/forgot-password/verify-answer', (req, res) => {
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
        const inputAnswer = securityAnswer.trim().toUpperCase();
        
        if (inputAnswer === storedAnswer) {
            res.status(200).json({ success: true, message: 'Security answer verified.' });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect security answer.' });
        }
    });
});

// Forgot Password: Reset Password
router.post('/staff/forgot-password/reset-password', async (req, res) => {
    const { staff_id, newPassword } = req.body;

    if (!staff_id || !newPassword || staff_id.trim().length === 0 || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Staff ID and new password are required.' });
    }
    
    if (newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10); 
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

// Upload Staff Profile Picture
router.post('/staff/upload-profile-picture', requireAuth, (req, res) => {
    const { staffId } = req.body;

    if (!staffId) {
        return res.status(400).json({ success: false, message: 'Staff ID is required.' });
    }

    // Note: File upload requires `multer` middleware, assumed to be configured
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
            res.status(200).json({ success: true, message: 'Profile picture uploaded successfully.', filePath });
        });
    } catch (error) {
        console.error('Error processing profile picture:', error);
        res.status(500).json({ success: false, message: 'Error processing image.' });
    }
});

// Retrieve Staff Profile Picture
router.get('/staff/profile-picture/:id', requireAuth, (req, res) => {
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

// Fetch All Staff
router.get('/staff', requireAuth, (req, res) => {
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

// Fetch Single Staff
router.get('/staff/:id', requireAuth, (req, res) => {
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
        fetchEnrichedStaff(staff.id, (enrichedStaff) => {
            if (!enrichedStaff) {
                return res.status(500).json({ success: false, message: 'Failed to fetch enriched staff data.' });
            }
            res.status(200).json({ success: true, data: enrichedStaff });
        });
    });
});

// Add or Update Staff
router.post('/staff', requireAuth, async (req, res) => {
    const { id, staff_id, name, email, phone, role, password, classes_taught, subjects_taught, form_master_class } = req.body;

    if (!staff_id || !name || !phone || !role) {
        console.error('Missing required fields:', { staff_id, name, phone, role });
        return res.status(400).json({ success: false, message: 'Required fields are missing.' });
    }

    const isUpdate = !!id;
    const term = 1;

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
                const newStaffId = result.insertId;
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
                        if (err) return rollbackError('Error inserting staff subjects:', err);
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
                        return res.status(500).json({ success: false, message: 'Failed to fetch staff data.' });
                    }
                    res.status(200).json({ 
                        success: true, 
                        message: isUpdate ? 'Staff updated successfully.' : 'Staff created successfully.',
                        data: staff,
                        id: staffId
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

// Update Staff (Safe Update)
router.put('/staff/:id', requireAuth, async (req, res) => {
    const id = req.params.id;
    const { staff_id, name, email, phone, role, classes_taught, subjects_taught, form_master_class } = req.body;
    const term = 1;

    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        const updateFields = [];
        const params = [];

        if (staff_id) { updateFields.push("staff_id = ?"); params.push(staff_id.trim()); }
        if (name) { updateFields.push("name = ?"); params.push(name.trim()); }
        if (email !== undefined) { updateFields.push("email = ?"); params.push(email || null); }
        if (phone) { updateFields.push("phone = ?"); params.push(phone.trim()); }
        if (role) { updateFields.push("role = ?"); params.push(role.trim()); }

        params.push(id);

        if (updateFields.length > 0) {
            const sql = `UPDATE staff SET ${updateFields.join(", ")} WHERE id = ?`;
            db.query(sql, params, (err, result) => {
                if (err) return rollbackError('Error updating staff table:', err);
                if (result.affectedRows === 0) {
                    return db.rollback(() => res.status(404).json({ success: false, message: 'Staff not found.' }));
                }
                updateRelations(id);
            });
        } else {
            updateRelations(id);
        }

        function updateRelations(staffId) {
            if (classes_taught && Array.isArray(classes_taught) && classes_taught.length > 0) {
                db.query("DELETE FROM staff_classes WHERE staff_id = ?", [staffId], (err) => {
                    if (err) return rollbackError("Error clearing old classes:", err);
                    const classValues = classes_taught.map(cls => {
                        const [section_id, class_id] = cls.split(':').map(Number);
                        return [staffId, section_id === 1 ? class_id : null, section_id === 2 ? class_id : null, section_id, term];
                    });
                    db.query("INSERT INTO staff_classes (staff_id, class_id, western_class_id, section_id, term) VALUES ?", [classValues], (err) => {
                        if (err) return rollbackError("Error inserting classes:", err);
                        updateSubjects(staffId);
                    });
                });
            } else {
                updateSubjects(staffId);
            }
        }

        function updateSubjects(staffId) {
            if (subjects_taught && Array.isArray(subjects_taught) && subjects_taught.length > 0) {
                db.query("DELETE FROM staff_subjects WHERE staff_id = ?", [staffId], (err) => {
                    if (err) return rollbackError("Error clearing old subjects:", err);
                    const subjectValues = subjects_taught.map(sub => {
                        const [section_id, subject_id] = sub.split(':').map(Number);
                        return [staffId, subject_id, section_id, term];
                    });
                    db.query("INSERT INTO staff_subjects (staff_id, subject_id, section_id, term) VALUES ?", [subjectValues], (err) => {
                        if (err) return rollbackError("Error inserting subjects:", err);
                        updateFormMaster(staffId);
                    });
                });
            } else {
                updateFormMaster(staffId);
            }
        }

        function updateFormMaster(staffId) {
            if (form_master_class === null || form_master_class === undefined) {
                db.query("DELETE FROM staff_form_master WHERE staff_id = ?", [staffId], (err) => {
                    if (err) return rollbackError("Error clearing form master:", err);
                    finish(staffId);
                });
            } else if (form_master_class) {
                db.query("DELETE FROM staff_form_master WHERE staff_id = ?", [staffId], (err) => {
                    if (err) return rollbackError("Error clearing old form master:", err);
                    const [section_id, class_id] = form_master_class.split(':').map(Number);
                    db.query(
                        "INSERT INTO staff_form_master (staff_id, class_id, western_class_id, section_id, term) VALUES (?, ?, ?, ?, ?)",
                        [staffId, section_id === 1 ? class_id : null, section_id === 2 ? class_id : null, section_id, term],
                        (err) => {
                            if (err) return rollbackError("Error inserting form master:", err);
                            finish(staffId);
                        }
                    );
                });
            } else {
                finish(staffId);
            }
        }

        function finish(staffId) {
            db.commit((err) => {
                if (err) return rollbackError("Commit error:", err);
                fetchEnrichedStaff(staffId, (staff) => {
                    res.status(200).json({
                        success: true,
                        message: "Staff updated successfully.",
                        data: staff
                    });
                });
            });
        }

        function rollbackError(msg, err) {
            return db.rollback(() => {
                console.error(msg, err);
                res.status(500).json({ success: false, message: msg });
            });
        }
    });
});

// Delete Staff Member
router.delete('/staff/:id', requireAuth, (req, res) => {
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

// Fetch Staff Session Info
router.get('/staff-session', requireAuth, (req, res) => {
    if (!req.session.staffId) {
        return res.status(401).json({ success: false, message: 'No staff session found.' });
    }
    res.status(200).json({ success: true, data: { staff_id: req.session.staffId } });
});

// Fetch Staff Information
router.get('/staff-info/:id', requireAuth, (req, res) => {
    const staffId = req.params.id;
    const staffQuery = 'SELECT id, staff_id, name, email, phone, role, profile_picture FROM staff WHERE staff_id = ?';
    
    db.query(staffQuery, [staffId], (err, staffResults) => {
        if (err) {
            console.error('Error fetching staff details:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (staffResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const staff = staffResults[0];
        fetchEnrichedStaff(staff.id, (enrichedStaff) => {
            if (!enrichedStaff) {
                return res.status(500).json({ success: false, message: 'Failed to fetch enriched staff data.' });
            }
            res.status(200).json({ success: true, data: enrichedStaff });
        });
    });
});

// Fetch Dashboard Statistics
router.get('/staff-dashboard-stats/:staffId', requireAuth, (req, res) => {
    const staffId = req.params.staffId;

    const statsQuery = `
        SELECT 
            (SELECT COUNT(*) 
             FROM staff_classes sc 
             WHERE sc.staff_id = s.id) AS totalClasses,
            (SELECT COUNT(DISTINCT se.student_id) 
             FROM Student_Enrollments se 
             JOIN staff_classes sc ON se.section_id = sc.section_id 
             AND se.class_ref = COALESCE(sc.class_id, sc.western_class_id)
             WHERE sc.staff_id = s.id) AS totalStudents,
            (SELECT IFNULL(AVG(CASE WHEN a.attendance_status = 'Present' THEN 100 ELSE 0 END), 0)
             FROM Student_Attendance a
             JOIN Student_Enrollments se ON a.enrollment_id = se.enrollment_id
             JOIN staff_classes sc ON se.section_id = sc.section_id 
             AND se.class_ref = COALESCE(sc.class_id, sc.western_class_id)
             WHERE sc.staff_id = s.id 
             AND a.date = CURDATE()) AS attendanceToday,
            (SELECT IFNULL(AVG(ssa.ca1_score + ssa.ca2_score + ssa.ca3_score + ssa.exam_score), 0)
             FROM Student_Subject_Assessments ssa
             JOIN Student_Subjects ss ON ssa.id = ss.id
             JOIN Student_Enrollments se ON ss.enrollment_id = se.enrollment_id
             JOIN staff_classes sc ON se.section_id = sc.section_id 
             AND se.class_ref = COALESCE(sc.class_id, sc.western_class_id)
             WHERE sc.staff_id = s.id) AS averageGrade
        FROM staff s
        WHERE s.staff_id = ?
    `;

    db.query(statsQuery, [staffId], (err, results) => {
        if (err) {
            console.error('Error fetching dashboard stats:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({
            success: true,
            data: {
                totalClasses: results[0].totalClasses || 0,
                totalStudents: results[0].totalStudents || 0,
                attendanceToday: Math.round(results[0].attendanceToday) || 0,
                averageGrade: Math.round(results[0].averageGrade) || 0
            }
        });
    });
});

// Fetch Classes
router.get('/classes', requireAuth, (req, res) => {
    const query = `
        SELECT 
            c.class_id AS id, 
            c.class_name AS class_name, 
            c.level, 
            1 AS section_id,
            (SELECT COUNT(*) 
             FROM Student_Enrollments se 
             WHERE se.section_id = 1 AND se.class_ref = c.class_id) AS student_count
        FROM Classes c
        UNION
        SELECT 
            w.western_class_id AS id, 
            w.class_name AS class_name, 
            w.level, 
            2 AS section_id,
            (SELECT COUNT(*) 
             FROM Student_Enrollments se 
             WHERE se.section_id = 2 AND se.class_ref = w.western_class_id) AS student_count
        FROM Western_Classes w
        ORDER BY class_name
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching classes:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch Students for a Specific Class
router.get('/staff-students/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id } = req.query;

    if (!section_id || !class_id) {
        return res.status(400).json({ success: false, message: 'Section ID and Class ID are required.' });
    }

    const query = `
        SELECT 
            s.id, 
            s.student_id, 
            s.full_name, 
            s.gender
        FROM Students s
        JOIN Student_Enrollments se ON s.id = se.student_id
        JOIN staff_classes sc ON se.section_id = sc.section_id 
            AND se.class_ref = COALESCE(sc.class_id, sc.western_class_id)
        WHERE sc.staff_id = (SELECT id FROM staff WHERE staff_id = ?)
            AND se.section_id = ? 
            AND se.class_ref = ?
    `;
    db.query(query, [staffId, section_id, class_id], (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch Attendance for Form Master
router.get('/staff-attendance/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, date, day } = req.query;

    if (!section_id || !class_id || !date || !day) {
        return res.status(400).json({ success: false, message: 'Section ID, Class ID, date, and day are required.' });
    }

    const formMasterQuery = `
        SELECT * FROM staff_form_master 
        WHERE staff_id = (SELECT id FROM staff WHERE staff_id = ?) 
        AND section_id = ? 
        AND (class_id = ? OR western_class_id = ?)
        AND term = (SELECT MAX(term) FROM staff_form_master)
    `;
    db.query(formMasterQuery, [staffId, section_id, class_id, class_id], (err, formMasterResults) => {
        if (err) {
            console.error('Error verifying form master:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (formMasterResults.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not the form master for this class.' });
        }

        const query = `
            SELECT 
                se.enrollment_id,
                s.full_name AS student_name,
                COALESCE(a.attendance_status, 'Absent') AS attendance_status
            FROM Students s
            JOIN Student_Enrollments se ON s.id = se.student_id
            LEFT JOIN Student_Attendance a ON se.enrollment_id = a.enrollment_id 
                AND a.date = ? AND a.day = ?
            WHERE se.section_id = ? 
                AND se.class_ref = ?
        `;
        db.query(query, [date, day, section_id, class_id], (err, results) => {
            if (err) {
                console.error('Error fetching attendance:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            res.status(200).json({ success: true, data: results });
        });
    });
});

// Save Attendance
router.post('/staff-attendance/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, date, day, attendance } = req.body;

    if (!section_id || !class_id || !date || !day || !Array.isArray(attendance)) {
        return res.status(400).json({ success: false, message: 'Missing required fields or invalid attendance data.' });
    }

    const formMasterQuery = `
        SELECT * FROM staff_form_master 
        WHERE staff_id = (SELECT id FROM staff WHERE staff_id = ?) 
        AND section_id = ? 
        AND (class_id = ? OR western_class_id = ?)
        AND term = (SELECT MAX(term) FROM staff_form_master)
    `;
    db.query(formMasterQuery, [staffId, section_id, class_id, class_id], (err, formMasterResults) => {
        if (err) {
            console.error('Error verifying form master:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (formMasterResults.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not the form master for this class.' });
        }

        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction start error:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }

            const deleteQuery = `
                DELETE a FROM Student_Attendance a
                JOIN Student_Enrollments se ON a.enrollment_id = se.enrollment_id
                WHERE se.section_id = ? AND se.class_ref = ? AND a.date = ? AND a.day = ?
            `;
            db.query(deleteQuery, [section_id, class_id, date, day], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting existing attendance:', err);
                        res.status(500).json({ success: false, message: 'Database error.' });
                    });
                }

                const insertValues = attendance.map(record => [
                    record.enrollment_id,
                    date,
                    day,
                    record.attendance_status
                ]);
                if (insertValues.length === 0) {
                    return db.commit(() => res.status(200).json({ success: true, message: 'Attendance saved successfully.' }));
                }

                db.query(
                    'INSERT INTO Student_Attendance (enrollment_id, date, day, attendance_status) VALUES ?',
                    [insertValues],
                    (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error saving attendance:', err);
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
                            res.status(200).json({ success: true, message: 'Attendance saved successfully.' });
                        });
                    }
                );
            });
        });
    });
});

// Fetch Subjects for a Specific Class
router.get('/staff-subjects/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id } = req.query;

    if (!section_id || !class_id) {
        return res.status(400).json({ success: false, message: 'Section ID and Class ID are required.' });
    }

    const query = `
        SELECT 
            s.subject_id,
            s.subject_name
        FROM Subjects s
        JOIN staff_subjects ss ON s.subject_id = ss.subject_id
        WHERE ss.staff_id = (SELECT id FROM staff WHERE staff_id = ?)
            AND ss.section_id = ?
            AND ss.term = 1
    `;
    db.query(query, [staffId, section_id], (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch Assessments for a Specific Class and Subject
router.get('/staff-assessments/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, subject_id } = req.query;

    if (!section_id || !class_id || !subject_id) {
        return res.status(400).json({ success: false, message: 'Section ID, Class ID, and Subject ID are required.' });
    }

    const subjectCheckQuery = `
        SELECT * FROM staff_subjects 
        WHERE staff_id = (SELECT id FROM staff WHERE staff_id = ?) 
        AND subject_id = ? 
        AND section_id = ?
        AND term = 1
    `;
    db.query(subjectCheckQuery, [staffId, subject_id, section_id], (err, subjectResults) => {
        if (err) {
            console.error('Error verifying subject:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (subjectResults.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
        }

        const query = `
            SELECT 
                se.enrollment_id,
                s.full_name AS student_name,
                ssa.ca1_score,
                ssa.ca2_score,
                ssa.ca3_score,
                ssa.exam_score,
                ssa.comments
            FROM Students s
            JOIN Student_Enrollments se ON s.id = se.student_id
            JOIN Student_Subjects ss ON se.enrollment_id = ss.enrollment_id
            LEFT JOIN Student_Subject_Assessments ssa ON ss.id = ssa.id
            WHERE se.section_id = ? 
                AND se.class_ref = ? 
                AND ss.subject_id = ?
                AND ss.term = 1
        `;
        db.query(query, [section_id, class_id, subject_id], (err, results) => {
            if (err) {
                console.error('Error fetching assessments:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
            res.status(200).json({ success: true, data: results });
        });
    });
});

// Save Assessments
router.post('/staff-assessments/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, subject_id, term, assessments } = req.body;

    if (!section_id || !class_id || !subject_id || !term || !Array.isArray(assessments)) {
        return res.status(400).json({ success: false, message: 'Missing required fields or invalid assessments data.' });
    }

    const subjectCheckQuery = `
        SELECT * FROM staff_subjects 
        WHERE staff_id = (SELECT id FROM staff WHERE staff_id = ?) 
        AND subject_id = ? 
        AND section_id = ?
        AND term = ?
    `;
    db.query(subjectCheckQuery, [staffId, subject_id, section_id, term], (err, subjectResults) => {
        if (err) {
            console.error('Error verifying subject:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (subjectResults.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
        }

        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction start error:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }

            const deleteQuery = `
                DELETE ssa FROM Student_Subject_Assessments ssa
                JOIN Student_Subjects ss ON ssa.id = ss.id
                JOIN Student_Enrollments se ON ss.enrollment_id = se.enrollment_id
                WHERE se.section_id = ? 
                    AND se.class_ref = ? 
                    AND ss.subject_id = ?
                    AND ss.term = ?
            `;
            db.query(deleteQuery, [section_id, class_id, subject_id, term], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error deleting existing assessments:', err);
                        res.status(500).json({ success: false, message: 'Database error.' });
                    });
                }

                const insertValues = assessments.map(record => {
                    const { enrollment_id, ca1_score, ca2_score, ca3_score, exam_score, comments, date } = record;
                    return [
                        enrollment_id,
                        subject_id,
                        ca1_score ? parseFloat(ca1_score) : null,
                        ca2_score ? parseFloat(ca2_score) : null,
                        ca3_score ? parseFloat(ca3_score) : null,
                        exam_score ? parseFloat(exam_score) : null,
                        comments || '',
                        date
                    ];
                }).filter(record => record[0]);

                if (insertValues.length === 0) {
                    return db.commit(() => res.status(200).json({ success: true, message: 'Assessments saved successfully.' }));
                }

                const insertQuery = `
                    INSERT INTO Student_Subject_Assessments 
                    (enrollment_id, subject_id, ca1_score, ca2_score, ca3_score, exam_score, comments, date) 
                    VALUES ?
                `;
                db.query(insertQuery, [insertValues], (err) => {
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
                        res.status(200).json({ success: true, message: 'Assessments saved successfully.' });
                    });
                });
            });
        });
    });
});

// Fetch Memorization Schemes
router.get('/staff-memorization-schemes', requireAuth, (req, res) => {
    const { class_id } = req.query;

    if (!class_id) {
        return res.status(400).json({ success: false, message: 'Class ID is required.' });
    }

    const query = `
        SELECT 
            id,
            week,
            day,
            CONCAT(surah_name, ':', from_ayah) AS from_surah_ayah,
            CONCAT(surah_name, ':', to_ayah) AS to_surah_ayah
        FROM Memorization_Schemes
        WHERE class_id = ? AND section_id = 1
    `;
    db.query(query, [class_id], (err, results) => {
        if (err) {
            console.error('Error fetching memorization schemes:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Fetch Memorization Records
router.get('/staff-memorization/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, scheme_id } = req.query;

    if (!section_id || !class_id || !scheme_id) {
        return res.status(400).json({ success: false, message: 'Section ID, Class ID, and Scheme ID are required.' });
    }
    if (parseInt(section_id) !== 1) {
        return res.status(400).json({ success: false, message: 'Memorization is only available for Islamic section.' });
    }

    const query = `
        SELECT 
            se.enrollment_id,
            s.full_name AS student_name,
            ms.week,
            ms.day,
            CONCAT(ms.surah_name, ':', ms.from_ayah) AS from_surah_ayah,
            CONCAT(ms.surah_name, ':', ms.to_ayah) AS to_surah_ayah,
            m.daily_grade,
            m.exam_grade,
            m.comments
        FROM Students s
        JOIN Student_Enrollments se ON s.id = se.student_id
        JOIN Memorization_Schemes ms ON ms.class_id = se.class_ref AND ms.section_id = se.section_id
        LEFT JOIN Student_Memorization m ON se.enrollment_id = m.enrollment_id AND m.scheme_id = ms.id
        WHERE se.section_id = ? 
            AND se.class_ref = ? 
            AND ms.id = ?
    `;
    db.query(query, [section_id, class_id, scheme_id], (err, results) => {
        if (err) {
            console.error('Error fetching memorization records:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Save Memorization Records
router.post('/staff-memorization/:staffId', requireAuth, (req, res) => {
    const { staffId } = req.params;
    const { section_id, class_id, scheme_id, memorization } = req.body;

    if (!section_id || !class_id || !scheme_id || !Array.isArray(memorization)) {
        return res.status(400).json({ success: false, message: 'Missing required fields or invalid memorization data.' });
    }
    if (parseInt(section_id) !== 1) {
        return res.status(400).json({ success: false, message: 'Memorization is only available for Islamic section.' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction start error:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        const deleteQuery = `
            DELETE m FROM Student_Memorization m
            JOIN Student_Enrollments se ON m.enrollment_id = se.enrollment_id
            WHERE se.section_id = ? 
                AND se.class_ref = ? 
                AND m.scheme_id = ?
        `;
        db.query(deleteQuery, [section_id, class_id, scheme_id], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error deleting existing memorization:', err);
                    res.status(500).json({ success: false, message: 'Database error.' });
                });
            }

            const insertValues = memorization.map(record => {
                const { enrollment_id, scheme_id, daily_grade, exam_grade, comments, date } = record;
                return [
                    enrollment_id,
                    scheme_id,
                    daily_grade || null,
                    exam_grade ? parseFloat(exam_grade) : null,
                    comments || '',
                    date
                ];
            }).filter(record => record[0]);

            if (insertValues.length === 0) {
                return db.commit(() => res.status(200).json({ success: true, message: 'Memorization saved successfully.' }));
            }

            const insertQuery = `
                INSERT INTO Student_Memorization 
                (enrollment_id, scheme_id, daily_grade, exam_grade, comments, date) 
                VALUES ?
            `;
            db.query(insertQuery, [insertValues], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error saving memorization:', err);
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
                    res.status(200).json({ success: true, message: 'Memorization saved successfully.' });
                });
            });
        });
    });
});

// Staff Logout
router.post('/staff-logout', requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.', redirect: '/staff-login' });
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
                    callback(staff);
                });
            });
        });
    });
}

module.exports = router;