// ADMIN VIDEO AND STUDENT MANAGEMENT - COMPLETE WORKING VERSION

// ======================== VIDEO MANAGEMENT ========================

let adminVideosData = [];
let adminVideosDisplayCount = 0;
const VIDEOS_PER_PAGE = 8;

// Load classes for video upload dropdown
async function loadAdminVideoClasses() {
    console.log('[v0] Loading admin video classes...');
    try {
        const response = await fetch('/api/admin-classes');
        const data = await response.json();
        console.log('[v0] Classes response:', data);
        
        if (data.success && data.data) {
            const select = document.getElementById('adminVideoClassSelect');
            if (!select) {
                console.log('[v0] adminVideoClassSelect not found');
                return;
            }

            select.innerHTML = '<option value="">Select Class</option>';
            
            data.data.forEach(cls => {
                const option = document.createElement('option');
                // Format: section_id:class_id (e.g., "1:5" for Tahfiz class 5)
                option.value = `${cls.section_id}:${cls.class_id}`;
                option.textContent = `${cls.class_name} (${cls.section_name || (cls.section_id === 1 ? 'Tahfiz' : 'Western')})`;
                select.appendChild(option);
            });
            console.log('[v0] Classes loaded successfully:', data.data.length);
        } else {
            console.log('[v0] No classes data or request failed');
        }
    } catch (error) {
        console.error('[v0] Error loading classes:', error);
    }
}

// Load sessions for video upload dropdown
async function loadAdminVideoSessions() {
    console.log('[v0] Loading admin video sessions...');
    try {
        const response = await fetch('/api/admin-sessions');
        const data = await response.json();
        console.log('[v0] Sessions response:', data);
        
        if (data.success) {
            const select = document.getElementById('adminVideoSessionSelect');
            if (!select) {
                console.log('[v0] adminVideoSessionSelect not found');
                return;
            }

            select.innerHTML = '<option value="">Select Session</option>';
            
            data.data.forEach(session => {
                const option = document.createElement('option');
                option.value = session.session_year;
                option.textContent = session.session_year;
                select.appendChild(option);
            });
            console.log('[v0] Sessions loaded successfully:', data.data.length);
        }
    } catch (error) {
        console.error('[v0] Error loading sessions:', error);
    }
}

// Initialize video upload form
function initializeAdminVideoUpload() {
    console.log('[v0] Initializing admin video upload form...');
    const form = document.getElementById('adminVideoUploadForm');
    if (!form) {
        console.log('[v0] adminVideoUploadForm not found');
        return;
    }

    // Remove existing listener to prevent duplicates
    form.onsubmit = null;
    form.onsubmit = handleAdminVideoUpload;

    // Day select change handler to show ayat input
    const daySelect = document.getElementById('adminVideoDaySelect');
    if (daySelect) {
        daySelect.onchange = function() {
            const ayatSection = document.getElementById('adminVideoAyatRangeSection');
            if (this.value) {
                ayatSection.classList.remove('hidden');
                ayatSection.style.display = 'block';
            } else {
                ayatSection.classList.add('hidden');
                ayatSection.style.display = 'none';
            }
        };
    }
    console.log('[v0] Video upload form initialized');
}

// Handle video upload
async function handleAdminVideoUpload(e) {
    e.preventDefault();
    console.log('[v0] Handling video upload...');
    
    const classValue = document.getElementById('adminVideoClassSelect').value;
    const session = document.getElementById('adminVideoSessionSelect').value;
    const term = document.getElementById('adminVideoTermSelect').value;
    const week = document.getElementById('adminVideoWeekSelect').value;
    const day = document.getElementById('adminVideoDaySelect').value;
    const fromAyah = document.getElementById('adminFromAyah').value;
    const toAyah = document.getElementById('adminToAyah').value;
    const videoFile = document.getElementById('adminVideoFile').files[0];

    if (!classValue || !session || !term || !week || !day || !fromAyah || !toAyah || !videoFile) {
        alert('Please fill all fields');
        return false;
    }

    const [sectionId, classId] = classValue.split(':');

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
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
    }

    try {
        const response = await fetch('/api/admin/upload-memorization-video', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('[v0] Upload response:', data);

        if (data.success) {
            alert('Video uploaded successfully!');
            document.getElementById('adminVideoUploadForm').reset();
            document.getElementById('adminVideoAyatRangeSection').style.display = 'none';
            loadAdminVideos();
        } else {
            alert('Upload failed: ' + data.message);
        }
    } catch (error) {
        console.error('[v0] Upload error:', error);
        alert('Error uploading video: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt me-2"></i>Upload Video';
        }
    }
    return false;
}

