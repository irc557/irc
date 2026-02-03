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