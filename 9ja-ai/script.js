const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsDiv = document.getElementById('suggestions');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const cameraBtn = document.getElementById('cameraBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← PUT YOUR REAL RENDER URL HERE

let currentVoiceGender = 'female';

// Add Message to Chat
function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Show Welcome
function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg">
      I'm 9JA AI, Wetin you wan know today?<br>
      Ask me anything — I get time! 😄
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

// Show Modern Speaking Animation Screen
function showSpeakingScreen(text) {
  // Hide chat temporarily and show speaking animation
  chatBox.style.display = 'none';

  const speakingScreen = document.createElement('div');
  speakingScreen.id = 'speakingScreen';
  speakingScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: #0a0a0a; display: flex; flex-direction: column; 
    align-items: center; justify-content: center; z-index: 100; color: white;
  `;

  speakingScreen.innerHTML = `
    <div style="margin-bottom: 30px;">
      <div class="ai-brain">
        <i class="fas fa-brain" style="font-size: 90px; color: #00ff9d; animation: pulse 2s infinite;"></i>
      </div>
    </div>
    <h2 style="margin-bottom: 10px;">9JA AI is speaking...</h2>
    <p style="color: #888; max-width: 280px; text-align: center;">Listening to the vibes...</p>
  `;

  document.body.appendChild(speakingScreen);

  // Speak the text with better natural voice
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = currentVoiceGender === 'male' ? 0.9 : 1.1;
  utterance.volume = 0.96;

  const voices = speechSynthesis.getVoices();
  const goodVoice = voices.find(v => v.lang.includes('en'));
  if (goodVoice) utterance.voice = goodVoice;

  utterance.onend = () => {
    speakingScreen.remove();
    chatBox.style.display = 'flex';
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  window.speechSynthesis.speak(utterance);
}

// Send Message
async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "outgoing");
  userInput.value = "";

  const loading = document.createElement('div');
  loading.classList.add('message', 'loading');
  loading.textContent = "Thinking...";
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    loading.remove();
    addMessage(data.reply, "incoming");

    // Show nice speaking animation + natural voice
    showSpeakingScreen(data.reply);

  } catch (err) {
    loading.remove();
    addMessage("Network wahala, try again.", "incoming");
  }
}

// Voice Input (Mic Button)
voiceInputBtn.addEventListener('click', () => {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-NG';
    recognition.onresult = (e) => {
      userInput.value = e.results[0][0].transcript;
      handleSend();
    };
    recognition.start();
  } else {
    alert("Voice not supported on this browser");
  }
});

// Camera
cameraBtn.addEventListener('click', () => {
  alert("Photo upload coming soon 📸");
});

// Initialize
showWelcome();

// Event Listeners
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
