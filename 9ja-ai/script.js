const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = " https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = []; // THE FIX: Stores memory for the session

// --- 1. INITIALIZATION ---
async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = "auth.html"; return; }

    // Set User metadata Profile Picture if it exists
    if (user.user_metadata.avatar_url) {
        document.getElementById('userImg').src = user.user_metadata.avatar_url;
    }
    
    // Load the sidebar history on startup
    loadSidebarHistory(); 
}
init();

// 2. Feature Variables
const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'), // Spinner & "Thinking" text
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    sidebar: document.getElementById('sidebar'),
    pfp: document.getElementById('userImg')
};

// --- 3. LAYOUT & BUTTONS ---
ui.input.addEventListener('input', () => {
    const typing = ui.input.value.trim() !== "";
    ui.voice.style.display = typing ? "none" : "flex";
    ui.send.style.display = typing ? "flex" : "none";
});

document.getElementById('menuBtn').onclick = () => ui.sidebar.classList.add('active');
document.getElementById('closeSidebar').onclick = () => ui.sidebar.classList.remove('active');
document.getElementById('newChatBtn').onclick = () => window.location.reload();
document.getElementById('signOutBtn').onclick = async () => {
    await sb.auth.signOut();
    window.location.href = "auth.html";
};

// --- 4. PROFILE PICTURE LOGIC ---
document.getElementById('profilePictureUpload').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    ui.pfp.src = "uploading.gif"; 

    try {
        const { data: { user } } = await sb.auth.getUser();
        const filePath = `avatars/${user.id}-${Date.now()}.png`;

        const { error: uploadError } = await sb.storage.from('avatars').upload(filePath, file);
        if (uploadError) throw new Error("Upload fail.");

        const { data: publicUrlData } = sb.storage.from('avatars').getPublicUrl(filePath);
        const newAvatarUrl = publicUrlData.publicUrl;

        await sb.auth.updateUser({ data: { avatar_url: newAvatarUrl } });
        ui.pfp.src = newAvatarUrl;

    } catch (e) {
        ui.pfp.src = "default-avatar.png";
        alert("Photo upload fail. Try again later.");
    }
};

// --- 5. THE BRAIN: SENDING MESSAGES WITH MEMORY ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    // 1. Update UI and Local Memory
    appendBubble('user', text);
    chatHistory.push({ role: "user", content: text });
    ui.input.value = "";
    ui.voice.style.display = "flex";
    ui.send.style.display = "none";

    // 2. ACTIVATE THINKING SPINNER
    ui.think.style.display = 'flex';
    ui.think.scrollIntoView();

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        // THE FIX: Send 'messages' array for history/memory
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: chatHistory, 
                user_id: user.id 
            })
        });

        const data = await response.json();
        
        // 3. DEACTIVATE SPINNER
        ui.think.style.display = 'none';

        // 4. Save AI response to memory
        chatHistory.push({ role: "assistant", content: data.reply });
        
        // 5. Display with Gemini-style buttons
        appendAiBubble(data.reply);

    } catch (e) {
        ui.think.style.display = 'none';
        appendBubble('ai', "Backend wahala! Confirm your Render app dey active.");
    }
}
document.getElementById('sendBtn').onclick = sendMessage;

// --- 6. GEMINI-STYLE UI BUBBLES ---
function appendAiBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg-container';

    // THE FIX: Process code blocks and add "Copy" button
    let formattedText = text.replace(/```(\w+)?([\s\S]*?)```/g, (match, lang, code) => {
        return `
            <div class="code-container">
                <div class="code-header">
                    <span>${lang || 'code'}</span>
                    <button class="copy-code-btn" onclick="copyToClipboard(\`${code.trim()}\`)">Copy</button>
                </div>
                <pre><code>${code.trim()}</code></pre>
            </div>`;
    });

    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg-bubble';
    msgDiv.innerHTML = formattedText;

    // THE FIX: Adding Like, Dislike, Share, Copy buttons
    const actionDiv = document.createElement('div');
    actionDiv.className = 'ai-actions';
    actionDiv.innerHTML = `
        <i class="far fa-thumbs-up action-icon" title="Good response"></i>
        <i class="far fa-thumbs-down action-icon" title="Bad response"></i>
        <i class="far fa-share-square action-icon" onclick="shareGist(\`${text}\`)"></i>
        <i class="far fa-copy action-icon" onclick="copyToClipboard(\`${text}\`)"></i>
    `;

    wrapper.appendChild(msgDiv);
    wrapper.appendChild(actionDiv);
    ui.display.appendChild(wrapper);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// Basic bubble for User
function appendBubble(sender, msg) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    div.innerText = msg;
    ui.display.appendChild(div);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// --- 7. UTILITY FUNCTIONS ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Oga, e don copy!"); //
}

async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    
    // Fetch previous chats from Supabase 'chats' table
    const { data: chats } = await sb.from('chats')
        .select('title, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.querySelector('.feature-list');
    if (chats) {
        list.innerHTML = ""; // Clear existing list
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-comment-alt"></i> ${chat.title}`;
            li.onclick = () => loadSpecificChat(chat.id);
            list.appendChild(li);
        });
    }
}
