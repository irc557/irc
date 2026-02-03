// Assume jsPDF and XLSX are loaded globally
const { jsPDF } = window.jspdf;

const translations = {
    en: {
        adminPanel: "Admin Panel",
        dashboard: "Dashboard",
        staff: "Staff",
        students: "Students",
        fees: "Fees",
        bookings: "Bookings",
        admin: "Admin",
        allClasses: "All Classes",
        signOut: "Sign out",
        dashboardOverview: "Dashboard Overview",
        totalStaff: "Total Staff",
        totalStudents: "Total Students",
        pendingFees: "Pending Fees",
        totalBookings: "Total Bookings",
        firstLoginNotice: "First login detected. Please update your credentials for security.",
        newPasswordLabel: "New Password",
        confirmPasswordLabel: "Confirm Password",
        updateCredentials: "Update Credentials",
        close: "Close",
        toggleLanguage: "العربية",
        admins: "Admins",
        academic: "Academic",
        demographics: "Demographics",
        staffManagement: "Staff Management",
        studentManagement: "Student Management",
        feesManagement: "Fees Management",
        bookingsManagement: "Bookings Management",
        adminManagement: "Admin Management",
        academicManagement: "Academic Management",
        generate: "ID/Report Generator",
        updateSuccess: "Credentials updated successfully!",
        passwordsMatchError: "Passwords do not match.",
        userNotFound: "User not found or not authorized.",
        staffSaved: "Staff record saved successfully.",
        studentSaved: "Student record saved successfully.",
        feesSaved: "Fees updated successfully.",
        addPayment: "Add Payment",
        studentName: "Student Name",
        paymentAmount: "Payment Amount",
        paymentMethod: "Payment Method",
        paymentNotes: "Notes",
        submitPayment: "Submit Payment",
        cash: "Cash",
        bankTransfer: "Bank Transfer",
        mobileMoney: "Mobile Money",
        pos: "POS",
        cheque: "Cheque",
        requiredFieldsError: "Please fill all required fields.",
        invalidAmountError: "Please enter a valid payment amount.",
        paymentSaved: "Payment added successfully.",
        bookingsFetched: "Bookings fetched successfully.",
        generateIdCard: "Generate ID Card",
        generateReportSheet: "Generate Report Sheet",
        selectType: "Select Type",
        entityId: "Entity ID",
        studentId: "Student ID",
        reportType: "Report Type",
        session: "Session",
        selectSession: "Select Session",
        sessionRequired: "Session is required.",
        allSessions: "All Sessions",
        term: "Term",
        selectTerm: "Select Term",
        terminalReport: "Terminal",
        sessionalReport: "Sessional",
        firstTerm: "1st Term",
        secondTerm: "2nd Term",
        thirdTerm: "3rd Term",
        allTerms: "All Terms",
        idCardGenerated: "ID Card Generated",
        reportSheetGenerated: "Report Sheet Generated",
        exportPdf: "Export as PDF",
        exportExcel: "Export as Excel",
        setFees: "Set Fees per Class",
        basicFees: "Basic Level Fees",
        mediumFees: "Medium Level Fees",
        highFees: "High Level Fees",
        saveFees: "Save Fees",
        paymentTracking: "Payment Tracking",
        levelClass: "Level/Class",
        status: "Status",
        actions: "Actions",
        academicCalendar: "Academic Calendar",
        termStartDate: "Term Start Date",
        termEndDate: "Term End Date",
        saveDates: "Save Dates",
        reportsheets: "Reportsheets",
        generateReportSheets: "Generate Report Sheets",
        staffGenderDistribution: "Staff Gender Distribution",
        studentGenderDistribution: "Student Gender Distribution",
        addStaff: "Add New Staff",
        addStudent: "Add New Student",
        addAdmin: "Add New Admin",
        saveStaff: "Save Staff",
        saveStudent: "Save Student",
        saveAdmin: "Save Admin",
        name: "Name",
        email: "Email",
        role: "Role",
        phone: "Phone",
        class: "Class",
        classes: "Classes",
        level: "Level",
        gender: "Gender",
        username: "Username",
        password: "Password",
        securityQuestion: "Security Question",
        securityAnswer: "Security Answer",
        newUsername: "New Username",
        newName: "Name",
        dateOfBirth: "Date of Birth",
        address: "Address",
        message: "Message",
        timeSent: "Time Sent",
        formTeacher: "Form Teacher",
        regularTeacher: "Regular Teacher",
        staffId: "Staff ID",
        classesTaught: "Classes Taught",
        subjectTaught: "Subjects Taught",
        subjects: "Subjects",
        formMasterInfo: "Form Master Info",
        formMasterClass: "Form Master Class (Optional)",
        basicClass: "Basic Class",
        mediumClass: "Medium Class",
        highClass: "High Class",
        male: "Male",
        female: "Female",
        other: "Other",
        superAdmin: "SuperAdmin",
        deputyAdmin: "DeputyAdmin",
        petNameQuestion: "What is your pet's name?",
        maidenNameQuestion: "What is your mother's maiden name?",
        carMakeQuestion: "What was your first car's make?",
        passwordLength: "Password must be at least 8 characters long.",
        passwordMatch: "Passwords must match.",
        nameRequired: "Name is required.",
        usernameRequired: "Username is required.",
        phoneRequired: "Phone number is required.",
        questionRequired: "Security question is required.",
        answerRequired: "Security answer is required.",
        emailInvalid: "Enter a valid email address.",
        staffIdRequired: "Staff ID is required.",
        roleRequired: "Role is required.",
        levelRequired: "Level is required.",
        classRequired: "Class is required.",
        classesRequired: "At least one class is required.",
        subjectsRequired: "At least one subject is required.",
        genderRequired: "Gender is required.",
        dobRequired: "Date of birth is required.",
        addressRequired: "Address is required.",
        profilePicture: "Profile Picture",
        profilePictureInvalid: "Please upload a valid JPEG or PNG image (≤ 200KB).",
        profilePictureSaved: "Profile picture uploaded successfully.",
        selectClass: "Select Class",
        selectStudent: "Select Student",
        studentRequired: "Student is required.",
        termRequired: "Term is required.",
        amountRequired: "Amount is required and must be positive.",
        methodRequired: "Payment method is required.",
        guardianPhone: "Guardian Phone",
        duplicateStudent: "Duplicate student registration detected.",
        confirmDelete: "Are you sure you want to delete this record?",
        recordDeleted: "Record deleted successfully.",
        noRecordsFound: "No records found."
    },
    ar: {
        adminPanel: "لوحة التحكم الإدارية",
        dashboard: "لوحة القيادة",
        staff: "العاملون",
        students: "الطلاب",
        fees: "الرسوم",
        bookings: "الحجوزات",
        admin: "المشرف",
        allClasses: "جميع الفصول",
        signOut: "تسجيل الخروج",
        dashboardOverview: "نظرة عامة على لوحة القيادة",
        totalStaff: "إجمالي العاملين",
        totalStudents: "إجمالي الطلاب",
        pendingFees: "الرسوم المعلقة",
        totalBookings: "إجمالي الحجوزات",
        firstLoginNotice: "تم اكتشاف تسجيل الدخول الأول. يرجى تحديث بيانات الاعتماد الخاصة بك للأمان.",
        newPasswordLabel: "كلمة المرور الجديدة",
        confirmPasswordLabel: "تأكيد كلمة المرور",
        updateCredentials: "تحديث بيانات الاعتماد",
        close: "إغلاق",
        toggleLanguage: "English",
        admins: "المشرفون",
        academic: "الأكاديمي",
        demographics: "البيانات الديموغرافية",
        staffManagement: "إدارة العاملين",
        studentManagement: "إدارة الطلاب",
        feesManagement: "إدارة الرسوم",
        bookingsManagement: "إدارة الحجوزات",
        adminManagement: "إدارة المشرفين",
        academicManagement: "الإدارة الأكاديمية",
        generate: "مولد الهوية/التقرير",
        updateSuccess: "تم تحديث بيانات الاعتماد بنجاح!",
        passwordsMatchError: "كلمات المرور لا تتطابق.",
        userNotFound: "المستخدم غير موجود أو غير مصرح له.",
        staffSaved: "تم حفظ سجل الموظف بنجاح.",
        studentSaved: "تم حفظ سجل الطالب بنجاح.",
        feesSaved: "تم تحديث الرسوم بنجاح.",
        addPayment: "إضافة دفعة",
        studentName: "اسم الطالب",
        paymentAmount: "مبلغ الدفعة",
        paymentMethod: "طريقة الدفع",
        paymentNotes: "ملاحظات",
        submitPayment: "إرسال الدفعة",
        cash: "نقدي",
        bankTransfer: "تحويل بنكي",
        mobileMoney: "الدفع عبر الهاتف",
        pos: "نقطة بيع",
        cheque: "شيك",
        requiredFieldsError: "يرجى ملء جميع الحقول المطلوبة.",
        invalidAmountError: "يرجى إدخال مبلغ دفعة صحيح.",
        paymentSaved: "تمت إضافة الدفعة بنجاح.",
        bookingsFetched: "تم جلب الحجوزات بنجاح.",
        generateIdCard: "إنشاء بطاقة هوية",
        generateReportSheet: "إنشاء ورقة تقرير",
        selectType: "اختر النوع",
        entityId: "معرف الكيان",
        studentId: "معرف الطالب",
        reportType: "نوع التقرير",
        session: "الدورة",
        selectSession: "اختر الجلسة",
        sessionRequired: "الجلسة مطلوبة.",
        allSessions: "جميع الجلسات",
        term: "الفصل",
        selectTerm: "اختر الفصل",
        terminalReport: "تقرير فصلي",
        sessionalReport: "تقرير دوري",
        firstTerm: "الفصل الأول",
        secondTerm: "الفصل الثاني",
        thirdTerm: "الفصل الثالث",
        allTerms: "جميع الفصول",
        idCardGenerated: "تم إنشاء بطاقة الهوية",
        reportSheetGenerated: "تم إنشاء ورقة التقرير",
        exportPdf: "تصدير كـ PDF",
        exportExcel: "تصدير كـ Excel",
        setFees: "تحديد الرسوم لكل فصل",
        basicFees: "رسوم المستوى الأساسي",
        mediumFees: "رسوم المستوى المتوسط",
        highFees: "رسوم المستوى العالي",
        saveFees: "حفظ الرسوم",
        paymentTracking: "تتبع الدفعات",
        levelClass: "المستوى/الفصل",
        status: "الحالة",
        actions: "الإجراءات",
        academicCalendar: "التقويم الأكاديمي",
        termStartDate: "تاريخ بدء الفصل",
        termEndDate: "تاريخ انتهاء الفصل",
        saveDates: "حفظ التواريخ",
        reportsheets: "أوراق التقارير",
        generateReportSheets: "إنشاء أوراق التقارير",
        staffGenderDistribution: "توزيع الجنس للعاملين",
        studentGenderDistribution: "توزيع الجنس للطلاب",
        addStaff: "إضافة موظف جديد",
        addStudent: "إضافة طالب جديد",
        addAdmin: "إضافة مشرف جديد",
        saveStaff: "حفظ الموظف",
        saveStudent: "حفظ الطالب",
        saveAdmin: "حفظ المشرف",
        name: "الاسم",
        email: "البريد الإلكتروني",
        role: "الدور",
        phone: "الهاتف",
        class: "الفصل",
        classes: "الفصول",
        level: "المستوى",
        gender: "الجنس",
        username: "اسم المستخدم",
        password: "كلمة المرور",
        securityQuestion: "سؤال الأمان",
        securityAnswer: "إجابة الأمان",
        newUsername: "اسم المستخدم الجديد",
        newName: "الاسم",
        dateOfBirth: "تاريخ الميلاد",
        address: "العنوان",
        message: "الرسالة",
        timeSent: "وقت الإرسال",
        formTeacher: "معلم الفصل",
        regularTeacher: "معلم عادي",
        staffId: "معرف الموظف",
        classesTaught: "الفصول التي تم تدريسها",
        subjectTaught: "المواد التي تم تدريسها",
        subjects: "المواد",
        formMasterInfo: "معلومات معلم الصف",
        formMasterClass: "فصل معلم الصف (اختياري)",
        basicClass: "الفصل الأساسي",
        mediumClass: "الفصل المتوسط",
        highClass: "الفصل العالي",
        male: "ذكر",
        female: "أنثى",
        other: "آخر",
        superAdmin: "مشرف رئيسي",
        deputyAdmin: "نائب المشرف",
        petNameQuestion: "ما هو اسم حيوانك الأليف؟",
        maidenNameQuestion: "ما هو اسم عائلة والدتك قبل الزواج؟",
        carMakeQuestion: "ما هي ماركة سيارتك الأولى؟",
        passwordLength: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
        passwordMatch: "كلمات المرور يجب أن تتطابق.",
        nameRequired: "الاسم مطلوب.",
        usernameRequired: "اسم المستخدم مطلوب.",
        phoneRequired: "رقم الهاتف مطلوب.",
        questionRequired: "سؤال الأمان مطلوب.",
        answerRequired: "إجابة الأمان مطلوبة.",
        emailInvalid: "أدخل عنوان بريد إلكتروني صالح.",
        staffIdRequired: "معرف الموظف مطلوب.",
        roleRequired: "الدور مطلوب.",
        levelRequired: "المستوى مطلوب.",
        classRequired: "الفصل مطلوب.",
        classesRequired: "مطلوب فصل واحد على الأقل.",
        subjectsRequired: "مطلوب مادة واحدة على الأقل.",
        genderRequired: "الجنس مطلوب.",
        dobRequired: "تاريخ الميلاد مطلوب.",
        addressRequired: "العنوان مطلوب.",
        profilePicture: "الصورة الشخصية",
        profilePictureInvalid: "يرجى رفع صورة JPEG أو PNG صالحة (≤ 200 كيلوبايت).",
        profilePictureSaved: "تم رفع الصورة الشخصية بنجاح.",
        selectClass: "اختر الفصل",
        selectStudent: "اختر الطالب",
        studentRequired: "الطالب مطلوب.",
        termRequired: "الفصل مطلوب.",
        amountRequired: "المبلغ مطلوب ويجب أن يكون موجباً.",
        methodRequired: "طريقة الدفع مطلوبة.",
        guardianPhone: "هاتف الوصي",
        duplicateStudent: "تم اكتشاف تسجيل طالب مكرر.",
        confirmDelete: "هل أنت متأكد من أنك تريد حذف هذا السجل؟",
        recordDeleted: "تم حذف السجل بنجاح.",
        noRecordsFound: "لم يتم العثور على سجلات."
    }
};
const classMapping = {
    'Basic': ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'],
    'Medium': ['JSS 1', 'JSS 2', 'JSS 3'],
    'High': ['SS 1', 'SS 2', 'SS 3']
};

