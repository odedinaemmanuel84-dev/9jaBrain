const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const darkModeBtn = document.getElementById('darkModeBtn');

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← UPDATE THIS

let isDarkMode = false;

// Auto resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 130) + 'px';
});

function addMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', type);
  msgDiv.innerHTML = `<strong>${type === 'outgoing' ? 'You' : '9JA AI'}:</strong> ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
  const loading = document.createElement('div');
  loading.classList.add('message', 'loading');
  loading.id = 'loadingMsg';
  loading.innerHTML = `<strong>9JA AI:</strong> <span class="dots">Groq dey calculate sharp sharp</span>`;
  chatBox.appendChild(loading);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loading;
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
  } catch (err) {
    loadingMsg.remove();
    addMessage("Network wahala! Check connection or try again.", "incoming");
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

// Quick suggestions
window.sendSuggestion = function(btn) {
  const message = btn.textContent;
  addMessage(message, "outgoing");
  sendToBackend(message);
};

// New Chat
newChatBtn.addEventListener('click', async () => {
  if (confirm("Start new chat? Previous conversation go clear.")) {
    chatBox.innerHTML = `<div class="message incoming"><strong>9JA AI:</strong> Fresh start! How far?</div>`;
    await fetch(`${BACKEND_URL}/clear`, { method: "POST" });
  }
});

// Dark Mode
darkModeBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  darkModeBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Event listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
