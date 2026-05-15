// ========== FIREBASE CONFIGURATION ==========
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAbxWV46SwqtRE1RkkqMztIij39JwrY1hI",
    authDomain: "chatroom-c1247.firebaseapp.com",
    databaseURL: "https://chatroom-c1247-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chatroom-c1247",
    storageBucket: "chatroom-c1247.firebasestorage.app",
    messagingSenderId: "881291641182",
    appId: "1:881291641182:web:4341e04f6d96f15c178fcf"
};

firebase.initializeApp(FIREBASE_CONFIG);
const database = firebase.database();

// ========== USER MANAGEMENT ==========
async function isUserRegistered(phone) {
    const snapshot = await database.ref('users/' + phone).once('value');
    return snapshot.exists();
}

async function registerUser(phone, name = null) {
    const userRef = database.ref('users/' + phone);
    const now = new Date().toISOString();
    const userData = {
        phone: phone,
        name: name || 'User_' + phone.substring(phone.length - 4),
        registeredAt: now,
        lastLogin: now,
        status: 'online',
        device: 'web',
        version: '1.0.0',
        avatar: 'default'
    };
    await userRef.set(userData);
    return userData;
}

async function loginUser(phone) {
    const userRef = database.ref('users/' + phone);
    const snapshot = await userRef.once('value');
    if (!snapshot.exists()) throw new Error('Nomor tidak terdaftar');
    await userRef.update({ lastLogin: new Date().toISOString(), status: 'online', lastDevice: 'web' });
    return snapshot.val();
}

async function updateUserStatus(phone, status) {
    await database.ref('users/' + phone + '/status').set(status);
}

async function getAllUsers(excludePhone = null) {
    const snapshot = await database.ref('users').once('value');
    const users = [];
    snapshot.forEach((child) => {
        const userData = child.val();
        if (excludePhone && userData.phone === excludePhone) return;
        users.push({
            phone: userData.phone,
            name: userData.name,
            status: userData.status || 'offline',
            lastLogin: userData.lastLogin,
            avatar: userData.avatar || 'default'
        });
    });
    return users;
}

async function getUserByPhone(phone) {
    const snapshot = await database.ref('users/' + phone).once('value');
    return snapshot.val();
}

// ========== CONTACTS MANAGEMENT ==========
async function addContact(userPhone, contactPhone) {
    const contactExists = await isUserRegistered(contactPhone);
    if (!contactExists) throw new Error('Nomor WhatsApp tidak terdaftar di Zeroo');
    const contactRef = database.ref('contacts/' + userPhone + '/' + contactPhone);
    await contactRef.set({ phone: contactPhone, addedAt: new Date().toISOString() });
    await logActivity(userPhone, 'add_contact', { contact: contactPhone });
    return true;
}

async function removeContact(userPhone, contactPhone) {
    await database.ref('contacts/' + userPhone + '/' + contactPhone).remove();
    await logActivity(userPhone, 'remove_contact', { contact: contactPhone });
}

async function getContacts(userPhone) {
    const snapshot = await database.ref('contacts/' + userPhone).once('value');
    const contacts = [];
    snapshot.forEach((child) => { contacts.push({ phone: child.key, ...child.val() }); });
    const contactsWithDetails = [];
    for (const contact of contacts) {
        const userDetail = await getUserByPhone(contact.phone);
        if (userDetail) {
            contactsWithDetails.push({
                phone: contact.phone,
                name: userDetail.name,
                status: userDetail.status || 'offline',
                addedAt: contact.addedAt,
                avatar: userDetail.avatar
            });
        }
    }
    return contactsWithDetails;
}

// ========== CHAT / MESSAGES ==========
function getRoomId(phone1, phone2) {
    return phone1 < phone2 ? phone1 + '_' + phone2 : phone2 + '_' + phone1;
}

async function sendMessage(senderPhone, receiverPhone, message, type = 'text') {
    const roomId = getRoomId(senderPhone, receiverPhone);
    const messageRef = database.ref('messages/' + roomId).push();
    const messageData = {
        id: messageRef.key,
        sender: senderPhone,
        receiver: receiverPhone,
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false
    };
    await messageRef.set(messageData);
    await updateLastChat(senderPhone, receiverPhone, message);
    await updateLastChat(receiverPhone, senderPhone, message);
    await logActivity(senderPhone, 'send_message', { to: receiverPhone });
    return messageData;
}

async function updateLastChat(userPhone, otherPhone, message) {
    await database.ref('chats/' + userPhone + '/' + otherPhone).set({
        lastMessage: message,
        lastMessageTime: new Date().toISOString(),
        otherUser: otherPhone
    });
}

