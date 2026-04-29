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

const BACKEND_URL = "https://nineja-ai-backend-3.onrender.com";   // ← CHANGE TO YOUR ACTUAL BACKEND URL

let currentChatId = 'chat_' + Date.now();
let currentVoiceGender = 'female';

// Auto resize
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
});

function showWelcome() {
  chatBox.innerHTML = `
    <div class="message incoming welcome-msg">
      I'm 9JA AI, Wetin you wan know today?<br>
      Ask me anything — I get time! 😄
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

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = currentVoiceGender === 'male' ? 0.85 : 1.08;

  const voices = speechSynthesis.getVoices();
  let voice = voices.find(v => currentVoiceGender === 'male' 
    ? v.name.toLowerCase().includes('daniel') 
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

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    loading.remove();
    addMessage(data.reply, "incoming");
    speak(data.reply);
  } catch (e) {
    loading.remove();
    addMessage("Network wahala, check your connection and try again.", "incoming");
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

// Image
cameraBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', () => addMessage("Image uploaded (Vision coming soon)", "outgoing"));

// Previous Chats
function loadPreviousChats() {
  const container = document.getElementById('previousChats');
  container.innerHTML = '';

  const chats = Object.keys(localStorage).filter(k => k.startsWith('chat_'));

  if (chats.length === 0) {
    container.innerHTML = '<p style="color:#666; padding:10px;">No previous chats yet</p>';
    return;
  }

  chats.forEach(id => {
    const preview = localStorage.getItem(id).replace(/<[^>]+>/g, '').substring(0, 45) || "Chat";
    const div = document.createElement('div');
    div.className = 'history-item';
    div.style.cssText = 'padding:12px; margin:6px 0; background:#1f1f1f; border-radius:8px; cursor:pointer;';
    div.innerHTML = `
      <div>${preview}...</div>
      <small style="color:#888;">${new Date(parseInt(id.split('_')[1])).toLocaleDateString()}</small>
    `;
    div.onclick = () => {
      currentChatId = id;
      loadChat();
      sideMenu.classList.remove('open');
    };
    container.appendChild(div);
  });
}

// Menu
menuBtn.addEventListener('click', () => {
  loadPreviousChats();
  sideMenu.classList.add('open');
});
closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

function newChat() {
  currentChatId = 'chat_' + Date.now();
  chatBox.innerHTML = '';
  showWelcome();
  sideMenu.classList.remove('open');
}

// Voice Selector
window.setVoice = function(gender) {
  currentVoiceGender = gender;
  alert(`Voice changed to ${gender}`);
};

// Initialize
loadChat();

// Events
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) handleSend();
});
newChatBtn.addEventListener('click', newChat);
