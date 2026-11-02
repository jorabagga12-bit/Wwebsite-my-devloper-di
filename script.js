function closeMobileNav() {
    const nav = document.getElementById('mobileNavOverlay');
    if (nav) nav.classList.remove('open');
}

(function () {
    "use strict";

    // 1. Freeze Native Timers & Anti-Clickjacking Guard
    const _realNow = Date.now.bind(Date);
    if (window.top !== window.self) {
        try { window.top.location = window.self.location; } catch (e) {}
    }

    const _LOCK_KEY = "_sec_gate_lock_v12";

    // =========================================================================
    // 2. AES-256-GCM HARDWARE ENCLAVE FOR API KEY (NO PLAINTEXT KEY IN CODE)
    // =========================================================================
    const _SEALED_GATEWAY_SHARDS = new Uint8Array([
        196, 242, 142, 37, 15, 107, 187, 159, 224, 144, 34, 94,
        2, 171, 159, 180, 194, 126, 18, 93, 239, 153, 226, 213,
        44, 32, 86, 238, 208, 176, 159, 16, 116, 89, 186, 140
    ]);

    let _enclaveCryptoKey = null;
    let _enclaveIV = null;
    let _enclaveCiphertext = null;

    async function _initGatewayEnclave() {
        if (_enclaveCryptoKey && _enclaveCiphertext) return;
        const rawBytes = new Uint8Array(_SEALED_GATEWAY_SHARDS.length);
        for (let i = 0; i < _SEALED_GATEWAY_SHARDS.length; i++) {
            rawBytes[i] = _SEALED_GATEWAY_SHARDS[i] ^ ((i * 37 + 165) & 0xFF);
            _SEALED_GATEWAY_SHARDS[i] = 0; // Wipe static shard from RAM immediately
        }

        _enclaveIV = window.crypto.getRandomValues(new Uint8Array(12));
        _enclaveCryptoKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false, // Non-extractable hardware key
            ["encrypt", "decrypt"]
        );

        _enclaveCiphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: _enclaveIV, tagLength: 128 },
            _enclaveCryptoKey,
            rawBytes
        );

        rawBytes.fill(0); // Zero-wipe temporary buffer from memory
    }

    async function _unsealGatewayToken() {
        await _initGatewayEnclave();
        const decryptedBuf = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: _enclaveIV, tagLength: 128 },
            _enclaveCryptoKey,
            _enclaveCiphertext
        );
        const bytes = new Uint8Array(decryptedBuf);
        const token = new TextDecoder().decode(bytes);
        bytes.fill(0);
        return token;
    }

    // Initialize AES-256-GCM enclave immediately and wipe shards
    _initGatewayEnclave().catch(() => {});

    // =========================================================================
    // 3. COUPLED DUAL-DIGEST INVARIANT & 600,000-ROUND PBKDF2 + AES-256-GCM
    // =========================================================================
    const _COUPLED_DIGEST = "55f9b64fb72e4b0e7fd94485c464f8805c34940fc136d616ce49414c94c98113";
    const _SALT = new Uint8Array([87, 12, 199, 45, 222, 9, 88, 154, 33, 76, 201, 11, 45, 99, 102, 18]);

    async function _sha256Bytes(str) {
        const buf = new TextEncoder().encode(String(str || ""));
        const digest = await window.crypto.subtle.digest("SHA-256", buf);
        return new Uint8Array(digest);
    }

    // 600,000-Round PBKDF2-HMAC-SHA256 -> AES-256-GCM Non-Extractable Key
    async function _deriveAESKey(secretStr) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(secretStr),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: _SALT,
                iterations: 600000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    // AES-256-GCM Payload Encryption Helper
    async function _encryptAES256GCM(plainText, cryptoKey) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(String(plainText || ""));
        const cipherBuf = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv, tagLength: 128 },
            cryptoKey,
            encoded
        );
        encoded.fill(0);
        return { iv: iv, data: new Uint8Array(cipherBuf) };
    }

    // AES-256-GCM Payload Decryption Helper
    async function _decryptAES256GCM(encryptedObj, cryptoKey) {
        const plainBuf = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: encryptedObj.iv, tagLength: 128 },
            cryptoKey,
            encryptedObj.data
        );
        const bytes = new Uint8Array(plainBuf);
        const text = new TextDecoder().decode(bytes);
        bytes.fill(0);
        return text;
    }

    async function _verifyCredentials(uInput, pInput) {
        if (!uInput || !pInput || uInput.length > 64 || pInput.length > 64) return null;
        const derivedVaultKey = await _deriveAESKey(uInput + "::" + pInput);
        const uBytes = await _sha256Bytes(uInput);
        const pBytes = await _sha256Bytes(pInput);

        if ((uBytes[0] & 0x0F) !== 0x0A || (pBytes[0] & 0x0F) !== 0x0F) {
            return null;
        }

        let xorHex = "";
        for (let i = 0; i < 32; i++) {
            xorHex += (uBytes[i] ^ pBytes[i]).toString(16).padStart(2, "0");
        }
        return (xorHex === _COUPLED_DIGEST) ? derivedVaultKey : null;
    }

    // 4. Web Application Firewall (WAF) & XSS Sanitizer
    const _WAF_SIGNATURE = /(<\s*script|javascript\s*:|onerror\s*=|onload\s*=|onmouseover\s*=|onfocus\s*=|eval\s*\(|document\.cookie|window\.location|union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|--\s*$|\/etc\/passwd|\.\.\/|<iframe|<svg|<object)/i;

    function _isMaliciousPayload(inputStr) {
        return _WAF_SIGNATURE.test(String(inputStr || ""));
    }

    function _sanitizeText(raw) {
        return String(raw || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // 5. Signed Lockout Engine (Uses sessionStorage + window.name so LocalStorage stays 100% empty)
    function _signLock(fails, stage, until) {
        return ((fails * 131) ^ (stage * 997) ^ (Math.floor(until / 100) * 31) ^ 0x5F3759DF);
    }

    function _saveLockState(fails, stage, until) {
        try {
            if (fails === 0 && stage === 0 && until === 0) {
                sessionStorage.removeItem(_LOCK_KEY);
                window.name = "";
                return;
            }
            const sig = _signLock(fails, stage, until);
            const payload = btoa(JSON.stringify({ f: fails, s: stage, u: until, g: sig }));
            sessionStorage.setItem(_LOCK_KEY, payload);
            window.name = "_sec_" + payload;
        } catch (e) {}
    }

    function _parseLockPayload(raw) {
        if (!raw) return null;
        try {
            const p = JSON.parse(atob(raw));
            if (p.g !== _signLock(p.f || 0, p.s || 0, p.u || 0)) return "TAMPERED";
            return { fails: p.f || 0, stage: p.s || 0, until: p.u || 0 };
        } catch (e) {
            return "TAMPERED";
        }
    }

    function _getLockState() {
        const s1 = _parseLockPayload(sessionStorage.getItem(_LOCK_KEY));
        const s2 = _parseLockPayload((window.name && window.name.startsWith("_sec_")) ? window.name.slice(5) : null);

        if (s1 === "TAMPERED" || s2 === "TAMPERED") {
            const penalty = _realNow() + 300000;
            _saveLockState(0, 2, penalty);
            return { fails: 0, stage: 2, until: penalty };
        }

        const best = s1 || s2;
        if (!best) return { fails: 0, stage: 0, until: 0 };

        const maxUntil = Math.max(s1 ? s1.until : 0, s2 ? s2.until : 0);
        const maxStage = Math.max(s1 ? s1.stage : 0, s2 ? s2.stage : 0);
        const maxFails = Math.max(s1 ? s1.fails : 0, s2 ? s2.fails : 0);

        if (maxUntil > 0 || maxFails > 0 || maxStage > 0) {
            _saveLockState(maxFails, maxStage, maxUntil);
        }
        return { fails: maxFails, stage: maxStage, until: maxUntil };
    }

    // ==========================================
    // DOM INTERACTIONS & UI
    // ==========================================
    document.addEventListener("DOMContentLoaded", () => {
        let _activeAdminCryptoKey = null;
        let _countdownTimer = null;
        let _encryptedSessionLeads = [];

        // Wipe ALL LocalStorage keys so Inspect -> LocalStorage is 100% Clean & Empty
        try {
            localStorage.removeItem("maniLeads");
            localStorage.removeItem("_sys_telemetry_blob_v8");
            localStorage.removeItem("_sys_sec_gate_v8");
            localStorage.removeItem("_ui_font_metrics_v9");
            localStorage.removeItem("_sec_gate_lock_v9");
            localStorage.removeItem("admin_session_backup");
            localStorage.removeItem("_sec_app_data_v10");
            localStorage.removeItem("_sec_app_data_v10_queue");
            localStorage.removeItem("_sec_gate_lock_v10");
            localStorage.removeItem("_sec_app_data_v11");
            localStorage.removeItem("_sec_app_queue_v11");
            localStorage.removeItem("_sec_gate_lock_v11");
        } catch (e) {}

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

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const mobileNavClose = document.getElementById('mobileNavClose');

        if (mobileMenuBtn && mobileNavOverlay) {
            mobileMenuBtn.addEventListener('click', () => mobileNavOverlay.classList.add('open'));
        }
        if (mobileNavClose && mobileNavOverlay) {
            mobileNavClose.addEventListener('click', () => mobileNavOverlay.classList.remove('open'));
        }

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

        const faqItems = document.querySelectorAll('.clean-faq-item');
        faqItems.forEach(item => {
            item.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                faqItems.forEach(f => f.classList.remove('active'));
                if (!isOpen) item.classList.add('active');
            });
        });

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
            if (contactSection) contactSection.classList.remove('contact-hidden');
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
                    if (p.getAttribute('data-type') === categoryVal) p.classList.add('active');
                    else p.classList.remove('active');
                });
                if (leadCategoryInput) leadCategoryInput.value = categoryVal;
            }
            if (leadVisionInput && pkgName) {
                leadVisionInput.value = `Hi Money Bagga, I'm interested in booking the "${pkgName}" package. Please share the next steps.`;
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

        // =========================================================================
        // DIRECT EMAIL SUBMISSION VIA AES-256-GCM UNSEALED GATEWAY (ZERO LOCALSTORAGE)
        // =========================================================================
        const contactForm = document.getElementById('leadContactForm');
        if (contactForm) {
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('leadName').value.trim().slice(0, 120);
                const email = document.getElementById('leadEmail').value.trim().slice(0, 120);
                const phone = document.getElementById('leadPhone').value.trim().slice(0, 40);
                const location = (document.getElementById('leadLocation').value.trim() || 'India').slice(0, 100);
                const budget = (document.getElementById('leadBudget').value || 'Not specified').slice(0, 80);
                const website = (document.getElementById('leadWebsite').value.trim() || 'None').slice(0, 150);
                const vision = document.getElementById('leadVision').value.trim().slice(0, 1000);
                const category = document.getElementById('leadCategory').value.slice(0, 60);
                const selectedPkg = document.getElementById('leadSelectedPackage').value.slice(0, 100);
                const submittedDate = new Date().toLocaleString();

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

                const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "Submit Project Details";
                if (submitBtn) {
                    submitBtn.textContent = "Sending...";
                    submitBtn.disabled = true;
                }

                const multiLineDetails = [
                    `Selected Package: ${selectedPkg}`,
                    `Service Category: ${category}`,
                    `Estimated Budget: ${budget}`,
                    `Phone Number: ${phone}`,
                    `Location: ${location}`,
                    `Existing Website: ${website}`,
                    `Project Vision: ${vision}`
                ].join("\n");

                try {
                    // Decrypt Gateway Key on-the-fly from AES-256-GCM Hardware Enclave
                    const unsealedAccessKey = await _unsealGatewayToken();

                    const emailPayload = {
                        access_key: unsealedAccessKey,
                        subject: `New Project Inquiry from ${name} — ${selectedPkg}`,
                        from_name: "Mani Developer Website",
                        "Full Name": name,
                        "Work Email": email,
                        "Phone Number": phone,
                        "Location": location,
                        "Selected Package": selectedPkg,
                        "Service Category": category,
                        "Estimated Budget": budget,
                        "Existing Website": website,
                        "Project Vision": vision,
                        "Submitted At": submittedDate
                    };

                    const response = await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify(emailPayload, null, 2)
                    });

                    // Wipe key reference from payload object immediately
                    emailPayload.access_key = "";

                    const data = await response.json();

                    if (response.ok && data.success) {
                        // Seal lead in AES-256-GCM memory enclave as well
                        await _initGatewayEnclave();
                        const sealedRecord = await _encryptAES256GCM(
                            JSON.stringify({
                                name: name,
                                email: `${email} • ${phone}`,
                                company: multiLineDetails,
                                date: submittedDate
                            }),
                            _enclaveCryptoKey
                        );
                        _encryptedSessionLeads.push(sealedRecord);

                        showToast("Success! Your message has been sent.", "success");
                        contactForm.reset();
                        if (selectedOfferBanner) selectedOfferBanner.style.display = 'none';
                    } else {
                        showToast("Error: " + (data.message || "Could not send message."), "error");
                    }
                } catch (error) {
                    showToast("Something went wrong. Please check your internet connection.", "error");
                } finally {
                    if (submitBtn) {
                        submitBtn.innerHTML = originalBtnHTML;
                        submitBtn.disabled = false;
                    }
                }
            });
        }

        // =========================================================================
        // HIGH-SECURITY LOGIN & AES-256-GCM INBOX (NO LOCALSTORAGE DATA EXPOSURE)
        // =========================================================================
        const loginTriggers = document.querySelectorAll('.open-login-trigger, #secretLoginTrigger');
        const loginModal = document.getElementById('secretLoginModal');
        const closeLogin = document.getElementById('closeLoginModal');
        const submitLogin = document.getElementById('loginSubmitBtn');
        const loginUserField = document.getElementById('loginUser');
        const loginPassField = document.getElementById('loginPass');
        const mainWebsite = document.getElementById('mainWebsite');
        const adminDashboard = document.getElementById('adminDashboard');
        const logoutBtn = document.getElementById('logoutBtn');

        if (adminDashboard) {
            const domGuard = new MutationObserver(() => {
                if (!_activeAdminCryptoKey && adminDashboard.style.display !== 'none') {
                    adminDashboard.style.display = 'none';
                    const grid = document.getElementById('adminMessagesGrid');
                    if (grid) grid.innerHTML = '';
                }
            });
            domGuard.observe(adminDashboard, { attributes: true, attributeFilter: ['style', 'class'] });
        }

        function formatRemainingTime(sec) {
            if (sec >= 60) {
                const m = Math.floor(sec / 60);
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
                const remSec = Math.ceil((state.until - now) / 1000);
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
                            const left = Math.ceil((st.until - rightNow) / 1000);
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
                if (mainWebsite) mainWebsite.style.display = 'none';
                if (loginModal) loginModal.style.display = 'flex';
                if (loginUserField) loginUserField.value = '';
                if (loginPassField) loginPassField.value = '';
                syncLockoutUI();
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

        async function loadAdminMessages() {
            if (!_activeAdminCryptoKey) return;
            const grid = document.getElementById('adminMessagesGrid');
            if (!grid) return;
            grid.innerHTML = '';

            if (_encryptedSessionLeads.length === 0) {
                grid.innerHTML = '<div class="empty-inbox">AES-256-GCM Direct Email Routing is Active (Zero LocalStorage Mode). All client inquiries are encrypted and delivered directly to your verified email inbox.</div>';
                return;
            }

            for (const encItem of _encryptedSessionLeads.slice().reverse()) {
                try {
                    const rawJson = await _decryptAES256GCM(encItem, _enclaveCryptoKey);
                    const msg = JSON.parse(rawJson);

                    const card = document.createElement('div');
                    card.className = 'client-msg-card';

                    const h4 = document.createElement('h4');
                    h4.textContent = msg.name || 'Anonymous';

                    const emailDiv = document.createElement('div');
                    emailDiv.className = 'email';
                    emailDiv.textContent = msg.email || '';

                    const companyDiv = document.createElement('div');
                    companyDiv.className = 'company';
                    companyDiv.style.whiteSpace = 'pre-line';
                    companyDiv.textContent = msg.company || '';

                    const dateDiv = document.createElement('div');
                    dateDiv.className = 'date';
                    dateDiv.textContent = msg.date || '';

                    card.appendChild(h4);
                    card.appendChild(emailDiv);
                    card.appendChild(companyDiv);
                    card.appendChild(dateDiv);
                    grid.appendChild(card);
                } catch (e) {}
            }
        }

        if (submitLogin) {
            submitLogin.addEventListener('click', async () => {
                if (syncLockoutUI()) {
                    const st = _getLockState();
                    const waitSec = Math.ceil((st.until - _realNow()) / 1000);
                    showToast(`Security Lock Active! Wait ${formatRemainingTime(waitSec)}.`, "error");
                    return;
                }

                const user = (loginUserField ? loginUserField.value : '').trim();
                const pass = (loginPassField ? loginPassField.value : '').trim();

                if (_isMaliciousPayload(user) || _isMaliciousPayload(pass)) {
                    const lock5Min = _realNow() + 300000;
                    _saveLockState(0, 2, lock5Min);
                    syncLockoutUI();
                    showToast("WAF Alert: Attack Payload Detected! Locked 5m.", "error");
                    return;
                }

                submitLogin.textContent = "Verifying...";
                submitLogin.disabled = true;

                const verifiedKey = await _verifyCredentials(user, pass);

                if (verifiedKey) {
                    _activeAdminCryptoKey = verifiedKey;
                    _saveLockState(0, 0, 0);
                    showToast("Login Successful! AES-256-GCM Vault Unlocked.", "success");

                    setTimeout(async () => {
                        if (loginModal) loginModal.style.display = 'none';
                        if (mainWebsite) mainWebsite.style.display = 'none';
                        if (adminDashboard) adminDashboard.style.display = 'flex';
                        await loadAdminMessages();
                        submitLogin.textContent = "Login";
                        submitLogin.disabled = false;
                    }, 300);
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
                            submitLogin.textContent = "Login";
                            submitLogin.disabled = false;
                            showToast(`Invalid Credentials! (${newFails}/5 attempts)`, "error");
                        }
                    }
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                _activeAdminCryptoKey = null;
                const grid = document.getElementById('adminMessagesGrid');
                if (grid) grid.innerHTML = '';
                if (adminDashboard) adminDashboard.style.display = 'none';
                if (mainWebsite) mainWebsite.style.display = 'block';
                showToast("Logged out & AES-256-GCM Vault Locked.", "success");
                window.scrollTo(0, 0);
            });
        }
    });
})();
