
// Get sessions
app.get("/api/sessions", (req, res) => {
  if (!req.session.isAuthenticated) {
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

// Get memorization weeks for a term
app.get("/api/memorization-weeks", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }

  const { class_id, term } = req.query
  const query = "SELECT DISTINCT week FROM Daily_Memorization_Scheme WHERE class_id = ? AND term = ? ORDER BY week"

  db.query(query, [class_id, term], (err, results) => {
    if (err) {
      console.error("Error fetching weeks:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }
    res.status(200).json({ success: true, data: results })
  })
})

// Update staff memorization endpoint to include session and term filtering
app.get("/api/staff-memorization/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }
  const { staffId } = req.params
  const { section_id, class_id, term, week, session } = req.query

  const query = `
        SELECT 
            s.full_name AS student_name,
            se.enrollment_id,
            dms.week,
            dms.day,
            dms.from_surah_ayah,
            dms.to_surah_ayah,
            dms.id as scheme_id,
            sma.daily_grade,
            sma.exam_grade,
            sma.comments
        FROM staff st
        JOIN staff_classes sc ON st.id = sc.staff_id
        JOIN Student_Enrollments se ON sc.section_id = se.section_id AND sc.class_id = se.class_ref
        JOIN Students s ON se.student_id = s.id
        JOIN Daily_Memorization_Scheme dms ON sc.class_id = dms.class_id AND dms.term = ? AND dms.week = ?
        LEFT JOIN Student_Memorization_Assessments sma ON se.enrollment_id = sma.enrollment_id 
            AND sma.scheme_id = dms.id AND sma.academic_year = ?
        WHERE st.id = ? AND sc.section_id = 1 AND sc.class_id = ?
    `

  db.query(query, [term, week, session, staffId, class_id], (err, results) => {
    if (err) {
      console.error("Error fetching memorization:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }
    res.status(200).json({ success: true, data: results })
  })
})

// Update staff memorization save to include session
app.post("/api/staff-memorization/:staffId", (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }
  const { staffId } = req.params
  const { section_id, class_id, term, week, session, memorization } = req.body

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction start error:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }

    // Get scheme_id first
    const schemeQuery = "SELECT id FROM Daily_Memorization_Scheme WHERE class_id = ? AND term = ? AND week = ? LIMIT 1"
    db.query(schemeQuery, [class_id, term, week], (err, schemeResults) => {
      if (err || schemeResults.length === 0) {
        return db.rollback(() => {
          res.status(500).json({ success: false, message: "Scheme not found." })
        })
      }

      const schemeId = schemeResults[0].id

      const insertQuery = `
                INSERT INTO Student_Memorization_Assessments 
                (enrollment_id, scheme_id, daily_grade, exam_grade, comments, date, academic_year, term)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                daily_grade = VALUES(daily_grade),
                exam_grade = VALUES(exam_grade),
                comments = VALUES(comments)
            `

      const values = memorization.map((record) => [
        record.enrollment_id,
        schemeId,
        record.daily_grade,
        record.exam_grade,
        record.comments,
        record.date,
        session,
        term,
      ])

      db.query(insertQuery, [values], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error saving memorization:", err)
            res.status(500).json({ success: false, message: "Database error." })
          })
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Commit error:", err)
              res.status(500).json({ success: false, message: "Database error." })
            })
          }
          res.status(200).json({ success: true, message: "Memorization progress saved." })
        })
      })
    })
  })
})

// Upload memorization video
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})
const videoUpload = multer({ storage: videoStorage })

