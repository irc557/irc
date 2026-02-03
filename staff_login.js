const translations = {
    en: {
        loginTitle: "Staff Login",
        staffId: "Staff ID",
        password: "Password",
        updateCreds: "Update Credentials",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        submit: "Submit",
        back: "Back",
        forgotPassword: "Forgot Password?",
        securityQuestion: "Security Question",
        securityAnswer: "Security Answer",
        resetPasswordTitle: "Reset Password",
        resetPasswordBtn: "Reset Password",
        newPasswordLabel: "New Password (min 6 chars)",
        newPasswordPrompt: "Enter your new password.",
        answerQuestion: "Answer your security question to continue.",
        verify: "Verify Answer",
        toggleLanguage: "العربية",
        backToHome: "Back to Home",
        secureAccess: "Secure access to the Ibadurrahman College Staff system.",
        secure: "Secure",
        control: "Control",
        analytics: "Analytics",
        staffLogin: "Staff Login",
        signInDesc: "Sign in to access the staff dashboard.",
        allFieldsRequired: "All fields are required.",
        rememberMe: "Remember me",
        signIn: "Sign In",
        authorizedOnly: "Authorized personnel only",
        updateCredentials: "Update Your Credentials",
        updateCredentialsDesc: "Please update your credentials to continue.",
        newStaffIdLabel: "New Staff ID",
        nameLabel: "Full Name",
        phoneLabel: "Phone Number",
        emailLabel: "Email (Optional)",
        newSecurityQuestion: "Security Question",
        newSecurityAnswer: "Security Answer",
        updateCredentialsBtn: "Update Credentials",
        selectQuestion: "Select a security question",
        securityQuestion1: "What is your pet's name?",
        securityQuestion2: "What is your mother's maiden name?",
        securityQuestion3: "What is the name of your first school?",
        securityQuestion4: "What is your favorite book?",
        securityQuestion5: "What is the name of your hometown?",
        collegeName: "Ibadurrahman College",
        next: "Next",
        close: "Close",
        errors: {
            enterStaffId: "Please enter your Staff ID.",
            emptyAnswer: "Security answer cannot be empty.",
            passwordShort: "Password must be at least 6 characters."
        }
    },
    ar: {
        loginTitle: "تسجيل دخول الموظف",
        staffId: "معرف الموظف",
        password: "كلمة المرور",
        updateCreds: "تحديث بيانات الدخول",
        newPassword: "كلمة مرور جديدة",
        confirmPassword: "تأكيد كلمة المرور",
        submit: "إرسال",
        back: "رجوع",
        forgotPassword: "هل نسيت كلمة المرور؟",
        securityQuestion: "سؤال الأمان",
        securityAnswer: "إجابة الأمان",
        resetPasswordTitle: "إعادة تعيين كلمة المرور",
        resetPasswordBtn: "إعادة تعيين كلمة المرور",
        newPasswordLabel: "كلمة مرور جديدة (6 أحرف على الأقل)",
        newPasswordPrompt: "أدخل كلمة مرورك الجديدة.",
        answerQuestion: "أجب عن سؤال الأمان للمتابعة.",
        verify: "تحقق من الإجابة",
        toggleLanguage: "English",
        backToHome: "العودة إلى الصفحة الرئيسية",
        secureAccess: "الوصول الآمن إلى نظام موظفي كلية عباد الرحمن",
        secure: "آمن",
        control: "التحكم",
        analytics: "التحليلات",
        staffLogin: "تسجيل دخول الموظف",
        signInDesc: "تسجيل الدخول للوصول إلى لوحة تحكم الموظفين.",
        allFieldsRequired: "جميع الحقول مطلوبة.",
        rememberMe: "تذكرني",
        signIn: "تسجيل الدخول",
        authorizedOnly: "للأشخاص المخولين فقط",
        updateCredentials: "تحديث بيانات الدخول",
        updateCredentialsDesc: "يرجى تحديث بيانات الدخول للمتابعة.",
        newStaffIdLabel: "معرف الموظف الجديد",
        nameLabel: "الاسم الكامل",
        phoneLabel: "رقم الهاتف",
        emailLabel: "البريد الإلكتروني (اختياري)",
        newSecurityQuestion: "سؤال الأمان",
        newSecurityAnswer: "إجابة الأمان",
        updateCredentialsBtn: "تحديث بيانات الدخول",
        selectQuestion: "اختر سؤال الأمان",
        securityQuestion1: "ما اسم حيوانك الأليف؟",
        securityQuestion2: "ما هو اسم والدتك قبل الزواج؟",
        securityQuestion3: "ما اسم مدرستك الأولى؟",
        securityQuestion4: "ما هو كتابك المفضل؟",
        securityQuestion5: "ما اسم مدينتك الأصلية؟",
        collegeName: "كلية عباد الرحمن",
        next: "التالي",
        close: "إغلاق",
        errors: {
            enterStaffId: "الرجاء إدخال معرف الموظف.",
            emptyAnswer: "لا يمكن أن يكون جواب الأمان فارغًا.",
            passwordShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        }
    }
};

