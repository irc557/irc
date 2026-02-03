// School Info for Reports
const schoolInfo = {
  name: "Al-Azhar Academy",
  address: "123 School Street, City",
  phone: "+234 (0) 123 456 7890",
  logoSrc: "/uploads/school_logo.png",
}

const finalGradeComments = {
  A: "Excellent performance",
  B: "Very good performance",
  C: "Good performance",
  D: "Fair performance",
  E: "Needs improvement",
  F: "Poor performance",
}

const dailyGradeComments = {
  A: "Perfect",
  B: "Very Good",
  C: "Good",
  D: "Fair",
  E: "Needs Improvement",
  F: "Poor",
}

let currentStudents = []
let currentTahfizData = null
let currentCompleteReportData = null

// Declare bootstrap and html2pdf variables
const bootstrap = window.bootstrap
const html2pdf = window.html2pdf

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadAllClasses()
  await loadAllSessions()
  setupEventListeners()
})

async function loadAllClasses() {
  try {
    const res = await fetch("/api/public/classes")
    const data = await res.json()
    if (data.success) {
      const select = document.getElementById("filterClass")
      select.innerHTML = '<option value="">-- Select Class --</option>'
      data.data.forEach((cls) => {
        const opt = document.createElement("option")
        opt.value = `${cls.section_id}:${cls.class_id}`
        opt.textContent = cls.name
        select.appendChild(opt)
      })
    }
  } catch (e) {
    console.error("Error loading classes:", e)
  }
}

async function loadAllSessions() {
  try {
    const res = await fetch("/api/public/sessions")
    const data = await res.json()
    if (data.success) {
      const select = document.getElementById("filterSession")
      select.innerHTML = '<option value="">-- Select Session --</option>'
      data.data.forEach((session) => {
        const opt = document.createElement("option")
        opt.value = session.session_year
        opt.textContent = session.session_year
        if (session.is_current) opt.selected = true
        select.appendChild(opt)
      })
    }
  } catch (e) {
    console.error("[v0] Error loading sessions:", e)
  }
}

function setupEventListeners() {
  document.getElementById("loadStudentsBtn").addEventListener("click", loadStudents)
  document.getElementById("downloadTahfizPdf").addEventListener("click", downloadTahfizPdf)
  document.getElementById("downloadCompletePdf").addEventListener("click", downloadCompletePdf)
}

async function loadStudents() {
  const classVal = document.getElementById("filterClass").value
  const session = document.getElementById("filterSession").value
  const term = document.getElementById("filterTerm").value

  if (!classVal || !session || !term) {
    alert("Please select Class, Session, and Term")
    return
  }

  showSpinner(true)
  try {
    const [sectionId, classId] = classVal.split(":")
    const res = await fetch(
      `/api/public/students?class_id=${classId}&section_id=${sectionId}&session=${session}&term=${term}`,
    )
    const data = await res.json()

    if (data.success && data.data.length > 0) {
      currentStudents = data.data.map((s) => ({
        ...s,
        session,
        term,
        sectionId,
        classId,
      }))

      populateStudentsTable()
      document.getElementById("resultsSection").style.display = "block"
    } else {
      alert("No students found for selected criteria")
      document.getElementById("resultsSection").style.display = "none"
    }
  } catch (e) {
    console.error("Error loading students:", e)
    alert("Error loading students")
  } finally {
    showSpinner(false)
  }
}

