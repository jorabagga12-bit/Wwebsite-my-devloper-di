function closeMobileNav() {
    const nav = document.getElementById('mobileNavOverlay');
    if (nav) nav.classList.remove('open');
}

const ENV_CONFIG = {
    ADMIN_USER: "bagga",
    ADMIN_PASS: "iphonex0421&"
};

document.addEventListener("DOMContentLoaded", () => {

    // 1. Mobile Menu Toggle (3D Glass Overlay)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavOverlay.classList.add('open');
        });
    }
    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', () => {
            mobileNavOverlay.classList.remove('open');
        });
    }

    // 2. Smooth Scroll Reveal Animation
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.08 };
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, observerOptions);

    document.querySelectorAll(".reveal-up").forEach(el => scrollObserver.observe(el));

    // 3. FAQ Accordion Toggles (Exact Screenshot Behavior)
    const faqItems = document.querySelectorAll('.clean-faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(f => f.classList.remove('active'));
            if (!isOpen) {
                item.classList.add('active');
            }
        });
    });

    // 4. "Start a Project" Button Scroll to Form & Focus
    const toggleProjectFormBtn = document.getElementById('toggleProjectFormBtn');
    const leadNameInput = document.getElementById('leadName');
    if (toggleProjectFormBtn && leadNameInput) {
        toggleProjectFormBtn.addEventListener('click', () => {
            leadNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => leadNameInput.focus(), 400);
        });
    }

    // 5. Toast Notification Helper
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        container.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `iphone-glass toast-msg ${type}`;
        const icon = type === 'success' ? '✔ ' : '✖ ';
        toast.innerHTML = icon + message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2200);
    }

    // 6. Lead Contact Form Submission (Saves to Admin Inbox)
    const contactForm = document.getElementById('leadContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('leadName').value.trim();
            const email = document.getElementById('leadEmail').value.trim();
            const company = document.getElementById('leadCompany').value.trim();
            const date = new Date().toLocaleString();

            let messages = JSON.parse(localStorage.getItem('maniLeads') || '[]');
            messages.push({ name, email, company, date });
            localStorage.setItem('maniLeads', JSON.stringify(messages));

            showToast("Project Request Sent Successfully!", "success");
            contactForm.reset();
        });
    }

    // 7. Secret Admin Login & Lead Inbox (Click "Money Bagga" Logo)
    const loginTrigger = document.getElementById('secretLoginTrigger');
    const loginModal = document.getElementById('secretLoginModal');
    const closeLogin = document.getElementById('closeLoginModal');
    const submitLogin = document.getElementById('loginSubmitBtn');
    const mainWebsite = document.getElementById('mainWebsite');
    const adminDashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginTrigger) {
        loginTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    function loadAdminMessages() {
        const grid = document.getElementById('adminMessagesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const messages = JSON.parse(localStorage.getItem('maniLeads') || '[]');
        if (messages.length === 0) {
            grid.innerHTML = '<div class="empty-inbox">No new messages yet. Client requests will appear here.</div>';
            return;
        }
        messages.slice().reverse().forEach(msg => {
            const card = document.createElement('div');
            card.className = 'iphone-glass client-msg-card';
            card.innerHTML = `
                <h4>${msg.name}</h4>
                <div class="email">${msg.email}</div>
                <div class="company"><strong>Details:</strong> ${msg.company}</div>
                <div class="date">${msg.date}</div>
            `;
            grid.appendChild(card);
        });
    }

    if (submitLogin) {
        submitLogin.addEventListener('click', () => {
            const user = document.getElementById('loginUser').value.trim();
            const pass = document.getElementById('loginPass').value.trim();
            if (user === ENV_CONFIG.ADMIN_USER && pass === ENV_CONFIG.ADMIN_PASS) {
                showToast("Admin Verified. Unlocking Panel...", "success");
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    mainWebsite.style.display = 'none';
                    adminDashboard.style.display = 'flex';
                    loadAdminMessages();
                }, 800);
            } else {
                showToast("Invalid Username or Password!", "error");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminDashboard.style.display = 'none';
            mainWebsite.style.display = 'block';
            showToast("Logged out successfully.", "success");
            window.scrollTo(0, 0);
        });
    }
});