let currentLang = localStorage.getItem("lang") || "en";

function translatePage(lang) {
    document.querySelectorAll("[data-translate]").forEach(el => {
        const key = el.getAttribute("data-translate");
        const keys = key.split(".");
        let value = translations[lang];
        keys.forEach(k => value = value?.[k]);
        if (value) {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.setAttribute("placeholder", value);
            } else {
                el.textContent = value;
            }
        }
    });
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("lang", lang);
}

// --- UTILITY FUNCTION (Must be defined first) ---
const showMessageModal = (title, message) => {
    const modalTitle = document.getElementById('messageModalLabel');
    const modalText = document.getElementById('messageText');
    const messageModalElement = document.getElementById('messageModal');

    if (modalTitle && modalText && messageModalElement) {
        modalTitle.textContent = title;
        modalText.textContent = message;
        const modal = new bootstrap.Modal(messageModalElement);
        modal.show();
    } else {
        alert(`${title}: ${message}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Apply translation on load ---
    translatePage(currentLang);
    const langToggleBtn = document.getElementById("langToggle");
    if (langToggleBtn) {
        langToggleBtn.addEventListener("click", () => {
            currentLang = currentLang === "en" ? "ar" : "en";
            translatePage(currentLang);
        });
    }

    // --- LOGIN & UPDATE ELEMENTS ---
    const staffLoginForm = document.getElementById('staffLoginForm');
    const loginFormSection = document.getElementById('loginFormSection');
    const updateCredentialsSection = document.getElementById('updateCredentialsSection');
    const updateCredentialsForm = document.getElementById('updateCredentialsForm');
    const staffIdInput = document.getElementById('staffId');
    const passwordInput = document.getElementById('password');
    const originalStaffIdInput = document.getElementById('originalStaffId');

    // --- FORGOT PASSWORD ELEMENTS ---
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotStep1 = document.getElementById('forgotStep1');
    const forgotStep2 = document.getElementById('forgotStep2');
    const forgotStep3 = document.getElementById('forgotStep3');
    const forgotStaffIdInput = document.getElementById('forgotStaffId');
    const forgotNextBtn = document.getElementById('forgotNextBtn');
    
    let currentForgotStaffId = ''; 

    // --- LOGIN FORM SUBMISSION ---
    if (staffLoginForm) {
        staffLoginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            if (!staffLoginForm.checkValidity()) {
                staffLoginForm.classList.add('was-validated');
                return;
            }

            const staffId = staffIdInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('/api/staff-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staffId, password })
                });
                const result = await response.json();

                if (result.success) {
                    if (result.message.includes('First-time login')) {
                        loginFormSection.classList.add('d-none');
                        updateCredentialsSection.classList.remove('d-none');
                        originalStaffIdInput.value = staffId;
                        document.getElementById('newStaffId').value = staffId; 
                        showMessageModal('⚠️', result.message);
                    } else {
                        window.location.href = result.redirect;
                    }
                } else {
                    showMessageModal('❌', result.message);
                }
            } catch (error) {
                showMessageModal('🛑', 'Server connection failed.');
            }
        });
    }

    // --- UPDATE CREDENTIALS FORM ---
    if (updateCredentialsForm) {
        updateCredentialsForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            if (!updateCredentialsForm.checkValidity()) {
                updateCredentialsForm.classList.add('was-validated');
                return;
            }

            const formData = {
                staffId: originalStaffIdInput.value,
                newStaffId: document.getElementById('newStaffId').value,
                newName: document.getElementById('newName').value,
                newPhone: document.getElementById('newPhone').value,
                newEmail: document.getElementById('newEmail').value,
                newPassword: document.getElementById('newPasswordInput').value,
                securityQuestion: document.getElementById('newSecurityQuestion').value,
                securityAnswer: document.getElementById('newSecurityAnswerInput').value,
            };

            try {
                const response = await fetch('/api/update-staff-credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();

                if (result.success) {
                    showMessageModal('🎉', result.message);
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1500);
                } else {
                    showMessageModal('😔', result.message);
                }
            } catch (error) {
                showMessageModal('🛑', 'Failed to update credentials.');
            }
        });
    }

    // --- FORGOT PASSWORD HANDLERS ---
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('hidden.bs.modal', () => {
            forgotStep1.classList.remove('d-none');
            forgotStep2.classList.add('d-none');
            forgotStep3.classList.add('d-none');
            forgotStaffIdInput.value = '';
            currentForgotStaffId = '';
        });
    }

    if (forgotNextBtn) {
        forgotNextBtn.addEventListener('click', async () => {
            const staff_id = forgotStaffIdInput.value.trim();
            if (!staff_id) {
                showMessageModal('Error', translations[currentLang].errors.enterStaffId);
                return;
            }
            currentForgotStaffId = staff_id;

            try {
                const response = await fetch('/api/staff/forgot-password/verify-staff-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staff_id })
                });
                const result = await response.json();

                if (result.success && result.securityQuestion) {
                    renderForgotStep2(result.securityQuestion);
                } else {
                    showMessageModal('Error', result.message);
                }
            } catch {
                showMessageModal('Error', 'Failed to verify Staff ID.');
            }
        });
    }

    const renderForgotStep2 = (question) => {
        forgotStep2.innerHTML = `
            <p data-translate="answerQuestion"></p>
            <p class="fw-bold">${question}</p>
            <label data-translate="securityAnswer"></label>
            <input id="securityAnswerInput" class="form-control mb-3">
            <button id="verifyAnswerBtn" class="btn btn-primary w-100" data-translate="verify"></button>
            <button type="button" class="btn btn-link w-100 mt-2" onclick="document.getElementById('forgotStep2').classList.add('d-none'); document.getElementById('forgotStep1').classList.remove('d-none');" data-translate="back"></button>
        `;
        forgotStep1.classList.add('d-none');
        forgotStep2.classList.remove('d-none');
        translatePage(currentLang);

        document.getElementById('verifyAnswerBtn').addEventListener('click', async () => {
            const securityAnswer = document.getElementById('securityAnswerInput').value;
            if (!securityAnswer) {
                showMessageModal('Error', translations[currentLang].errors.emptyAnswer);
                return;
            }
            try {
                const response = await fetch('/api/staff/forgot-password/verify-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staff_id: currentForgotStaffId, securityAnswer })
                });
                const result = await response.json();

                if (result.success) {
                    renderForgotStep3();
                } else {
                    showMessageModal('🔒', result.message);
                }
            } catch {
                showMessageModal('Error', 'Failed to verify security answer.');
            }
        });
    };

    const renderForgotStep3 = () => {
        forgotStep3.innerHTML = `
            <h5 data-translate="resetPasswordTitle"></h5>
            <p data-translate="newPasswordPrompt"></p>
            <label data-translate="newPasswordLabel"></label>
            <input type="password" id="resetPasswordInput" class="form-control mb-3" minlength="6" required>
            <button type="submit" class="btn btn-success w-100" data-translate="resetPasswordBtn"></button>
        `;
        forgotStep2.classList.add('d-none');
        forgotStep3.classList.remove('d-none');
        translatePage(currentLang);

        forgotStep3.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('resetPasswordInput').value;
            if (newPassword.length < 6) {
                showMessageModal('Error', translations[currentLang].errors.passwordShort);
                return;
            }
            try {
                const response = await fetch('/api/staff/forgot-password/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staff_id: currentForgotStaffId, newPassword })
                });
                const result = await response.json();

                if (result.success) {
                    showMessageModal('🎉', result.message);
                    bootstrap.Modal.getInstance(forgotPasswordModal).hide();
                    setTimeout(() => window.location.href = result.redirect || '/staff-login', 1500);
                } else {
                    showMessageModal('🙁', result.message);
                }
            } catch {
                showMessageModal('🛑', 'Failed to reset password.');
            }
        });
    };

    // --- PASSWORD TOGGLE ---
    const setupPasswordToggle = (toggleId, inputId) => {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (toggle && input) {
            toggle.addEventListener('click', () => {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                toggle.querySelector('i').classList.toggle('fa-eye');
                toggle.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    };

    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleNewPassword', 'newPasswordInput');
});