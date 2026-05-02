const BACKEND_URL = "https://your-render-app.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwueryoguyyu.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY"; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Check Login & Personalize
async function init() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
    } else {
        const name = user.email.split('@')[0]; // Simple name from email
        document.getElementById('welcomeGreeting').innerText = `${name}, I dey listen. Wetin you want make we gist about today?`;
    }
}
init();

// 2. UI Elements
const userInput = document.getElementById('userInput');
const voiceBtn = document.getElementById('voiceBtn');
const sendBtn = document.getElementById('sendBtn');

// 3. Button Switch Switcher
userInput.addEventListener('input', () => {
    const isTyping = userInput.value.trim() !== "";
    voiceBtn.style.display = isTyping ? "none" : "flex";
    sendBtn.style.display = isTyping ? "flex" : "none";
});

// 4. Send Gist
async function sendMessage() {
    const text = userInput.value.trim();
    const file = document.getElementById('imageUpload').files[0];
    if (!text && !file) return;

    appendBubble('user', text);
    
    // Hide welcome on first chat
    if(document.getElementById('welcomeUI')) document.getElementById('welcomeUI').style.display = 'none';

    userInput.value = "";
    voiceBtn.style.display = "flex";
    sendBtn.style.display = "none";

    try {
        let res;
        if (file) {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('prompt', text);
            res = await fetch(`${BACKEND_URL}/api/analyze-image`, { method: 'POST', body: fd });
        } else {
            res = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
        }
        const data = await res.json();
        appendBubble('ai', data.reply || "Omo, I no get message.");
    } catch (e) {
        appendBubble('ai', "Omo, backend error! Confirm say your Render link dey active.");
    }
}

function appendBubble(sender, msg) {
    const display = document.getElementById('chatDisplay');
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    bubble.innerText = msg;
    display.appendChild(bubble);
    display.scrollTop = display.scrollHeight;
}

function setPrompt(val) { userInput.value = val; userInput.dispatchEvent(new Event('input')); }
sendBtn.onclick = sendMessage;
userInput.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };
