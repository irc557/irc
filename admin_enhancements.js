// ===== VIDEO UPLOAD MANAGEMENT (SuperAdmin Only) =====

// Initialize video management
function initializeVideoManagement() {
  document.getElementById('adminVideoUploadForm')?.addEventListener('submit', handleAdminVideoUpload);
  loadAdminClasses();
  loadAdminSessions();
  loadAdminVideos();
}

async function loadAdminClasses() {
  try {
    const response = await fetch('/api/classes');
    const data = await response.json();
    if (data.success) {
      const select = document.getElementById('adminVideoClassSelect');
      if (select) {
        select.innerHTML = '<option value="">Choose class...</option>';
        data.data.forEach(cls => {
          const opt = document.createElement('option');
          opt.value = `${cls.section_id}:${cls.class_id}`;
          opt.textContent = cls.name;
          select.appendChild(opt);
        });
      }
    }
  } catch (error) {
    console.error('Error loading classes:', error);
  }
}

async function loadAdminSessions() {
  try {
    const response = await fetch('/api/sessions');
    const data = await response.json();
    if (data.success) {
      const select = document.getElementById('adminVideoSessionSelect');
      if (select) {
        select.innerHTML = '<option value="">Choose session...</option>';
        data.data.forEach(session => {
          const opt = document.createElement('option');
          opt.value = session.session_year;
          opt.textContent = session.session_year;
          if (session.is_current) opt.selected = true;
          select.appendChild(opt);
        });
      }
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

async function handleAdminVideoUpload(e) {
  e.preventDefault();
  
  const classValue = document.getElementById('adminVideoClassSelect').value;
  const session = document.getElementById('adminVideoSessionSelect').value;
  const term = document.getElementById('adminVideoTermSelect').value;
  const week = document.getElementById('adminVideoWeekSelect').value;
  const day = document.getElementById('adminVideoDaySelect').value;
  const fromAyah = document.getElementById('adminVideoFromAyah').value;
  const toAyah = document.getElementById('adminVideoToAyah').value;
  const fileInput = document.getElementById('adminVideoFile');

  if (!classValue || !session || !term || !week || !day || !fromAyah || !toAyah || !fileInput.files[0]) {
    alert('Please fill all fields and select a video file');
    return;
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
  formData.append('video', fileInput.files[0]);

  // Show progress
  const progressDiv = document.getElementById('uploadProgress');
  const btn = document.getElementById('adminVideoUploadBtn');
  progressDiv.style.display = 'block';
  btn.disabled = true;

  try {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        document.querySelector('#uploadProgress .progress-bar').style.width = percentComplete + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          alert('Video uploaded successfully!');
          document.getElementById('adminVideoUploadForm').reset();
          progressDiv.style.display = 'none';
          btn.disabled = false;
          loadAdminVideos(); // Refresh list
        } else {
          alert('Upload failed: ' + response.message);
          progressDiv.style.display = 'none';
          btn.disabled = false;
        }
      } else {
        alert('Upload error: ' + xhr.statusText);
        progressDiv.style.display = 'none';
        btn.disabled = false;
      }
    });

    xhr.addEventListener('error', () => {
      alert('Upload error. Please try again.');
      progressDiv.style.display = 'none';
      btn.disabled = false;
    });

    xhr.open('POST', '/api/admin/upload-memorization-video');
    xhr.send(formData);
  } catch (error) {
    console.error('Error uploading video:', error);
    alert('Error uploading video: ' + error.message);
    progressDiv.style.display = 'none';
    btn.disabled = false;
  }
}

