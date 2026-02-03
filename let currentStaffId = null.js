let currentStaffId = null
let currentStaffRole = null
let currentStaffInfo = null
let currentScheme = null  
let currentTahfizData = null;
let currentCompleteReportData = null;

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  await loadStaffInfo()
  await loadDashboardStats()
  await loadSessions()  
await loadClasses("attendanceClassSelect");
await loadClasses("viewAttendanceClassSelect");
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
    // when Subjects view opens → show Add Scores by default
    if (target === 'subjects') {
      switchSubjectTab('add');
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

// === SUBJECTS: TAB SWITCHING ===
const subjectTabs = {
  add: document.getElementById('subject-add-section'),
  view: document.getElementById('subject-view-section')
};

function switchSubjectTab(tab) {
  Object.values(subjectTabs).forEach(t => t.style.display = 'none');
  subjectTabs[tab].style.display = 'block';

  document.querySelectorAll('#subjects-view .btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`subject${tab.charAt(0).toUpperCase() + tab.slice(1)}Btn`).classList.add('active');

  if (tab === 'add') {
    loadClasses("subjectClassSelect");
    loadSubjectsForSelect("subjectSubjectSelect");
  }
  if (tab === 'view') {
    loadClasses("viewSubjectClassSelect");
    loadSubjectsForSelect("viewSubjectSubjectSelect");
  }
}

document.getElementById('subjectAddBtn').addEventListener('click', () => switchSubjectTab('add'));
document.getElementById('subjectViewBtn').addEventListener('click', () => switchSubjectTab('view'));

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
  document.getElementById("viewAttendanceSessionSelect"),
  document.getElementById("dailySessionSelect"),
  document.getElementById("overallSessionSelect"),
  document.getElementById("subjectSessionSelect"),
  document.getElementById("viewSubjectSessionSelect")
];

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
// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute("data-view");
      switchView(view);
    });
  });

  // Sidebar toggle (mobile)
  document.getElementById("sidebarToggleMobile")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/staff-logout", { method: "POST" });
    window.location.href = "/staff-login";
  });

  // === MEMORIZATION: RESET ON CHANGE ===
  const resetMemorization = () => {
    ["memorizationTermSelect", "memorizationWeekSelect", "memorizationDaySelect"].forEach(id => {
      document.getElementById(id).value = "";
    });
    document.getElementById("memorizationDaySelect").style.display = "none";
    document.getElementById("ayatRangeSection").style.display = "none";
    document.getElementById("selectedAyahInfo").style.display = "none";
    document.getElementById("memorizationStudentsSection").style.display = "none";
    currentScheme = null;
  };

  document.getElementById("memorizationClassSelect")?.addEventListener("change", resetMemorization);
  document.getElementById("memorizationSessionSelect")?.addEventListener("change", resetMemorization);

  // Term → reset week/day
  document.getElementById("memorizationTermSelect")?.addEventListener("change", () => {
    document.getElementById("memorizationWeekSelect").value = "";
    document.getElementById("memorizationDaySelect").value = "";
    document.getElementById("memorizationDaySelect").style.display = "none";
    document.getElementById("ayatRangeSection").style.display = "none";
    document.getElementById("memorizationStudentsSection").style.display = "none";
  });

  // Week → show Day selector
  document.getElementById("memorizationWeekSelect")?.addEventListener("change", () => {
    const week = document.getElementById("memorizationWeekSelect").value;
    const daySelect = document.getElementById("memorizationDaySelect");
    if (week) {
      daySelect.style.display = "block";
      daySelect.value = "";
      document.getElementById("ayatRangeSection").style.display = "none";
    } else {
      daySelect.style.display = "none";
    }
  });

  // Day → load ayat range
  document.getElementById("memorizationDaySelect")?.addEventListener("change", loadAyatRangeForDay);

  // Select button
  document.getElementById("selectAyatBtn")?.addEventListener("click", selectCurrentAyatRange);

  // Save memorization
  document.getElementById("saveMemorizationBtn")?.addEventListener("click", saveMemorization);

  // Attendance
  document.getElementById("loadAttendanceBtn")?.addEventListener("click", loadAttendance);
  document.getElementById("saveAttendanceBtn")?.addEventListener("click", saveAttendance);

  // ✅ Attendance Export Buttons (previously missing)
  document.getElementById("exportAttendancePdfBtn")?.addEventListener("click", exportAttendancePdf);
  document.getElementById("exportAttendanceExcelBtn")?.addEventListener("click", exportAttendanceExcel);

  // Reports
  document.getElementById("loadReportStudentsBtn")?.addEventListener("click", loadReportStudents);

  // Video Upload
  document.getElementById("videoUploadForm")?.addEventListener("submit", uploadVideo);

  // Tahfiz Daily / Overall
  document.getElementById("loadDailyStudentsBtn")?.addEventListener("click", loadDailyStudents);
  document.getElementById("loadOverallStudentsBtn")?.addEventListener("click", loadOverallStudents);
  document.getElementById("exportOverallPdfBtn")?.addEventListener("click", exportOverallPdf);
  document.getElementById("exportOverallExcelBtn")?.addEventListener("click", exportOverallExcel);

  // === SUBJECTS: Add Scores ===
  document.getElementById("loadSubjectScoresBtn")?.addEventListener("click", loadSubjectStudents);
  document.getElementById("saveSubjectScoresBtn")?.addEventListener("click", saveSubjectScores);

  // === SUBJECTS: View Scores ===
  document.getElementById("loadSubjectResultsBtn")?.addEventListener("click", loadSubjectResults);
  document.getElementById("exportSubjectPdfBtn")?.addEventListener("click", exportSubjectPdf);
  document.getElementById("exportSubjectExcelBtn")?.addEventListener("click", exportSubjectExcel);
}

