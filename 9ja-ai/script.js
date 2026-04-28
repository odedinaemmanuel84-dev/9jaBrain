const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionButtons = document.getElementById('suggestionButtons');

// ←←← CHANGE THIS TO YOUR ACTUAL RENDER URL ←←←
const BACKEND_URL = 'https://nineja-ai-backend-2.onrender.com/api/chat';

const suggestions = [
  "How to make perfect Jollof rice?",
  "Best tech opportunities in Nigeria right now",
  "How to start a small business in Lagos?",
  "Latest Naija football updates",
  "Tell me some funny Naija pidgin jokes"
];

function addSuggestionButtons() {
  suggestionButtons.innerHTML = '';
  suggestions.forEach(text => {
    const btn = document.createElement('button');
    btn.classList.add('suggestion-btn');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      userInput.value = text;
      handleSend();
    });
    suggestionButtons.appendChild(btn);
  });
}

function addMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', type);
  msgDiv.innerHTML = `<strong>${type === 'outgoing' ? 'You' : '9JA AI'}:</strong> ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('message', 'incoming', 'loading-message');
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <span>9JA AI dey think... hold small</span>
  `;
  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return loadingDiv;
}

async function sendToAI(message) {
  const loadingElement = showLoading();

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    loadingElement.remove();

    if (data.error) {
      addMessage(data.error, "incoming");
    } else {
      addMessage(data.reply || "No reply received", "incoming");
    }
  } catch (error) {
    loadingElement.remove();
    console.error("Full Fetch Error:", error);
    addMessage("Network wahala! Check console (F12) for details or try again.", "incoming");
  }
}

async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "outgoing");
  userInput.value = "";

  await sendToAI(message);
}

// Event listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// Initialize
addSuggestionButtons();
addMessage("Hello boss! How far? Ask me anything. 🇳🇬", "incoming");
