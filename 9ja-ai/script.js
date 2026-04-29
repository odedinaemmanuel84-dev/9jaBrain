// ==================== CLEAN & FIXED VERSION ====================

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsDiv = document.getElementById('suggestions');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const newChatBtn = document.getElementById('newChatBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const cameraBtn = document.getElementById('cameraBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE TO YOUR ACTUAL RENDER URL

let currentVoiceGender = 'male';

// Show Welcome
function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg">
      I'm 9JA AI, Wetin you wan know today?<br>
      Ask me anything — I get time! 😄
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

// Add normal message to chat
function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Show Animated Brain Page (Only when Mic is pressed)
function showAnimatedBrain(text) {
  const brainScreen = document.createElement('div');
  brainScreen.id = 'brainScreen';
  brainScreen.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: #0a0a0a; z-index: 200; display: flex; flex-direction: column; 
    align-items: center; justify-content: center; color: white;
  `;

  brainScreen.innerHTML = `
    <div style="margin-bottom: 40px;">
      <i class="fas fa-brain" style="font-size: 100px; color: #00ff9d; animation: pulse 1.5s infinite;"></i>
    </div>
    <h2>9JA AI is speaking...</h2>
    <p style="color:#888; margin-top:10px;">Listening to the Naija vibes...</p>
  `;

  document.body.appendChild(brainScreen);

  // Speak with natural voice
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.93;
  utterance.pitch = currentVoiceGender === 'male' ? 0.9 : 1.08;
  utterance.volume = 0.95;

  utterance.onend = () => {
    brainScreen.remove();
  };

  window.speechSynthesis.speak(utterance);
}

// Send normal text message
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
    speak(data.reply);   // Normal voice reply in background
  } catch (err) {
    loading.remove();
    addMessage("Network wahala, try again.", "incoming");
  }
}

// Normal background voice reply
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = currentVoiceGender === 'male' ? 0.9 : 1.08;
  window.speechSynthesis.speak(utterance);
}

// Mic Button - Opens Animated Brain Page
voiceInputBtn.addEventListener('click', () => {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-NG';

    recognition.onresult = (e) => {
      const spokenText = e.results[0][0].transcript;
      addMessage(spokenText, "outgoing");

      // Show animated brain while processing
      const loading = document.createElement('div');
      loading.classList.add('message', 'loading');
      loading.textContent = "Thinking...";
      chatBox.appendChild(loading);

      fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: spokenText })
      })
      .then(res => res.json())
      .then(data => {
        loading.remove();
        addMessage(data.reply, "incoming");
        showAnimatedBrain(data.reply);   // Show brain animation only on voice
      })
      .catch(() => {
        loading.remove();
        addMessage("Network wahala, try again.", "incoming");
      });
    };

    recognition.start();
  } else {
    alert("Voice input not supported on this browser");
  }
});

// Camera
cameraBtn.addEventListener('click', () => alert("Photo upload coming soon 📸"));

// New Chat
function newChat() {
  chatBox.innerHTML = '';
  showWelcome();
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

newChatBtn.addEventListener('click', newChat);
menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

// Initialize
showWelcome();