async function getChats(userPhone) {
    const snapshot = await database.ref('chats/' + userPhone).once('value');
    const chats = [];
    snapshot.forEach((child) => { chats.push({ phone: child.key, ...child.val() }); });
    chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    const chatsWithDetails = [];
    for (const chat of chats) {
        const userDetail = await getUserByPhone(chat.phone);
        if (userDetail) {
            chatsWithDetails.push({
                phone: chat.phone,
                name: userDetail.name,
                status: userDetail.status || 'offline',
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime
            });
        }
    }
    return chatsWithDetails;
}

async function getMessages(userPhone, otherPhone, limit = 50) {
    const roomId = getRoomId(userPhone, otherPhone);
    const snapshot = await database.ref('messages/' + roomId).orderByKey().limitToLast(limit).once('value');
    const messages = [];
    snapshot.forEach((child) => { messages.push({ id: child.key, ...child.val() }); });
    await markMessagesAsRead(userPhone, otherPhone);
    return messages;
}

async function markMessagesAsRead(userPhone, otherPhone) {
    const roomId = getRoomId(userPhone, otherPhone);
    const snapshot = await database.ref('messages/' + roomId).orderByChild('receiver').equalTo(userPhone).once('value');
    const updates = {};
    snapshot.forEach((child) => { if (!child.val().read) updates[child.key + '/read'] = true; });
    if (Object.keys(updates).length > 0) await database.ref('messages/' + roomId).update(updates);
}

function listenMessages(userPhone, otherPhone, callback) {
    const roomId = getRoomId(userPhone, otherPhone);
    const messagesRef = database.ref('messages/' + roomId).limitToLast(50);
    messagesRef.on('child_added', (snapshot) => callback(snapshot.key, snapshot.val()));
    return () => messagesRef.off();
}

function listenUserStatus(phone, callback) {
    const userRef = database.ref('users/' + phone + '/status');
    userRef.on('value', (snapshot) => callback(snapshot.val()));
    return () => userRef.off();
}

// ========== AVATAR FUNCTIONS ==========
async function updateUserName(phone, newName) {
    await database.ref('users/' + phone + '/name').set(newName);
    await logActivity(phone, 'update_name', { newName: newName });
}

async function updateUserAvatar(phone, avatarBase64) {
    await database.ref('users/' + phone + '/avatar').set(avatarBase64);
    await database.ref('users/' + phone + '/avatarUpdatedAt').set(new Date().toISOString());
    await logActivity(phone, 'update_avatar', {});
    return true;
}

async function getUserAvatar(phone) {
    const snapshot = await database.ref('users/' + phone + '/avatar').once('value');
    const avatar = snapshot.val();
    if (!avatar || avatar === 'default' || avatar === 'null' || avatar === 'undefined' || avatar === '') return null;
    return avatar;
}

// ========== CHANNELS ==========
async function createChannel(name, description, createdBy) {
    const channelRef = database.ref('channels').push();
    const channelData = {
        id: channelRef.key,
        name: name,
        description: description,
        createdBy: createdBy,
        createdAt: new Date().toISOString(),
        members: 1,
        icon: 'fa-hashtag',
        avatar: null
    };
    await channelRef.set(channelData);
    await joinChannel(createdBy, channelRef.key);
    await logActivity(createdBy, 'create_channel', { channel: name });
    return channelData;
}

async function getChannels() {
    const snapshot = await database.ref('channels').once('value');
    const channels = [];
    snapshot.forEach((child) => { channels.push({ id: child.key, ...child.val() }); });
    return channels;
}

async function joinChannel(userPhone, channelId) {
    await database.ref('channel_members/' + channelId + '/' + userPhone).set({ joinedAt: new Date().toISOString() });
    const channelRef = database.ref('channels/' + channelId);
    channelRef.transaction((channel) => { if (channel) channel.members = (channel.members || 0) + 1; return channel; });
    await logActivity(userPhone, 'join_channel', { channelId: channelId });
}

async function getUserChannels(userPhone) {
    const snapshot = await database.ref('channel_members').once('value');
    const userChannels = [];
    snapshot.forEach((channelChild) => { if (channelChild.child(userPhone).exists()) userChannels.push(channelChild.key); });
    const channels = [];
    for (const channelId of userChannels) {
        const channelSnapshot = await database.ref('channels/' + channelId).once('value');
        if (channelSnapshot.exists()) channels.push({ id: channelId, ...channelSnapshot.val() });
    }
    return channels;
}

async function updateChannelInfo(channelId, updates) {
    await database.ref('channels/' + channelId).update(updates);
    await logActivity('system', 'update_channel', { channelId: channelId, updates: Object.keys(updates) });
}

async function getChannelById(channelId) {
    const snapshot = await database.ref('channels/' + channelId).once('value');
    return snapshot.val();
}

