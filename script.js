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
    let currentChatPhone = null;
    let unsubscribeMessages = null;
    let statusListeners = [];
    
    // ========== CHANNEL VARIABLES ==========
    let currentChannel = null, currentChannelId = null, isChannelOwner = false, unsubscribeChannelMessages = null, isSending = false;
    
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
                <div class="notification-icon"><i class="fas ${iconClass}"></i></div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                    <div class="notification-time">baru saja</div>
                </div>
            </div>
            <div class="notification-progress"><div class="progress-bar" style="animation-duration: ${duration/1000}s;"></div></div>
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
    
    // ========== SESSION MANAGEMENT ==========
    function saveUserSession(phone, name, avatar = null) {
        const sessionData = {
            phone: phone,
            name: name,
            avatar: avatar,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        localStorage.setItem('zeroo_session', JSON.stringify(sessionData));
        localStorage.setItem('zeroo_user', JSON.stringify({
            phone: phone,
            name: name,
            verified: true,
            date: new Date().toISOString()
        }));
    }
    
    function clearUserSession() {
        localStorage.removeItem('zeroo_session');
        localStorage.removeItem('zeroo_user');
        localStorage.removeItem('zeroo_contacts');
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    
    function formatTimeShort(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    }
    
    // ========== DASHBOARD FUNCTIONS ==========
    function openDashboard(userPhone, userName) {
        currentUserPhone = userPhone;
        saveUserSession(userPhone, userName);
        
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
        
        setTimeout(async () => {
            await loadUserAvatarToDashboard(userPhone);
        }, 500);
        
        setTimeout(() => {
            showNotification('Selamat Datang! 🎉', 'Halo ' + (userName || userPhone) + ', selamat datang di Zeroo ChatRoom', 'success', 5000);
        }, 500);
    }
    
    // ========== LOAD CHATS (LIST KONTAK) ==========
    async function loadChats() {
    const chatList = document.querySelector('.chat-list');
    if (!chatList) return;
    
    chatList.innerHTML = '<div class="loading-contacts"><i class="fas fa-spinner fa-spin"></i> Memuat kontak...</div>';
    
    try {
        // Ambil chats (sudah termasuk auto-add dari pesan)
        const chats = await FirebaseAPI.getChats(currentUserPhone);
        console.log('Chats loaded:', chats);
        
        if (!chats || chats.length === 0) {
            chatList.innerHTML = `<div class="empty-contacts" style="text-align: center; padding: 40px;"><i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; color: #666;"></i><p style="color: #888; margin-bottom: 8px;">Belum ada chat</p><small style="color: #666;">Klik + untuk menambah kontak atau tunggu pesan masuk</small></div>`;
            return;
        }
        
        // Hitung unread untuk setiap chat
        const chatsWithUnread = [];
        for (const chat of chats) {
            const roomId = FirebaseAPI.getRoomId(currentUserPhone, chat.phone);
            const snapshot = await database.ref('messages/' + roomId)
                .orderByChild('receiver')
                .equalTo(currentUserPhone)
                .once('value');
            let unreadCount = 0;
            snapshot.forEach((child) => {
                if (!child.val().read) unreadCount++;
            });
            chatsWithUnread.push({ ...chat, unreadCount });
        }
        
        // Sort by lastMessageTime (terbaru di atas)
        chatsWithUnread.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        chatList.innerHTML = chatsWithUnread.map(chat => `
            <div class="chat-item" data-phone="${chat.phone}" style="display: flex; align-items: center; gap: 14px; padding: 14px; background: #2a2a2a; border-radius: 14px; margin-bottom: 10px; cursor: pointer;">
                <div style="position: relative; width: 52px; height: 52px;">
                    <i class="fas fa-user-circle" style="font-size: 52px; color: #aaa; position: absolute; top: 0; left: 0;"></i>
                    <img class="chat-avatar-img" data-phone="${chat.phone}" src="" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; position: absolute; top: 0; left: 0; display: none;">
                    <span class="status-dot ${chat.status === 'online' ? 'online' : ''}" style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: ${chat.status === 'online' ? '#4ade80' : '#666'}; border: 2px solid #2a2a2a;"></span>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h4 style="color: white; font-size: 16px; margin-bottom: 4px;">${escapeHtml(chat.name)}</h4>
                        <span style="font-size: 11px; color: #666;">${formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <p style="color: #888; font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${chat.lastMessage ? escapeHtml(chat.lastMessage.substring(0, 40)) : 'Mulai chat...'}</p>
                        ${chat.unreadCount > 0 ? `<span style="background: #4ade80; color: #1a1a1a; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 20px; min-width: 20px; text-align: center;">${chat.unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Load avatar untuk setiap kontak
        for (const chat of chatsWithUnread) {
            const avatarImg = document.querySelector(`.chat-avatar-img[data-phone="${chat.phone}"]`);
            if (avatarImg) {
                const avatar = await FirebaseAPI.getUserAvatar(chat.phone);
                if (avatar && avatar !== 'default' && avatar !== 'null') {
                    avatarImg.src = avatar;
                    avatarImg.style.display = 'block';
                    const iconElem = avatarImg.parentElement.querySelector('.fa-user-circle');
                    if (iconElem) iconElem.style.display = 'none';
                }
            }
        }
        
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const phone = item.getAttribute('data-phone');
                openChat(phone);
            });
        });
        
    } catch (error) {
        console.error('Error loading chats:', error);
        chatList.innerHTML = '<div class="empty-contacts"><i class="fas fa-exclamation-circle"></i> Gagal memuat chat</div>';
    }
}
    
    // ========== CHAT FUNCTIONS ==========
    async function loadMessages() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv) return;
        
        messagesDiv.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Memuat pesan...</div>';
        
        try {
            const messages = await FirebaseAPI.getMessages(currentUserPhone, currentChatPhone);
            messagesDiv.innerHTML = '';
            
            if (!messages || messages.length === 0) {
                messagesDiv.innerHTML = '<div class="empty-messages">Belum ada pesan. Mulai chatting sekarang!</div>';
                return;
            }
            
            const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            sortedMessages.forEach(msg => {
                const isOwn = msg.sender === currentUserPhone;
                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${isOwn ? 'own' : 'other'}`;
                msgDiv.setAttribute('data-message-id', msg.id);
                
                const timeStr = formatTimeShort(msg.timestamp);
                
                msgDiv.innerHTML = `
                    <div class="message-bubble">
                        <p style="margin: 0; word-wrap: break-word;">${escapeHtml(msg.message)}</p>
                        <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 4px;">
                            <span class="message-time">${timeStr}</span>
                            ${isOwn ? `<i class="fas fa-check-double ${msg.read ? 'read' : ''}"></i>` : ''}
                        </div>
                    </div>
                `;
                
                messagesDiv.appendChild(msgDiv);
            });
            
            scrollToBottom();
            
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesDiv.innerHTML = '<div class="empty-messages">Gagal memuat pesan</div>';
        }
    }
    
    function appendMessage(message) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    if (messagesDiv.querySelector(`.message[data-message-id="${message.id}"]`)) return;
    
    const isOwn = message.sender === currentUserPhone;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    msgDiv.setAttribute('data-message-id', message.id);
    
    const timeStr = formatTimeShort(message.timestamp);
    
    msgDiv.innerHTML = `
        <div class="message-bubble">
            <p style="margin: 0; word-wrap: break-word;">${escapeHtml(message.message)}</p>
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 4px;">
                <span class="message-time">${timeStr}</span>
                ${isOwn ? `<i class="fas fa-check-double ${message.read ? 'read' : ''}"></i>` : ''}
            </div>
        </div>
    `;
    
    messagesDiv.appendChild(msgDiv);
    scrollToBottom();
}
    
    function scrollToBottom() {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            setTimeout(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 100);
        }
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
    
    function openChat(phone) {
    currentChatPhone = phone;
    
    // Auto-add contact jika belum ada
    FirebaseAPI.addContact(currentUserPhone, phone).catch(() => {});
    
    const contentContainer = document.getElementById('contentContainer');
    const bottomNav = document.querySelector('.bottom-nav');
    const dashboardHeader = document.querySelector('.dashboard-header');
    
    if (contentContainer) contentContainer.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (dashboardHeader) dashboardHeader.style.display = 'none';
    
    const chatRoom = document.getElementById('chatRoom');
    if (chatRoom) chatRoom.style.display = 'flex';
    
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv) messagesDiv.innerHTML = '<div class="loading-messages"><i class="fas fa-spinner fa-spin"></i> Memuat pesan...</div>';
    
    // Mark all messages as read
    FirebaseAPI.markAllMessagesAsRead(currentUserPhone, phone);
    
    FirebaseAPI.getUserByPhone(phone).then(async user => {
        const chatUserName = document.getElementById('chatUserName');
        const chatUserStatus = document.getElementById('chatUserStatus');
        const chatAvatarIcon = document.querySelector('#chatRoom .chat-room-avatar i');
        const chatAvatarImg = document.getElementById('chatAvatarImg');
        
        if (chatUserName) chatUserName.textContent = user.name || 'User';
        if (chatUserStatus) {
            chatUserStatus.textContent = user.status === 'online' ? 'online' : 'offline';
            chatUserStatus.style.color = user.status === 'online' ? '#4ade80' : '#888';
        }
        
        const avatar = await FirebaseAPI.getUserAvatar(phone);
        if (avatar && avatar !== 'default' && avatar !== 'null') {
            if (chatAvatarImg) {
                chatAvatarImg.src = avatar;
                chatAvatarImg.style.display = 'block';
            }
            if (chatAvatarIcon) chatAvatarIcon.style.display = 'none';
        } else {
            if (chatAvatarImg) chatAvatarImg.style.display = 'none';
            if (chatAvatarIcon) chatAvatarIcon.style.display = 'block';
        }
    }).catch(err => console.error(err));
    
    loadMessages();
    
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = FirebaseAPI.listenMessages(currentUserPhone, phone, (msgId, message) => {
        appendMessage(message);
        // Mark as read jika chat sedang terbuka
        if (currentChatPhone === phone && message.sender !== currentUserPhone) {
            FirebaseAPI.markAllMessagesAsRead(currentUserPhone, phone);
            loadChats();
        }
    });
    
    if (statusListeners[phone]) statusListeners[phone]();
    statusListeners[phone] = FirebaseAPI.listenUserStatus(phone, (status) => {
        const chatUserStatus = document.getElementById('chatUserStatus');
        if (chatUserStatus) {
            chatUserStatus.textContent = status === 'online' ? 'online' : 'offline';
            chatUserStatus.style.color = status === 'online' ? '#4ade80' : '#888';
        }
    });
    
    // Typing indicator
    let typingTimeout = null;
    const msgInput = document.getElementById('messageInput');
    if (msgInput) {
        msgInput.addEventListener('input', () => {
            if (typingTimeout) clearTimeout(typingTimeout);
            FirebaseAPI.setTypingStatus(currentUserPhone, phone, true);
            typingTimeout = setTimeout(() => {
                FirebaseAPI.setTypingStatus(currentUserPhone, phone, false);
            }, 2000);
        });
    }
    
    // Listen typing from other user
    if (window.typingUnsubscribe) window.typingUnsubscribe();
    window.typingUnsubscribe = FirebaseAPI.listenTyping(currentUserPhone, phone, (isTyping) => {
        const typingIndicator = document.getElementById('typingIndicator');
        if (isTyping) {
            if (!typingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'typingIndicator';
                indicator.className = 'typing-indicator';
                indicator.innerHTML = '<span></span><span></span><span></span><span class="typing-text">mengetik...</span>';
                const chatUserStatus = document.getElementById('chatUserStatus');
                if (chatUserStatus) chatUserStatus.parentElement.appendChild(indicator);
            }
        } else {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) indicator.remove();
        }
    });
    
    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) {
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        newBackBtn.addEventListener('click', closeChat);
    }
    
    const sendBtn = document.getElementById('sendMessageBtn');
    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        newSendBtn.addEventListener('click', sendMessage);
    }
    
    if (msgInput) {
        const newMsgInput = msgInput.cloneNode(true);
        msgInput.parentNode.replaceChild(newMsgInput, msgInput);
        newMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
        newMsgInput.focus();
    }
}
    
    function closeChat() {
        if (unsubscribeMessages) unsubscribeMessages();
        
        const contentContainer = document.getElementById('contentContainer');
        const bottomNav = document.querySelector('.bottom-nav');
        const dashboardHeader = document.querySelector('.dashboard-header');
        const chatRoom = document.getElementById('chatRoom');
        
        if (contentContainer) contentContainer.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'flex';
        if (dashboardHeader) dashboardHeader.style.display = 'flex';
        if (chatRoom) chatRoom.style.display = 'none';
        
        currentChatPhone = null;
        loadChats();
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
        const shortPhone = user.phone.substring(0, 4) + '****' + user.phone.substring(user.phone.length - 3);
        const avatarUrl = user.avatar && user.avatar !== 'default' ? user.avatar : null;
        
        return `
            <div class="contact-item" data-phone="${user.phone}">
                <div class="contact-info">
                    <div class="contact-avatar" id="contactAvatar-${user.phone}">
                        ${avatarUrl ? `<img src="${avatarUrl}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : ''}
                        <i class="fas fa-user-circle" style="${avatarUrl ? 'display:none' : 'display:flex'}"></i>
                    </div>
                    <div class="contact-details">
                        <h4>${escapeHtml(user.name)}</h4>
                        <p>${displayPhone}</p>
                    </div>
                    <div class="contact-status">
                        <span class="status-dot ${user.status === 'online' ? 'online' : ''}"></span>
                        <span>${user.status === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
                <div class="contact-actions">
                    ${isAdded ? 
                        `<button class="remove-contact-btn" data-phone="${user.phone}"><i class="fas fa-trash-alt"></i> Hapus</button>` :
                        `<button class="add-contact-btn" data-phone="${user.phone}"><i class="fas fa-user-plus"></i> Tambah</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
    
    // Fix avatar display after render
    filteredUsers.forEach(user => {
        const avatarContainer = document.getElementById(`contactAvatar-${user.phone}`);
        if (avatarContainer && user.avatar && user.avatar !== 'default') {
            const img = avatarContainer.querySelector('img');
            const icon = avatarContainer.querySelector('i');
            if (img && img.complete && img.naturalWidth === 0) {
                img.style.display = 'none';
                if (icon) icon.style.display = 'flex';
            }
        }
    });
    
    // Event listener untuk tombol tambah kontak
    document.querySelectorAll('.add-contact-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const phone = btn.getAttribute('data-phone');
            await addContact(phone);
        });
    });
    
    // Event listener untuk tombol hapus kontak
    document.querySelectorAll('.remove-contact-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const phone = btn.getAttribute('data-phone');
            await removeContact(phone);
        });
    });
}