// Switch view
function switchView(view) {
  document.querySelectorAll('[id$="-view"]').forEach((v) => (v.style.display = "none"))
  document.getElementById(`${view}-view`).style.display = "block"

  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
  document.querySelector(`[data-view="${view}"]`).classList.add("active")

 if (view === "attendance") {
  loadClasses("attendanceClassSelect");
  loadClasses("viewAttendanceClassSelect");
}
  if (view === "memorization") loadClasses("memorizationClassSelect")
  if (view === "subjects") switchSubjectTab('add')
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

// Load subjects for select (staff's assigned subjects)
async function loadSubjectsForSelect(selectId) {
  try {
    const sessionRes = await fetch("/api/staff-session")
    const sess = await sessionRes.json()
    if (!sess.success) return

    const staffId = sess.data.staff_id
    const resp = await fetch(`/api/staff-subjects/${staffId}?section_id=1`)
    const data = await resp.json()

    const select = document.getElementById(selectId)
    select.innerHTML = '<option value="">Select Subject</option>'

    if (data.success) {
      data.data.forEach(sub => {
        const opt = document.createElement("option")
        opt.value = sub.subject_id
        opt.textContent = sub.subject_name
        select.appendChild(opt)
      })
    }
  } catch (e) { console.error(e) }
}

// === SUBJECTS: Load Students for Add Scores ===
async function loadSubjectStudents() {
  const classVal = document.getElementById("subjectClassSelect").value
  const session = document.getElementById("subjectSessionSelect").value
  const term = document.getElementById("subjectTermSelect").value
  const subjectId = document.getElementById("subjectSubjectSelect").value

  if (!classVal || !session || !term || !subjectId) return alert("Select all fields")

  const [sectionId, classId] = classVal.split(":")
  try {
    const resp = await fetch(
      `/api/staff-assessments/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&subject_id=${subjectId}&term=${term}&session=${session}`
    )
    const data = await resp.json()

    const tbody = document.getElementById("subjectTableBody")
    tbody.innerHTML = ""

    if (data.success && data.data.length) {
      data.data.forEach(stu => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${stu.student_name}</td>
          <td><input type="number" min="0" max="15" class="form-control ca1" data-enrollment="${stu.enrollment_id}" value="${stu.ca1_score || ''}"></td>
          <td><input type="number" min="0" max="15" class="form-control ca2" data-enrollment="${stu.enrollment_id}" value="${stu.ca2_score || ''}"></td>
          <td><input type="number" min="0" max="70" class="form-control exam" data-enrollment="${stu.enrollment_id}" value="${stu.exam_score || ''}"></td>
          <td><input type="text" class="form-control comment" data-enrollment="${stu.enrollment_id}" value="${stu.comments || ''}"></td>
        `
        tbody.appendChild(row)
      })
      document.getElementById("subjectStudentsSection").style.display = "block"
    } else {
      alert("No students enrolled")
    }
  } catch (e) { console.error(e); alert("Load error") }
}

// === SUBJECTS: Save Scores ===
async function saveSubjectScores() {
  const classVal = document.getElementById("subjectClassSelect").value;
  const session = document.getElementById("subjectSessionSelect").value;
  const term = document.getElementById("subjectTermSelect").value;
  const subjectId = document.getElementById("subjectSubjectSelect").value;

  if (!classVal || !session || !term || !subjectId) return alert("Select all");

  const [sectionId, classId] = classVal.split(":");
  const payload = [];
  const today = new Date().toISOString().split('T')[0]; // ✅ standard YYYY-MM-DD

  document.querySelectorAll("#subjectTableBody tr").forEach(row => {
    const enr = row.querySelector(".ca1").dataset.enrollment;
    const ca1 = row.querySelector(".ca1").value || null;
    const ca2 = row.querySelector(".ca2").value || null;
    const exam = row.querySelector(".exam").value || null;
    const comment = row.querySelector(".comment").value;

    if (ca1 !== null || ca2 !== null || exam !== null) {
      payload.push({
        enrollment_id: enr,
        ca1_score: ca1,
        ca2_score: ca2,
        exam_score: exam,
        comments: comment,
        date: today // ✅ now each record has a date
      });
    }
  });

  if (!payload.length) return alert("Enter at least one score");

  try {
    const resp = await fetch(`/api/staff-assessments/${currentStaffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: sectionId,
        class_id: classId,
        subject_id: subjectId,
        term,
        session, // ✅ this will now be used in backend
        assessments: payload
      })
    });
    const res = await resp.json();
    alert(res.success ? "Saved!" : "Error: " + res.message);
  } catch (e) {
    alert("Save failed");
  }
}

// === SUBJECTS: Load Results (View) ===
async function loadSubjectResults() {
  const classVal = document.getElementById("viewSubjectClassSelect").value
  const session = document.getElementById("viewSubjectSessionSelect").value
  const term = document.getElementById("viewSubjectTermSelect").value
  const subjectId = document.getElementById("viewSubjectSubjectSelect").value

  if (!classVal || !session || !term || !subjectId) return alert("Select all")

  const [sectionId, classId] = classVal.split(":")
  try {
    const resp = await fetch(
      `/api/subject-results?section_id=${sectionId}&class_id=${classId}&subject_id=${subjectId}&term=${term}&session=${session}`
    )
    const data = await resp.json()

    const tbody = document.getElementById("subjectResultsTableBody")
    tbody.innerHTML = ""

    const results = []
    data.data.forEach(r => {
      const total = (parseFloat(r.ca1_score)||0) + (parseFloat(r.ca2_score)||0) + (parseFloat(r.exam_score)||0)
      let grade = 'F'
      if (total >= 70) grade = 'A'
      else if (total >= 60) grade = 'B'
      else if (total >= 50) grade = 'C'
      else if (total >= 40) grade = 'D'

      results.push({ name: r.full_name, id: r.student_id, ca1: r.ca1_score||'-', ca2: r.ca2_score||'-', exam: r.exam_score||'-', total: total.toFixed(1), grade })

      const row = document.createElement("tr")
      row.innerHTML = `<td>${r.full_name}</td><td>${r.student_id}</td><td>${r.ca1_score||'-'}</td><td>${r.ca2_score||'-'}</td><td>${r.exam_score||'-'}</td><td>${total.toFixed(1)}</td><td>${grade}</td>`
      tbody.appendChild(row)
    })

    window.currentSubjectResults = results
  } catch (e) { alert("Load failed") }
}

// === EXPORT SUBJECT PDF ===
function exportSubjectPdf() {
  if (!window.currentSubjectResults) return alert("Load results first");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Load school logo ---
  const logo = new Image();
  logo.src = schoolInfo.logoSrc;

  logo.onload = () => drawPdf();
  logo.onerror = () => drawPdf(); // fallback even if logo fails to load

  function drawPdf() {
    const logoWidth = 30;
    const logoHeight = 30;
    const startY = 15;

    // draw logo on left side
    try { doc.addImage(logo, "JPEG", 14, startY, logoWidth, logoHeight); } catch (e) {}

    // --- School Info ---
    doc.setFontSize(16).setFont(undefined, "bold");
    doc.text(schoolInfo.name, pageWidth / 2, startY + 8, { align: "center" });

    doc.setFontSize(10).setFont(undefined, "normal");
    doc.text(schoolInfo.address, pageWidth / 2, startY + 18, { align: "center" });
    doc.text(`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`, pageWidth / 2, startY + 23, { align: "center" });

    // --- Subject Info ---
    const className = document.getElementById("viewSubjectClassSelect").selectedOptions[0].textContent;
    const subjectName = document.getElementById("viewSubjectSubjectSelect").selectedOptions[0].textContent;
    const term = document.getElementById("viewSubjectTermSelect").selectedOptions[0].textContent;
    const session = document.getElementById("viewSubjectSessionSelect").value;

    doc.setFontSize(14).setFont(undefined, "bold");
    doc.text(`${subjectName} - Results`, pageWidth / 2, startY + 38, { align: "center" });

    doc.setFontSize(11).setFont(undefined, "normal");
    doc.text(`Class: ${className} | Term: ${term} | Session: ${session}`, pageWidth / 2, startY + 45, { align: "center" });

    // --- Table ---
    doc.autoTable({
      startY: startY + 55,
      head: [["Name", "ID", "CA1", "CA2", "Exam", "Total", "Grade"]],
      body: window.currentSubjectResults.map(r => [r.name, r.id, r.ca1, r.ca2, r.exam, r.total, r.grade]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [0, 137, 123], textColor: [255, 255, 255] }
    });

    doc.save(`${subjectName.replace(/ /g, "_")}_results.pdf`);
  }
}

