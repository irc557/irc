// ADMIN VIDEO AND STUDENT MANAGEMENT - UPDATED & FIXED
// - Ensures classes & sessions dropdowns are populated reliably even if scripts load order varies
// - Robust handling of API shapes (class_id, classId, class_name, name, section_name)
// - Auto-initializes video upload UI on DOM ready
// - Keeps original public function exports for compatibility

let adminVideosData = [];
let adminVideosDisplayCount = 0;
const VIDEOS_PER_PAGE = 8;

/* ===========================================================
   Helper: safe JSON property accessor (handles different shapes)
   =========================================================== */
function getProp(obj, ...keys) {
  for (const k of keys) {
    if (obj == null) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return undefined;
}

/* ===========================================================
   VIDEO MANAGEMENT
   =========================================================== */

// Load classes for video upload dropdown
async function loadAdminVideoClasses() {
  console.log('[video] loadAdminVideoClasses()');
  try {
    // try the primary admin endpoint, fall back to admin-video-classes
    const resp = await fetch('/api/admin-classes');
    const data = await resp.json().catch(() => null);

    // fallback if first endpoint not available or returns unexpected shape
    if (!data || !data.success || !Array.isArray(data.data)) {
      console.log('[video] primary /api/admin-classes failed, trying /api/admin-video-classes');
      const r2 = await fetch('/api/admin-video-classes');
      const d2 = await r2.json().catch(() => null);
      if (!d2 || !d2.success || !Array.isArray(d2.data)) {
        console.warn('[video] No classes data available from server.');
        return;
      }
      populateAdminVideoClasses(d2.data);
      return;
    }

    populateAdminVideoClasses(data.data);
  } catch (err) {
    console.error('[video] Error loading classes:', err);
  }
}

function populateAdminVideoClasses(list) {
  const select = document.getElementById('adminVideoClassSelect');
  if (!select) {
    console.warn('[video] adminVideoClassSelect element not found in DOM');
    return;
  }

  // Clear & add placeholder
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select Class';
  select.appendChild(placeholder);

  list.forEach(cls => {
    // support multiple naming conventions from backend
    const section_id = getProp(cls, 'section_id', 'sectionId', 'section') ?? 1;
    const class_id = getProp(cls, 'class_id', 'classId', 'class_id') ?? getProp(cls, 'classId');
    const class_name = getProp(cls, 'class_name', 'className', 'name') || 'Unnamed Class';
    const section_name = getProp(cls, 'section_name') || (section_id === 1 ? 'Tahfiz' : 'Western');

    // ensure class_id exists
    if (class_id == null) return;

    const option = document.createElement('option');
    option.value = `${section_id}:${class_id}`;
    option.textContent = `${class_name} (${section_name})`;
    select.appendChild(option);
  });

  console.log('[video] Classes populated:', select.options.length - 1);
}

// Load sessions for video upload dropdown
async function loadAdminVideoSessions() {
  console.log('[video] loadAdminVideoSessions()');
  try {
    const resp = await fetch('/api/admin-sessions');
    const data = await resp.json().catch(() => null);

    // fallback to /api/admin-sessions (already used) or /api/sessions
    let sessions = null;
    if (data && data.success && Array.isArray(data.data)) {
      sessions = data.data.map(s => {
        // handle both { session_year } and simple array of strings
        if (typeof s === 'string') return { session_year: s };
        return { session_year: getProp(s, 'session_year', 'sessionYear', 'session') || s };
      });
    } else {
      // try generic sessions endpoint
      const r2 = await fetch('/api/sessions');
      const d2 = await r2.json().catch(() => null);
      if (d2 && d2.success && Array.isArray(d2.data)) {
        sessions = d2.data.map(s => ({ session_year: getProp(s, 'session_year', 'sessionYear') || s }));
      }
    }

    if (!sessions) {
      console.warn('[video] No sessions returned by server.');
      return;
    }

    populateAdminVideoSessions(sessions);
  } catch (err) {
    console.error('[video] Error loading sessions:', err);
  }
}

function populateAdminVideoSessions(list) {
  const select = document.getElementById('adminVideoSessionSelect');
  if (!select) {
    console.warn('[video] adminVideoSessionSelect element not found in DOM');
    return;
  }

  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select Session';
  select.appendChild(placeholder);

  list.forEach(s => {
    const sessionYear = getProp(s, 'session_year', 'sessionYear') || s;
    if (!sessionYear) return;
    const option = document.createElement('option');
    option.value = sessionYear;
    option.textContent = sessionYear;
    select.appendChild(option);
  });

  console.log('[video] Sessions populated:', select.options.length - 1);
}

// Initialize video upload form
function initializeAdminVideoUpload() {
  console.log('[video] initializeAdminVideoUpload()');
  const form = document.getElementById('adminVideoUploadForm');
  if (!form) {
    console.warn('[video] adminVideoUploadForm not found');
    return;
  }

  // prevent duplicate handlers
  form.removeEventListener('submit', handleAdminVideoUpload);
  form.addEventListener('submit', handleAdminVideoUpload);

  const daySelect = document.getElementById('adminVideoDaySelect');
  const ayatSection = document.getElementById('adminVideoAyatRangeSection');

  if (daySelect && ayatSection) {
    daySelect.removeEventListener('change', daySelectHandler);
    daySelect.addEventListener('change', daySelectHandler);
  }

  function daySelectHandler() {
    if (!ayatSection) return;
    if (this.value) {
      ayatSection.classList.remove('hidden');
      ayatSection.style.display = 'block';
    } else {
      ayatSection.classList.add('hidden');
      ayatSection.style.display = 'none';
    }
  }
}

// Handle video upload
async function handleAdminVideoUpload(e) {
  e.preventDefault();
  console.log('[video] upload started');

  const classSelect = document.getElementById('adminVideoClassSelect');
  const classValue = classSelect ? classSelect.value : '';
  const session = document.getElementById('adminVideoSessionSelect')?.value || '';
  const term = document.getElementById('adminVideoTermSelect')?.value || '';
  const week = document.getElementById('adminVideoWeekSelect')?.value || '';
  const day = document.getElementById('adminVideoDaySelect')?.value || '';
  const fromAyah = document.getElementById('adminFromAyah')?.value || '';
  const toAyah = document.getElementById('adminToAyah')?.value || '';
  const videoFile = document.getElementById('adminVideoFile')?.files[0];

  if (!classValue || !session || !term || !week || !day || !fromAyah || !toAyah || !videoFile) {
    alert('Please fill all required fields before uploading.');
    return;
  }

  const [sectionId, classId] = classValue.split(':').map(s => s.trim());

  const formData = new FormData();
  formData.append('class_id', classId);
  formData.append('section_id', sectionId);
  formData.append('session', session);
  formData.append('term', term);
  formData.append('week', week);
  formData.append('day', day);
  formData.append('from_ayah', fromAyah);
  formData.append('to_ayah', toAyah);
  formData.append('video', videoFile);

  const submitBtn = document.querySelector('#adminVideoUploadForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.orig = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
  }

  try {
    // Admin upload endpoint on server: /api/admin/upload-memorization-video
    const res = await fetch('/api/admin/upload-memorization-video', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    const json = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
    if (json.success) {
      alert('Video uploaded successfully');
      form.reset();
      const ayatSection = document.getElementById('adminVideoAyatRangeSection');
      if (ayatSection) { ayatSection.style.display = 'none'; ayatSection.classList.add('hidden'); }
      // reload videos and classes/sessions (in case admin updated)
      await loadAdminVideoSessions();
      await loadAdminVideoClasses();
      await loadAdminVideos();
    } else {
      alert('Upload failed: ' + (json.message || 'Unknown error'));
      console.warn('[video] upload response:', json);
    }
  } catch (err) {
    console.error('[video] upload error:', err);
    alert('Error uploading video: ' + err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.orig || 'Upload Video';
    }
  }
}

// Load all videos (admin view - uses /api/memorization-videos)
async function loadAdminVideos() {
  console.log('[video] loadAdminVideos()');
  try {
    // Use admin endpoint (returns all videos) if available
    const resp = await fetch('/api/memorization-videos');
    const data = await resp.json().catch(() => null);
    if (!data || !data.success || !Array.isArray(data.data)) {
      // fallback to endpoint with staffId is not usable here for admin UI
      console.warn('[video] /api/memorization-videos returned invalid data');
      adminVideosData = [];
    } else {
      adminVideosData = data.data || [];
    }
    adminVideosDisplayCount = 0;
    displayAdminVideos();
  } catch (err) {
    console.error('[video] Error loading videos:', err);
    adminVideosData = [];
    adminVideosDisplayCount = 0;
    displayAdminVideos();
  }
}

// Display videos in grid
function displayAdminVideos() {
  const grid = document.getElementById('adminVideoGrid');
  if (!grid) {
    console.warn('[video] adminVideoGrid not found');
    return;
  }

  // clear when starting over
  if (adminVideosDisplayCount === 0) grid.innerHTML = '';

  if (!adminVideosData || adminVideosData.length === 0) {
    grid.innerHTML = '<div class="col-span-4 text-center text-muted py-10">No videos uploaded yet.</div>';
    const loadMoreBtn = document.getElementById('adminLoadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  const start = adminVideosDisplayCount;
  const end = Math.min(start + VIDEOS_PER_PAGE, adminVideosData.length);

  for (let i = start; i < end; i++) {
    const video = adminVideosData[i];
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-100';
    const className = getProp(video, 'class_name', 'className') || getProp(video, 'class') || 'N/A';
    card.innerHTML = `
      <div class="relative">
        <video class="w-full h-40 object-cover bg-black" preload="metadata">
          <source src="${video.video_url}" type="video/mp4">
        </video>
        <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer" data-video-id="${video.id}">
          <i class="fas fa-play-circle text-white text-5xl opacity-80 hover:opacity-100"></i>
        </div>
      </div>
      <div class="p-4">
        <p class="text-sm text-gray-600"><strong>Class:</strong> ${escapeHtml(className)}</p>
        <p class="text-sm text-gray-600"><strong>Session:</strong> ${escapeHtml(video.session || '')}</p>
        <p class="text-sm text-gray-600"><strong>Term:</strong> ${escapeHtml(video.term || '')} | <strong>Week:</strong> ${escapeHtml(video.week || '')}</p>
        <p class="text-sm text-gray-600"><strong>Day:</strong> ${escapeHtml(video.day || '')}</p>
        <p class="text-emerald-700 font-bold text-sm mt-2">Ayat: ${escapeHtml(String(video.from_ayah || ''))} - ${escapeHtml(String(video.to_ayah || ''))}</p>
        <div class="mt-3 flex gap-2">
          <button class="btn btn-sm btn-primary flex-1 play-btn" data-id="${video.id}"><i class="fas fa-play me-1"></i>Play</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${video.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }

  adminVideosDisplayCount = end;

  // attach delegated listeners for newly added buttons
  grid.querySelectorAll('.play-btn').forEach(btn => {
    btn.removeEventListener('click', playButtonHandler);
    btn.addEventListener('click', playButtonHandler);
  });
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.removeEventListener('click', deleteButtonHandler);
    btn.addEventListener('click', deleteButtonHandler);
  });

  const loadMoreBtn = document.getElementById('adminLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = adminVideosDisplayCount >= adminVideosData.length ? 'none' : 'block';
  }

  function playButtonHandler(e) {
    const id = parseInt(this.dataset.id, 10);
    playAdminVideo(id);
  }
  function deleteButtonHandler(e) {
    const id = parseInt(this.dataset.id, 10);
    deleteAdminVideo(id);
  }
}

// Play video in modal
function playAdminVideo(videoId) {
  const video = adminVideosData.find(v => Number(v.id) === Number(videoId));
  if (!video) {
    console.warn('[video] playAdminVideo: video not found', videoId);
    return;
  }

  const modalEl = document.getElementById('adminVideoModal');
  const videoPlayer = document.getElementById('adminModalVideoPlayer');
  if (!modalEl || !videoPlayer) {
    console.warn('[video] Modal or video player missing');
    return;
  }

  const source = videoPlayer.querySelector('source');
  if (!source) {
    console.warn('[video] video <source> element missing');
    return;
  }

  source.src = video.video_url;
  videoPlayer.load();

  document.getElementById('adminVideoSessionInfo').textContent = video.session || '';
  document.getElementById('adminVideoTermInfo').textContent = 'Term ' + (video.term || '');
  document.getElementById('adminVideoWeekInfo').textContent = 'Week ' + (video.week || '');
  document.getElementById('adminVideoClassInfo').textContent = getProp(video, 'class_name', 'className') || 'N/A';
  document.getElementById('adminVideoAyatInfo').textContent = `Ayat Range: ${video.from_ayah || '-'} - ${video.to_ayah || '-'}`;

  const deleteBtn = document.getElementById('adminDeleteVideoBtn');
  if (deleteBtn) {
    deleteBtn.onclick = function () {
      if (confirm('Delete this video?')) {
        deleteAdminVideo(videoId);
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
    };
  }

  new bootstrap.Modal(modalEl).show();
}

// Delete video
async function deleteAdminVideo(videoId) {
  if (!confirm('Are you sure you want to delete this video?')) return;
  try {
    const res = await fetch(`/api/admin/delete-memorization-video/${videoId}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json().catch(() => ({ success: false, message: 'Invalid JSON' }));
    if (json.success) {
      alert('Video deleted');
      await loadAdminVideos();
    } else {
      alert('Delete failed: ' + (json.message || 'Unknown'));
    }
  } catch (err) {
    console.error('[video] delete error:', err);
    alert('Error deleting video');
  }
}

/* ===========================================================
   STUDENT GENERAL LIST MANAGEMENT (unchanged, slightly hardened)
   =========================================================== */

let allStudentsGeneralData = [];

async function loadStudentGeneralList() {
  try {
    const resp = await fetch('/api/students-general-list', { credentials: 'include' });
    const json = await resp.json().catch(() => ({ success: false, message: 'Invalid response' }));
    if (json.success) {
      allStudentsGeneralData = json.data || [];
      displayStudentGeneralList(allStudentsGeneralData);
    } else {
      document.getElementById('studentGeneralTableBody').innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${escapeHtml(json.message || 'Failed')}</td></tr>`;
    }
  } catch (err) {
    console.error('[students] load error:', err);
    document.getElementById('studentGeneralTableBody').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading students</td></tr>';
  }
}

function displayStudentGeneralList(students) {
  const tbody = document.getElementById('studentGeneralTableBody');
  if (!tbody) return;
  if (!students || students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No students found.</td></tr>';
    return;
  }
  tbody.innerHTML = '';
  students.forEach(student => {
    const tr = document.createElement('tr');
    const statusBadge = student.status === 'Active' ? '<span class="badge bg-success">Active</span>' :
                        student.status === 'Graduated' ? '<span class="badge bg-primary">Graduated</span>' :
                        student.status === 'Left' ? '<span class="badge bg-warning text-dark">Left School</span>' :
                        `<span class="badge bg-secondary">${escapeHtml(student.status || 'N/A')}</span>`;
    const yearDisplay = (student.status === 'Graduated' || student.status === 'Left') && student.graduation_year ? escapeHtml(String(student.graduation_year)) : '-';
    tr.innerHTML = `
      <td>${escapeHtml(student.student_id || 'N/A')}</td>
      <td>${escapeHtml(student.student_name || 'N/A')}</td>
      <td>${statusBadge}</td>
      <td>${yearDisplay}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" onclick="editStudentGeneral(${Number(student.id)})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudentGeneral(${Number(student.id)})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======================== WORLD-CLASS ID CARD GENERATION ========================

const schoolInfo = {
    name: "Ibadurrahman College",
    subName: "(Halqatu Ibadurrahman)",
    address: "No. 1968 A, Gwammaja Housing Estate, Audu Wawu Street, Dala L.G.A, Kano State, Nigeria.",
    phone: "08033459721, 09062171496",
    logoSrc: "/assets/images/logo.jpeg"
};

let currentIDCardData = null;

function viewStudentIDCard(id, name, studentId, picture) {
    currentIDCardData = { type: 'student', id, name, entityId: studentId, picture };
    generateAndShowIDCard(currentIDCardData);
}

function viewStaffIDCard(id, name, staffId, picture) {
    currentIDCardData = { type: 'staff', id, name, entityId: staffId, picture };
    generateAndShowIDCard(currentIDCardData);
}

function generateAndShowIDCard(data) {
    const preview = document.getElementById('idCardPreview');
    if (!preview) return;

    const today = new Date().toLocaleDateString('en-GB');
    const pictureSrc = data.picture ? '/' + data.picture : '/Uploads/default.jpg';
    
    // Dynamic color based on role
    const themeColor = data.type === 'student' ? '#065f46' : '#1e3a8a'; // Green for student, Navy for staff

    preview.innerHTML = `
        <div id="idCardCanvas" style="width: 250px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; display: flex; flex-direction: column; gap: 20px;">
            
            <div style="width: 250px; height: 380px; background: #ffffff; border-radius: 15px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 1px solid #e5e7eb;">
                
                <div style="background: ${themeColor}; width: 100%; height: 90px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
                    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                    <img src="${schoolInfo.logoSrc}" alt="Logo" style="width: 55px; height: 55px; border-radius: 50%; border: 3px solid white; background: white; z-index: 2; margin-bottom: 5px; object-fit: contain;" onerror="this.src='/Uploads/default.jpg'">
                </div>

                <div style="text-align: center; margin-top: 10px; padding: 0 10px;">
                    <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: ${themeColor}; letter-spacing: 0.5px; text-transform: uppercase;">${schoolInfo.name}</h3>
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #6b7280;">${schoolInfo.subName}</p>
                </div>

                <div style="margin-top: 15px; position: relative;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; padding: 3px; background: linear-gradient(to bottom, ${themeColor}, #e5e7eb); display: flex; align-items: center; justify-content: center;">
                        <img src="${pictureSrc}" alt="Photo" style="width: 94px; height: 94px; border-radius: 50%; object-fit: cover; background: white;" onerror="this.src='/Uploads/default.jpg'">
                    </div>
                </div>

                <div style="text-align: center; margin-top: 12px; width: 100%; padding: 0 15px;">
                    <h4 style="margin: 0; font-size: 15px; color: #111827; font-weight: 700; border-bottom: 2px solid #f3f4f6; display: inline-block; padding-bottom: 2px;">${data.name.toUpperCase()}</h4>
                    <p style="margin: 5px 0; font-size: 11px; font-weight: 700; color: ${themeColor}; letter-spacing: 2px;">${data.type.toUpperCase()}</p>
                    
                    <div style="margin-top: 10px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px; border-radius: 8px;">
                        <span style="font-size: 9px; color: #9ca3af; display: block; font-weight: 600;">ID NUMBER</span>
                        <strong style="font-size: 13px; color: #111827;">${data.entityId}</strong>
                    </div>
                </div>

                <div style="position: absolute; bottom: 0; width: 100%; height: 8px; background: ${themeColor};"></div>
            </div>

            <div style="width: 250px; height: 380px; background: #fefefe; border-radius: 15px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.15); overflow: hidden;">
                <div style="background: #374151; padding: 12px; color: white; text-align: center;">
                    <span style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px;">INFORMATION & POLICY</span>
                </div>
                
                <div style="padding: 20px 15px; flex-grow: 1; display: flex; flex-direction: column; text-align: center; background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px); background-size: 10px 10px;">
                    
                    <div style="font-size: 9px; color: #4b5563; line-height: 1.6; text-align: justify; margin-bottom: 15px;">
                        This card is an official document of <strong>${schoolInfo.name}</strong>. The holder is entitled to all privileges associated with their role. Loss of this card must be reported immediately.
                    </div>

                    <div style="background: #fff1f2; border-left: 4px solid #e11d48; padding: 8px; margin-bottom: 15px;">
                        <p style="font-size: 9px; font-weight: 700; color: #9f1239; margin: 0;">RETURN POLICY:</p>
                        <p style="font-size: 8.5px; color: #be123c; margin: 2px 0 0;">Must be returned to administration upon graduation or termination of service.</p>
                    </div>

                    <div style="margin-top: auto;">
                        <p style="font-size: 9px; color: #374151; font-weight: 600;">${schoolInfo.address}</p>
                        <p style="font-size: 9px; color: ${themeColor}; font-weight: 700; margin: 4px 0;">${schoolInfo.phone}</p>
                        
                        <div style="margin-top: 20px; display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 120px; border-top: 1px solid #111827; margin-bottom: 4px;"></div>
                            <p style="font-size: 9px; font-weight: 700; color: #111827;">Authorized Signature</p>
                            <p style="font-size: 8px; color: #6b7280;">Issued: ${today}</p>
                        </div>
                    </div>
                </div>

                <div style="background: #f3f4f6; padding: 6px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <small style="font-size: 8px; color: #9ca3af; font-weight: 600;">www.ibadurrahman.edu.ng</small>
                </div>
            </div>
        </div>
    `;

    const modalElement = document.getElementById('idCardModal');
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

function downloadIDCard() {
    const cardElement = document.getElementById('idCardCanvas');
    if (!cardElement) return;

    // Use higher scale for "World-Class" print quality
    window.html2canvas(cardElement, { 
        scale: 5, 
        useCORS: true, 
        backgroundColor: null,
        logging: false 
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Premium_ID_${currentIDCardData.entityId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}


/* ===========================================================
   SEARCH & FILTER helpers
   =========================================================== */
function filterStudentGeneralList() {
  const search = document.getElementById('studentGeneralSearch')?.value?.toLowerCase() || '';
  const statusFilter = document.getElementById('studentGeneralStatusFilter')?.value || '';

  const filtered = allStudentsGeneralData.filter(student => {
    const matchesSearch = !search ||
      (student.student_name && student.student_name.toLowerCase().includes(search)) ||
      (student.student_id && student.student_id.toLowerCase().includes(search));
    const matchesStatus = !statusFilter || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  displayStudentGeneralList(filtered);
}

/* ===========================================================
   Initialization: ensure classes & sessions are populated even
   if this file is loaded after admin_dashboard.js
   =========================================================== */
async function autoInitVideoModule() {
  // populate selects and attach handlers
  await loadAdminVideoClasses().catch(e => console.error(e));
  await loadAdminVideoSessions().catch(e => console.error(e));
  initializeAdminVideoUpload();
  await loadAdminVideos().catch(e => console.error(e));
  // make sure student general list is available
  loadStudentGeneralList().catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[video] admin_video_and_students.js loaded');
  // run auto-init but don't block page
  autoInitVideoModule().catch(err => console.error('[video] auto-init failed', err));

  // Attach Load More button
  const loadMoreBtn = document.getElementById('adminLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.removeEventListener('click', displayAdminVideos);
    loadMoreBtn.addEventListener('click', displayAdminVideos);
  }

  // Attach ID card click delegation
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-id-card-btn');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const entityId = btn.getAttribute('data-studentid') || btn.getAttribute('data-staffid');
      const picture = btn.getAttribute('data-picture');
      const type = btn.getAttribute('data-type');
      if (type === 'student') viewStudentIDCard(id, name, entityId, picture);
      if (type === 'staff') viewStaffIDCard(id, name, entityId, picture);
    }
  });
});

/* ===========================================================
   Student General CRUD functions (add/edit/delete)
   - kept as-is but wrapped to avoid uncaught exceptions
   =========================================================== */
function addNewStudentGeneral() {
  try {
    document.getElementById('studentGeneralModalTitle').textContent = 'Add New Student';
    document.getElementById('studentGeneralId').value = '';
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentNameInput').value = '';
    document.getElementById('studentStatusInput').value = 'Active';
    document.getElementById('graduationYearInput').value = '';
    document.getElementById('graduationYearGroup').style.display = 'none';
    new bootstrap.Modal(document.getElementById('studentGeneralModal')).show();
  } catch (err) {
    console.error('[students] addNewStudentGeneral error', err);
  }
}
async function editStudentGeneral(id) {
  try {
    const student = allStudentsGeneralData.find(s => s.id === id);
    if (!student) { alert('Student not found'); return; }
    document.getElementById('studentGeneralModalTitle').textContent = 'Edit Student';
    document.getElementById('studentGeneralId').value = student.id;
    document.getElementById('studentIdInput').value = student.student_id || '';
    document.getElementById('studentNameInput').value = student.student_name || '';
    document.getElementById('studentStatusInput').value = student.status || 'Active';
    const gradYearGroup = document.getElementById('graduationYearGroup');
    const gradYearInput = document.getElementById('graduationYearInput');
    const gradYearLabel = document.getElementById('graduationYearLabel');
    if (student.status === 'Graduated' || student.status === 'Left') {
      gradYearGroup.style.display = 'block';
      gradYearLabel.textContent = (student.status === 'Graduated') ? 'Graduation Year' : 'Year Left';
      gradYearInput.value = student.graduation_year || '';
    } else {
      gradYearGroup.style.display = 'none';
      gradYearInput.value = '';
    }
    new bootstrap.Modal(document.getElementById('studentGeneralModal')).show();
  } catch (err) {
    console.error('[students] editStudentGeneral error', err);
  }
}
async function saveStudentGeneral() {
  try {
    const id = document.getElementById('studentGeneralId').value;
    const studentId = document.getElementById('studentIdInput').value.trim();
    const studentName = document.getElementById('studentNameInput').value.trim();
    const status = document.getElementById('studentStatusInput').value;
    const graduationYear = document.getElementById('graduationYearInput').value;
    if (!studentId || !studentName) { alert('Student ID and Name are required'); return; }
    let response;
    if (id) {
      response = await fetch(`/api/student-update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, graduation_year: graduationYear }),
        credentials: 'include'
      });
    } else {
      response = await fetch('/api/student-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, student_name: studentName, status, graduation_year: graduationYear }),
        credentials: 'include'
      });
    }
    const data = await response.json().catch(() => ({ success: false, message: 'Invalid response' }));
    if (data.success) {
      alert(id ? 'Student updated!' : 'Student added!');
      bootstrap.Modal.getInstance(document.getElementById('studentGeneralModal'))?.hide();
      loadStudentGeneralList();
    } else {
      alert('Error: ' + (data.message || 'Failed'));
    }
  } catch (err) {
    console.error('[students] save error', err);
    alert('Error saving student');
  }
}
async function deleteStudentGeneral(id) {
  try {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const res = await fetch(`/api/student-delete/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json().catch(() => ({ success: false }));
    if (json.success) {
      alert('Deleted');
      loadStudentGeneralList();
    } else {
      alert('Error: ' + (json.message || 'Failed'));
    }
  } catch (err) {
    console.error('[students] delete error', err);
    alert('Error deleting student');
  }
}

/* ===========================================================
   Utility: safe HTML escape (used in a few places)
   =========================================================== */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : text;
  return div.innerHTML;
}

/* ===========================================================
   Export functions to global window for compatibility
   =========================================================== */
window.loadAdminVideoClasses = loadAdminVideoClasses;
window.loadAdminVideoSessions = loadAdminVideoSessions;
window.initializeAdminVideoUpload = initializeAdminVideoUpload;
window.loadAdminVideos = loadAdminVideos;
window.displayAdminVideos = displayAdminVideos;
window.playAdminVideo = playAdminVideo;
window.deleteAdminVideo = deleteAdminVideo;

window.loadStudentGeneralList = loadStudentGeneralList;
window.initStudentGeneralList = function () { loadStudentGeneralList(); }; // simple alias
window.addNewStudentGeneral = addNewStudentGeneral;
window.editStudentGeneral = editStudentGeneral;
window.saveStudentGeneral = saveStudentGeneral;
window.deleteStudentGeneral = deleteStudentGeneral;