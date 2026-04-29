// FINAL FIXED VERSION - Clean & Working

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

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE THIS TO YOUR ACTUAL RENDER URL IF DIFFERENT

// Show Welcome
function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg">
      I'm 9JA AI, Wetin you wan know today?<br>
      Ask me anything — I get time! 😄
    </div>`;
  suggestionsDiv.style.display = 'flex';
}

// Add Message
function addMessage(text, type) {
  const div = document.createElement('div');
  div.classList.add('message', type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Hide welcome and suggestions after first message
function hideWelcomeAndSuggestions() {
  const welcome = document.querySelector('.welcome-msg');
  if (welcome) welcome.remove();
  suggestionsDiv.style.display = 'none';
}

// Send Message
async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "outgoing");
  userInput.value = "";

  // Show loading
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

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    loading.remove();
    addMessage(data.reply, "incoming");
    speak(data.reply);
    hideWelcomeAndSuggestions();   // Fix: hide after reply
  } catch (err) {
    loading.remove();
    addMessage("Network wahala. Check your internet and try again.", "incoming");
  }
}

// Simple natural voice
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

// Voice Input (Mic)
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
