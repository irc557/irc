let currentStaffId = null
let currentStaffRole = null
let currentStaffInfo = null
let currentScheme = null
let currentTahfizData = null;
let currentCompleteReportData = null;
const termMap = { "First Term": 1, "Second Term": 2, "Third Term": 3 };
let currentReportStudentsData = null; // stores the full list after “Load Students”
let allVideos = [];
let visibleCount = 4;
let filtersApplied = false; // Controls if filtering is active

// Initialize dashboard — FIXED: ALL CLASSES & SESSIONS LOAD INSTANTLY
document.addEventListener("DOMContentLoaded", async () => {
  await loadStaffInfo()
  await loadDashboardStats()
  await loadSessions()                       
  await cacheAndPopulateAllClassDropdowns()  
  await loadStaffCumulativeDropdowns()   // ← ADD THIS LINE HERE

  setupEventListeners()
})

// ONE-TIME CLASS LOADER — THIS FIXES EVERYTHING!
async function cacheAndPopulateAllClassDropdowns() {
  if (!currentStaffId) return;

  try {
    const staffRes = await fetch(`/api/staff/${currentStaffId}`);
    const staffData = await staffRes.json();
    if (!staffData.success || !staffData.data.classes) return;

    const classesRes = await fetch("/api/classes");
    const classesData = await classesRes.json();
    if (!classesData.success) return;

    const assigned = staffData.data.classes;
    const allClasses = classesData.data;

        const ids = [
      "attendanceClassSelect","viewAttendanceClassSelect",
      "memorizationClassSelect","dailyClassSelect","overallClassSelect",
      "subjectClassSelect","viewSubjectClassSelect",
      "reportClassSelect","videoClassSelect",
      "filterClass"  // ← ADD THIS LINE
    ];
    ids.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '<option value="">Select Class</option>';
      assigned.forEach(ac => {
        const c = allClasses.find(x => x.id === ac.class_id && x.section_id === ac.section_id);
        if (c) {
          const opt = document.createElement("option");
          opt.value = `${ac.section_id}:${ac.class_id}`;
          opt.textContent = c.name;
          select.appendChild(opt);
        }
      });
    });
  } catch (e) { console.error(e); }
}

// Load sessions — VIDEO TAB SESSION DROPDOWN FIXED!
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
        document.getElementById("viewSubjectSessionSelect"),
        document.getElementById("videoSessionSelect"),
        document.getElementById("filterSession")   // ← ADD THIS LINE ONLY
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

// Switch view — NO MORE loadClasses() CALLS (they are pre-loaded!)
function switchView(view) {
  document.querySelectorAll('[id$="-view"]').forEach((v) => (v.style.display = "none"))
  document.getElementById(`${view}-view`).style.display = "block"
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"))
  document.querySelector(`[data-view="${view}"]`).classList.add("active")

  if (view === "memorization") switchTahfizTab('grading');
  if (view === "subjects") switchSubjectTab('add');
  // All dropdowns already filled — no extra calls needed!
}

// Sidebar navigation (unchanged)
document.querySelectorAll('#sidebarNav .nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = this.getAttribute('data-view');
    document.querySelectorAll('#mainContent > div[id$="-view"]').forEach(v => v.style.display = 'none');
    document.getElementById(target + '-view').style.display = 'block';
    document.querySelectorAll('#sidebarNav .nav-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    if (target === 'memorization') switchTahfizTab('grading');
    if (target === 'subjects') switchSubjectTab('add');
  });
});