let currentLang = localStorage.getItem('language') || 'en';
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : `https://${window.location.hostname}`;


// Modal instances
const firstLoginModal = new bootstrap.Modal(document.getElementById('firstLoginModal'), { backdrop: 'static', keyboard: false });
const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
const staffModal = new bootstrap.Modal(document.getElementById('staffModal'));
const studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
const adminModal = new bootstrap.Modal(document.getElementById('adminModal'));

let allStudents = [];

// API Functions
const fetchData = async (url, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API call failed');
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return { success: false, message: error.message };
    }
};

const postData = async (url, data, isFormData = false) => {
    const options = {
        method: 'POST',
        credentials: 'include'
    };
    if (isFormData) {
        options.body = data;
    } else {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetchData(url, options);
};

const deleteData = async (url) => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.status === 401) {
            showMessageModal('error', 'Session expired. Redirecting to login...');
            setTimeout(() => window.location.href = '/admin-login', 2000);
            return { success: false, message: 'Unauthorized' };
        }
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                return { success: false, message: errorData.message || `Error ${response.status}` };
            } else {
                return { success: false, message: "Server returned a non-JSON response. You may have been redirected due to an expired session." };
            }
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, message: error.message || "Request failed." };
    }
};

// UI Rendering Functions
const formatCurrency = (amount) => {
    return `â‚¦${parseFloat(amount || 0).toFixed(2)}`;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

function renderStaffTable(staffData) {
    const tableBody = document.getElementById('staffTableBody');
    tableBody.innerHTML = '';

    if (!staffData || staffData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center">No staff records found.</td></tr>';
        return;
    }

    staffData.forEach((staff, index) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = staff.staff_id;
        const profileCell = row.insertCell();
        profileCell.innerHTML = `<img src="${staff.profile_picture ? '/' + staff.profile_picture : '/Uploads/default.jpg'}" class="profile-picture" alt="Profile">`;
        row.insertCell().textContent = staff.name;
        row.insertCell().textContent = staff.email || 'N/A';
        row.insertCell().textContent = staff.phone;
        row.insertCell().textContent = staff.role;
        row.insertCell().textContent = staff.classes_taught || 'N/A';
        row.insertCell().textContent = staff.subjects_taught || 'N/A';
        const formMasterInfoCell = row.insertCell();
        formMasterInfoCell.innerHTML = staff.form_master_info ?
            `<span class="badge bg-success">${staff.form_master_info}</span>` :
            `<span class="badge bg-secondary">None</span>`;
        const actionsCell = row.insertCell();
        actionsCell.className = 'd-flex gap-2';
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.setAttribute('data-id', staff.id);
        editBtn.setAttribute('data-type', 'staff');
        editBtn.classList.add('edit-button');
        actionsCell.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.setAttribute('data-id', staff.id);
        deleteBtn.setAttribute('data-type', 'staff');
        deleteBtn.classList.add('delete-button');
        actionsCell.appendChild(deleteBtn);
    });
}

// Updated: Render students without subjects column and fix class name duplication
const renderStudents = async (students) => {
    const studentTableBody = document.getElementById('studentTableBody');
    studentTableBody.innerHTML = '';

    // Fetch class names to map section_id:class_id to actual names
    const classData = await fetchData('/api/classes');
    const classMap = {};
    if (classData.success) {
        classData.data.forEach(cls => {
            classMap[`${cls.section_id}:${cls.id}`] = cls.name;
        });
    } else {
        console.error('Failed to fetch classes for rendering:', classData.message);
    }

    students.forEach(student => {
        console.log('Rendering student:', student); // Debug: Log student data
    const dob = student.date_of_birth 
        ? formatDate(student.date_of_birth)
        : 'N/A';

    // âœ… Handle subjects
    const uniqueSubjects = Array.isArray(student.subjects)
        ? [...new Set(student.subjects)].filter(s => s)
        : [student.subjects || 'N/A'];
    const subjectsDisplay = uniqueSubjects.join(', ');

    // âœ… Ensure unique class names and map section_id:class_id to names
    const uniqueClasses = Array.isArray(student.classes) 
        ? [...new Set(student.classes)].map(cls => classMap[cls] || cls).filter(name => name)
        : [student.classes || 'N/A'];
    const classesDisplay = uniqueClasses.join(', ');

    console.log('Student classes:', student.classes, 'Mapped classes:', uniqueClasses); // Debug

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${student.student_id || student.id}</td>
        <td>
            <img src="${student.profile_picture ? '/' + student.profile_picture : '/Uploads/default.jpg'}" 
                 class="profile-picture" alt="Profile">
        </td>
        <td>${student.name || student.full_name || 'N/A'}</td>
        <td>${student.gender || 'N/A'}</td>
        <td>${dob}</td>
        <td>${subjectsDisplay}</td> <!-- âœ… Added Subjects column -->
        <td>${classesDisplay}</td>  <!-- âœ… Class(es) column -->
        <td>${student.guardian_phone || 'N/A'}</td>
        <td>${student.address || 'N/A'}</td>
        <td class="flex gap-2">
            <button class="btn btn-sm btn-primary edit-button" data-id="${student.id}" data-type="student" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-button" data-id="${student.id}" data-type="student" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
        studentTableBody.appendChild(row);
    });

    translatePage(currentLang);
};

// After rendering students
document.getElementById('studentTableBody').addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('edit-button')) {
        const studentId = e.target.dataset.id;
        fetch(`${API_BASE_URL}/api/students/${studentId}`)
            .then(res => res.json())
            .then(result => {
                console.log('Fetched student data for editing:', result); // Debug
                if (result.success) {
                    editStudent(result.data);
                } else {
                    showMessageModal('error', result.message || 'Failed to fetch student.');
                }
            })
            .catch(err => {
                console.error('Error fetching student:', err);
                showMessageModal('error', 'Server error while fetching student.');
            });
    }
});

const renderAdmins = (admins) => {
    const adminTableBody = document.getElementById('adminTableBody');
    adminTableBody.innerHTML = '';
    admins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.username}</td>
            <td>${admin.name}</td>
            <td>${admin.phone}</td>
            <td>${admin.role}</td>
            <td>
                ${admin.role !== 'SuperAdmin' ? `
                    <button class="btn btn-sm btn-primary edit-button" data-id="${admin.id}" data-type="admin" data-translate="edit">Edit</button>
                    <button class="btn btn-sm btn-danger delete-button" data-id="${admin.id}" data-type="admin" data-translate="delete">Delete</button>
                ` : ''}
            </td>
        `;
        adminTableBody.appendChild(row);
    });
    translatePage(currentLang);
};

const renderPayments = (payments) => {
    const paymentTableBody = document.getElementById('paymentTableBody');
    paymentTableBody.innerHTML = '';
    payments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.name}</td>
            <td>${payment.level || 'N/A'}/${payment.class_name || 'N/A'}</td>
            <td><span class="${payment.status === 'completed' ? 'text-success' : 'text-warning'}">${payment.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary edit-payment-button" data-id="${payment.id}" data-translate="edit">Edit</button>
            </td>
        `;
        paymentTableBody.appendChild(row);
    });
    translatePage(currentLang);
};

const renderBookings = (bookings) => {
    const bookingsTableBody = document.getElementById('bookingsTableBody');
    bookingsTableBody.innerHTML = '';
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.name}</td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.gender}</td>
            <td>${formatDate(booking.date_of_birth)}</td>
            <td>${booking.phone}</td>
            <td>${booking.address}</td>
            <td>${booking.message || 'N/A'}</td>
            <td>${new Date(booking.time_sent).toLocaleString()}</td>
        `;
        bookingsTableBody.appendChild(row);
    });
    translatePage(currentLang);
};

const renderDashboardOverview = async () => {
    try {
         // Fetch total students from /api/students
        const studentsData = await fetchData('/api/students');
        const totalStudents = studentsData.success && Array.isArray(studentsData.data)
            ? studentsData.data.length
            : 0;
        document.getElementById('totalStudentsCount').textContent = totalStudents;

        // Fetch staff
        const staffData = await fetchData('/api/staff');
        document.getElementById('totalStaffCount').textContent =
            staffData.success && Array.isArray(staffData.data) ? staffData.data.length : 0;

        // Fetch bookings
        const bookingsData = await fetchData('/api/bookings');
        document.getElementById('totalBookingsCount').textContent =
            bookingsData.success && Array.isArray(bookingsData.data) ? bookingsData.data.length : 0;

        // Pending fees (currently static)
    } catch (error) {
        console.error('Error rendering dashboard overview:', error);
        document.getElementById('totalStudentsCount').textContent = 0;
        document.getElementById('totalStaffCount').textContent = 0;
        document.getElementById('totalBookingsCount').textContent = 0;
        document.getElementById('pendingFeesCount').textContent = '0';
    }
};

const refreshData = async () => {
    await fetchDataAndRender('/api/staff', renderStaffTable);
    await fetchDataAndRender('/api/students', (data) => {
        allStudents = data;
        renderStudents(data);
    });
    await fetchDataAndRender('/api/bookings', renderBookings);
    const adminsData = await fetchData('/api/admins');
    if (adminsData.success) {
        renderAdmins(adminsData.data);
    }
};

const fetchDataAndRender = async (url, renderFunc) => {
    const data = await fetchData(url);
    if (data.success) {
        renderFunc(data.data);
    }
};
// Modal instance for Payment
const paymentModal = new bootstrap.Modal(document.getElementById('addPaymentModal'));

// Global cache for classMap
let classMap = {};

// Populate sessions from database
async function populateSessions(target = 'all') {
    console.log('Populating sessions for target:', target);
    try {
        const response = await fetchData('/api/sessions');
        if (!response.success) {
            console.error('Failed to fetch sessions:', response.message);
            showMessageModal('error', translations[currentLang].sessionRequired);
            return;
        }

        const sessionSelect = document.getElementById('sessionSelect');
        const feesSessionFilter = document.getElementById('feesSessionFilter');
        const paymentSession = document.getElementById('paymentSession');

        if (target === 'all' || target === 'fees') {
            if (sessionSelect) sessionSelect.innerHTML = `<option value="" data-translate="selectSession">${translations[currentLang].selectSession}</option>`;
            if (feesSessionFilter) feesSessionFilter.innerHTML = `<option value="" data-translate="allSessions">${translations[currentLang].allSessions}</option>`;
        }
        if (target === 'all' || target === 'payment') {
            if (paymentSession) paymentSession.innerHTML = `<option value="" data-translate="selectSession">${translations[currentLang].selectSession}</option>`;
        }

        response.data.forEach(session => {
            const option = document.createElement('option');
            option.value = session.session_year;
            option.textContent = session.session_year;
            if (session.is_current) option.setAttribute('selected', 'selected');

            if (target === 'all' || target === 'fees') {
                if (sessionSelect) sessionSelect.appendChild(option.cloneNode(true));
                if (feesSessionFilter) feesSessionFilter.appendChild(option.cloneNode(true));
            }
            if (target === 'all' || target === 'payment') {
                if (paymentSession) paymentSession.appendChild(option.cloneNode(true));
            }
        });

        translatePage(currentLang);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        showMessageModal('error', translations[currentLang].sessionRequired);
    }
}

// Populate classes
async function populateClasses(staff = null, student = null, target = 'all') {
    console.log('Populating classes for target:', target);
    const data = await fetchData('/api/classes');
    if (!data.success) {
        console.error('Failed to fetch classes:', data.message);
        showMessageModal('error', translations[currentLang].classRequired);
        return;
    }

    classMap = {};
    data.data.forEach(cls => {
        classMap[`${cls.section_id}:${cls.id}`] = cls.name;
    });

    const formMasterSelect = document.getElementById('formMasterClass');
    const classesTaughtSelect = document.getElementById('classesTaught');
    const studentClassesSelect = document.getElementById('studentClasses');
    const studentClassFilter = document.getElementById('studentClassFilter');
    const feesClassSelect = document.getElementById('classSelect');
    const trackClassSelect = document.getElementById('trackClassSelect');
    const paymentClassSelect = document.getElementById('paymentClassSelect');

    if (target === 'all' || target === 'staff-student') {
        if (formMasterSelect) formMasterSelect.innerHTML = `<option value="" data-translate="selectClass">${translations[currentLang].selectClass}</option>`;
        if (classesTaughtSelect) classesTaughtSelect.innerHTML = '';
        if (studentClassesSelect) studentClassesSelect.innerHTML = '';
        if (studentClassFilter) studentClassFilter.innerHTML = `<option value="" data-translate="allClasses">${translations[currentLang].allClasses}</option>`;
    }
    if (target === 'all' || target === 'fees') {
        if (feesClassSelect) feesClassSelect.innerHTML = `<option value="" data-translate="selectClass">${translations[currentLang].selectClass}</option>`;
        if (trackClassSelect) trackClassSelect.innerHTML = `<option value="" data-translate="allClasses">${translations[currentLang].allClasses}</option>`;
        if (paymentClassSelect) paymentClassSelect.innerHTML = `<option value="" data-translate="selectClass">${translations[currentLang].selectClass}</option>`;
    }

    const islamicGroup = document.createElement('optgroup');
    islamicGroup.label = translations[currentLang].basicClass || 'Islamic Classes';
    const westernGroup = document.createElement('optgroup');
    westernGroup.label = translations[currentLang].mediumClass || 'Western Classes';

    data.data.forEach(cls => {
        const value = `${cls.section_id}:${cls.id}`;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = cls.name;

        if (target === 'all' || target === 'staff-student') {
            if (formMasterSelect) formMasterSelect.appendChild(option.cloneNode(true));
            if (classesTaughtSelect) classesTaughtSelect.appendChild(option.cloneNode(true));
            if (studentClassFilter) studentClassFilter.appendChild(option.cloneNode(true));
            if (cls.section_id === 1) {
                islamicGroup.appendChild(option.cloneNode(true));
            } else {
                westernGroup.appendChild(option.cloneNode(true));
            }
        }
        if (target === 'all' || target === 'fees') {
            if (feesClassSelect) feesClassSelect.appendChild(option.cloneNode(true));
            if (trackClassSelect) trackClassSelect.appendChild(option.cloneNode(true));
            if (paymentClassSelect) paymentClassSelect.appendChild(option.cloneNode(true));
        }
    });

    if (target === 'all' || target === 'staff-student') {
        if (studentClassesSelect) {
            studentClassesSelect.appendChild(islamicGroup);
            studentClassesSelect.appendChild(westernGroup);
        }
    }

    if (staff?.classes?.length && (target === 'all' || target === 'staff-student')) {
        staff.classes.forEach(cls => {
            const value = `${cls.section_id}:${cls.class_id}`;
            const opt = classesTaughtSelect?.querySelector(`option[value="${value}"]`);
            if (opt) opt.selected = true;
        });
    }

    if (staff?.formMaster && (target === 'all' || target === 'staff-student')) {
        const value = `${staff.formMaster.section_id}:${staff.formMaster.class_id}`;
        const opt = formMasterSelect?.querySelector(`option[value="${value}"]`);
        if (opt) opt.selected = true;
    }

    if (student?.classes?.length && (target === 'all' || target === 'staff-student')) {
        student.classes.forEach(clsValue => {
            const opt = studentClassesSelect?.querySelector(`option[value="${clsValue}"]`);
            if (opt) opt.selected = true;
        });
        studentClassesSelect?.dispatchEvent(new Event('change'));
    }

    translatePage(currentLang);
}

// Populate student select based on class
async function populateStudentSelect(classValue) {
    const studentSelect = document.getElementById('paymentStudentSelect');
    if (!studentSelect) return;

    studentSelect.innerHTML = `<option value="" data-translate="selectStudent">${translations[currentLang].selectStudent}</option>`;
    if (!classValue) return;

    try {
        const [section_id, class_id] = classValue.split(':').map(Number);
        const response = await fetchData(`/api/students?class=${section_id}:${class_id}`);
        if (response.success) {
            response.data.forEach(student => {
                const option = document.createElement('option');
                option.value = student.student_fee_id || student.id;
                option.textContent = `${student.name} (${student.student_id})`;
                studentSelect.appendChild(option);
            });
            translatePage(currentLang);
        } else {
            console.error('Failed to fetch students:', response.message);
            showMessageModal('error', translations[currentLang].studentRequired);
        }
    } catch (err) {
        console.error('Error fetching students:', err);
        showMessageModal('error', translations[currentLang].studentRequired);
    }
}

// Fetch payment data
async function fetchPaymentData() {
    console.log('Fetching payment data');
    const classValue = document.getElementById('trackClassSelect')?.value;
    const termValue = document.getElementById('feesTermFilter')?.value || '';
    const sessionValue = document.getElementById('feesSessionFilter')?.value || '';
    const searchQuery = document.getElementById('paymentSearch')?.value || '';

    let queryParams = '';
    if (termValue) queryParams += `term=${termValue}`;
    if (sessionValue) queryParams += `${queryParams ? '&' : ''}session=${encodeURIComponent(sessionValue)}`;
    if (classValue) queryParams += `${queryParams ? '&' : ''}class=${encodeURIComponent(classValue)}`;
    if (queryParams) queryParams = `?${queryParams}`;

    try {
        const response = await fetchData(`/api/fees/payments${queryParams}`);
        if (response.success) {
            console.log('Payment data fetched:', response.data);
            await renderPaymentTable(response.data, searchQuery);
        } else {
            console.error('Failed to fetch payment data:', response.message);
            showMessageModal('error', translations[currentLang].requiredFieldsError);
        }
    } catch (err) {
        console.error('Error fetching payment data:', err);
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
}

// Render payment table
async function renderPaymentTable(feeData, searchQuery = '') {
    const tableBody = document.getElementById('paymentTableBody');
    if (!tableBody) {
        console.error('Payment table body not found');
        return;
    }
    tableBody.innerHTML = '';

    if (!feeData || feeData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center" data-translate="noRecordsFound">${translations[currentLang].noRecordsFound}</td></tr>`;
        return;
    }

    const filteredData = feeData.filter(fee => {
        const searchStr = `${fee.student_name || ''} ${fee.student_id || ''}`.toLowerCase();
        return !searchQuery || searchStr.includes(searchQuery.toLowerCase());
    });

    filteredData.forEach(fee => {
        const classDisplay = classMap[`${fee.section_id}:${fee.class_ref}`] || 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fee.student_name || 'N/A'}</td>
            <td>${classDisplay}</td>
            <td>${fee.guardian_phone || 'N/A'}</td>
            <td>${fee.total_fee.toFixed(2)}</td>
            <td>${fee.amount_paid.toFixed(2)}</td>
            <td>${fee.remaining_amount.toFixed(2)}</td>
            <td><span class="badge ${fee.status === 'Completed' ? 'bg-success' : 'bg-warning'}">${fee.status}</span></td>
        `;
        tableBody.appendChild(row);
    });

    translatePage(currentLang);
}

// Prepare payment table for export
async function preparePaymentTableForExport() {
    const classValue = document.getElementById('trackClassSelect')?.value;
    const termValue = document.getElementById('feesTermFilter')?.value || '';
    const sessionValue = document.getElementById('feesSessionFilter')?.value || '';
    const searchQuery = document.getElementById('paymentSearch')?.value || '';

    let queryParams = '';
    if (termValue) queryParams += `term=${termValue}`;
    if (sessionValue) queryParams += `${queryParams ? '&' : ''}session=${encodeURIComponent(sessionValue)}`;
    if (classValue) queryParams += `${queryParams ? '&' : ''}class=${encodeURIComponent(classValue)}`;
    if (queryParams) queryParams = `?${queryParams}`;

    const feeData = await fetchData(`/api/fees/payments${queryParams}`);
    const table = document.createElement('table');
    const thead = table.createTHead();
    const tbody = table.createTBody();
    const headers = [
        translations[currentLang].studentName,
        translations[currentLang].class,
        translations[currentLang].guardianPhone,
        translations[currentLang].totalFee,
        translations[currentLang].amountPaid,
        translations[currentLang].remainingAmount,
        translations[currentLang].status
    ];
    const headerRow = thead.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    if (feeData.success) {
        const filteredData = feeData.filter(fee => {
            const searchStr = `${fee.student_name || ''} ${fee.student_id || ''}`.toLowerCase();
            return !searchQuery || searchStr.includes(searchQuery.toLowerCase());
        });

        filteredData.forEach(fee => {
            const classDisplay = classMap[`${fee.section_id}:${fee.class_ref}`] || 'N/A';
            const row = tbody.insertRow();
            row.insertCell().textContent = fee.student_name || 'N/A';
            row.insertCell().textContent = classDisplay;
            row.insertCell().textContent = fee.guardian_phone || 'N/A';
            row.insertCell().textContent = fee.total_fee.toFixed(2);
            row.insertCell().textContent = fee.amount_paid.toFixed(2);
            row.insertCell().textContent = fee.remaining_amount.toFixed(2);
            row.insertCell().textContent = fee.status;
        });
    }

    return table;
}

// Export to PDF
async function exportPaymentsToPDF() {
    try {
        const doc = new jsPDF();
        doc.text(translations[currentLang].paymentTracking, 10, 10);
        const table = await preparePaymentTableForExport();
        doc.autoTable({
            html: table,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 133, 244] },
            bodyStyles: { textColor: [0, 0, 0] }
        });
        doc.save('payments.pdf');
    } catch (err) {
        console.error('Error exporting payments to PDF:', err);
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
}

// Export to Excel
async function exportPaymentsToExcel() {
    try {
        const table = await preparePaymentTableForExport();
        const workbook = XLSX.utils.table_to_book(table, { sheet: "Payments" });
        XLSX.writeFile(workbook, 'payments.xlsx');
    } catch (err) {
        console.error('Error exporting payments to Excel:', err);
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
}

// Handle set fees form submission
document.getElementById('setFeesForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Set fees form submitted');
    const classValue = document.getElementById('classSelect')?.value;
    const feeAmount = document.getElementById('feeAmount')?.value;
    const term = document.getElementById('termSelect')?.value;
    const session = document.getElementById('sessionSelect')?.value;
    const description = document.getElementById('feeDescription')?.value;

    if (!classValue || !feeAmount || !term || !session) {
        console.error('Missing required fields:', { classValue, feeAmount, term, session });
        showMessageModal('error', translations[currentLang].requiredFieldsError);
        return;
    }

    const [section_id, class_ref] = classValue.split(':').map(Number);
    const data = {
        section_id,
        class_ref,
        total_fee: parseFloat(feeAmount),
        term: parseInt(term),
        session_year: session,
        description: description || null
    };

    try {
        const response = await fetchData('/api/fees/set', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.success) {
            showMessageModal('success', translations[currentLang].paymentSaved);
            document.getElementById('setFeesForm').reset();
        } else {
            console.error('Failed to save fee structure:', response.message);
            showMessageModal('error', translations[currentLang].requiredFieldsError);
        }
    } catch (err) {
        console.error('Error saving fee structure:', err);
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
});

// Handle top Add Payment button click
document.getElementById('topAddPaymentBtn')?.addEventListener('click', async () => {
    console.log('Top Add Payment button clicked');
    const paymentForm = document.getElementById('addPaymentForm');
    const studentSelectGroup = document.getElementById('studentSelectGroup');
    const classSelect = document.getElementById('paymentClassSelect');
    const sessionSelect = document.getElementById('paymentSession');
    const termSelect = document.getElementById('paymentTerm');

    if (paymentForm && studentSelectGroup && classSelect && sessionSelect && termSelect) {
        paymentForm.reset();
        studentSelectGroup.classList.remove('d-none');
        document.getElementById('addPaymentModalLabel').textContent = translations[currentLang].addPayment;
        await populateClasses(null, null, 'fees');
        await populateSessions('payment');
        classSelect.value = '';
        sessionSelect.value = '';
        termSelect.value = '';
        document.getElementById('paymentStudentSelect').innerHTML = `<option value="" data-translate="selectStudent">${translations[currentLang].selectStudent}</option>`;
        document.getElementById('paymentTotalFee').value = '';
        document.getElementById('paymentRemaining').value = '';
        translatePage(currentLang);
        paymentModal.show();
    } else {
        console.error('Payment modal elements not found');
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
});

// Handle class selection to populate students and fee data
document.getElementById('paymentClassSelect')?.addEventListener('change', async (e) => {
    const classValue = e.target.value;
    await populateStudentSelect(classValue);
});

// Handle session and term selection to fetch fee data
async function updateFeeData() {
    const classValue = document.getElementById('paymentClassSelect')?.value;
    const sessionValue = document.getElementById('paymentSession')?.value;
    const termValue = document.getElementById('paymentTerm')?.value;
    const studentFeeId = document.getElementById('paymentStudentSelect')?.value;

    if (classValue && sessionValue && termValue && studentFeeId) {
        const [section_id, class_id] = classValue.split(':').map(Number);
        try {
            const response = await fetchData(`/api/fees/payments?student_fee_id=${studentFeeId}&session=${encodeURIComponent(sessionValue)}&term=${termValue}&class=${section_id}:${class_id}`);
            if (response.success && response.data.length > 0) {
                const fee = response.data[0];
                document.getElementById('paymentTotalFee').value = fee.total_fee.toFixed(2);
                document.getElementById('paymentRemaining').value = fee.remaining_amount.toFixed(2);
            } else {
                document.getElementById('paymentTotalFee').value = '';
                document.getElementById('paymentRemaining').value = '';
            }
        } catch (err) {
            console.error('Error fetching fee data:', err);
            document.getElementById('paymentTotalFee').value = '';
            document.getElementById('paymentRemaining').value = '';
        }
    } else {
        document.getElementById('paymentTotalFee').value = '';
        document.getElementById('paymentRemaining').value = '';
    }
}

document.getElementById('paymentSession')?.addEventListener('change', updateFeeData);
document.getElementById('paymentTerm')?.addEventListener('change', updateFeeData);
document.getElementById('paymentStudentSelect')?.addEventListener('change', updateFeeData);

// Handle add payment form submission
document.getElementById('addPaymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Add payment form submitted');
    const studentFeeId = document.getElementById('paymentStudentSelect')?.value;
    const paymentAmount = document.getElementById('paymentAmount')?.value;
    const paymentMethod = document.getElementById('paymentMethod')?.value;
    const paymentNotes = document.getElementById('paymentNotes')?.value;
    const term = document.getElementById('paymentTerm')?.value;
    const session = document.getElementById('paymentSession')?.value;
    const classValue = document.getElementById('paymentClassSelect')?.value;

    if (!studentFeeId || !paymentAmount || parseFloat(paymentAmount) <= 0 || !term || !session || !classValue) {
        console.error('Invalid payment data:', { studentFeeId, paymentAmount, term, session, classValue });
        showMessageModal('error', translations[currentLang].requiredFieldsError);
        return;
    }

    const [section_id, class_ref] = classValue.split(':').map(Number);
    const data = {
        student_fee_id: parseInt(studentFeeId),
        payment_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod || null,
        term: parseInt(term),
        session_year: session,
        class_ref,
        section_id,
        notes: paymentNotes || null
    };

    try {
        const response = await fetchData('/api/fees/payments', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.success) {
            showMessageModal('success', translations[currentLang].paymentSaved);
            paymentModal.hide();
            document.getElementById('addPaymentForm').reset();
            await fetchPaymentData();
        } else {
            console.error('Failed to add payment:', response.message);
            showMessageModal('error', translations[currentLang].requiredFieldsError);
        }
    } catch (err) {
        console.error('Error adding payment:', err);
        showMessageModal('error', translations[currentLang].requiredFieldsError);
    }
});

// Handle search input, class, session, and term filter change
document.getElementById('paymentSearch')?.addEventListener('input', () => {
    fetchPaymentData();
});
document.getElementById('trackClassSelect')?.addEventListener('change', () => {
    fetchPaymentData();
});
document.getElementById('feesSessionFilter')?.addEventListener('change', () => {
    fetchPaymentData();
});
document.getElementById('feesTermFilter')?.addEventListener('change', () => {
    fetchPaymentData();
});

// Initialize Fees Management
async function initFeesManagement() {
    console.log('Initializing Fees Management');
    await populateClasses(null, null, 'fees');
    await populateSessions('fees');
    document.getElementById('exportPaymentsPdfBtn')?.addEventListener('click', exportPaymentsToPDF);
    document.getElementById('exportPaymentsExcelBtn')?.addEventListener('click', exportPaymentsToExcel);
    if (document.getElementById('trackFeesTab').classList.contains('active')) {
        await fetchPaymentData();
    }
}

// Run on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    if (document.getElementById('fees-management-view')) {
        initFeesManagement();
    }
});

// Fix tab switching with Bootstrap event
document.querySelectorAll('#feesTab .nav-link').forEach(tab => {
    tab.addEventListener('shown.bs.tab', (e) => {
        console.log(`${e.target.id} shown`);
        if (e.target.id === 'trackFeesTab') {
            fetchPaymentData();
        }
    });
});

// Preselect student subjects (unchanged from provided code)
function preselectStudentSubjects(student) {
    if (!student?.subjects?.length) return;
    
    const subjectSelect = document.getElementById('studentSubjects');
    
    Array.from(subjectSelect.options).forEach(opt => opt.selected = false);

    student.subjects.forEach(sub => {
        const subject_id = sub.includes(':') ? sub.split(':')[1] : sub;
        const subject_id_str = String(subject_id);

        const option = Array.from(subjectSelect.options).find(opt => opt.value === subject_id_str);
        
        if (option) {
            option.selected = true;
        } else {
            console.warn(`Subject ${subject_id_str} not found in studentSubjects options during delayed preselection.`);
        }
    });
}

//populate subjects

async function populateSubjects(staff = null, student = null) {
    const data = await fetchData('/api/subjects');
    console.log('Subjects data:', data); // Debug

    if (data.success) {
        const subjectsTaughtSelect = document.getElementById('subjectsTaught');
        const studentSubjectsSelect = document.getElementById('studentSubjects');
        subjectsTaughtSelect.innerHTML = '';
        studentSubjectsSelect.innerHTML = '';

        const islamicGroupStaff = document.createElement('optgroup');
        islamicGroupStaff.label = translations[currentLang].basicClass;
        const westernGroupStaff = document.createElement('optgroup');
        westernGroupStaff.label = translations[currentLang].mediumClass;

        const islamicGroupStudent = document.createElement('optgroup');
        islamicGroupStudent.label = translations[currentLang].basicClass;
        const westernGroupStudent = document.createElement('optgroup');
        westernGroupStudent.label = translations[currentLang].mediumClass;

        data.data.forEach(sub => {
            // Staff subjects (section_id:subject_id)
            const staffOption = document.createElement('option');
            staffOption.value = `${sub.section_id}:${sub.id}`;
            staffOption.textContent = sub.name;
            if (sub.section_id === 1) islamicGroupStaff.appendChild(staffOption);
            else westernGroupStaff.appendChild(staffOption);

            // Student subjects (subject_id only)
            const studentOption = document.createElement('option');
            studentOption.value = String(sub.id); // ensure string match
            studentOption.textContent = sub.name;
            if (sub.section_id === 1) islamicGroupStudent.appendChild(studentOption);
            else westernGroupStudent.appendChild(studentOption);
        });

        subjectsTaughtSelect.appendChild(islamicGroupStaff);
        subjectsTaughtSelect.appendChild(westernGroupStaff);
        studentSubjectsSelect.appendChild(islamicGroupStudent);
        studentSubjectsSelect.appendChild(westernGroupStudent);

        studentSubjectsSelect.disabled = true; // until classes chosen

        // ðŸ”¹ Preselect Staff Subjects
        if (staff?.subjects?.length) {
            staff.subjects.forEach(sub => {
                const value = `${sub.section_id}:${sub.subject_id}`;
                const opt = subjectsTaughtSelect.querySelector(`option[value="${value}"]`);
                if (opt) opt.selected = true;
            });
        }

        // ðŸ”¹ Preselect Student Subjects
        if (student?.subjects?.length) {
            student.subjects.forEach(subId => {
                const opt = studentSubjectsSelect.querySelector(`option[value="${subId}"]`);
                if (opt) opt.selected = true;
            });
        }

    } else {
        console.error('Failed to fetch subjects:', data.message);
        showMessageModal('error', translations[currentLang].subjectsRequired);
    }
}


document.getElementById('studentClasses').addEventListener('change', async () => {
    const selectedClasses = Array.from(document.getElementById('studentClasses').selectedOptions).map(opt => opt.value);
    const sectionIds = [...new Set(selectedClasses.map(cls => cls.split(':')[0]))];
    const data = await fetchData('/api/subjects');
    console.log('Subjects data for filtering:', data); // Debug
    if (data.success) {
        const studentSubjectsSelect = document.getElementById('studentSubjects');
        studentSubjectsSelect.innerHTML = '';
        if (sectionIds.length === 0) {
            studentSubjectsSelect.disabled = true;
        } else {
            studentSubjectsSelect.disabled = false;
            const islamicGroup = document.createElement('optgroup');
            islamicGroup.label = translations[currentLang].basicClass;
            const westernGroup = document.createElement('optgroup');
            westernGroup.label = translations[currentLang].mediumClass;
            data.data.forEach(sub => {
                if (sectionIds.includes(sub.section_id.toString())) {
                    const option = document.createElement('option');
                    option.value = sub.id; // Use sub.id only
                    option.textContent = sub.name;
                    option.dataset.sectionId = sub.section_id; // Store section_id
                    if (sub.section_id === 1) {
                        islamicGroup.appendChild(option);
                    } else {
                        westernGroup.appendChild(option);
                    }
                }
            });
            if (sectionIds.includes('1')) studentSubjectsSelect.appendChild(islamicGroup);
            if (sectionIds.includes('2')) studentSubjectsSelect.appendChild(westernGroup);
        }
    } else {
        console.error('Failed to fetch subjects for filtering:', data.message);
        showMessageModal('error', translations[currentLang].subjectsRequired);
    }
});

// --- Search & Date Filter Logic ---
document.getElementById('bookingsSearch').addEventListener('input', filterBookings);
document.getElementById('bookingsDateFrom').addEventListener('change', filterBookings);
document.getElementById('bookingsDateTo').addEventListener('change', filterBookings);

function filterBookings() {
    const searchValue = document.getElementById('bookingsSearch').value.toLowerCase();
    const fromDate = document.getElementById('bookingsDateFrom').value;
    const toDate = document.getElementById('bookingsDateTo').value;
    const table = document.getElementById('bookingsTable');
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        const rowText = row.textContent.toLowerCase();

        const dateCell = cells[cells.length - 1]?.textContent.trim(); // last column: Time Sent
        let showRow = true;

        // Search Filter
        if (searchValue && !rowText.includes(searchValue)) {
            showRow = false;
        }

        // Date Filter
        if (fromDate || toDate) {
            const rowDate = new Date(dateCell);
            const from = fromDate ? new Date(fromDate) : null;
            const to = toDate ? new Date(toDate) : null;

            if (from && rowDate < from) showRow = false;
            if (to && rowDate > to) showRow = false;
        }

        row.style.display = showRow ? '' : 'none';
    }
}

// --- Export Functions ---
// ===================== Bookings Export =====================

// --- Export Bookings to PDF ---
const exportToPDF = async () => {
    const doc = new jsPDF();
    doc.text("Bookings Management", 10, 10);

    // Correct IDs matching your HTML
    const fromDate = document.getElementById('bookingsDateFrom')?.value;
    const toDate = document.getElementById('bookingsDateTo')?.value;

    const data = await fetchData('/api/bookings');
    if (data.success) {
        const table = document.createElement('table');
        const thead = table.createTHead();
        const tbody = table.createTBody();

        const headers = ['Name', 'Email', 'Gender', 'Date of Birth', 'Phone', 'Address', 'Message', 'Time Sent'];
        const headerRow = thead.insertRow();
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        data.data.forEach(booking => {
            const bookingDate = new Date(booking.time_sent);

            // Filter by date range if selected
            if ((fromDate && bookingDate < new Date(fromDate)) ||
                (toDate && bookingDate > new Date(toDate + 'T23:59:59'))) return;

            const row = tbody.insertRow();
            row.insertCell().textContent = booking.name || 'N/A';
            row.insertCell().textContent = booking.email || 'N/A';
            row.insertCell().textContent = booking.gender || 'N/A';
            row.insertCell().textContent = formatDate(booking.date_of_birth) || 'N/A';
            row.insertCell().textContent = booking.phone || 'N/A';
            row.insertCell().textContent = booking.address || 'N/A';
            row.insertCell().textContent = booking.message || 'N/A';
            row.insertCell().textContent = bookingDate.toLocaleString() || 'N/A';
        });

        doc.autoTable({
            html: table,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 133, 244] },
            bodyStyles: { textColor: [0, 0, 0] }
        });

        doc.save('bookings.pdf');
    }
};

// --- Export Bookings to Excel ---
const exportToExcel = async () => {
    const fromDate = document.getElementById('bookingsDateFrom')?.value;
    const toDate = document.getElementById('bookingsDateTo')?.value;

    const data = await fetchData('/api/bookings');
    if (data.success) {
        const table = document.createElement('table');
        const tbody = table.createTBody();

        data.data.forEach(booking => {
            const bookingDate = new Date(booking.time_sent);

            // Filter by date range if selected
            if ((fromDate && bookingDate < new Date(fromDate)) ||
                (toDate && bookingDate > new Date(toDate + 'T23:59:59'))) return;

            const row = tbody.insertRow();
            row.insertCell().textContent = booking.name || 'N/A';
            row.insertCell().textContent = booking.email || 'N/A';
            row.insertCell().textContent = booking.gender || 'N/A';
            row.insertCell().textContent = formatDate(booking.date_of_birth) || 'N/A';
            row.insertCell().textContent = booking.phone || 'N/A';
            row.insertCell().textContent = booking.address || 'N/A';
            row.insertCell().textContent = booking.message || 'N/A';
            row.insertCell().textContent = bookingDate.toLocaleString() || 'N/A';
        });

        const workbook = XLSX.utils.table_to_book(table, { sheet: "Bookings" });
        XLSX.writeFile(workbook, 'bookings.xlsx');
    }
};

// --- Event Listeners for Buttons ---
document.getElementById('exportBookingsPdfBtn').addEventListener('click', exportToPDF);
document.getElementById('exportBookingsExcelBtn').addEventListener('click', exportToExcel);

// ===================== Student Search, Filter & Export =====================

// --- Search and Filter Logic ---
// --- Search and Filter Logic ---
document.getElementById('studentSearch').addEventListener('input', filterStudents);
document.getElementById('studentClassFilter').addEventListener('change', filterStudents);

function filterStudents() {
    const searchValue = document.getElementById('studentSearch').value.toLowerCase().trim();
    const classValue = document.getElementById('studentClassFilter').value.toLowerCase().trim();

    const rows = document.querySelectorAll('#studentTableBody tr');

    rows.forEach(row => {
        const rowText = row.innerText.toLowerCase(); // includes all text in the row
        let show = true;

        // Match student name, id, or any field
        if (searchValue && !rowText.includes(searchValue)) show = false;

        // Match selected class
        if (classValue && !rowText.includes(classValue)) show = false;

        row.style.display = show ? '' : 'none';
    });
}

// --- Helper: Prepare Table for Export ---
// --- Helper: Prepare Table for Export ---
const prepareStudentTableForExport = async () => {
    const [studentData, classData] = await Promise.all([
        fetchData('/api/students'),
        fetchData('/api/classes')
    ]);

    const classMap = {};
    if (classData.success) {
        classData.data.forEach(cls => {
            classMap[`${cls.section_id}:${cls.id}`] = cls.name;
        });
    }

    const selectedClass = document.getElementById('studentClassFilter')?.value.toLowerCase().trim();

    if (studentData.success) {
        const table = document.createElement('table');
        const thead = table.createTHead();
        const tbody = table.createTBody();
        const headers = ['Student ID', 'Name', 'Gender', 'Date of Birth', 'Subjects', 'Classes', 'Guardian Phone', 'Address'];
        const headerRow = thead.insertRow();
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        studentData.data.forEach(student => {
            const uniqueSubjects = Array.isArray(student.subjects) ? [...new Set(student.subjects)].filter(s => s) : [student.subjects || 'N/A'];
            const subjectsDisplay = uniqueSubjects.join(', ');

            const uniqueClasses = Array.isArray(student.classes)
                ? [...new Set(student.classes)].map(cls => classMap[cls] || cls).filter(name => name)
                : [student.classes || 'N/A'];
            const classesDisplay = uniqueClasses.join(', ');

            // Skip student if selectedClass is not "all" and student doesn't have it
            if (selectedClass && selectedClass !== 'all' &&
                !uniqueClasses.some(clsName => clsName.toLowerCase().includes(selectedClass))
            ) return;

            const row = tbody.insertRow();
            row.insertCell().textContent = student.student_id || student.id || 'N/A';
            row.insertCell().textContent = student.name || student.full_name || 'N/A';
            row.insertCell().textContent = student.gender || 'N/A';
            row.insertCell().textContent = formatDate(student.date_of_birth) || 'N/A';
            row.insertCell().textContent = subjectsDisplay;
            row.insertCell().textContent = classesDisplay;
            row.insertCell().textContent = student.guardian_phone || 'N/A';
            row.insertCell().textContent = student.address || 'N/A';
        });

        return table;
    }

    return document.createElement('table'); // empty table if fetch fails
};

// --- Export Students to PDF ---
const exportStudentsToPDF = async () => {
    const doc = new jsPDF();
    doc.text("Student Management", 10, 10);

    const table = await prepareStudentTableForExport();
    doc.autoTable({
        html: table,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 133, 244] },
        bodyStyles: { textColor: [0, 0, 0] }
    });

    doc.save('students.pdf');
};

// --- Export Students to Excel ---
const exportStudentsToExcel = async () => {
    const table = await prepareStudentTableForExport();
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Students" });
    XLSX.writeFile(workbook, 'students.xlsx');
};

// --- Attach Export Buttons ---
document.getElementById('exportStudentsPdfBtn').addEventListener('click', exportStudentsToPDF);
document.getElementById('exportStudentsExcelBtn').addEventListener('click', exportStudentsToExcel);

// ===================== Staff Search & Export =====================

// ===================== Staff Search & Export =====================

// --- Search by Staff ID, Name, Email, or Phone ---
document.getElementById('staffSearch').addEventListener('input', filterStaff);

function filterStaff() {
    const searchValue = document.getElementById('staffSearch').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#staffTableBody tr');

    rows.forEach(row => {
        const rowText = row.innerText.toLowerCase();
        const show = !searchValue || rowText.includes(searchValue);
        row.style.display = show ? '' : 'none';
    });
}

// --- Prepare Table for Export ---
const prepareStaffTableForExport = async () => {
    const data = await fetchData('/api/staff');
    if (data.success) {
        const table = document.createElement('table');
        const thead = table.createTHead();
        const tbody = table.createTBody();
        const headers = ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Classes Taught', 'Subjects Taught', 'Form Master Info'];
        const headerRow = thead.insertRow();
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        data.data.forEach(staff => {
            const row = tbody.insertRow();
            row.insertCell().textContent = staff.staff_id || 'N/A';
            row.insertCell().textContent = staff.name || 'N/A';
            row.insertCell().textContent = staff.email || 'N/A';
            row.insertCell().textContent = staff.phone || 'N/A';
            row.insertCell().textContent = staff.role || 'N/A';
            row.insertCell().textContent = staff.classes_taught || 'N/A';
            row.insertCell().textContent = staff.subjects_taught || 'N/A';
            row.insertCell().textContent = staff.form_master_info || 'None';
        });
        return table;
    }
    return document.createElement('table'); // Return empty table if fetch fails
};

// --- Export Staff to PDF ---
const exportStaffToPDF = async () => {
    const doc = new jsPDF();
    doc.text("Staff Management", 10, 10);

    const table = await prepareStaffTableForExport();
    doc.autoTable({
        html: table,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 133, 244] },
        bodyStyles: { textColor: [0, 0, 0] }
    });

    doc.save('staff.pdf');
};

// --- Export Staff to Excel ---
const exportStaffToExcel = async () => {
    const table = await prepareStaffTableForExport();
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Staff" });
    XLSX.writeFile(workbook, 'staff.xlsx');
};

// --- Attach Export Buttons ---
document.getElementById('exportStaffPdfBtn').addEventListener('click', exportStaffToPDF);
document.getElementById('exportStaffExcelBtn').addEventListener('click', exportStaffToExcel);

// Translation Function
function translatePage(lang) {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);
    document.getElementById('langToggle').textContent = translations[lang].toggleLanguage;
}

function showMessageModal(titleKey, messageKey) {
    const title = translations[currentLang][titleKey] || titleKey;
    const message = translations[currentLang][messageKey] || messageKey;
    document.getElementById('messageModalLabel').textContent = title;
    document.getElementById('messageText').textContent = message;
    messageModal.show();
}

function showView(viewId) {
    document.querySelectorAll('#mainContent > div').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId + '-view').style.display = 'block';
    document.querySelectorAll('#sidebarNav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
    document.querySelector('.main-content-header h2').textContent = translations[currentLang][viewId.split('-')[0] + 'Overview'] || translations[currentLang][viewId.split('-')[0] + 'Management'] || translations[currentLang][viewId];
    if (viewId === 'dashboard') {
        renderDashboardOverview();
    } else if (viewId === 'bookings-management') {
        fetchDataAndRender('/api/bookings', renderBookings);
    } else if (viewId === 'student-management') {
        fetchDataAndRender('/api/students', (data) => {
            allStudents = data;
            renderStudents(data);
        });
    }
}

function updateUIBasedOnRole(role) {
    document.getElementById('feesNavItem').style.display = 'none';
    document.getElementById('bookingsNavItem').style.display = 'none';
    document.getElementById('adminManagementNavItem').style.display = 'none';
    document.getElementById('academicManagementNavItem').style.display = 'none';
    document.getElementById('pendingFeesCard').style.display = 'none';
    document.getElementById('totalBookingsCard').style.display = 'none';
    if (role === 'SuperAdmin') {
        document.getElementById('feesNavItem').style.display = 'block';
        document.getElementById('bookingsNavItem').style.display = 'block';
        document.getElementById('adminManagementNavItem').style.display = 'block';
        document.getElementById('academicManagementNavItem').style.display = 'block';
        document.getElementById('pendingFeesCard').style.display = 'block';
        document.getElementById('totalBookingsCard').style.display = 'block';
    } else if (role === 'DeputyAdmin') {
        document.getElementById('academicManagementNavItem').style.display = 'block';
    }
}

// Form Validation Function
function validateForm(form) {
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    form.classList.remove('was-validated');
    return true;
}

// Add Student button handler
document.getElementById('addStudentBtn').addEventListener('click', () => {
    document.getElementById('studentId').value = '';
    document.getElementById('studentCustomId').value = '';
    document.getElementById('studentFullName').value = '';
    document.getElementById('studentGuardianPhone').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentAddress').value = '';
    document.getElementById('studentGender').value = 'Male';
    document.getElementById('studentDob').value = '';

    // Reset classes and subjects
    const classSelect = document.getElementById('studentClasses');
    Array.from(classSelect.options).forEach(opt => opt.selected = false);
    const subjectSelect = document.getElementById('studentSubjects');
    Array.from(subjectSelect.options).forEach(opt => opt.selected = false);
    subjectSelect.disabled = true; // Disable until classes are selected

    // Reset profile picture
    const preview = document.getElementById('studentProfilePicturePreview');
    document.getElementById('studentProfilePicture').value = '';
    preview.src = '/Uploads/default.jpg';
    preview.style.display = 'none';

    document.getElementById('studentModalLabel').textContent = translations[currentLang].addStudent;
    studentModal.show();

    // Trigger subject filtering
    document.getElementById('studentClasses').dispatchEvent(new Event('change'));
});


let classesModified = false
let subjectsModified = false
let isProgrammaticUpdate = false

// Student Form handler
document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  // --- 1. Fetch Values ---
  const id = document.getElementById("studentId").value
  const studentId = document.getElementById("studentCustomId").value.trim()
  const fullName = document.getElementById("studentFullName").value.trim()
  const guardianPhone = document.getElementById("studentGuardianPhone").value.trim()
  const email = document.getElementById("studentEmail").value.trim()
  const address = document.getElementById("studentAddress").value.trim()
  const gender = document.getElementById("studentGender").value
  const dob = document.getElementById("studentDob").value

  // Basic required field validation (always applies)
  if (!studentId || !fullName || !guardianPhone || !address || !dob) {
    showMessageModal("error", translations[currentLang].requiredFieldsError)
    return
  }

  const classes = Array.from(document.getElementById("studentClasses").selectedOptions)
    .map((opt) => opt.value)
    .filter((val) => val)
  const subjects = Array.from(document.getElementById("studentSubjects").selectedOptions)
    .map((opt) => opt.value)
    .filter((val) => val)

  const formData = new FormData()
  const isEditMode = !!id
  let hasChanges = false

  // Core Student fields used for comparison in EDIT mode
  const currentCoreData = {
    student_id: studentId,
    full_name: fullName,
    guardian_phone: guardianPhone,
    email: email || "",
    address: address,
    gender: gender,
    date_of_birth: dob,
  }

  // --- 2. Logic for Edit Mode (Partial Update) ---
  if (isEditMode) {
    const originalData = JSON.parse(document.getElementById("studentForm").dataset.original || "{}")

    // 2a. Compare and append CORE student fields
    for (const key in currentCoreData) {
      const originalValue = String(
        originalData[key] === null || originalData[key] === undefined ? "" : originalData[key],
      )
      const currentValue = String(currentCoreData[key])

      if (currentValue !== originalValue) {
        formData.append(key, currentValue)
        hasChanges = true
      }
    }

    if (classesModified) {
      // Validate only if user touched this section
      if (classes.length === 0) {
        showMessageModal("error", translations[currentLang].classesRequired)
        return
      }
      classes.forEach((cls) => formData.append("classes[]", cls))
      formData.append("level", 1)
      formData.append("term", 1)
      hasChanges = true
    }

    if (subjectsModified) {
      // Validate only if user touched this section
      if (subjects.length === 0) {
        showMessageModal("error", translations[currentLang].subjectsRequired)
        return
      }
      subjects.forEach((sub) => formData.append("subjects[]", sub))
      // Only send level/term if classes was NOT processed
      if (!classesModified && !formData.has("level")) {
        formData.append("level", 1)
        formData.append("term", 1)
      }
      hasChanges = true
    }

    // 2c. Profile picture check
    const file = document.getElementById("studentProfilePicture").files[0]
    if (file) {
      formData.append("profile_picture", file)
      hasChanges = true
    }

    // Exit if no changes were detected
    if (!hasChanges) {
      showMessageModal(
        "info",
        translations[currentLang].noChangesDetected || "No changes detected. Nothing was submitted.",
      )
      studentModal.hide()
      classesModified = false
      subjectsModified = false
      return
    }
  } else {
    // --- 3. Logic for Add Mode (Full Insert) ---

    if (classes.length === 0) {
      showMessageModal("error", translations[currentLang].classesRequired)
      return
    }
    if (subjects.length === 0) {
      showMessageModal("error", translations[currentLang].subjectsRequired)
      return
    }

    // Append all fields for a new record
    formData.append("student_id", studentId)
    formData.append("full_name", fullName)
    formData.append("guardian_phone", guardianPhone)
    formData.append("email", email || "")
    formData.append("address", address)
    formData.append("gender", gender)
    formData.append("date_of_birth", dob)
    formData.append("level", 1)
    formData.append("term", 1)
    classes.forEach((cls) => formData.append("classes[]", cls))
    subjects.forEach((sub) => formData.append("subjects[]", sub))

    const file = document.getElementById("studentProfilePicture").files[0]
    if (file) formData.append("profile_picture", file)
  }

  // --- 4. Submission Logic ---
  console.log("Submitting form data:", isEditMode ? "PARTIAL UPDATE" : "FULL INSERT")

  try {
    const url = id ? `/api/students/${id}` : "/api/students"
    const method = id ? "PUT" : "POST"
    const response = await fetch(url, { method, body: formData, credentials: "include" })

    if (!response.ok) {
      const errorResult = await response.json()
      throw new Error(errorResult.message || `API call failed with status ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      showMessageModal("success", translations[currentLang].studentSaved)

      // Success cleanup
      studentModal.hide()
      document.getElementById("studentForm").reset()
      document.getElementById("studentProfilePicturePreview").style.display = "none"
      document.getElementById("studentSubjects").disabled = true
      classesModified = false
      subjectsModified = false
      refreshData()
    } else {
      showMessageModal("error", result.message || translations[currentLang].duplicateStudent)
    }
  } catch (err) {
    console.error("Error saving student:", err)
    showMessageModal("error", err.message || "Server error while saving student.")
  }
})

