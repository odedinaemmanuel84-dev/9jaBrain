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
    activateTriggers(); 
}

// --- 2. ACTIVATION (Event Listeners) ---
function activateTriggers() {
    ui.send.onclick = (e) => {
        e.preventDefault();
        sendMessage();
    };

    ui.input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    ui.input.oninput = () => {
        const hasText = ui.input.value.trim() !== "";
        ui.voice.style.display = hasText ? "none" : "flex";
        ui.send.style.display = hasText ? "flex" : "none";
    };

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

    // 1. Show User Message with Edit Pencil
    appendBubble('user', text);
    chatHistory.push({ role: "user", content: text });
    
    // Reset Input
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";

    // 2. GEMINI STYLE SPINNER: Move thinking indicator to the bottom of display
    ui.display.appendChild(ui.think); 
    ui.think.style.display = 'flex';
    ui.think.scrollIntoView({ behavior: 'smooth' });

    // 3. Setup Timeout/Abort
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({ 
                messages: chatHistory, 
                user_id: user.id 
            })
        });

        clearTimeout(timeoutId);
        const data = await response.json();
        
        // 4. Hide Spinner and Show AI Response
        ui.think.style.display = 'none';
        chatHistory.push({ role: "assistant", content: data.reply });
        appendAiBubble(data.reply);

        // 5. Update Sidebar History
        saveAndRefreshHistory(text, user.id);

    } catch (e) {
        ui.think.style.display = 'none';
        if (e.name === 'AbortError') {
            appendAiBubble("Omo, the server dey take too long. Try again small-small.");
        } else {
            appendAiBubble("Omo, network wahala! Confirm your Render backend dey active.");
        }
    }
}

// --- 4. BUBBLE LOGIC (User & AI) ---

// User Bubble with Edit Pencil
function appendBubble(sender, msg) {
    const container = document.createElement('div');
    container.className = sender === 'user' ? 'user-msg-container' : 'ai-msg-container';

    const div = document.createElement('div');
    div.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    div.innerText = msg;
    container.appendChild(div);

    if (sender === 'user') {
        const editIcon = document.createElement('div');
        editIcon.className = 'edit-btn';
        editIcon.style.cursor = "pointer";
        editIcon.style.fontSize = "12px";
        editIcon.style.color = "#888";
        editIcon.innerHTML = '<i class="fas fa-pencil-alt"></i> Edit';
        editIcon.onclick = () => {
            const newText = prompt("Update your message:", msg);
            if (newText && newText !== msg) {
                div.innerText = newText;
                alert("Message updated! Resend to get a new response.");
            }
        };
        container.appendChild(editIcon);
    }

    ui.display.appendChild(container);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// AI Bubble with Code Handling
function appendAiBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg-container';

    const codeRegex = /```(html|css|js|javascript|python)?([\s\S]*?)
```/g;
    let formattedText = text.replace(codeRegex, (match, lang, code) => {
        const languageName = lang || 'code';
        const escapedCode = code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

// --- 5. SIDEBAR & UTILITIES ---

async function saveAndRefreshHistory(title, userId) {
    await sb.from('chats').insert([{ title: title, user_id: userId }]);
    loadSidebarHistory(); 
}

async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    const { data: chats } = await sb.from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.querySelector('.feature-list');
    if (chats && list) {
        list.innerHTML = ""; // Clear list before reloading
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.style.cursor = "pointer";
            li.innerHTML = `<i class="far fa-comment"></i> ${chat.title.substring(0, 25)}...`;
            list.appendChild(li);
        });
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Oga Emmanuel, e don copy!"); 
}

init();
