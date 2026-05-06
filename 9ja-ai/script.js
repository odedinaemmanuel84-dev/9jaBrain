// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = []; 
let currentlyEditingId = null; 
let selectedImageBase64 = null; 
let selectedImageMime = null;   

const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    pfp: document.getElementById('userImg'),
    sidebar: document.getElementById('sidebar'),
    logout: document.getElementById('logoutBtn'),
    welcome: document.getElementById('welcomeScreen'),
    userName: document.getElementById('userName'),
    fileInput: document.getElementById('imageUpload'),
    previewContainer: document.getElementById('imagePreviewContainer'),
    previewImg: document.getElementById('imagePreview'),
    removeImg: document.getElementById('removeImgBtn')
};

// --- 1. INITIALIZATION ---
async function init() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { window.location.href = "auth.html"; return; }
        
        if (user.user_metadata?.avatar_url) ui.pfp.src = user.user_metadata.avatar_url;
        const name = user.user_metadata?.full_name || "Oga";
        if (ui.userName) ui.userName.innerText = name.split(' ')[0];

        loadSidebarHistory();
    } catch (err) { console.error(err); }
    activateTriggers(); 
}

// --- 2. ACTIVATION & BUTTON LOGIC ---
function toggleButtons() {
    const hasText = ui.input.value.trim() !== "";
    const hasImage = selectedImageBase64 !== null;
    
    if (hasText || hasImage) {
        ui.voice.style.display = "none";
        ui.send.style.display = "flex";
    } else {
        ui.voice.style.display = "flex";
        ui.send.style.display = "none";
    }
}

function activateTriggers() {
    if (ui.logout) {
        ui.logout.onclick = async (e) => {
            e.preventDefault();
            await sb.auth.signOut();
            window.location.href = "auth.html";
        };
    }

    ui.send.onclick = (e) => { e.preventDefault(); sendMessage(); };

    ui.input.onkeydown = (e) => { 
        if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } 
    };
    
    // Toggle send/speak on typing
    ui.input.oninput = toggleButtons;

    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    if (menuBtn) menuBtn.onclick = () => ui.sidebar.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => ui.sidebar.classList.remove('active');

    // Image Upload Logic (Direct Preview, No Alerts)
    if (ui.fileInput) {
        ui.fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    selectedImageBase64 = event.target.result.split(',')[1];
                    selectedImageMime = file.type;
                    
                    // Show Preview UI
                    ui.previewImg.src = event.target.result;
                    ui.previewContainer.style.display = 'block';
                    toggleButtons(); // Show send button because image is present
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // Remove Image Logic
    if (ui.removeImg) {
        ui.removeImg.onclick = () => {
            selectedImageBase64 = null;
            selectedImageMime = null;
            ui.fileInput.value = "";
            ui.previewContainer.style.display = 'none';
            toggleButtons();
        };
    }
} 

// --- 3. SUGGESTION LOGIC ---
function useSuggestion(text) {
    ui.input.value = text;
    toggleButtons();
    sendMessage();
}

// --- 4. THE BRAIN ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text && !selectedImageBase64) return;

    if (ui.welcome) ui.welcome.style.display = 'none';

    if (currentlyEditingId) {
        // Edit logic (keeping it simple for now, usually doesn't include new images)
        const userWrapper = document.getElementById(currentlyEditingId);
        userWrapper.querySelector('.user-msg-bubble').innerText = text;
        currentlyEditingId = null;
        ui.send.innerHTML = '<i class="fas fa-arrow-up"></i>';
    } else {
        const msgId = 'msg-' + Date.now();
        
        // Display HTML in bubble
        let displayHTML = text;
        if (selectedImageBase64) {
            displayHTML = `<img src="data:${selectedImageMime};base64,${selectedImageBase64}" style="max-width:200px; border-radius:10px; display:block; margin-bottom:8px;"> ${text}`;
        }
        
        appendBubble('user', displayHTML, msgId);

        // Build Gemini Parts
        const messageParts = [];
        if (text) messageParts.push({ text: text });
        if (selectedImageBase64) {
            messageParts.push({
                inlineData: { mimeType: selectedImageMime, data: selectedImageBase64 }
            });
        }
        
        chatHistory.push({ role: "user", parts: messageParts, id: msgId });
    }

    // Reset UI State
    ui.input.value = "";
    selectedImageBase64 = null;
    selectedImageMime = null;
    if (ui.fileInput) ui.fileInput.value = "";
    ui.previewContainer.style.display = 'none';
    toggleButtons();
    
    ui.display.appendChild(ui.think); 
    ui.think.style.display = 'flex';
    ui.display.scrollTop = ui.display.scrollHeight;

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        const payload = {
            messages: chatHistory.map(msg => ({
                role: msg.role,
                parts: msg.parts ? msg.parts : [{ text: msg.content }]
            })),
            user_id: user.id
        };

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        ui.think.style.display = 'none';
        
        chatHistory.push({ role: "assistant", content: data.reply });
        appendAiBubble(data.reply);

    } catch (e) {
        ui.think.style.display = 'none';
        appendAiBubble("Omo, network wahala! Check your server.");
    }
}

// --- 5. UI BUBBLES & FORMATTING ---
function formatAIResponse(text) {
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    return text.replace(codeRegex, (match, lang, code) => {
        const language = lang || 'code';
        return `
            <div class="code-container">
                <div class="code-header">
                    <span>${language.toUpperCase()}</span>
                    <button class="copy-btn" onclick="copyCode(this)">
                        <i class="far fa-copy"></i> Copy
                    </button>
                </div>
                <pre><code>${escapeHtml(code.trim())}</code></pre>
            </div>
        `;
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function copyCode(button) {
    const code = button.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => { button.innerHTML = '<i class="far fa-copy"></i> Copy'; }, 2000);
    });
}

function appendBubble(sender, msg, id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'user-msg-container';
    wrapper.id = id;
    wrapper.innerHTML = `<div class="user-msg-bubble">${msg}</div><div class="edit-btn" onclick="startEditing('${id}')"><i class="fas fa-pen"></i></div>`;
    ui.display.appendChild(wrapper);
}

function appendAiBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg-container';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg-bubble';
    msgDiv.innerHTML = formatAIResponse(text); 
    wrapper.appendChild(msgDiv);
    ui.display.appendChild(wrapper);
    ui.display.scrollTop = ui.display.scrollHeight;
}

async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    if(!user) return;
    const { data: chats } = await sb.from('chats').select('title, id').eq('user_id', user.id).order('created_at', { ascending: false });
    const list = document.querySelector('.feature-list');
    if (chats && list) {
        list.innerHTML = "";
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-comment-alt"></i> ${chat.title}`;
            list.appendChild(li);
        });
    }
}

init();