document.getElementById("studentClasses").addEventListener("change", () => {
  if (!isProgrammaticUpdate) {
    classesModified = true
  }
})

document.getElementById("studentSubjects").addEventListener("change", () => {
  if (!isProgrammaticUpdate) {
    subjectsModified = true
  }
})

// Edit Student function
function editStudent(student) {
  console.log("Editing student:", student)

  classesModified = false
  subjectsModified = false
  isProgrammaticUpdate = true

  document.getElementById("studentId").value = student.id
  document.getElementById("studentCustomId").value = student.student_id || ""
  document.getElementById("studentFullName").value = student.full_name || student.name || ""
  document.getElementById("studentGuardianPhone").value = student.guardian_phone || ""
  document.getElementById("studentEmail").value = student.email || ""
  document.getElementById("studentAddress").value = student.address || ""
  document.getElementById("studentGender").value = student.gender || "Male"

  // Trim date to YYYY-MM-DD
  const dobInput = document.getElementById("studentDob")
  dobInput.value = student.date_of_birth ? new Date(student.date_of_birth).toISOString().split("T")[0] : ""

  // Set classes
  const classSelect = document.getElementById("studentClasses")
  Array.from(classSelect.options).forEach((opt) => (opt.selected = false))
  if (Array.isArray(student.classes)) {
    student.classes.forEach((cls) => {
      const option = Array.from(classSelect.options).find((opt) => opt.value === cls)
      if (option) option.selected = true
    })
  }

  // Trigger subjects reload based on selected classes
  document.getElementById("studentClasses").dispatchEvent(new Event("change"))

  // Set subjects AND prepare standardized original list
  const subjectSelect = document.getElementById("studentSubjects")
  Array.from(subjectSelect.options).forEach((opt) => (opt.selected = false))

  // Standardize the original subject IDs here
  const standardizedOriginalSubjects = []

  if (Array.isArray(student.subjects)) {
    student.subjects.forEach((sub) => {
      // Extract the simple subject_id, whether the format is '1:2' or just '2'
      const subject_id = sub.includes(":") ? sub.split(":")[1] : sub

      // Store the simple ID for accurate comparison later
      standardizedOriginalSubjects.push(subject_id)

      // Also select the option in the form
      const option = Array.from(subjectSelect.options).find((opt) => opt.value === subject_id)
      if (option) option.selected = true
    })
  }

  // Profile picture preview
  const preview = document.getElementById("studentProfilePicturePreview")
  preview.src = student.profile_picture ? `/${student.profile_picture}` : "/Uploads/default.jpg"
  preview.style.display = student.profile_picture ? "block" : "none"
  document.getElementById("studentProfilePicture").value = ""

  document.getElementById("studentModalLabel").textContent = translations[currentLang].editStudent

  // Store original values for comparison later
  document.getElementById("studentForm").dataset.original = JSON.stringify({
    student_id: student.student_id,
    full_name: student.full_name || student.name,
    guardian_phone: student.guardian_phone,
    email: student.email,
    address: student.address,
    gender: student.gender,
    date_of_birth: dobInput.value,
    classes: Array.isArray(student.classes) ? [...student.classes] : [],
    // Use the standardized list for comparison
    subjects: standardizedOriginalSubjects,
  })

  setTimeout(() => {
    isProgrammaticUpdate = false
  }, 100)

  studentModal.show()
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const firstLoginForm = document.getElementById('firstLoginForm');
    const staffForm = document.getElementById('staffForm');
    const studentForm = document.getElementById('studentForm');
    const adminForm = document.getElementById('adminForm');
    const setFeesForm = document.getElementById('setFeesForm');
    const academicCalendarForm = document.getElementById('academicCalendarForm');
    const generateIdCardButton = document.getElementById('generate-id-card-button');
    const generateReportSheetButton = document.getElementById('generate-report-sheet-button');
    const generateReportSheetsBtn = document.getElementById('generateReportSheetsBtn');
    const addStaffBtn = document.getElementById('addStaffBtn');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const addAdminBtn = document.getElementById('addAdminBtn');
    const exportBookingsPdfBtn = document.getElementById('exportBookingsPdfBtn');
    const exportBookingsExcelBtn = document.getElementById('exportBookingsExcelBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const reportTypeSelect = document.getElementById('report-type');
    const termContainer = document.getElementById('term-container');

    // Set sidebar initial state
    function setSidebarInitialState() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('open');
        } else {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('open');
        }
    }
    setSidebarInitialState();

    // Handle resizing
    window.addEventListener('resize', setSidebarInitialState);

    // Toggle sidebar on mobile
    sidebarToggleMobile.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
            sidebar.classList.toggle('collapsed');
        }
    });

    // Language toggle
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        translatePage(currentLang);
    });

    // Sidebar navigation
    document.getElementById('sidebarNav').addEventListener('click', (event) => {
        const link = event.target.closest('.nav-link');
        if (link) {
            const view = link.getAttribute('data-view');
            showView(view);
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                sidebar.classList.add('collapsed');
            }
        }
    });

    // Profile Picture Preview for Staff
    document.getElementById('staffProfilePicture').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('staffProfilePicturePreview');
        const fileInput = e.target;
        if (file) {
            if (file.size > 200 * 1024) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            fileInput.classList.remove('is-invalid');
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        } else {
            preview.src = '/Uploads/default.jpg';
            preview.style.display = 'none';
        }
    });

    // Profile Picture Preview for Student
    document.getElementById('studentProfilePicture').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('studentProfilePicturePreview');
        const fileInput = e.target;
        if (file) {
            if (file.size > 200 * 1024) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            fileInput.classList.remove('is-invalid');
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        } else {
            preview.src = '/Uploads/default.jpg';
            preview.style.display = 'none';
        }
    });


    // Function to populate class select dropdowns
