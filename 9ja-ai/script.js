const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionsDiv = document.getElementById('suggestions');
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeMenu = document.getElementById('closeMenu');
const newChatBtn = document.getElementById('newChatBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE TO YOUR REAL URL

let currentChatId = 'chat_' + Date.now();

// Welcome
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
  saveCurrentChat();
}

function saveCurrentChat() {
  localStorage.setItem(currentChatId, chatBox.innerHTML);
}

function loadChat() {
  const saved = localStorage.getItem(currentChatId);
  if (saved) {
    chatBox.innerHTML = saved;
    suggestionsDiv.style.display = 'none';
  } else {
    showWelcome();
  }
}

// Load Circular Chat History
function loadPreviousChats() {
  const container = document.getElementById('previousChats');
  container.innerHTML = '';

  const chats = Object.keys(localStorage).filter(key => key.startsWith('chat_'));

  if (chats.length === 0) {
    container.innerHTML = '<p style="color:#666; padding:10px;">No previous chats yet</p>';
    return;
  }

  chats.forEach(id => {
    const preview = (localStorage.getItem(id) || "").replace(/<[^>]+>/g, '').substring(0, 45) || "New Chat";

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-circle">
        <i class="fas fa-clock"></i>
      </div>
      <div class="history-preview">
        <div class="title">${preview}...</div>
        <div class="date">${new Date(parseInt(id.split('_')[1])).toLocaleDateString()}</div>
      </div>
    `;
    item.onclick = () => {
      currentChatId = id;
      loadChat();
      sideMenu.classList.remove('open');
    };
    container.appendChild(item);
  });
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
  } catch (err) {
    loading.remove();
    addMessage("Network wahala. Try again.", "incoming");
  }
}

// Image Generation (Simulated)
function createImage() {
  addMessage("Generating image for you...", "outgoing");
  setTimeout(() => {
    addMessage("🎨 Image generated! (Feature coming soon with real AI image generation)", "incoming");
  }, 1500);
}

// Image Upload
function uploadImage() {
  addMessage("📸 Image uploaded successfully. Vision analysis coming soon!", "outgoing");
}

// Voice Input
voiceInputBtn.addEventListener('click', () => {
  alert("Voice Mode: Press and speak (Coming with full integration soon)");
});

// New Chat
function newChat() {
  currentChatId = 'chat_' + Date.now();
  chatBox.innerHTML = '';
  showWelcome();
  sideMenu.classList.remove('open');
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) handleSend();
});

menuBtn.addEventListener('click', () => {
  loadPreviousChats();
  sideMenu.classList.add('open');
});

closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));
newChatBtn.addEventListener('click', newChat);

// Initialize
showWelcome();
