// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = " https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";

// Initialize Supabase
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const userInput = document.getElementById('userInput');
const voiceBtn = document.getElementById('voiceBtn');
const sendBtn = document.getElementById('sendBtn');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

// --- BUTTON SWITCHING LOGIC ---
userInput.addEventListener('input', () => {
    if (userInput.value.trim() !== "") {
        voiceBtn.style.display = "none";
        sendBtn.style.display = "flex";
    } else {
        voiceBtn.style.display = "flex";
        sendBtn.style.display = "none";
    }
});

// --- SIDEBAR LOGIC ---
menuBtn.onclick = () => sidebar.classList.add('active');
closeSidebar.onclick = () => sidebar.classList.remove('active');

// --- SEND LOGIC ---
async function sendMessage() {
    const text = userInput.value.trim();
    const fileInput = document.getElementById('imageUpload');
    const display = document.getElementById('chatDisplay');

    if (!text && !fileInput.files[0]) return;

    // Add user message to screen
    display.innerHTML += `<div class="user-msg-bubble">${text}</div>`;
    
    // Clear Input and Reset Buttons
    userInput.value = "";
    voiceBtn.style.display = "flex";
    sendBtn.style.display = "none";

    try {
        let response;
        if (fileInput.files[0]) {
            // Use Image Analysis Logic
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('prompt', text);
            
            response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
                body: formData
            });
        } else {
            // Standard Text Chat
            response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
                },
                body: JSON.stringify({ prompt: text })
            });
        }

        const data = await response.json();
        display.innerHTML += `<div class="ai-msg-bubble">${data.reply}</div>`;
        fileInput.value = ""; // Clear file
        
    } catch (err) {
        display.innerHTML += `<div class="ai-msg-bubble">Omo, error dey: ${err.message}</div>`;
    }
}

sendBtn.onclick = sendMessage;

// Voice Mode Redirect
voiceBtn.onclick = () => {
    window.location.href = 'voice.html';
};