app.post("/api/upload-memorization-video", videoUpload.single("video"), (req, res) => {
  if (!req.session.isAuthenticated || req.session.userType !== "staff") {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }

  const { title, description, week } = req.body
  const videoPath = req.file.path

  const query =
    "INSERT INTO Memorization_Videos (title, description, week, video_path, uploaded_by) VALUES (?, ?, ?, ?, ?)"
  db.query(query, [title, description, week, videoPath, req.session.staffId], (err, result) => {
    if (err) {
      console.error("Error saving video:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }
    res.status(200).json({ success: true, message: "Video uploaded successfully." })
  })
})

// Generate student report
app.get("/api/student-report", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }

  const { student_id, session, term } = req.query

  // Query to get student info and all subject scores
  const query = `
        SELECT 
            s.full_name,
            s.student_id,
            sub.subject_name,
            ssa.ca1_score,
            ssa.ca2_score,
            ssa.ca3_score,
            ssa.exam_score,
            ssa.comments
        FROM Students s
        JOIN Student_Enrollments se ON s.id = se.student_id
        JOIN Student_Subject_Assessments ssa ON se.enrollment_id = ssa.enrollment_id
        JOIN Subjects sub ON ssa.subject_id = sub.subject_id
        WHERE s.student_id = ? AND ssa.academic_year = ? AND ssa.term = ?
    `

  db.query(query, [student_id, session, term], (err, results) => {
    if (err) {
      console.error("Error generating report:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }

    // Generate HTML report
    let html = `
            <html>
            <head><title>Student Report</title></head>
            <body>
                <h1>Student Report</h1>
                <h2>${results[0]?.full_name || "N/A"} (${student_id})</h2>
                <h3>Session: ${session}, Term: ${term}</h3>
                <table border="1">
                    <tr>
                        <th>Subject</th>
                        <th>CA1</th>
                        <th>CA2</th>
                        <th>CA3</th>
                        <th>Exam</th>
                        <th>Total</th>
                        <th>Comments</th>
                    </tr>
        `

    results.forEach((row) => {
      const total = (row.ca1_score || 0) + (row.ca2_score || 0) + (row.ca3_score || 0) + (row.exam_score || 0)
      html += `
                <tr>
                    <td>${row.subject_name}</td>
                    <td>${row.ca1_score || "-"}</td>
                    <td>${row.ca2_score || "-"}</td>
                    <td>${row.ca3_score || "-"}</td>
                    <td>${row.exam_score || "-"}</td>
                    <td>${total}</td>
                    <td>${row.comments || "-"}</td>
                </tr>
            `
    })

    html += `
                </table>
            </body>
            </html>
        `

    res.send(html)
  })
})

// Generate tahfiz report
app.get("/api/tahfiz-report", (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ success: false, message: "Unauthorized." })
  }

  const { student_id, session, term } = req.query

  const query = `
        SELECT 
            s.full_name,
            s.student_id,
            dms.week,
            dms.day,
            dms.from_surah_ayah,
            dms.to_surah_ayah,
            sma.daily_grade,
            sma.exam_grade,
            sma.comments
        FROM Students s
        JOIN Student_Enrollments se ON s.id = se.student_id
        JOIN Student_Memorization_Assessments sma ON se.enrollment_id = sma.enrollment_id
        JOIN Daily_Memorization_Scheme dms ON sma.scheme_id = dms.id
        WHERE s.student_id = ? AND sma.academic_year = ? AND sma.term = ?
        ORDER BY dms.week, dms.day
    `

  db.query(query, [student_id, session, term], (err, results) => {
    if (err) {
      console.error("Error generating tahfiz report:", err)
      return res.status(500).json({ success: false, message: "Database error." })
    }

    let html = `
            <html>
            <head><title>Tahfiz Report</title></head>
            <body>
                <h1>Tahfiz Report</h1>
                <h2>${results[0]?.full_name || "N/A"} (${student_id})</h2>
                <h3>Session: ${session}, Term: ${term}</h3>
                <table border="1">
                    <tr>
                        <th>Week</th>
                        <th>Day</th>
                        <th>Ayat Range</th>
                        <th>Daily Grade</th>
                        <th>Exam Score</th>
                        <th>Comments</th>
                    </tr>
        `

    results.forEach((row) => {
      html += `
                <tr>
                    <td>${row.week}</td>
                    <td>${row.day}</td>
                    <td>${row.from_surah_ayah} - ${row.to_surah_ayah}</td>
                    <td>${row.daily_grade || "-"}</td>
                    <td>${row.exam_grade || "-"}</td>
                    <td>${row.comments || "-"}</td>
                </tr>
            `
    })

    html += `
                </table>
            </body>
            </html>
        `

    res.send(html)
  })
})