// ========== CHANNEL MESSAGES ==========
async function sendChannelMessage(channelId, senderPhone, message, type = 'text', mediaUrl = null) {
    const messageRef = database.ref('channel_messages/' + channelId).push();
    const userData = await getUserByPhone(senderPhone);
    const messageData = {
        id: messageRef.key,
        sender: senderPhone,
        senderName: userData?.name || 'User',
        message: message,
        type: type,
        mediaUrl: mediaUrl,
        timestamp: new Date().toISOString(),
        reactions: {},
        replies: [],
        isPinned: false
    };
    await messageRef.set(messageData);
    await logActivity(senderPhone, 'send_channel_message', { channelId: channelId });
    return messageData;
}

async function getChannelMessages(channelId, limit = 50) {
    const snapshot = await database.ref('channel_messages/' + channelId).orderByKey().limitToLast(limit).once('value');
    const messages = [];
    snapshot.forEach((child) => { messages.push({ id: child.key, ...child.val() }); });
    return messages.reverse();
}

function listenChannelMessages(channelId, callback) {
    const messagesRef = database.ref('channel_messages/' + channelId).limitToLast(50);
    messagesRef.on('child_added', (snapshot) => callback(snapshot.key, snapshot.val()));
    return () => messagesRef.off();
}

// ========== ACTIVITY LOGS ==========
async function logActivity(userPhone, activity, details = {}) {
    const logRef = database.ref('logs/' + userPhone).push();
    await logRef.set({ timestamp: new Date().toISOString(), activity: activity, details: details, platform: 'web' });
}

async function getUserActivities(userPhone, limit = 20) {
    const snapshot = await database.ref('logs/' + userPhone).orderByKey().limitToLast(limit).once('value');
    const activities = [];
    snapshot.forEach((child) => { activities.push({ id: child.key, ...child.val() }); });
    return activities.reverse();
}

// ========== PROMOTE ==========
async function createPromotion(userPhone, channelId, duration = 7) {
    const promoRef = database.ref('promotions').push();
    const promoData = {
        id: promoRef.key,
        channelId: channelId,
        createdBy: userPhone,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
        views: 0,
        active: true
    };
    await promoRef.set(promoData);
    await logActivity(userPhone, 'create_promotion', { channelId: channelId });
    return promoData;
}

async function addPromoteView(promoteId) {
    await database.ref('promotions/' + promoteId + '/views').transaction((current) => (current || 0) + 1);
}

async function getActivePromotions() {
    const snapshot = await database.ref('promotions').once('value');
    const promotions = [];
    snapshot.forEach((child) => {
        const promo = child.val();
        if (promo.active && new Date(promo.expiresAt) > new Date()) promotions.push({ id: child.key, ...promo });
    });
    return promotions;
}

// ========== TYPING INDICATOR ==========
async function setTypingStatus(userPhone, otherPhone, isTyping) {
    const typingRef = database.ref('typing/' + getRoomId(userPhone, otherPhone) + '/' + userPhone);
    if (isTyping) {
        await typingRef.set({ status: true, timestamp: new Date().toISOString() });
        setTimeout(async () => { await typingRef.remove(); }, 3000);
    } else {
        await typingRef.remove();
    }
}

function listenTyping(userPhone, otherPhone, callback) {
    const typingRef = database.ref('typing/' + getRoomId(userPhone, otherPhone) + '/' + otherPhone);
    typingRef.on('value', (snapshot) => callback(snapshot.exists() && snapshot.val().status === true));
    return () => typingRef.off();
}

async function markAllMessagesAsRead(userPhone, otherPhone) {
    const roomId = getRoomId(userPhone, otherPhone);
    const snapshot = await database.ref('messages/' + roomId).orderByChild('receiver').equalTo(userPhone).once('value');
    const updates = {};
    snapshot.forEach((child) => { if (!child.val().read) updates[child.key + '/read'] = true; });
    if (Object.keys(updates).length > 0) await database.ref('messages/' + roomId).update(updates);
}

// ========== EXPORT ALL FUNCTIONS ==========
window.FirebaseAPI = {
    isUserRegistered,
    registerUser,
    loginUser,
    updateUserStatus,
    getAllUsers,
    getUserByPhone,
    addContact,
    removeContact,
    getContacts,
    sendMessage,
    getChats,
    getMessages,
    listenMessages,
    listenUserStatus,
    getRoomId,
    markAllMessagesAsRead,
    updateUserName,
    updateUserAvatar,
    getUserAvatar,
    createChannel,
    getChannels,
    joinChannel,
    getUserChannels,
    updateChannelInfo,
    getChannelById,
    sendChannelMessage,
    getChannelMessages,
    listenChannelMessages,
    logActivity,
    getUserActivities,
    createPromotion,
    addPromoteView,
    getActivePromotions,
    setTypingStatus,
    listenTyping
};

console.log('🔥 Firebase API siap!', Object.keys(window.FirebaseAPI).length, 'fungsi terdaftar');