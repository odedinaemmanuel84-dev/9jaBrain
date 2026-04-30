const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const BACKEND_URL = "https://your-render-url.com"; // Change this after deploying to Render

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle Text Chat
sendBtn.onclick = async () => {
    const text = userInput.value;
    if (!text) return;
    addMessage(text, 'user');
    userInput.value = '';

    const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
    });
    const data = await res.json();
    addMessage(data.reply, 'ai');
};

// Handle Image Upload
imageInput.onchange = async () => {
    const file = imageInput.files[0];
    addMessage("Sending image...", 'user');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', "Explain this image like a Nigerian");

    const res = await fetch(`${BACKEND_URL}/vision`, { method: 'POST', body: formData });
    const data = await res.json();
    addMessage(data.reply, 'ai');
};