// === EXPORT SUBJECT EXCEL ===
function exportSubjectExcel() {
  if (!window.currentSubjectResults) return alert("Load results first")
  const className = document.getElementById("viewSubjectClassSelect").selectedOptions[0].textContent
  const subjectName = document.getElementById("viewSubjectSubjectSelect").selectedOptions[0].textContent
  const term = document.getElementById("viewSubjectTermSelect").selectedOptions[0].textContent
  const session = document.getElementById("viewSubjectSessionSelect").value

  const header = [
    [schoolInfo.name], [schoolInfo.address], [`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`], [""],
    [`${subjectName} - Results`], [`Class: ${className}`], [`Term: ${term}`], [`Session: ${session}`], [""],
    ["Name", "ID", "CA1", "CA2", "Exam", "Total", "Grade"]
  ]

  const rows = window.currentSubjectResults.map(r => [r.name, r.id, r.ca1, r.ca2, r.exam, r.total, r.grade])
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows])
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Results")
  XLSX.writeFile(wb, `${subjectName.replace(/ /g, "_")}_results.xlsx`)
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
      loadAyatRangeForDay()
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
  const day = document.getElementById("attendanceDay").value;
  const term = document.getElementById("attendanceTermSelect").value;
  const session = document.getElementById("attendanceSessionSelect").value;
  const week_number = document.getElementById("attendanceWeekSelect").value;

  if (!classValue || !day || !term || !session || !week_number) {
    alert("Warning: Please select class, day, term, session, and week");
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
        week_number,
        day, // ✅ Send only day, not date
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

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${yyyy}-${mm}-${dd}`;

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    daySelect.value = days[today.getDay()];

    dateInput.addEventListener("change", () => {
      const date = new Date(dateInput.value);
      if (!isNaN(date)) {
        daySelect.value = days[date.getDay()];
      }
    });
  }
});

// 1. LOAD CLASSES INTO DROPDOWN (Call this on page load)
async function loadReportClasses() {
  const select = document.getElementById("reportClassSelect");
  select.innerHTML = '<option value="">Loading classes...</option>';

  try {
    const sessionRes = await fetch("/api/staff-session");
    const sessionData = await sessionRes.json();
    if (!sessionData.success) {
      select.innerHTML = '<option value="">Login required</option>';
      return;
    }

    const staffId = sessionData.data.staff_id;
    const res = await fetch(`/api/staff-classes/${staffId}`);
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      select.innerHTML = '<option value="">Select Class</option>';
      result.data.forEach(cls => {
        const option = document.createElement("option");
        option.value = `${cls.section_id}:${cls.class_id}`;
        option.textContent = `${cls.section_name} - ${cls.class_name}`;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = '<option value="">No classes assigned</option>';
    }
  } catch (err) {
    console.error(err);
    select.innerHTML = '<option value="">Error loading classes</option>';
  }
}

// 2. LOAD SESSIONS INTO DROPDOWN
async function loadReportSessions() {
  const select = document.getElementById("reportSessionSelect");
  select.innerHTML = '<option value="">Loading sessions...</option>';

  try {
    const res = await fetch("/api/sessions");
    const result = await res.json();

    if (result.success && result.data.length > 0) {
      select.innerHTML = '<option value="">Select Session</option>';
      result.data.forEach(s => {
        const option = document.createElement("option");
        option.value = s.session_name;
        option.textContent = s.session_name;
        select.appendChild(option);
      });

      // Auto-select current session if available
      const current = result.data.find(s => s.is_current);
      if (current) select.value = current.session_name;
    } else {
      select.innerHTML = '<option value="">No sessions found</option>';
    }
  } catch (err) {
    console.error(err);
    select.innerHTML = '<option value="">Error loading sessions</option>';
  }
}

// 3. CALL THESE ON PAGE LOAD (ADD THIS TOO)
document.addEventListener("DOMContentLoaded", () => {
  // Only run on Reports tab
  if (document.getElementById("reports-view")) {
    loadReportClasses();
    loadReportSessions();

    // Attach load button
    document.getElementById("loadReportStudentsBtn").addEventListener("click", loadReportStudents);
  }
});
// Load report students

// FULLY UPDATED: Load students + store data for instant export
async function loadReportStudents() {
  const classValue = document.getElementById("reportClassSelect").value;
  const session = document.getElementById("reportSessionSelect").value;
  const term = document.getElementById("reportTermSelect").value;

  if (!classValue || !session || !term) {
    alert("Please select Class, Session and Term");
    return;
  }

  const [sectionId, classId] = classValue.split(":");
  const className = document.getElementById("reportClassSelect").selectedOptions[0].textContent;

  const tbody = document.getElementById("reportStudentsTableBody");
  tbody.innerHTML = "<tr><td colspan='5' class='text-center py-4'><div class='spinner-border'></div> Loading reports...</td></tr>";

  try {
    const sessionRes = await fetch("/api/staff-session");
    const sessionData = await sessionRes.json();
    if (!sessionData.success) throw new Error("Session expired");

    const staffId = sessionData.data.staff_id;
    const res = await fetch(`/api/staff-students/${staffId}?section_id=${sectionId}&class_id=${classId}&session=${session}&term=${term}`);
    const result = await res.json();

    if (!result.success || !result.data.length) {
      tbody.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>No students found</td></tr>";
      return;
    }

    // STORE FULL DATA FOR INSTANT EXPORT
    currentReportStudentsData = result.data.map(student => ({
      ...student,
      session,
      term,
      sectionId,
      classId,
      class_name: className
    }));

    tbody.innerHTML = "";
    const isFormMaster = ["Form Teacher", "Form Master"].includes(currentStaffRole);

    result.data.forEach((student, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td class="fw-bold">${student.full_name}</td>
        <td>${student.student_id}</td>
        <td>
          <button class="btn btn-sm btn-success me-2" onclick="generateTahfizReport('${student.student_id}')">
            Tahfiz Report
          </button>
          ${isFormMaster ? `
          <button class="btn btn-sm btn-primary" onclick="generateCompleteReport('${student.student_id}')">
            Complete Report
          </button>` : ""}
        </td>
      `;
      tbody.appendChild(row);
    });

    // Show export all button
    const exportBtn = document.getElementById("exportAllReportsBtn");
    if (exportBtn) exportBtn.style.display = "block";

    alert(`Success: ${result.data.length} students loaded. You can now export reports instantly!`);

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5' class='text-center text-danger'>Error loading data</td></tr>";
    alert("Failed to load students");
  }
}

