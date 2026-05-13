// ========== TUNGGU SAMPAI HTML SELESAI LOAD ==========
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== DOM ELEMENTS ==========
    const slidesContainer = document.getElementById('slidesContainer');
    const dots = document.querySelectorAll('.dot');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const dashboardApp = document.getElementById('dashboardApp');
    
    let currentSlide = 0;
    const totalSlides = 3;
    let startX = 0;
    let isDragging = false;
    let currentUserPhone = null;
    let statusListeners = [];
    
    // ========== SLIDE FUNCTIONS ==========
    function changeSlide(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        currentSlide = index;
        if (slidesContainer) {
            slidesContainer.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
        }
        if (dots) {
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
    }
    
    if (dots && dots.length) {
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => changeSlide(index));
        });
    }
    
    if (slidesContainer) {
        slidesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });
        slidesContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const diff = startX - e.touches[0].clientX;
            if (Math.abs(diff) > 50) {
                changeSlide(currentSlide + (diff > 0 ? 1 : -1));
                isDragging = false;
            }
        });
        slidesContainer.addEventListener('touchend', () => { isDragging = false; });
    }
    
    // ========== NOTIFICATION SYSTEM ==========
function showNotification(title, message, type = 'success', duration = 4000) {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'info') iconClass = 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="notification-text">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
                <div class="notification-time">baru saja</div>
            </div>
        </div>
        <div class="notification-progress">
            <div class="progress-bar" style="animation-duration: ${duration/1000}s;"></div>
        </div>
    `;
    
    container.appendChild(notification);
    
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeSpan = notification.querySelector('.notification-time');
        if (timeSpan) {
            timeSpan.textContent = elapsed < 60 ? `${elapsed} detik lalu` : `${Math.floor(elapsed / 60)} menit lalu`;
        }
    }, 1000);
    
    setTimeout(() => {
        clearInterval(timeInterval);
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}
    
    // ========== MODAL FUNCTIONS ==========
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    }
    
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
    
    // ========== DASHBOARD FUNCTIONS ==========
function openDashboard(userPhone, userName) {
    currentUserPhone = userPhone;
    
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const slidesCont = document.querySelector('.slides-container');
    const pagination = document.querySelector('.pagination');
    
    if (registerForm) registerForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'none';
    if (slidesCont) slidesCont.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    
    if (dashboardApp) dashboardApp.style.display = 'flex';
    
    const userNameSpan = document.getElementById('userName');
    const welcomeNameSpan = document.getElementById('welcomeName');
    if (userNameSpan) userNameSpan.textContent = userName || 'User';
    if (welcomeNameSpan) welcomeNameSpan.textContent = userName || 'User';
    
    loadChats();
    
    // Load avatar dari Firebase (permanen)
    setTimeout(async () => {
        await loadUserAvatarToDashboard(userPhone);
    }, 500);
    
    setTimeout(() => {
        showNotification('Selamat Datang! 🎉', 'Halo ' + (userName || userPhone) + ', selamat datang di Zeroo ChatRoom', 'success', 5000);
    }, 500);
}
    
    // ========== LOAD CHATS ==========
    async function loadChats() {
        const chatList = document.querySelector('.chat-list');
        if (!chatList) return;
        
        chatList.innerHTML = '<div class="loading-contacts"><i class="fas fa-spinner fa-spin"></i> Memuat chat...</div>';
        
        try {
            const chats = await FirebaseAPI.getChats(currentUserPhone);
            
            if (!chats || chats.length === 0) {
                chatList.innerHTML = `<div class="empty-contacts"><i class="fas fa-comments"></i><p>Belum ada chat</p><small>Klik + untuk menambah kontak</small></div>`;
                return;
            }
            
            chatList.innerHTML = chats.map(chat => `
                <div class="chat-item" data-phone="${chat.phone}">
                    <i class="fas fa-user-circle"></i>
                    <div class="chat-info">
                        <h4>${escapeHtml(chat.name)}</h4>
                        <p>${chat.lastMessage ? escapeHtml(chat.lastMessage.substring(0, 30)) : 'Mulai chat...'}</p>
                    </div>
                    <div class="contact-status"><span class="status-dot ${chat.status === 'online' ? 'online' : ''}"></span></div>
                    <span class="chat-time">${formatTime(chat.lastMessageTime)}</span>
                </div>
            `).join('');
            
            document.querySelectorAll('.chat-item').forEach(chat => {
                chat.addEventListener('click', () => openChat(chat.getAttribute('data-phone')));
            });
            
        } catch (error) {
            console.error('Error loading chats:', error);
            chatList.innerHTML = '<div class="empty-contacts"><i class="fas fa-exclamation-circle"></i> Gagal memuat chat</div>';
        }
    }
    
    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + ' menit lalu';
        } else if (diff < 86400000) {
            return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
        } else {
            return date.getDate() + '/' + (date.getMonth() + 1);
        }
    }
    
    // ========== CHAT ROOM ==========
    let currentChatPhone = null;
    let unsubscribeMessages = null;
    
    function openChat(phone) {
        currentChatPhone = phone;
        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) contentContainer.style.display = 'none';
        
        let chatRoom = document.getElementById('chatRoom');
        if (!chatRoom) {
            chatRoom = document.createElement('div');
            chatRoom.id = 'chatRoom';
            chatRoom.className = 'chat-room';
            if (dashboardApp) dashboardApp.appendChild(chatRoom);
        }
        
        chatRoom.style.display = 'flex';
        chatRoom.innerHTML = `
            <div class="chat-room-header">
                <button id="backToDashboardBtn" class="back-chat-btn"><i class="fas fa-arrow-left"></i></button>
                <div class="chat-room-user"><i class="fas fa-user-circle"></i><div><h4 id="chatUserName">Loading...</h4><small id="chatUserStatus">online</small></div></div>
            </div>
            <div class="chat-messages" id="chatMessages"><div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Memuat pesan...</div></div>
            <div class="chat-input-area"><input type="text" id="messageInput" placeholder="Ketik pesan..." class="chat-input"><button id="sendMessageBtn" class="send-btn"><i class="fas fa-paper-plane"></i></button></div>
        `;
        
        FirebaseAPI.getUserByPhone(phone).then(user => {
            const chatUserName = document.getElementById('chatUserName');
            if (chatUserName) chatUserName.textContent = user.name;
            updateChatUserStatus(user.status);
        });
        
        loadMessages();
        
        if (unsubscribeMessages) unsubscribeMessages();
        unsubscribeMessages = FirebaseAPI.listenMessages(currentUserPhone, phone, (msgId, message) => {
            appendMessage(message);
        });
        
        if (statusListeners[phone]) statusListeners[phone]();
        statusListeners[phone] = FirebaseAPI.listenUserStatus(phone, (status) => {
            updateChatUserStatus(status);
        });
        
        const backBtn = document.getElementById('backToDashboardBtn');
        const sendMsgBtn = document.getElementById('sendMessageBtn');
        const msgInput = document.getElementById('messageInput');
        
        if (backBtn) backBtn.addEventListener('click', closeChat);
        if (sendMsgBtn) sendMsgBtn.addEventListener('click', sendMessage);
        if (msgInput) msgInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }
    
    function updateChatUserStatus(status) {
        const statusEl = document.getElementById('chatUserStatus');
        if (statusEl) {
            statusEl.textContent = status === 'online' ? 'online' : 'offline';
            statusEl.style.color = status === 'online' ? '#4ade80' : '#888';
        }
    }
    
    async function loadMessages() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;
        messagesDiv.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Memuat pesan...</div>';
        
        try {
            const messages = await FirebaseAPI.getMessages(currentUserPhone, currentChatPhone);
            messagesDiv.innerHTML = '';
            if (messages && messages.length) {
                messages.forEach(msg => appendMessage(msg));
            }
            scrollToBottom();
        } catch (error) {
            messagesDiv.innerHTML = '<div class="empty-messages">Gagal memuat pesan</div>';
        }
    }
    
    function appendMessage(message) {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;
        
        const isOwn = message.sender === currentUserPhone;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        messageDiv.innerHTML = `<div class="message-bubble"><p>${escapeHtml(message.message)}</p><span class="message-time">${formatTimeShort(message.timestamp)}</span>${isOwn ? `<i class="fas fa-check-double ${message.read ? 'read' : ''}"></i>` : ''}</div>`;
        messagesDiv.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function scrollToBottom() {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input ? input.value.trim() : '';
        if (!message) return;
        if (input) input.value = '';
        try {
            await FirebaseAPI.sendMessage(currentUserPhone, currentChatPhone, message);
        } catch (error) {
            showNotification('Gagal', 'Pesan tidak terkirim', 'error', 2000);
            if (input) input.value = message;
        }
    }
    
    function closeChat() {
        if (unsubscribeMessages) unsubscribeMessages();
        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) contentContainer.style.display = 'block';
        const chatRoom = document.getElementById('chatRoom');
        if (chatRoom) chatRoom.style.display = 'none';
        currentChatPhone = null;
        loadChats();
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatTimeShort(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    }
    
    // ========== CONTACT MANAGEMENT ==========
    let allUsers = [];
    let myContacts = [];
    
    async function loadUsersForContact() {
        const contactListDiv = document.getElementById('contactList');
        if (!contactListDiv) return;
        contactListDiv.innerHTML = '<div class="loading-contacts"><i class="fas fa-spinner fa-spin"></i> Memuat daftar user...</div>';
        try {
            allUsers = await FirebaseAPI.getAllUsers(currentUserPhone);
            const contacts = await FirebaseAPI.getContacts(currentUserPhone);
            myContacts = contacts;
            renderContactList(allUsers);
        } catch (error) {
            contactListDiv.innerHTML = '<div class="empty-contacts"><i class="fas fa-exclamation-circle"></i> Gagal memuat data</div>';
        }
    }
    
    function renderContactList(users) {
        const contactListDiv = document.getElementById('contactList');
        if (!contactListDiv) return;
        const searchInput = document.getElementById('searchContactInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filteredUsers = users.filter(user => user.phone.toLowerCase().includes(searchTerm));
        if (filteredUsers.length === 0) {
            contactListDiv.innerHTML = '<div class="empty-contacts"><i class="fas fa-search"></i> User tidak ditemukan</div>';
            return;
        }
        contactListDiv.innerHTML = filteredUsers.map(user => {
            const isAdded = myContacts.some(c => c.phone === user.phone);
            const displayPhone = '+62 ' + user.phone;
            return `<div class="contact-item" data-phone="${user.phone}"><div class="contact-info"><div class="contact-avatar"><i class="fas fa-user"></i></div><div class="contact-details"><h4>${escapeHtml(user.name)}</h4><p>${displayPhone}</p></div></div><div class="contact-status"><span class="status-dot ${user.status === 'online' ? 'online' : ''}"></span><span>${user.status === 'online' ? 'Online' : 'Offline'}</span></div><button class="add-contact-btn ${isAdded ? 'added' : ''}" data-phone="${user.phone}" ${isAdded ? 'disabled' : ''}>${isAdded ? '<i class="fas fa-check"></i> Ditambahkan' : '<i class="fas fa-plus"></i> Tambah'}</button></div>`;
        }).join('');
        document.querySelectorAll('.add-contact-btn:not(.added)').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const phone = btn.getAttribute('data-phone');
                await addContact(phone);
            });
        });
    }
    
    async function addContact(phone) {
        try {
            await FirebaseAPI.addContact(currentUserPhone, phone);
            await loadUsersForContact();
            showNotification('Berhasil!', 'Kontak berhasil ditambahkan', 'success', 2000);
            loadChats();
        } catch (error) {
            showNotification('Gagal', error.message, 'error', 2000);
        }
    }
    
    // ========== REGISTER & LOGIN ==========
    const registerFormBtn = document.getElementById('registerBtn');
    const loginFormBtn = document.getElementById('loginBtn');
    const backToWelcome = document.getElementById('backToWelcome');
    const backToWelcomeLogin = document.getElementById('backToWelcomeLogin');
    
    if (registerFormBtn) {
        registerFormBtn.addEventListener('click', () => {
            const slidesCont = document.querySelector('.slides-container');
            const pagination = document.querySelector('.pagination');
            const registerForm = document.getElementById('registerForm');
            const loginForm = document.getElementById('loginForm');
            if (slidesCont) slidesCont.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            if (registerForm) registerForm.style.display = 'flex';
            if (loginForm) loginForm.style.display = 'none';
        });
    }
    
    if (loginFormBtn) {
        loginFormBtn.addEventListener('click', () => {
            const slidesCont = document.querySelector('.slides-container');
            const pagination = document.querySelector('.pagination');
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (slidesCont) slidesCont.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            if (loginForm) loginForm.style.display = 'flex';
            if (registerForm) registerForm.style.display = 'none';
        });
    }
    
    if (backToWelcome) {
        backToWelcome.addEventListener('click', () => {
            const registerForm = document.getElementById('registerForm');
            const slidesCont = document.querySelector('.slides-container');
            const pagination = document.querySelector('.pagination');
            if (registerForm) registerForm.style.display = 'none';
            if (slidesCont) slidesCont.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
        });
    }
    
    if (backToWelcomeLogin) {
        backToWelcomeLogin.addEventListener('click', () => {
            const loginForm = document.getElementById('loginForm');
            const slidesCont = document.querySelector('.slides-container');
            const pagination = document.querySelector('.pagination');
            if (loginForm) loginForm.style.display = 'none';
            if (slidesCont) slidesCont.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
        });
    }
    
    // OTP auto-move
    document.querySelectorAll('.otp-field, .otp-field-login').forEach((field, idx, arr) => {
        if (field) {
            field.addEventListener('input', (e) => { if (e.target.value.length === 1 && idx < arr.length - 1 && arr[idx + 1]) arr[idx + 1].focus(); });
            field.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !e.target.value && idx > 0 && arr[idx - 1]) arr[idx - 1].focus(); });
        }
    });
    
    // Register process
    let regOTP = '', regTimerInterval = null, regTimeLeft = 300;
    const sendOtpReg = document.getElementById('sendOtpReg');
    if (sendOtpReg) {
        sendOtpReg.addEventListener('click', async () => {
            const phoneInput = document.getElementById('regPhone');
            const phone = phoneInput ? phoneInput.value.trim() : '';
            if (phone.length < 9) { showNotification('Error', 'Nomor tidak valid', 'error', 2000); return; }
            const exists = await FirebaseAPI.isUserRegistered(phone);
            if (exists) { showNotification('Gagal', 'Nomor sudah terdaftar', 'error', 3000); return; }
            regOTP = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('OTP Register:', regOTP);
            try {
                await fetch('https://api.fonnte.com/send', {
                    method: 'POST',
                    headers: { 'Authorization': 'xkdvQAq2XkZjg1T9AsRy', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target: '+62' + phone, message: 'Kode OTP Zeroo: ' + regOTP })
                });
                showNotification('OTP Terkirim', 'Cek WhatsApp Anda', 'success', 2000);
            } catch(e) { showNotification('Mode Demo', 'OTP: ' + regOTP, 'info', 5000); }
            const regStep1 = document.getElementById('regStep1');
            const regStep2 = document.getElementById('regStep2');
            if (regStep1) regStep1.style.display = 'none';
            if (regStep2) regStep2.style.display = 'block';
            regTimeLeft = 300;
            const timerEl = document.getElementById('timer');
            if (regTimerInterval) clearInterval(regTimerInterval);
            regTimerInterval = setInterval(() => {
                if (regTimeLeft <= 0) { clearInterval(regTimerInterval); if (timerEl) timerEl.innerHTML = 'Kode kadaluarsa! '; const resendBtn = document.getElementById('resendOtp'); if (resendBtn) resendBtn.style.display = 'inline-block'; }
                else { regTimeLeft--; if (timerEl) timerEl.innerHTML = Math.floor(regTimeLeft/60) + ':' + String(regTimeLeft%60).padStart(2,'0') + ' '; }
            }, 1000);
        });
    }
    
    const verifyOtpReg = document.getElementById('verifyOtpReg');
    if (verifyOtpReg) {
        verifyOtpReg.addEventListener('click', async () => {
            let inputOTP = '';
            document.querySelectorAll('#regStep2 .otp-field').forEach(f => { if (f) inputOTP += f.value; });
            if (inputOTP === regOTP) {
                const phoneInput = document.getElementById('regPhone');
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const userName = 'User_' + phone.substring(phone.length - 4);
                await FirebaseAPI.registerUser(phone, userName);
                showNotification('Berhasil!', 'Akun berhasil dibuat', 'success', 2000);
                openDashboard(phone, userName);
            } else { showNotification('Gagal', 'Kode OTP salah', 'error', 2000); }
        });
    }
    
    const resendOtp = document.getElementById('resendOtp');
    if (resendOtp) {
        resendOtp.addEventListener('click', () => {
            if (sendOtpReg) sendOtpReg.click();
            if (resendOtp) resendOtp.style.display = 'none';
        });
    }
    
    // Login process
    let loginOTP = '', loginTimerInterval = null, loginTimeLeft = 300;
    const sendOtpLogin = document.getElementById('sendOtpLogin');
    if (sendOtpLogin) {
        sendOtpLogin.addEventListener('click', async () => {
            const phoneInput = document.getElementById('loginPhone');
            const phone = phoneInput ? phoneInput.value.trim() : '';
            if (phone.length < 9) { showNotification('Error', 'Nomor tidak valid', 'error', 2000); return; }
            const exists = await FirebaseAPI.isUserRegistered(phone);
            if (!exists) { showNotification('Gagal', 'Nomor tidak terdaftar', 'error', 3000); return; }
            loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
            console.log('OTP Login:', loginOTP);
            try {
                await fetch('https://api.fonnte.com/send', {
                    method: 'POST',
                    headers: { 'Authorization': 'xkdvQAq2XkZjg1T9AsRy', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target: '+62' + phone, message: 'Kode OTP Login Zeroo: ' + loginOTP })
                });
                showNotification('OTP Terkirim', 'Cek WhatsApp Anda', 'success', 2000);
            } catch(e) { showNotification('Mode Demo', 'OTP: ' + loginOTP, 'info', 5000); }
            const loginStep1 = document.getElementById('loginStep1');
            const loginStep2 = document.getElementById('loginStep2');
            if (loginStep1) loginStep1.style.display = 'none';
            if (loginStep2) loginStep2.style.display = 'block';
            loginTimeLeft = 300;
            const timerEl = document.getElementById('timerLogin');
            if (loginTimerInterval) clearInterval(loginTimerInterval);
            loginTimerInterval = setInterval(() => {
                if (loginTimeLeft <= 0) { clearInterval(loginTimerInterval); if (timerEl) timerEl.innerHTML = 'Kode kadaluarsa! '; const resendBtn = document.getElementById('resendOtpLogin'); if (resendBtn) resendBtn.style.display = 'inline-block'; }
                else { loginTimeLeft--; if (timerEl) timerEl.innerHTML = Math.floor(loginTimeLeft/60) + ':' + String(loginTimeLeft%60).padStart(2,'0') + ' '; }
            }, 1000);
        });
    }
    
    const verifyOtpLogin = document.getElementById('verifyOtpLogin');
    if (verifyOtpLogin) {
        verifyOtpLogin.addEventListener('click', async () => {
            let inputOTP = '';
            document.querySelectorAll('#loginStep2 .otp-field-login').forEach(f => { if (f) inputOTP += f.value; });
            if (inputOTP === loginOTP) {
                const phoneInput = document.getElementById('loginPhone');
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const userData = await FirebaseAPI.loginUser(phone);
                showNotification('Berhasil!', 'Selamat datang kembali', 'success', 2000);
                openDashboard(phone, userData.name);
            } else { showNotification('Gagal', 'Kode OTP salah', 'error', 2000); }
        });
    }
    
    const resendOtpLogin = document.getElementById('resendOtpLogin');
    if (resendOtpLogin) {
        resendOtpLogin.addEventListener('click', () => {
            if (sendOtpLogin) sendOtpLogin.click();
            if (resendOtpLogin) resendOtpLogin.style.display = 'none';
        });
    }
    
    // ========== LOGOUT ==========
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Yakin ingin keluar?')) {
                if (currentUserPhone) {
                    await FirebaseAPI.updateUserStatus(currentUserPhone, 'offline');
                    await FirebaseAPI.logActivity(currentUserPhone, 'logout', {});
                }
                if (dashboardApp) dashboardApp.style.display = 'none';
                const slidesCont = document.querySelector('.slides-container');
                const pagination = document.querySelector('.pagination');
                if (slidesCont) slidesCont.style.display = 'flex';
                if (pagination) pagination.style.display = 'flex';
                currentUserPhone = null;
                showNotification('Berhasil Keluar', 'Sampai jumpa lagi! 👋', 'info', 3000);
            }
        });
    }
    
    const searchIcon = document.getElementById('searchIcon');
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            showNotification('Info', 'Fitur pencarian akan segera hadir!', 'info', 2000);
        });
    }
    
    const addContactBtn = document.getElementById('addContactBtn');
    if (addContactBtn) {
        addContactBtn.addEventListener('click', async () => {
            await loadUsersForContact();
            showModal('contactModal');
        });
    }
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const contactModal = document.getElementById('contactModal');
    const searchContactInput = document.getElementById('searchContactInput');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideModal('contactModal'));
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => hideModal('contactModal'));
    if (contactModal) contactModal.addEventListener('click', (e) => { if (e.target.id === 'contactModal') hideModal('contactModal'); });
    if (searchContactInput) searchContactInput.addEventListener('input', () => renderContactList(allUsers));
    
    // ========== NAVIGATION ==========
    const navItems = document.querySelectorAll('#dashboardApp .nav-item');
    const pages = document.querySelectorAll('#dashboardApp .page');
    if (navItems.length) {
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.getAttribute('data-page');
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                pages.forEach(page => {
                    page.classList.remove('active-page');
                    if (page.classList.contains('page-' + pageName)) page.classList.add('active-page');
                });
                if (pageName === 'dashboard') loadChats();
                else if (pageName === 'channel') loadChannels();
                else if (pageName === 'promote') loadPromotions();
            });
        });
    }
    
    async function loadPromotions() {
        try {
            const promotions = await FirebaseAPI.getActivePromotions();
            const totalViews = promotions.reduce((sum, p) => sum + (p.views || 0), 0);
            const firstStat = document.querySelector('.stat:first-child strong');
            const lastStat = document.querySelector('.stat:last-child strong');
            if (firstStat) firstStat.textContent = totalViews;
            if (lastStat) lastStat.textContent = promotions.length;
        } catch (error) { console.error(error); }
    }
    
    const promoteBtn = document.querySelector('.promote-btn');
    if (promoteBtn) {
        promoteBtn.addEventListener('click', () => {
            showNotification('Info', 'Fitur promosi akan segera hadir!', 'info', 2000);
        });
    }
    
    // ========== CHECK AUTO LOGIN ==========
    (async () => {
        const savedUser = localStorage.getItem('zeroo_user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                if (userData.phone) {
                    const exists = await FirebaseAPI.isUserRegistered(userData.phone);
                    if (exists) {
                        const user = await FirebaseAPI.getUserByPhone(userData.phone);
                        openDashboard(userData.phone, user.name);
                    }
                }
            } catch(e) {}
        }
    })();
    
    // ========== PROFILE SETTINGS ==========
    const profileScreen = document.getElementById('profileScreen');
    const userInfoBtn = document.getElementById('userInfoBtn');
    const profileBackBtn = document.getElementById('profileBackBtn');
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    const profileNameInput = document.getElementById('profileNameInput');
    const profilePhoneDisplay = document.getElementById('profilePhoneDisplay');
    const profileJoinDate = document.getElementById('profileJoinDate');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const userAvatarImg = document.getElementById('userAvatarImg');
    const userAvatarIcon = document.querySelector('#userAvatar i');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const logoutOption = document.getElementById('logoutOption');
    
    let currentProfileUser = null, avatarChanged = false, avatarBase64 = null;
    
    if (userInfoBtn) {
        userInfoBtn.addEventListener('click', async () => {
            const savedUser = localStorage.getItem('zeroo_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                currentProfileUser = userData.phone;
                await loadProfileData();
                if (profileScreen) profileScreen.style.display = 'flex';
            }
        });
    }
    
// Load profile data - FIX
async function loadProfileData() {
    if (!currentProfileUser) return;
    try {
        const userData = await FirebaseAPI.getUserByPhone(currentProfileUser);
        if (userData) {
            if (profileNameInput) profileNameInput.value = userData.name || '';
            if (profilePhoneDisplay) profilePhoneDisplay.textContent = '+62 ' + currentProfileUser;
            
            if (userData.registeredAt && profileJoinDate) {
                const date = new Date(userData.registeredAt);
                profileJoinDate.textContent = date.toLocaleDateString('id-ID', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
            
            // Load avatar permanen dari Firebase
            if (userData.avatar && userData.avatar !== 'default' && userData.avatar !== 'null') {
                profileAvatarImg.src = userData.avatar;
                profileAvatarImg.style.display = 'block';
                // Sembunyikan icon default
                const defaultIcon = document.querySelector('#profileAvatar i');
                if (defaultIcon) defaultIcon.style.display = 'none';
            } else {
                profileAvatarImg.style.display = 'none';
                const defaultIcon = document.querySelector('#profileAvatar i');
                if (defaultIcon) defaultIcon.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Simpan profile - FIX (avatar permanen)
if (profileSaveBtn) {
    profileSaveBtn.addEventListener('click', async () => {
        const newName = profileNameInput ? profileNameInput.value.trim() : '';
        if (!newName) { 
            showNotification('Error', 'Nama tidak boleh kosong', 'error', 2000); 
            return; 
        }
        
        showNotification('Menyimpan...', 'Mohon tunggu', 'info', 2000);
        
        try {
            // Update nama
            await FirebaseAPI.updateUserName(currentProfileUser, newName);
            
            // Update avatar jika ada perubahan (simpan permanen ke Firebase)
            if (avatarChanged && avatarBase64) {
                await FirebaseAPI.updateUserAvatar(currentProfileUser, avatarBase64);
                
                // Update avatar di dashboard
                if (userAvatarImg) {
                    userAvatarImg.src = avatarBase64;
                    userAvatarImg.style.display = 'block';
                }
                if (userAvatarIcon) userAvatarIcon.style.display = 'none';
                
                // Simpan juga ke localStorage sebagai cadangan
                const savedUser = localStorage.getItem('zeroo_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.avatar = avatarBase64;
                    localStorage.setItem('zeroo_user', JSON.stringify(userData));
                }
            }
            
            // Update nama di dashboard
            const userNameSpan = document.getElementById('userName');
            const welcomeNameSpan = document.getElementById('welcomeName');
            if (userNameSpan) userNameSpan.textContent = newName;
            if (welcomeNameSpan) welcomeNameSpan.textContent = newName;
            
            // Update localStorage
            const savedUser = localStorage.getItem('zeroo_user');
            if (savedUser) { 
                const userData = JSON.parse(savedUser); 
                userData.name = newName; 
                localStorage.setItem('zeroo_user', JSON.stringify(userData)); 
            }
            
            showNotification('Berhasil!', 'Profile berhasil diperbarui', 'success', 2000);
            avatarChanged = false;
            loadChats();
            
        } catch (error) { 
            showNotification('Gagal', error.message, 'error', 2000); 
        }
    });
}
    
    if (profileBackBtn) profileBackBtn.addEventListener('click', () => { if (profileScreen) profileScreen.style.display = 'none'; avatarChanged = false; });
    if (changePhotoBtn) changePhotoBtn.addEventListener('click', () => { if (profilePhotoInput) profilePhotoInput.click(); });
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.match('image.*')) { showNotification('Error', 'Hanya file gambar', 'error', 2000); return; }
            if (file.size > 2 * 1024 * 1024) { showNotification('Error', 'Ukuran maksimal 2MB', 'error', 2000); return; }
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarBase64 = event.target.result;
                if (profileAvatarImg) {
                    profileAvatarImg.src = avatarBase64;
                    profileAvatarImg.style.display = 'block';
                }
                avatarChanged = true;
                showNotification('Info', 'Foto berhasil diunggah, klik simpan', 'success', 2000);
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (logoutOption) {
        logoutOption.addEventListener('click', async () => {
            if (profileScreen) profileScreen.style.display = 'none';
            if (confirm('Yakin ingin keluar?')) {
                if (currentUserPhone) {
                    await FirebaseAPI.updateUserStatus(currentUserPhone, 'offline');
                    await FirebaseAPI.logActivity(currentUserPhone, 'logout', {});
                }
                if (dashboardApp) dashboardApp.style.display = 'none';
                const slidesCont = document.querySelector('.slides-container');
                const pagination = document.querySelector('.pagination');
                if (slidesCont) slidesCont.style.display = 'flex';
                if (pagination) pagination.style.display = 'flex';
                currentUserPhone = null;
                showNotification('Berhasil Keluar', 'Sampai jumpa lagi! 👋', 'info', 3000);
            }
        });
    }
    
// Load avatar ke dashboard saat login - FIX (ambil dari Firebase)
async function loadUserAvatarToDashboard(phone) {
    try {
        const avatar = await FirebaseAPI.getUserAvatar(phone);
        if (avatar && avatar !== 'default' && avatar !== 'null') {
            if (userAvatarImg) {
                userAvatarImg.src = avatar;
                userAvatarImg.style.display = 'block';
            }
            if (userAvatarIcon) userAvatarIcon.style.display = 'none';
            console.log('Avatar loaded from Firebase');
        } else {
            if (userAvatarImg) userAvatarImg.style.display = 'none';
            if (userAvatarIcon) userAvatarIcon.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading avatar:', error);
    }
}
    
    const originalOpenDashboard = openDashboard;
    window.openDashboard = function(phone, name) {
        originalOpenDashboard(phone, name);
        setTimeout(() => { loadUserAvatarToDashboard(phone); }, 500);
    };
    
    // ========== CHANNEL SYSTEM ==========
    let currentChannel = null, currentChannelId = null, isChannelOwner = false, unsubscribeChannelMessages = null, isSending = false;
    
    async function loadChannels() {
        const channelList = document.getElementById('channelList');
        if (!channelList) return;
        channelList.innerHTML = '<div class="loading-contacts"><i class="fas fa-spinner fa-spin"></i> Memuat channel...</div>';
        try {
            if (!currentUserPhone) {
                const savedUser = localStorage.getItem('zeroo_user');
                if (savedUser) currentUserPhone = JSON.parse(savedUser).phone;
            }
            const channels = await FirebaseAPI.getChannels();
            if (!channels || channels.length === 0) {
                channelList.innerHTML = `<div class="empty-contacts"><i class="fas fa-hashtag"></i><p>Belum ada channel</p><button id="createFirstChannelBtn" class="create-channel-btn" style="margin-top:16px;background:#4ade80;border:none;padding:10px 20px;border-radius:12px;color:#1a1a1a;cursor:pointer;">+ Buat Channel</button></div>`;
                const createBtn = document.getElementById('createFirstChannelBtn');
                if (createBtn) createBtn.addEventListener('click', () => showModal('createChannelModal'));
                return;
            }
            let userChannels = [];
            try { userChannels = await FirebaseAPI.getUserChannels(currentUserPhone); } catch(e) {}
            const userChannelIds = userChannels.map(c => c.id);
            channelList.innerHTML = channels.map(channel => {
                const isMember = userChannelIds.includes(channel.id);
                const isOwner = channel.createdBy === currentUserPhone;
                return `<div class="channel-item" data-channel-id="${channel.id}" data-channel-owner="${channel.createdBy}" style="display:flex;align-items:center;gap:14px;padding:14px;background:#2a2a2a;border-radius:16px;margin-bottom:10px;cursor:pointer;">${channel.avatar ? `<img src="${channel.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">` : `<i class="fas fa-hashtag" style="font-size:32px;color:#aaa;"></i>`}<div style="flex:1"><h4 style="color:#fff;margin-bottom:4px;">${escapeHtml(channel.name)}</h4><p style="color:#888;font-size:12px;">${channel.members || 0} members ${isOwner ? '• Owner' : ''}</p></div><button class="join-btn" data-channel-id="${channel.id}" ${isMember ? 'disabled' : ''} style="background:${isMember ? '#3a3a3a' : '#4ade80'};border:none;padding:8px 20px;border-radius:12px;color:${isMember ? '#888' : '#1a1a1a'};cursor:pointer;font-weight:600;">${isMember ? 'Joined' : 'Join'}</button></div>`;
            }).join('');
            document.querySelectorAll('.channel-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('join-btn')) {
                        openChannelView(item.dataset.channelId, item.dataset.channelOwner === currentUserPhone);
                    }
                });
            });
            document.querySelectorAll('.join-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await FirebaseAPI.joinChannel(currentUserPhone, btn.dataset.channelId);
                    showNotification('Berhasil!', 'Anda bergabung ke channel', 'success', 2000);
                    loadChannels();
                });
            });
        } catch (error) {
            channelList.innerHTML = '<div class="empty-contacts"><i class="fas fa-exclamation-circle"></i> Gagal memuat channel</div>';
        }
    }
    
    async function openChannelView(channelId, isOwner) {
        currentChannelId = channelId;
        isChannelOwner = isOwner;
        currentChannel = await FirebaseAPI.getChannelById(channelId);
        const channelView = document.getElementById('channelViewScreen');
        const dashboard = document.getElementById('dashboardApp');
        if (dashboard) dashboard.style.display = 'none';
        if (channelView) channelView.style.display = 'flex';
        
        const channelViewName = document.getElementById('channelViewName');
        const channelViewMemberCount = document.getElementById('channelViewMemberCount');
        const channelViewAvatar = document.getElementById('channelViewAvatar');
        const channelInputArea = document.getElementById('channelInputArea');
        
        if (channelViewName) channelViewName.textContent = currentChannel.name;
        if (channelViewMemberCount) channelViewMemberCount.textContent = (currentChannel.members || 0) + ' members';
        if (channelViewAvatar && currentChannel.avatar) channelViewAvatar.src = currentChannel.avatar;
        if (channelInputArea) channelInputArea.style.display = isOwner ? 'flex' : 'none';
        
        await loadChannelMessages();
        if (unsubscribeChannelMessages) unsubscribeChannelMessages();
        unsubscribeChannelMessages = FirebaseAPI.listenChannelMessages(channelId, (msgId, message) => { appendChannelMessage(message); });
        
        const channelInfoBtn = document.getElementById('channelInfoBtn');
        if (channelInfoBtn) channelInfoBtn.onclick = () => showChannelInfo();
        
        // Re-attach back button
        const channelBackBtn = document.getElementById('channelBackBtn');
        if (channelBackBtn) {
            const newBackBtn = channelBackBtn.cloneNode(true);
            channelBackBtn.parentNode.replaceChild(newBackBtn, channelBackBtn);
            newBackBtn.addEventListener('click', () => {
                if (unsubscribeChannelMessages) unsubscribeChannelMessages();
                if (dashboard) dashboard.style.display = 'flex';
                if (channelView) channelView.style.display = 'none';
                loadChannels();
            });
        }
        
        // Re-attach send button
        const channelSendBtn = document.getElementById('channelSendBtn');
        if (channelSendBtn) {
            const newSendBtn = channelSendBtn.cloneNode(true);
            channelSendBtn.parentNode.replaceChild(newSendBtn, channelSendBtn);
            newSendBtn.addEventListener('click', sendChannelMessage);
        }
        
        // Re-attach message input
        const messageInput = document.getElementById('channelMessageInput');
        if (messageInput) {
            const newMessageInput = messageInput.cloneNode(true);
            messageInput.parentNode.replaceChild(newMessageInput, messageInput);
            newMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChannelMessage(); });
        }
        
        // Re-attach media buttons
        const channelImageBtn = document.getElementById('channelImageBtn');
        if (channelImageBtn) {
            const newImageBtn = channelImageBtn.cloneNode(true);
            channelImageBtn.parentNode.replaceChild(newImageBtn, channelImageBtn);
            newImageBtn.addEventListener('click', () => {
                const mediaInput = document.getElementById('channelMediaInput');
                if (mediaInput) {
                    mediaInput.accept = 'image/*';
                    mediaInput.click();
                    mediaInput.onchange = (e) => {
                        if (e.target.files && e.target.files[0]) sendChannelMedia(e.target.files[0], 'image');
                        mediaInput.value = '';
                    };
                }
            });
        }
        
        const channelVideoBtn = document.getElementById('channelVideoBtn');
        if (channelVideoBtn) {
            const newVideoBtn = channelVideoBtn.cloneNode(true);
            channelVideoBtn.parentNode.replaceChild(newVideoBtn, channelVideoBtn);
            newVideoBtn.addEventListener('click', () => {
                const mediaInput = document.getElementById('channelMediaInput');
                if (mediaInput) {
                    mediaInput.accept = 'video/*';
                    mediaInput.click();
                    mediaInput.onchange = (e) => {
                        if (e.target.files && e.target.files[0]) sendChannelMedia(e.target.files[0], 'video');
                        mediaInput.value = '';
                    };
                }
            });
        }
        
        const channelPollBtn = document.getElementById('channelPollBtn');
        if (channelPollBtn) {
            const newPollBtn = channelPollBtn.cloneNode(true);
            channelPollBtn.parentNode.replaceChild(newPollBtn, channelPollBtn);
            newPollBtn.addEventListener('click', () => showModal('votingModal'));
        }
        
        // Menu button
        const menuBtn = document.getElementById('channelMenuBtn');
        const menuDropdown = document.getElementById('channelMenuDropdown');
        if (menuBtn && menuDropdown) {
            const newMenuBtn = menuBtn.cloneNode(true);
            menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
            newMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => { menuDropdown.style.display = 'none'; });
        }
        
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) clearChatBtn.addEventListener('click', () => showNotification('Info', 'Fitur bersihkan chat akan datang', 'info', 2000));
        const reportChannelBtn = document.getElementById('reportChannelBtn');
        if (reportChannelBtn) reportChannelBtn.addEventListener('click', () => showNotification('Info', 'Laporan terkirim', 'success', 2000));
        const contactOwnerBtn = document.getElementById('contactOwnerBtn');
        if (contactOwnerBtn && currentChannel) {
            contactOwnerBtn.addEventListener('click', () => {
                showNotification('Info', 'Contact owner: ' + currentChannel.createdBy, 'info', 3000);
            });
        }
    }
    
    function showChannelInfo() {
        const infoScreen = document.getElementById('channelInfoScreen');
        const channelView = document.getElementById('channelViewScreen');
        if (infoScreen && channelView) {
            channelView.style.display = 'none';
            infoScreen.style.display = 'flex';
        }
        const infoName = document.getElementById('channelInfoName');
        const infoMembers = document.getElementById('channelInfoMembers');
        const infoDesc = document.getElementById('channelInfoDesc');
        const infoOwner = document.getElementById('channelInfoOwner');
        const infoAvatar = document.getElementById('channelInfoAvatar');
        const infoMessages = document.getElementById('channelInfoMessages');
        
        if (infoName && currentChannel) infoName.textContent = currentChannel.name;
        if (infoMembers && currentChannel) infoMembers.textContent = currentChannel.members || 0;
        if (infoDesc && currentChannel) infoDesc.textContent = currentChannel.description || '-';
        if (infoOwner && currentChannel) infoOwner.textContent = currentChannel.createdBy || '-';
        if (infoAvatar && currentChannel && currentChannel.avatar) infoAvatar.src = currentChannel.avatar;
        if (infoMessages) {
            const msgCount = document.querySelectorAll('#channelMessages .channel-message').length;
            infoMessages.textContent = msgCount;
        }
    }
    
    const channelInfoBackBtn = document.getElementById('channelInfoBackBtn');
    if (channelInfoBackBtn) {
        channelInfoBackBtn.addEventListener('click', () => {
            const infoScreen = document.getElementById('channelInfoScreen');
            const channelView = document.getElementById('channelViewScreen');
            if (infoScreen) infoScreen.style.display = 'none';
            if (channelView) channelView.style.display = 'flex';
        });
    }
    
    async function loadChannelMessages() {
        const messagesDiv = document.getElementById('channelMessages');
        if (!messagesDiv) return;
        messagesDiv.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Memuat pesan...</div>';
        try {
            const messages = await FirebaseAPI.getChannelMessages(currentChannelId);
            messagesDiv.innerHTML = '';
            if (!messages || messages.length === 0) { messagesDiv.innerHTML = '<div class="empty-messages">Belum ada pesan</div>'; return; }
            const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            sortedMessages.forEach(msg => appendChannelMessage(msg));
            scrollChannelToBottom();
        } catch (error) { messagesDiv.innerHTML = '<div class="empty-messages">Gagal memuat pesan</div>'; }
    }
    
    function appendChannelMessage(message) {
        const messagesDiv = document.getElementById('channelMessages');
        if (!messagesDiv) return;
        if (messagesDiv.querySelector(`.channel-message[data-message-id="${message.id}"]`)) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'channel-message';
        msgDiv.setAttribute('data-message-id', message.id);
        let mediaHtml = '';
        if (message.type === 'image' && message.mediaUrl) mediaHtml = `<div class="message-media"><img src="${message.mediaUrl}" onclick="window.open(this.src)"></div>`;
        else if (message.type === 'video' && message.mediaUrl) mediaHtml = `<div class="message-media"><video src="${message.mediaUrl}" controls></video></div>`;
        const time = new Date(message.timestamp);
        const timeStr = time.getHours().toString().padStart(2,'0') + ':' + time.getMinutes().toString().padStart(2,'0');
        msgDiv.innerHTML = `<div class="message-bubble"><div class="message-sender">${escapeHtml(message.senderName)}</div><div class="message-text">${escapeHtml(message.message)}</div>${mediaHtml}<div class="message-time">${timeStr}</div></div>`;
        messagesDiv.appendChild(msgDiv);
        scrollChannelToBottom();
    }
    
    function scrollChannelToBottom() {
        const messagesDiv = document.getElementById('channelMessages');
        if (messagesDiv) setTimeout(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; }, 100);
    }
    
    async function sendChannelMessage() {
        const input = document.getElementById('channelMessageInput');
        const message = input ? input.value.trim() : '';
        if (!message || isSending) return;
        isSending = true;
        if (input) input.value = '';
        try {
            await FirebaseAPI.sendChannelMessage(currentChannelId, currentUserPhone, message);
        } catch (error) {
            showNotification('Gagal', 'Pesan tidak terkirim', 'error', 2000);
            if (input) input.value = message;
        } finally { isSending = false; }
    }
    
    async function sendChannelMedia(file, type) {
        if (file.size > 10 * 1024 * 1024) { showNotification('Error', 'Ukuran maksimal 10MB', 'error', 2000); return; }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                await FirebaseAPI.sendChannelMessage(currentChannelId, currentUserPhone, '', type, event.target.result);
                showNotification('Berhasil', 'Media terkirim', 'success', 2000);
            } catch (error) { showNotification('Gagal', 'Gagal mengirim media', 'error', 2000); }
        };
        reader.readAsDataURL(file);
    }
    
    async function createChannel() {
        const channelName = document.getElementById('channelName');
        const channelDesc = document.getElementById('channelDesc');
        const name = channelName ? channelName.value.trim() : '';
        if (!name) { showNotification('Error', 'Nama channel wajib diisi', 'error', 2000); return; }
        const desc = channelDesc ? channelDesc.value.trim() : '';
        let avatarBase64 = null;
        const previewImg = document.getElementById('channelAvatarPreview');
        if (previewImg && previewImg.style.display !== 'none' && previewImg.src) avatarBase64 = previewImg.src;
        try {
            const channelData = await FirebaseAPI.createChannel(name, desc, currentUserPhone);
            if (avatarBase64) await FirebaseAPI.updateChannelInfo(channelData.id, { avatar: avatarBase64 });
            showNotification('Berhasil!', 'Channel berhasil dibuat', 'success', 2000);
            hideModal('createChannelModal');
            if (channelName) channelName.value = '';
            if (channelDesc) channelDesc.value = '';
            if (previewImg) { previewImg.style.display = 'none'; previewImg.src = ''; }
            loadChannels();
            const channelNav = document.querySelector('.nav-item[data-page="channel"]');
            if (channelNav) channelNav.click();
        } catch (error) { showNotification('Gagal', error.message, 'error', 2000); }
    }
    
    // Init channel events
    const createChannelModalBtn = document.getElementById('createChannelBtn');
    if (createChannelModalBtn) createChannelModalBtn.addEventListener('click', () => showModal('createChannelModal'));
    
    const confirmCreateChannelBtn = document.getElementById('confirmCreateChannelBtn');
    if (confirmCreateChannelBtn) confirmCreateChannelBtn.addEventListener('click', createChannel);
    
    const closeCreateChannelBtn = document.getElementById('closeCreateChannelBtn');
    if (closeCreateChannelBtn) closeCreateChannelBtn.addEventListener('click', () => hideModal('createChannelModal'));
    
    const cancelCreateChannelBtn = document.getElementById('cancelCreateChannelBtn');
    if (cancelCreateChannelBtn) cancelCreateChannelBtn.addEventListener('click', () => hideModal('createChannelModal'));
    
    const channelAvatarPicker = document.getElementById('channelAvatarPicker');
    if (channelAvatarPicker) {
        channelAvatarPicker.addEventListener('click', () => {
            const channelPhotoInput = document.getElementById('channelPhotoInput');
            if (channelPhotoInput) channelPhotoInput.click();
        });
    }
    
    const channelPhotoInput = document.getElementById('channelPhotoInput');
    if (channelPhotoInput) {
        channelPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('channelAvatarPreview');
                    if (preview) {
                        preview.src = event.target.result;
                        preview.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Voting modal
    const closeVotingModalBtn = document.getElementById('closeVotingModalBtn');
    if (closeVotingModalBtn) closeVotingModalBtn.addEventListener('click', () => hideModal('votingModal'));
    const cancelVotingBtn = document.getElementById('cancelVotingBtn');
    if (cancelVotingBtn) cancelVotingBtn.addEventListener('click', () => hideModal('votingModal'));
    
    let pollOptionsCount = 2;
    const addPollOptionBtn = document.getElementById('addPollOptionBtn');
    if (addPollOptionBtn) {
        addPollOptionBtn.addEventListener('click', () => {
            const container = document.getElementById('pollOptionsList');
            if (container) {
                pollOptionsCount++;
                const div = document.createElement('div');
                div.className = 'poll-option-input';
                div.innerHTML = `<input type="text" class="poll-option" placeholder="Pilihan ${pollOptionsCount}">`;
                container.appendChild(div);
            }
        });
    }
    
    const createPollSubmitBtn = document.getElementById('createPollSubmitBtn');
    if (createPollSubmitBtn) {
        createPollSubmitBtn.addEventListener('click', async () => {
            const questionInput = document.getElementById('pollQuestion');
            const question = questionInput ? questionInput.value.trim() : '';
            const optionInputs = document.querySelectorAll('.poll-option');
            const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(v => v);
            if (!question || options.length < 2) {
                showNotification('Error', 'Pertanyaan dan minimal 2 pilihan wajib diisi', 'error', 2000);
                return;
            }
            try {
                await FirebaseAPI.createPoll(currentChannelId, currentUserPhone, question, options);
                showNotification('Berhasil!', 'Voting berhasil dibuat', 'success', 2000);
                hideModal('votingModal');
                if (questionInput) questionInput.value = '';
                const container = document.getElementById('pollOptionsList');
                if (container) {
                    container.innerHTML = `<div class="poll-option-input"><input type="text" class="poll-option" placeholder="Pilihan 1"></div><div class="poll-option-input"><input type="text" class="poll-option" placeholder="Pilihan 2"></div>`;
                }
                pollOptionsCount = 2;
                await loadChannelMessages();
            } catch (error) { showNotification('Gagal', error.message, 'error', 2000); }
        });
    }
    
}); // AKHIR DOMContentLoaded