async function loadAdminVideos() {
  try {
    const response = await fetch('/api/memorization-videos');
    const data = await response.json();
    const tbody = document.getElementById('adminVideosTableBody');
    
    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No videos uploaded yet</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map(video => {
      const classInfo = getClassNameById(video.class_id, video.section_id);
      return `
        <tr>
          <td>${video.session}</td>
          <td>${['', '1st', '2nd', '3rd'][video.term]} Term</td>
          <td>Week ${video.week}</td>
          <td>${video.day}</td>
          <td>${classInfo}</td>
          <td>Ayat ${video.from_ayah} - ${video.to_ayah}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteAdminVideo(${video.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading videos:', error);
    document.getElementById('adminVideosTableBody').innerHTML = 
      '<tr><td colspan="7" class="text-center text-danger">Error loading videos</td></tr>';
  }
}

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
    console.error('Error deleting video:', error);
    alert('Error deleting video');
  }
}

function getClassNameById(classId, sectionId) {
  // This would need to be populated from the loaded classes
  // For now, return a placeholder
  return `Class ${classId}`;
}

// ===== ID CARD GENERATION =====

function generateStudentIDCard(studentId) {
  try {
    // Create canvas for ID card
    const canvas = document.createElement('canvas');
    canvas.width = 854;  // Standard ID card width (3.5 inches at 300 DPI)
    canvas.height = 539; // Standard ID card height (2.125 inches at 300 DPI)
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // School Info Header
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(10, 10, canvas.width - 20, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ibadurrahman College', canvas.width / 2, 35);
    ctx.font = '14px Arial';
    ctx.fillText('123 School Street, City, Country', canvas.width / 2, 55);

    // Student Information
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Student Name:', 80, 100);
    ctx.fillText('Student ID:', 80, 130);
    ctx.fillText('Date Issued:', 80, 160);
    ctx.fillText('Valid Until:', 80, 190);

    // Download as PDF
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `student_id_${studentId}.png`;
    link.click();

    alert('ID Card generated and downloaded successfully!');
  } catch (error) {
    console.error('Error generating ID card:', error);
    alert('Error generating ID card: ' + error.message);
  }
}

function generateStaffIDCard(staffId) {
  try {
    // Similar to student ID card
    const canvas = document.createElement('canvas');
    canvas.width = 854;
    canvas.height = 539;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.fillStyle = '#34a853';
    ctx.fillRect(10, 10, canvas.width - 20, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ibadurrahman College', canvas.width / 2, 35);
    ctx.font = '14px Arial';
    ctx.fillText('Staff Identification Card', canvas.width / 2, 55);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Staff Name:', 80, 100);
    ctx.fillText('Staff ID:', 80, 130);
    ctx.fillText('Date Issued:', 80, 160);
    ctx.fillText('Valid Until:', 80, 190);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `staff_id_${staffId}.png`;
    link.click();

    alert('Staff ID Card generated and downloaded successfully!');
  } catch (error) {
    console.error('Error generating staff ID card:', error);
    alert('Error generating staff ID card: ' + error.message);
  }
}

// ===== STUDENT GENERAL LIST MANAGEMENT =====

async function loadGeneralStudentList() {
  try {
    const response = await fetch('/api/students');
    const data = await response.json();
    
    if (!data.success) {
      alert('Failed to load students');
      return;
    }

    const tbody = document.getElementById('generalStudentListBody');
    if (!tbody) return;

    tbody.innerHTML = data.data.map(student => `
      <tr>
        <td>${student.student_id}</td>
        <td>${student.full_name}</td>
        <td><span class="badge bg-${getStatusBadgeColor(student.status)}">${student.status || 'Active'}</span></td>
        <td>${student.graduation_year || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editStudentStatus('${student.student_id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-info" onclick="generateStudentIDCard('${student.student_id}')">
            <i class="fas fa-id-card"></i> ID Card
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.student_id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading student list:', error);
  }
}

function getStatusBadgeColor(status) {
  const colors = {
    'Active': 'success',
    'Graduated': 'primary',
    'Left School': 'warning',
    'Inactive': 'secondary'
  };
  return colors[status] || 'secondary';
}

async function editStudentStatus(studentId) {
  const newStatus = prompt('Enter new status (Active/Graduated/Left School/Inactive):');
  if (!newStatus) return;

  const graduationYear = (newStatus === 'Graduated') ? prompt('Enter graduation year:') : null;

  try {
    const response = await fetch(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        graduation_year: graduationYear
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('Student status updated successfully');
      loadGeneralStudentList();
    } else {
      alert('Failed to update student status: ' + data.message);
    }
  } catch (error) {
    console.error('Error updating student status:', error);
    alert('Error updating student status');
  }
}

async function deleteStudent(studentId) {
  if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

  try {
    const response = await fetch(`/api/students/${studentId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.success) {
      alert('Student deleted successfully');
      loadGeneralStudentList();
    } else {
      alert('Failed to delete student: ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Error deleting student');
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeVideoManagement();
});