// INSTANT TAHFIZ REPORT (No reload, uses cached data)
// UPDATED TAHFIZ REPORT WITH INSTANT BEAUTIFUL PREVIEW (NO BLIND DOWNLOAD)
window.generateTahfizReport = async (studentId) => {
  const student = currentReportStudentsData.find(s => s.student_id === studentId);
  if (!student) return alert("Student not loaded. Reload list.");

  // Show loading in modal
  document.getElementById("tahfizPreviewBody").innerHTML = `
    <div class="text-center py-32">
      <div class="spinner-border text-emerald-600 w-24 h-24"></div>
      <p class="mt-8 text-3xl font-bold text-emerald-700">Generating Tahfiz Report...</p>
    </div>`;
  new bootstrap.Modal(document.getElementById("tahfizPreviewModal")).show();

  try {
    const res = await authFetch(`/api/tahfiz-report?student_id=${studentId}&session=${student.session}&term=${student.term}&section_id=${student.sectionId}&class_id=${student.classId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "No Tahfiz data");

    const t = data.data;
    currentTahfizData = { ...t, student };

    const rows = t.daily_records.map(r => `
      <tr class="hover:bg-emerald-50 transition">
        <td class="py-4 px-6 border-b-2 border-emerald-200 font-bold">Week ${r.week} - ${r.day}</td>
        <td class="py-4 px-6 border-b-2 border-emerald-200 text-center">${r.from_ayah || "-"}</td>
        <td class="py-4 px-6 border-b-2 border-emerald-200 text-center">${r.to_ayah || "-"}</td>
        <td class="py-4 px-6 border-b-2 border-emerald-200 text-center">
          <span class="px-4 py-2 rounded-full text-white font-bold text-lg ${r.daily_grade === 'A' ? 'bg-emerald-600' : r.daily_grade === 'B' ? 'bg-green-500' : r.daily_grade === 'C' ? 'bg-yellow-500' : 'bg-red-600'}">
            ${r.daily_grade || "-"}
          </span>
        </td>
        <td class="py-4 px-6 border-b-2 border-emerald-200 italic">${r.comment || "No comment"}</td>
      </tr>
    `).join("");

    document.getElementById("tahfizPreviewBody").innerHTML = `
      <div class="text-center mb-10">
        <img src="assets/images/logo.jpeg" class="w-32 h-32 mx-auto rounded-full shadow-2xl border-8 border-white">
        <h1 class="text-5xl font-bold text-emerald-800 mt-6">IBADURRAHMAN COLLEGE</h1>
        <p class="text-2xl text-emerald-600 mt-2">Kano, Nigeria</p>
        <p class="text-xl text-gray-600 mt-4">Tel: 08033459721 | Email: info@irc.com.ng</p>
      </div>

      <div class="bg-emerald-700 text-white p-8 rounded-3xl shadow-2xl mb-10">
        <h2 class="text-4xl font-bold text-center mb-4">TAHFIZ MEMORIZATION REPORT</h2>
        <div class="grid grid-cols-2 gap-8 text-xl">
          <div><strong>Student:</strong> ${t.full_name}</div>
          <div><strong>ID:</strong> ${t.student_id}</div>
          <div><strong>Class:</strong> ${student.class_name}</div>
          <div><strong>Session:</strong> ${student.session} | <strong>Term:</strong> ${student.term}</div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-3xl shadow-2xl">
        <table class="w-full bg-white rounded-3xl">
          <thead class="bg-emerald-700 text-white text-xl">
            <tr>
              <th class="py-6 px-8">Week & Day</th>
              <th class="py-6 px-8">From Ayah</th>
              <th class="py-6 px-8">To Ayah</th>
              <th class="py-6 px-8">Grade</th>
              <th class="py-6 px-8">Comment</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-10 rounded-3xl shadow-2xl">
        <h3 class="text-4xl font-bold text-center mb-8">TERM SUMMARY</h3>
        <div class="grid grid-cols-2 gap-10 text-2xl">
          <div class="bg-white/20 p-6 rounded-2xl text-center">
            <div class="text-5xl font-bold">${t.avg_daily_grade || "0.00"}</div>
            <div>Average Daily Grade</div>
          </div>
          <div class="bg-white/20 p-6 rounded-2xl text-center">
            <div class="text-5xl font-bold">${t.total_score || "0"}%</div>
            <div>Total Score</div>
          </div>
        </div>
        <div class="text-center mt-8">
          <div class="inline-block bg-yellow-400 text-emerald-900 px-16 py-8 rounded-full text-6xl font-bold shadow-2xl">
            ${t.final_grade || "F"}
          </div>
          <p class="text-3xl mt-6 font-bold">FINAL GRADE</p>
        </div>
        <div class="mt-10 p-8 bg-white/20 rounded-3xl text-2xl italic text-center">
          "${t.teacher_remark || "Keep memorizing daily! May Allah grant you success in both worlds."}"
        </div>
      </div>

      <div class="text-center mt-12 text-gray-600">
        <p class="text-lg">Generated on: <strong>${new Date().toLocaleString("en-NG", { dateStyle: "full", timeStyle: "long" })}</strong></p>
        <p class="text-sm mt-2">Ibadurrahman College • Kano, Nigeria • November 11, 2025</p>
      </div>
    `;

  } catch (err) {
    document.getElementById("tahfizPreviewBody").innerHTML = `
      <div class="text-center py-32 text-red-600">
        <i class="fas fa-exclamation-triangle text-9xl"></i>
        <p class="text-4xl font-bold mt-8">Failed to Load Report</p>
        <p class="text-2xl mt-4">${err.message}</p>
      </div>`;
  }
};

// UPDATED COMPLETE REPORT WITH FULLSCREEN PREVIEW + PRINT BUTTON
window.generateCompleteReport = async (studentId) => {
  const student = currentReportStudentsData.find(s => s.student_id === studentId);
  if (!student) return alert("Student not loaded.");

  document.getElementById("completeReportPreviewBody").innerHTML = `
    <div class="text-center py-40">
      <div class="spinner-border text-emerald-600 w-32 h-32"></div>
      <p class="mt-10 text-4xl font-bold text-emerald-700">Generating Complete Report...</p>
    </div>`;
  document.getElementById("reportGeneratedTime").textContent = new Date().toLocaleString("en-NG", { dateStyle: "full", timeStyle: "medium" });
  new bootstrap.Modal(document.getElementById("completeReportPreviewModal")).show();

  try {
    const res = await authFetch(`/api/student-report?student_id=${studentId}&session=${student.session}&term=${student.term}&type=complete&section_id=${student.sectionId}&class_id=${student.classId}`);
    const data = await res.json();
    if (!data.success) throw new Error("No report data");

    const r = data.data;
    currentCompleteReportData = { ...r, student };

    const subjectRows = r.subjects.map(s => `
      <tr class="hover:bg-emerald-50 transition text-lg">
        <td class="py-4 px-6 font-bold">${s.subject_name}</td>
        <td class="py-4 px-6 text-center">${s.ca1 || "-"}</td>
        <td class="py-4 px-6 text-center">${s.ca2 || "-"}</td>
        <td class="py-4 px-6 text-center">${s.exam || "-"}</td>
        <td class="py-4 px-6 text-center font-bold text-emerald-700">${s.total || "-"}</td>
        <td class="py-4 px-6 text-center">
          <span class="px-6 py-3 rounded-full text-white font-bold text-xl ${s.grade === 'A' ? 'bg-emerald-600' : s.grade === 'B' ? 'bg-green-500' : s.grade === 'C' ? 'bg-yellow-500' : 'bg-red-600'}">
            ${s.grade || "F"}
          </span>
        </td>
        <td class="py-4 px-6 text-center font-bold">${s.position || "-"}</td>
      </tr>
    `).join("");

    document.getElementById("completeReportPreviewBody").innerHTML = `
      <div class="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-12 border-8 border-emerald-700">
        <!-- Header -->
        <div class="text-center mb-12">
          <img src="assets/images/logo.jpeg" class="w-40 h-40 mx-auto rounded-full shadow-2xl border-8 border-white">
          <h1 class="text-6xl font-bold text-emerald-800 mt-8">IBADURRAHMAN COLLEGE</h1>
          <p class="text-3xl text-emerald-600 mt-4">Kano, Nigeria</p>
          <p class="text-2xl text-gray-700 mt-4">No. 1968 A, Gwammaja Housing Estate, Kano</p>
        </div>

        <div class="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-10 rounded-3xl shadow-2xl mb-12">
          <h2 class="text-5xl font-bold text-center mb-6">END OF TERM REPORT SHEET</h2>
          <div class="grid grid-cols-3 gap-8 text-2xl">
            <div><strong>Name:</strong> ${r.full_name}</div>
            <div><strong>ID:</strong> ${r.student_id}</div>
            <div><strong>Position:</strong> <span class="text-4xl font-bold text-yellow-300">${r.position_in_class || "N/A"}</span></div>
            <div><strong>Class:</strong> ${student.class_name}</div>
            <div><strong>Session:</strong> ${student.session}</div>
            <div><strong>Term:</strong> ${student.term}</div>
          </div>
        </div>

        <!-- Academic Results -->
        <div class="mb-12">
          <h3 class="text-4xl font-bold text-emerald-700 mb-6 text-center">ACADEMIC PERFORMANCE</h3>
          <div class="overflow-x-auto rounded-3xl shadow-2xl">
            <table class="w-full bg-white">
              <thead class="bg-emerald-700 text-white text-xl">
                <tr>
                  <th class="py-6 px-8">Subject</th>
                  <th class="py-6 px-8">CA1</th>
                  <th class="py-6 px-8">CA2</th>
                  <th class="py-6 px-8">Exam</th>
                  <th class="py-6 px-8">Total</th>
                  <th class="py-6 px-8">Grade</th>
                  <th class="py-6 px-8">Pos</th>
                </tr>
              </thead>
              <tbody>${subjectRows}</tbody>
            </table>
          </div>
        </div>

        <!-- Tahfiz & Attendance -->
        <div class="grid grid-cols-2 gap-12 mb-12">
          <div class="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-10 rounded-3xl shadow-2xl">
            <h3 class="text-4xl font-bold mb-6">TAHFIZ RESULT</h3>
            <div class="text-3xl space-y-4">
              <div><strong>Grade:</strong> <span class="text-6xl font-bold">${r.tahfiz_grade || "N/A"}</span></div>
              <div><strong>Total:</strong> ${r.tahfiz_total || "0"}%</div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-10 rounded-3xl shadow-2xl">
            <h3 class="text-4xl font-bold mb-6">ATTENDANCE</h3>
            <div class="text-3xl space-y-4">
              <div><strong>Present:</strong> ${r.attendance_present || 0} days</div>
              <div><strong>Total:</strong> ${r.attendance_total || 0} days</div>
              <div><strong>Percentage:</strong> <span class="text-5xl font-bold">${r.attendance_percent || "0%"}</span></div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="grid grid-cols-2 gap-12 mb-12">
          <div class="bg-yellow-50 border-4 border-yellow-400 rounded-3xl p-10">
            <h3 class="text-3xl font-bold text-yellow-800 mb-6">Class Teacher's Comment</h3>
            <p class="text-2xl italic">"${r.teacher_comment || "_________________________________________________"}"</p>
          </div>
          <div class="bg-blue-50 border-4 border-blue-400 rounded-3xl p-10">
            <h3 class="text-3xl font-bold text-blue-800 mb-6">Form Master's Comment</h3>
            <p class="text-2xl italic">"${r.form_master_comment || "_________________________________________________"}"</p>
          </div>
        </div>

        <!-- Signature -->
        <div class="text-center mt-20">
          <div class="inline-block bg-gray-200 border-4 border-dashed rounded-xl w-64 h-32"></div>
          <p class="text-2xl font-bold text-emerald-800 mt-4">Principal's Signature</p>
        </div>

        <div class="text-center mt-16 text-gray-600">
          <p class="text-lg">Generated on: <strong>${new Date().toLocaleString("en-NG", { dateStyle: "full", timeStyle: "long" })}</strong></p>
          <p class="text-sm">Ibadurrahman College • Kano, Nigeria • November 11, 2025 09:54 PM WAT</p>
        </div>
      </div>
    `;

  } catch (err) {
    document.getElementById("completeReportPreviewBody").innerHTML = `
      <div class="text-center py-40 text-red-600">
        <p class="text-5xl font-bold">ERROR</p>
        <p class="text-3xl mt-8">${err.message}</p>
      </div>`;
  }
};
// DOWNLOAD TAHFIZ REPORT AS PDF (PERFECT QUALITY)
window.downloadCurrentTahfizPdf = async () => {
  if (!currentTahfizData) return alert("Generate preview first!");

  const element = document.getElementById("tahfizPreviewBody");
  const modal = document.getElementById("tahfizPreviewModal");
  modal.style.background = "white"; // Prevent dark overlay in PDF

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1200
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content overflows
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString("en-NG", { dateStyle: "full", timeStyle: "long" })}`, 105, 290, { align: "center" });
      doc.text(`Ibadurrahman College • Kano, Nigeria • Page ${i} of ${pageCount}`, 105, 295, { align: "center" });
    }

    doc.save(`${currentTahfizData.full_name}_Tahfiz_Report_${currentTahfizData.student.term}_${currentTahfizData.student.session}.pdf`);
    
    // Success feedback
    modal.style.background = "";
    alert(`Tahfiz Report saved successfully!\n${currentTahfizData.full_name}`);

  } catch (err) {
    console.error(err);
    alert("PDF generation failed. Please try again.");
  }
};

