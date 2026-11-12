function closeMobileNav() {
    const nav = document.getElementById('mobileNavOverlay');
    if (nav) nav.classList.remove('open');
}

document.addEventListener("DOMContentLoaded", () => {
    // 0. DARK MODE ON/OFF BUTTON INSIDE MOBILE MENU (PURE BLACK THEME & AUTO-CLOSE MENU)
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    const mobileNavOverlayEl = document.getElementById('mobileNavOverlay');
    if (mobileNavOverlayEl && !document.getElementById('darkModeMenuToggle')) {
        const darkBtn = document.createElement('button');
        darkBtn.type = 'button';
        darkBtn.id = 'darkModeMenuToggle';
        darkBtn.className = 'dark-mode-menu-btn';
        darkBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <span>Dark Mode: OFF</span>
        `;
        darkBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            document.documentElement.classList.toggle('dark-mode', isDark);
            darkBtn.innerHTML = isDark
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span>Dark Mode: ON</span>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span>Dark Mode: OFF</span>`;
            closeMobileNav();
        });
        mobileNavOverlayEl.appendChild(darkBtn);
    }

    // 1. फॉर्म को डिफ़ॉल्ट रूप से छुपा कर रखने के लिए (सिर्फ बटन क्लिक पर खुलेगा)
    const contactSection = document.getElementById('contact');
    const closeContactBtn = document.getElementById('closeContactFormBtn');
    if (contactSection) {
        contactSection.classList.add('contact-hidden');
        contactSection.style.display = 'none';
    }
    if (closeContactBtn && contactSection) {
        closeContactBtn.addEventListener('click', () => {
            contactSection.classList.add('contact-hidden');
            contactSection.style.display = 'none';
        });
    }

    // 1.1 फॉर्म को एकदम क्लीन रखने के लिए (कोई पर्सनल नंबर या ईमेल शो न हो)
    const cleanForm = document.getElementById('form') || document.getElementById('leadContactForm');
    if (cleanForm) {
        cleanForm.setAttribute('autocomplete', 'off');
        cleanForm.querySelectorAll('.underline-field label').forEach(lbl => {
            lbl.style.display = 'none';
        });

        const fieldPlaceholders = {
            leadName: "Full Name",
            leadEmail: "Email Address",
            leadPhone: "Phone Number",
            leadLocation: "Country / Location",
            leadWebsite: "Existing Website URL (OPTIONAL)",
            leadVision: "Tell me about your vision..."
        };

        Object.keys(fieldPlaceholders).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.placeholder = fieldPlaceholders[id];
                el.value = "";
                el.setAttribute('autocomplete', 'off');
            }
        });

        const budgetEl = document.getElementById('leadBudget');
        if (budgetEl) budgetEl.selectedIndex = 0;
    }

    // 2. Navbar Glass Shimmer Effect
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

    // 3. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (mobileMenuBtn && mobileNavOverlay) {
        mobileMenuBtn.addEventListener('click', () => mobileNavOverlay.classList.add('open'));
    }
    if (mobileNavClose && mobileNavOverlay) {
        mobileNavClose.addEventListener('click', () => mobileNavOverlay.classList.remove('open'));
    }

    // 4. Developer Photo Fallback Picker
    const localPhotoPicker = document.getElementById('localPhotoPicker');
    const devProfileImg = document.getElementById('devProfileImg');
    const addPhotoFallback = document.getElementById('addPhotoFallback');

    if (localPhotoPicker && devProfileImg && addPhotoFallback) {
        localPhotoPicker.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                devProfileImg.src = ev.target.result;
                devProfileImg.style.display = 'block';
                addPhotoFallback.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // 5. Live IST Clock
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

    // 6. Scroll Reveal & Number Counter Animations
    const topHeroEl = document.getElementById('top-hero');
    if (topHeroEl) topHeroEl.classList.add('active');

    const observerOptions = { root: null, rootMargin: "0px", threshold: 0.08 };
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("active");
        });
    }, observerOptions);
    document.querySelectorAll(".reveal-up").forEach(el => scrollObserver.observe(el));

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

    // 7. FAQ Accordion
    const faqItems = document.querySelectorAll('.clean-faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(f => f.classList.remove('active'));
            if (!isOpen) item.classList.add('active');
        });
    });

    // 8. Service Type Pills & Package Selection Buttons
    const typePills = document.querySelectorAll('.type-pill');
    const leadCategoryInput = document.getElementById('leadCategory');
    typePills.forEach(pill => {
        pill.addEventListener('click', () => {
            typePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            if (leadCategoryInput) leadCategoryInput.value = pill.getAttribute('data-type') || 'New Website';
        });
    });

    const offerTriggers = document.querySelectorAll('.select-offer-trigger');
    const openContactNavLinks = document.querySelectorAll('.open-contact-nav');
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
            contactSection.style.display = 'block';
        }
        if (pkgName && selectedOfferBanner && selectedOfferName && leadSelectedPackage) {
            selectedOfferName.textContent = pkgName;
            leadSelectedPackage.value = pkgName;
            selectedOfferBanner.style.display = 'flex';
        } else if (!pkgName && selectedOfferBanner && leadSelectedPackage) {
            selectedOfferBanner.style.display = 'none';
            leadSelectedPackage.value = 'General Inquiry';
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
                if (p.getAttribute('data-type') === categoryVal) p.classList.add('active');
                else p.classList.remove('active');
            });
            if (leadCategoryInput) leadCategoryInput.value = categoryVal;
        }
        setTimeout(() => {
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (formCard) {
                formCard.classList.add('highlight-pulse');
                setTimeout(() => formCard.classList.remove('highlight-pulse'), 2200);
            }
            if (leadNameInput) setTimeout(() => leadNameInput.focus(), 600);
        }, 60);
    }

    offerTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            revealAndScrollToContact(
                btn.getAttribute('data-package'),
                btn.getAttribute('data-budget'),
                btn.getAttribute('data-category')
            );
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
            revealAndScrollToContact("72-Hour Rapid Launch Inquiry", null, "New Website");
        });
    }

    if (clearOfferBtn) {
        clearOfferBtn.addEventListener('click', () => {
            if (selectedOfferBanner) selectedOfferBanner.style.display = 'none';
            if (leadSelectedPackage) leadSelectedPackage.value = 'General Inquiry';
            if (leadVisionInput) leadVisionInput.value = '';
        });
    }

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
        }, 3000);
    }

    // =========================================================================
    // 9. WEB3FORMS DIRECT SUBMISSION (आपकी Key और FormData के साथ - UNTOUCHED)
    // =========================================================================
    const form = document.getElementById('form') || document.getElementById('leadContactForm');

    if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            formData.append("access_key", "2eaf4c95-6786-4959-8d36-b4fdfaddd506");

            const nameVal = document.getElementById('leadName')?.value || '';
            const emailVal = document.getElementById('leadEmail')?.value || '';
            const phoneVal = document.getElementById('leadPhone')?.value || '';
            const locVal = document.getElementById('leadLocation')?.value || 'India';
            const budgetVal = document.getElementById('leadBudget')?.value || 'Not specified';
            const webVal = document.getElementById('leadWebsite')?.value || 'None';
            const visionVal = document.getElementById('leadVision')?.value || '';
            const catVal = document.getElementById('leadCategory')?.value || 'New Website';
            const pkgVal = document.getElementById('leadSelectedPackage')?.value || 'General Inquiry';

            formData.set("name", nameVal);
            formData.set("email", emailVal);
            formData.set("phone", phoneVal);
            formData.set("location", locVal);
            formData.set("budget", budgetVal);
            formData.set("website", webVal);
            formData.set("service_category", catVal);
            formData.set("selected_package", pkgVal);
            formData.set("message", visionVal);
            formData.set("subject", `New Project Inquiry from ${nameVal} — ${pkgVal}`);

            const originalHTML = submitBtn.innerHTML;
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Success! Your message has been sent.", "success");
                    alert("Success! Your message has been sent.");
                    form.reset();
                    if (selectedOfferBanner) selectedOfferBanner.style.display = 'none';
                } else {
                    showToast("Error: " + data.message, "error");
                    alert("Error: " + data.message);
                }

            } catch (error) {
                showToast("Something went wrong. Please try again.", "error");
                alert("Something went wrong. Please try again.");
            } finally {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
    }

    // 10. Login Modal Toggle
    const loginTriggers = document.querySelectorAll('.open-login-trigger, #secretLoginTrigger');
    const loginModal = document.getElementById('secretLoginModal');
    const closeLogin = document.getElementById('closeLoginModal');
    const mainWebsite = document.getElementById('mainWebsite');

    loginTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (mainWebsite) mainWebsite.style.display = 'none';
            if (loginModal) loginModal.style.display = 'flex';
            window.scrollTo(0, 0);
        });
    });

    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            if (mainWebsite) mainWebsite.style.display = 'block';
            window.scrollTo(0, 0);
        });
    }
});
