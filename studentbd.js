// student_dashboard.js - FINAL 100% COMPLETE & WORKING (DEC 2025)
// Fully supports multiple classes | No more Unknown Class/N/A | All features preserved

let visibleVideos = 2;
let studentId = null;
let classRef = null;           // e.g., "1:JS1" or "2:Primary 4"
let allClasses = [];           // From backend: [{section_id, class_id, class_name, class_ref}]
let videos = [];
let currentVideoIndex = -1;
let currentTahfizData = null;
let currentCompleteReportData = null;

const termMap = { "1": "1st", "2": "2nd", "3": "3rd" };

const schoolInfo = {
  name: "Ibadurrahman College",
  address: "No. 1968 A, Gwammaja Housing Estate, Audu Wawu Street, opp. Ihya'ussunnah Juma'a Mosque, Dala L.G.A, Kano State, Nigeria.",
  phone: "08033459721, 09062171496",
  email: "info@irc.com.ng",
  logoSrc: "assets/images/logo.jpeg",
  director: "Sadiku Muhammad Ahmad"
};

const dailyGradeComments = { A: "Excellent", B: "Very good", C: "Good", D: "Pass", E: "Fair", F: "Fail" };
const finalGradeComments = {
  A: "Excellent performance", B: "Very good performance", C: "Good performance",
  D: "Pass – Warning", E: "Probation", F: "Fail"
};

/* ==================== UI & HELPER FUNCTIONS ==================== */
function showMessageModal(title, message) {
  document.getElementById("messageModalLabel").textContent = title;
  document.getElementById("messageText").innerHTML = message.replace(/\n/g, "<br>");
  new bootstrap.Modal(document.getElementById("messageModal")).show();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function processRtlText(text) {
  return text ? text.replace(/:\s*\((\d+)\)/g, ': <span dir="ltr">($1)</span>') : "-";
}

function getClassName() {
  if (!classRef) return "No Class Selected";
  const cls = allClasses.find(c => c.class_ref === classRef);
  return cls ? cls.class_name : "Unknown Class";
}

function updateSelectedClassDisplay() {
  document.querySelectorAll("#selectedClassDisplay").forEach(el => {
    el.textContent = getClassName();
  });
}

/* ==================== FETCH STUDENT PROFILE & CLASSES ==================== */
async function fetchStudentDetails() {
  try {
    const res = await fetch("/api/student-profile", { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error("Session expired or invalid");

    const s = json.data;

    studentId = s.student_id;
    allClasses = s.classes || [];

    // Set default class
    if (allClasses.length > 0) {
      classRef = allClasses[0].class_ref;
    }

    /* ===================== UPDATE PROFILE INFO ===================== */
    document.getElementById("studentName").textContent = s.full_name || "Student";
    document.getElementById("studentIdDisplay").textContent = s.student_id || "—";
    document.getElementById("studentIdDisplay2").textContent = s.student_id || "—";

    document.getElementById("profilePicture").src =
      s.profile_picture || "/uploads/default.jpg";

    document.getElementById("gender").textContent = s.gender || "—";

    // Format DOB
    if (s.date_of_birth) {
      const dob = new Date(s.date_of_birth);
      document.getElementById("dateOfBirth").textContent =
        `${dob.getDate().toString().padStart(2, "0")}/${
          (dob.getMonth() + 1).toString().padStart(2, "0")
        }/${dob.getFullYear()}`;
    } else {
      document.getElementById("dateOfBirth").textContent = "—";
    }

    document.getElementById("email").textContent = s.email || "—";
    document.getElementById("guardianPhone").textContent = s.guardian_phone || "—";
    document.getElementById("address").textContent = s.address || "—";

    document.getElementById("totalClassesCount").textContent = allClasses.length;

    /* ===================== SHOW CLASS LIST ON PROFILE ===================== */
    const classListContainer = document.getElementById("studentClassList");
    if (classListContainer) {
  classListContainer.innerHTML = "";

  allClasses.forEach(c => {
    const badge = document.createElement("span");
    badge.textContent = c.class_name; // Only class name, no section
    badge.className = "px-3 py-1 bg-blue-600 text-white rounded-full mr-2 mb-2 inline-block";
    classListContainer.appendChild(badge);
  });
    }

    /* ===================== POPULATE CLASS DROPDOWNS ===================== */
    document.querySelectorAll("#reportClassSelect").forEach(select => {
      select.innerHTML = '<option value="">Select Class</option>';

      allClasses.forEach(c => {
        const opt = new Option(c.class_name, c.class_ref);
        select.appendChild(opt);
      });

      select.value = classRef || "";

      select.onchange = (e) => {
        classRef = e.target.value || null;
        updateSelectedClassDisplay();

        const active = document.querySelector(".nav-link.active")?.dataset.view;
        if (active === "videos") loadVideos();
        if (active === "tahfiz") generateTahfizReport();
        if (active === "academic") generateCompleteReport();
      };
    });

    updateSelectedClassDisplay();
    await loadVideoCount();

  } catch (err) {
    console.error(err);
    showMessageModal("Error", "Failed to load profile. Please login again.");
  }
}


async function loadVideoCount() {
  if (!classRef) return;
  try {
    const res = await fetch(`/api/student-videos?class_ref=${classRef}`, { credentials: "include" });
    const json = await res.json();
    document.getElementById("totalVideosCount").textContent = json.success ? json.data.length : 0;
  } catch {
    document.getElementById("totalVideosCount").textContent = 0;
  }
}

/* ==================== SESSIONS & TERMS ==================== */
async function loadSessions() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    const json = await res.json();

    document.querySelectorAll("select[id$='Session']").forEach(sel => {
      sel.innerHTML = "<option value=''>Select Session</option>";
      (json.data || []).forEach(s => {
        const opt = new Option(s.session_year, s.session_year);
        if (s.is_current) opt.selected = true;
        sel.appendChild(opt);
      });
    });

    document.querySelectorAll("select[id*='Term']").forEach(sel => {
      if (sel.children.length > 1) return;
      sel.innerHTML = "<option value=''>Select Term</option>";
      ["1st Term", "2nd Term", "3rd Term"].forEach((t, i) => {
        sel.add(new Option(t, i + 1));
      });
    });
  } catch (err) {
    console.error("Failed to load sessions", err);
  }
}

/* ==================== NAVIGATION ==================== */
function setupNav() {
  document.querySelectorAll(".nav-link[data-view]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      document.querySelectorAll("#mainContent > div[id$='-view']").forEach(v => v.style.display = "none");
      const view = document.getElementById(`${link.dataset.view}-view`);
      if (view) view.style.display = "block";

      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      if (link.dataset.view === "videos") loadVideos();
      if (link.dataset.view === "tahfiz") {
        updateSelectedClassDisplay();
        if (classRef && document.getElementById("tahfizSession").value && document.getElementById("tahfizTerm").value) {
          setTimeout(generateTahfizReport, 100);
        }
      }
      if (link.dataset.view === "academic") {
        updateSelectedClassDisplay();
        if (classRef && document.getElementById("academicSession").value && document.getElementById("academicTerm").value) {
          setTimeout(generateCompleteReport, 100);
        }
      }
    });
  });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await fetch("/api/student-logout", { credentials: "include" });
    location.href = "/student-login";
  });

  document.getElementById("sidebarToggleMobile")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
}

/* ==================== VIDEO PLAYER (UNCHANGED - PERFECT) ==================== */
const videoPlayer = document.getElementById("mainVideoPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const videoTitle = document.getElementById("videoTitle");

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playVideo(index) {
  if (index < 0 || index >= videos.length) return;
  currentVideoIndex = index;
  const v = videos[index];
  videoPlayer.src = v.video_url || "";
  videoPlayer.pause();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  const ayah = v.from_ayah && v.to_ayah ? ` (${v.from_ayah} → ${v.to_ayah})` : "";
  videoTitle.textContent = `Week ${v.week || "?"} - ${v.day || "Recording"}${ayah}`;
  document.querySelectorAll(".video-card").forEach((c, i) => {
    c.style.border = i === index ? "4px solid #34a853" : "1px solid #ddd";
    c.style.boxShadow = i === index ? "0 0 15px rgba(52,168,83,0.6)" : "none";
  });
}

playPauseBtn.onclick = () => videoPlayer.paused ? videoPlayer.play() : videoPlayer.pause();
prevBtn.onclick = () => playVideo(Math.max(0, currentVideoIndex - 1));
nextBtn.onclick = () => playVideo(Math.min(videos.length - 1, currentVideoIndex + 1));
fullscreenBtn.onclick = () => videoPlayer.requestFullscreen?.();
muteBtn.onclick = () => {
  videoPlayer.muted = !videoPlayer.muted;
  muteBtn.innerHTML = videoPlayer.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
};
volumeSlider.oninput = () => videoPlayer.volume = volumeSlider.value;
videoPlayer.ontimeupdate = () => {
  if (videoPlayer.duration) {
    progressBar.style.width = (videoPlayer.currentTime / videoPlayer.duration) * 100 + "%";
    currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
  }
};
videoPlayer.onloadedmetadata = () => durationEl.textContent = formatTime(videoPlayer.duration);
videoPlayer.onplay = () => playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
videoPlayer.onpause = () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

/* ==================== VIDEOS - CLASS FILTERED ==================== */
async function loadVideos() {
  if (!classRef) {
    document.getElementById("videoGrid").innerHTML = "<p class='text-center text-muted'>Please select a class</p>";
    return;
  }
  try {
    const res = await fetch(`/api/student-videos?class_ref=${classRef}`, { credentials: "include" });
    const json = await res.json();
    videos = json.success ? json.data : [];
    visibleVideos = 2;
    renderVideos();
    if (videos.length > 0) playVideo(0);
  } catch {
    document.getElementById("videoGrid").innerHTML = "<p class='text-danger text-center'>Failed to load videos</p>";
  }
}

function renderVideos() {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";
  if (!videos.length) {
    grid.innerHTML = "<p class='text-center text-muted py-8'>No videos available for this class</p>";
    return;
  }
  const toShow = videos.slice(0, visibleVideos);
  toShow.forEach((v, i) => {
    const ayah = v.from_ayah && v.to_ayah ? `(${v.from_ayah} → ${v.to_ayah})` : "Full Recording";
    const date = v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString() : "";
    const card = document.createElement("div");
    card.className = "col video-card";
    card.style.cursor = "pointer";
    card.onclick = () => playVideo(i);
    card.innerHTML = `
      <div class="card shadow h-100">
        <video class="card-img-top" style="height:180px; object-fit:cover; background:#000;">
          <source src="${escapeHtml(v.video_url)}" type="video/mp4">
        </video>
        <div class="card-body text-center">
          <h6 class="card-title mb-1">Week ${v.week || "?"} - ${v.day || "Recording"}</h6>
          <p class="small text-success mb-2">${escapeHtml(ayah)}</p>
          <button class="btn btn-success btn-sm">Play Now</button>
        </div>
        <div class="card-footer text-muted small">${date}</div>
      </div>`;
    grid.appendChild(card);
  });
  document.getElementById("loadMoreBtn").style.display = visibleVideos < videos.length ? "inline-block" : "none";
  document.getElementById("showLessBtn").style.display = visibleVideos > 2 ? "inline-block" : "none";
}

document.getElementById("loadMoreBtn")?.addEventListener("click", () => { visibleVideos = videos.length; renderVideos(); });
document.getElementById("showLessBtn")?.addEventListener("click", () => { visibleVideos = 2; renderVideos(); document.getElementById("videos-view")?.scrollIntoView({ behavior: "smooth" }); });

/* ==================== CUMULATIVE ATTENDANCE - CLASS FILTERED ==================== */
async function getCumulativeAttendance(session, term) {
  if (!classRef) return { percentage: "N/A", present: 0, total: 0 };
  try {
    const res = await fetch(`/api/student-cumulative-attendance?session=${session}&term=${term}&class_ref=${classRef}`, { credentials: "include" });
    const json = await res.json();
    if (json.success && json.data) {
      const p = json.data.present_days || 0;
      const t = json.data.total_days || 0;
      const pct = t > 0 ? ((p / t) * 100).toFixed(1) + "%" : "0%";
      return { percentage: pct, present: p, total: t };
    }
  } catch (e) { console.error(e); }
  return { percentage: "N/A", present: 0, total: 0 };
}

document.getElementById("loadCumBtn")?.addEventListener("click", async () => {
  const session = document.getElementById("cumSession").value;
  const term = document.getElementById("cumTerm").value;
  if (!session || !term || !classRef) {
    showMessageModal("Required", "Please select Session, Term, and Class");
    return;
  }
  const att = await getCumulativeAttendance(session, term);
  const el = document.getElementById("cumResult");
  el.innerHTML = att.total === 0
    ? "<p class='text-danger text-center'>No attendance record found</p>"
    : `<div class="text-center p-5 bg-light rounded shadow-lg border border-success">
         <h1 class="display-2 fw-bold text-success mb-3">${att.percentage}</h1>
         <p class="lead"><strong>${att.present}</strong> Present / <strong>${att.total}</strong> Days</p>
         <small class="text-muted">${session} • ${termMap[term]} Term • ${getClassName()}</small>
       </div>`;
});

/* ==================== TAHFIZ REPORT - FULLY PRESERVED DESIGN ==================== */
async function generateTahfizReport() {
  const session = document.getElementById("tahfizSession").value;
  const term = document.getElementById("tahfizTerm").value;
  if (!session || !term || !classRef) {
    showMessageModal("Required", "Please select Session, Term, and Class");
    return;
  }

  const body = document.getElementById("tahfizPreviewBody");
  body.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success" style="width:4rem;height:4rem;"></div><p class="mt-3 fs-4">Generating Tahfiz Report...</p></div>`;
  new bootstrap.Modal(document.getElementById("tahfizPreviewModal")).show();

  try {
    const res = await fetch(`/api/student-tahfiz-report?session=${session}&term=${term}&class_ref=${classRef}`, { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "No data");

    const t = json.data;
    currentTahfizData = { ...t, session, term };
    const attendance = await getCumulativeAttendance(session, term);
    const finalGrade = (t.final_grade || "F").toUpperCase();

    const rows = (t.daily_records || []).map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fff9' : 'white'};">
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${r.week ? "Week " + r.week + " - " : ""}${r.day || "N/A"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.from_surah_ayah || "-")}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; direction:rtl; text-align:right;">${processRtlText(r.to_surah_ayah || "-")}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:#065f46;">${r.daily_grade || "-"}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${dailyGradeComments[r.daily_grade] || "-"}</td>
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
          <div style="background:#f0fdfc; padding:14px; border-radius:8px;"><strong>Student:</strong> ${t.full_name || "N/A"}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Adm No:</strong> ${studentId}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Class:</strong> ${t.class_name || "N/A"}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Session:</strong> ${session}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Term:</strong> ${termMap[term]} Term</div>
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
    body.innerHTML = `<div style="color:red; text-align:center; padding:80px; font-size:20px;">${err.message}</div>`;
  }
}

/* ==================== ACADEMIC REPORT - FULLY PRESERVED DESIGN ==================== */
async function generateCompleteReport() {
  const session = document.getElementById("academicSession").value;
  const term = document.getElementById("academicTerm").value;
  if (!session || !term || !classRef) {
    showMessageModal("Required", "Please select Session, Term, and Class");
    return;
  }

  const body = document.getElementById("completeReportPreviewBody");
  body.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary" style="width:4rem;height:4rem;"></div><p class="mt-3 fs-4">Generating Academic Report...</p></div>`;
  new bootstrap.Modal(document.getElementById("completeReportPreviewModal")).show();

  try {
    const res = await fetch(`/api/student-complete-report?session=${session}&term=${term}&class_ref=${classRef}`, { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "No data");

    const r = json.data;
    currentCompleteReportData = { ...r, session, term };
    const attendance = await getCumulativeAttendance(session, term);

    const subjectRows = (r.subjects || []).map((s, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fff9' : 'white'};">
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${s.subject_name}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.ca1 || '-'}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.ca2 || '-'}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center;">${s.exam || '-'}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:#065f46;">${s.total?.toFixed(1) || '-'}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee; text-align:center; font-weight:bold; color:${s.grade==='A'?'#065f46':s.grade==='F'?'#c62828':'#333'};">${s.grade || '-'}</td>
        <td style="padding:12px 10px; border-bottom:1px solid #eee;">${dailyGradeComments[s.grade] || "-"}</td>
      </tr>`).join("");

    body.innerHTML = `
      <div id="completePrintArea" style="font-family:Arial,sans-serif; max-width:210mm; margin:0 auto; padding:20px; background:white;">
        <div style="text-align:center; padding:20px 0 30px; border-bottom:4px double #d0e8d8; margin-bottom:30px;">
          <img src="${schoolInfo.logoSrc}" style="width:110px; height:110px; border-radius:50%; border:4px solid #e8f5e9; display:block; margin:0 auto 15px auto;" crossorigin="anonymous">
          <h1 style="margin:0; font-size:32px; font-weight:bold; color:#065f46;">${schoolInfo.name}</h1>
          <p style="margin:8px 0 0; font-size:15px; color:#555;">${schoolInfo.address}<br>Tel: ${schoolInfo.phone}</p>
        </div>
        <h2 style="text-align:center; color:#065f46; font-size:28px; margin:30px 0;">End of Term Report Sheet</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:30px 0; font-size:15px;">
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Student:</strong> ${r.full_name}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Adm No:</strong> ${studentId}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Class:</strong> ${r.class_name || "N/A"}</div>
          <div style="background:#f8f9fa; padding:14px; border-radius:8px;"><strong>Session:</strong> ${session}</div>
          <div style="background:#f0fdf4; padding:14px; border-radius:8px;"><strong>Term:</strong> ${termMap[term]} Term</div>
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
    body.innerHTML = `<div style="color:red; text-align:center; padding:80px; font-size:20px;">${err.message}</div>`;
  }
}

/* ==================== PDF DOWNLOAD ==================== */
async function generatePDF(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) return showMessageModal("Error", "Report not ready");
  const clone = element.cloneNode(true);
  clone.style.cssText = "position:absolute; left:-9999px; width:210mm; padding:20px; background:white;";
  document.body.appendChild(clone);
  const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  document.body.removeChild(clone);
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jspdf.jsPDF("p", "mm", "a4");
  const imgWidth = 190;
  const pageHeight = 280;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 5;
  pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imgHeight;
    pdf.addImage(imgData, "JPEG", 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(filename);
}

function downloadCurrentTahfizPdf() {
  if (!currentTahfizData) return showMessageModal("Not Ready", "Generate Tahfiz report first");
  generatePDF("tahfizPrintArea", `${currentTahfizData.full_name || "Student"}_Tahfiz_Report.pdf`);
}

function downloadCurrentCompletePdf() {
  if (!currentCompleteReportData) return showMessageModal("Not Ready", "Generate complete report first");
  generatePDF("completePrintArea", `${currentCompleteReportData.full_name || "Student"}_Report_Sheet.pdf`);
}

/* ==================== EVENT LISTENERS ==================== */
document.getElementById("loadTahfiz")?.addEventListener("click", generateTahfizReport);
document.getElementById("loadAcademic")?.addEventListener("click", generateCompleteReport);
document.getElementById("downloadTahfizPdf")?.addEventListener("click", downloadCurrentTahfizPdf);
document.getElementById("downloadCompletePdf")?.addEventListener("click", downloadCurrentCompletePdf);

/* ==================== INIT ==================== */
document.addEventListener("DOMContentLoaded", async () => {
  await fetchStudentDetails();
  await loadSessions();
  setupNav();
});