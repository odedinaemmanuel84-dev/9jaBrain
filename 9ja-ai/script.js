const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = " https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- THE FIX: ACTIVATING ALL FEATURES ---
async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = "auth.html"; return; }

    // THE FIX: Set User metadata Profile Picture if it exists
    if (user.user_metadata.avatar_url) {
        document.getElementById('userImg').src = user.user_metadata.avatar_url;
    }
}
init();

// 1. Feature Variables
const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    sidebar: document.getElementById('sidebar'),
    pfp: document.getElementById('userImg')
};

// 2. Button & Layout Activated
ui.input.addEventListener('input', () => {
    const typing = ui.input.value.trim() !== "";
    ui.voice.style.display = typing ? "none" : "flex";
    ui.send.style.display = typing ? "flex" : "none";
});

// Activate SideMenu
document.getElementById('menuBtn').onclick = () => ui.sidebar.classList.add('active');
document.getElementById('closeSidebar').onclick = () => ui.sidebar.classList.remove('active');

// Activate New Chat
document.getElementById('newChatBtn').onclick = () => window.location.reload();

// Activate SignOut
document.getElementById('signOutBtn').onclick = async () => {
    await sb.auth.signOut();
    window.location.href = "auth.html";
};

// --- THE FIX: PROFILE PICTURE UPLOAD LOGIC ---
document.getElementById('profilePictureUpload').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Change UI state temporarily to show loading
    ui.pfp.src = "uploading.gif"; // Add a small gif or spinner here if you want

    try {
        const { data: userSession } = await sb.auth.getUser();
        const userId = userSession.user.id;
        const filePath = `avatars/${userId}-${Date.now()}.png`;

        // Upload to Supabase Storage Bucket 'avatars'
        const { error: uploadError } = await sb.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw new Error("Upload fail.");

        // Get Public URL
        const { data: publicUrlData } = sb.storage.from('avatars').getPublicUrl(filePath);
        const newAvatarUrl = publicUrlData.publicUrl;

        // Update User Metadata in Supabase Auth
        const { error: updateError } = await sb.auth.updateUser({
            data: { avatar_url: newAvatarUrl }
        });
        if (updateError) throw new Error("Update metadata fail.");

        // Update UI
        ui.pfp.src = newAvatarUrl;

    } catch (e) {
        ui.pfp.src = "default-avatar.png";
        alert("Photo upload fail. Try again later.");
    }
};

// --- THE FIX: ACTIVATING THINKING SPINNER IN SENDMSG ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    appendBubble('user', text);
    ui.input.value = "";
    ui.voice.style.display = "flex";
    ui.send.style.display = "none";

    // ACTIVATE SPINNER
    ui.think.style.display = 'flex';
    ui.think.scrollIntoView();

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        // THE FIX: Send the user_id so backend can read the 'funny' personality prompt properly
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text, user_id: user.id })
        });

        const data = await response.json();
        
        // DEACTIVATE SPINNER
        ui.think.style.display = 'none';
        appendBubble('ai', data.reply); // Now reads data.reply correctly

    } catch (e) {
        ui.think.style.display = 'none';
        appendBubble('ai', "Backend wahala! Confirm your Render app dey active.");
    }
}
document.getElementById('sendBtn').onclick = sendMessage;

function appendBubble(sender, msg) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    div.innerText = msg;
    ui.display.appendChild(div);
    ui.display.scrollTop = ui.display.scrollHeight;
}