// Tahfiz tab switching — REMOVED loadClasses() calls (pre-loaded)
const tahfizTabs = {
  grading: document.getElementById('grading-section'),
  daily: document.getElementById('dailyResult-section'),
  overall: document.getElementById('overallResult-section')
};
function switchTahfizTab(tab) {
  Object.values(tahfizTabs).forEach(t => t.style.display = 'none');
  tahfizTabs[tab].style.display = 'block';
  document.querySelectorAll('#memorization-view .btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab + 'Btn').classList.add('active');
}
document.getElementById('gradingBtn').addEventListener('click', () => switchTahfizTab('grading'));
document.getElementById('overallResultBtn').addEventListener('click', () => switchTahfizTab('overall'));

// SUBJECTS: TAB SWITCHING — REMOVED loadClasses() calls
const subjectTabs = {
  add: document.getElementById('subject-add-section'),
  view: document.getElementById('subject-view-section')
};
function switchSubjectTab(tab) {
  Object.values(subjectTabs).forEach(t => t.style.display = 'none');
  subjectTabs[tab].style.display = 'block';
  document.querySelectorAll('#subjects-view .btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`subject${tab.charAt(0).toUpperCase() + tab.slice(1)}Btn`).classList.add('active');
  if (tab === 'add') loadSubjectsForSelect("subjectSubjectSelect");
  if (tab === 'view') loadSubjectsForSelect("viewSubjectSubjectSelect");
}
document.getElementById('subjectAddBtn').addEventListener('click', () => switchSubjectTab('add'));
document.getElementById('subjectViewBtn').addEventListener('click', () => switchSubjectTab('view'));

// Default: show dashboard on page load
document.getElementById('dashboard-view').style.display = 'block';

// Load staff information (unchanged)
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

// Load dashboard statistics (unchanged)
async function loadDashboardStats() {
  try {
    const sessionResponse = await fetch("/api/staff-session");
    const sessionData = await sessionResponse.json();
    if (!sessionData.success) return;

    const staffId = sessionData.data.staff_id;

    const staffInfoRes = await fetch(`/api/staff/${staffId}`);
    const staffInfo = await staffInfoRes.json();

    let totalClasses = 0;
    let totalStudents = 0;

    if (staffInfo.success && staffInfo.data.classes) {
      totalClasses = staffInfo.data.classes.length;

      const studentSet = new Set();
      for (const cls of staffInfo.data.classes) {
        const res = await fetch(
          `/api/staff-students/${staffId}?section_id=${cls.section_id}&class_id=${cls.class_id}`
        );
        const data = await res.json();
        if (data.success && data.data.length) {
          data.data.forEach(stu => studentSet.add(stu.student_id));
        }
      }
      totalStudents = studentSet.size;
    }

    let totalSubjects = 0;
    const sectionIds = [1, 2];
    for (const sectionId of sectionIds) {
      const subjectsRes = await fetch(`/api/staff-subjects/${staffId}?section_id=${sectionId}`);
      const subjectsData = await subjectsRes.json();
      if (subjectsData.success) {
        totalSubjects += subjectsData.data.length;
      }
    }

    document.getElementById("totalClassesCount").textContent = totalClasses;
    document.getElementById("totalStudentsCount").textContent = totalStudents;
    document.getElementById("totalSubjectsCount").textContent = totalSubjects;

  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadDashboardStats);

// Setup event listeners — REMOVED duplicate loadClasses() for video tab
function setupEventListeners() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute("data-view");
      switchView(view);
    });
  });
  document.getElementById("sidebarToggleMobile")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // VIDEO UPLOAD — WORKS PERFECTLY NOW
  document.getElementById("videoWeekSelect")?.addEventListener("change", () => {
    const week = document.getElementById("videoWeekSelect").value;
    const daySelect = document.getElementById("videoDaySelect");
    const ayatSection = document.getElementById("videoAyatRangeSection");
    if (week) {
      daySelect.style.display = "block";
      daySelect.value = "";
      ayatSection.style.display = "none";
    } else {
      daySelect.style.display = "none";
      ayatSection.style.display = "none";
    }
  });

  document.getElementById("videoDaySelect")?.addEventListener("change", async () => {
    const classVal = document.getElementById("videoClassSelect").value;
    const session = document.getElementById("videoSessionSelect").value;
    const term = document.getElementById("videoTermSelect").value;
    const week = document.getElementById("videoWeekSelect").value;
    const day = document.getElementById("videoDaySelect").value;

    if (!classVal || !session || !term || !week || !day) return;

    const [sectionId, classId] = classVal.split(":");

    try {
      const resp = await fetch(
        `/api/staff-memorization-schemes?class_id=${classId}&term=${term}&week=${week}&day=${encodeURIComponent(day)}&session=${session}`
      );
      const data = await resp.json();
      const display = document.getElementById("videoAyatRangeDisplay");
      const section = document.getElementById("videoAyatRangeSection");

      if (data.success && data.data.length === 1) {
        const s = data.data[0];
        display.textContent = `Week ${s.week} – ${s.day}: ${s.from_surah_ayah} → ${s.to_surah_ayah}`;
        section.style.display = "block";
      } else {
        display.textContent = "No ayat range found for this selection";
        section.style.display = "block";
      }
    } catch (e) {
      console.error("Error loading ayat range:", e);
    }
  });

  document.getElementById("videoUploadForm")?.addEventListener("submit", uploadVideo);
  document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await fetch("/api/staff-logout", { method: "POST" });
    window.location.href = "/staff-login";
  });

  // MEMORIZATION RESET & CHAIN
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
  document.getElementById("memorizationTermSelect")?.addEventListener("change", () => {
    document.getElementById("memorizationWeekSelect").value = "";
    document.getElementById("memorizationDaySelect").value = "";
    document.getElementById("memorizationDaySelect").style.display = "none";
    document.getElementById("ayatRangeSection").style.display = "none";
    document.getElementById("memorizationStudentsSection").style.display = "none";
  });
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
  document.getElementById("memorizationDaySelect")?.addEventListener("change", loadAyatRangeForDay);
  document.getElementById("selectAyatBtn")?.addEventListener("click", selectCurrentAyatRange);
  document.getElementById("saveMemorizationBtn")?.addEventListener("click", saveMemorization);

  // All other buttons (unchanged)
  document.getElementById("loadAttendanceBtn")?.addEventListener("click", loadAttendance);
  document.getElementById("saveAttendanceBtn")?.addEventListener("click", saveAttendance);
  document.getElementById("exportAttendancePdfBtn")?.addEventListener("click", exportAttendancePdf);
  document.getElementById("exportAttendanceExcelBtn")?.addEventListener("click", exportAttendanceExcel);
  document.getElementById("loadReportStudentsBtn")?.addEventListener("click", loadReportStudents);
  document.getElementById("videoUploadForm")?.addEventListener("submit", uploadVideo);
  document.getElementById("loadDailyStudentsBtn")?.addEventListener("click", loadDailyStudents);
  document.getElementById("loadOverallStudentsBtn")?.addEventListener("click", loadOverallStudents);
  document.getElementById("exportOverallPdfBtn")?.addEventListener("click", exportOverallPdf);
  document.getElementById("exportOverallExcelBtn")?.addEventListener("click", exportOverallExcel);
  document.getElementById("loadSubjectScoresBtn")?.addEventListener("click", loadSubjectStudents);
  document.getElementById("saveSubjectScoresBtn")?.addEventListener("click", saveSubjectScores);
  document.getElementById("loadSubjectResultsBtn")?.addEventListener("click", loadSubjectResults);
  document.getElementById("exportSubjectPdfBtn")?.addEventListener("click", exportSubjectPdf);
  document.getElementById("exportSubjectExcelBtn")?.addEventListener("click", exportSubjectExcel);
}
// FINAL SWITCHVIEW — ONLY ONE FUNCTION (DELETE BOTH OLD ONES, USE THIS)
const originalSwitchView = function(view) {
  document.querySelectorAll('[id$="-view"]').forEach((v) => v.style.display = "none");
  document.getElementById(`${view}-view`).style.display = "block";
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  if (view === "attendance") {
    loadClasses("attendanceClassSelect");
    loadClasses("viewAttendanceClassSelect");
  }
  if (view === "memorization") loadClasses("memorizationClassSelect");
  if (view === "subjects") switchSubjectTab('add');
  if (view === "reports") loadClasses("reportClassSelect");
  // No need for videos — handled below
};

