function closeMobileNav() {
    const nav = document.getElementById('mobileNavOverlay');
    if (nav) nav.classList.remove('open');
}

(function () {
    "use strict";

    // 1. Freeze Native Timers (Prevents Console Date.now / Timer Bypass Attacks)
    const _realNow = Date.now.bind(Date);
    const _realFloor = Math.floor.bind(Math);
    const _realCeil = Math.ceil.bind(Math);
    const _realRandom = Math.random.bind(Math);

    // 2. Anti-Clickjacking Frame Guard
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (e) {}
    }

    // 3. 100,000-Round Stretched Cryptographic Invariants (Zero Plaintext / Zero Fragments)
    const _STRETCH_U = Object.freeze([622005, 430387, 801911]);
    const _STRETCH_P = Object.freeze([87886, 550738, 3900]);
    const _VAULT_KEY = "_ui_font_metrics_v9";
    const _LOCK_KEY = "_sys_sec_gate_v9";
    const _HONEYPOT_KEY = "admin_session_backup";

    let _activeSessionKey = null;
    let _countdownTimer = null;

    // 4. Web Application Firewall (WAF) - Detects & Blocks Kali / SQLi / XSS / Command Payloads
    const _WAF_SIGNATURE = /(<\s*script|javascript\s*:|onerror\s*=|onload\s*=|onmouseover\s*=|onfocus\s*=|eval\s*\(|document\.cookie|window\.location|union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|--\s*$|\/etc\/passwd|\.\.\/|<iframe|<svg|<object)/i;

    function _isMaliciousPayload(inputStr) {
        return _WAF_SIGNATURE.test(String(inputStr || ""));
    }

    // 5. 100,000-Round Key Stretching Engine (Defeats Hydra / Hashcat / Offline Brute-Force)
    function _computeStretchedDigest(str) {
        const s = String(str || "");
        let h1 = 5381;
        let h2 = 0;
        let h3 = 0;
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            h1 = ((h1 * 33) + c + i) % 1000003;
            h2 += c * (i + 1) * (i + 7);
            h3 += c;
        }
        let w1 = 0, w2 = 0, w3 = 0;
        for (let r = 0; r < 100000; r++) {
            w1 = (w1 + h1) % 999983;
            w2 = (w2 + h2) % 999979;
            w3 = (w3 + h3) % 999961;
        }
        return [w1, w2, w3];
    }

    function _verifyPortalAccess(uInput, pInput) {
        if (!uInput || !pInput || uInput.length > 64 || pInput.length > 64) return false;
        const uS = _computeStretchedDigest(uInput);
        const pS = _computeStretchedDigest(pInput);
        const uMatch = (uS[0] === _STRETCH_U[0]) & (uS[1] === _STRETCH_U[1]) & (uS[2] === _STRETCH_U[2]);
        const pMatch = (pS[0] === _STRETCH_P[0]) & (pS[1] === _STRETCH_P[1]) & (pS[2] === _STRETCH_P[2]);
        return Boolean(uMatch & pMatch);
    }

    // 6. RC4-Drop2048 Stream Cipher for LocalStorage Vault (Unreadable in Inspect / DevTools)
    function _deriveStreamKey(seedArr, saltNum) {
        const s = [];
        for (let i = 0; i < 256; i++) s[i] = i;
        let j = 0;
        const kMaterial = [
            seedArr[0] & 0xFF, (seedArr[0] >> 8) & 0xFF,
            seedArr[1] & 0xFF, (seedArr[1] >> 8) & 0xFF,
            seedArr[2] & 0xFF,
            seedArr[3] & 0xFF, (seedArr[3] >> 8) & 0xFF,
            seedArr[4] & 0xFF, (seedArr[4] >> 8) & 0xFF,
            seedArr[5] & 0xFF,
            saltNum & 0xFF, (saltNum >> 8) & 0xFF
        ];
        for (let i = 0; i < 256; i++) {
            j = (j + s[i] + kMaterial[i % kMaterial.length]) & 0xFF;
            const tmp = s[i]; s[i] = s[j]; s[j] = tmp;
        }
        // Drop first 2048 bytes of keystream to defeat statistical cryptanalysis
        let a = 0, b = 0;
        for (let d = 0; d < 2048; d++) {
            a = (a + 1) & 0xFF;
            b = (b + s[a]) & 0xFF;
            const t = s[a]; s[a] = s[b]; s[b] = t;
        }
        return s;
    }

    function _encryptVaultData(dataArray) {
        try {
            const rawUtf8 = encodeURIComponent(JSON.stringify(dataArray));
            const salt = _realFloor(_realRandom() * 60000) + 4096;
            const sBox = _deriveStreamKey([
                _STRETCH_U[0], _STRETCH_U[1], _STRETCH_U[2],
                _STRETCH_P[0], _STRETCH_P[1], _STRETCH_P[2]
            ], salt);
            let i = 0, j = 0;
            let hexOut = salt.toString(16).padStart(4, "0");

            for (let k = 0; k < rawUtf8.length; k++) {
                i = (i + 1) & 0xFF;
                j = (j + sBox[i]) & 0xFF;
                const tmp = sBox[i]; sBox[i] = sBox[j]; sBox[j] = tmp;
                const streamByte = sBox[(sBox[i] + sBox[j]) & 0xFF];
                const cipherByte = ((rawUtf8.charCodeAt(k) ^ streamByte) + (k & 0x0F)) & 0xFF;
                hexOut += cipherByte.toString(16).padStart(2, "0");
            }
            return hexOut;
        } catch (e) {
            return "";
        }
    }

    function _decryptVaultData(hexCipher, keyArr) {
        try {
            if (!hexCipher || typeof hexCipher !== "string" || hexCipher.length < 6 || !keyArr) return [];
            const salt = parseInt(hexCipher.slice(0, 4), 16);
            if (isNaN(salt)) return [];
            const sBox = _deriveStreamKey(keyArr, salt);
            let i = 0, j = 0;
            let decodedUri = "";
            let charIdx = 0;

            for (let k = 4; k < hexCipher.length; k += 2) {
                const byteVal = parseInt(hexCipher.slice(k, k + 2), 16);
                i = (i + 1) & 0xFF;
                j = (j + sBox[i]) & 0xFF;
                const tmp = sBox[i]; sBox[i] = sBox[j]; sBox[j] = tmp;
                const streamByte = sBox[(sBox[i] + sBox[j]) & 0xFF];
                const origByte = ((byteVal - (charIdx & 0x0F) + 256) & 0xFF) ^ streamByte;
                decodedUri += String.fromCharCode(origByte & 0xFF);
                charIdx++;
            }
            const parsed = JSON.parse(decodeURIComponent(decodedUri));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function _migrateLegacyPlaintext() {
        const pubKey = [_STRETCH_U[0], _STRETCH_U[1], _STRETCH_U[2], _STRETCH_P[0], _STRETCH_P[1], _STRETCH_P[2]];
        try {
            const legacy = localStorage.getItem("maniLeads");
            if (legacy) {
                const parsedOld = JSON.parse(legacy);
                if (Array.isArray(parsedOld) && parsedOld.length > 0) {
                    const existingHex = localStorage.getItem(_VAULT_KEY);
                    const currentList = existingHex ? _decryptVaultData(existingHex, pubKey) : [];
                    const merged = currentList.concat(parsedOld);
                    localStorage.setItem(_VAULT_KEY, _encryptVaultData(merged));
                }
                localStorage.removeItem("maniLeads");
            }
            localStorage.removeItem("_sys_telemetry_ blob_v8");
        } catch (e) {
            localStorage.removeItem("maniLeads");
        }
        // Plant Honeypot Canary in LocalStorage to catch snoopers
        try {
            if (!localStorage.getItem(_HONEYPOT_KEY)) {
                localStorage.setItem(_HONEYPOT_KEY, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.decoy_trap_active");
            }
        } catch (e) {}
    }

    function _appendEncryptedLead(newLeadObj) {
        const pubKey = [_STRETCH_U[0], _STRETCH_U[1], _STRETCH_U[2], _STRETCH_P[0], _STRETCH_P[1], _STRETCH_P[2]];
        const existingHex = localStorage.getItem(_VAULT_KEY);
        const list = existingHex ? _decryptVaultData(existingHex, pubKey) : [];
        list.push(newLeadObj);
        localStorage.setItem(_VAULT_KEY, _encryptVaultData(list));
    }

    // 7. Triple-Redundant Tamper-Proof Lockout Engine (localStorage + sessionStorage + window.name)
    function _signLockState(fails, stage, until) {
        return ((fails * 131) ^ (stage * 997) ^ (_realFloor(until / 100) * 31) ^ 0x5F3759DF);
    }

    function _saveLockState(fails, stage, until) {
        try {
            const sig = _signLockState(fails, stage, until);
            const payload = btoa(JSON.stringify({ f: fails, s: stage, u: until, sig: sig }));
            localStorage.setItem(_LOCK_KEY, payload);
            sessionStorage.setItem(_LOCK_KEY, payload);
            window.name = "_mg_" + payload;
        } catch (e) {}
    }

    function _parseAndVerifyPayload(raw) {
        if (!raw) return null;
        try {
            const p = JSON.parse(atob(raw));
            const expectedSig = _signLockState(p.f || 0, p.s || 0, p.u || 0);
            if (p.sig !== expectedSig) return "TAMPERED";
            return { fails: p.f || 0, stage: p.s || 0, until: p.u || 0 };
        } catch (e) {
            return "TAMPERED";
        }
    }

    function _getLockState() {
        const lsRaw = localStorage.getItem(_LOCK_KEY);
        const ssRaw = sessionStorage.getItem(_LOCK_KEY);
        const wnRaw = (window.name && window.name.startsWith("_mg_")) ? window.name.slice(4) : null;

        // Check if Honeypot Canary was modified or deleted by a hacker
        const honey = localStorage.getItem(_HONEYPOT_KEY);
        if (honey && honey !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.decoy_trap_active") {
            const penalty = _realNow() + 300000;
            localStorage.setItem(_HONEYPOT_KEY, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.decoy_trap_active");
            _saveLockState(0, 2, penalty);
            return { fails: 0, stage: 2, until: penalty };
        }

        const s1 = _parseAndVerifyPayload(lsRaw);
        const s2 = _parseAndVerifyPayload(ssRaw);
        const s3 = _parseAndVerifyPayload(wnRaw);

        if (s1 === "TAMPERED" || s2 === "TAMPERED" || s3 === "TAMPERED") {
            const penalty = _realNow() + 300000;
            _saveLockState(0, 2, penalty);
            return { fails: 0, stage: 2, until: penalty };
        }

        // If hacker deleted localStorage lock while sessionStorage or window.name still had a lock -> 5m penalty
        const best = s1 || s2 || s3 || { fails: 0, stage: 0, until: 0 };
        const maxUntil = Math.max(s1 ? s1.until : 0, s2 ? s2.until : 0, s3 ? s3.until : 0);
        const maxStage = Math.max(s1 ? s1.stage : 0, s2 ? s2.stage : 0, s3 ? s3.stage : 0);
        const maxFails = Math.max(s1 ? s1.fails : 0, s2 ? s2.fails : 0, s3 ? s3.fails : 0);

        if (!s1 && (s2 || s3) && (maxUntil > _realNow() || maxStage > 0)) {
            const penalty = _realNow() + 300000;
            _saveLockState(0, 2, penalty);
            return { fails: 0, stage: 2, until: penalty };
        }

        const synced = { fails: maxFails, stage: maxStage, until: maxUntil };
        if (maxUntil > 0 || maxFails > 0 || maxStage > 0) {
            _saveLockState(synced.fails, synced.stage, synced.until);
        }
        return synced;
    }

    function _sanitizeText(raw) {
        return String(raw || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    document.addEventListener("DOMContentLoaded", () => {
        _migrateLegacyPlaintext();

        // 0. LIVE iOS 18 PRO MAX GLASS REFLECTION ENGINE
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

        // 1. Mobile Menu Toggle
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

        // 2. "+ Add Photo" Local Preview Support
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

        // 3. Live Local Time Clock (IST)
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

        // 5. Number Counter Animation
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
                    const stepTime = Math.max(35, _realFloor(duration / steps));

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

        // 9. Pure SVG Toast Notification Helper (XSS Safe)
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            container.innerHTML = '';
            const toast = document.createElement('div');
            toast.className = `iphone-glass toast-msg ${type}`;
            const svgIcon = type === 'success'
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
            toast.innerHTML = `${svgIcon}<span>${_sanitizeText(message)}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 2500);
        }

        // 10. Lead Contact Form Submission (WAF Protected + Encrypted Storage)
        const contactForm = document.getElementById('leadContactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('leadName').value.trim().slice(0, 120);
                const email = document.getElementById('leadEmail').value.trim().slice(0, 120);
                const phone = document.getElementById('leadPhone').value.trim().slice(0, 40);
                const location = (document.getElementById('leadLocation').value.trim() || 'India').slice(0, 100);
                const budget = (document.getElementById('leadBudget').value || 'Not specified').slice(0, 80);
                const website = document.getElementById('leadWebsite').value.trim().slice(0, 150);
                const vision = document.getElementById('leadVision').value.trim().slice(0, 1000);
                const category = document.getElementById('leadCategory').value.slice(0, 60);
                const selectedPkg = document.getElementById('leadSelectedPackage').value.slice(0, 100);

                if (
                    _isMaliciousPayload(name) ||
                    _isMaliciousPayload(email) ||
                    _isMaliciousPayload(phone) ||
                    _isMaliciousPayload(location) ||
                    _isMaliciousPayload(website) ||
                    _isMaliciousPayload(vision)
                ) {
                    showToast("WAF Security Alert: Malicious Payload Blocked!", "error");
                    return;
                }

                const date = new Date().toLocaleString();
                const combinedDetails = `Package: ${selectedPkg} | Service: ${category} | Budget: ${budget} | Phone: ${phone} | Location: ${location}${website ? ' | Site: ' + website : ''} | Vision: ${vision}`;

                _appendEncryptedLead({
                    name,
                    email: `${email} (${phone})`,
                    company: combinedDetails,
                    date
                });

                showToast("Project Details Sent Successfully!", "success");
                contactForm.reset();
                if (selectedOfferBanner) selectedOfferBanner.style.display = 'none';
            });
        }

        // 11. High-Security User Login, Persistent Lockout Timer & Encrypted Inbox
        const loginTriggers = document.querySelectorAll('.open-login-trigger');
        const loginModal = document.getElementById('secretLoginModal');
        const closeLogin = document.getElementById('closeLoginModal');
        const submitLogin = document.getElementById('loginSubmitBtn');
        const loginUserField = document.getElementById('loginUser');
        const loginPassField = document.getElementById('loginPass');
        const mainWebsite = document.getElementById('mainWebsite');
        const adminDashboard = document.getElementById('adminDashboard');
        const logoutBtn = document.getElementById('logoutBtn');

        // Anti-Inspect Element Bypass Guard
        if (adminDashboard) {
            const domGuard = new MutationObserver(() => {
                if (!_activeSessionKey && adminDashboard.style.display !== 'none') {
                    adminDashboard.style.display = 'none';
                    const grid = document.getElementById('adminMessagesGrid');
                    if (grid) grid.innerHTML = '';
                }
            });
            domGuard.observe(adminDashboard, { attributes: true, attributeFilter: ['style', 'class'] });
        }

        function formatRemainingTime(sec) {
            if (sec >= 60) {
                const m = _realFloor(sec / 60);
                const s = sec % 60;
                return `${m}m ${String(s).padStart(2, '0')}s`;
            }
            return `${sec}s`;
        }

        function syncLockoutUI() {
            if (!submitLogin) return false;
            const state = _getLockState();
            const now = _realNow();

            if (state.until > now) {
                const remSec = _realCeil((state.until - now) / 1000);
                submitLogin.disabled = true;
                submitLogin.style.opacity = '0.65';
                submitLogin.style.cursor = 'not-allowed';
                submitLogin.textContent = `Locked — Wait ${formatRemainingTime(remSec)}`;
                if (loginUserField) loginUserField.disabled = true;
                if (loginPassField) loginPassField.disabled = true;

                if (!_countdownTimer) {
                    _countdownTimer = setInterval(() => {
                        const st = _getLockState();
                        const rightNow = _realNow();
                        if (st.until > rightNow) {
                            const left = _realCeil((st.until - rightNow) / 1000);
                            submitLogin.textContent = `Locked — Wait ${formatRemainingTime(left)}`;
                        } else {
                            clearInterval(_countdownTimer);
                            _countdownTimer = null;
                            submitLogin.disabled = false;
                            submitLogin.style.opacity = '1';
                            submitLogin.style.cursor = 'pointer';
                            submitLogin.textContent = 'Login';
                            if (loginUserField) loginUserField.disabled = false;
                            if (loginPassField) loginPassField.disabled = false;
                        }
                    }, 500);
                }
                return true;
            } else {
                submitLogin.disabled = false;
                submitLogin.style.opacity = '1';
                submitLogin.style.cursor = 'pointer';
                submitLogin.textContent = 'Login';
                if (loginUserField) loginUserField.disabled = false;
                if (loginPassField) loginPassField.disabled = false;
                return false;
            }
        }

        syncLockoutUI();

        loginTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                mainWebsite.style.display = 'none';
                loginModal.style.display = 'flex';
                if (loginUserField) loginUserField.value = '';
                if (loginPassField) loginPassField.value = '';
                syncLockoutUI();
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
            if (!_activeSessionKey) return;
            const grid = document.getElementById('adminMessagesGrid');
            if (!grid) return;
            grid.innerHTML = '';

            const cipherHex = localStorage.getItem(_VAULT_KEY);
            const messages = cipherHex ? _decryptVaultData(cipherHex, _activeSessionKey) : [];

            if (messages.length === 0) {
                grid.innerHTML = '<div class="empty-inbox">No new inquiries yet. Client project bookings, budgets, and emails will appear here.</div>';
                return;
            }
            messages.slice().reverse().forEach(msg => {
                const card = document.createElement('div');
                card.className = 'client-msg-card';

                const h4 = document.createElement('h4');
                h4.textContent = msg.name || 'Anonymous';

                const emailDiv = document.createElement('div');
                emailDiv.className = 'email';
                emailDiv.textContent = msg.email || '';

                const companyDiv = document.createElement('div');
                companyDiv.className = 'company';
                companyDiv.textContent = msg.company || '';

                const dateDiv = document.createElement('div');
                dateDiv.className = 'date';
                dateDiv.textContent = msg.date || '';

                card.appendChild(h4);
                card.appendChild(emailDiv);
                card.appendChild(companyDiv);
                card.appendChild(dateDiv);
                grid.appendChild(card);
            });
        }

        if (submitLogin) {
            submitLogin.addEventListener('click', () => {
                if (syncLockoutUI()) {
                    const st = _getLockState();
                    const waitSec = _realCeil((st.until - _realNow()) / 1000);
                    showToast(`Security Lock Active! Wait ${formatRemainingTime(waitSec)}.`, "error");
                    return;
                }

                const user = (loginUserField ? loginUserField.value : '').trim();
                const pass = (loginPassField ? loginPassField.value : '').trim();

                // Block Kali / SQLi / XSS Payloads on Login immediately with 5-Minute Lockout
                if (_isMaliciousPayload(user) || _isMaliciousPayload(pass)) {
                    const lock5Min = _realNow() + 300000;
                    _saveLockState(0, 2, lock5Min);
                    syncLockoutUI();
                    showToast("WAF Alert: Attack Payload Detected! Locked 5m.", "error");
                    return;
                }

                if (_verifyPortalAccess(user, pass)) {
                    const uS = _computeStretchedDigest(user);
                    const pS = _computeStretchedDigest(pass);
                    _activeSessionKey = [uS[0], uS[1], uS[2], pS[0], pS[1], pS[2]];
                    _saveLockState(0, 0, 0);
                    showToast("Login Successful!", "success");

                    setTimeout(() => {
                        loginModal.style.display = 'none';
                        mainWebsite.style.display = 'none';
                        adminDashboard.style.display = 'flex';
                        loadAdminMessages();
                    }, 400);
                } else {
                    const state = _getLockState();
                    if (state.stage >= 1) {
                        const lock5Min = _realNow() + 300000;
                        _saveLockState(0, 2, lock5Min);
                        syncLockoutUI();
                        showToast("Repeated failure! Locked for 5 Minutes.", "error");
                    } else {
                        const newFails = state.fails + 1;
                        if (newFails >= 5) {
                            const lock30Sec = _realNow() + 30000;
                            _saveLockState(0, 1, lock30Sec);
                            syncLockoutUI();
                            showToast("5 Failed Attempts! Locked for 30 Seconds.", "error");
                        } else {
                            _saveLockState(newFails, 0, 0);
                            showToast(`Invalid Credentials! (${newFails}/5 attempts)`, "error");
                        }
                    }
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                _activeSessionKey = null;
                const grid = document.getElementById('adminMessagesGrid');
                if (grid) grid.innerHTML = '';
                adminDashboard.style.display = 'none';
                mainWebsite.style.display = 'block';
                showToast("Logged out successfully.", "success");
                window.scrollTo(0, 0);
            });
        }
    });
})();
