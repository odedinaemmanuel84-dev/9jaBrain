const BACKEND_URL = "https://your-render-app.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwueryoguyyu.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY"; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Auth & Personalized Name
async function initVoice() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
    } else {
        const name = user.email.split('@')[0];
        document.getElementById('voiceGreeting').innerText = `${name}, I dey listen...`;
    }
}
initVoice();

// 2. Speech Recognition Setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-NG'; // Nigerian English context
recognition.interimResults = false;

const micBtn = document.getElementById('toggleMic');
const statusText = document.getElementById('statusText');
const userSpeech = document.getElementById('userSpeech');

micBtn.onclick = () => {
    recognition.start();
    statusText.innerText = "Listening to your gist...";
    document.getElementById('pulseContainer').classList.add('listening');
};

recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    userSpeech.innerText = transcript;
    statusText.innerText = "Naija AI dey think...";

    // Send voice transcript to backend
    try {
        const res = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: transcript })
        });
        const data = await res.json();
        
        // Speak the reply back
        speak(data.reply);
        statusText.innerText = "AI is talking...";
    } catch (e) {
        statusText.innerText = "Error dey!";
    }
};

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; 
    window.speechSynthesis.speak(utterance);
    utterance.onend = () => {
        statusText.innerText = "Gist finished.";
        document.getElementById('pulseContainer').classList.remove('listening');
    };
}
