let currentStaffId = null
let currentStaffRole = null
let currentStaffInfo = null
let currentScheme = null  

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
              Subject Report
            </button>
            <button class="btn btn-sm btn-success me-2" onclick="window.downloadTahfizReport('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">
              Tahfiz Report
            </button>
            ${
              isFormMaster
                ? `
            <button class="btn btn-sm btn-info" onclick="window.downloadCompleteReport('${student.student_id}', '${session}', '${term}', '${sectionId}', '${classId}')">
              Complete Report
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