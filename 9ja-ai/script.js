// --- DYNAMIC CONFIGURATION ---
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
    think: document.getElementById('thinkingIndicator'), // Spinner & "Thinking" text wrapper
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    pfp: document.getElementById('userImg'),
    sidebar: document.getElementById('sidebar')
};

// --- 1. INITIALIZATION (Safe Version) ---
async function init() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        
        if (!user) { 
            window.location.href = "auth.html"; 
            return; 
        }

        if (user.user_metadata?.avatar_url) {
            ui.pfp.src = user.user_metadata.avatar_url;
        }
        
        loadSidebarHistory();
    } catch (err) {
        console.error("Initialization failed, but I will still activate buttons:", err);
    }

    // THE FIX: Move these OUTSIDE the try/catch or at the bottom 
    // to ensure they run even if Supabase is slow.
    activateButtons(); 
}

function activateButtons() {
    // Check if ui.send exists before assigning
    if (ui.send) {
        ui.send.onclick = (e) => {
            e.preventDefault();
            sendMessage();
        };
    }

    if (ui.input) {
        ui.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// Start the app
init();

// --- 2. LAYOUT & UI EVENT LISTENERS ---
ui.input.addEventListener('input', () => {
    const typing = ui.input.value.trim() !== "";
    ui.voice.style.display = typing ? "none" : "flex";
    ui.send.style.display = typing ? "flex" : "none";
});

// Menu Toggle
document.getElementById('menuBtn').onclick = () => ui.sidebar.classList.add('active');
document.getElementById('closeSidebar').onclick = () => ui.sidebar.classList.remove('active');

// Sign Out
document.getElementById('signOutBtn').onclick = async () => {
    await sb.auth.signOut();
    window.location.href = "auth.html";
};

// --- 3. PROFILE PICTURE UPLOAD LOGIC ---
document.getElementById('profilePictureUpload').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    ui.pfp.src = "uploading.gif"; // Placeholder while uploading

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

// --- 4. THE BRAIN: SENDING MESSAGES WITH MEMORY & SPINNER ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    // 1. Show User Message
    appendBubble('user', text);
    chatHistory.push({ role: "user", content: text });
    
    // Reset Input
    ui.input.value = "";
    ui.voice.style.display = "flex";
    ui.send.style.display = "none";

    // 2. ACTIVATE SPINNER IMMEDIATELY
    ui.think.style.display = 'flex';
    ui.think.scrollIntoView({ behavior: 'smooth', block: 'end' });

    try {
        const { data: { user } } = await sb.auth.getUser();
        
        // Call Backend (Render)
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
        
        // 5. Display AI Bubble with formatting
        appendAiBubble(data.reply);

    } catch (e) {
        ui.think.style.display = 'none';
        appendAiBubble("Backend wahala! Omo, I get small headache. Confirm your Render app dey active.");
    }
}

// Button and Keyboard Triggers
ui.send.onclick = sendMessage;
ui.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- 5. MASTERING THE AI BUBBLE (CODE & ACTIONS) ---
function appendAiBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg-container';

    // 1. REGEX FIX: This identifies code blocks more strictly
    const codeRegex = /```(html|css|js|javascript|python)?([\s\S]*?)```/g;
    
    let formattedText = text.replace(codeRegex, (match, lang, code) => {
        const languageName = lang || 'code';
        
        // 2. HTML ESCAPING: This prevents the "Invisible HTML" problem
        const escapedCode = code.trim()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // 3. THE FIX: Returning the proper structure with the Header and Copy button
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

    // Feedback/Action Icons at the bottom of the bubble
    const actionDiv = document.createElement('div');
    actionDiv.className = 'ai-actions';
    actionDiv.innerHTML = `
        <i class="far fa-thumbs-up action-icon" title="E make sense"></i>
        <i class="far fa-thumbs-down action-icon" title="E no follow"></i>
        <i class="far fa-copy action-icon" onclick="copyToClipboard(\`${text.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)" title="Copy Full Gist"></i>
    `;

    wrapper.appendChild(msgDiv);
    wrapper.appendChild(actionDiv);
    ui.display.appendChild(wrapper);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// --- 6. UTILITY FUNCTIONS ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Oga Emmanuel, e don copy!"); 
}

// Sidebar History Loader
async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    
    const { data: chats } = await sb.from('chats')
        .select('title, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.querySelector('.feature-list');
    if (chats && list) {
        list.innerHTML = ""; 
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-comment-alt"></i> ${chat.title}`;
            li.onclick = () => alert("Logic to load chat " + chat.id + " coming soon!");
            list.appendChild(li);
        });
    }
}
