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
const imageUpload = document.getElementById('imageUpload');

const BACKEND_URL = "https://ninja-ai-backend-3.onrender.com";   // ← CHANGE TO YOUR ACTUAL RENDER URL

let currentChatId = 'chat_' + Date.now();
let currentVoiceGender = 'female'; // default

// Auto resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 130) + 'px';
});

// Load chat or show welcome
function loadChat() {
  const saved = localStorage.getItem(currentChatId);
  if (saved) {
    chatBox.innerHTML = saved;
    suggestionsDiv.style.display = 'none';
  } else {
    showWelcome();
  }
}

function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg">
      How far my person! 👋<br><br>
      I'm 9JA AI, created by Emmanuel Odedina.<br>
      Wetin you wan know today? Ask me anything — I get time! 😄
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

function saveCurrentChat() {
  localStorage.setItem(currentChatId, chatBox.innerHTML);
}

function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveCurrentChat();
  if (type === 'outgoing') suggestionsDiv.style.display = 'none';
}

function showLoading() {
  const loading = document.createElement('div');
  loading.classList.add('message', 'loading');
  loading.innerHTML = `<span class="spinner"></span> Thinking...`;
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loading;
}

function showSpeaking() {
  const speaking = document.createElement('div');
  speaking.classList.add('message', 'speaking');
  speaking.innerHTML = `<span class="speaking-dot"></span> 9JA AI is speaking...`;
  chatBox.appendChild(speaking);
  chatBox.scrollTop = chatBox.scrollHeight;
  return speaking;
}

// Text-to-Speech with Male/Female selection
function speak(text) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = currentVoiceGender === 'male' ? 0.9 : 1.1;
  utterance.volume = 0.97;

  const voices = speechSynthesis.getVoices();
  let selectedVoice = null;

  if (currentVoiceGender === 'male') {
    selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes('daniel') || 
      v.name.toLowerCase().includes('guy') || 
      v.name.toLowerCase().includes('male')
    );
  } else {
    selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('karen') || 
      v.name.toLowerCase().includes('female')
    );
  }

  if (selectedVoice) utterance.voice = selectedVoice;

  const speakingIndicator = showSpeaking();

  utterance.onend = () => {
    speakingIndicator.remove();
  };

  window.speechSynthesis.speak(utterance);
}

async function sendToBackend(message) {
  const loadingMsg = showLoading();

  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    loadingMsg.remove();
    addMessage(data.reply, "incoming");
    speak(data.reply);           // Auto voice reply
  } catch (err) {
    loadingMsg.remove();
    addMessage(navigator.onLine ? "Network wahala, try again." : "No internet connection.", "incoming");
  }
}

async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "outgoing");
  userInput.value = "";
  userInput.style.height = 'auto';

  await sendToBackend(message);
}

// Voice Input
let recognition = null;
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-NG';
  recognition.onresult = (e) => {
    userInput.value = e.results[0][0].transcript;
    handleSend();
  };
}

voiceInputBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});

// Image Upload
cameraBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', () => {
  addMessage("📸 Image received. Vision analysis dey come soon!", "outgoing");
});

// Menu Controls
menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

function newChat() {
  if (confirm("Start new chat?")) {
    currentChatId = 'chat_' + Date.now();
    chatBox.innerHTML = '';
    showWelcome();
    sideMenu.classList.remove('open');
  }
}

function clearAllHistory() {
  if (confirm("Clear all history?")) {
    localStorage.clear();
    newChat();
  }
}

// Voice Gender Selector (Added to Menu)
function addVoiceSelector() {
  const voiceDiv = document.createElement('div');
  voiceDiv.style.marginTop = '20px';
  voiceDiv.innerHTML = `
    <p style="margin-bottom:8px; color:#aaa;">Choose Voice:</p>
    <button onclick="setVoice('female')" style="margin:5px; padding:8px 16px; border-radius:20px; background:${currentVoiceGender==='female'?'#00cc88':'#334444'}">Female</button>
    <button onclick="setVoice('male')" style="margin:5px; padding:8px 16px; border-radius:20px; background:${currentVoiceGender==='male'?'#00cc88':'#334444'}">Male</button>
  `;
  sideMenu.appendChild(voiceDiv);
}

window.setVoice = function(gender) {
  currentVoiceGender = gender;
  sideMenu.classList.remove('open');
  alert(`Voice changed to ${gender === 'male' ? 'Male' : 'Female'}`);
};

// Quick Suggestions
window.sendSuggestion = function(btn) {
  const msg = btn.textContent;
  addMessage(msg, "outgoing");
  sendToBackend(msg);
};

// Initialize
loadChat();
addVoiceSelector();   // Add voice selector in menu

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