// MAIN SWITCHVIEW — THIS IS THE ONLY ONE YOU KEEP
function switchView(view) {
  originalSwitchView(view);  // Does all the normal tab switching

  if (view === "videos") {
    visibleCount = 4;
    filtersApplied = false;
    loadAllVideos();         // ← Loads videos every time
    // loadStaffFilters();  // ← Already called on page load, no need here
  }
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
// SUPER FAST: Load classes for Reports tab (uses direct endpoint)
async function loadReportClasses() {
  const select = document.getElementById("reportClassSelect");
  select.innerHTML = '<option value="">Loading classes...</option>';

  try {
    const sessionRes = await fetch("/api/staff-session");
    const sessionData = await sessionRes.json();
    if (!sessionData.success) {
      select.innerHTML = '<option value="">Session expired</option>';
      return;
    }

    const staffId = sessionData.data.staff_id;

    // THIS IS THE WINNER → direct, clean, fast query
    const res = await fetch(`/api/staff-classes/${staffId}`, {
      credentials: "include"
    });

    const result = await res.json();

    if (result.success && result.data.length > 0) {
      select.innerHTML = '<option value="">Select Class</option>';
      result.data.forEach(cls => {
        const option = document.createElement("option");
        // Use section_id:class_id or western_class_id depending on section
        const classId = cls.section_id === 1 ? cls.class_id : cls.western_class_id;
        option.value = `${cls.section_id}:${classId || ''}`;
        option.textContent = cls.class_name;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = '<option value="">No classes assigned</option>';
    }
  } catch (err) {
    console.error("Error loading report classes:", err);
    select.innerHTML = '<option value="">Error loading</option>';
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

// ──────────────────────────────────────────────────────────────
// FINAL RE-USABLE: Get cumulative attendance for reports (100% working)
// ──────────────────────────────────────────────────────────────
async function getCumulativeAttendance(studentId, session, term, upToWeek = null) {
  try {
    // 1. Get the selected class from Reports tab
    const classSelect = document.getElementById("reportClassSelect");
    if (!classSelect || !classSelect.value) {
      console.warn("No class selected in reportClassSelect");
      return { percentage: "N/A", present: 0, total: 0 };
    }

    const classVal = classSelect.value;
    const [sectionId, classId] = classVal.split(":");

    if (!classId) {
      console.warn("Invalid class value:", classVal);
      return { percentage: "N/A", present: 0, total: 0 };
    }

    // 2. Build URL (upToWeek optional — not needed for full term)
    const weekParam = upToWeek ? `&up_to_week=${upToWeek}` : "";
    const url = `/api/staff-cumulative-attendance/${currentStaffId}?` +
                `class_id=${encodeURIComponent(classId)}&` +
                `session=${encodeURIComponent(session)}&` +
                `term=${encodeURIComponent(term)}${weekParam}`;

    const res = await fetch(url);

    // 3. Check if request succeeded
    if (!res.ok) {
      console.warn("Cumulative attendance API failed:", res.status);
      return { percentage: "Error", present: 0, total: 0 };
    }

    const json = await res.json();

    if (json.success && json.data && Array.isArray(json.data)) {
      const stu = json.data.find(s => s.student_id === studentId);
      if (stu) {
        return {
          percentage: stu.percentage || "0%",
          present: stu.total_present || 0,
          total: stu.total_days || 0
        };
      }
    }

    // Student not found in attendance records yet
    return { percentage: "0%", present: 0, total: 0 };

  } catch (e) {
    console.error("getCumulativeAttendance error:", e);
    return { percentage: "Error", present: 0, total: 0 };
  }
}
// =====================================================================
// DAILY & FINAL GRADE COMMENTS
// =====================================================================
const dailyGradeComments = { A: "Excellent", B: "Very good", C: "Good", D: "Pass", E: "Fair", F: "Fail" };
const finalGradeComments = {
  A: "Excellent performance", B: "Very good performance", C: "Good performance",
  D: "Pass – Warning", E: "Probation", F: "Fail"
};

// =====================================================================
// TAHFIZ REPORT – FIXED ALIGNMENT WITH COLUMN WIDTHS
// =====================================================================

// Helper to fix RTL brackets in PDF
function processRtlText(text) {
  // Wrap (number) in <span dir="ltr"> to fix bracket rendering
  return text.replace(/:\s*\((\d+)\)/g, ': <span dir="ltr">($1)</span>');
}

// PERFECT TAHFIZ REPORT – EXACTLY LIKE ADMIN VERSION
window.generateTahfizReport = async (studentId) => {
  const student = currentReportStudentsData.find(s => s.student_id === studentId);
  if (!student) return alert("Student not loaded.");

  const previewBody = document.getElementById("tahfizPreviewBody");
  previewBody.innerHTML = `<div class="text-center py-40"><div class="spinner-border text-emerald-600 w-32 h-32"></div><p class="mt-10 text-4xl font-bold text-emerald-700">Generating Tahfiz Report...</p></div>`;
  new bootstrap.Modal(document.getElementById("tahfizPreviewModal")).show();

  try {
    const res = await fetch(`/api/tahfiz-report?student_id=${studentId}&session=${student.session}&term=${student.term}&section_id=${student.sectionId}&class_id=${student.classId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "No Tahfiz data");
    const t = data.data;
    window.currentTahfizData = { ...t, student };

    const attendance = await getCumulativeAttendance(studentId, student.session, student.term);
    const finalGrade = (t.final_grade ?? "F").toUpperCase();

    const rows = (t.daily_records || []).map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fff9' : 'white'};">
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${r.week ? "Week " + r.week + " - " : ""}${r.assessed_day || r.day || "N/A"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.from_surah_ayah ?? r.from_ayah ?? "-")}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.to_surah_ayah ?? r.to_ayah ?? "-")}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:#065f46;">${r.daily_grade ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${dailyGradeComments[r.daily_grade] ?? "-"}</td>
      </tr>`).join("");

    previewBody.innerHTML = `
      <div id="tahfizPrintArea" style="font-family:Arial,sans-serif; max-width:210mm; margin:0 auto; padding:20px; background:white;">
        <div style="text-align:center; padding:20px 0 30px; border-bottom:4px double #d0e8d8; margin-bottom:30px;">
          <img src="${schoolInfo.logoSrc}" style="width:110px; height:110px; border-radius:50%; border:4px solid #e8f5e9; display:block; margin:0 auto 15px auto;" crossorigin="anonymous">
          <h1 style="margin:0; font-size:32px; font-weight:bold; color:#065f46;">${schoolInfo.name}</h1>
          <p style="margin:8px 0 0; font-size:15px; color:#555;">${schoolInfo.address}<br>Tel: ${schoolInfo.phone}</p>
        </div>

        <h2 style="text-align:center; color:#065f46; font-size:28px; margin:30px 0;">Tahfiz-ul-Qur'an Progress Report</h2>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:30px 0; font-size:15px;">
          <div style="background:#f0fdfc; padding:14px; border-radius:8px;"><strong>Student:</strong> ${t.full_name || student.full_name}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Adm No:</strong> ${student.student_id}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Class:</strong> ${student.class_name}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Session:</strong> ${student.session}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Term:</strong> ${student.term === "1" ? "1st" : student.term === "2" ? "2nd" : "3rd"} Term</div>
          <div style="background:#e8f5e9; padding:14px; border-radius:8px;"><strong>Attendance:</strong> ${attendance.percentage} (${attendance.present}/${attendance.total} days)</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Daily Score:</strong> ${t.daily_score ?? "-"}%</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Exam Score:</strong> ${t.exam_score ?? "-"}%</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Total Score:</strong> ${t.total_score ?? "-"}%</div>
          <div style="background:#e3f2fd; padding:16px; border-radius:10px; text-align:center; font-size:18px; color:#1565c0;"><strong>Final Grade: ${finalGrade}</strong></div>
          <div style="grid-column:1/-1; background:#fffde7; padding:18px; border-radius:10px; border-left:4px solid #fff176;">
            <strong>Comment:</strong> ${finalGradeComments[finalGrade] || "No comment available"}
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin:40px 0;">
          <thead>
            <tr style="background:#e8f5e9; color:#065f46;">
              <th style="padding:15px 12px; text-align:left; font-weight:600;">Week & Day</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">From</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">To</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Grade</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Comment</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:90px; text-align:center;">
          <div style="display:inline-block; border-top:3px solid #333; padding-top:10px; width:300px;">
            <strong style="font-size:17px;">Sadiku Muhammad Ahmad</strong><br>Director
          </div>
        </div>
      </div>`;
  } catch (err) {
    previewBody.innerHTML = `<div style="color:red; text-align:center; padding:80px; font-size:20px;">${err.message}</div>`;
  }
};

// PERFECT COMPLETE REPORT – EXACTLY LIKE ADMIN VERSION
window.generateCompleteReport = async (studentId) => {
  const student = currentReportStudentsData.find(s => s.student_id === studentId);
  if (!student) return alert("Student not loaded.");

  const previewBody = document.getElementById("completeReportPreviewBody");
  previewBody.innerHTML = `<div class="text-center py-40"><div class="spinner-border text-emerald-600 w-32 h-32"></div><p class="mt-10 text-4xl font-bold text-emerald-700">Generating Report...</p></div>`;
  new bootstrap.Modal(document.getElementById("completeReportPreviewModal")).show();

  try {
    const res = await fetch(`/api/student-report?student_id=${studentId}&session=${student.session}&term=${student.term}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "No report data");

    const r = data.data;
    window.currentCompleteReportData = { ...r, student };
    const attendance = await getCumulativeAttendance(studentId, student.session, student.term);

    const subjectRows = (r.subjects || []).map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fff9' : 'white'};">
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${s.subject_name}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.ca1 ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.ca2 ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.exam ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:#065f46;">${s.total ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:${s.grade==='A'?'#065f46':s.grade==='F'?'#c62828':'#333'};">${s.grade ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${dailyGradeComments[s.grade] ?? "-"}</td>
      </tr>`).join("");

    previewBody.innerHTML = `
      <div id="completePrintArea" style="font-family:Arial,sans-serif; max-width:210mm; margin:0 auto; padding:20px; background:white;">
        <div style="text-align:center; padding:20px 0 30px; border-bottom:4px double #d0e8d8; margin-bottom:30px;">
          <img src="${schoolInfo.logoSrc}" style="width:110px; height:110px; border-radius:50%; border:4px solid #e8f5e9; display:block; margin:0 auto 15px auto;" crossorigin="anonymous">
          <h1 style="margin:0; font-size:32px; font-weight:bold; color:#065f46;">${schoolInfo.name}</h1>
          <p style="margin:8px 0 0; font-size:15px; color:#555;">${schoolInfo.address}<br>Tel: ${schoolInfo.phone}</p>
        </div>

        <h2 style="text-align:center; color:#065f46; font-size:28px; margin:30px 0;">End of Term Report Sheet</h2>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:30px 0; font-size:15px;">
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Student:</strong> ${r.full_name}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Adm No:</strong> ${r.student_id}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Class:</strong> ${student.class_name}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Session:</strong> ${student.session}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Term:</strong> ${student.term === "1" ? "1st" : student.term === "2" ? "2nd" : "3rd"} Term</div>
          <div style="background:#e8f5e9; padding:14px; border-radius:8px;"><strong>Attendance:</strong> ${attendance.percentage} (${attendance.present}/${attendance.total} days)</div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin:40px 0;">
          <thead>
            <tr style="background:#e8f5e9; color:#065f46;">
              <th style="padding:15px 12px; text-align:left; font-weight:600;">Subject</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">CA1</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">CA2</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Exam</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Total</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Grade</th>
              <th style="padding:15px 12px; text-align:center; font-weight:600;">Remark</th>
            </tr>
          </thead>
          <tbody>${subjectRows}</tbody>
        </table>

        <div style="margin-top:90px; text-align:center;">
          <div style="display:inline-block; border-top:3px solid #333; padding-top:10px; width:300px;">
            <strong style="font-size:17px;">Sadiku Muhammad Ahmad</strong><br>Director
          </div>
        </div>
      </div>`;
  } catch (err) {
    previewBody.innerHTML = `<div style="color:red; text-align:center; padding:80px; font-size:20px;">${err.message}</div>`;
  }
};
// =====================================================================
// PDF GENERATOR – IMAGE STARTS HIGHER ON PAGE
// =====================================================================
const generatePDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return alert("Content not ready");
  const clone = element.cloneNode(true);
  clone.style.cssText = "position:absolute; left:-9999px; width:210mm; padding:8px 15mm 20mm; background:white; font-size:13px; line-height:1.4;";
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 1.8,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 1000
  });
  document.body.removeChild(clone);

  const imgData = canvas.toDataURL("image/jpeg", 0.85);
  const pdf = new jspdf.jsPDF("p", "mm", "a4");
  const imgWidth = 190;
  const pageHeight = 280;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 2; // ← MOVED UP from 10 to 2!

  pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    position = 2 - pageHeight;
    pdf.addImage(imgData, "JPEG", 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};

// =====================================================================
// DOWNLOAD FUNCTIONS – UNCHANGED
// =====================================================================
window.downloadCurrentTahfizPdf = () => {
  if (!window.currentTahfizData) return alert("Generate Tahfiz report first!");
  generatePDF("tahfizPreviewBody", `${window.currentTahfizData.student?.full_name || "Student"}_Tahfiz_Report.pdf`);
};

window.downloadCurrentCompletePdf = () => {
  if (!window.currentCompleteReportData) return alert("Generate complete report first!");
  generatePDF("completeReportPreviewBody", `${window.currentCompleteReportData.student?.full_name || "Student"}_Report_Sheet.pdf`);
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
// === ATTENDANCE TAB SWITCHING (with Cumulative) ===
const attendanceTabs = {
  take: document.getElementById('attendance-take-section'),
  view: document.getElementById('attendance-view-section'),
  cumulative: document.getElementById('cumulativeAttendanceSection') // must exist in DOM
};

// Unified tab switcher — supports 'take', 'view', 'cumulative'
function switchAttendanceTab(tab) {
  // hide all
  Object.values(attendanceTabs).forEach(el => {
    if (el) el.style.display = 'none';
  });

  // show requested
  if (attendanceTabs[tab]) attendanceTabs[tab].style.display = 'block';

  // clear active classes on the 3 buttons (if present)
  document.getElementById('attendanceTakeBtn')?.classList.remove('active');
  document.getElementById('attendanceViewBtn')?.classList.remove('active');
  document.getElementById('btnShowCumulativeAttendance')?.classList.remove('active');

  // set active for the selected one
  if (tab === 'take') document.getElementById('attendanceTakeBtn')?.classList.add('active');
  if (tab === 'view') document.getElementById('attendanceViewBtn')?.classList.add('active');
  if (tab === 'cumulative') document.getElementById('btnShowCumulativeAttendance')?.classList.add('active');

  // If showing cumulative, load dropdowns (non-blocking)
  if (tab === 'cumulative') {
    // load dropdowns; wrapped in try/catch to avoid breaking UI if function missing
    try { loadStaffCumulativeDropdowns?.(); } catch (e) { console.warn("loadStaffCumulativeDropdowns failed", e); }
  }
}

// Attach click listeners (safe guard addEventListener only if button exists)
document.getElementById('attendanceTakeBtn')?.addEventListener('click', () => switchAttendanceTab('take'));
document.getElementById('attendanceViewBtn')?.addEventListener('click', () => switchAttendanceTab('view'));

// New cumulative button listener — shows cumulative and hides others
document.getElementById('btnShowCumulativeAttendance')?.addEventListener('click', () => switchAttendanceTab('cumulative'));

// === LOAD WEEKLY ATTENDANCE ===
// Load weekly attendance + store the data globally for export
document.getElementById('loadViewAttendanceBtn').addEventListener('click', async () => {
  const classVal = document.getElementById('viewAttendanceClassSelect').value;
  const session = document.getElementById('viewAttendanceSessionSelect').value;
  const term = document.getElementById('viewAttendanceTermSelect').value;
  const week = document.getElementById('viewAttendanceWeekSelect').value;
  if (!classVal || !session || !term || !week) return alert('Please select all fields.');
  const [sectionId, classId] = classVal.split(':'); // we need classId too now
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
      window.currentAttendanceData = []; // clear old data
      return;
    }
    // THIS IS THE KEY LINE
    window.currentAttendanceData = data.data; // store for export
    const weekDays = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
    data.data.forEach(stu => {
      const row = document.createElement('tr');
      let totalPresent = 0;
      let totalDays = 0;
      const dayCells = weekDays.map(day => {
        const status = stu.days[day] || '-';
        if (status === 'Present') totalPresent++;
        if (status === 'Present' || status === 'Absent') totalDays++;
        return `<td class="text-center">${status}</td>`;
      }).join('');
      const percent = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0;
      row.innerHTML = `
        <td>${stu.student_name}</td>
        <td>${stu.student_id || 'N/A'}</td> <!-- show ID -->
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
  const classSelect = document.getElementById("viewAttendanceClassSelect");
  const sessionSelect = document.getElementById("viewAttendanceSessionSelect");
  const termSelect = document.getElementById("viewAttendanceTermSelect");
  const weekSelect = document.getElementById("viewAttendanceWeekSelect");
  const className = classSelect.selectedOptions[0]?.textContent || "Unknown Class";
  const session = sessionSelect.value || "Unknown Session";
  const term = termSelect.selectedOptions[0]?.textContent || "Unknown Term";
  const week = weekSelect.value || "Unknown Week";
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
  const classSelect = document.getElementById("viewAttendanceClassSelect");
  const sessionSelect = document.getElementById("viewAttendanceSessionSelect");
  const termSelect = document.getElementById("viewAttendanceTermSelect");
  const weekSelect = document.getElementById("viewAttendanceWeekSelect");
  const className = classSelect.selectedOptions[0]?.textContent || "Unknown Class";
  const session = sessionSelect.value || "Unknown Session";
  const term = termSelect.selectedOptions[0]?.textContent || "Unknown Term";
  const week = weekSelect.value || "Unknown Week";
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

// =============================================
// MEMORIZATION VIDEOS – FINAL & PERFECT (FULL CODE)
// No filter by default | Shows 4 latest videos instantly | Optional filtering
// =============================================


// Load all uploaded videos for this staff
async function loadAllVideos() {
  try {
    const resp = await fetch(`/api/memorization-videos/${currentStaffId}`);
    const result = await resp.json();

    if (result.success && result.data) {
      allVideos = result.data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    } else {
      allVideos = [];
    }
    renderVideos();
  } catch (e) {
    console.error("Error loading videos:", e);
    document.getElementById("videoGrid").innerHTML = '<p class="text-center text-red-600">Failed to load videos</p>';
  }
}

// Load Session & Class dropdowns for filters — SAME DATA AS UPLOAD FORM
async function loadStaffFilters() {
  try {
    const resp = await fetch(`/api/staff-classes-sessions/${currentStaffId}`);
    const result = await resp.json();

    if (!result.success || !result.sessions || !result.classes) {
      console.warn("No classes/sessions returned for filters");
      return;
    }

    const sessionSelect = document.getElementById("filterSession");
    const classSelect = document.getElementById("filterClass");

    // Populate Sessions
    sessionSelect.innerHTML = '<option value="">All Sessions</option>';
    result.sessions.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      sessionSelect.appendChild(opt);
    });

    // Populate Classes
    classSelect.innerHTML = '<option value="">All Classes</option>';
    result.classes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.value;
      opt.textContent = c.name;
      classSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load filter dropdowns:", err);
  }
}

// Render gallery — filtering ONLY when user clicks "Apply Filter"
function renderVideos() {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";

  let videosToShow = allVideos;

  // Apply filters only if user has clicked "Apply Filter"
  if (filtersApplied) {
    const sessionF = document.getElementById("filterSession").value;
    const termF = document.getElementById("filterTerm").value;
    const weekF = document.getElementById("filterWeek").value;
    const classF = document.getElementById("filterClass").value;

    if (sessionF) videosToShow = videosToShow.filter(v => v.session === sessionF);
    if (termF) videosToShow = videosToShow.filter(v => v.term == termF);
    if (weekF) videosToShow = videosToShow.filter(v => v.week == weekF);
    if (classF) {
      const [section_id, class_id] = classF.split(':');
      videosToShow = videosToShow.filter(v => 
        v.section_id == section_id && String(v.class_id) === class_id
      );
    }
  }

  const toShow = videosToShow.slice(0, visibleCount);

  if (toShow.length === 0) {
    const message = filtersApplied 
      ? "No videos match the selected filters."
      : "No videos uploaded yet.";
    grid.innerHTML = `<p class="text-center text-gray-500 col-span-4 py-20 text-xl">${message}</p>`;
    document.getElementById("loadMoreBtn").classList.add("hidden");
    document.getElementById("showLessBtn").classList.add("hidden");
    return;
  }

  toShow.forEach(video => {
  const videoDay = video.day || "N/A";
  const card = document.createElement("div");
  card.className = "bg-black rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-2xl transition relative"; // ← Black background + better shadow

  card.innerHTML = `
    <video class="w-full h-56 object-cover" controls preload="metadata" playsinline>
      <source src="${video.video_url}" type="video/mp4">
      Your browser does not support HTML5 video.
    </video>
    <div class="p-4 bg-gradient-to-t from-black/90 to-transparent text-white"> <!-- ← Dark overlay for text -->
      <p class="font-bold text-emerald-400 text-lg">${video.class_name}</p>
      <p class="text-sm opacity-90">${video.session}</p>
      <p class="text-xs opacity-80">Term ${video.term} • Week ${video.week} • Day ${videoDay}</p>
      <p class="text-sm font-semibold text-emerald-300 mt-2">${video.from_ayah} → ${video.to_ayah}</p>
      <button class="btn btn-danger btn-sm mt-3 delete-btn">Delete</button>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("delete-btn")) openVideoModal(video);
  });

  card.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteVideo(video.id);
  });

  grid.appendChild(card);
});
  const hasMore = visibleCount < videosToShow.length;
  document.getElementById("loadMoreBtn").classList.toggle("hidden", !hasMore);
  document.getElementById("showLessBtn").classList.toggle("hidden", visibleCount <= 4);
}