// Fungsi hapus kontak
async function removeContact(phone) {
    try {
        await FirebaseAPI.removeContact(currentUserPhone, phone);
        await loadUsersForContact(); // refresh modal
        showNotification('Berhasil!', 'Kontak berhasil dihapus', 'success', 2000);
        loadChats(); // refresh chat list
    } catch (error) {
        showNotification('Gagal', error.message, 'error', 2000);
    }
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
    let regOTP = '', regTimerInterval = null, regTimeLeft = 300;
    let loginOTP = '', loginTimerInterval = null, loginTimeLeft = 300;
    
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        document.querySelector('.slides-container').style.display = 'none';
        document.querySelector('.pagination').style.display = 'none';
        document.getElementById('registerForm').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'none';
    });
    
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        document.querySelector('.slides-container').style.display = 'none';
        document.querySelector('.pagination').style.display = 'none';
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('registerForm').style.display = 'none';
    });
    
    document.getElementById('backToWelcome')?.addEventListener('click', () => {
        document.getElementById('registerForm').style.display = 'none';
        document.querySelector('.slides-container').style.display = 'flex';
        document.querySelector('.pagination').style.display = 'flex';
    });
    
    document.getElementById('backToWelcomeLogin')?.addEventListener('click', () => {
        document.getElementById('loginForm').style.display = 'none';
        document.querySelector('.slides-container').style.display = 'flex';
        document.querySelector('.pagination').style.display = 'flex';
    });
    
    document.querySelectorAll('.otp-field, .otp-field-login').forEach((field, idx, arr) => {
        if (field) {
            field.addEventListener('input', (e) => { if (e.target.value.length === 1 && idx < arr.length - 1 && arr[idx + 1]) arr[idx + 1].focus(); });
            field.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !e.target.value && idx > 0 && arr[idx - 1]) arr[idx - 1].focus(); });
        }
    });
    
    document.getElementById('sendOtpReg')?.addEventListener('click', async () => {
        const phone = document.getElementById('regPhone').value.trim();
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
        document.getElementById('regStep1').style.display = 'none';
        document.getElementById('regStep2').style.display = 'block';
        regTimeLeft = 300;
        const timerEl = document.getElementById('timer');
        if (regTimerInterval) clearInterval(regTimerInterval);
        regTimerInterval = setInterval(() => {
            if (regTimeLeft <= 0) { clearInterval(regTimerInterval); if (timerEl) timerEl.innerHTML = 'Kode kadaluarsa! '; document.getElementById('resendOtp').style.display = 'inline-block'; }
            else { regTimeLeft--; if (timerEl) timerEl.innerHTML = Math.floor(regTimeLeft/60) + ':' + String(regTimeLeft%60).padStart(2,'0') + ' '; }
        }, 1000);
    });
    
    document.getElementById('verifyOtpReg')?.addEventListener('click', async () => {
        let inputOTP = '';
        document.querySelectorAll('#regStep2 .otp-field').forEach(f => { if (f) inputOTP += f.value; });
        if (inputOTP === regOTP) {
            const phone = document.getElementById('regPhone').value.trim();
            const userName = 'User_' + phone.substring(phone.length - 4);
            await FirebaseAPI.registerUser(phone, userName);
            saveUserSession(phone, userName);
            showNotification('Berhasil!', 'Akun berhasil dibuat', 'success', 2000);
            openDashboard(phone, userName);
        } else { showNotification('Gagal', 'Kode OTP salah', 'error', 2000); }
    });
    
    document.getElementById('resendOtp')?.addEventListener('click', () => {
        document.getElementById('sendOtpReg').click();
        document.getElementById('resendOtp').style.display = 'none';
    });
    
    document.getElementById('sendOtpLogin')?.addEventListener('click', async () => {
        const phone = document.getElementById('loginPhone').value.trim();
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
        document.getElementById('loginStep1').style.display = 'none';
        document.getElementById('loginStep2').style.display = 'block';
        loginTimeLeft = 300;
        const timerEl = document.getElementById('timerLogin');
        if (loginTimerInterval) clearInterval(loginTimerInterval);
        loginTimerInterval = setInterval(() => {
            if (loginTimeLeft <= 0) { clearInterval(loginTimerInterval); if (timerEl) timerEl.innerHTML = 'Kode kadaluarsa! '; document.getElementById('resendOtpLogin').style.display = 'inline-block'; }
            else { loginTimeLeft--; if (timerEl) timerEl.innerHTML = Math.floor(loginTimeLeft/60) + ':' + String(loginTimeLeft%60).padStart(2,'0') + ' '; }
        }, 1000);
    });
    
    document.getElementById('verifyOtpLogin')?.addEventListener('click', async () => {
        let inputOTP = '';
        document.querySelectorAll('#loginStep2 .otp-field-login').forEach(f => { if (f) inputOTP += f.value; });
        if (inputOTP === loginOTP) {
            const phone = document.getElementById('loginPhone').value.trim();
            const userData = await FirebaseAPI.loginUser(phone);
            saveUserSession(phone, userData.name, userData.avatar);
            showNotification('Berhasil!', 'Selamat datang kembali', 'success', 2000);
            openDashboard(phone, userData.name);
        } else { showNotification('Gagal', 'Kode OTP salah', 'error', 2000); }
    });
    
    document.getElementById('resendOtpLogin')?.addEventListener('click', () => {
        document.getElementById('sendOtpLogin').click();
        document.getElementById('resendOtpLogin').style.display = 'none';
    });
    
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
    
    userInfoBtn?.addEventListener('click', async () => {
        const savedUser = localStorage.getItem('zeroo_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            currentProfileUser = userData.phone;
            await loadProfileData();
            if (profileScreen) profileScreen.style.display = 'flex';
        }
    });
    
    async function loadProfileData() {
        if (!currentProfileUser) return;
        try {
            const userData = await FirebaseAPI.getUserByPhone(currentProfileUser);
            if (userData) {
                if (profileNameInput) profileNameInput.value = userData.name || '';
                if (profilePhoneDisplay) profilePhoneDisplay.textContent = '+62 ' + currentProfileUser;
                if (userData.registeredAt && profileJoinDate) {
                    const date = new Date(userData.registeredAt);
                    profileJoinDate.textContent = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                if (userData.avatar && userData.avatar !== 'default' && userData.avatar !== 'null') {
                    profileAvatarImg.src = userData.avatar;
                    profileAvatarImg.style.display = 'block';
                    const defaultIcon = document.querySelector('#profileAvatar i');
                    if (defaultIcon) defaultIcon.style.display = 'none';
                } else {
                    profileAvatarImg.style.display = 'none';
                }
            }
        } catch (error) { console.error(error); }
    }
    
    profileSaveBtn?.addEventListener('click', async () => {
        const newName = profileNameInput ? profileNameInput.value.trim() : '';
        if (!newName) { showNotification('Error', 'Nama tidak boleh kosong', 'error', 2000); return; }
        showNotification('Menyimpan...', 'Mohon tunggu', 'info', 2000);
        try {
            await FirebaseAPI.updateUserName(currentProfileUser, newName);
            if (avatarChanged && avatarBase64) {
                await FirebaseAPI.updateUserAvatar(currentProfileUser, avatarBase64);
                if (userAvatarImg) {
                    userAvatarImg.src = avatarBase64;
                    userAvatarImg.style.display = 'block';
                }
                if (userAvatarIcon) userAvatarIcon.style.display = 'none';
                const savedUser = localStorage.getItem('zeroo_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.avatar = avatarBase64;
                    localStorage.setItem('zeroo_user', JSON.stringify(userData));
                }
            }
            document.getElementById('userName').textContent = newName;
            document.getElementById('welcomeName').textContent = newName;
            const savedUser = localStorage.getItem('zeroo_user');
            if (savedUser) { const userData = JSON.parse(savedUser); userData.name = newName; localStorage.setItem('zeroo_user', JSON.stringify(userData)); }
            showNotification('Berhasil!', 'Profile berhasil diperbarui', 'success', 2000);
            avatarChanged = false;
            loadChats();
        } catch (error) { showNotification('Gagal', error.message, 'error', 2000); }
    });
    
    profileBackBtn?.addEventListener('click', () => { if (profileScreen) profileScreen.style.display = 'none'; avatarChanged = false; });
    changePhotoBtn?.addEventListener('click', () => { if (profilePhotoInput) profilePhotoInput.click(); });
    profilePhotoInput?.addEventListener('change', (e) => {
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
    
    async function loadUserAvatarToDashboard(phone) {
        try {
            const avatar = await FirebaseAPI.getUserAvatar(phone);
            if (avatar && avatar !== 'default' && avatar !== 'null' && avatar !== '') {
                if (userAvatarImg) {
                    userAvatarImg.src = avatar;
                    userAvatarImg.style.display = 'block';
                }
                if (userAvatarIcon) userAvatarIcon.style.display = 'none';
            } else {
                if (userAvatarImg) userAvatarImg.style.display = 'none';
                if (userAvatarIcon) userAvatarIcon.style.display = 'flex';
            }
        } catch (error) { console.error(error); }
    }
    
    // ========== LOGOUT ==========
    async function handleLogout() {
        if (confirm('Yakin ingin keluar?')) {
            if (currentUserPhone) {
                await FirebaseAPI.updateUserStatus(currentUserPhone, 'offline');
                await FirebaseAPI.logActivity(currentUserPhone, 'logout', {});
            }
            clearUserSession();
            currentUserPhone = null;
            currentChatPhone = null;
            currentChannelId = null;
            if (dashboardApp) dashboardApp.style.display = 'none';
            document.querySelector('.slides-container').style.display = 'flex';
            document.querySelector('.pagination').style.display = 'flex';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'none';
            changeSlide(0);
            showNotification('Berhasil Keluar', 'Sampai jumpa lagi! 👋', 'success', 3000);
        }
    }
    
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    logoutOption?.addEventListener('click', async () => {
        if (profileScreen) profileScreen.style.display = 'none';
        await handleLogout();
    });
    
    document.getElementById('searchIcon')?.addEventListener('click', () => {
        showNotification('Info', 'Fitur pencarian akan segera hadir!', 'info', 2000);
    });
    
    document.getElementById('addContactBtn')?.addEventListener('click', async () => {
        await loadUsersForContact();
        showModal('contactModal');
    });
    
    document.getElementById('closeModalBtn')?.addEventListener('click', () => hideModal('contactModal'));
    document.getElementById('cancelModalBtn')?.addEventListener('click', () => hideModal('contactModal'));
    document.getElementById('contactModal')?.addEventListener('click', (e) => { if (e.target.id === 'contactModal') hideModal('contactModal'); });
    document.getElementById('searchContactInput')?.addEventListener('input', () => renderContactList(allUsers));
    
    // ========== CHANNEL SYSTEM ==========
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
    
    // Update header
    const channelViewName = document.getElementById('channelViewName');
    const channelViewMemberCount = document.getElementById('channelViewMemberCount');
    const channelViewAvatar = document.getElementById('channelViewAvatar');
    const channelInputArea = document.getElementById('channelInputArea');
    
    if (channelViewName) channelViewName.textContent = currentChannel.name;
    if (channelViewMemberCount) channelViewMemberCount.textContent = (currentChannel.members || 0) + ' members';
    if (channelViewAvatar && currentChannel.avatar) channelViewAvatar.src = currentChannel.avatar;
    if (channelInputArea) channelInputArea.style.display = isOwner ? 'flex' : 'none';
    
    // Load messages
    await loadChannelMessages();
    
    // Listen for new messages
    if (unsubscribeChannelMessages) unsubscribeChannelMessages();
    unsubscribeChannelMessages = FirebaseAPI.listenChannelMessages(channelId, (msgId, message) => {
        appendChannelMessage(message);
    });
    
    // ========== FIX: PASANG EVENT KLIK KE SELURUH AREA INFO CHANNEL ==========
    // Ambil elemen yang bisa diklik untuk info channel
    const channelInfoArea = document.querySelector('.channel-view-info');
    const channelViewAvatarElem = document.getElementById('channelViewAvatar');
    const channelViewNameElem = document.getElementById('channelViewName');
    
    // Fungsi untuk buka info channel
    const openInfoChannel = (e) => {
        e.stopPropagation();
        console.log('Channel info clicked!');
        showChannelInfo();
    };
    
    // Pasang event ke berbagai elemen
    if (channelInfoArea) {
        const newInfoArea = channelInfoArea.cloneNode(true);
        channelInfoArea.parentNode.replaceChild(newInfoArea, channelInfoArea);
        newInfoArea.addEventListener('click', openInfoChannel);
        newInfoArea.style.cursor = 'pointer';
    }
    
    if (channelViewAvatarElem) {
        const newAvatar = channelViewAvatarElem.cloneNode(true);
        channelViewAvatarElem.parentNode.replaceChild(newAvatar, channelViewAvatarElem);
        newAvatar.addEventListener('click', openInfoChannel);
        newAvatar.style.cursor = 'pointer';
    }
    
    if (channelViewNameElem) {
        const newName = channelViewNameElem.cloneNode(true);
        channelViewNameElem.parentNode.replaceChild(newName, channelViewNameElem);
        newName.addEventListener('click', openInfoChannel);
        newName.style.cursor = 'pointer';
    }
    
    // Back button
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
    
    // Send message button
    const channelSendBtn = document.getElementById('channelSendBtn');
    if (channelSendBtn) {
        const newSendBtn = channelSendBtn.cloneNode(true);
        channelSendBtn.parentNode.replaceChild(newSendBtn, channelSendBtn);
        newSendBtn.addEventListener('click', sendChannelMessage);
    }
    
    // Message input enter key
    const messageInput = document.getElementById('channelMessageInput');
    if (messageInput) {
        const newMsgInput = messageInput.cloneNode(true);
        messageInput.parentNode.replaceChild(newMsgInput, messageInput);
        newMsgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChannelMessage();
        });
    }
    
    // Media buttons
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
    
    // Menu button (titik tiga)
    const menuBtn = document.getElementById('channelMenuBtn');
    const menuDropdown = document.getElementById('channelMenuDropdown');
    if (menuBtn && menuDropdown) {
        const newMenuBtn = menuBtn.cloneNode(true);
        menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
        newMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => { if (menuDropdown) menuDropdown.style.display = 'none'; });
    }
    
    // Menu items
    const editChannelBtn = document.getElementById('editChannelInfoBtn');
    if (editChannelBtn) {
        const newEditBtn = editChannelBtn.cloneNode(true);
        editChannelBtn.parentNode.replaceChild(newEditBtn, editChannelBtn);
        newEditBtn.addEventListener('click', () => {
            document.getElementById('editChannelName').value = currentChannel.name;
            document.getElementById('editChannelDesc').value = currentChannel.description || '';
            showModal('editChannelModal');
            if (menuDropdown) menuDropdown.style.display = 'none';
        });
    }
    
    const createPollItem = document.getElementById('createPollBtn');
    if (createPollItem) {
        const newPollItem = createPollItem.cloneNode(true);
        createPollItem.parentNode.replaceChild(newPollItem, createPollItem);
        newPollItem.addEventListener('click', () => {
            showModal('votingModal');
            if (menuDropdown) menuDropdown.style.display = 'none';
        });
    }
    
    const deleteChannelMenuItem = document.getElementById('deleteChannelBtn');
    if (deleteChannelMenuItem && isOwner) {
        const newDeleteItem = deleteChannelMenuItem.cloneNode(true);
        deleteChannelMenuItem.parentNode.replaceChild(newDeleteItem, deleteChannelMenuItem);
        newDeleteItem.addEventListener('click', async () => {
            if (confirm('Yakin ingin menghapus channel ini? Semua pesan akan hilang permanen!')) {
                showNotification('Info', 'Fitur hapus channel akan segera hadir', 'info', 2000);
            }
            if (menuDropdown) menuDropdown.style.display = 'none';
        });
    }
}
    
    async function showChannelInfo() {
        const infoScreen = document.getElementById('channelInfoScreen');
        const channelView = document.getElementById('channelViewScreen');
        if (infoScreen) infoScreen.style.display = 'flex';
        if (channelView) channelView.style.display = 'none';
        
        document.getElementById('channelInfoName').textContent = currentChannel.name;
        document.getElementById('channelInfoMembers').textContent = currentChannel.members || 0;
        document.getElementById('channelInfoDesc').textContent = currentChannel.description || 'Tidak ada deskripsi';
        if (currentChannel.avatar) document.getElementById('channelInfoAvatar').src = currentChannel.avatar;
        
        const ownerData = await FirebaseAPI.getUserByPhone(currentChannel.createdBy);
        document.getElementById('channelInfoOwner').textContent = ownerData ? ownerData.name : currentChannel.createdBy;
        
        if (currentChannel.createdAt) {
            const date = new Date(currentChannel.createdAt);
            document.getElementById('channelInfoCreatedAt').textContent = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        const msgCount = document.querySelectorAll('#channelMessages .channel-message').length;
        document.getElementById('channelInfoMessages').textContent = msgCount;
        
        const clearChatBtn = document.getElementById('clearChatChannelBtn');
        const deleteChannelBtn = document.getElementById('deleteChannelBtn');
        const reportBtn = document.getElementById('reportChannelBtn');
        
        if (isChannelOwner) {
            clearChatBtn?.classList.remove('hidden');
            deleteChannelBtn?.classList.remove('hidden');
            reportBtn?.classList.remove('hidden');
        } else {
            clearChatBtn?.classList.add('hidden');
            deleteChannelBtn?.classList.add('hidden');
            reportBtn?.classList.remove('hidden');
        }
        
        document.getElementById('channelInfoBackBtn')?.addEventListener('click', () => {
            if (infoScreen) infoScreen.style.display = 'none';
            if (channelView) channelView.style.display = 'flex';
        });
        
        reportBtn?.addEventListener('click', async () => {
            if (confirm('Yakin ingin melaporkan channel ini?')) {
                await FirebaseAPI.logActivity(currentUserPhone, 'report_channel', { channelId: currentChannelId, channelName: currentChannel.name });
                showNotification('Laporan Terkirim', 'Admin akan segera meninjau', 'success', 3000);
            }
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
        const timeStr = formatTimeShort(message.timestamp);
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
        const name = document.getElementById('channelName').value.trim();
        if (!name) { showNotification('Error', 'Nama channel wajib diisi', 'error', 2000); return; }
        const desc = document.getElementById('channelDesc').value.trim();
        let avatarBase64 = null;
        const previewImg = document.getElementById('channelAvatarPreview');
        if (previewImg && previewImg.style.display !== 'none' && previewImg.src) avatarBase64 = previewImg.src;
        try {
            const channelData = await FirebaseAPI.createChannel(name, desc, currentUserPhone);
            if (avatarBase64) await FirebaseAPI.updateChannelInfo(channelData.id, { avatar: avatarBase64 });
            showNotification('Berhasil!', 'Channel berhasil dibuat', 'success', 2000);
            hideModal('createChannelModal');
            document.getElementById('channelName').value = '';
            document.getElementById('channelDesc').value = '';
            if (previewImg) { previewImg.style.display = 'none'; previewImg.src = ''; }
            loadChannels();
            document.querySelector('.nav-item[data-page="channel"]').click();
        } catch (error) { showNotification('Gagal', error.message, 'error', 2000); }
    }
    
    document.getElementById('createChannelBtn')?.addEventListener('click', () => showModal('createChannelModal'));
    document.getElementById('confirmCreateChannelBtn')?.addEventListener('click', createChannel);
    document.getElementById('closeCreateChannelBtn')?.addEventListener('click', () => hideModal('createChannelModal'));
    document.getElementById('cancelCreateChannelBtn')?.addEventListener('click', () => hideModal('createChannelModal'));
    
    document.getElementById('channelAvatarPicker')?.addEventListener('click', () => document.getElementById('channelPhotoInput').click());
    document.getElementById('channelPhotoInput')?.addEventListener('change', (e) => {
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
    
    document.getElementById('channelImageBtn')?.addEventListener('click', () => {
        const input = document.getElementById('channelMediaInput');
        input.accept = 'image/*';
        input.click();
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) sendChannelMedia(e.target.files[0], 'image');
            input.value = '';
        };
    });
    
    document.getElementById('channelVideoBtn')?.addEventListener('click', () => {
        const input = document.getElementById('channelMediaInput');
        input.accept = 'video/*';
        input.click();
        input.onchange = (e) => {
            if (e.target.files && e.target.files[0]) sendChannelMedia(e.target.files[0], 'video');
            input.value = '';
        };
    });
    
    document.getElementById('channelPollBtn')?.addEventListener('click', () => showModal('votingModal'));
    
    // ========== AUTO LOGIN CHECK ==========
    (async () => {
        const session = localStorage.getItem('zeroo_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                if (new Date(sessionData.expiresAt) > new Date()) {
                    const exists = await FirebaseAPI.isUserRegistered(sessionData.phone);
                    if (exists) {
                        const user = await FirebaseAPI.getUserByPhone(sessionData.phone);
                        await FirebaseAPI.loginUser(sessionData.phone);
                        openDashboard(sessionData.phone, user.name);
                    }
                } else {
                    clearUserSession();
                }
            } catch(e) { clearUserSession(); }
        }
    })();
    
    
    
}); // AKHIR DOMContentLoaded