// client/script.js

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const micBtn = document.getElementById('mic-btn');

// IMPORTANT: Replace this with your actual Render URL (e.g., https://naija-ai.onrender.com)
const BACKEND_URL = "https://nineja-ai-backend-4.onrender.com"; 

// Helper function to show messages in the UI
function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    
    // Auto-scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 1. HANDLE TEXT CHAT
async function handleChat() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    userInput.value = '';

    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });

        const data = await response.json();

        if (data.reply) {
            addMessage(data.reply, 'ai');
        } else if (data.error) {
            addMessage(`Error: ${data.error}`, 'ai');
        } else {
            addMessage("Oga, the server sent back an empty response. Check your Groq Key.", 'ai');
        }
    } catch (error) {
        console.error("Chat Error:", error);
        addMessage("Server is waking up or connection failed. Please try again in 20 seconds.", 'ai');
    }
}

// 2. HANDLE IMAGE UPLOAD (GEMINI VISION)
imageInput.onchange = async () => {
    const file = imageInput.files[0];
    if (!file) return;

    addMessage("Sending image to Naija AI...", 'user');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', "Explain what is in this photo like a Nigerian friend.");

    try {
        const response = await fetch(`${BACKEND_URL}/vision`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.reply) {
            addMessage(data.reply, 'ai');
        } else {
            addMessage("Could not read the image. Check your Gemini API key.", 'ai');
        }
    } catch (error) {
        console.error("Vision Error:", error);
        addMessage("Image upload failed. Make sure your Render server is running.", 'ai');
    }
};

// 3. HANDLE VOICE (WHISPER)
let mediaRecorder;
let audioChunks = [];

micBtn.onclick = async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            addMessage("Transcribing your voice note...", 'user');

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            try {
                const response = await fetch(`${BACKEND_URL}/voice`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                if (data.text) {
                    userInput.value = data.text; // Put transcribed text into input
                    handleChat(); // Automatically send it
                }
            } catch (error) {
                addMessage("Voice transcription failed.", 'ai');
            }
        };

        mediaRecorder.start();
        micBtn.style.backgroundColor = "red"; // Visual cue recording is on
    } else {
        mediaRecorder.stop();
        micBtn.style.backgroundColor = ""; // Reset color
    }
};

// Event Listeners
sendBtn.addEventListener('click', handleChat);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});
