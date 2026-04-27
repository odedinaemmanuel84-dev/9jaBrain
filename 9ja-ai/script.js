const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let API_KEY = "AIzaSyA_lCYdv5mroIReT3GUiyo9I2fx7kLV4Q0"; // ← Put your key here

// Function to add message to chat
function addMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', type);
  msgDiv.innerHTML = `<strong>${type === 'outgoing' ? 'You' : '9JA AI'}:</strong> ${text}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to AI
async function sendToAI(message) {
  addMessage("Thinking... (9JA AI dey calculate)", "incoming");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `You are 9JA AI, a fun, witty, and helpful Nigerian AI assistant. Use Naija slang, pidgin, and cultural references when it fits. Reply in a friendly way. User asked: ${message}` }]
      }]
    })
  });

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, network wahala. Try again!";

  // Remove "Thinking..." and show real reply
  chatBox.lastChild.remove();
  addMessage(reply, "incoming");
}

// Handle send
async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "outgoing");
  userInput.value = "";

  await sendToAI(message);
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSend();
});