// Load all videos
async function loadAdminVideos() {
    console.log('[v0] Loading admin videos...');
    try {
        const response = await fetch('/api/memorization-videos');
        const data = await response.json();
        console.log('[v0] Videos response:', data);

        if (data.success) {
            adminVideosData = data.data || [];
            adminVideosDisplayCount = 0;
            displayAdminVideos();
        }
    } catch (error) {
        console.error('[v0] Error loading videos:', error);
    }
}

// Display videos in grid
function displayAdminVideos() {
    const grid = document.getElementById('adminVideoGrid');
    if (!grid) {
        console.log('[v0] adminVideoGrid not found');
        return;
    }

    if (adminVideosDisplayCount === 0) {
        grid.innerHTML = '';
    }

    const start = adminVideosDisplayCount;
    const end = Math.min(start + VIDEOS_PER_PAGE, adminVideosData.length);

    if (adminVideosData.length === 0) {
        grid.innerHTML = '<div class="col-span-4 text-center text-gray-500 py-10">No videos uploaded yet.</div>';
        return;
    }

    for (let i = start; i < end; i++) {
        const video = adminVideosData[i];
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-100';
        card.innerHTML = `
            <div class="relative">
                <video class="w-full h-40 object-cover bg-black" preload="metadata">
                    <source src="${video.video_url}" type="video/mp4">
                </video>
                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer" onclick="playAdminVideo(${video.id})">
                    <i class="fas fa-play-circle text-white text-5xl opacity-80 hover:opacity-100"></i>
                </div>
            </div>
            <div class="p-4">
                <p class="text-sm text-gray-600"><strong>Class:</strong> ${video.class_name || 'N/A'}</p>
                <p class="text-sm text-gray-600"><strong>Session:</strong> ${video.session}</p>
                <p class="text-sm text-gray-600"><strong>Term:</strong> ${video.term} | <strong>Week:</strong> ${video.week}</p>
                <p class="text-sm text-gray-600"><strong>Day:</strong> ${video.day}</p>
                <p class="text-emerald-700 font-bold text-sm mt-2">Ayat: ${video.from_ayah} - ${video.to_ayah}</p>
                <div class="mt-3 flex gap-2">
                    <button class="btn btn-sm btn-primary flex-1" onclick="playAdminVideo(${video.id})">
                        <i class="fas fa-play me-1"></i>Play
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdminVideo(${video.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }

    adminVideosDisplayCount = end;

    const loadMoreBtn = document.getElementById('adminLoadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = adminVideosDisplayCount >= adminVideosData.length ? 'none' : 'block';
    }
}

// Play video in modal
function playAdminVideo(videoId) {
    const video = adminVideosData.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.getElementById('adminVideoModal');
    const videoPlayer = document.getElementById('adminModalVideoPlayer');
    
    if (!modal || !videoPlayer) {
        console.log('[v0] Video modal or player not found');
        return;
    }

    videoPlayer.querySelector('source').src = video.video_url;
    videoPlayer.load();

    document.getElementById('adminVideoSessionInfo').textContent = video.session;
    document.getElementById('adminVideoTermInfo').textContent = 'Term ' + video.term;
    document.getElementById('adminVideoWeekInfo').textContent = 'Week ' + video.week;
    document.getElementById('adminVideoClassInfo').textContent = video.class_name || 'N/A';
    document.getElementById('adminVideoAyatInfo').textContent = `Ayat Range: ${video.from_ayah} - ${video.to_ayah}`;

    document.getElementById('adminDeleteVideoBtn').onclick = function() {
        deleteAdminVideo(videoId);
        window.bootstrap.Modal.getInstance(modal).hide();
    };

    new window.bootstrap.Modal(modal).show();
}

// Delete video
async function deleteAdminVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
        const response = await fetch(`/api/admin/delete-memorization-video/${videoId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Video deleted successfully');
            loadAdminVideos();
        } else {
            alert('Failed to delete video: ' + data.message);
        }
    } catch (error) {
        console.error('[v0] Error deleting video:', error);
        alert('Error deleting video');
    }
}

// ======================== STUDENT GENERAL LIST MANAGEMENT ========================

let allStudentsGeneralData = [];

async function loadStudentGeneralList() {
    console.log('[v0] Loading student general list...');
    try {
        const response = await fetch('/api/students-general-list');
        const data = await response.json();
        console.log('[v0] Students response:', data);

        if (data.success) {
            allStudentsGeneralData = data.data || [];
            displayStudentGeneralList(allStudentsGeneralData);
        } else {
            document.getElementById('studentGeneralTableBody').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error: ' + data.message + '</td></tr>';
        }
    } catch (error) {
        console.error('[v0] Error loading student list:', error);
        document.getElementById('studentGeneralTableBody').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading students</td></tr>';
    }
}

