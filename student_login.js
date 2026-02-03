const translations = {
    en: {
        studentLogin: "Student Login",
        studentIdLabel: "Student ID",
        passwordLabel: "Password (same as Student ID)",
        toggleLanguage: "العربية",
        backToHome: "Back to Home",
        secureAccess: "Secure access to the Ibadurrahman College Student system.",
        secure: "Secure",
        learning: "Learning",
        progress: "Progress",
        signInDesc: "Sign in to access the student dashboard.",
        allFieldsRequired: "Student ID is required.",
        rememberMe: "Remember me",
        signIn: "Sign In",
        authorizedOnly: "Authorized students only",
        collegeName: "Ibadurrahman College",
        close: "Close",
        errors: {
            invalidCredentials: "Invalid Student ID or Password.",
            serverError: "Failed to connect to the server."
        }
    },
    ar: {
        studentLogin: "تسجيل دخول الطالب",
        studentIdLabel: "معرف الطالب",
        passwordLabel: "كلمة المرور (نفس معرف الطالب)",
        toggleLanguage: "English",
        backToHome: "العودة إلى الصفحة الرئيسية",
        secureAccess: "الوصول الآمن إلى نظام طلاب كلية عباد الرحمن",
        secure: "آمن",
        learning: "التعلم",
        progress: "التقدم",
        signInDesc: "تسجيل الدخول للوصول إلى لوحة تحكم الطالب.",
        allFieldsRequired: "جميع الحقول مطلوبة.",
        rememberMe: "تذكرني",
        signIn: "تسجيل الدخول",
        authorizedOnly: "للطلاب المخولين فقط",
        collegeName: "كلية عباد الرحمن",
        close: "إغلاق",
        errors: {
            invalidCredentials: "معرف الطالب أو كلمة المرور غير صالحة.",
            serverError: "فشل الاتصال بالخادم."
        }
    }
};

// Use localStorage for language
let currentLang = localStorage.getItem('language') || 'en';

// Dynamically detect backend URL (localhost or deployed)
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `https://${window.location.hostname}/api`;

/**
 * Generic fetch function
 */
async function fetchData(endpoint, method = "GET", body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(url, options);
        if (response.status === 500) throw new Error("SERVER_ERROR");
        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        if (error.message === "SERVER_ERROR") throw error;
        throw new Error("SERVER_UNREACHABLE");
    }
}

/**
 * Translate page elements
 */
function translatePage(lang) {
    document.querySelectorAll("[data-translate]").forEach(el => {
        const key = el.getAttribute("data-translate");
        const keys = key.split(".");
        let value = translations[lang];
        keys.forEach(k => value = value?.[k]);
        if (value) {
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.setAttribute("placeholder", value);
            else if (el.tagName === "TITLE") el.textContent = value;
            else el.textContent = value;
        }
    });
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    localStorage.setItem("language", lang);
}

/**
 * Show modal messages
 */
function showMessageModal(title, message) {
    const modalTitle = document.getElementById("messageModalLabel");
    const modalText = document.getElementById("messageText");
    const messageModalElement = document.getElementById("messageModal");
    if (modalTitle && modalText && messageModalElement) {
        modalTitle.textContent = title;
        modalText.textContent = message;
        const modal = new bootstrap.Modal(messageModalElement);
        modal.show();
    } else {
        alert(`${title}: ${message}`);
    }
}

/**
 * Submit student login
 */
async function submitLogin() {
    const form = document.getElementById("studentLoginForm");
    if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
    }

    const studentId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> ${currentLang === 'ar' ? 'جاري التحميل' : 'Signing In...'}`;

    try {
        const response = await fetchData("/student-login", "POST", { studentId, password });
        if (response.success) {
            window.location.href = response.redirect || "/dashboard.html";
        } else {
            showMessageModal("❌ Login Failed", response.message || translations[currentLang].errors.invalidCredentials);
            document.getElementById("password").value = '';
        }
    } catch (error) {
        if (error.message === "SERVER_UNREACHABLE") {
            showMessageModal("🛑 Network Error", translations[currentLang].errors.serverError);
        } else if (error.message === "SERVER_ERROR") {
            showMessageModal("⚠️ Server Error", "An unexpected error occurred on the server.");
        } else {
            showMessageModal("🛑 Error", "An unexpected error occurred during login.");
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="fas fa-sign-in-alt me-2"></i> ${translations[currentLang].signIn}`;
        form.classList.remove("was-validated");
    }
}

/**
 * Initialize page
 */
document.addEventListener("DOMContentLoaded", () => {
    translatePage(currentLang);

    // Language toggle
    const langToggleBtn = document.getElementById("langToggle");
    if (langToggleBtn) langToggleBtn.addEventListener("click", () => {
        currentLang = currentLang === "en" ? "ar" : "en";
        translatePage(currentLang);
    });

    // Form submit
    const form = document.getElementById("studentLoginForm");
    if (form) form.addEventListener("submit", e => { e.preventDefault(); submitLogin(); });

    // Password toggle
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const type = passwordInput.type === "password" ? "text" : "password";
            passwordInput.type = type;
            togglePassword.querySelector("i").classList.toggle("fa-eye");
            togglePassword.querySelector("i").classList.toggle("fa-eye-slash");
        });
    }
});
