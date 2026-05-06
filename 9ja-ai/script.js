// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = []; 
let currentlyEditingId = null; 
let selectedImageBase64 = null; // To store image data
let selectedImageMime = null;   // To store image type

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
    fileInput: document.getElementById('imageUpload') // Assuming this is your ID in HTML
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

// --- 2. ACTIVATION ---
function activateTriggers() {
    // Logout Logic
    if (ui.logout) {
        ui.logout.onclick = async (e) => {
            e.preventDefault();
            await sb.auth.signOut();
            window.location.href = "auth.html";
        };
    }

    // Send Message Button
    ui.send.onclick = (e) => { 
        e.preventDefault(); 
        sendMessage(); 
    };

    // Enter Key Logic
    ui.input.onkeydown = (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            sendMessage(); 
        } 
    };
    
    // Icon Toggle (Voice vs Send)
    ui.input.oninput = () => {
        const hasText = ui.input.value.trim() !== "";
        ui.voice.style.display = hasText ? "none" : "flex";
        ui.send.style.display = hasText ? "flex" : "none";
    };

    // Sidebar Open/Close
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    if (menuBtn) menuBtn.onclick = () => ui.sidebar.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => ui.sidebar.classList.remove('active');

    // --- UPDATED IMAGE UPLOAD LOGIC ---
if (ui.fileInput) {
    ui.fileInput.onchange = (e) => {
        const file = e.target.files[0];
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImage = document.getElementById('imagePreview');
        const removeBtn = document.getElementById('removeImgBtn');

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Store data for Gemini
                selectedImageBase64 = event.target.result.split(',')[1];
                selectedImageMime = file.type;

                // Show the image on the screen
                if (previewImage && previewContainer) {
                    previewImage.src = event.target.result;
                    previewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

// Logic for the "X" button to remove the photo before sending
const removeBtn = document.getElementById('removeImgBtn');
if (removeBtn) {
    removeBtn.onclick = () => {
        selectedImageBase64 = null;
        selectedImageMime = null;
        ui.fileInput.value = "";
        document.getElementById('imagePreviewContainer').style.display = 'none';
    };
}

// --- 3. SUGGESTION LOGIC ---
function useSuggestion(text) {
    ui.input.value = text;
    ui.voice.style.display = "none";
    ui.send.style.display = "flex";
    sendMessage();
}

// --- 4. THE BRAIN (SEND, EDIT, & VISION LOGIC) ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text && !selectedImageBase64) return;

    if (ui.welcome) ui.welcome.style.display = 'none';

    if (currentlyEditingId) {
        const userWrapper = document.getElementById(currentlyEditingId);
        userWrapper.querySelector('.user-msg-bubble').innerText = text;
        
        let nextElement = userWrapper.nextElementSibling;
        while (nextElement) {
            let toDelete = nextElement;
            nextElement = nextElement.nextElementSibling;
            if (toDelete === ui.think) {
                toDelete.style.display = 'none';
            } else {
                toDelete.remove();
            }
        }

        const index = chatHistory.findIndex(m => m.id === currentlyEditingId);
        if (index !== -1) {
            chatHistory[index].content = text;
            chatHistory = chatHistory.slice(0, index + 1); 
        }
        currentlyEditingId = null;
        ui.send.innerHTML = '<i class="fas fa-arrow-up"></i>';
    } else {
        const msgId = 'msg-' + Date.now();
        
        // Handle User Display Content (Text + Image if exists)
        let displayHTML = text;
        if (selectedImageBase64) {
            displayHTML = `<img src="data:${selectedImageMime};base64,${selectedImageBase64}" style="max-width:200px; border-radius:10px; display:block; margin-bottom:8px;"> ${text}`;
        }
        
        appendBubble('user', displayHTML, msgId);

        // Add to history with Gemini Vision Support
        const messageParts = [{ text: text || "What is in this image?" }];
        if (selectedImageBase64) {
            messageParts.push({
                inlineData: {
                    mimeType: selectedImageMime,
                    data: selectedImageBase64
                }
            });
        }
        
        chatHistory.push({ role: "user", parts: messageParts, id: msgId });
    }

    // Reset UI
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";
    
    ui.display.appendChild(ui.think); 
    ui.think.style.display = 'flex';
    ui.display.scrollTop = ui.display.scrollHeight;

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        // Prepare payload for Gemini (mapping parts correctly)
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

        // Clear image state after successful send
        selectedImageBase64 = null;
        selectedImageMime = null;
        if (ui.fileInput) ui.fileInput.value = "";

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
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function copyCode(button) {
    const code = button.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.color = "var(--accent)";
        setTimeout(() => {
            button.innerHTML = '<i class="far fa-copy"></i> Copy';
            button.style.color = "";
        }, 2000);
    });
}

function appendBubble(sender, msg, id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'user-msg-container';
    wrapper.id = id;
    wrapper.innerHTML = `
        <div class="user-msg-bubble">${msg}</div>
        <div class="edit-btn" onclick="startEditing('${id}')">
            <i class="fas fa-pen" style="font-size: 12px;"></i>
        </div>
    `;
    ui.display.appendChild(wrapper);
}

function startEditing(id) {
    const wrapper = document.getElementById(id);
    const oldText = wrapper.querySelector('.user-msg-bubble').innerText;
    ui.input.value = oldText;
    ui.input.focus();
    currentlyEditingId = id;
    ui.send.innerHTML = '<i class="fas fa-check"></i>'; 
    ui.send.style.display = "flex";
    ui.voice.style.display = "none";
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

// --- 6. UTILS ---
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