function displayStudentGeneralList(students) {
    const tbody = document.getElementById('studentGeneralTableBody');
    if (!tbody) {
        console.log('[v0] studentGeneralTableBody not found');
        return;
    }

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No students found. Click "Add New Student" to add one.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    students.forEach(student => {
        const row = document.createElement('tr');
        let statusBadge = '';
        if (student.status === 'Active') {
            statusBadge = '<span class="badge bg-success">Active</span>';
        } else if (student.status === 'Graduated') {
            statusBadge = '<span class="badge bg-primary">Graduated</span>';
        } else if (student.status === 'Left') {
            statusBadge = '<span class="badge bg-warning text-dark">Left School</span>';
        } else {
            statusBadge = '<span class="badge bg-secondary">' + (student.status || 'N/A') + '</span>';
        }

        // Show graduation year or year left
        let yearDisplay = '-';
        if ((student.status === 'Graduated' || student.status === 'Left') && student.graduation_year) {
            yearDisplay = student.graduation_year;
        }

        row.innerHTML = `
            <td>${student.student_id || 'N/A'}</td>
            <td>${student.student_name || 'N/A'}</td>
            <td>${statusBadge}</td>
            <td>${yearDisplay}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editStudentGeneral(${student.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudentGeneral(${student.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Add new student - opens modal
function addNewStudentGeneral() {
    console.log('[v0] Opening add student modal...');
    document.getElementById('studentGeneralModalTitle').textContent = 'Add New Student';
    document.getElementById('studentGeneralId').value = '';
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentNameInput').value = '';
    document.getElementById('studentStatusInput').value = 'Active';
    document.getElementById('graduationYearInput').value = '';
    document.getElementById('graduationYearGroup').style.display = 'none';

    new window.bootstrap.Modal(document.getElementById('studentGeneralModal')).show();
}

// Edit student - opens modal with data
function editStudentGeneral(id) {
    console.log('[v0] Opening edit student modal for ID:', id);
    const student = allStudentsGeneralData.find(s => s.id === id);
    if (!student) {
        alert('Student not found');
        return;
    }

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

    new window.bootstrap.Modal(document.getElementById('studentGeneralModal')).show();
}

// Save student (add or update)
async function saveStudentGeneral() {
    const id = document.getElementById('studentGeneralId').value;
    const studentId = document.getElementById('studentIdInput').value.trim();
    const studentName = document.getElementById('studentNameInput').value.trim();
    const status = document.getElementById('studentStatusInput').value;
    const graduationYear = document.getElementById('graduationYearInput').value;

    if (!studentId || !studentName) {
        alert('Student ID and Name are required');
        return;
    }

    try {
        let response;
        if (id) {
            // Update
            response = await fetch(`/api/student-update-status/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, graduation_year: graduationYear })
            });
        } else {
            // Add new
            response = await fetch('/api/student-add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId, student_name: studentName, status, graduation_year: graduationYear })
            });
        }

        const data = await response.json();

        if (data.success) {
            alert(id ? 'Student updated successfully!' : 'Student added successfully!');
            window.bootstrap.Modal.getInstance(document.getElementById('studentGeneralModal')).hide();
            loadStudentGeneralList();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('[v0] Error saving student:', error);
        alert('Error saving student');
    }
}

