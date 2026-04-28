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

const BACKEND_URL = "https://your-render-app.onrender.com";   // ← UPDATE THIS

let currentChatId = 'chat_' + Date.now();

// Auto resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
});

// Load saved chat or show welcome
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
    <div class="message incoming">
      <strong>9JA AI:</strong> Hello! I'm 9JA AI, created by Emmanuel Odedina. How can I help you today?
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

// Save chat automatically
function saveCurrentChat() {
  localStorage.setItem(currentChatId, chatBox.innerHTML);
}

function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.innerHTML = `<strong>${type === 'outgoing' ? 'You' : '9JA AI'}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveCurrentChat();

  // Hide suggestions after first message
  if (type === 'outgoing') suggestionsDiv.style.display = 'none';
}

function showLoading() {
  const loading = document.createElement('div');
  loading.classList.add('message', 'loading');
  loading.id = 'loadingMsg';
  loading.innerHTML = `<strong>9JA AI:</strong> <span class="spinner"></span> Thinking...`;
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loading;
}

// Text-to-Speech (ChatGPT style)
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  }
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
    speak(data.reply);           // Voice reply
  } catch (err) {
    loadingMsg.remove();
    addMessage(navigator.onLine ? "Something went wrong. Please try again." : "No internet connection.", "incoming");
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

voiceInputBtn.addEventListener('click', () => recognition && recognition.start());

// Image Upload (Vision ready - basic for now)
cameraBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    addMessage("📸 Image received. Vision analysis coming soon...", "outgoing");
    // TODO: Send base64 to backend with vision model
  }
});

// Menu Controls
menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

function newChat() {
  if (confirm("Start a new conversation?")) {
    currentChatId = 'chat_' + Date.now();
    chatBox.innerHTML = '';
    showWelcome();
    sideMenu.classList.remove('open');
  }
}

function clearAllHistory() {
  if (confirm("Clear all saved chats?")) {
    localStorage.clear();
    newChat();
  }
}

// Quick Suggestions
window.sendSuggestion = function(btn) {
  const msg = btn.textContent;
  addMessage(msg, "outgoing");
  sendToBackend(msg);
};

// Initialize
loadChat();

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
