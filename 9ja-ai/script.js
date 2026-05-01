// At the top of your script.js
window.onload = () => {
    appendMessage('ai', "Abeg, welcome! I be Naija AI, the smartest pikin of **Emmanuel Odedina**. How we go take run am today? Send me photo or chat me up!");
};

function appendMessage(sender, text, imgUrl = null) {
    const win = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;
    
    // Formatting the text to look clean
    let content = `<div class="bubble">${text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</div>`;
    
    if (imgUrl) {
        content = `<img src="${imgUrl}" class="chat-img"><br>` + content;
    }
    
    msgDiv.innerHTML = content;
    win.appendChild(msgDiv);
    win.scrollTo({ top: win.scrollHeight, behavior: 'smooth' });
}

let chatHistory = [];
const API_URL = "https://your-render-app.onrender.com"; // Change to your actual URL

function handleKey(e) {
    if (e.key === 'Enter') sendMessage();
}

function handleImageSelect() {
    const file = document.getElementById('imageInput').files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        appendMessage('user', 'Sent a photo:', url);
    }
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const fileInput = document.getElementById('imageInput');
    const prompt = input.value;
    const file = fileInput.files[0];

    if (!prompt && !file) return;

    // Show User Message
    if (prompt) appendMessage('user', prompt);
    input.value = "";

    // Prepare Data
    const formData = new FormData();
    formData.append('prompt', prompt);
    if (file) formData.append('image', file);
    formData.append('history', JSON.stringify(chatHistory));

    try {
        const res = await fetch(`${API_URL}/vision`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        // Add to history for memory
        chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });

        appendMessage('ai', data.reply);
        fileInput.value = ""; // Clear file
    } catch (err) {
        appendMessage('ai', "Oga, something went wrong with the connection.");
    }
}

function appendMessage(sender, text, imgUrl = null) {
    const win = document.getElementById('chat-window');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-msg`;
    
    let content = `<p>${text}</p>`;
    if (imgUrl) content = `<img src="${imgUrl}" style="max-width:200px; border-radius:10px;"><br>` + content;
    
    msgDiv.innerHTML = content;
    win.appendChild(msgDiv);
    win.scrollTop = win.scrollHeight;
}