async function populateClassSelects() {
    const classData = await fetchData('/api/classes');
    const classSelect = document.getElementById('classSelect');
    const trackClassSelect = document.getElementById('trackClassSelect');

    if (classData.success) {
        // Clear existing options
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        trackClassSelect.innerHTML = '<option value="">-- Select Class --</option>';

        classData.data.forEach(cls => {
            const option = document.createElement('option');
            option.value = `${cls.section_id}:${cls.id}`; // Format: section_id:class_id
            option.textContent = cls.name;
            classSelect.appendChild(option.cloneNode(true));
            trackClassSelect.appendChild(option);
        });
    } else {
        console.error('Failed to fetch classes:', classData.message);
        showMessageModal('error', 'Failed to load classes.');
    }
}

// Function to render the payment tracking table
async function renderPaymentTable(feeData) {
    const tableBody = document.getElementById('paymentTableBody');
    tableBody.innerHTML = '';

    if (!feeData || feeData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No payment records found.</td></tr>';
        return;
    }

    const classData = await fetchData('/api/classes');
    const classMap = {};
    if (classData.success) {
        classData.data.forEach(cls => {
            classMap[`${cls.section_id}:${cls.id}`] = cls.name;
        });
    }

    feeData.forEach(fee => {
        const row = document.createElement('tr');
        const classDisplay = classMap[`${fee.section_id}:${fee.class_ref}`] || 'N/A';
        row.innerHTML = `
            <td>${fee.student_name || 'N/A'}</td>
            <td>${classDisplay}</td>
            <td>${fee.guardian_phone || 'N/A'}</td>
            <td>${fee.amount_paid.toFixed(2)}</td>
            <td>${fee.remaining_amount.toFixed(2)}</td>
            <td>
                <span class="badge ${fee.status === 'Completed' ? 'bg-success' : 'bg-warning'}">
                    ${fee.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary add-payment-btn" 
                        data-student-id="${fee.student_id}" 
                        data-student-name="${fee.student_name}" 
                        data-student-fee-id="${fee.student_fee_id}" 
                        title="Add Payment">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    translatePage(currentLang);
}


    // Add Modal Triggers
    document.getElementById('addStaffBtn').addEventListener('click', () => {
        document.getElementById('staffId').value = '';
        document.getElementById('staffStaffId').value = '';
        document.getElementById('staffFullName').value = '';
        document.getElementById('staffEmail').value = '';
        document.getElementById('staffPhone').value = '';
        document.getElementById('staffRole').value = 'Form Teacher';
        document.getElementById('formMasterClass').value = '';
        const classesTaughtSelect = document.getElementById('classesTaught');
        Array.from(classesTaughtSelect.options).forEach(opt => opt.selected = false);
        const subjectsTaughtSelect = document.getElementById('subjectsTaught');
        Array.from(subjectsTaughtSelect.options).forEach(opt => opt.selected = false);
        const passwordInput = document.getElementById('staffPassword');
        passwordInput.value = 'default';
        passwordInput.disabled = true;
        passwordInput.required = false;
        document.getElementById('staffPasswordGroup').style.display = 'block';
        document.getElementById('formMasterGroup').style.display = 'block';
        document.getElementById('staffProfilePicture').value = '';
        const preview = document.getElementById('staffProfilePicturePreview');
        preview.src = '/Uploads/default.jpg';
        preview.style.display = 'none';
        document.getElementById('staffModalLabel').textContent = translations[currentLang].addStaff;
        staffModal.show();
    });

    document.getElementById('addAdminBtn').addEventListener('click', () => {
        document.getElementById('adminId').value = '';
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminName').value = '';
        document.getElementById('adminPhone').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').required = true;
        document.getElementById('adminPasswordGroup').style.display = 'block';
        document.getElementById('adminRole').value = 'Admin';
        document.getElementById('adminSecurityQuestion').value = "What is your pet's name?";
        document.getElementById('adminSecurityAnswer').value = '';
        document.getElementById('adminModalLabel').textContent = translations[currentLang].addAdmin;
        adminModal.show();
    });

    // Report Type Change Handling
    document.getElementById('report-type').addEventListener('change', () => {
        document.getElementById('term-container').style.display = document.getElementById('report-type').value === 'terminal' ? 'block' : 'none';
    });

    // Export Buttons
    document.getElementById('exportBookingsPdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('exportBookingsExcelBtn').addEventListener('click', exportToExcel);

    // Role change listener for Form Master visibility
    document.getElementById('staffRole').addEventListener('change', (e) => {
        const formMasterGroup = document.getElementById('formMasterGroup');
        formMasterGroup.style.display = e.target.value === 'Form Teacher' ? 'block' : 'none';
    });

    // Student Class Filter
    document.getElementById('studentClassFilter').addEventListener('change', (e) => {
        const selectedClass = e.target.value;
        const filteredStudents = allStudents.filter(student => {
            if (!selectedClass) return true;
            return Array.isArray(student.classes) && student.classes.includes(selectedClass);
        });
        renderStudents(filteredStudents);
    });

    // First Login Handling
    document.getElementById('firstLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(document.getElementById('firstLoginForm'))) return;

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('first-login-error-message');
        errorMessage.classList.add('d-none');

        if (newPassword !== confirmPassword) {
            errorMessage.textContent = translations[currentLang].passwordsMatchError;
            errorMessage.classList.remove('d-none');
            return;
        }

        const formData = {
            username: document.getElementById('currentUsername').value,
            newUsername: document.getElementById('newUsername').value,
            newPassword: newPassword,
            newName: document.getElementById('newName').value,
            newPhone: document.getElementById('newPhone').value,
            securityQuestion: document.getElementById('securityQuestion').value,
            securityAnswer: document.getElementById('securityAnswer').value
        };

        const result = await postData('/api/update-admin-credentials', formData);

        if (result.success) {
            document.getElementById('userRoleDisplay').textContent = result.data?.role || 'N/A';
            document.getElementById('usernameDisplay').textContent = formData.newUsername;
            document.getElementById('adminNameDisplay').textContent = formData.newName || 'Admin';
            firstLoginModal.hide();
            sessionStorage.removeItem('currentUsername');
            showMessageModal('updateCredentials', 'updateSuccess');
            renderDashboardOverview();
            refreshData();
        } else {
            errorMessage.textContent = result.message || translations[currentLang].userNotFound;
            errorMessage.classList.remove('d-none');
        }
    });

    // Staff Form Handling
    document.getElementById('staffForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(document.getElementById('staffForm'))) return;
        const id = document.getElementById('staffId').value;
        const staffData = {
            id,
            staff_id: document.getElementById('staffStaffId').value,
            name: document.getElementById('staffFullName').value,
            email: document.getElementById('staffEmail').value || null,
            phone: document.getElementById('staffPhone').value,
            role: document.getElementById('staffRole').value,
            form_master_class: document.getElementById('formMasterClass').value || null,
            classes_taught: Array.from(document.getElementById('classesTaught').selectedOptions).map(opt => opt.value).filter(val => val),
            subjects_taught: Array.from(document.getElementById('subjectsTaught').selectedOptions).map(opt => opt.value).filter(val => val)
        };
        // Force null for form_master_class if role is not Form Teacher
        if (staffData.role !== 'Form Teacher') {
            staffData.form_master_class = null;
        }
        staffData.password = document.getElementById('staffPassword').value;
        const fileInput = document.getElementById('staffProfilePicture');
        const file = fileInput.files[0];
        if (file) {
            if (file.size > 200 * 1024) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                fileInput.classList.add('is-invalid');
                showMessageModal('error', translations[currentLang].profilePictureInvalid);
                return;
            }
            fileInput.classList.remove('is-invalid');
        }
        const endpoint = id ? `/api/staff/${id}` : '/api/staff';
        const method = id ? 'PUT' : 'POST';
        const staffResult = await fetchData(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData)
        });
        if (staffResult.success) {
            let savedStaffId = id;
            if (!id) {
                const allStaff = await fetchData('/api/staff');
                if (allStaff.success) {
                    const newStaff = allStaff.data.find(s => s.staff_id === staffData.staff_id);
                    if (newStaff) {
                        savedStaffId = newStaff.id;
                    } else {
                        showMessageModal('error', 'Failed to retrieve new staff ID.');
                        return;
                    }
                } else {
                    showMessageModal('error', 'Failed to fetch staff list.');
                    return;
                }
            }
            if (file) {
                const formData = new FormData();
                formData.append('profilePicture', file);
                formData.append('staffId', savedStaffId);
                const uploadResult = await postData('/api/staff/upload-profile-picture', formData, true);
                if (!uploadResult.success) {
                    showMessageModal('error', uploadResult.message || 'Failed to upload profile picture.');
                    return;
                }
            }
            showMessageModal('success', translations[currentLang].staffSaved);
            staffModal.hide();
            document.getElementById('staffForm').reset();
            document.getElementById('staffPassword').value = 'default';
            document.getElementById('staffPassword').disabled = true;
            document.getElementById('staffPasswordGroup').style.display = 'block';
            document.getElementById('formMasterGroup').style.display = 'block';
            document.getElementById('staffProfilePicture').value = '';
            document.getElementById('staffProfilePicturePreview').style.display = 'none';
            refreshData();
        } else {
            showMessageModal('error', staffResult.message || 'Failed to save staff.');
        }
    });

    // Admin Form Handling
    document.getElementById('adminForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(document.getElementById('adminForm'))) return;
        const id = document.getElementById('adminId').value;
        const adminData = {
            username: document.getElementById('adminUsername').value,
            name: document.getElementById('adminName').value,
            phone: document.getElementById('adminPhone').value,
            role: document.getElementById('adminRole').value,
            securityQuestion: document.getElementById('adminSecurityQuestion').value,
            securityAnswer: document.getElementById('adminSecurityAnswer').value
        };
        const password = document.getElementById('adminPassword').value;
        if (!id && (!password || password.length < 8)) {
            showMessageModal('error', translations[currentLang].passwordLength);
            return;
        }
        if (password) adminData.password = password;
        const endpoint = id ? `/api/admins/${id}` : '/api/create-admin';
        const method = id ? 'PUT' : 'POST';
        const result = await fetchData(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });
        if (result.success) {
            showMessageModal('adminSaved', id ? 'Admin updated successfully.' : 'Admin added successfully.');
            adminModal.hide();
            document.getElementById('adminForm').reset();
            document.getElementById('adminPasswordGroup').style.display = 'block';
            document.getElementById('adminPassword').required = true;
            refreshData();
        } else {
            showMessageModal('error', result.message || 'Failed to save admin.');
        }
    });

   

    // Academic Calendar Form Handling
    document.getElementById('academicCalendarForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(document.getElementById('academicCalendarForm'))) return;
        const startDate = document.getElementById('termStartDate').value;
        const endDate = document.getElementById('termEndDate').value;
        const result = await postData('/api/schedule', { startDate, endDate });
        if (result.success) {
            showMessageModal('datesSaved', 'Academic calendar updated successfully.');
            document.getElementById('academicCalendarForm').reset();
        } else {
            showMessageModal('error', result.message || 'Failed to save academic calendar.');
        }
    });

    // Generate ID Card
    document.getElementById('generate-id-card-button').addEventListener('click', async () => {
        const entityType = document.getElementById('id-card-entity-type').value;
        const entityId = document.getElementById('id-card-entity-id').value;
        const result = await postData('/api/generate-id-card', { entityType, entityId });
        if (result.success) {
            showMessageModal('idCardGenerated', `ID Card generated for ${entityType} ${entityId}`);
        } else {
            showMessageModal('error', result.message || 'Failed to generate ID card.');
        }
    });

    // Generate Report Sheet
    document.getElementById('generate-report-sheet-button').addEventListener('click', async () => {
        const studentId = document.getElementById('report-student-id').value;
        const reportType = document.getElementById('report-type').value;
        const session = document.getElementById('report-session').value;
        const term = reportType === 'terminal' ? document.getElementById('report-term').value : null;
        const reportData = { studentId, reportType, session };
        if (term) reportData.term = term;
        const result = await postData('/api/generate-report-sheet', reportData);
        if (result.success) {
            showMessageModal('reportSheetGenerated', `Report sheet generated for student ${studentId}`);
        } else {
            showMessageModal('error', result.message || 'Failed to generate report sheet.');
        }
    });

    // Generate Report Sheets (Bulk)
    document.getElementById('generateReportSheetsBtn').addEventListener('click', async () => {
        const result = await postData('/api/generate-report-sheets', {});
        if (result.success) {
            showMessageModal('reportSheetsGenerated', 'Report sheets generated successfully.');
        } else {
            showMessageModal('error', result.message || 'Failed to generate report sheets.');
        }
    });

    // Edit and Delete Button Handling
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-button')) {
            const id = e.target.getAttribute('data-id');
            const type = e.target.getAttribute('data-type');
            if (type === 'staff') {
                const staffData = await fetchData(`/api/staff/${id}`);
                console.log('Fetched staff data for editing:', staffData); // Debug
                if (staffData.success) {
                    const staff = staffData.data;
                    document.getElementById('staffId').value = staff.id;
                    document.getElementById('staffStaffId').value = staff.staff_id;
                    document.getElementById('staffFullName').value = staff.name;
                    document.getElementById('staffEmail').value = staff.email || '';
                    document.getElementById('staffPhone').value = staff.phone;
                    document.getElementById('staffRole').value = staff.role;

                    // Set classes_taught
                    const classesTaughtSelect = document.getElementById('classesTaught');
                    Array.from(classesTaughtSelect.options).forEach(opt => opt.selected = false);
                    if (staff.classes && Array.isArray(staff.classes)) {
                        staff.classes.forEach(cls => {
                            const value = `${cls.section_id}:${cls.class_id}`;
                            const option = Array.from(classesTaughtSelect.options).find(opt => opt.value === value);
                            if (option) {
                                option.selected = true;
                            } else {
                                console.warn(`Class ${value} not found in classesTaught options`);
                            }
                        });
                    } else {
                        console.warn('staff.classes is empty or not an array:', staff.classes);
                    }

                    // Set subjects_taught
                    const subjectsTaughtSelect = document.getElementById('subjectsTaught');
                    Array.from(subjectsTaughtSelect.options).forEach(opt => opt.selected = false);
                    if (staff.subjects && Array.isArray(staff.subjects)) {
                        staff.subjects.forEach(sub => {
                            const value = `${sub.section_id}:${sub.subject_id}`;
                            const option = Array.from(subjectsTaughtSelect.options).find(opt => opt.value === value);
                            if (option) {
                                option.selected = true;
                            } else {
                                console.warn(`Subject ${value} not found in subjectsTaught options`);
                            }
                        });
                    } else {
                        console.warn('staff.subjects is empty or not an array:', staff.subjects);
                    }

                    const formMasterSelect = document.getElementById('formMasterClass');
                    formMasterSelect.value = staff.formMaster ? `${staff.formMaster.section_id}:${staff.formMaster.class_id}` : '';
                    document.getElementById('staffPasswordGroup').style.display = 'none';
                    const passwordInput = document.getElementById('staffPassword');
                    passwordInput.value = '';
                    passwordInput.disabled = true;
                    document.getElementById('staffPassword').required = false;
                    document.getElementById('formMasterGroup').style.display = staff.role === 'Form Teacher' ? 'block' : 'none';
                    const preview = document.getElementById('staffProfilePicturePreview');
                    preview.src = staff.profile_picture ? `/${staff.profile_picture}` : '/Uploads/default.jpg';
                    preview.style.display = staff.profile_picture ? 'block' : 'none';
                    document.getElementById('staffProfilePicture').value = '';
                    document.getElementById('staffModalLabel').textContent = translations[currentLang].editStaff || 'Edit Staff';
                    staffModal.show();
                } else {
                    showMessageModal('error', staffData.message || 'Failed to fetch staff.');
                }
            } else if (type === 'student') {
                const studentData = await fetchData(`/api/students/${id}`);
                if (studentData.success) {
                    editStudent(studentData.data);
                } else {
                    showMessageModal('error', studentData.message || 'Failed to fetch student.');
                }
            } else if (type === 'admin') {
                const adminData = await fetchData(`/api/admins/${id}`);
                if (adminData.success) {
                    document.getElementById('adminId').value = adminData.data.id;
                    document.getElementById('adminUsername').value = adminData.data.username;
                    document.getElementById('adminName').value = adminData.data.name;
                    document.getElementById('adminPhone').value = adminData.data.phone;
                    document.getElementById('adminPassword').value = '';
                    document.getElementById('adminPassword').required = false;
                    document.getElementById('adminPasswordGroup').style.display = 'block';
                    document.getElementById('adminRole').value = adminData.data.role || 'Admin';
                    document.getElementById('adminSecurityQuestion').value = adminData.data.securityQuestion || "What is your pet's name?";
                    document.getElementById('adminSecurityAnswer').value = adminData.data.securityAnswer || '';
                    document.getElementById('adminModalLabel').textContent = translations[currentLang].editAdmin || 'Edit Admin';
                    adminModal.show();
                } else {
                    showMessageModal('error', adminData.message || 'Failed to fetch admin.');
                }
            }
        } else if (e.target.classList.contains('delete-button')) {
            const id = e.target.getAttribute('data-id');
            const type = e.target.getAttribute('data-type');
            if (confirm(translations[currentLang].confirmDelete || 'Are you sure you want to delete this record?')) {
                const endpoint = type === 'staff' ? `/api/staff/${id}` : type === 'student' ? `/api/students/${id}` : `/api/admins/${id}`;
                const result = await deleteData(endpoint);
                if (result.success) {
                    showMessageModal('recordDeleted', `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`);
                    refreshData();
                } else {
                    showMessageModal('error', result.message || `Failed to delete ${type}.`);
                }
            }
        }
    });

    // Logout Handling
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        const result = await fetchData('/api/logout', { method: 'POST' });
        if (result.success) {
            window.location.href = '/admin-login';
        } else {
            showMessageModal('error', result.message || 'Failed to log out.');
        }
    });
    // Initial Page Load
    (async () => {
        const userData = await fetchData('/api/user-details');
        if (userData.success) {
            document.getElementById('userRoleDisplay').textContent = userData.data.role || 'N/A';
            document.getElementById('usernameDisplay').textContent = userData.data.username || 'N/A';
            document.getElementById('adminNameDisplay').textContent = userData.data.name || 'Admin';
            updateUIBasedOnRole(userData.data.role);
            if (userData.data.firstLogin) {
                document.getElementById('currentUsername').value = userData.data.username;
                firstLoginModal.show();
            } else {
                renderDashboardOverview();
                refreshData();
                await populateClasses();
                await populateSubjects();
            }
        } else {
            showMessageModal('error', userData.message || 'Failed to load user details.');
            setTimeout(() => window.location.href = '/admin-login', 2000);
        }
        translatePage(currentLang);
    })();

});