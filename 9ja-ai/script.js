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
        if (ui.userName) ui.userName.innerText = name.split(' ');

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

    if (ui.send) {
        ui.send.onclick = (e) => { e.preventDefault(); sendMessage(); };
    }

    if (ui.input) {
        ui.input.onkeydown = (e) => { 
            if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } 
        };
        ui.input.oninput = toggleButtons;
    }

    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    if (menuBtn) menuBtn.onclick = () => ui.sidebar.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => ui.sidebar.classList.remove('active');

    // --- FORCE-INJECT IMAGE PICKER LOGIC ---
    if (ui.fileInput) {
        ui.fileInput.onchange = (e) => {
            const file = e.target.files; // FIXED: Grabbing the specific single file item instead of the collection array!
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    selectedImageBase64 = dataUrl.split(','); // FIXED: targeting array segment to get pure Base64 content!
                    selectedImageMime = file.type; // FIXED: file now references the individual blob variable correctly!
                    
                    const previewImgEl = document.getElementById('imagePreview');
                    const previewContainerEl = document.getElementById('imagePreviewContainer');
                    const expandingContainer = document.getElementById('expandingContainer');
                    
                    if (previewImgEl && previewContainerEl) {
                        // 1. Assign the image data source
                        previewImgEl.src = dataUrl;
                        
                        // 2. FORCE the layouts to be visible using inline styles to override CSS bugs
                        previewContainerEl.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 60px !important; width: 100% !important;";
                        previewImgEl.style.cssText = "display: block !important; visibility: visible !important; width: 60px !important; height: 60px !important; object-fit: cover !important; border-radius: 8px !important; border: 2px solid #fff !important;";
                        
                        // 3. FORCE the entire input container bar to break out of any fixed height limit
                        if (expandingContainer) {
                            expandingContainer.style.cssText = "height: auto !important; min-height: 120px !important; display: flex !important; flex-direction: column !important; overflow: visible !important;";
                        }
                    } else {
                        alert("Oga, JavaScript cannot find #imagePreview or #imagePreviewContainer in your HTML file!");
                    }
                    
                    toggleButtons();
                };

                reader.readAsDataURL(file); // FIXED: Passing the single file object block safely so FileReader works!
            }
        };
    }

    if (ui.removeImg) {
        ui.removeImg.onclick = () => {
            selectedImageBase64 = null;
            selectedImageMime = null;
            if (ui.fileInput) ui.fileInput.value = "";
            
            const previewContainerEl = document.getElementById('imagePreviewContainer');
            const previewImgEl = document.getElementById('imagePreview');
            const expandingContainer = document.getElementById('expandingContainer');
            
            if (previewContainerEl) previewContainerEl.style.setProperty('display', 'none', 'important');
            if (previewImgEl) previewImgEl.src = "";
            if (expandingContainer) expandingContainer.style.cssText = ""; // Reset expanding container layout wrapper
            
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

    // --- DATE LOGIC ---
    const now = new Date();
    const dateString = now.toLocaleString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const textWithDate = `[Current Date: ${dateString}] ${text}`;

    if (ui.welcome) ui.welcome.style.display = 'none';

    if (currentlyEditingId) {
        const userWrapper = document.getElementById(currentlyEditingId);
        
        let newContent = "";
        if (selectedImageBase64) {
            newContent = `
                <div class="msg-image-container">
                    <img src="data:${selectedImageMime};base64,${selectedImageBase64}">
                </div>
                <div class="msg-text">${text}</div>
            `;
        } else {
            newContent = `<div class="msg-text">${text}</div>`;
        }

        userWrapper.querySelector('.user-msg-bubble').innerHTML = newContent;
        
        while (userWrapper.nextElementSibling) userWrapper.nextElementSibling.remove();
        
        const histIndex = chatHistory.findIndex(m => m.id === currentlyEditingId);
        if (histIndex !== -1) {
            let messageParts = [];
            messageParts.push({ text: textWithDate });
            if (selectedImageBase64) {
                messageParts.push({ inlineData: { mimeType: selectedImageMime, data: selectedImageBase64 } });
            }
            chatHistory[histIndex].parts = messageParts;
            chatHistory = chatHistory.slice(0, histIndex + 1);
        }
        
        ui.display.appendChild(ui.think);
        ui.think.style.display = 'flex';
        currentlyEditingId = null;
        if (ui.send) ui.send.innerHTML = '<i class="fas fa-arrow-up"></i>';

    } else {
        const msgId = 'msg-' + Date.now();
        let displayHTML = "";

        if (selectedImageBase64) {
            displayHTML = `
                <div class="msg-image-container">
                    <img src="data:${selectedImageMime};base64,${selectedImageBase64}">
                </div>
                <div class="msg-text">${text}</div>
            `;
        } else {
            displayHTML = `<div class="msg-text">${text}</div>`;
        }

        appendBubble('user', displayHTML, msgId);
        
        let messageParts = [];
        messageParts.push({ text: textWithDate });
        if (selectedImageBase64) {
            messageParts.push({ 
                inlineData: { 
                    mimeType: selectedImageMime, 
                    data: selectedImageBase64 
                } 
            });
        }
        chatHistory.push({ role: "user", parts: messageParts, id: msgId });

        ui.display.appendChild(ui.think); 
        ui.think.style.display = 'flex';
    }

    // Capture image variables locally before resetting them for the UI box
    const currentImageBase64 = selectedImageBase64;
    const currentImageMime = selectedImageMime;

    // Reset UI Inputs
    ui.input.value = "";
    selectedImageBase64 = null;
    selectedImageMime = null;
    if (ui.fileInput) ui.fileInput.value = "";
    if (ui.previewContainer) ui.previewContainer.style.display = 'none';
    const expandingContainer = document.getElementById('expandingContainer');
    if (expandingContainer) expandingContainer.style.cssText = ""; // Reset expansion box frame height natively
    
    toggleButtons();
    ui.display.scrollTop = ui.display.scrollHeight;

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        const payload = {
            messages: chatHistory.map(msg => {
                return {
                    role: msg.role,
                    parts: msg.parts.map(part => {
                        if (part.inlineData) {
                            return {
                                inlineData: {
                                    mimeType: part.inlineData.mimeType,
                                    data: part.inlineData.data
                                }
                            };
                        }
                        return { text: part.text };
                    })
                };
            }),
            user_id: user.id
        };

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        ui.think.style.display = 'none';

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server status: ${response.status}`);
        }

        const data = await response.json();
        if (data.reply) {
            chatHistory.push({ role: "assistant", parts: [{ text: data.reply }] });
            appendAiBubble(data.reply);
        } else {
            appendAiBubble("Omo, Naija AI is speechless. Try refreshing?");
        }
    } catch (e) {
        console.error("Fetch Error:", e);
        ui.think.style.display = 'none';
        if (e.message.includes("Failed to fetch")) {
            appendAiBubble("Omo, Render is still waking up the server. Give it 30 seconds and try again!");
        } else {
            appendAiBubble(`Error: ${e.message}. Check your Render logs, Oga.`);
        }
    }
}
        
// --- 5. UI BUBBLES & FORMATTING ---
function formatAIResponse(text) {
    if (!text) return "";
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

function appendBubble(sender, content, id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'user-msg-container';
    wrapper.id = id;
    
    const formattedContent = content.includes('msg-text') ? content : `<div class="msg-text">${content}</div>`;
    
    wrapper.innerHTML = `
        <div class="user-msg-bubble">${formattedContent}</div>
        <div class="edit-btn" onclick="startEditing('${id}')">
            <i class="fas fa-pen"></i>
        </div>
    `;
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

function startEditing(id) {
    currentlyEditingId = id;
    const container = document.getElementById(id);
    const textDiv = container.querySelector('.msg-text');
    
    ui.input.value = textDiv ? textDiv.innerText : container.querySelector('.user-msg-bubble').innerText;
    
    ui.input.focus();
    if (ui.send) {
        ui.send.innerHTML = '<i class="fas fa-check"></i>';
    }
    toggleButtons();
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