// DOWNLOAD COMPLETE REPORT AS PDF (HIGH QUALITY, FULL SCREEN)
window.downloadCurrentCompletePdf = async () => {
  if (!currentCompleteReportData) return alert("Generate preview first!");

  const element = document.getElementById("completeReportPreviewBody");
  const modal = document.getElementById("completeReportPreviewModal");
  modal.style.background = "white";

  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1400,
      height: element.scrollHeight + 1000
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Professional footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.setFont("helvetica", "italic");
      doc.text(`Official Report • Ibadurrahman College, Kano • ${new Date().toLocaleDateString("en-NG")}`, 105, 290, { align: "center" });
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount} • Generated at ${new Date().toLocaleTimeString("en-NG")}`, 105, 295, { align: "center" });
    }

    const fileName = `${currentCompleteReportData.full_name}_Complete_Report_${currentCompleteReportData.student.term}_${currentCompleteReportData.student.session}.pdf`;
    doc.save(fileName);

    modal.style.background = "";
    alert(`Complete Report saved!\n${currentCompleteReportData.full_name}\n\nReady for printing or WhatsApp sharing`);

  } catch (err) {
    console.error(err);
    alert("Failed to generate PDF. Check internet & try again.");
  }
};

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
  let avg_daily_mark = 0;
  if (stu.dailies.length > 0) {
    const pointsSum = stu.dailies.reduce((sum, g) => sum + (gradePoints[g] || 0), 0);
    avg_daily_mark = pointsSum / stu.dailies.length;
  }
  const daily_score = (avg_daily_mark / 5) * 80;

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
  logoSrc: "assets/images/logo.jpeg",
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
  const doc = new jsPDF({ orientation: "landscape" });;

  const logo = new Image();
  logo.src = schoolInfo.logoSrc;

  logo.onload = () => drawPdf();
  logo.onerror = () => drawPdf();

  function drawPdf() {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 30;
    const logoHeight = 30;
    const startY = 15;

    try { doc.addImage(logo, "JPEG", 14, startY, logoWidth, logoHeight); } catch (e) {}

    doc.setFontSize(16).setFont(undefined, "bold");
    doc.text(schoolInfo.name, pageWidth / 2, startY + 8, { align: "center" });

    doc.setFontSize(10).setFont(undefined, "normal");
    const contactLines = [
      schoolInfo.address,
      `Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`
    ];
    contactLines.forEach((line, i) => {
      doc.text(line, pageWidth / 2, startY + 18 + i * 5, { align: "center" });
    });

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
  styles: { fontSize: 10, cellPadding: 4 },
  headStyles: { fillColor: [0, 137, 123], textColor: [255, 255, 255] },
  columnStyles: {
    0: { cellWidth: 50 },
    1: { cellWidth: 40 },
    2: { cellWidth: 30 },
    3: { cellWidth: 30 },
    4: { cellWidth: 30 },
    5: { cellWidth: 28 },
    6: { cellWidth: 28 },
    7: { cellWidth: 22 }
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
// === ATTENDANCE TAB SWITCHING ===
const attendanceTabs = {
  take: document.getElementById('attendance-take-section'),
  view: document.getElementById('attendance-view-section')
};

function switchAttendanceTab(tab) {
  Object.values(attendanceTabs).forEach(t => t.style.display = 'none');
  attendanceTabs[tab].style.display = 'block';

  document.getElementById('attendanceTakeBtn').classList.remove('active');
  document.getElementById('attendanceViewBtn').classList.remove('active');

  if (tab === 'take') document.getElementById('attendanceTakeBtn').classList.add('active');
  if (tab === 'view') document.getElementById('attendanceViewBtn').classList.add('active');
}

document.getElementById('attendanceTakeBtn').addEventListener('click', () => switchAttendanceTab('take'));
document.getElementById('attendanceViewBtn').addEventListener('click', () => switchAttendanceTab('view'));

// === LOAD WEEKLY ATTENDANCE ===
// Load weekly attendance + store the data globally for export
document.getElementById('loadViewAttendanceBtn').addEventListener('click', async () => {
  const classVal   = document.getElementById('viewAttendanceClassSelect').value;
  const session    = document.getElementById('viewAttendanceSessionSelect').value;
  const term       = document.getElementById('viewAttendanceTermSelect').value;
  const week       = document.getElementById('viewAttendanceWeekSelect').value;

  if (!classVal || !session || !term || !week) return alert('Please select all fields.');

  const [sectionId, classId] = classVal.split(':');   // we need classId too now
  const tbody = document.getElementById('viewAttendanceTableBody');
  tbody.innerHTML = '<tr><td colspan="11" class="text-center">Loading...</td></tr>';

  try {
    const res = await fetch(
      `/api/staff-attendance-weekly/${currentStaffId}?section_id=${sectionId}&class_id=${classId}&term=${term}&session=${session}&week=${week}`
    );
    const data = await res.json();

    tbody.innerHTML = ''; // clear loading row

    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No records found for the selected week.</td></tr>';
      window.currentAttendanceData = [];               // clear old data
      return;
    }

    // THIS IS THE KEY LINE
    window.currentAttendanceData = data.data;          // store for export

    const weekDays = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];

    data.data.forEach(stu => {
      const row = document.createElement('tr');

      let totalPresent = 0;
      let totalDays    = 0;

      const dayCells = weekDays.map(day => {
        const status = stu.days[day] || '-';
        if (status === 'Present') totalPresent++;
        if (status === 'Present' || status === 'Absent') totalDays++;
        return `<td class="text-center">${status}</td>`;
      }).join('');

      const percent = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0;

      row.innerHTML = `
        <td>${stu.student_name}</td>
        <td>${stu.student_id || 'N/A'}</td>   <!-- show ID -->
        ${dayCells}
        <td class="text-center fw-bold">${totalPresent}/${totalDays}</td>
        <td class="text-center fw-bold">${percent}%</td>
      `;
      tbody.appendChild(row);
    });

    // optional nice feedback
    alert('Attendance loaded successfully! You can now export to PDF or Excel.');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Error loading data.</td></tr>';
    alert('Error loading weekly attendance.');
  }
});

// EXPORT ATTENDANCE PDF (with Logo + Full School Header)
async function exportAttendancePdf() {
  if (!window.currentAttendanceData || !window.currentAttendanceData.length)
    return alert("No attendance data loaded. Please load attendance first.");

  const classSelect   = document.getElementById("viewAttendanceClassSelect");
  const sessionSelect = document.getElementById("viewAttendanceSessionSelect");
  const termSelect    = document.getElementById("viewAttendanceTermSelect");
  const weekSelect    = document.getElementById("viewAttendanceWeekSelect");

  const className = classSelect.selectedOptions[0]?.textContent || "Unknown Class";
  const session   = sessionSelect.value || "Unknown Session";
  const term      = termSelect.selectedOptions[0]?.textContent || "Unknown Term";
  const week      = weekSelect.value || "Unknown Week";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load logo
  const logo = new Image();
  logo.src = schoolInfo.logoSrc; // "assets/images/logo.jpeg"

  const drawHeader = () => {
    const logoWidth = 30;
    const logoHeight = 30;
    const startY = 15;

    // Logo (left)
    try {
      doc.addImage(logo, "JPEG", 14, startY, logoWidth, logoHeight);
    } catch (e) {
      console.warn("Logo failed to load");
    }

    // School Name
    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text(schoolInfo.name, pageWidth / 2, startY + 8, { align: "center" });

    // Address + Contact
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(schoolInfo.address, pageWidth / 2, startY + 16, { align: "center" });
    doc.text(`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`, pageWidth / 2, startY + 22, { align: "center" });

    // Title
    doc.setFontSize(14).setFont("helvetica", "bold");
    doc.text("WEEKLY ATTENDANCE REPORT", pageWidth / 2, startY + 35, { align: "center" });

    // Details
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Class: ${className} | Week: ${week} | Term: ${term} | Session: ${session}`, pageWidth / 2, startY + 43, { align: "center" });

    // Table
    const head = [["Name", "ID", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Total", "%"]];
    const body = window.currentAttendanceData.map(s => {
      const days = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
      const presentCount = days.filter(d => s.days[d] === "Present").length;
      const totalDays = days.filter(d => s.days[d] && s.days[d] !== '-').length;
      const percent = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) + "%" : "0%";

      return [
        s.student_name,
        s.student_id || 'N/A',
        ...days.map(d => s.days[d] || "-"),
        `${presentCount}/${totalDays}`,
        percent
      ];
    });

    doc.autoTable({
      startY: startY + 55,
      head: head,
      body: body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, halign: "center" },
      headStyles: { fillColor: [0, 137, 123], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 40 }, // Name
        1: { cellWidth: 25 }, // ID
      },
      margin: { left: 14, right: 14 }
    });

    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(9).setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: "center" });

    doc.save(`Attendance_${className.replace(/ /g, "_")}_Week${week}_${term}_${session}.pdf`);
  };

  // Draw when logo loads (or fallback if it fails)
  logo.onload = drawHeader;
  logo.onerror = () => {
    console.warn("Logo failed, generating without it...");
    drawHeader();
  };
}

