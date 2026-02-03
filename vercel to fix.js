i have error with my system and below is the part of the code as i have other part i just quote the part to help me fix it the errors are:

1. the Tahfiz memorization assessment is not loading at all and it should load depending on the term, class and the week selected. it should include session while saving as it help in retrieval. once they are selected it should fetch the ayat range for that selected term week and class.

2. it should implement a way that after the daily assessement there should be exams and i exams is once in a term and that to have the total grade we sum the grade and so some calculation for the whole term and add to the exams for A mark is 5, B is 4, C is 3 D is 2 E is 1 and F is 0. these daily grade will be computed taking the average of the grade marks and add to the grade mark of the final exams that is to say take the percentage of the exams is 25% while that of the daily is 75% please compute the score and give the final grade and score. look the exams grading should be created that it only display when needed,

3. one can choose to download the tahfiz report and downloading it should give what you have entered for the term be it exam is or not included.

4. once you are a form master you can download complete report for selected term, session and class you are form master but if you are subject teacher you can only download the subject you are teaching for the class you are teaching and one can download the Tahfiz report for selected.

   below are the codes i have but are not working for this Tahfiz and report i only assess first term other terms are not ok and i cannot download any of the report it coms empty, some say database error some redirect me to pay with no details of the student and not file download just redirection is see and is file i need:

find below the html, js, backed snipet and the databse schema:



// -------------------------------------------------
// 1. GET: Load weeks (NO session_year in your table)
// -------------------------------------------------
app.get("/api/staff-memorization-weeks", async (req, res) => {
  const { class_id, term } = req.query;
  if (!class_id || !term) {
    return res.json({ success: false, message: "Missing class_id or term" });
  }

  try {
    const [rows] = await db.query(
      `SELECT DISTINCT week 
       FROM Daily_Memorization_Scheme 
       WHERE class_id = ? AND term = ?
       ORDER BY week`,
      [class_id, term]
    );
    const data = rows.map(r => ({ week: r.week }));
    res.json({ success: true, data });
  } catch (err) {
    console.error("Load weeks error:", err);
    res.status(500).json({ success: false, message: "DB error" });
  }
});

// -------------------------------------------------
// 2. GET: Load ayat + students (FIX: no .map() crash)
// -------------------------------------------------
app.get("/api/staff-memorization/:staffId", async (req, res) => {
  const { section_id, class_id, term, week, session } = req.query;

  if (!section_id || !class_id || !term || !week) {
    return res.json({ success: false, message: "Missing params" });
  }

  try {
    // Get ayat for this week
    const [schemeRows] = await db.query(
      `SELECT id, day, from_surah_ayah, to_surah_ayah
       FROM Daily_Memorization_Scheme
       WHERE class_id = ? AND term = ? AND week = ?
       ORDER BY day`,
      [class_id, term, week]
    );

    if (!schemeRows || schemeRows.length === 0) {
      return res.json({ success: false, message: "No ayat for this week" });
    }

    // Build list of scheme IDs safely
    const schemeIds = schemeRows.map(r => r.id);
    const ayatInfo = schemeRows.map(r => `${r.day}: ${r.from_surah_ayah} to ${r.to_surah_ayah}`).join(" | ");

    // Get students
    const [students] = await db.query(
      `SELECT 
         e.id AS enrollment_id,
         s.id AS student_id,
         s.full_name AS student_name,
         mg.daily_grade,
         mg.grade,
         mg.comments
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       LEFT JOIN memorization_grades mg 
         ON mg.enrollment_id = e.id AND mg.scheme_id IN (?)
       WHERE e.section_id = ? AND e.class_id = ? AND e.session_year = ?`,
      [schemeIds, section_id, class_id, session || '2025/2026'] // fallback session
    );

    const data = students.map(s => ({
      ...s,
      ayat_info: ayatInfo,
      scheme_id: schemeIds[0], // use first for saving
      daily_grade: s.daily_grade || "",
      grade: s.grade || "",
      comments: s.comments || ""
    }));

    res.json({ success: true, data, ayat_info: ayatInfo });
  } catch (err) {
    console.error("Load students error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------------------------------------
// 3. POST: Save grades (unchanged)
// -------------------------------------------------
app.post("/api/staff-memorization/:staffId", async (req, res) => {
  const { section_id, class_id, term, week, session, memorization } = req.body;

  if (!section_id || !class_id || !term || !week || !Array.isArray(memorization)) {
    return res.json({ success: false, message: "Invalid data" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const m of memorization) {
      const { enrollment_id, scheme_id, daily_grade, grade, comments, date } = m;
      await conn.query(
        `INSERT INTO memorization_grades 
         (enrollment_id, scheme_id, daily_grade, grade, comments, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           daily_grade = VALUES(daily_grade),
           grade = VALUES(grade),
           comments = VALUES(comments),
           date = VALUES(date)`,
        [enrollment_id, scheme_id, daily_grade || null, grade || null, comments || null, date]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Save error:", err);
    res.status(500).json({ success: false, message: "Save failed" });
  } finally {
    conn.release();
  }
});

let currentStaffId = null
let currentStaffRole = null
let currentStaffInfo = null

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  await loadStaffInfo()
  await loadDashboardStats()
  await loadSessions()
  setupEventListeners()
})

// Load staff information
async function loadStaffInfo() {
  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) {
      console.error("Failed to get staff session")
      window.location.href = "/staff-login"
      return
    }

    const staffId = sessionData.data.staff_id
    const response = await fetch(`/api/staff/${staffId}`)
    const data = await response.json()

    if (data.success) {
      currentStaffInfo = data.data
      currentStaffId = data.data.id
      currentStaffRole = data.data.role

      document.getElementById("staffIdDisplay").textContent = data.data.staff_id || "N/A"
      document.getElementById("staffRoleDisplay").textContent = data.data.role || "N/A"
      document.getElementById("staffNameDisplay").textContent = data.data.name || "Staff"

      const profilePic = document.getElementById("staffProfilePicture")
      if (data.data.profile_picture) {
        profilePic.src = data.data.profile_picture
      }
    } else {
      console.error("Failed to load staff info:", data.message)
    }
  } catch (error) {
    console.error("Error loading staff info:", error)
  }
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) {
      console.error("Failed to get staff session")
      return
    }

    const staffId = sessionData.data.staff_id
    const response = await fetch(`/api/staff-dashboard-stats/${staffId}`)
    const data = await response.json()

    if (data.success) {
      document.getElementById("totalClassesCount").textContent = data.data.totalClasses || 0
      document.getElementById("totalStudentsCount").textContent = data.data.totalStudents || 0
      document.getElementById("attendanceTodayCount").textContent = (data.data.attendanceToday || 0).toFixed(1) + "%"
      document.getElementById("averageGradeCount").textContent = (data.data.averageGrade || 0).toFixed(1)
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error)
  }
}

// Load sessions
async function loadSessions() {
  try {
    const response = await fetch("/api/sessions")
    const data = await response.json()

    if (data.success) {
      const sessionSelects = [
        document.getElementById("memorizationSessionSelect"),
        document.getElementById("reportSessionSelect"),
        document.getElementById("attendanceSessionSelect"),
      ]

      sessionSelects.forEach((select) => {
        if (select) {
          select.innerHTML = '<option value="">Select Session</option>'
          data.data.forEach((session) => {
            const option = document.createElement("option")
            option.value = session.session_year
            option.textContent = session.session_year
            if (session.is_current) {
              option.selected = true
            }
            select.appendChild(option)
          })
        }
      })
    }
  } catch (error) {
    console.error("Error loading sessions:", error)
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const view = e.currentTarget.getAttribute("data-view")
      switchView(view)
    })
  })

  // Sidebar toggle
  document.getElementById("sidebarToggleMobile")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open")
  })

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault()
    await fetch("/api/staff-logout", { method: "POST" })
    window.location.href = "/staff-login"
  })

  document.getElementById("memorizationTermSelect")?.addEventListener("change", loadAyatRanges)
  document.getElementById("memorizationClassSelect")?.addEventListener("change", () => {
    document.getElementById("memorizationTermSelect").value = ""
    document.getElementById("ayatRangesSection").style.display = "none"
    document.getElementById("memorizationStudentsSection").style.display = "none"
  })

  // Load buttons
  document.getElementById("loadAttendanceBtn")?.addEventListener("click", loadAttendance)
  document.getElementById("loadSubjectScoresBtn")?.addEventListener("click", loadSubjectScores)
  document.getElementById("loadReportStudentsBtn")?.addEventListener("click", loadReportStudents)

  // Save buttons
  document.getElementById("saveAttendanceBtn")?.addEventListener("click", saveAttendance)
  document.getElementById("saveMemorizationBtn")?.addEventListener("click", saveMemorization)
  document.getElementById("saveSubjectScoresBtn")?.addEventListener("click", saveSubjectScores)

  // Video upload form
  document.getElementById("videoUploadForm")?.addEventListener("submit", uploadVideo)
}

