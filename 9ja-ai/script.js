// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Conversation Memory for Session
let chatHistory = []; 

// Feature Variables for UI
const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    pfp: document.getElementById('userImg'),
    sidebar: document.getElementById('sidebar')
};

// --- 1. INITIALIZATION ---
async function init() {
    console.log("App starting...");
    try {
        const { data: { user }, error } = await sb.auth.getUser();
        
        if (error || !user) { 
            console.log("No user found, redirecting to auth...");
            window.location.href = "auth.html"; 
            return; 
        }

        if (user.user_metadata?.avatar_url) {
            ui.pfp.src = user.user_metadata.avatar_url;
        }
        
        loadSidebarHistory();
    } catch (err) {
        console.error("Initialization failed:", err);
    }

    // Always activate buttons to ensure the UI works
    activateTriggers(); 
}

// --- 2. ACTIVATION (The Fix for the Send Button) ---
function activateTriggers() {
    console.log("Activating buttons...");

    // Send Button Click
    ui.send.onclick = (e) => {
        e.preventDefault();
        console.log("Send clicked!");
        sendMessage();
    };

    // Enter Key Press
    ui.input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    // Toggle Send/Speak Icons while typing
    ui.input.oninput = () => {
        const hasText = ui.input.value.trim() !== "";
        ui.voice.style.display = hasText ? "none" : "flex";
        ui.send.style.display = hasText ? "flex" : "none";
    };

    // Sidebar Controls
    document.getElementById('menuBtn').onclick = () => ui.sidebar.classList.add('active');
    document.getElementById('closeSidebar').onclick = () => ui.sidebar.classList.remove('active');
    document.getElementById('signOutBtn').onclick = async () => {
        await sb.auth.signOut();
        window.location.href = "auth.html";
    };
}

// --- 3. THE BRAIN: SENDING MESSAGES ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    console.log("Sending message:", text);
    
    // 1. Show User Message
    appendBubble('user', text);
    chatHistory.push({ role: "user", content: text });
    
    // Reset UI
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";

    // 2. ACTIVATE THINKING SPINNER
    ui.think.style.display = 'flex';
    ui.think.scrollIntoView({ behavior: 'smooth', block: 'end' });

    try {
        const { data: { user } } = await sb.auth.getUser();
        
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

        // 4. Save & Display AI response
        chatHistory.push({ role: "assistant", content: data.reply });
        appendAiBubble(data.reply);

    } catch (e) {
        console.error("Chat Error:", e);
        ui.think.style.display = 'none';
        appendAiBubble("Omo, network wahala! Confirm your Render backend dey active.");
    }
}

// --- 4. MASTERING THE AI BUBBLE (CODE & ACTIONS) ---
function appendAiBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg-container';

    // Strictly identify code blocks
    const codeRegex = /```(html|css|js|javascript|python)?([\s\S]*?)```/g;
    
    let formattedText = text.replace(codeRegex, (match, lang, code) => {
        const languageName = lang || 'code';
        
        // Escape HTML so it doesn't disappear in the bubble
        const escapedCode = code.trim()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        return `
            <div class="code-container">
                <div class="code-header">
                    <span>${languageName.toUpperCase()}</span>
                    <button class="copy-code-btn" onclick="copyToClipboard(\`${code.trim().replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
                        <i class="far fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code>${escapedCode}</code></pre>
            </div>`;
    });

    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg-bubble';
    msgDiv.innerHTML = formattedText;

    // AI Action Icons
    const actionDiv = document.createElement('div');
    actionDiv.className = 'ai-actions';
    actionDiv.innerHTML = `
        <i class="far fa-thumbs-up action-icon"></i>
        <i class="far fa-thumbs-down action-icon"></i>
        <i class="far fa-copy action-icon" onclick="copyToClipboard(\`${text.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)"></i>
    `;

    wrapper.appendChild(msgDiv);
    wrapper.appendChild(actionDiv);
    ui.display.appendChild(wrapper);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// Simple User Bubble
function appendBubble(sender, msg) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    div.innerText = msg;
    ui.display.appendChild(div);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// --- 5. UTILITY FUNCTIONS ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Oga Emmanuel, e don copy!"); 
}

async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    const { data: chats } = await sb.from('chats')
        .select('title, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.querySelector('.feature-list');
    if (chats && list) {
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-comment-alt"></i> ${chat.title}`;
            list.appendChild(li);
        });
    }
}

// Start the app
init();
