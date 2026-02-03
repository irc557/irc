 const translations = {
        en: {
            backToHome: "Back to Home",
            secureAccess: "Secure access to the Halqatu Ibadurrahman Litahfizil Qur'an administration system.",
            secure: "Secure",
            control: "Control",
            analytics: "Analytics",
            adminLogin: "Administrator Login",
            signInDesc: "Sign in to access the admin dashboard.",
            usernameLabel: "Username",
            passwordLabel: "Password",
            rememberMe: "Remember me",
            forgotPassword: "Forgot Password?",
            signIn: "Sign In",
            authorizedOnly: "Authorized personnel only",
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
            invalidCredentials: "Invalid credentials.",
            serverError: "Server error."
        },
        ar: {
            backToHome: "العودة إلى الرئيسية",
            secureAccess: "الوصول الآمن إلى نظام إدارة كلية  عباد الرحمن لتحفيظ القرآن.",
            secure: "آمن",
            control: "التحكم",
            analytics: "التحليلات",
            adminLogin: "تسجيل دخول المشرف",
            signInDesc: "قم بتسجيل الدخول للوصول إلى لوحة التحكم الإدارية.",
            usernameLabel: "اسم المستخدم",
            passwordLabel: "كلمة المرور",
            rememberMe: "تذكرني",
            forgotPassword: "هل نسيت كلمة المرور؟",
            signIn: "تسجيل الدخول",
            authorizedOnly: "الأشخاص المخولون فقط",
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
            invalidCredentials: "بيانات الاعتماد غير صالحة.",
            serverError: "خطأ في الخادم."
        }
    };

    let currentLang = localStorage.getItem('language') || 'en';

    function translatePage(lang) {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = translations[lang][key] || element.textContent;
        });
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        document.getElementById('langToggle').textContent = translations[lang]['toggleLanguage'];
    }

    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        translatePage(currentLang);
    });

    translatePage(currentLang);

    document.addEventListener('DOMContentLoaded', () => {
        const adminLoginForm = document.getElementById('adminLoginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const togglePasswordButton = document.getElementById('togglePassword');
        
        const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
        const messageModalLabel = document.getElementById('messageModalLabel');
        const messageText = document.getElementById('messageText');

        function showMessageModal(title, message) {
            messageModalLabel.textContent = title;
            messageText.textContent = message;
            messageModal.show();
        }

        // Toggle password visibility
        togglePasswordButton.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePasswordButton.querySelector('i').classList.toggle('fa-eye');
            togglePasswordButton.querySelector('i').classList.toggle('fa-eye-slash');
        });

        // Handle login form submission
        adminLoginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;
            
            try {
                const response = await fetch('/api/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (result.success) {
                    showMessageModal(translations[currentLang]['signIn'], result.message);
                    if (result.redirect) {
                        setTimeout(() => {
                            window.location.href = result.redirect;
                        }, 1000);
                    }
                } else {
                    showMessageModal(translations[currentLang]['close'], result.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['serverError']);
            }
        });

        // Forgot Password Logic
        let forgotUsername = '';
        const forgotStep1 = document.getElementById('forgotStep1');
        const forgotStep2 = document.getElementById('forgotStep2');
        const forgotStep3 = document.getElementById('forgotStep3');
        const forgotUsernameInput = document.getElementById('forgotUsername');
        const securityQuestionDisplay = document.getElementById('securityQuestionDisplay');
        const forgotSecurityAnswerInput = document.getElementById('forgotSecurityAnswer');
        const newForgotPasswordInput = document.getElementById('newForgotPassword');
        const confirmForgotPasswordInput = document.getElementById('confirmForgotPassword');
        const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));

        // Step 1: Verify Username
        document.getElementById('forgotNextBtn').addEventListener('click', async () => {
            forgotUsername = forgotUsernameInput.value.trim();
            if (!forgotUsername) {
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['usernameLabel'] + ' is required.');
                return;
            }

            try {
                const response = await fetch('/api/forgot-password/verify-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: forgotUsername })
                });

                const result = await response.json();
                if (result.success) {
                    securityQuestionDisplay.textContent = result.securityQuestion;
                    forgotStep1.style.display = 'none';
                    forgotStep2.style.display = 'block';
                    forgotSecurityAnswerInput.focus();
                } else {
                    showMessageModal(translations[currentLang]['close'], translations[currentLang]['usernameNotFound']);
                }
            } catch (error) {
                console.error('Error verifying username:', error);
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['serverError']);
            }
        });

        // Step 2: Verify Security Answer
        document.getElementById('forgotVerifyBtn').addEventListener('click', async () => {
            const securityAnswer = forgotSecurityAnswerInput.value.trim();
            if (!securityAnswer) {
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['securityAnswer'] + ' is required.');
                return;
            }

            try {
                const response = await fetch('/api/forgot-password/verify-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: forgotUsername, securityAnswer })
                });

                const result = await response.json();
                if (result.success) {
                    forgotStep2.style.display = 'none';
                    forgotStep3.style.display = 'block';
                    newForgotPasswordInput.focus();
                } else {
                    showMessageModal(translations[currentLang]['close'], translations[currentLang]['wrongAnswer']);
                }
            } catch (error) {
                console.error('Error verifying security answer:', error);
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['serverError']);
            }
        });

        // Step 3: Reset Password
        document.getElementById('forgotResetBtn').addEventListener('click', async () => {
            const newPassword = newForgotPasswordInput.value;
            const confirmPassword = confirmForgotPasswordInput.value;

            if (newPassword !== confirmPassword) {
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['passwordMismatch']);
                return;
            }

            try {
                const response = await fetch('/api/forgot-password/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: forgotUsername, newPassword })
                });

                const result = await response.json();
                if (result.success) {
                    showMessageModal(translations[currentLang]['close'], translations[currentLang]['passwordResetSuccess']);
                    forgotPasswordModal.hide();
                    setTimeout(() => window.location.href = '/admin-login', 2000);
                } else {
                    showMessageModal(translations[currentLang]['close'], result.message);
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                showMessageModal(translations[currentLang]['close'], translations[currentLang]['serverError']);
            }
        });

        // Reset modal state when it's hidden
        document.getElementById('forgotPasswordModal').addEventListener('hidden.bs.modal', () => {
            forgotStep1.style.display = 'block';
            forgotStep2.style.display = 'none';
            forgotStep3.style.display = 'none';
            forgotUsernameInput.value = '';
            forgotSecurityAnswerInput.value = '';
            newForgotPasswordInput.value = '';
            confirmForgotPasswordInput.value = '';
            forgotUsername = '';
        });
    });