// Switch view
function switchView(view) {
  document.querySelectorAll('[id$="-view"]').forEach((v) => (v.style.display = "none"))
  document.getElementById(`${view}-view`).style.display = "block"

  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
  document.querySelector(`[data-view="${view}"]`).classList.add("active")

  // Load data for specific views
  if (view === "attendance") loadClasses("attendanceClassSelect")
  if (view === "memorization") loadClasses("memorizationClassSelect")
  if (view === "subjects") {
    loadClasses("subjectClassSelect")
    loadSubjects()
  }
  if (view === "reports") loadClasses("reportClassSelect")
  if (view === "videos") loadClasses("videoClassSelect")
}

// Load classes
async function loadClasses(selectId) {
  try {
    if (!currentStaffId) {
      console.error("Staff ID not loaded")
      return
    }

    const response = await fetch(`/api/staff/${currentStaffId}`)
    const data = await response.json()

    if (data.success && data.data.classes) {
      const select = document.getElementById(selectId)
      select.innerHTML = '<option value="">Select Class</option>'

      const classesResponse = await fetch("/api/classes")
      const classesData = await classesResponse.json()

      if (classesData.success) {
        data.data.classes.forEach((staffClass) => {
          const classInfo = classesData.data.find(
            (c) => c.id === staffClass.class_id && c.section_id === staffClass.section_id,
          )

          if (classInfo) {
            const option = document.createElement("option")
            option.value = `${staffClass.section_id}:${staffClass.class_id}`
            option.textContent = classInfo.name
            select.appendChild(option)
          }
        })
      }
    }
  } catch (error) {
    console.error("Error loading classes:", error)
  }
}

// Load subjects
async function loadSubjects() {
  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) return

    const staffId = sessionData.data.staff_id
    const response = await fetch(`/api/staff-subjects/${staffId}?section_id=1`)
    const data = await response.json()

    if (data.success) {
      const select = document.getElementById("subjectSelect")
      select.innerHTML = '<option value="">Select Subject</option>'
      data.data.forEach((subject) => {
        const option = document.createElement("option")
        option.value = subject.subject_id
        option.textContent = subject.subject_name
        select.appendChild(option)
      })
    }
  } catch (error) {
    console.error("Error loading subjects:", error)
  }
}

// Load ayat ranges for selected class and term
async function loadAyatRanges() {
  const classValue = document.getElementById("memorizationClassSelect").value
  const term = document.getElementById("memorizationTermSelect").value

  if (!classValue || !term) {
    document.getElementById("ayatRangesSection").style.display = "none"
    document.getElementById("memorizationStudentsSection").style.display = "none"
    return
  }

  const [sectionId, classId] = classValue.split(":")

  try {
    const response = await fetch(`/api/staff-memorization-schemes?class_id=${classId}&term=${term}`)
    const data = await response.json()

    if (data.success && data.data.length > 0) {
      const tbody = document.getElementById("ayatRangesTableBody")
      tbody.innerHTML = ""

      data.data.forEach((scheme) => {
        const row = document.createElement("tr")
        row.dataset.schemeId = scheme.id
        row.innerHTML = `
          <td>Week ${scheme.week}</td>
          <td>${scheme.day}</td>
          <td>${scheme.from_surah_ayah} - ${scheme.to_surah_ayah}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="window.selectAyatRange(${scheme.id}, ${scheme.week}, '${scheme.day}', '${scheme.from_surah_ayah}', '${scheme.to_surah_ayah}')">
              Select
            </button>
          </td>
        `
        tbody.appendChild(row)
      })

      document.getElementById("ayatRangesSection").style.display = "block"
      document.getElementById("memorizationStudentsSection").style.display = "none"
    } else {
      alert("No memorization scheme found for this class and term")
      document.getElementById("ayatRangesSection").style.display = "none"
    }
  } catch (error) {
    console.error("Error loading ayat ranges:", error)
    alert("Error loading ayat ranges")
  }
}

// Handle ayat range selection and load students
window.selectAyatRange = async (schemeId, week, day, fromAyah, toAyah) => {
  const classValue = document.getElementById("memorizationClassSelect").value
  const session = document.getElementById("memorizationSessionSelect").value
  const term = document.getElementById("memorizationTermSelect").value

  if (!classValue || !session || !term) {
    alert("Please select all fields")
    return
  }

  const [sectionId, classId] = classValue.split(":");

window.selectedSchemeId = schemeId;
window.selectedWeek = week;

// Show only the selected Ayah range
document.querySelectorAll("#ayatRangesTableBody tr").forEach(row => {
  row.style.display = parseInt(row.dataset.schemeId) === schemeId ? "" : "none";
});

document.getElementById("selectedAyahDisplay").textContent = `Week ${week} - ${day}: ${fromAyah} to ${toAyah}`;
document.getElementById("selectedAyahInfo").style.display = "block";

try {
  const response = await fetch(
    `/api/staff-memorization/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&scheme_id=${schemeId}&session=${session}&term=${term}&week=${week}`
  );
  const data = await response.json();

  if (data.success) {
    const tbody = document.getElementById("memorizationTableBody");
    tbody.innerHTML = "";

    data.data.forEach(student => {
      const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
      const dailyPoints = gradePoints[student.daily_grade] || 0;
      const finalPoints = gradePoints[student.grade] || 0;
      const average = ((dailyPoints + finalPoints) / 2 * 20).toFixed(1);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.student_name}</td>
        <td>${student.student_id}</td>
        <td>
          <select class="form-select daily-grade" data-enrollment-id="${student.enrollment_id}" data-scheme-id="${student.scheme_id}">
            ${["", "A", "B", "C", "D", "E", "F"].map(g => 
              `<option value="${g}" ${student.daily_grade === g ? "selected" : ""}>${g || "-"}</option>`
            ).join("")}
          </select>
        </td>
        <td>
          <select class="form-select final-grade" data-enrollment-id="${student.enrollment_id}" data-scheme-id="${student.scheme_id}">
            ${["", "A", "B", "C", "D", "E", "F"].map(g => 
              `<option value="${g}" ${student.grade === g ? "selected" : ""}>${g || "-"}</option>`
            ).join("")}
          </select>
        </td>
        <td>${average}%</td>
        <td>
          <input type="text" class="form-control comment-input" 
                 data-enrollment-id="${student.enrollment_id}" 
                 data-scheme-id="${student.scheme_id}" 
                 value="${student.comments || ""}">
        </td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById("memorizationStudentsSection").style.display = "block";
  } else {
    alert("No students found for this selection");
  }
} catch (error) {
  console.error("Error loading memorization:", error);
  alert("Error loading memorization data");
}
}

// Save memorization
async function saveMemorization() {
  const classValue = document.getElementById("memorizationClassSelect").value
  const session = document.getElementById("memorizationSessionSelect").value
  const term = document.getElementById("memorizationTermSelect").value

  if (!classValue || !session || !term || !window.selectedSchemeId) {
    alert("Please select all fields and an ayat range")
    return
  }

  const [sectionId, classId] = classValue.split(":")
  const memorization = []

  document.querySelectorAll("#memorizationTableBody tr").forEach((row) => {
    const enrollmentId = row.querySelector("select").getAttribute("data-enrollment-id")
    const dailyGrade = row.querySelector("select").value
    const grade = row.querySelector("select[data-field='grade']").value
    const comments = row.querySelector('input[type="text"]').value

    if (dailyGrade) {
      memorization.push({
        enrollment_id: enrollmentId,
        scheme_id: window.selectedSchemeId,
        daily_grade: dailyGrade,
        grade: grade || null,
        comments: comments,
        date: new Date().toISOString().split("T")[0],
      })
    }
  })

  if (memorization.length === 0) {
    alert("Please grade at least one student")
    return
  }

  try {
    const response = await fetch(`/api/staff-memorization/${currentStaffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: sectionId,
        class_id: classId,
        term: term,
        week: window.selectedWeek,
        session: session,
        scheme_id: window.selectedSchemeId,
        memorization,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert("Memorization assessment saved successfully")
      window.selectAyatRange(window.selectedSchemeId, window.selectedWeek, "", "", "")
    } else {
      alert("Failed to save assessment: " + data.message)
    }
  } catch (error) {
    console.error("Error saving memorization:", error)
    alert("Error saving assessment: " + error.message)
  }
}

// Load attendance
async function loadAttendance() {
  const classValue = document.getElementById("attendanceClassSelect").value;
  const term = document.getElementById("attendanceTermSelect").value;

  if (!classValue || !term) {
    alert("⚠️ Please select class and term");
    return;
  }

  const [sectionId, classId] = classValue.split(":");

  try {
    const response = await fetch(
      `/api/staff-students/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&term=${term}`
    );
    const data = await response.json();

    if (!data.success || !data.data) {
      alert("⚠️ No students found for this class/term.");
      return;
    }

    const tbody = document.getElementById("attendanceTableBody");
    tbody.innerHTML = "";

    data.data.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.full_name}</td>
        <td>
          <select class="form-select" data-student-id="${student.student_id}">
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </td>
      `;
      tbody.appendChild(row);
    });

    alert("✅ Attendance list loaded successfully!");
  } catch (error) {
    console.error("Error loading attendance:", error);
    alert("⚠️ Error loading attendance.");
  }
}

