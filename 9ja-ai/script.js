const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
const BACKEND_URL = "https://your-render-app.onrender.com";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let chatHistory = [];

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) window.location.href = 'auth.html';
    document.getElementById('menuUserEmail').innerText = user.email;
    document.getElementById('userProfilePic').src = `https://ui-avatars.com/api/?name=${user.email}&background=00d2ff&color=fff`;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const msg = input.value.trim();
    if (!msg) return;

    document.getElementById('start-screen').style.display = 'none';
    appendMessage('user', msg);
    input.value = '';
    
    document.getElementById('ai-loader').style.display = 'flex';

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ prompt: msg, history: chatHistory })
        });

        const data = await response.json();
        appendMessage('ai', data.reply);
        chatHistory.push({ role: "user", content: msg }, { role: "assistant", content: data.reply });
    } catch (err) {
        appendMessage('ai', "Omo, network error. Check your backend!");
    } finally {
        document.getElementById('ai-loader').style.display = 'none';
    }
}

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}-msg`;
    div.innerText = text;
    document.getElementById('messages').appendChild(div);
}

function toggleProfileMenu() {
    const m = document.getElementById('profileMenu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

checkUser();
