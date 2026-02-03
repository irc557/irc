let currentStaffId = null
let currentStaffRole = null
let currentStaffInfo = null
let currentScheme = null  


// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  await loadStaffInfo()
  await loadDashboardStats()
  await loadSessions()
  await loadClasses("memorizationClassSelect")
  await loadClasses("dailyClassSelect")
  await loadClasses("overallClassSelect")
  setupEventListeners()
})

// Sidebar navigation 
document.querySelectorAll('#sidebarNav .nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.getAttribute('data-view');

    // hide all views
    document.querySelectorAll('#mainContent > div[id$="-view"]').forEach(v => v.style.display = 'none');

    // show selected view
    document.getElementById(target + '-view').style.display = 'block';

    // update active link
    document.querySelectorAll('#sidebarNav .nav-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');

    // when Tahfiz view opens → show Grading by default
    if (target === 'memorization') {
      switchTahfizTab('grading');
    }
  });
});

// Tahfiz tab switching
const tahfizTabs = {
  grading: document.getElementById('grading-section'),
  daily:   document.getElementById('dailyResult-section'),
  overall: document.getElementById('overallResult-section')
};

function switchTahfizTab(tab) {
  Object.values(tahfizTabs).forEach(t => t.style.display = 'none');
  tahfizTabs[tab].style.display = 'block';

  // update button active state
  document.querySelectorAll('#memorization-view .btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab + 'Btn').classList.add('active');

  if (tab === 'grading') loadClasses("memorizationClassSelect");
  if (tab === 'daily') loadClasses("dailyClassSelect");
  if (tab === 'overall') loadClasses("overallClassSelect");
}

document.getElementById('gradingBtn').addEventListener('click', () => switchTahfizTab('grading'));
document.getElementById('dailyResultBtn').addEventListener('click', () => switchTahfizTab('daily'));
document.getElementById('overallResultBtn').addEventListener('click', () => switchTahfizTab('overall'));

// Default: show dashboard on page load
document.getElementById('dashboard-view').style.display = 'block';

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
        document.getElementById("dailySessionSelect"),
        document.getElementById("overallSessionSelect")
      ]

      sessionSelects.forEach((select) => {
        if (select) {
          select.innerHTML = '<option value="">Select Session</option>'
          data.data.forEach((session) => {
            const option = document.createElement("option")
            option.value = session.session_year
            option.textContent = session.session_year
            if (session.is_current) option.selected = true
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

  // === MEMORIZATION: RESET ON CHANGE ===
  const resetMemorization = () => {
    ["memorizationTermSelect", "memorizationWeekSelect", "memorizationDaySelect"].forEach(id => {
      document.getElementById(id).value = ""
    })
    document.getElementById("memorizationDaySelect").style.display = "none"
    document.getElementById("ayatRangeSection").style.display = "none"
    document.getElementById("selectedAyahInfo").style.display = "none"
    document.getElementById("memorizationStudentsSection").style.display = "none"
    currentScheme = null
  }

  document.getElementById("memorizationClassSelect")?.addEventListener("change", resetMemorization)
  document.getElementById("memorizationSessionSelect")?.addEventListener("change", resetMemorization)

  // Term → reset week/day
  document.getElementById("memorizationTermSelect")?.addEventListener("change", () => {
    document.getElementById("memorizationWeekSelect").value = ""
    document.getElementById("memorizationDaySelect").value = ""
    document.getElementById("memorizationDaySelect").style.display = "none"
    document.getElementById("ayatRangeSection").style.display = "none"
    document.getElementById("memorizationStudentsSection").style.display = "none"
  })

  // Week → show Day selector
  document.getElementById("memorizationWeekSelect")?.addEventListener("change", () => {
    const week = document.getElementById("memorizationWeekSelect").value
    const daySelect = document.getElementById("memorizationDaySelect")
    if (week) {
      daySelect.style.display = "block"
      daySelect.value = ""
      document.getElementById("ayatRangeSection").style.display = "none"
    } else {
      daySelect.style.display = "none"
    }
  })

  // Day → load ayat range
  document.getElementById("memorizationDaySelect")?.addEventListener("change", loadAyatRangeForDay)

  // Select button
  document.getElementById("selectAyatBtn")?.addEventListener("click", selectCurrentAyatRange)

  // Save button
  document.getElementById("saveMemorizationBtn")?.addEventListener("click", saveMemorization)

  // Other buttons
  document.getElementById("loadAttendanceBtn")?.addEventListener("click", loadAttendance)
  document.getElementById("loadSubjectScoresBtn")?.addEventListener("click", loadSubjectScores)
  document.getElementById("loadReportStudentsBtn")?.addEventListener("click", loadReportStudents)
  document.getElementById("saveAttendanceBtn")?.addEventListener("click", saveAttendance)
  document.getElementById("saveSubjectScoresBtn")?.addEventListener("click", saveSubjectScores)
  document.getElementById("videoUploadForm")?.addEventListener("submit", uploadVideo)
  document.getElementById("loadDailyStudentsBtn")?.addEventListener("click", loadDailyStudents)
  document.getElementById("loadOverallStudentsBtn")?.addEventListener("click", loadOverallStudents)
  document.getElementById("exportOverallPdfBtn")?.addEventListener("click", exportOverallPdf)
  document.getElementById("exportOverallExcelBtn")?.addEventListener("click", exportOverallExcel)
}

// Switch view
function switchView(view) {
  document.querySelectorAll('[id$="-view"]').forEach((v) => (v.style.display = "none"))
  document.getElementById(`${view}-view`).style.display = "block"

  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
  document.querySelector(`[data-view="${view}"]`).classList.add("active")

  if (view === "attendance") loadClasses("attendanceClassSelect")
  if (view === "memorization") loadClasses("memorizationClassSelect")
  if (view === "subjects") { loadClasses("subjectClassSelect"); loadSubjects() }
  if (view === "reports") loadClasses("reportClassSelect")
  if (view === "videos") loadClasses("videoClassSelect")
}

// Load classes
async function loadClasses(selectId) {
  try {
    if (!currentStaffId) return console.error("Staff ID not loaded")

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
            (c) => c.id === staffClass.class_id && c.section_id === staffClass.section_id
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

// Load Ayat range for selected Week + Day
async function loadAyatRangeForDay() {
  const classVal = document.getElementById("memorizationClassSelect").value
  const term = document.getElementById("memorizationTermSelect").value
  const week = document.getElementById("memorizationWeekSelect").value
  const day = document.getElementById("memorizationDaySelect").value
  const session = document.getElementById("memorizationSessionSelect").value

  if (!classVal || !term || !week || !day || !session) {
    document.getElementById("ayatRangeSection").style.display = "none"
    return
  }

  const [sectionId, classId] = classVal.split(":")
  try {
    const resp = await fetch(
      `/api/staff-memorization-schemes?class_id=${classId}&term=${term}&week=${week}&day=${encodeURIComponent(day)}&session=${session}`
    )
    const data = await resp.json()

    if (data.success && data.data.length === 1) {
      currentScheme = data.data[0]
      const txt = `Week ${currentScheme.week} – ${currentScheme.day}: ${currentScheme.from_surah_ayah} → ${currentScheme.to_surah_ayah}`
      document.getElementById("ayatRangeDisplay").textContent = txt
      document.getElementById("ayatRangeSection").style.display = "block"
    } else {
      alert("No ayat range found for this week & day.")
      document.getElementById("ayatRangeSection").style.display = "none"
    }
  } catch (e) {
    console.error(e)
    alert("Error loading ayat range")
  }
}

// Select Ayat range → Load students
async function selectCurrentAyatRange() {
  if (!currentScheme) return alert("No ayat range loaded.")

  const classVal = document.getElementById("memorizationClassSelect").value
  const session = document.getElementById("memorizationSessionSelect").value
  const term = document.getElementById("memorizationTermSelect").value
  const week = document.getElementById("memorizationWeekSelect").value
  const day = document.getElementById("memorizationDaySelect").value

  if (!classVal || !session || !term || !week || !day) {
    return alert("Please select all fields.")
  }

  const [sectionId, classId] = classVal.split(":")

  document.getElementById("selectedAyahDisplay").textContent =
    `Week ${week} – ${day}: ${currentScheme.from_surah_ayah} → ${currentScheme.to_surah_ayah}`
  document.getElementById("selectedAyahInfo").style.display = "block"

  try {
    const resp = await fetch(
      `/api/staff-memorization/${currentStaffId}?` +
      `section_id=${sectionId}&class_id=${classId}&scheme_id=${currentScheme.id}` +
      `&session=${session}&term=${term}`
    )
    const data = await resp.json()

    if (data.success && data.data.length) {
      const tbody = document.getElementById("memorizationTableBody")
      tbody.innerHTML = ""

      data.data.forEach(stu => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${stu.student_name}</td>
          <td>
            <select class="form-select daily-grade" data-enrollment-id="${stu.enrollment_id}">
              ${["","A","B","C","D","E","F"].map(g =>
                `<option value="${g}" ${stu.daily_grade===g?"selected":""}>${g||"-"}</option>`
              ).join("")}
            </select>
          </td>
         <td>
      <select class="form-select exam-grade" data-enrollment-id="${stu.enrollment_id}">
        ${["","A","B","C","D","F"].map(g =>
          `<option value="${g}" ${stu.grade===g?"selected":""}>${g||"-"}</option>`
        ).join("")}
      </select>
    </td>
          <td>
            <input type="text" class="form-control comment-input"
                   data-enrollment-id="${stu.enrollment_id}"
                   value="${stu.comments||""}">
          </td>
        `
        tbody.appendChild(row)
      })

      document.getElementById("memorizationStudentsSection").style.display = "block"
    } else {
      alert("No students found.")
    }
  } catch (e) {
    console.error(e)
    alert("Error loading students")
  }
}

// Save memorization
async function saveMemorization() {
  const classVal = document.getElementById("memorizationClassSelect").value
  const session = document.getElementById("memorizationSessionSelect").value
  const term = document.getElementById("memorizationTermSelect").value
  const week = document.getElementById("memorizationWeekSelect").value
  const day = document.getElementById("memorizationDaySelect").value

  if (!classVal || !session || !term || !week || !day || !currentScheme) {
    return alert("Please select Class, Session, Term, Week, Day and click Select.")
  }

  const [sectionId, classId] = classVal.split(":")
  const payload = []

  document.querySelectorAll("#memorizationTableBody tr").forEach(row => {
    const enrollmentId = row.querySelector(".daily-grade").dataset.enrollmentId
    const daily = row.querySelector(".daily-grade").value
    const exam = row.querySelector(".exam-grade").value
    const comment = row.querySelector(".comment-input").value.trim()

    // Allow saving if either daily or exam grade exists
    if (daily || exam) {
      payload.push({
        enrollment_id: enrollmentId,
        daily_grade: daily || null,
        grade: exam || null,
        comments: comment,
        from_surah_ayah: currentScheme.from_surah_ayah,
        to_surah_ayah: currentScheme.to_surah_ayah
      })
    }
  })

  if (!payload.length) return alert("Grade at least one student.")

  try {
    const resp = await fetch(`/api/staff-memorization/${currentStaffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: sectionId,
        class_id: classId,
        session,
        term,
        week,
        day,
        scheme_id: currentScheme.id,
        memorization: payload
      })
    })
    const res = await resp.json()

    if (res.success) {
      alert("Saved successfully!")
      loadAyatRangeForDay() // refresh
    } else {
      alert("Save failed: " + (res.message || "unknown"))
    }
  } catch (e) {
    console.error(e)
    alert("Save error")
  }
}

// Load attendance
async function loadAttendance() {
  const classValue = document.getElementById("attendanceClassSelect").value;
  const term = document.getElementById("attendanceTermSelect").value;

  if (!classValue || !term) {
    alert("Warning: Please select class and term");
    return;
  }

  const [sectionId, classId] = classValue.split(":");

  try {
    const response = await fetch(
      `/api/staff-students/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&term=${term}`
    );
    const data = await response.json();

    if (!data.success || !data.data) {
      alert("Warning: No students found for this class/term.");
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

    alert("Success: Attendance list loaded successfully!");
  } catch (error) {
    console.error("Error loading attendance:", error);
    alert("Warning: Error loading attendance.");
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
    alert("Warning: Please select class, date, term, session, and week");
    return;
  }

  if (!/^\d{4}\/\d{4}$/.test(session)) {
    alert(`Warning: Invalid session format: "${session}". Must be YYYY/YYYY (e.g., 2024/2025)`);
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
    alert("Warning: No attendance records to save.");
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
      alert("Success: Attendance saved successfully!");
    } else {
      console.error("Save error:", data);
      alert("Error: Failed to save attendance: " + data.message);
    }
  } catch (error) {
    console.error("Error saving attendance:", error);
    alert("Warning: Network error while saving attendance.");
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

// Load daily students
async function loadDailyStudents() {
  const classValue = document.getElementById("dailyClassSelect").value;
  const session = document.getElementById("dailySessionSelect").value;
  const term = document.getElementById("dailyTermSelect").value;

  if (!classValue || !session || !term) {
    alert("Please select all fields")
    return
  }

  const [sectionId, classId] = classValue.split(":");

  try {
    const response = await fetch(
      `/api/staff-students/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&session=${session}&term=${term}`
    );
    const data = await response.json();

    if (data.success) {
      const tbody = document.getElementById("dailyStudentsTableBody");
      tbody.innerHTML = "";

      data.data.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${student.full_name}</td>
          <td>${student.student_id}</td>
          <td>
            <button class="btn btn-sm btn-info me-2" onclick="viewDailyResult('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">View</button>
            <button class="btn btn-sm btn-primary" onclick="downloadDailyResult('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">Download</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } else {
      alert("Failed to load students");
    }
  } catch (error) {
    console.error(error);
    alert("Error loading students");
  }
}

// View daily result
window.viewDailyResult = async (studentId, session, term, sectionId, classId) => {
  try {
    const response = await fetch(
      `/api/tahfiz-report?student_id=${studentId}&session=${session}&term=${term}&section_id=${sectionId}&class_id=${classId}`
    );
    const html = await response.text();

    document.getElementById("dailyResultContent").innerHTML = html;
    new bootstrap.Modal(document.getElementById("dailyResultModal")).show();
  } catch (error) {
    console.error(error);
    alert("Error loading assessments");
  }
};

// Download daily result
window.downloadDailyResult = (studentId, session, term, sectionId, classId) => {
  window.open(
    `/api/tahfiz-report?student_id=${studentId}&session=${session}&term=${term}&section_id=${sectionId}&class_id=${classId}`,
    "_blank"
  );
};

// Load overall students
async function loadOverallStudents() {
  const classValue = document.getElementById("overallClassSelect").value;
  const session = document.getElementById("overallSessionSelect").value;
  const term = document.getElementById("overallTermSelect").value;

  if (!classValue || !session || !term) {
    alert("Please select all fields");
    return;
  }

  const [sectionId, classId] = classValue.split(":");
  const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

  try {
    const response = await fetch(
      `/api/class-memorization-assessments?section_id=${sectionId}&class_id=${classId}&session_year=${session}&term=${term}`
    );
    const data = await response.json();

    if (data.success) {
      const students = {};
      data.data.forEach((ass) => {
        const sid = ass.student_id;
        if (!students[sid]) {
          students[sid] = {
            full_name: ass.full_name,
            student_id: sid,
            dailies: [],
            exam_grade: null,
          };
        }
        if (ass.daily_grade) {
          students[sid].dailies.push(ass.daily_grade);
        }
        if (ass.exam_grade !== null) {
          students[sid].exam_grade = ass.exam_grade;
        }
      });

      const tbody = document.getElementById("overallStudentsTableBody");
      tbody.innerHTML = "";

      const overallData = Object.values(students).map((stu) => {
  // === DAILY AVERAGE ===
  let avg_daily_mark = 0;
  if (stu.dailies.length > 0) {
    const pointsSum = stu.dailies.reduce((sum, g) => sum + (gradePoints[g] || 0), 0);
    avg_daily_mark = pointsSum / stu.dailies.length;
  }
  const daily_score = (avg_daily_mark / 5) * 80;

  // === EXAM: Once per term/session → direct point mapping (no average) ===
  const examGradeMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 0 };
  const exam_mark = stu.exam_grade ? (examGradeMap[stu.exam_grade] || 0) : 0;
  const exam_score = (exam_mark / 5) * 20;

  const total_mark = daily_score + exam_score;

  let final_grade = 'F';
  if (total_mark >= 70) final_grade = 'A';
  else if (total_mark >= 60) final_grade = 'B';
  else if (total_mark >= 50) final_grade = 'C';
  else if (total_mark >= 40) final_grade = 'D';

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${stu.full_name}</td>
    <td>${stu.student_id}</td>
    <td>${avg_daily_mark.toFixed(2)}</td>
    <td>${daily_score.toFixed(2)}</td>
    <td>${exam_mark}</td>
    <td>${exam_score.toFixed(2)}</td>
    <td>${total_mark.toFixed(2)}</td>
    <td>${final_grade}</td>
  `;
  tbody.appendChild(row);

  return { ...stu, avg_daily_mark, daily_score, exam_mark, exam_score, total_mark, final_grade };
});
      window.currentOverallData = overallData;
    } else {
      alert("Failed to load assessments");
    }
  } catch (error) {
    console.error(error);
    alert("Error loading assessments");
  }
}

// ──────────────────────────────────────────────────────────────
// School Information (used for PDF / Excel export)
const schoolInfo = {
  name: "Ibadurrahman College",
  address:
    "No. 1968 A, Gwammaja Housing Estate, Audu Wawu Street, opp. Ihya'ussunnah Juma'a Mosque, Dala L.G.A, Kano State, Nigeria.",
  phone: "08033459721, 09062171496",
  email: "info@irc.com.ng",
  logoSrc: "assets/images/logo.jpeg",   // <-- make sure the path is reachable from the page
};
// ── Helper: Get selected class name from <select> ─────────────────
function getCurrentClassName() {
  const select = document.getElementById("overallClassSelect");
  const option = select.options[select.selectedIndex];
  return option ? option.textContent.trim() : "N/A";
}

// ── EXPORT PDF (with full school header) ────────────────────────
function exportOverallPdf() {
  if (!window.currentOverallData) return alert("Load data first");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  const logo = new Image();
  logo.src = schoolInfo.logoSrc;

  logo.onload = () => drawPdf();
  logo.onerror = () => drawPdf();   // draw even if logo fails

  function drawPdf() {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 30;
    const logoHeight = 30;
    const startY = 15;

    // Logo (left)
    try { doc.addImage(logo, "JPEG", 14, startY, logoWidth, logoHeight); } catch (e) {}

    // School name (center)
    doc.setFontSize(16).setFont(undefined, "bold");
    doc.text(schoolInfo.name, pageWidth / 2, startY + 8, { align: "center" });

    // Address & contact (center)
    doc.setFontSize(10).setFont(undefined, "normal");
    const contactLines = [
      schoolInfo.address,
      `Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`
    ];
    contactLines.forEach((line, i) => {
      doc.text(line, pageWidth / 2, startY + 18 + i * 5, { align: "center" });
    });

    // Report title & filters
    const className = getCurrentClassName();
    const term = document.getElementById("overallTermSelect").options[
      document.getElementById("overallTermSelect").selectedIndex
    ].textContent.trim();
    const session = document.getElementById("overallSessionSelect").value;

    doc.setFontSize(14).setFont(undefined, "bold");
    doc.text("Overall Tahfiz Results", pageWidth / 2, startY + 38, { align: "center" });

    doc.setFontSize(11).setFont(undefined, "normal");
    const infoLines = [
      `Class: ${className}`,
      `Term: ${term}`,
      `Session: ${session}`
    ];
    infoLines.forEach((line, i) => {
      doc.text(line, pageWidth / 2, startY + 48 + i * 5, { align: "center" });
    });

    // Table
   doc.autoTable({
  startY: startY + 65,
  head: [["Name", "ID", "Avg Daily", "Daily /80", "Exam Mark", "Exam /20", "Total", "Grade"]],
  body: window.currentOverallData.map(stu => [
    stu.full_name,
    stu.student_id,
    stu.avg_daily_mark.toFixed(2),
    stu.daily_score.toFixed(2),
    stu.exam_mark,
    stu.exam_score.toFixed(2),
    stu.total_mark.toFixed(2),
    stu.final_grade
  ]),
  theme: "grid",
  styles: { fontSize: 10, cellPadding: 4 }, // Slightly bigger text & padding
  headStyles: { fillColor: [0, 137, 123], textColor: [255, 255, 255] },
  columnStyles: {
    0: { cellWidth: 50 }, // Name
    1: { cellWidth: 40 }, // ID
    2: { cellWidth: 30 }, // Avg Daily
    3: { cellWidth: 30 }, // Daily /80
    4: { cellWidth: 30 }, // Exam Mark
    5: { cellWidth: 28 }, // Exam /20
    6: { cellWidth: 28 }, // Total
    7: { cellWidth: 22 }  // Grade
  }
});

    doc.save("overall_tahfiz_results.pdf");
  }
}

// ── EXPORT EXCEL (with full school header) ─────────────────────
function exportOverallExcel() {
  if (!window.currentOverallData) return alert("Load data first");

  const className = getCurrentClassName();
  const term = document.getElementById("overallTermSelect").options[
    document.getElementById("overallTermSelect").selectedIndex
  ].textContent.trim();
  const session = document.getElementById("overallSessionSelect").value;

  const header = [
    [schoolInfo.name],
    [schoolInfo.address],
    [`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`],
    [""],
    ["Overall Tahfiz Results"],
    [`Class: ${className}`],
    [`Term: ${term}`],
    [`Session: ${session}`],
    [""],
    ["Name", "ID", "Avg Daily", "Daily /80", "Exam Mark", "Exam /20", "Total", "Grade"]
  ];

  const dataRows = window.currentOverallData.map(stu => [
    stu.full_name,
    stu.student_id,
    stu.avg_daily_mark.toFixed(2),
    stu.daily_score.toFixed(2),
    stu.exam_mark,
    stu.exam_score.toFixed(2),
    stu.total_mark.toFixed(2),
    stu.final_grade
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...dataRows]);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Overall Results");
  XLSX.writeFile(wb, "overall_tahfiz_results.xlsx");
}