// EXPORT ATTENDANCE EXCEL (with Full Header + Logo Placeholder)
async function exportAttendanceExcel() {
  if (!window.currentAttendanceData || !window.currentAttendanceData.length)
    return alert("No attendance data loaded. Please load attendance first.");

  const classSelect   = document.getElementById("viewAttendanceClassSelect");
  const sessionSelect = document.getElementById("viewAttendanceSessionSelect");
  const termSelect    = document.getElementById("viewAttendanceTermSelect");
  const weekSelect    = document.getElementById("viewAttendanceWeekSelect");

  const className = classSelect.selectedOptions[0]?.textContent || "Unknown Class";
  const session   = sessionSelect.value || "Unknown Session";
  const term      = termSelect.selectedOptions[0]?.textContent || "Unknown Term";
  const week      = weekSelect.value || "Unknown Week";

  const header = [
    [schoolInfo.name],
    [schoolInfo.address],
    [`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`],
    [""],
    ["WEEKLY ATTENDANCE REPORT"],
    [`Class: ${className} | Week: ${week} | Term: ${term} | Session: ${session}`],
    [""],
    ["Student Name", "Student ID", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Total Present", "Percentage"]
  ];

  const rows = window.currentAttendanceData.map(s => {
    const days = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
    const presentCount = days.filter(d => s.days[d] === "Present").length;
    const totalDays = days.filter(d => s.days[d] && s.days[d] !== '-').length;
    const percent = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) + "%" : "0%";

    return [
      s.student_name,
      s.student_id || 'N/A',
      ...days.map(d => s.days[d] || "-"),
      `${presentCount}/${totalDays}`,
      percent
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);

  // Merge school name across all columns
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 10 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 10 } }
  ];

  // Column widths
  ws["!cols"] = [
    { wch: 25 }, { wch: 12 }, // Name, ID
    ...Array(7).fill({ wch: 8 }), // Days
    { wch: 12 }, { wch: 10 } // Total, %
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `Attendance_${className.replace(/ /g, "_")}_Week${week}_${term}_${session}.xlsx`);
}

