function closeMobileNav() {
    const nav = document.getElementById('mobileNavOverlay');
    if (nav) nav.classList.remove('open');
}

// =====================================================
// SPLIT & OBFUSCATED VERIFICATION (UNTOUCHED)
// =====================================================
const _uiLayoutTokens = ["ba", "iph", "g", "onex", "ga", "04", "21&"];
const _themeMatrixIndices = [
    [0, 2, 4],       // Reconstructs user from scattered pieces
    [1, 3, 5, 6]     // Reconstructs pass from scattered pieces
];

function _verifyPortalAccess(uInput, pInput) {
    const expectedU = _themeMatrixIndices[0].map(i => _uiLayoutTokens[i]).join("");
    const expectedP = _themeMatrixIndices[1].map(i => _uiLayoutTokens[i]).join("");
    return uInput === expectedU && pInput === expectedP;
}

document.addEventListener("DOMContentLoaded", () => {

    // 0. LIVE iOS 18 PRO MAX GLASS REFLECTION & REFRACTION ENGINE
    const rootStyle = document.documentElement.style;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY || 0;
        const shimmerPct = 10 + ((scrollY * 0.18) % 75);
        const angleDeg = 125 + ((scrollY * 0.05) % 35);
        rootStyle.setProperty('--shimmer-pos', `${shimmerPct}%`);
        rootStyle.setProperty('--glass-angle', `${angleDeg}deg`);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
        const pctX = Math.round((e.clientX / window.innerWidth) * 80) + 5;
        rootStyle.setProperty('--shimmer-pos', `${pctX}%`);
    }, { passive: true });

    // 1. Mobile Menu Toggle (3D Frosted Glass Overlay)
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

    // 2. "+ Add Photo" Local Preview Support (Keeps exact Black & White texture)
    const localPhotoPicker = document.getElementById('localPhotoPicker');
    const devProfileImg = document.getElementById('devProfileImg');
    const addPhotoFallback = document.getElementById('addPhotoFallback');

    if (localPhotoPicker && devProfileImg && addPhotoFallback) {
        localPhotoPicker.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                devProfileImg.src = ev.target.result;
                devProfileImg.style.display = 'block';
                addPhotoFallback.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // 3. Live Local Time Clock (IST) in Contact Section
    const liveClockEl = document.getElementById('liveIstClock');
    function updateIstClock() {
        if (!liveClockEl) return;
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            liveClockEl.textContent = `${formatter.format(now)} IST`;
        } catch (e) {
            liveClockEl.textContent = "IST (India)";
        }
    }
    updateIstClock();
    setInterval(updateIstClock, 30000);

    // 4. Smooth Scroll Reveal Animation
    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.08 };
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, observerOptions);

    document.querySelectorAll(".reveal-up").forEach(el => scrollObserver.observe(el));

    // 5. Number Counter Animation (Starts from 1 and counts up to target on scroll)
    const countElements = document.querySelectorAll('.count-up');
    const countObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target') || '1', 10);
            const prefix = el.getAttribute('data-prefix') || '';
            const suffix = el.getAttribute('data-suffix') || '';

            let current = 1;
            el.textContent = `${prefix}${current}${suffix}`;

            if (target > 1) {
                const duration = 1100;
                const steps = target - 1;
                const stepTime = Math.max(35, Math.floor(duration / steps));

                const timer = setInterval(() => {
                    current += 1;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = `${prefix}${current}${suffix}`;
                }, stepTime);
            }
            obs.unobserve(el);
        });
    }, { threshold: 0.35 });

    countElements.forEach(el => countObserver.observe(el));

    // 6. FAQ Accordion Toggles
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

    // 7. Interactive Category Pills inside Contact Form
    const typePills = document.querySelectorAll('.type-pill');
    const leadCategoryInput = document.getElementById('leadCategory');
    typePills.forEach(pill => {
        pill.addEventListener('click', () => {
            typePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (leadCategoryInput) {
                leadCategoryInput.value = pill.getAttribute('data-type') || 'New Website';
            }
        });
    });

    // 8. HIDDEN CONTACT SECTION LOGIC
    const offerTriggers = document.querySelectorAll('.select-offer-trigger');
    const openContactNavLinks = document.querySelectorAll('.open-contact-nav');
    const contactSection = document.getElementById('contact');
    const hideContactSectionBtn = document.getElementById('hideContactSectionBtn');
    const formCard = document.getElementById('projectFormContainer');
    const selectedOfferBanner = document.getElementById('selectedOfferBanner');
    const selectedOfferName = document.getElementById('selectedOfferName');
    const clearOfferBtn = document.getElementById('clearOfferBtn');
    const leadSelectedPackage = document.getElementById('leadSelectedPackage');
    const leadBudgetSelect = document.getElementById('leadBudget');
    const leadVisionInput = document.getElementById('leadVision');
    const leadNameInput = document.getElementById('leadName');

    function revealAndScrollToContact(pkgName, budgetVal, categoryVal) {
        if (contactSection) {
            contactSection.classList.remove('contact-hidden');
        }
        if (pkgName && selectedOfferBanner && selectedOfferName && leadSelectedPackage) {
            selectedOfferName.textContent = pkgName;
            leadSelectedPackage.value = pkgName;
            selectedOfferBanner.style.display = 'flex';
        }
        if (budgetVal && leadBudgetSelect) {
            for (let i = 0; i < leadBudgetSelect.options.length; i++) {
                if (leadBudgetSelect.options[i].value === budgetVal) {
                    leadBudgetSelect.selectedIndex = i;
                    break;
                }
            }
        }
        if (categoryVal && typePills.length > 0) {
            typePills.forEach(p => {
                if (p.getAttribute('data-type') === categoryVal) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
            if (leadCategoryInput) leadCategoryInput.value = categoryVal;
        }
        if (leadVisionInput && pkgName) {
            leadVisionInput.value = `Hi Money Bagga, I'm interested in booking the "${pkgName}" package. Please share the next steps.`;
        }
        setTimeout(() => {
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (formCard) {
                formCard.classList.add('highlight-pulse');
                setTimeout(() => formCard.classList.remove('highlight-pulse'), 2200);
            }
            if (leadNameInput) {
                setTimeout(() => leadNameInput.focus(), 600);
            }
        }, 60);
    }

    offerTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const pkg = btn.getAttribute('data-package');
            const budget = btn.getAttribute('data-budget');
            const cat = btn.getAttribute('data-category');
            revealAndScrollToContact(pkg, budget, cat);
        });
    });

    openContactNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            revealAndScrollToContact(null, null, null);
        });
    });

    const toggleProjectFormBtn = document.getElementById('toggleProjectFormBtn');
    if (toggleProjectFormBtn) {
        toggleProjectFormBtn.addEventListener('click', () => {
            revealAndScrollToContact("72-Hour Rapid Launch Inquiry", "₹35,000 – ₹50,000", "New Website");
        });
    }

    if (hideContactSectionBtn && contactSection) {
        hideContactSectionBtn.addEventListener('click', () => {
            contactSection.classList.add('contact-hidden');
        });
    }

    if (clearOfferBtn) {
        clearOfferBtn.addEventListener('click', () => {
            selectedOfferBanner.style.display = 'none';
            if (leadSelectedPackage) leadSelectedPackage.value = 'General Inquiry';
            if (leadVisionInput) leadVisionInput.value = '';
        });
    }

    // 9. Pure SVG Toast Notification Helper
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        container.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `iphone-glass toast-msg ${type}`;
        const svgIcon = type === 'success'
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        toast.innerHTML = `${svgIcon}<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // 10. Lead Contact Form Submission
    const contactForm = document.getElementById('leadContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('leadName').value.trim();
            const email = document.getElementById('leadEmail').value.trim();
            const phone = document.getElementById('leadPhone').value.trim();
            const location = document.getElementById('leadLocation').value.trim() || 'India';
            const budget = document.getElementById('leadBudget').value || 'Not specified';
            const website = document.getElementById('leadWebsite').value.trim();
            const vision = document.getElementById('leadVision').value.trim();
            const category = document.getElementById('leadCategory').value;
            const selectedPkg = document.getElementById('leadSelectedPackage').value;
            const date = new Date().toLocaleString();

            const combinedDetails = `Package: ${selectedPkg} | Service: ${category} | Budget: ${budget} | Phone: ${phone} | Location: ${location}${website ? ' | Site: ' + website : ''} | Vision: ${vision}`;

            let messages = JSON.parse(localStorage.getItem('maniLeads') || '[]');
            messages.push({
                name,
                email: `${email} (${phone})`,
                company: combinedDetails,
                date
            });
            localStorage.setItem('maniLeads', JSON.stringify(messages));

            showToast("Project Details Sent Successfully!", "success");
            contactForm.reset();
            if (selectedOfferBanner) selectedOfferBanner.style.display = 'none';
        });
    }

    // 11. Separate Full White Page User Login & Inbox
    const loginTriggers = document.querySelectorAll('.open-login-trigger');
    const loginModal = document.getElementById('secretLoginModal');
    const closeLogin = document.getElementById('closeLoginModal');
    const submitLogin = document.getElementById('loginSubmitBtn');
    const mainWebsite = document.getElementById('mainWebsite');
    const adminDashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('logoutBtn');

    loginTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            mainWebsite.style.display = 'none';
            loginModal.style.display = 'flex';
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
            window.scrollTo(0, 0);
        });
    });

    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            loginModal.style.display = 'none';
            mainWebsite.style.display = 'block';
            window.scrollTo(0, 0);
        });
    }

    function loadAdminMessages() {
        const grid = document.getElementById('adminMessagesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const messages = JSON.parse(localStorage.getItem('maniLeads') || '[]');
        if (messages.length === 0) {
            grid.innerHTML = '<div class="empty-inbox">No new inquiries yet. Client project bookings, budgets, and emails will appear here.</div>';
            return;
        }
        messages.slice().reverse().forEach(msg => {
            const card = document.createElement('div');
            card.className = 'client-msg-card';
            card.innerHTML = `
                <h4>${msg.name}</h4>
                <div class="email">${msg.email}</div>
                <div class="company">${msg.company}</div>
                <div class="date">${msg.date}</div>
            `;
            grid.appendChild(card);
        });
    }

    if (submitLogin) {
        submitLogin.addEventListener('click', () => {
            const user = document.getElementById('loginUser').value.trim();
            const pass = document.getElementById('loginPass').value.trim();
            if (_verifyPortalAccess(user, pass)) {
                showToast("Login Successful!", "success");
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    mainWebsite.style.display = 'none';
                    adminDashboard.style.display = 'flex';
                    loadAdminMessages();
                }, 500);
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
