 const translations = {
      en: {
        collegeName: "Halqatu Ibadurrahman",
        secureAccess: "Secure access to the administration system.",
        secure: "Secure",
        control: "Control",
        analytics: "Analytics",
        welcome: "Welcome Back",
        selectRole: "Please select your role",
        student: "Student",
        staff: "Staff",
        admin: "Admin",
        studentLogin: "Student Login",
        staffLogin: "Staff Login",
        adminLogin: "Administrator Login",
        studentIdLabel: "Student ID",
        staffIdLabel: "Staff ID",
        usernameLabel: "Username",
        passwordLabel: "Password",
        rememberMe: "Remember me",
        signIn: "Sign In",
        signInDesc: "Sign in to access the dashboard.",
        forgotPassword: "Forgot Password?",
        close: "Close",
        toggleLanguage: "العربية",
        next: "Next",
        verify: "Verify",
        resetPassword: "Reset Password",
        securityQuestion: "Security Question",
        securityAnswer: "Security Answer",
        newPasswordLabel: "New Password",
        confirmPasswordLabel: "Confirm Password",
        usernameNotFound: "Username not found.",
        wrongAnswer: "Incorrect security answer.",
        passwordMismatch: "Passwords do not match.",
        passwordResetSuccess: "Password reset successfully. Please log in with your new password.",
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
        securityQuestion5: "What is the name of your hometown?"
      },
      ar: {
        collegeName: "حلقة عباد الرحمن",
        secureAccess: "الوصول الآمن إلى نظام إدارة حلقة عباد الرحمن لتحفيظ القرآن.",
        secure: "آمن",
        control: "التحكم",
        analytics: "التحليلات",
        welcome: "مرحباً بعودتك",
        selectRole: "يرجى اختيار دورك",
        student: "طالب",
        staff: "موظف",
        admin: "مدير",
        studentLogin: "تسجيل دخول الطالب",
        staffLogin: "تسجيل دخول الموظف",
        adminLogin: "تسجيل دخول المشرف",
        studentIdLabel: "معرف الطالب",
        staffIdLabel: "معرف الموظف",
        usernameLabel: "اسم المستخدم",
        passwordLabel: "كلمة المرور",
        rememberMe: "تذكرني",
        signIn: "تسجيل الدخول",
        signInDesc: "قم بتسجيل الدخول للوصول إلى لوحة التحكم الإدارية.",
        forgotPassword: "هل نسيت كلمة المرور؟",
        close: "إغلاق",
        toggleLanguage: "English",
        next: "التالي",
        verify: "تحقق",
        resetPassword: "إعادة تعيين كلمة المرور",
        securityQuestion: "سؤال الأمان",
        securityAnswer: "إجابة الأمان",
        newPasswordLabel: "كلمة المرور الجديدة",
        confirmPasswordLabel: "تأكيد كلمة المرور",
        usernameNotFound: "اسم المستخدم غير موجود.",
        wrongAnswer: "إجابة الأمان غير صحيحة.",
        passwordMismatch: "كلمتا المرور غير متطابقتين.",
        passwordResetSuccess: "تم إعادة تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.",
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
        securityQuestion5: "ما اسم مدينتك الأصلية؟"
      }
    };

    let currentLang = localStorage.getItem('language') || 'en';
    let currentRole = 'student';

    function translatePage(lang) {
      document.querySelectorAll("[data-translate]").forEach(el => {
        const key = el.getAttribute("data-translate");
        if (translations[lang][key]) {
          el.textContent = translations[lang][key];
        }
      });
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.getElementById('langToggle').textContent = translations[lang].toggleLanguage;
      localStorage.setItem('language', lang);
    }

    function showMessage(title, message) {
      document.getElementById('messageModalLabel').textContent = title;
      document.getElementById('messageText').textContent = message;
      new bootstrap.Modal(document.getElementById('messageModal')).show();
    }

    function togglePassword(id) {
      const input = document.getElementById(id);
      const icon = input.parentElement.querySelector('.password-toggle i') || input.parentElement.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }

    // Role selection + update label in forgot modal
    document.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        currentRole = card.dataset.role;
        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(currentRole + 'Form').classList.add('active');

        // Update forgot password label when role changes
        const label = currentRole === 'admin' ? translations[currentLang].usernameLabel : translations[currentLang].staffIdLabel;
        document.getElementById('forgotIdLabel').textContent = label;
      });
    });

    // Login handlers
    document.getElementById('studentLoginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const studentId = document.getElementById('studentId').value.trim();
      const password = document.getElementById('studentPass').value;
      await handleLogin('student', { studentId, password }, '/api/student-login');
    });

    document.getElementById('staffLoginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const staffId = document.getElementById('staffId').value.trim();
      const password = document.getElementById('staffPass').value;
      await handleLogin('staff', { staffId, password }, '/api/staff-login');
    });

    document.getElementById('adminLoginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value;
      await handleLogin('admin', { username, password }, '/api/admin-login');
    });

    async function handleLogin(role, payload, endpoint) {
      const button = document.querySelector(`#${role}LoginForm button[type="submit"]`);
      const original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Signing In...';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          if (role === 'staff' && data.message && data.message.includes('First-time login')) {
            document.querySelector('.container').classList.add('d-none');
            document.getElementById('updateCredentialsSection').classList.remove('d-none');
            document.getElementById('originalStaffId').value = payload.staffId;
            showMessage('First Time Login', data.message);
          } else {
            showMessage('Success', data.message || 'Login successful!');
            setTimeout(() => window.location.href = data.redirect || '/', 1500);
          }
        } else {
          showMessage('Login Failed', data.message || 'Invalid credentials');
        }
      } catch (err) {
        showMessage('Error', 'Server error');
      } finally {
        button.disabled = false;
        button.innerHTML = original;
      }
    }

    // Forgot Password Logic
    let forgotId = '';
    document.getElementById('forgotNextBtn').addEventListener('click', async () => {
      forgotId = document.getElementById('forgotIdentifier').value.trim();
      if (!forgotId) return showMessage('Error', 'Please enter your ID');

      const endpoint = currentRole === 'admin' 
        ? '/api/forgot-password/verify-username' 
        : '/api/staff/forgot-password/verify-staff-id';
      const bodyKey = currentRole === 'admin' ? 'username' : 'staff_id';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bodyKey]: forgotId })
        });
        const result = await res.json();

        if (result.success) {
          document.getElementById('securityQuestionDisplay').textContent = result.securityQuestion;
          document.getElementById('forgotStep1').style.display = 'none';
          document.getElementById('forgotStep2').style.display = 'block';
        } else {
          showMessage('Error', result.message || translations[currentLang].usernameNotFound);
        }
      } catch (err) {
        showMessage('Error', translations[currentLang].serverError || 'Server error');
      }
    });

    document.getElementById('forgotVerifyBtn').addEventListener('click', async () => {
      const answer = document.getElementById('forgotSecurityAnswer').value.trim();
      const endpoint = currentRole === 'admin' 
        ? '/api/forgot-password/verify-answer' 
        : '/api/staff/forgot-password/verify-answer';
      const bodyKey = currentRole === 'admin' ? 'username' : 'staff_id';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bodyKey]: forgotId, securityAnswer: answer })
        });
        const result = await res.json();

        if (result.success) {
          document.getElementById('forgotStep2').style.display = 'none';
          document.getElementById('forgotStep3').style.display = 'block';
        } else {
          showMessage('Error', translations[currentLang].wrongAnswer);
        }
      } catch (err) {
        showMessage('Error', translations[currentLang].serverError || 'Server error');
      }
    });

    document.getElementById('forgotResetBtn').addEventListener('click', async () => {
      const newPass = document.getElementById('newForgotPassword').value;
      const confirmPass = document.getElementById('confirmForgotPassword').value;
      if (newPass !== confirmPass) return showMessage('Error', translations[currentLang].passwordMismatch);

      const endpoint = currentRole === 'admin' 
        ? '/api/forgot-password/reset-password' 
        : '/api/staff/forgot-password/reset-password';
      const bodyKey = currentRole === 'admin' ? 'username' : 'staff_id';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bodyKey]: forgotId, newPassword: newPass })
        });
        const result = await res.json();

        if (result.success) {
          showMessage('Success', translations[currentLang].passwordResetSuccess);
          bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
        } else {
          showMessage('Error', result.message);
        }
      } catch (err) {
        showMessage('Error', translations[currentLang].serverError || 'Server error');
      }
    });

    // Staff First-Time Update Credentials
    document.getElementById('updateCredentialsForm').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = {
        staffId: document.getElementById('originalStaffId').value,
        newStaffId: document.getElementById('newStaffId').value.trim(),
        newName: document.getElementById('newName').value.trim(),
        newPhone: document.getElementById('newPhone').value.trim(),
        newEmail: document.getElementById('newEmail').value.trim(),
        newPassword: document.getElementById('newPasswordInput').value,
        securityQuestion: document.getElementById('newSecurityQuestion').value,
        securityAnswer: document.getElementById('newSecurityAnswerInput').value.trim()
      };

      try {
        const res = await fetch('/api/update-staff-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();

        if (result.success) {
          showMessage('Success', result.message);
          setTimeout(() => window.location.href = result.redirect || '/', 1500);
        } else {
          showMessage('Error', result.message);
        }
      } catch (err) {
        showMessage('Error', 'Failed to update credentials');
      }
    });

    // Language toggle
    document.getElementById('langToggle').addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'ar' : 'en';
      translatePage(currentLang);
    });

    // Initial translation
    translatePage(currentLang);