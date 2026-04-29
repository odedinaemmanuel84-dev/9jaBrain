// ==================== FINAL VOICE + WELCOME FIX ====================

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsDiv = document.getElementById('suggestions');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const newChatBtn = document.getElementById('newChatBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE TO YOUR ACTUAL RENDER URL

let currentChatId = 'chat_' + Date.now();
let isFirstMessage = true;

// Show Welcome Message
function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg" id="welcomeMessage">
      I'm 9JA AI, Wetin you wan know today?<br>
      Ask me anything — I get time! 😄
    </div>`;
  suggestionsDiv.style.display = 'flex';
  isFirstMessage = true;
}

// Hide Welcome after first message
function hideWelcome() {
  const welcome = document.getElementById('welcomeMessage');
  if (welcome) welcome.remove();
}

// Add Message
function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (type === 'outgoing') {
    suggestionsDiv.style.display = 'none';
    if (isFirstMessage) {
      hideWelcome();
      isFirstMessage = false;
    }
  }
}

// Show "AI is speaking..." indicator
function showSpeakingIndicator() {
  const indicator = document.createElement('div');
  indicator.classList.add('message', 'speaking');
  indicator.id = 'speakingIndicator';
  indicator.innerHTML = `<span class="speaking-dot"></span> 9JA AI is speaking...`;
  chatBox.appendChild(indicator);
  chatBox.scrollTop = chatBox.scrollHeight;
  return indicator;
}

// Natural Human-like Voice (Better for Pidgin)
function speak(text) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;        // Natural speed
  utterance.pitch = 1.05;       // Slightly higher for friendly tone
  utterance.volume = 0.95;

  // Try to get a good English voice that handles pidgin better
  const voices = speechSynthesis.getVoices();
  const goodVoice = voices.find(v => 
    v.lang.includes('en') && 
    (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Google'))
  );

  if (goodVoice) utterance.voice = goodVoice;

  const indicator = showSpeakingIndicator();

  utterance.onend = () => {
    indicator.remove();
  };

  window.speechSynthesis.speak(utterance);
}

// Send Message to Backend
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
    speak(data.reply);           // Auto speak with natural voice
  } catch (err) {
    loading.remove();
    addMessage("Network wahala, check your connection and try again.", "incoming");
  }
}

// Voice Input (Mic Button) - Press to speak
voiceInputBtn.addEventListener('click', () => {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-NG';           // Nigerian English
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      userInput.value = event.results[0][0].transcript;
      handleSend();
    };

    recognition.onerror = () => alert("Voice recognition error. Try again.");
    recognition.start();
  } else {
    alert("Voice input not supported on this browser. Please use Chrome or Edge.");
  }
});

// New Chat
function newChat() {
  currentChatId = 'chat_' + Date.now();
  chatBox.innerHTML = '';
  showWelcome();
  sideMenu.classList.remove('open');
}

// Menu Controls
menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));
newChatBtn.addEventListener('click', newChat);

// Event Listeners
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Initialize
showWelcome();
