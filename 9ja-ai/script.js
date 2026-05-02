// --- 1. CONFIGURATION & INITIALIZATION ---
// Replace with your actual Render URL (No trailing slash!)
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com"; 
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA"; // Publicly safe to put here

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. DOM ELEMENTS ---
const userInput = document.getElementById('userInput');
const voiceBtn = document.getElementById('voiceBtn');
const sendBtn = document.getElementById('sendBtn');
const chatDisplay = document.getElementById('chatDisplay');
const fileInput = document.getElementById('imageUpload');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');

// --- 3. BUTTON SWITCHING LOGIC ---
// Switches from "Speak" to "Send Arrow" when you start typing
userInput.addEventListener('input', () => {
    const isTyping = userInput.value.trim() !== "";
    voiceBtn.style.display = isTyping ? "none" : "flex";
    sendBtn.style.display = isTyping ? "flex" : "none";
});

// --- 4. SIDEBAR NAVIGATION ---
if (menuBtn) menuBtn.onclick = () => sidebar.classList.add('active');
if (closeSidebar) closeSidebar.onclick = () => sidebar.classList.remove('active');

// --- 5. CHAT LOGIC ---
async function sendMessage() {
    const text = userInput.value.trim();
    const hasFile = fileInput.files && fileInput.files[0];

    // Don't send if both are empty
    if (!text && !hasFile) return;

    // Display user message immediately
    appendMessage('user', text);
    
    // Reset UI state
    userInput.value = "";
    voiceBtn.style.display = "flex";
    sendBtn.style.display = "none";

    try {
        let response;
        
        if (hasFile) {
            // Handle Image Gist (Gemini Logic)
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('prompt', text || "Wetin be this?"); // Default prompt if text is empty

            response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData
                // Authorization headers can be added here if you're using Supabase Auth
            });
        } else {
            // Handle Text Gist (Groq Logic)
            response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
        }

        const data = await response.json();

        // THE FIX: Check if 'reply' exists to avoid "undefined"
        if (data && data.reply) {
            appendMessage('ai', data.reply);
        } else if (data && data.error) {
            appendMessage('ai', `Omo, backend error: ${data.error}`);
        } else {
            appendMessage('ai', "I get the message, but I no fit talk right now. Check Render logs!");
        }

    } catch (err) {
        console.error("Connection Error:", err);
        appendMessage('ai', "Network wahala! I no fit reach the server. Confirm say your Render link dey correct.");
    } finally {
        fileInput.value = ""; // Clear file after attempt
    }
}

// --- 6. HELPER FUNCTIONS ---
function appendMessage(sender, message) {
    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'user-msg-bubble' : 'ai-msg-bubble';
    
    // Safety check: If message is somehow missing, don't show "undefined"
    bubble.innerText = message || "Omo, something go wrong.";
    
    chatDisplay.appendChild(bubble);
    
    // Auto-scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Attach Events
sendBtn.onclick = sendMessage;

// Handle "Enter" key to send
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Voice Mode Redirect
voiceBtn.onclick = () => {
    window.location.href = 'voice.html';
};