// Delete student
async function deleteStudentGeneral(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        const response = await fetch(`/api/student-delete/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert('Student deleted successfully');
            loadStudentGeneralList();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('[v0] Error deleting student:', error);
        alert('Error deleting student');
    }
}

// Show/hide graduation/year left field on status change
document.getElementById('studentStatusInput')?.addEventListener('change', function () {
    const gradYearGroup = document.getElementById('graduationYearGroup');
    const gradYearLabel = document.getElementById('graduationYearLabel');

    if (this.value === 'Graduated' || this.value === 'Left') {
        gradYearGroup.style.display = 'block';
        gradYearLabel.textContent = (this.value === 'Graduated') ? 'Graduation Year' : 'Year Left';
    } else {
        gradYearGroup.style.display = 'none';
        document.getElementById('graduationYearInput').value = '';
    }
});

// ======================== ID CARD GENERATION ========================

const schoolInfo = {
    name: "Ibadurrahman College",
    subName: "(Halqatu Ibadurrahman)",
    address: "No. 1968 A, Gwammaja Housing Estate, Audu Wawu Street, Dala L.G.A, Kano State, Nigeria.",
    phone: "08033459721, 09062171496",
    logoSrc: "/assets/images/logo.jpeg"
};

let currentIDCardData = null;

function viewStudentIDCard(id, name, studentId, picture) {
    currentIDCardData = {
        type: 'student',
        id: id,
        name: name,
        entityId: studentId,
        picture: picture
    };
    generateAndShowIDCard(currentIDCardData);
}

function viewStaffIDCard(id, name, staffId, picture) {
    currentIDCardData = {
        type: 'staff',
        id: id,
        name: name,
        entityId: staffId,
        picture: picture
    };
    generateAndShowIDCard(currentIDCardData);
}

function generateAndShowIDCard(data) {
    const preview = document.getElementById('idCardPreview');
    if (!preview) return;

    const today = new Date().toLocaleDateString('en-GB');
    const pictureSrc = data.picture ? '/' + data.picture : '/Uploads/default.jpg';

    // Standard Portrait ID: 204px x 324px
    preview.innerHTML = `
        <div id="idCardCanvas" style="width: 204px; margin: 0 auto; font-family: 'Arial', sans-serif; display: flex; flex-direction: column; gap: 15px; color: #333;">
            
            <div style="width: 204px; height: 324px; background: white; border-radius: 10px; border: 1px solid #065f46; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                
                <div style="background: #065f46; width: 100%; padding: 10px 0 5px; text-align: center; color: white;">
                    <img src="${schoolInfo.logoSrc}" alt="Logo" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid white; background: white; margin: 0 auto 5px; display: block;" onerror="this.src='/Uploads/default.jpg'">
                    <h3 style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase;">${schoolInfo.name}</h3>
                    <p style="margin: 0; font-size: 8px; font-style: italic; opacity: 0.9;">${schoolInfo.subName}</p>
                </div>

                <div style="padding: 5px 10px; text-align: center; background: #f0fdf4; width: 100%; border-bottom: 1px solid #eee;">
                    <p style="margin: 0; font-size: 6.5px; line-height: 1.2; color: #065f46;">${schoolInfo.address}</p>
                    <p style="margin: 2px 0 0; font-size: 7px; font-weight: bold; color: #065f46;">Tel: ${schoolInfo.phone}</p>
                </div>

                <div style="margin-top: 10px; text-align: center;">
                    <img src="${pictureSrc}" alt="Photo" style="width: 80px; height: 80px; border: 2px solid #065f46; object-fit: cover; border-radius: 5px;" onerror="this.src='/Uploads/default.jpg'">
                </div>

                <div style="text-align: center; width: 100%; margin-top: 5px; padding: 0 5px;">
                    <h4 style="margin: 0; font-size: 12px; color: #111; font-weight: bold;">${data.name.toUpperCase()}</h4>
                    <p style="margin: 0; font-size: 9px; color: #d97706; font-weight: bold;">${data.type === 'student' ? 'STUDENT' : 'STAFF'}</p>
                    
                    <div style="margin-top: 8px; border: 1px dashed #065f46; padding: 4px; border-radius: 4px; display: inline-block; min-width: 120px;">
                        <span style="font-size: 7px; display: block; color: #666;">IDENTIFICATION NO.</span>
                        <strong style="font-size: 11px; color: #065f46;">${data.entityId}</strong>
                    </div>
                </div>

                <div style="position: absolute; bottom: 0; width: 100%; background: #065f46; height: 10px;"></div>
            </div>

            <div style="width: 204px; height: 324px; background: #fff; border-radius: 10px; border: 1px solid #ccc; display: flex; flex-direction: column; box-shadow: 0 4px 10px rgba(0,0,0,0.15); overflow: hidden;">
                <div style="background: #065f46; padding: 10px; color: white; text-align: center;">
                    <span style="font-size: 9px; font-weight: bold; letter-spacing: 1px;">OFFICIAL INSTRUCTIONS</span>
                </div>
                
                <div style="padding: 15px 10px; flex-grow: 1; display: flex; flex-direction: column; text-align: center;">
                    <p style="font-size: 8px; line-height: 1.5; color: #333; margin-bottom: 10px;">
                        This card is the property of <strong>${schoolInfo.name}</strong>. It is for identification purposes only and must be carried at all times while on school premises.
                    </p>
                    
                    <p style="font-size: 8.5px; font-weight: bold; color: #b91c1c; padding: 5px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 4px;">
                        NOTICE: This ID card must be returned to the school administration upon graduation or termination of service.
                    </p>

                    <div style="margin-top: auto; padding-bottom: 10px;">
                        <p style="font-size: 7.5px; color: #555; margin-bottom: 20px;">If found, please return to the school address or call: <br>${schoolInfo.phone}</p>
                        
                        <div style="width: 100px; border-bottom: 1px solid #333; margin: 0 auto 2px;"></div>
                        <p style="font-size: 8px; font-weight: bold;">Authorized Signature</p>
                        <p style="font-size: 7px; color: #888;">Issued: ${today}</p>
                    </div>
                </div>
                
                <div style="background: #f0fdf4; padding: 5px; text-align: center; border-top: 1px solid #eee;">
                    <small style="font-size: 7px; color: #065f46;">Education is Light</small>
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

    window.html2canvas(cardElement, { 
        scale: 4, 
        useCORS: true, 
        backgroundColor: null 
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `ID_Card_${currentIDCardData.entityId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// ======================== SEARCH AND FILTER ========================

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

// ======================== INITIALIZATION ========================

// Initialize Student General List (called when view is loaded)
function initStudentGeneralList() {
    console.log('[v1] Initializing student general list...');

    // Add New Student button
    const addStudentBtn = document.getElementById('addNewStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.onclick = addNewStudentGeneral;
        console.log('[v1] Add student button listener attached');
    }

    // Save Student button
    const saveStudentBtn = document.getElementById('saveStudentBtn');
    if (saveStudentBtn) {
        saveStudentBtn.onclick = saveStudentGeneral;
        console.log('[v1] Save student button listener attached');
    }

  // Status change → show/hide year field (Graduated / Left)
const statusInput = document.getElementById('studentStatusInput');
const yearGroup = document.getElementById('graduationYearGroup');
const yearLabel = document.getElementById('graduationYearLabel');
const yearInput = document.getElementById('graduationYearInput');

function toggleYearField() {
    if (statusInput.value === 'Graduated') {
        yearGroup.style.display = 'block';
        yearLabel.textContent = 'Graduation Year';
    } 
    else if (statusInput.value === 'Left') {
        yearGroup.style.display = 'block';
        yearLabel.textContent = 'Year Left School';
    } 
    else {
        yearGroup.style.display = 'none';
        yearInput.value = ''; // clear when Active
    }
}

if (statusInput) {
    statusInput.onchange = toggleYearField;

    // IMPORTANT: run once for edit modal
    toggleYearField();
}

    // Download ID Card button
    const downloadBtn = document.getElementById('downloadIDCardBtn');
    if (downloadBtn) {
        downloadBtn.onclick = downloadIDCard;
        console.log('[v1] Download ID card button listener attached');
    }

    // Search and filter
    const searchInput = document.getElementById('studentGeneralSearch');
    if (searchInput) {
        searchInput.oninput = filterStudentGeneralList;
    }

    const statusFilter = document.getElementById('studentGeneralStatusFilter');
    if (statusFilter) {
        statusFilter.onchange = filterStudentGeneralList;
    }

    // Load students
    loadStudentGeneralList();
}

// ======================== EVENT LISTENERS ========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('[v0] admin_video_and_students.js loaded');

    // Initialize all event listeners
    initStudentGeneralList();

    // Load More Videos button
    const loadMoreBtn = document.getElementById('adminLoadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = displayAdminVideos;
    }

    // ID Card click handler for student and staff tables
    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('.view-id-card-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const entityId = btn.getAttribute('data-studentid') || btn.getAttribute('data-staffid');
            const picture = btn.getAttribute('data-picture');
            const type = btn.getAttribute('data-type');

            if (type === 'student') {
                viewStudentIDCard(id, name, entityId, picture);
            } else if (type === 'staff') {
                viewStaffIDCard(id, name, entityId, picture);
            }
        }
    });
});

// Make functions globally available
window.loadAdminVideoClasses = loadAdminVideoClasses;
window.loadAdminVideoSessions = loadAdminVideoSessions;
window.initializeAdminVideoUpload = initializeAdminVideoUpload;
window.loadAdminVideos = loadAdminVideos;
window.displayAdminVideos = displayAdminVideos;
window.playAdminVideo = playAdminVideo;
window.deleteAdminVideo = deleteAdminVideo;
window.loadStudentGeneralList = loadStudentGeneralList;
window.initStudentGeneralList = initStudentGeneralList;
window.addNewStudentGeneral = addNewStudentGeneral;
window.editStudentGeneral = editStudentGeneral;
window.saveStudentGeneral = saveStudentGeneral;
window.deleteStudentGeneral = deleteStudentGeneral;
window.viewStudentIDCard = viewStudentIDCard;
window.viewStaffIDCard = viewStaffIDCard;
window.downloadIDCard = downloadIDCard;
