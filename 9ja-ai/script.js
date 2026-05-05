// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = []; 
let currentlyEditingId = null; 

const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    voice: document.getElementById('voiceBtn'),
    send: document.getElementById('sendBtn'),
    pfp: document.getElementById('userImg'),
    sidebar: document.getElementById('sidebar'),
    logout: document.getElementById('logoutBtn')
};

// --- 1. INITIALIZATION ---
async function init() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { window.location.href = "auth.html"; return; }
        if (user.user_metadata?.avatar_url) ui.pfp.src = user.user_metadata.avatar_url;
        loadSidebarHistory();
    } catch (err) { console.error(err); }
    activateTriggers(); 
}

// --- 2. ACTIVATION ---
function activateTriggers() {
    // 1. Logout Logic
    if (ui.logout) {
        ui.logout.onclick = async (e) => {
            e.preventDefault();
            await sb.auth.signOut();
            window.location.href = "auth.html";
        };
    }

    // 2. Send Message Button
    ui.send.onclick = (e) => { 
        e.preventDefault(); 
        sendMessage(); 
    };

    // 3. Enter Key Logic
    ui.input.onkeydown = (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            sendMessage(); 
        } 
    };
    
    // 4. Icon Toggle (Voice vs Send)
    ui.input.oninput = () => {
        const hasText = ui.input.value.trim() !== "";
        ui.voice.style.display = hasText ? "none" : "flex";
        ui.send.style.display = hasText ? "flex" : "none";
    };

    // 5. Sidebar Open/Close
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');
    if (menuBtn) menuBtn.onclick = () => ui.sidebar.classList.add('active');
    if (closeBtn) closeBtn.onclick = () => ui.sidebar.classList.remove('active');
} 

// --- 3. THE BRAIN (SEND & EDIT & DISAPPEAR LOGIC) ---
async function sendMessage() {
    const text = ui.input.value.trim();
    if (!text) return;

    if (currentlyEditingId) {
        // 1. Update the User's text in the UI
        const userWrapper = document.getElementById(currentlyEditingId);
        userWrapper.querySelector('.user-msg-bubble').innerText = text;
        
        // 2. THE WIPER: Delete EVERY bubble that exists after this edited message
        // This ensures the "Oga, make I no..." and everything below it disappears.
        let nextElement = userWrapper.nextElementSibling;
        while (nextElement) {
            let toDelete = nextElement;
            nextElement = nextElement.nextElementSibling;
            
            // Don't delete the thinking indicator, just hide it for now
            if (toDelete === ui.think) {
                toDelete.style.display = 'none';
            } else {
                toDelete.remove();
            }
        }

        // 3. Update Memory: Remove all old history after this message
        const index = chatHistory.findIndex(m => m.id === currentlyEditingId);
        if (index !== -1) {
            chatHistory[index].content = text;
            chatHistory = chatHistory.slice(0, index + 1); 
        }

        currentlyEditingId = null;
        ui.send.innerHTML = '<i class="fas fa-arrow-up"></i>';
    } else {
        const msgId = 'msg-' + Date.now();
        appendBubble('user', text, msgId);
        chatHistory.push({ role: "user", content: text, id: msgId });
    }

    // Prepare for the new AI reply
    ui.input.value = "";
    ui.send.style.display = "none";
    ui.voice.style.display = "flex";
    
    // Move thinking indicator to the bottom and show it
    ui.display.appendChild(ui.think); 
    ui.think.style.display = 'flex';
    ui.display.scrollTop = ui.display.scrollHeight;

    try {
        const { data: { user } } = await sb.auth.getUser();
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: chatHistory.map(({role, content}) => ({role, content})), 
                user_id: user.id 
            })
        });

        const data = await response.json();
        ui.think.style.display = 'none';
        
        // 4. Add the NEW reply (e.g., the Sonic reply)
        // It will now appear exactly where the old one used to be!
        chatHistory.push({ role: "assistant", content: data.reply });
        appendAiBubble(data.reply);

    } catch (e) {
        ui.think.style.display = 'none';
        appendAiBubble("Omo, network wahala! Check your server.");
    }
}

// --- 4. UI BUBBLES ---
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
    msgDiv.innerHTML = text; 
    wrapper.appendChild(msgDiv);
    ui.display.appendChild(wrapper);
    ui.display.scrollTop = ui.display.scrollHeight;
}

// --- 5. UTILS ---
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
