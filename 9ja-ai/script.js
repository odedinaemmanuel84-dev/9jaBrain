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

const BACKEND_URL = "https://ninja-ai-backend-3.onrender.com";   // ← UPDATE THIS

let currentChatId = 'chat_' + Date.now();
let currentVoiceGender = 'female';

// Auto resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
});

// Load or show welcome
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
      Where should we begin?
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

// Save current chat
function saveCurrentChat() {
  localStorage.setItem(currentChatId, chatBox.innerHTML);
}

// Add message (clean style)
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

// Text-to-Speech with Male/Female
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = currentVoiceGender === 'male' ? 0.85 : 1.08;

  const voices = speechSynthesis.getVoices();
  let voice = voices.find(v => currentVoiceGender === 'male' 
    ? v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('guy')
    : v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('karen'));

  if (voice) utterance.voice = voice;

  const indicator = showSpeaking();
  utterance.onend = () => indicator.remove();

  window.speechSynthesis.speak(utterance);
}

async function sendToBackend(message) {
  const loading = showLoading();
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    loading.remove();
    addMessage(data.reply, "incoming");
    speak(data.reply);
  } catch (e) {
    loading.remove();
    addMessage("Network wahala, try again.", "incoming");
  }
}

async function handleSend() {
  const msg = userInput.value.trim();
  if (!msg) return;
  addMessage(msg, "outgoing");
  userInput.value = "";
  userInput.style.height = 'auto';
  await sendToBackend(msg);
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
voiceInputBtn.addEventListener('click', () => recognition && recognition.start());

// Image Upload
cameraBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', () => {
  addMessage("📸 Image received (Vision coming soon)", "outgoing");
});

// ==================== PREVIOUS CHATS ====================
function getAllChatIds() {
  return Object.keys(localStorage).filter(key => key.startsWith('chat_'));
}

function loadPreviousChats() {
  const container = document.getElementById('previousChats');
  if (!container) return;
  container.innerHTML = '';

  const chatIds = getAllChatIds();

  if (chatIds.length === 0) {
    container.innerHTML = '<p style="color:#666; font-size:0.9rem; padding:10px;">No previous chats yet</p>';
    return;
  }

  chatIds.forEach(id => {
    const preview = localStorage.getItem(id) || '';
    const firstLine = preview.replace(/<[^>]+>/g, '').substring(0, 60) || "New Chat";

    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <i class="fas fa-comment"></i>
      <div style="flex:1; overflow:hidden;">
        <div style="font-size:0.95rem;">${firstLine}</div>
        <small style="color:#888;">${new Date(parseInt(id.split('_')[1])).toLocaleDateString()}</small>
      </div>
    `;
    div.onclick = () => {
      currentChatId = id;
      loadChat();
      sideMenu.classList.remove('open');
    };
    container.appendChild(div);
  });
}

// Menu Controls
menuBtn.addEventListener('click', () => {
  loadPreviousChats();
  sideMenu.classList.add('open');
});

closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

function newChat() {
  if (confirm("Start a new chat?")) {
    currentChatId = 'chat_' + Date.now();
    chatBox.innerHTML = '';
    showWelcome();
    sideMenu.classList.remove('open');
  }
}

// Voice Gender Selector
function addVoiceSelector() {
  const voiceSection = document.createElement('div');
  voiceSection.style.margin = '25px 0 15px';
  voiceSection.innerHTML = `
    <p style="margin-bottom:8px; color:#aaa; font-size:0.95rem;">Voice Gender</p>
    <button onclick="setVoice('female')" style="margin:4px; padding:8px 16px; border-radius:20px; background:${currentVoiceGender==='female' ? '#00b47a' : '#333'}">Female</button>
    <button onclick="setVoice('male')" style="margin:4px; padding:8px 16px; border-radius:20px; background:${currentVoiceGender==='male' ? '#00b47a' : '#333'}">Male</button>
  `;
  sideMenu.appendChild(voiceSection);
}

window.setVoice = function(gender) {
  currentVoiceGender = gender;
  alert(`Voice changed to ${gender}`);
  sideMenu.classList.remove('open');
};

// Quick Suggestions
window.sendSuggestion = function(btn) {
  const msg = btn.textContent;
  addMessage(msg, "outgoing");
  sendToBackend(msg);
};

// Initialize
loadChat();
addVoiceSelector();

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