// Save attendance
async function saveAttendance() {
  const classValue = document.getElementById("attendanceClassSelect").value;
  const date = document.getElementById("attendanceDate").value;
  const term = document.getElementById("attendanceTermSelect").value;
  const session = document.getElementById("attendanceSessionSelect").value;
  const week_number = document.getElementById("attendanceWeekSelect").value;

  // Validate inputs
  if (!classValue || !date || !term || !session || !week_number) {
    alert("⚠️ Please select class, date, term, session, and week");
    return;
  }

  if (!/^\d{4}\/\d{4}$/.test(session)) {
    alert(`⚠️ Invalid session format: "${session}". Must be YYYY/YYYY (e.g., 2024/2025)`);
    return;
  }

  const [section_id, class_id] = classValue.split(":");
  const attendance = [];

  document.querySelectorAll("#attendanceTableBody select").forEach((select) => {
    attendance.push({
      student_id: select.getAttribute("data-student-id"),
      attendance_status: select.value,
    });
  });

  if (attendance.length === 0) {
    alert("⚠️ No attendance records to save.");
    return;
  }

  try {
    const response = await fetch(`/api/staff-attendance/${currentStaffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id,
        class_id,
        term,
        session,
        date,
        week_number,
        attendance,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Attendance saved successfully!");
    } else {
      console.error("Save error:", data);
      alert("❌ Failed to save attendance: " + data.message);
    }
  } catch (error) {
    console.error("Error saving attendance:", error);
    alert("⚠️ Network error while saving attendance.");
  }
}

// Auto-fill today's date & day
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("attendanceDate");
  const daySelect = document.getElementById("attendanceDay");

  if (dateInput && daySelect) {
    const today = new Date();

    // Format date as YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    // Set day name
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    daySelect.value = days[today.getDay()];

    // Update day when user changes date
    dateInput.addEventListener("change", () => {
      const date = new Date(dateInput.value);
      if (!isNaN(date)) {
        daySelect.value = days[date.getDay()];
      }
    });
  }
});

// Load subject scores
async function loadSubjectScores() {
  const classValue = document.getElementById("subjectClassSelect").value
  const subjectId = document.getElementById("subjectSelect").value
  const term = document.getElementById("subjectTermSelect").value

  if (!classValue || !subjectId || !term) {
    alert("Please select all fields")
    return
  }

  const [sectionId, classId] = classValue.split(":")

  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) return

    const staffId = sessionData.data.staff_id
    const response = await fetch(
      `/api/staff-assessments/${staffId}?section_id=${sectionId}&class_id=${classId}&subject_id=${subjectId}`,
    )
    const data = await response.json()

    if (data.success) {
      const tbody = document.getElementById("subjectScoresTableBody")
      tbody.innerHTML = ""

      data.data.forEach((student) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                    <td>${student.student_name}</td>
                    <td><input type="number" class="form-control" min="0" max="100" value="${student.ca1_score || ""}" data-enrollment-id="${student.enrollment_id}" data-field="ca1"></td>
                    <td><input type="number" class="form-control" min="0" max="100" value="${student.ca2_score || ""}" data-enrollment-id="${student.enrollment_id}" data-field="ca2"></td>
                    <td><input type="number" class="form-control" min="0" max="100" value="${student.ca3_score || ""}" data-enrollment-id="${student.enrollment_id}" data-field="ca3"></td>
                    <td><input type="number" class="form-control" min="0" max="100" value="${student.exam_score || ""}" data-enrollment-id="${student.enrollment_id}" data-field="exam"></td>
                    <td><input type="text" class="form-control" value="${student.comments || ""}" data-enrollment-id="${student.enrollment_id}" data-field="comments"></td>
                `
        tbody.appendChild(row)
      })
    }
  } catch (error) {
    console.error("Error loading subject scores:", error)
  }
}

