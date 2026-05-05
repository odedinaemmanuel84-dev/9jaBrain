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

// --- 2. ACTIVATION ---
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

// --- 3. SENDING MESSAGES ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;
    
    appendBubble('user', text);
    chatHistory.push({ role: "user", content: text });
    
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";

    ui.think.style.display = 'flex';
    ui.display.scrollTop = ui.display.scrollHeight;

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
        
        ui.think.style.display = 'none';
        chatHistory.push({ role: "assistant", content: data.reply });
        appendAiBubble(data.reply);

    } catch (e) {
        ui.think.style.display = 'none';
        if (e.name === 'AbortError') {
            appendAiBubble("Omo, the server dey take too long. Try again.");
        } else {
            appendAiBubble("Omo, network wahala! Check your backend.");
        }
    }
}

// --- UPDATED USER BUBBLE ---
function appendBubble(sender, msg) {
    if (sender === 'user') {
        const wrapper = document.createElement('div');
        wrapper.className = 'user-msg-container';

        // We use a unique ID so we can find this specific bubble later to change it
        const bubbleId = 'msg-' + Date.now();
        wrapper.id = bubbleId;

        wrapper.innerHTML = `
            <div class="user-msg-bubble">${msg}</div>
            <div class="edit-btn" onclick="startEditing('${bubbleId}')">
                <i class="fas fa-pen" style="font-size: 12px;"></i>
            </div>
        `;
        ui.display.appendChild(wrapper);
    } else {
        const div = document.createElement('div');
        div.className = 'ai-msg-bubble';
        div.innerText = msg;
        ui.display.appendChild(div);
    }
    ui.display.scrollTop = ui.display.scrollHeight;
}

// --- NEW EDITING LOGIC ---
let currentlyEditingId = null;

function startEditing(id) {
    const wrapper = document.getElementById(id);
    const oldText = wrapper.querySelector('.user-msg-bubble').innerText;
    
    // Put text in input and focus
    ui.input.value = oldText;
    ui.input.focus();
    
    // Remember which bubble we are changing
    currentlyEditingId = id;
    
    // Change Send Icon to a "Checkmark" or Update icon if you want
    ui.send.innerHTML = '<i class="fas fa-check"></i>'; 
}

// Update the sendMessage function to handle the "Update"
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    if (currentlyEditingId) {
        // --- CASE: UPDATING EXISTING MESSAGE ---
        const wrapper = document.getElementById(currentlyEditingId);
        wrapper.querySelector('.user-msg-bubble').innerText = text;
        
        // Update chat history memory too
        const index = Array.from(ui.display.children).indexOf(wrapper);
        if(chatHistory[index]) chatHistory[index].content = text;

        // Reset editing state
        currentlyEditingId = null;
        ui.send.innerHTML = '<i class="fas fa-paper-plane"></i>'; // Reset icon
    } else {
        // --- CASE: NEW MESSAGE ---
        appendBubble('user', text);
        chatHistory.push({ role: "user", content: text });
    }
    
    // ... rest of your existing sendMessage code (the fetch part) ...
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";
    
    // Run the AI part again for the new/edited text
    processAiResponse(); 
}

// --- 5. UTILITY FUNCTIONS ---
function editLastMessage(oldText) {
    ui.input.value = oldText;
    ui.input.focus();
    // Optional: add visual feedback that user is editing
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Oga Emmanuel, e don copy!"); 
}

async function loadSidebarHistory() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    
    const { data: chats } = await sb.from('chats')
        .select('title, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.querySelector('.feature-list');
    if (chats && list) {
        list.innerHTML = ""; // Clear existing
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-comment-alt"></i> ${chat.title}`;
            list.appendChild(li);
        });
    }
}

init();