function populateStudentsTable() {
  const tbody = document.getElementById("studentsTableBody")
  tbody.innerHTML = ""

  currentStudents.forEach((student, i) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${i + 1}</td>
            <td class="fw-bold">${student.full_name}</td>
            <td>${student.student_id}</td>
            <td>
                <button class="btn btn-sm btn-success me-2" onclick="generateTahfizReport('${student.student_id}')">
                    <i class="fas fa-quran"></i> Tahfiz
                </button>
                <button class="btn btn-sm btn-primary" onclick="generateCompleteReport('${student.student_id}')">
                    <i class="fas fa-file-alt"></i> Complete
                </button>
            </td>
        `
    tbody.appendChild(row)
  })
}

window.generateTahfizReport = async (studentId) => {
  const student = currentStudents.find((s) => s.student_id === studentId)
  if (!student) return alert("Student not found")

  const modal = new bootstrap.Modal(document.getElementById("tahfizReportModal"))
  const body = document.getElementById("tahfizReportBody")
  body.innerHTML =
    '<div class="text-center"><div class="spinner-border text-success"></div><p class="mt-3">Generating Tahfiz Report...</p></div>'
  modal.show()

  try {
    const res = await fetch(
      `/api/public/tahfiz-report?student_id=${studentId}&session=${student.session}&term=${student.term}&section_id=${student.sectionId}&class_id=${student.classId}`,
    )
    const data = await res.json()

    if (!data.success) throw new Error(data.message || "No data")

    const t = data.data
    currentTahfizData = { ...t, student }

    const dailyScore = t.daily_score ?? "-"
    const examScore = t.exam_score ?? "-"
    const totalScore = t.total_score ?? "-"
    const finalGrade = (t.final_grade ?? "F").toUpperCase()

    const rows = (t.daily_records || [])
      .map(
        (r, i) => `
            <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"};">
                <td style="padding:10px 8px; font-size:14px;">${r.week ? "Week " + r.week + " - " : ""}${r.day || "N/A"}</td>
                <td style="padding:10px 8px; font-size:14px; direction: rtl; text-align: right;">${r.from_surah_ayah ?? "-"}</td>
                <td style="padding:10px 8px; font-size:14px; direction: rtl; text-align: right;">${r.to_surah_ayah ?? "-"}</td>
                <td style="padding:10px 8px; text-align:center; font-size:16px; font-weight:bold; color:#065f46;">${r.daily_grade ?? "-"}</td>
                <td style="padding:10px 8px; font-size:14px; color:#555;">${dailyGradeComments[r.daily_grade] ?? "-"}</td>
            </tr>
        `,
      )
      .join("")

    body.innerHTML = `
            <div style="font-family:Arial,sans-serif; line-height:1.5;">
                <h4 style="text-align:center; color:#065f46; margin-bottom:1.5rem;">Tahfiz Report</h4>
                <div style="background:#f0fdf4; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;">
                    <p><strong>Student:</strong> ${t.full_name || student.full_name}</p>
                    <p><strong>Adm No:</strong> ${t.student_id || student.student_id}</p>
                    <p><strong>Session:</strong> ${student.session}</p>
                    <p><strong>Term:</strong> ${student.term}</p>
                    <p><strong>Daily Score:</strong> ${dailyScore}%</p>
                    <p><strong>Exam Score:</strong> ${examScore}%</p>
                    <p><strong>Total Score:</strong> ${totalScore}%</p>
                    <p><strong>Final Grade:</strong> <span style="font-weight:bold; color:#065f46;">${finalGrade}</span></p>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="background:#ecfdf5; color:#065f46;">
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Week & Day</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">From</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">To</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Grade</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Comment</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `
  } catch (err) {
    body.innerHTML = `<div style="color:red; text-align:center; padding:2rem;">${err.message}</div>`
  }
}

window.generateCompleteReport = async (studentId) => {
  const student = currentStudents.find((s) => s.student_id === studentId)
  if (!student) return alert("Student not found")

  const modal = new bootstrap.Modal(document.getElementById("completeReportModal"))
  const body = document.getElementById("completeReportBody")
  body.innerHTML =
    '<div class="text-center"><div class="spinner-border text-primary"></div><p class="mt-3">Generating Complete Report...</p></div>'
  modal.show()

  try {
    const res = await fetch(
      `/api/public/complete-report?student_id=${studentId}&session=${student.session}&term=${student.term}`,
    )
    const data = await res.json()

    if (!data.success) throw new Error(data.message || "No data")

    const r = data.data
    currentCompleteReportData = { ...r, student }

    const subjectRows = (r.subjects || [])
      .map(
        (s, i) => `
            <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"};">
                <td style="padding:10px 8px; font-size:14px;">${s.subject_name}</td>
                <td style="padding:10px 8px; text-align:center;">${s.ca1 ?? "-"}</td>
                <td style="padding:10px 8px; text-align:center;">${s.ca2 ?? "-"}</td>
                <td style="padding:10px 8px; text-align:center;">${s.exam ?? "-"}</td>
                <td style="padding:10px 8px; text-align:center; font-weight:bold;">${s.total ?? "-"}</td>
                <td style="padding:10px 8px; text-align:center; font-weight:bold; color:#065f46;">${s.grade ?? "-"}</td>
            </tr>
        `,
      )
      .join("")

    body.innerHTML = `
            <div style="font-family:Arial,sans-serif; line-height:1.5;">
                <h4 style="text-align:center; color:#065f46; margin-bottom:1.5rem;">Complete Report Sheet</h4>
                <div style="background:#f0fdf4; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;">
                    <p><strong>Student:</strong> ${r.full_name}</p>
                    <p><strong>Adm No:</strong> ${r.student_id}</p>
                    <p><strong>Session:</strong> ${student.session}</p>
                    <p><strong>Term:</strong> ${student.term}</p>
                    <p><strong>Attendance:</strong> ${r.attendance_present || 0} out of ${r.attendance_total || 0} days</p>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="background:#ecfdf5; color:#065f46;">
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Subject</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">CA1</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">CA2</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Exam</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Total</th>
                            <th style="padding:8px; border-bottom:2px solid #065f46;">Grade</th>
                        </tr>
                    </thead>
                    <tbody>${subjectRows}</tbody>
                </table>
            </div>
        `
  } catch (err) {
    body.innerHTML = `<div style="color:red; text-align:center; padding:2rem;">${err.message}</div>`
  }
}

function downloadTahfizPdf() {
  if (!currentTahfizData) return alert("Generate report first")
  const element = document.getElementById("tahfizReportBody")
  const opt = {
    margin: 10,
    filename: `${currentTahfizData.student?.full_name || "Student"}_Tahfiz_Report.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  }
  html2pdf().set(opt).from(element).save()
}

function downloadCompletePdf() {
  if (!currentCompleteReportData) return alert("Generate report first")
  const element = document.getElementById("completeReportBody")
  const opt = {
    margin: 10,
    filename: `${currentCompleteReportData.student?.full_name || "Student"}_Complete_Report.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  }
  html2pdf().set(opt).from(element).save()
}

function showSpinner(show) {
  document.getElementById("overlay").style.display = show ? "block" : "none"
  document.getElementById("spinner").style.display = show ? "block" : "none"
}
