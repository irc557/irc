// reports.js - FINAL VERSION (CLASS NAME FIXED + SOFT COLORS + PERFECT PDF)

const schoolInfo = {
  name: "Ibadurrahman College",
  address: "No. 1968 A, Gwammaja Housing Estate, Audu Wawu Street, opp. Ihya'ussunnah Juma'a Mosque, Dala L.G.A, Kano State, Nigeria.",
  phone: "08033459721, 09062171496",
  email: "info@irc.com.ng",
  logoSrc: "assets/images/logo.jpeg",
};

const dailyGradeComments = { A: "Excellent", B: "Very good", C: "Good", D: "Pass", E: "Fair", F: "Fail" };
const finalGradeComments = { A: "Excellent performance", B: "Very good performance", C: "Good performance", D: "Pass – Warning", E: "Probation", F: "Fail" };

let currentStudents = [];
let currentTahfizData = null;
let currentCompleteReportData = null;
let allClassesMap = new Map(); // ← THIS WILL STORE section_id:class_id → class name

document.addEventListener("DOMContentLoaded", async () => {
  await loadAllClasses();     // This now also builds the map
  await loadAllSessions();
  setupEventListeners();
});

async function loadAllClasses() {
  try {
    const res = await fetch("/api/public/classes");
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById("filterClass");
      select.innerHTML = '<option value="">-- Select Class --</option>';

      data.data.forEach((cls) => {
        const key = `${cls.section_id}:${cls.class_id}`;
        allClassesMap.set(key, cls.name); // Save for later lookup

        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = cls.name;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Error loading classes:", e);
  }
}

async function loadAllSessions() {
  try {
    const res = await fetch("/api/public/sessions");
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById("filterSession");
      select.innerHTML = '<option value="">-- Select Session --</option>';
      data.data.forEach((session) => {
        const opt = document.createElement("option");
        opt.value = session.session_year;
        opt.textContent = session.session_year;
        if (session.is_current) opt.selected = true;
        select.appendChild(opt);
      });
    }
  } catch (e) {
    console.error("Error loading sessions:", e);
  }
}

function setupEventListeners() {
  document.getElementById("loadStudentsBtn").addEventListener("click", loadStudents);
  document.getElementById("downloadTahfizPdf").addEventListener("click", downloadCurrentTahfizPdf);
  document.getElementById("downloadCompletePdf").addEventListener("click", downloadCurrentCompletePdf);
}

async function loadStudents() {
  const classVal = document.getElementById("filterClass").value;
  const session = document.getElementById("filterSession").value;
  const term = document.getElementById("filterTerm").value;
  if (!classVal || !session || !term) return alert("Please select Class, Session, and Term");

  showSpinner(true);
  try {
    const [sectionId, classId] = classVal.split(":");
    const res = await fetch(`/api/public/students?class_id=${classId}&section_id=${sectionId}&session=${session}&term=${term}`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      currentStudents = data.data.map(s => ({
        ...s,
        session,
        term,
        sectionId,
        classId,
        class_name: allClassesMap.get(classVal) || "Unknown Class" // ADD CLASS NAME HERE
      }));
      populateStudentsTable();
      document.getElementById("resultsSection").style.display = "block";
    } else {
      alert("No students found");
      document.getElementById("resultsSection").style.display = "none";
    }
  } catch (e) {
    console.error(e);
    alert("Error loading students");
  } finally {
    showSpinner(false);
  }
}

function populateStudentsTable() {
  const tbody = document.getElementById("studentsTableBody");
  tbody.innerHTML = "";
  currentStudents.forEach((student, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td class="fw-bold">${student.full_name}</td>
      <td>${student.student_id}</td>
      <td>
        <button class="btn btn-sm btn-success me-2" onclick="generateTahfizReport('${student.student_id}')">Tahfiz</button>
        <button class="btn btn-sm btn-primary" onclick="generateCompleteReport('${student.student_id}')">Complete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function processRtlText(text) {
  return text?.replace(/:\s*\((\d+)\)/g, ': <span dir="ltr">($1)</span>') || "-";
}

async function getCumulativeAttendance(studentId, session, term) {
  try {
    const classVal = document.getElementById("filterClass").value;
    if (!classVal) return { percentage: "N/A", present: 0, total: 0 };
    const [sectionId, classId] = classVal.split(":");
    const res = await fetch(`/api/staff-cumulative-attendance/1?class_id=${classId}&session=${session}&term=${term}`);
    if (!res.ok) return { percentage: "N/A", present: 0, total: 0 };
    const json = await res.json();
    if (json.success && json.data) {
      const stu = json.data.find(s => s.student_id === studentId);
      if (stu) return {
        percentage: stu.percentage || "0%",
        present: stu.total_present || 0,
        total: stu.total_days || 0
      };
    }
    return { percentage: "0%", present: 0, total: 0 };
  } catch (e) {
    return { percentage: "Error", present: 0, total: 0 };
  }
}

// TAHFIZ REPORT - CLASS NAME NOW SHOWS CORRECTLY
window.generateTahfizReport = async (studentId) => {
  const student = currentStudents.find(s => s.student_id === studentId);
  if (!student) return alert("Student not found");

  const modal = new bootstrap.Modal(document.getElementById("tahfizReportModal"));
  const body = document.getElementById("tahfizReportBody");
  body.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-success"></div><p>Generating...</p></div>';
  modal.show();

  try {
    const res = await fetch(`/api/public/tahfiz-report?student_id=${studentId}&session=${student.session}&term=${student.term}&section_id=${student.sectionId}&class_id=${student.classId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "No data");

    const t = data.data;
    currentTahfizData = { ...t, student };
    const attendance = await getCumulativeAttendance(studentId, student.session, student.term);
    const finalGrade = (t.final_grade ?? "F").toUpperCase();

    const rows = (t.daily_records || []).map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fff9' : 'white'};">
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${r.week ? "Week " + r.week + " - " : ""}${r.day || "N/A"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.from_surah_ayah)}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.to_surah_ayah)}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:#065f46;">${r.daily_grade ?? "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${dailyGradeComments[r.daily_grade] ?? "-"}</td>
      </tr>`).join("");

    body.innerHTML = `
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
    body.innerHTML = `<div style="color:red; text-align:center; padding:50px;">Error: ${err.message}</div>`;
  }
};

// COMPLETE REPORT - CLASS NAME ALSO FIXED
window.generateCompleteReport = async (studentId) => {
  const student = currentStudents.find(s => s.student_id === studentId);
  if (!student) return alert("Student not found");

  const modal = new bootstrap.Modal(document.getElementById("completeReportModal"));
  const body = document.getElementById("completeReportBody");
  body.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Generating...</p></div>';
  modal.show();

  try {
    const res = await fetch(`/api/public/complete-report?student_id=${studentId}&session=${student.session}&term=${student.term}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "No data");

    const r = data.data;
    currentCompleteReportData = { ...r, student };
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

    body.innerHTML = `
      <div id="completePrintArea" style="font-family:Arial,sans-serif; max-width:210mm; margin:0 auto; padding:20px; background:white;">
        <!-- Same header as Tahfiz -->
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
    body.innerHTML = `<div style="color:red; text-align:center; padding:50px;">Error: ${err.message}</div>`;
  }
};

// PDF GENERATION (100% WORKING WITH HTML2CANVAS + JSPDF)
const generatePDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return alert("Content not ready");

  // Wait for all images inside the element to load
  const images = element.querySelectorAll("img");
  await Promise.all(Array.from(images).map(img => {
    if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
    return new Promise(resolve => { img.onload = img.onerror = resolve; });
  }));

  // Clone element to avoid messing up layout & set fixed width for PDF
  const clone = element.cloneNode(true);
  clone.style.cssText = "position:absolute; left:-9999px; width:210mm; padding:8px 15mm 20mm; background:white; font-size:13px; line-height:1.4;";
  document.body.appendChild(clone);

  // Render the clone to canvas
  const canvas = await html2canvas(clone, {
    scale: 1.8,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 1000
  });
  document.body.removeChild(clone);

  // Convert canvas to image
  const imgData = canvas.toDataURL("image/jpeg", 0.85);

  // Initialize jsPDF
  const pdf = new jspdf.jsPDF("p", "mm", "a4");
  const imgWidth = 190; // Width inside A4 page
  const pageHeight = 280; // Approx height of A4 page
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 2; // Start slightly down

  // Add first page
  pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add additional pages if content exceeds one page
  while (heightLeft > 0) {
    pdf.addPage();
    position = -pageHeight + 2;
    pdf.addImage(imgData, "JPEG", 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Save the PDF
  pdf.save(filename);
};

window.downloadCurrentTahfizPdf = () => {
  if (!currentTahfizData) return alert("Generate Tahfiz report first!");
  const name = (currentTahfizData.student?.full_name || "Student").replace(/[^a-zA-Z0-9]/g, "_");
  generatePDF("tahfizPrintArea", `${name}_Tahfiz_${currentTahfizData.student.session.replace("/", "-")}_${currentTahfizData.student.term}.pdf`);
};

window.downloadCurrentCompletePdf = () => {
  if (!currentCompleteReportData) return alert("Generate Complete report first!");
  const name = (currentCompleteReportData.student?.full_name || "Student").replace(/[^a-zA-Z0-9]/g, "_");
  generatePDF("completePrintArea", `${name}_Report_${currentCompleteReportData.student.session.replace("/", "-")}_${currentCompleteReportData.student.term}.pdf`);
};

function showSpinner(show) {
  document.getElementById("overlay").style.display = show ? "block" : "none";
  document.getElementById("spinner").style.display = show ? "block" : "none";
}