CREATE TABLE Students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student_Enrollments table
CREATE TABLE Student_Enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    section_id INT NOT NULL,
    class_ref INT NOT NULL,
    session_year VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id, class_ref) REFERENCES classes(section_id, id) ON DELETE CASCADE,
    FOREIGN KEY (session_year) REFERENCES Sessions(session_year) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, section_id, class_ref, session_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- =========================
-- Student Subject Assessments
-- =========================
CREATE TABLE Student_Subject_Assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    subject_id INT NOT NULL,
    term VARCHAR(20) NOT NULL,  -- e.g., 'First', 'Second'
    session_year VARCHAR(9) NOT NULL,  -- e.g., '2024/2025'
    ca1_score TINYINT DEFAULT NULL CHECK (ca1_score >= 0 AND ca1_score <= 15),
    ca2_score TINYINT DEFAULT NULL CHECK (ca2_score >= 0 AND ca2_score <= 15),
    exam_score TINYINT DEFAULT NULL CHECK (exam_score >= 0 AND exam_score <= 70),
    comments TEXT DEFAULT NULL,
    date DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (enrollment_id) REFERENCES Student_Enrollments(enrollment_id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
    UNIQUE KEY unique_subject_assessment (enrollment_id, subject_id, term, session_year)
);
CREATE TABLE Student_Memorization_Assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    scheme_id INT NOT NULL,

    daily_grade CHAR(1) DEFAULT NULL
                  CHECK (daily_grade IN ('A','B','C','D','E','F')),
    exam_grade CHAR(1) DEFAULT NULL
                  CHECK (exam_grade IN ('A','B','C','D','F')),
    comments TEXT DEFAULT NULL,
    date DATE NOT NULL DEFAULT (CURRENT_DATE),

    session_year VARCHAR(9) NOT NULL COMMENT 'e.g. 2024/2025',
    term TINYINT NOT NULL COMMENT '1, 2, or 3',
    week TINYINT NOT NULL,
    from_surah_ayah VARCHAR(50) NOT NULL,
    to_surah_ayah VARCHAR(50) NOT NULL,
    assessed_day ENUM('السبت','الأحد') NOT NULL,

    avg_daily_mark DECIMAL(5,2) NULL,
    daily_score DECIMAL(5,2) NULL,
    exam_mark TINYINT NULL,
    exam_score DECIMAL(5,2) NULL,
    total_mark DECIMAL(5,2) NULL,
    final_grade CHAR(1) NULL
                  CHECK (final_grade IN ('A','B','C','D','F')),

    FOREIGN KEY (enrollment_id) REFERENCES Student_Enrollments(enrollment_id),
    FOREIGN KEY (scheme_id) REFERENCES Daily_Memorization_Scheme(id),

    -- ✅ Enforce unique per week + day per student
    UNIQUE KEY unique_daily (
        enrollment_id, scheme_id, session_year, term, week, assessed_day
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS Student_Memorization_Exam;

CREATE TABLE Student_Memorization_Exam (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    scheme_id INT NOT NULL,
    term TINYINT NOT NULL,
    session_year VARCHAR(9) NOT NULL,
    exam_grade CHAR(1) NOT NULL
               CHECK (exam_grade IN ('A','B','C','D','F')),
    UNIQUE KEY unique_exam (enrollment_id, term, session_year); 
);
// ============================================
// STAFF REPORTS API - DIRECT app.get() (NO ROUTER)
// PLACE AFTER app = express() AND pool CONNECTION
// ============================================

// Middleware: Verify Staff Session
const verifyStaffSession = (req, res, next) => {
  if (!req.session || !req.session.staff) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

// GET STAFF'S CLASSES (FIXED JOIN LOGIC)
app.get("/api/staff-classes/:staff_id", verifyStaffSession, async (req, res) => {
  const { staff_id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT 
        c.section_id, 
        c.class_id, 
        c.name AS class_name, 
        s.name AS section_name
      FROM class_assignments ca
      JOIN classes c ON ca.class_id = c.class_id AND ca.section_id = c.section_id
      JOIN sections s ON c.section_id = s.id
      WHERE ca.staff_id = ?
      ORDER BY s.name, c.name
    `, [staff_id]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Staff Classes Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 1. TAHFIZ REPORT API
app.get("/api/tahfiz-report", verifyStaffSession, async (req, res) => {
  const { student_id, session, term, section_id, class_id } = req.query;

  if (!student_id || !session || !term || !section_id || !class_id) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  try {
    // Student info
    const [student] = await pool.query(
      `SELECT s.full_name, s.student_id, c.name AS class_name 
       FROM students s 
       JOIN classes c ON s.class_id = c.class_id AND s.section_id = c.section_id 
       WHERE s.student_id = ? AND s.section_id = ? AND s.class_id = ?`,
      [student_id, section_id, class_id]
    );

    if (student.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Daily memorization records
    const [daily] = await pool.query(
      `SELECT week, day, 
              from_surah_ayah AS from_ayah, 
              to_surah_ayah AS to_ayah, 
              daily_grade, 
              comments AS comment
       FROM memorization_assessments 
       WHERE student_id = ? AND session = ? AND term = ?
       ORDER BY week, day`,
      [student_id, session, term]
    );

    // Summary: average daily + exam
    const [summary] = await pool.query(
      `SELECT 
         AVG(CASE daily_grade 
           WHEN 'A' THEN 5 WHEN 'B' THEN 4 WHEN 'C' THEN 3 
           WHEN 'D' THEN 2 WHEN 'E' THEN 1 ELSE 0 
         END) AS avg_daily,
         grade AS exam_grade
       FROM memorization_assessments 
       WHERE student_id = ? AND session = ? AND term = ?
       GROUP BY grade`,
      [student_id, session, term]
    );

    const avgDaily = parseFloat(summary[0]?.avg_daily || 0);
    const examScoreMap = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'F': 0 };
    const examScore = examScoreMap[summary[0]?.exam_grade] || 0;
    const continuousScore = (avgDaily / 5) * 80;
    const totalScore = continuousScore + examScore;

    const finalGrade = totalScore >= 70 ? 'A' :
                       totalScore >= 60 ? 'B' :
                       totalScore >= 50 ? 'C' :
                       totalScore >= 40 ? 'D' : 'F';

    res.json({
      success: true,
      data: {
        full_name: student[0].full_name,
        student_id: student[0].student_id,
        class_name: student[0].class_name,
        daily_records: daily,
        avg_daily_grade: avgDaily.toFixed(2),
        exam_grade: summary[0]?.exam_grade || "N/A",
        total_score: totalScore.toFixed(1),
        final_grade: finalGrade,
        teacher_remark: "Excellent effort in Tahfiz. Keep memorizing daily!"
      }
    });

  } catch (err) {
    console.error("Tahfiz Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 2. COMPLETE REPORT API (Full Result Sheet)
app.get("/api/student-report", verifyStaffSession, async (req, res) => {
  const { student_id, session, term, type, section_id, class_id } = req.query;

  if (!student_id || !session || !term || !section_id || !class_id) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  if (type !== "complete") {
    return res.status(400).json({ success: false, message: "Use type=complete" });
  }

  try {
    // Student info
    const [student] = await pool.query(
      `SELECT s.full_name, s.student_id, c.name AS class_name 
       FROM students s 
       JOIN classes c ON s.class_id = c.class_id AND s.section_id = c.section_id
       WHERE s.student_id = ? AND s.section_id = ? AND s.class_id = ?`,
      [student_id, section_id, class_id]
    );

    if (student.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Academic subjects with totals and grades
    const [subjects] = await pool.query(
      `SELECT 
         sub.subject_name,
         ass.ca1_score AS ca1,
         ass.ca2_score AS ca2,
         ass.exam_score AS exam,
         COALESCE(ass.ca1_score,0) + COALESCE(ass.ca2_score,0) + COALESCE(ass.exam_score,0) AS total,
         CASE 
           WHEN COALESCE(ass.ca1_score,0) + COALESCE(ass.ca2_score,0) + COALESCE(ass.exam_score,0) >= 70 THEN 'A'
           WHEN >= 60 THEN 'B' 
           WHEN >= 50 THEN 'C' 
           WHEN >= 40 THEN 'D' 
           ELSE 'F'
         END AS grade
       FROM assessments ass
       JOIN subjects sub ON ass.subject_id = sub.id
       WHERE ass.student_id = ? AND ass.session = ? AND ass.term = ?
       ORDER BY sub.subject_name`,
      [student_id, session, term]
    );

    // Total academic score
    const academicTotal = subjects.reduce((sum, sub) => sum + (sub.total || 0), 0);

    // Tahfiz score
    const [tahfiz] = await pool.query(
      `SELECT total_score, final_grade 
       FROM memorization_assessments 
       WHERE student_id = ? AND session = ? AND term = ?
       LIMIT 1`,
      [student_id, session, term]
    );

    const tahfizTotal = parseFloat(tahfiz[0]?.total_score || 0).toFixed(1);
    const tahfizGrade = tahfiz[0]?.final_grade || "N/A";

    // Grand total (academic + tahfiz)
    const grandTotal = academicTotal + parseFloat(tahfizTotal);

    // Attendance
    const [att] = await pool.query(
      `SELECT 
         SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) AS present,
         COUNT(*) AS total_days
       FROM attendance 
       WHERE student_id = ? AND session = ? AND term = ?`,
      [student_id, session, term]
    );

    const present = att[0]?.present || 0;
    const totalDays = att[0]?.total_days || 1;
    const attendancePercent = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : "0.0";

    // Class position (within same class & section, including Tahfiz)
    const [rank] = await pool.query(
      `SELECT student_id, position
       FROM (
         SELECT s.student_id,
                RANK() OVER (ORDER BY 
                  COALESCE(SUM(a.ca1_score + a.ca2_score + a.exam_score), 0) + 
                  COALESCE(m.total_score, 0) DESC
                ) AS position
         FROM students s
         LEFT JOIN assessments a ON s.student_id = a.student_id AND a.session = ? AND a.term = ?
         LEFT JOIN memorization_assessments m ON s.student_id = m.student_id AND m.session = ? AND m.term = ?
         WHERE s.class_id = ? AND s.section_id = ?
         GROUP BY s.student_id
       ) ranked
       WHERE student_id = ?`,
      [session, term, session, term, class_id, section_id, student_id]
    );

    const position = rank[0]?.position ? `${rank[0].position}${getOrdinal(rank[0].position)}` : "N/A";

    res.json({
      success: true,
      data: {
        full_name: student[0].full_name,
        student_id: student[0].student_id,
        class_name: student[0].class_name,
        position_in_class: position,
        grand_total: grandTotal.toFixed(1),
        subjects: subjects,
        tahfiz_grade: tahfizGrade,
        tahfiz_total: tahfizTotal,
        attendance_present: present,
        attendance_total: totalDays,
        attendance_percent: attendancePercent + "%",
        teacher_comment: "Excellent academic performance and good conduct.",
        form_master_comment: "A brilliant student. Promoted to next class. Keep it up!"
      }
    });

  } catch (err) {
    console.error("Complete Report Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Helper: 1st, 2nd, 3rd...
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (v >= 11 && v <= 13) ? 'th' : s[(v % 10 > 3) ? 0 : v % 10];
}