// Open video modal
function openVideoModal(video) {
  const videoDay = video.day || "N/A";

  document.getElementById("videoSessionInfo").textContent = video.session;
  document.getElementById("videoTermInfo").textContent = `Term ${video.term}`;
  document.getElementById("videoWeekInfo").textContent = `Week ${video.week} • Day ${videoDay}`;
  document.getElementById("videoClassInfo").textContent = video.class_name;
  document.getElementById("videoAyatInfo").textContent = `${video.from_ayah} → ${video.to_ayah}`;

  const player = document.getElementById("modalVideoPlayer");
  player.src = video.video_url;
  player.load();
  player.pause();

  document.getElementById("deleteVideoBtn").onclick = () => deleteVideo(video.id);

  new bootstrap.Modal(document.getElementById("videoModal")).show();
}

// Delete video
async function deleteVideo(id) {
  if (!confirm("Are you sure you want to delete this video permanently?")) return;

  try {
    const resp = await fetch(`/api/delete-memorization-video/${id}/${currentStaffId}`, {
      method: "DELETE"
    });
    const res = await resp.json();

    if (res.success) {
      alert("Video deleted successfully");
      visibleCount = 4;
      filtersApplied = false;
      await loadAllVideos();
      const modalEl = document.getElementById("videoModal");
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } else {
      alert("Delete failed: " + (res.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting video");
  }
}

// Upload form — your original working code
document.getElementById("videoUploadForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const classVal = document.getElementById("videoClassSelect").value;
  const session = document.getElementById("videoSessionSelect").value;
  const term = document.getElementById("videoTermSelect").value;
  const week = document.getElementById("videoWeekSelect").value;
  const day = document.getElementById("videoDaySelect").value;
  const file = document.getElementById("videoFile").files[0];
  const ayatText = document.getElementById("videoAyatRangeDisplay").textContent.trim();

  if (!classVal || !session || !term || !week || !day || !file) {
    alert("Please fill all fields");
    return;
  }

  if (!ayatText || ayatText.includes("No ayat") || !ayatText.includes("→")) {
    alert("Please select a valid ayat range (Week + Day)");
    return;
  }

  const [section_id, class_id] = classVal.split(":");
  const [from_ayah, to_ayah] = ayatText.split(" → ").map(s => s.trim());

  const formData = new FormData();
  formData.append("class_id", class_id);
  formData.append("section_id", section_id);
  formData.append("session", session);
  formData.append("term", term);
  formData.append("week", week);
  formData.append("day", day);
  formData.append("from_ayah", from_ayah);
  formData.append("to_ayah", to_ayah);
  formData.append("video", file);

  try {
    const resp = await fetch("/api/upload-memorization-video", {
      method: "POST",
      body: formData
    });
    const res = await resp.json();

    if (res.success) {
      alert("Video uploaded successfully!");
      document.getElementById("videoUploadForm").reset();
      document.getElementById("videoAyatRangeSection").style.display = "none";
      visibleCount = 4;
      filtersApplied = false;
      await loadAllVideos();
    } else {
      alert("Upload failed: " + (res.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Network error — please try again");
  }
});

// Load More / Show Less
document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
  visibleCount += 8;
  renderVideos();
});

document.getElementById("showLessBtn")?.addEventListener("click", () => {
  visibleCount = 4;
  renderVideos();
});

// Apply Filter — turns filtering ON
document.getElementById("applyFilterBtn")?.addEventListener("click", () => {
  visibleCount = 4;
  filtersApplied = true;
  renderVideos();
});

// FINAL & 100% WORKING – VIDEOS ALWAYS SHOW AFTER REFRESH
function switchView(view) {
  originalSwitchView(view);  // Keeps all your tab logic

  if (view === "videos") {
    visibleCount = 4;
    filtersApplied = false;
    loadAllVideos();  // ← THIS LINE IS THE FINAL FIX – loads videos every time!
  }
}// =============================================
// STAFF CUMULATIVE ATTENDANCE — UPDATED & WORKING
// Handles staff access, avoids 403/404, mirrors admin behavior
// =============================================
let cumulativeAttendanceData = [];

// Load dropdown copies from existing session/class selects
async function loadStaffCumulativeDropdowns() {
  try {
    const sourceSession = document.getElementById("attendanceSessionSelect") ||
                          document.getElementById("viewAttendanceSessionSelect");
    const targetSession = document.getElementById("cumulativeSessionSelect");
    if (sourceSession && targetSession) targetSession.innerHTML = sourceSession.innerHTML;

    const sourceClass = document.getElementById("attendanceClassSelect") ||
                        document.getElementById("viewAttendanceClassSelect");
    const targetClass = document.getElementById("cumulativeClassSelect");
    if (sourceClass && targetClass) targetClass.innerHTML = sourceClass.innerHTML;

    // Preserve current selected session if any
    try {
      const curSel = sourceSession?.querySelector("option[selected]")?.value || sourceSession?.value;
      if (curSel && targetSession) targetSession.value = curSel;
    } catch (e) { /* ignore */ }

    console.log("Cumulative dropdowns loaded.");
  } catch (err) {
    console.error("Error loading cumulative dropdowns:", err);
  }
}

// Helper to get cleaned class name for exports
function getCleanClassName(selectId) {
  const sel = document.getElementById(selectId);
  return sel?.selectedOptions?.[0]?.textContent?.trim() || "Unknown_Class";
}

// Load cumulative attendance for the current staff
async function loadCumulativeAttendance() {
  const classSelect = document.getElementById("cumulativeClassSelect");
  const sessionSelect = document.getElementById("cumulativeSessionSelect");
  const termSelect = document.getElementById("cumulativeTermSelect");
  const weekSelect = document.getElementById("cumulativeUpToWeekSelect");

  const classValue = classSelect?.value;
  const session = sessionSelect?.value;
  const term = termSelect?.value;
  const upToWeek = weekSelect?.value;

  if (!classValue || !session || !term || !upToWeek) {
    return alert("Please select Class, Session, Term, and Week.");
  }

  const actualClassId = (classValue.includes(':') ? classValue.split(':')[1] : classValue);
  if (!actualClassId) return alert("Invalid class selected.");

  const tbody = document.getElementById("cumulativeTableBody");
  if (!tbody) return console.warn("Missing cumulativeTableBody in DOM.");

  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><div class="spinner-border"></div> Loading...</td></tr>`;

  try {
    if (!currentStaffId) throw new Error("Staff ID not found. Please login again.");

    const res = await fetch(
      `/api/staff-cumulative-attendance/${currentStaffId}?class_id=${encodeURIComponent(actualClassId)}&session=${encodeURIComponent(session)}&term=${encodeURIComponent(term)}&up_to_week=${encodeURIComponent(upToWeek)}`
    );

    if (!res.ok) {
      if (res.status === 403) throw new Error("You are not assigned to this class.");
      else throw new Error(`Server returned ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.data || json.data.length === 0) {
      cumulativeAttendanceData = [];
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-8">No attendance available up to Week ${upToWeek}</td></tr>`;
      return;
    }

    cumulativeAttendanceData = json.data;
    tbody.innerHTML = "";

    cumulativeAttendanceData.forEach(s => {
      const studentName = s.student_name || "N/A";
      const studentId = s.student_id || "N/A";
      const totalDays = s.total_days || 0;
      const totalPresent = s.total_present || 0;
      const percentage = s.percentage || "0%";

      tbody.innerHTML += `
        <tr>
          <td class="font-medium">${escapeHtml(studentName)}</td>
          <td>${escapeHtml(studentId)}</td>
          <td>${totalDays}</td>
          <td class="text-green-600 font-bold">${totalPresent}</td>
          <td class="font-bold text-blue-600">${percentage}</td>
        </tr>`;
    });

  } catch (err) {
    console.error("Failed to load cumulative attendance:", err);
    cumulativeAttendanceData = [];
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading data: ${escapeHtml(err.message || String(err))}</td></tr>`;
  }
}

// Export to Excel
function exportCumulativeExcel() {
  if (!cumulativeAttendanceData.length) return alert("Load data first!");
  const className = getCleanClassName("cumulativeClassSelect");
  const session = document.getElementById("cumulativeSessionSelect")?.value || "";
  const term = document.getElementById("cumulativeTermSelect")?.selectedOptions?.[0]?.textContent || "";
  const upToWeek = document.getElementById("cumulativeUpToWeekSelect")?.value || "";

  const header = [
    [schoolInfo.name],
    [schoolInfo.address],
    [`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`],
    [""],
    ["CUMULATIVE ATTENDANCE REPORT"],
    [`Class: ${className} | Up to Week ${upToWeek} | Term: ${term} | Session: ${session}`],
    [""],
    ["Student Name", "Student ID", "Total Days", "Present", "Percentage"]
  ];

  const rows = cumulativeAttendanceData.map(s => [s.student_name, s.student_id, s.total_days, s.total_present, s.percentage]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cumulative");
  XLSX.writeFile(wb, `Cumulative_Attendance_${className.replace(/\s+/g,'_')}_Week${upToWeek}_${term}_${session}.xlsx`);
}

// Export to PDF
function exportCumulativePdf() {
  if (!cumulativeAttendanceData.length) return alert("Load data first!");
  const className = getCleanClassName("cumulativeClassSelect");
  const session = document.getElementById("cumulativeSessionSelect")?.value || "";
  const term = document.getElementById("cumulativeTermSelect")?.selectedOptions?.[0]?.textContent || "";
  const upToWeek = document.getElementById("cumulativeUpToWeekSelect")?.value || "";

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const logo = new Image();
  logo.src = schoolInfo.logoSrc || "";

  const draw = () => {
    try { if (logo.src) doc.addImage(logo, "JPEG", pageWidth/2 - 15, 10, 30, 30); } catch (e) {}
    doc.setFontSize(18).setFont("helvetica", "bold").text(schoolInfo.name, pageWidth/2, 48, { align: "center" });
    doc.setFontSize(10).text(schoolInfo.address, pageWidth/2, 56, { align: "center" });
    doc.text(`Tel: ${schoolInfo.phone} | Email: ${schoolInfo.email}`, pageWidth/2, 62, { align: "center" });
    doc.setFontSize(14).setFont("helvetica", "bold").text("CUMULATIVE ATTENDANCE REPORT", pageWidth/2, 76, { align: "center" });
    doc.setFontSize(11).text(`Class: ${className} | Week ${upToWeek} | ${term}, ${session}`, pageWidth/2, 84, { align: "center" });

    const head = [["Name", "ID", "Total Days", "Present", "Percentage"]];
    const body = cumulativeAttendanceData.map(s => [s.student_name, s.student_id, s.total_days, s.total_present, s.percentage]);

    doc.autoTable({ startY: 95, head, body, theme: "grid" });
    doc.save(`Cumulative_Attendance_${className.replace(/\s+/g,'_')}_Week${upToWeek}_${term}_${session}.pdf`);
  };

  logo.onload = draw;
  logo.onerror = draw;
}

// Escape HTML utility
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"'`=\/]/g, function (s) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '=': '&#x3D;', '`': '&#x60;' })[s];
  });
}

// Initialize cumulative events
function initCumulativeAttendance() {
  document.getElementById("loadCumulativeBtn")?.addEventListener("click", loadCumulativeAttendance);
  document.getElementById("exportCumulativeExcel")?.addEventListener("click", exportCumulativeExcel);
  document.getElementById("exportCumulativePdf")?.addEventListener("click", exportCumulativePdf);
  document.getElementById("btnShowCumulativeAttendance")?.addEventListener("click", () => switchAttendanceTab('cumulative'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCumulativeAttendance);
} else {
  initCumulativeAttendance();
}
