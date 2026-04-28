const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const newChatBtn = document.getElementById('newChatBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const cameraBtn = document.getElementById('cameraBtn');
const imageUpload = document.getElementById('imageUpload');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE THIS

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
});

// Add welcome message
function addWelcome() {
  chatBox.innerHTML = `<div class="message incoming"><strong>9JA AI:</strong> Hello! I'm 9JA AI, created by Emmanuel Odedina. How can I help you today?</div>`;
}
addWelcome();

// Add message
function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.innerHTML = `<strong>${type === 'outgoing' ? 'You' : '9JA AI'}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Loading spinner
function showLoading() {
  const loading = document.createElement('div');
  loading.classList.add('message', 'loading');
  loading.id = 'loadingMsg';
  loading.innerHTML = `<strong>9JA AI:</strong> <span class="spinner"></span> Thinking...`;
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loading;
}

// Text-to-Speech
function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    speechSynthesis.speak(utterance);
  }
}

// Send message
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
    speak(data.reply);                    // Auto voice reply
  } catch (err) {
    loadingMsg.remove();
    if (!navigator.onLine) {
      addMessage("No internet connection. Please check your network.", "incoming");
    } else {
      addMessage("Something went wrong. Please try again.", "incoming");
    }
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

// Voice Input (Speech-to-Text)
let recognition;
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-NG';
  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
    handleSend();
  };
}

voiceInputBtn.addEventListener('click', () => {
  if (recognition) recognition.start();
});

// Image Upload (Basic - Text only for now)
cameraBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    addMessage("Image uploaded. (Vision support coming soon)", "outgoing");
    // Future: Send base64 to backend with vision model
  }
});

// Hamburger Menu
menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

// New Chat
function newChat() {
  if (confirm("Start a new chat?")) {
    chatBox.innerHTML = '';
    addWelcome();
    fetch(`${BACKEND_URL}/clear`, { method: "POST" });
    sideMenu.classList.remove('open');
  }
}
newChatBtn.addEventListener('click', newChat);

// Save Chat History
function saveChatHistory() {
  const messages = Array.from(chatBox.children).map(msg => msg.textContent);
  const blob = new Blob([messages.join('\n\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `9JA_AI_Chat_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  sideMenu.classList.remove('open');
}

// Clear History
function clearAllHistory() {
  if (confirm("Clear all chat history?")) {
    chatBox.innerHTML = '';
    addWelcome();
    fetch(`${BACKEND_URL}/clear`, { method: "POST" });
    sideMenu.classList.remove('open');
  }
}

// Quick suggestions
window.sendSuggestion = function(btn) {
  const msg = btn.textContent;
  addMessage(msg, "outgoing");
  sendToBackend(msg);
};

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