// Save subject scores
async function saveSubjectScores() {
  const classValue = document.getElementById("subjectClassSelect").value
  const subjectId = document.getElementById("subjectSelect").value
  const term = document.getElementById("subjectTermSelect").value

  if (!classValue || !subjectId || !term) {
    alert("Please select all fields")
    return
  }

  const [sectionId, classId] = classValue.split(":")
  const assessments = []

  const rows = document.querySelectorAll("#subjectScoresTableBody tr")
  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input")
    const enrollmentId = inputs[0].getAttribute("data-enrollment-id")

    assessments.push({
      enrollment_id: enrollmentId,
      ca1_score: inputs[0].value || null,
      ca2_score: inputs[1].value || null,
      ca3_score: inputs[2].value || null,
      exam_score: inputs[3].value || null,
      comments: inputs[4].value,
      date: new Date().toISOString().split("T")[0],
    })
  })

  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) return

    const staffId = sessionData.data.staff_id
    const response = await fetch(`/api/staff-assessments/${staffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: sectionId,
        class_id: classId,
        subject_id: subjectId,
        term: term,
        assessments,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert("Subject scores saved successfully")
    } else {
      alert("Failed to save scores: " + data.message)
    }
  } catch (error) {
    console.error("Error saving subject scores:", error)
    alert("Error saving scores")
  }
}

// Load report students
async function loadReportStudents() {
  const classValue = document.getElementById("reportClassSelect").value
  const session = document.getElementById("reportSessionSelect").value
  const term = document.getElementById("reportTermSelect").value

  if (!classValue || !session || !term) {
    alert("Please select all fields")
    return
  }

  const [sectionId, classId] = classValue.split(":")

  try {
    const sessionResponse = await fetch("/api/staff-session")
    const sessionData = await sessionResponse.json()

    if (!sessionData.success) return

    const staffId = sessionData.data.staff_id
    const response = await fetch(
      `/api/staff-students/${staffId}?section_id=${sectionId}&class_id=${classId}&session=${session}&term=${term}`,
    )
    const data = await response.json()

    if (data.success) {
      const tbody = document.getElementById("reportStudentsTableBody")
      tbody.innerHTML = ""

      data.data.forEach((student) => {
        const row = document.createElement("tr")

        const isFormMaster = currentStaffRole === "Form Teacher" || currentStaffRole === "Form Master"

        row.innerHTML = `
          <td>${student.full_name || "N/A"}</td>
          <td>${student.student_id || "N/A"}</td>
          <td>
            <button class="btn btn-sm btn-primary me-2" onclick="window.downloadSubjectReport('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">
              <i class="fas fa-download"></i> Subject Report
            </button>
            <button class="btn btn-sm btn-success me-2" onclick="window.downloadTahfizReport('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">
              <i class="fas fa-download"></i> Tahfiz Report
            </button>
            ${
              isFormMaster
                ? `
            <button class="btn btn-sm btn-info" onclick="window.downloadCompleteReport('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">
              <i class="fas fa-download"></i> Complete Report
            </button>
            `
                : ""
            }
          </td>
        `
        tbody.appendChild(row)
      })
    } else {
      alert("Failed to load students: " + data.message)
    }
  } catch (error) {
    console.error("Error loading students:", error)
    alert("Error loading students: " + error.message)
  }
}

// Download subject report
window.downloadSubjectReport = async (studentId, session, term, sectionId, classId) => {
  window.open(
    `/api/student-report?student_id=${studentId}&session=${session}&term=${term}&type=subject&section_id=${sectionId}&class_id=${classId}`,
    "_blank",
  )
}

// Download tahfiz report
window.downloadTahfizReport = async (studentId, session, term, sectionId, classId) => {
  window.open(
    `/api/tahfiz-report?student_id=${studentId}&session=${session}&term=${term}&type=tahfiz&section_id=${sectionId}&class_id=${classId}`,
    "_blank",
  )
}

// Download complete report
window.downloadCompleteReport = async (studentId, session, term, sectionId, classId) => {
  window.open(
    `/api/student-report?student_id=${studentId}&session=${session}&term=${term}&type=complete&section_id=${sectionId}&class_id=${classId}`,
    "_blank",
  )
}

// Upload video
async function uploadVideo(e) {
  e.preventDefault()

  const classValue = document.getElementById("videoClassSelect").value

  if (!classValue) {
    alert("Please select a class")
    return
  }

  const [sectionId, classId] = classValue.split(":")

  const formData = new FormData()
  formData.append("title", document.getElementById("videoTitle").value)
  formData.append("description", document.getElementById("videoDescription").value)
  formData.append("week", document.getElementById("videoWeek").value)
  formData.append("class_id", classId)
  formData.append("section_id", sectionId)
  formData.append("video", document.getElementById("videoFile").files[0])

  try {
    const response = await fetch("/api/upload-memorization-video", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      alert("Video uploaded successfully")
      document.getElementById("videoUploadForm").reset()
    } else {
      alert("Failed to upload video: " + data.message)
    }
  } catch (error) {
    console.error("Error uploading video:", error)
    alert("Error uploading video: " + error.message)
  }
}
-- =========================
-- Daily Memorization
-- =========================
CREATE TABLE Daily_Memorization_Scheme (
    id INT AUTO_INCREMENT PRIMARY KEY,
    week INT NOT NULL,
    day VARCHAR(20) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    from_surah_ayah VARCHAR(50) NOT NULL,
    to_surah_ayah VARCHAR(50) NOT NULL,
    term INT NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);

-- =========================
-- Student Memorization Assessments
-- =========================
CREATE TABLE Student_Memorization_Assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    scheme_id INT NOT NULL,
    daily_grade CHAR(1) DEFAULT NULL CHECK (daily_grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
    exam_grade INT DEFAULT NULL CHECK (exam_grade >= 0 AND exam_grade <= 100),
    comments TEXT DEFAULT NULL,
    date DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (enrollment_id) REFERENCES Student_Enrollments(enrollment_id),
    FOREIGN KEY (scheme_id) REFERENCES Daily_Memorization_Scheme(id),
    UNIQUE KEY unique_assessment (enrollment_id, scheme_id, date)
);

this is sample of the insert i did i have othere:
INSERT INTO Daily_Memorization_Scheme (week, day, from_surah_ayah, to_surah_ayah, term, class_id) VALUES
-- Term 1: Weeks 1-7 (Right table)
(1, 'السبت', 'سورة الناس، الآية: (1)', 'سورة الإخلاص، الآية: (4)', 1, 1),
(1, 'الأحد', 'سورة المسد، الآية: (1)', 'سورة الكافرون، الآية: (6)', 1, 1),
(2, 'السبت', 'سورة الكوثر، الآية: (1)', 'سورة قريش، الآية: (4)', 1, 1),
(2, 'الأحد', 'سورة الماعون، الآية: (1)', 'سورة قريش، الآية: (4)', 1, 1),
(3, 'السبت', 'سورة الفيل، الآية: (1)', 'سورة الهمزة، الآية: (9)', 1, 1),
(3, 'الأحد', 'سورة العصر، الآية: (1)', 'سورة التكاثر، الآية: (8)', 1, 1),
(4, 'السبت', 'سورة القارعة، الآية: (1)', 'سورة القارعة، الآية: (11)', 1, 1),
(4, 'الأحد', 'سورة العاديات، الآية: (1)', 'سورة العاديات، الآية: (11)', 1, 1),
(5, 'السبت', 'سورة الزلزلة، الآية: (1)', 'سورة الزلزلة، الآية: (8)', 1, 1),
(5, 'الأحد', 'سورة البينة، الآية: (1)', 'سورة البينة، الآية: (8)', 1, 1),
(6, 'السبت', 'سورة القدر، الآية: (1)', 'سورة القدر، الآية: (5)', 1, 1),
(6, 'الأحد', 'سورة العلق، الآية: (1)', 'سورة العلق، الآية: (19)', 1, 1),
(7, 'السبت', 'سورة التين، الآية: (1)', 'سورة الشرح، الآية: (8)', 1, 1),
(7, 'الأحد', 'سورة الضحى، الآية: (1)', 'سورة الضحى، الآية: (11)', 1, 1),
-- Term 1: Weeks 8-14 (Left table)
(8, 'السبت', 'سورة الليل، الآية: (1)', 'سورة الليل، الآية: (21)', 1, 1),
(8, 'الأحد', 'سورة الشمس، الآية: (1)', 'سورة الشمس، الآية: (15)', 1, 1),
(9, 'السبت', 'سورة البلد، الآية: (1)', 'سورة البلد، الآية: (20)', 1, 1),
(9, 'الأحد', 'سورة الفجر، الآية: (1)', 'سورة الفجر، الآية: (18)', 1, 1),
(10, 'السبت', 'سورة الفجر، الآية: (19)', 'سورة الفجر، الآية: (30)', 1, 1),
(10, 'الأحد', 'سورة الغاشية، الآية: (1)', 'سورة الغاشية، الآية: (16)', 1, 1),
(11, 'السبت', 'سورة الغاشية، الآية: (17)', 'سورة الغاشية، الآية: (26)', 1, 1),
(11, 'الأحد', 'سورة الأعلى، الآية: (1)', 'سورة الأعلى، الآية: (19)', 1, 1),
(12, 'السبت', 'سورة الطارق، الآية: (1)', 'سورة الطارق، الآية: (17)', 1, 1),
(12, 'الأحد', 'سورة البروج، الآية: (1)', 'سورة البروج، الآية: (10)', 1, 1),
(13, 'السبت', 'سورة البروج، الآية: (11)', 'سورة البروج، الآية: (22)', 1, 1),
(13, 'الأحد', 'سورة الإنشقاق، الآية: (1)', 'سورة الإنشقاق، الآية: (12)', 1, 1),
(14, 'السبت', 'سورة الإنشقاق، الآية: (13)', 'سورة الإنشقاق، الآية: (25)', 1, 1),

-- Term 2: Weeks 1-7 (Right table)
(1, 'السبت', 'سورة المطففين، الآية: (1)', 'سورة المطففين، الآية: (13)', 2, 1),
(1, 'الأحد', 'سورة المطففين، الآية: (14)', 'سورة المطففين، الآية: (28)', 2, 1),
(2, 'السبت', 'سورة المطففين، الآية: (29)', 'سورة المطففين، الآية: (36)', 2, 1),
(2, 'الأحد', 'سورة الانفطار، الآية: (1)', 'سورة الانفطار، الآية: (19)', 2, 1),
(3, 'السبت', 'سورة التكوير، الآية: (1)', 'سورة التكوير، الآية: (14)', 2, 1),
(3, 'الأحد', 'سورة التكوير، الآية: (15)', 'سورة التكوير، الآية: (29)', 2, 1),
(4, 'السبت', 'سورة عبس، الآية: (1)', 'سورة عبس، الآية: (23)', 2, 1),
(4, 'الأحد', 'سورة عبس، الآية: (24)', 'سورة عبس، الآية: (42)', 2, 1),
(5, 'السبت', 'سورة النازعات، الآية: (1)', 'سورة النازعات، الآية: (15)', 2, 1),
(5, 'الأحد', 'سورة النازعات، الآية: (16)', 'سورة النازعات، الآية: (33)', 2, 1),
(6, 'السبت', 'سورة النازعات، الآية: (34)', 'سورة النازعات، الآية: (46)', 2, 1),
(6, 'الأحد', 'سورة النبإ، الآية: (1)', 'سورة النبإ، الآية: (17)', 2, 1),
(7, 'السبت', 'سورة النبإ، الآية: (18)', 'سورة النبإ، الآية: (30)', 2, 1),
(7, 'الأحد', 'سورة النبإ، الآية: (31)', 'سورة النبإ، الآية: (40)', 2, 1),
-- Term 2: Weeks 8-14 (Left table)
(8, 'السبت', 'سورة المرسلات، الآية: (1)', 'سورة المرسلات، الآية: (19)', 2, 1),
(8, 'الأحد', 'سورة المرسلات، الآية: (20)', 'سورة المرسلات، الآية: (34)', 2, 1),
(9, 'السبت', 'سورة المرسلات، الآية: (35)', 'سورة المرسلات، الآية: (50)', 2, 1),
(9, 'الأحد', 'سورة الإنسان، الآية: (1)', 'سورة الإنسان، الآية: (9)', 2, 1),
(10, 'السبت', 'سورة الإنسان، الآية: (10)', 'سورة الإنسان، الآية: (22)', 2, 1),
(10, 'الأحد', 'سورة الإنسان، الآية: (23)', 'سورة الإنسان، الآية: (31)', 2, 1),
(11, 'السبت', 'سورة القيامة، الآية: (1)', 'سورة القيامة، الآية: (19)', 2, 1),
(11, 'الأحد', 'سورة القيامة، الآية: (20)', 'سورة القيامة، الآية: (40)', 2, 1),
(12, 'السبت', 'سورة المدثر، الآية: (1)', 'سورة المدثر، الآية: (25)', 2, 1),
(12, 'الأحد', 'سورة المدثر، الآية: (26)', 'سورة المدثر، الآية: (37)', 2, 1),
(13, 'السبت', 'سورة المدثر، الآية: (38)', 'سورة المدثر، الآية: (56)', 2, 1),
(13, 'الأحد', 'سورة المزمل، الآية: (1)', 'سورة المزمل، الآية: (11)', 2, 1),
(14, 'السبت', 'سورة المزمل، الآية: (12)', 'سورة المزمل، الآية: (19)', 2, 1),
(14, 'الأحد', 'سورة المزمل، الآية: (20)', 'سورة المزمل، الآية: (20)', 2, 1),

-- Term 3: Weeks 1-7 (Right table)
(1, 'السبت', 'سورة الجن، الآية: (1)', 'سورة الجن، الآية: (10)', 3, 1),
(1, 'الأحد', 'سورة الجن، الآية: (11)', 'سورة الجن، الآية: (20)', 3, 1),
(2, 'السبت', 'سورة الجن، الآية: (21)', 'سورة الجن، الآية: (28)', 3, 1),
(2, 'الأحد', 'سورة نوح، الآية: (1)', 'سورة نوح، الآية: (14)', 3, 1),
(3, 'السبت', 'سورة نوح، الآية: (15)', 'سورة نوح، الآية: (28)', 3, 1),
(3, 'الأحد', 'سورة المعارج، الآية: (1)', 'سورة المعارج، الآية: (18)', 3, 1),
(4, 'السبت', 'سورة المعارج، الآية: (19)', 'سورة المعارج، الآية: (35)', 3, 1),
(4, 'الأحد', 'سورة المعارج، الآية: (36)', 'سورة المعارج، الآية: (44)', 3, 1),
(5, 'السبت', 'سورة الحاقة، الآية: (1)', 'سورة الحاقة، الآية: (24)', 3, 1),
(5, 'الأحد', 'سورة الحاقة، الآية: (25)', 'سورة الحاقة، الآية: (52)', 3, 1),
(6, 'السبت', 'سورة القلم، الآية: (1)', 'سورة القلم، الآية: (25)', 3, 1),
(6, 'الأحد', 'سورة القلم، الآية: (26)', 'سورة القلم، الآية: (42)', 3, 1),
(7, 'السبت', 'سورة القلم، الآية: (43)', 'سورة القلم، الآية: (52)', 3, 1),
(7, 'الأحد', 'سورة الملك، الآية: (1)', 'سورة الملك، الآية: (9)', 3, 1),
-- Term 3: Weeks 8-14 (Left table)
(8, 'السبت', 'سورة الملك، الآية: (10)', 'سورة الإنسان، الآية: (21)', 3, 1),
(8, 'الأحد', 'سورة الملك، الآية: (22)', 'سورة الملك، الآية: (30)', 3, 1),
(9, 'السبت', 'سورة التحريم، الآية: (1)', 'سورة التحريم، الآية: (7)', 3, 1),
(9, 'الأحد', 'سورة التحريم، الآية: (8)', 'سورة التحريم، الآية: (12)', 3, 1),
(10, 'السبت', 'سورة الطلاق، الآية: (1)', 'سورة الطلاق، الآية: (3)', 3, 1),
(10, 'الأحد', 'سورة الطلاق، الآية: (4)', 'سورة الطلاق، الآية: (7)', 3, 1),
(11, 'السبت', 'سورة الطلاق، الآية: (8)', 'سورة الطلاق، الآية: (12)', 3, 1),
(11, 'الأحد', 'سورة التغابن، الآية: (1)', 'سورة التغابن، الآية: (9)', 3, 1),
(12, 'السبت', 'سورة التغابن، الآية: (10)', 'سورة التغابن، الآية: (18)', 3, 1),
(12, 'الأحد', 'سورة المنافقون، الآية: (1)', 'سورة المنافقون، الآية: (6)', 3, 1),
(13, 'السبت', 'سورة المنافقون، الآية: (7)', 'سورة المنافقون، الآية: (11)', 3, 1),
(13, 'الأحد', 'سورة الجمعة، الآية: (1)', 'سورة الجمعة، الآية: (7)', 3, 1),
(14, 'السبت', 'سورة الجمعة، الآية: (8)', 'سورة الجمعة، الآية: (11)', 3, 1);



<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #4285f4;
            --secondary-color: #34a853;
            --accent-color: #fbbc05;
            --background-color: #f5f7fa;
            --text-color: #202124;
        }

        body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            min-height: 100vh;
            margin: 0;
        }

        .sidebar {
            width: 260px;
            background-color: #202124;
            color: #fff;
            min-height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            padding-top: 1rem;
            transition: transform 0.3s ease-in-out;
        }

        .sidebar.collapsed {
            transform: translateX(-260px);
        }

        .sidebar .nav-link {
            color: #bdc1c6;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            display: flex;
            align-items: center;
            transition: background-color 0.2s, color 0.2s;
        }

        .sidebar .nav-link:hover,
        .sidebar .nav-link.active {
            background-color: var(--primary-color);
            color: #fff;
        }

        .sidebar .nav-link i {
            margin-right: 0.75rem;
            width: 1.25rem;
            text-align: center;
        }

        .main-content {
            margin-left: 260px;
            padding: 1.5rem;
            transition: margin-left 0.3s ease-in-out;
        }

        .dashboard-card {
            background: #fff;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }

        .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
        }

        .card-gradient-1 {
            background-image: linear-gradient(135deg, #4285f4, #669df6);
        }

        .card-gradient-2 {
            background-image: linear-gradient(135deg, #34a853, #57b76f);
        }

        .card-gradient-3 {
            background-image: linear-gradient(135deg, #fbbc05, #fbdc59);
        }

        .card-gradient-4 {
            background-image: linear-gradient(135deg, #ea4335, #f28b82);
        }

        #sidebarToggleMobile {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1101;
            border-radius: 0.5rem;
            padding: 0.5rem 0.75rem;
            background-color: var(--primary-color);
            color: #fff;
            border: none;
            display: none;
        }

        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-260px);
            }
            .sidebar.open {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
                padding: 1rem;
            }
            #sidebarToggleMobile {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="p-4 border-b border-gray-700">
            <div class="flex items-center mb-3">
                <img id="staffProfilePicture" src="/uploads/staff/default.jpg" alt="Profile" class="w-16 h-16 rounded-full object-cover border-2 border-gray-600">
                <div class="ml-3">
                    <h3 class="text-lg font-bold text-white" id="staffNameDisplay">Loading...</h3>
                    <p class="text-xs text-gray-400">Staff ID: <span id="staffIdDisplay">N/A</span></p>
                </div>
            </div>
            <p class="text-sm text-gray-400">Role: <span id="staffRoleDisplay">N/A</span></p>
        </div>
        <ul class="nav flex-column mt-4" id="sidebarNav">
            <li class="nav-item">
                <a href="#" class="nav-link active" data-view="dashboard"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link" data-view="attendance"><i class="fas fa-clipboard-check"></i> Attendance</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link" data-view="memorization"><i class="fas fa-book-quran"></i> Tahfiz Assessment</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link" data-view="subjects"><i class="fas fa-chalkboard-teacher"></i> Subject Scores</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link" data-view="reports"><i class="fas fa-file-alt"></i> Reports</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link" data-view="videos"><i class="fas fa-video"></i> Upload Videos</a>
            </li>
        </ul>
        <div class="mt-auto p-4">
            <a href="#" class="d-flex align-items-center text-white text-decoration-none" id="logoutBtn">
                <i class="fas fa-sign-out-alt me-2"></i>
                <strong>Logout</strong>
            </a>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" id="mainContent">
        <button id="sidebarToggleMobile">
            <i class="fas fa-bars"></i>
        </button>

        <!-- Dashboard View -->
        <div id="dashboard-view">
            <h2 class="text-2xl font-semibold mb-4">Dashboard Overview</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="dashboard-card card-gradient-1 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="text-sm font-medium opacity-90">My Classes</h5>
                            <p id="totalClassesCount" class="text-4xl font-bold mt-1">0</p>
                        </div>
                        <div class="p-3 rounded-full bg-white bg-opacity-20">
                            <i class="fas fa-chalkboard text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card card-gradient-2 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="text-sm font-medium opacity-90">My Students</h5>
                            <p id="totalStudentsCount" class="text-4xl font-bold mt-1">0</p>
                        </div>
                        <div class="p-3 rounded-full bg-white bg-opacity-20">
                            <i class="fas fa-user-graduate text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card card-gradient-3 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="text-sm font-medium opacity-90">Attendance Today</h5>
                            <p id="attendanceTodayCount" class="text-4xl font-bold mt-1">0%</p>
                        </div>
                        <div class="p-3 rounded-full bg-white bg-opacity-20">
                            <i class="fas fa-clipboard-check text-2xl"></i>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card card-gradient-4 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h5 class="text-sm font-medium opacity-90">Average Grade</h5>
                            <p id="averageGradeCount" class="text-4xl font-bold mt-1">0</p>
                        </div>
                        <div class="p-3 rounded-full bg-white bg-opacity-20">
                            <i class="fas fa-chart-line text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <!-- Attendance View -->
<div id="attendance-view" style="display: none;">
  <h2 class="text-2xl font-semibold mb-4">Attendance Management</h2>

  <div class="bg-white p-4 rounded-lg shadow">
    <!-- Top Controls -->
    <div class="mb-3 flex flex-wrap gap-2">
      <!-- Class -->
      <select class="form-select w-full sm:w-auto" id="attendanceClassSelect" required>
        <option value="">Select Class</option>
      </select>

      <!-- Session -->
      <select class="form-select w-full sm:w-auto" id="attendanceSessionSelect" required>
        <option value="">Select Session</option>
      </select>

      <!-- Term -->
      <select class="form-select w-full sm:w-auto" id="attendanceTermSelect" required>
        <option value="">Select Term</option>
        <option value="1">1st Term</option>
        <option value="2">2nd Term</option>
        <option value="3">3rd Term</option>
      </select>

      <!-- Week Number Dropdown -->
      <select class="form-select w-full sm:w-auto" id="attendanceWeekSelect" required>
        <option value="">Select Week</option>
        <option value="1">Week 1</option>
        <option value="2">Week 2</option>
        <option value="3">Week 3</option>
        <option value="4">Week 4</option>
        <option value="5">Week 5</option>
        <option value="6">Week 6</option>
        <option value="7">Week 7</option>
        <option value="8">Week 8</option>
        <option value="9">Week 9</option>
        <option value="10">Week 10</option>
        <option value="11">Week 11</option>
        <option value="12">Week 12</option>
        <option value="13">Week 13</option>
        <option value="14">Week 14</option>
        <option value="15">Week 15</option>
      </select>

      <!-- Date Picker -->
      <input type="date" class="form-control w-full sm:w-auto" id="attendanceDate" required>

      <!-- Day -->
      <select class="form-select w-full sm:w-auto" id="attendanceDay" required>
        <option value="">Select Day</option>
        <option value="Sunday">Sunday</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
      </select>

      <!-- Load Attendance Button -->
      <button class="btn btn-primary" id="loadAttendanceBtn">Load Attendance</button>
    </div>

    <!-- Attendance Table -->
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="attendanceTableBody"></tbody>
      </table>
    </div>

    <!-- Save Button -->
    <button class="btn btn-success mt-3" id="saveAttendanceBtn">Save Attendance</button>
  </div>
</div>

        <!-- Memorization View -->
        <div id="memorization-view" style="display: none;">
            <h2 class="text-2xl font-semibold mb-4">Tahfiz Assessment</h2>
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="mb-3 flex flex-wrap gap-2">
                    <select class="form-select w-full sm:w-auto" id="memorizationClassSelect">
                        <option value="">Select Class</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="memorizationSessionSelect">
                        <option value="">Select Session</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="memorizationTermSelect">
                        <option value="">Select Term</option>
                        <option value="1">1st Term</option>
                        <option value="2">2nd Term</option>
                        <option value="3">3rd Term</option>
                    </select>
                </div>
                
                <div id="ayatRangesSection" style="display: none;" class="mb-4">
                    <h5 class="mb-3">Select Week and Ayat Range:</h5>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Week</th>
                                    <th>Day</th>
                                    <th>Ayat Range</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="ayatRangesTableBody"></tbody>
                        </table>
                    </div>
                </div>

                <div id="selectedAyahInfo" class="alert alert-info mb-3" style="display: none;">
                    <strong>Selected:</strong> <span id="selectedAyahDisplay"></span>
                </div>
                
                <div id="memorizationStudentsSection" style="display: none;">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Daily Grade (A-F)</th>
                                    <th>Exam Grade (A-F) - Once per Term</th>
                                    <th>Comments</th>
                                </tr>
                            </thead>
                            <tbody id="memorizationTableBody"></tbody>
                        </table>
                    </div>
                    <button class="btn btn-success mt-3" id="saveMemorizationBtn">Save Assessment</button>
                </div>
            </div>
        </div>

        <!-- Subjects View -->
        <div id="subjects-view" style="display: none;">
            <h2 class="text-2xl font-semibold mb-4">Subject Scores</h2>
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="mb-3 flex flex-wrap gap-2">
                    <select class="form-select w-full sm:w-auto" id="subjectClassSelect">
                        <option value="">Select Class</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="subjectSelect">
                        <option value="">Select Subject</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="subjectTermSelect">
                        <option value="1">1st Term</option>
                        <option value="2">2nd Term</option>
                        <option value="3">3rd Term</option>
                    </select>
                    <button class="btn btn-primary" id="loadSubjectScoresBtn">Load Students</button>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>CA1 (0-100)</th>
                                <th>CA2 (0-100)</th>
                                <th>CA3 (0-100)</th>
                                <th>Exam (0-100)</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody id="subjectScoresTableBody"></tbody>
                    </table>
                </div>
                <button class="btn btn-success mt-3" id="saveSubjectScoresBtn">Save Scores</button>
            </div>
        </div>

        <!-- Reports View -->
        <div id="reports-view" style="display: none;">
            <h2 class="text-2xl font-semibold mb-4">Reports</h2>
            <div class="bg-white p-4 rounded-lg shadow mb-4">
                <h5 class="mb-3">Generate Student Reports</h5>
                <div class="mb-3 flex flex-wrap gap-2">
                    <select class="form-select w-full sm:w-auto" id="reportClassSelect">
                        <option value="">Select Class</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="reportSessionSelect">
                        <option value="">Select Session</option>
                    </select>
                    <select class="form-select w-full sm:w-auto" id="reportTermSelect">
                        <option value="">Select Term</option>
                        <option value="1">1st Term</option>
                        <option value="2">2nd Term</option>
                        <option value="3">3rd Term</option>
                    </select>
                    <button class="btn btn-primary" id="loadReportStudentsBtn">Load Students</button>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Student ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reportStudentsTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Videos View -->
        <div id="videos-view" style="display: none;">
            <h2 class="text-2xl font-semibold mb-4">Upload Memorization Videos</h2>
            <div class="bg-white p-4 rounded-lg shadow">
                <form id="videoUploadForm">
                    <div class="mb-3">
                        <label for="videoClassSelect" class="form-label">Class</label>
                        <select class="form-select" id="videoClassSelect" required>
                            <option value="">Select Class</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="videoTitle" class="form-label">Video Title</label>
                        <input type="text" class="form-control" id="videoTitle" required>
                    </div>
                    <div class="mb-3">
                        <label for="videoDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="videoDescription" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="videoWeek" class="form-label">Week</label>
                        <input type="number" class="form-control" id="videoWeek" min="1" max="14" required>
                    </div>
                    <div class="mb-3">
                        <label for="videoFile" class="form-label">Video File</label>
                        <input type="file" class="form-control" id="videoFile" accept="video/*" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Upload Video</button>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./js/staff_dashboard.js"></script>
</body>
</html>