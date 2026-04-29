// ==================== BASIC WORKING VERSION ====================

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsDiv = document.getElementById('suggestions');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const newChatBtn = document.getElementById('newChatBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE THIS TO YOUR ACTUAL RENDER URL

let currentChatId = 'chat_' + Date.now();

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
  if (type === 'outgoing') suggestionsDiv.style.display = 'none';
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

    const data = await res.json();
    loading.remove();
    addMessage(data.reply, "incoming");
  } catch (err) {
    loading.remove();
    addMessage("Network wahala, check your connection.", "incoming");
  }
}

// New Chat
function newChat() {
  currentChatId = 'chat_' + Date.now();
  chatBox.innerHTML = '';
  showWelcome();
  sideMenu.classList.remove('open');
}

// Menu
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
