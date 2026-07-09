// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = [];
let currentlyEditingId = null;
let selectedImageBase64 = null;
let selectedImageMime = null;
let isRegenerating = false;

const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    micBtn: document.getElementById("micBtn"),
    voiceBtn: document.getElementById("voiceBtn"),
    send: document.getElementById('sendBtn'),
    pfp: document.getElementById('userImg'),
    sidebar: document.getElementById('sidebar'),
    logout: document.getElementById('logoutBtn'),
    welcome: document.getElementById('welcomeScreen'),
    userName: document.getElementById('userName'),
    fileInput: document.getElementById('imageUpload'),
    previewContainer: document.getElementById('imagePreviewContainer'),
    previewImg: document.getElementById('imagePreview'),
    removeImg: document.getElementById('removeImgBtn')
};

ui.input.addEventListener("input", autoResize);

function autoResize() {

    ui.input.style.height = "24px";

    ui.input.style.height =
        Math.min(ui.input.scrollHeight, 180) + "px";

    ui.input.style.overflowY =
        ui.input.scrollHeight > 180
            ? "auto"
            : "hidden";

    }

// --- 1. INITIALIZATION ---
async function init() {
    try {
        const { data: { user } } = await sb.auth.getUser();

        if (!user) {
            window.location.href = "auth.html";
            return;
        }

        if (user.user_metadata?.avatar_url && ui.pfp) {
            ui.pfp.src = user.user_metadata.avatar_url;
        }

        const name = user.user_metadata?.first_name || "Oga";

        if (ui.userName) {
            ui.userName.innerText = name;
        }

        await loadSidebarHistory();

    } catch (err) {
        console.error("Initialization error:", err);
    }

    activateTriggers();
    toggleButtons();
}

// --- 2. ACTIVATION & BUTTON LOGIC ---
function toggleButtons() {

    if (!ui.input || !ui.voiceBtn || !ui.micBtn || !ui.send) return;

    const hasText = ui.input.value.trim() !== "";
    const hasImage = selectedImageBase64 !== null;

    if (hasText || hasImage) {

        ui.voiceBtn.style.display = "none";
        ui.micBtn.style.display = "none";
        ui.send.style.display = "flex";

    } else {

        ui.voiceBtn.style.display = "flex";
        ui.micBtn.style.display = "flex";
        ui.send.style.display = "none";

    }
}

function activateTriggers() {

    // LOGOUT
    if (ui.logout) {
        ui.logout.onclick = async (e) => {
            e.preventDefault();

            try {
                await sb.auth.signOut();
            } catch (err) {
                console.error(err);
            }

            window.location.href = "auth.html";
        };
    }

    // SEND BUTTON
    if (ui.send) {
        ui.send.onclick = (e) => {
            e.preventDefault();
            sendMessage();
        };
    }

    // INPUT EVENTS
    if (ui.input) {

        ui.input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        ui.input.oninput = toggleButtons;
    }

    // SIDEBAR
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeSidebar');

    if (menuBtn && ui.sidebar) {
        menuBtn.onclick = () => {
            ui.sidebar.classList.add('active');
        };
    }

    if (closeBtn && ui.sidebar) {
        closeBtn.onclick = () => {
            ui.sidebar.classList.remove('active');
        };
    }

// --- FINAL PRODUCTION MOBILE IMAGE EVENT STREAM ---
const plusButtonElement = document.querySelector('.plus-btn');

if (plusButtonElement) {

    plusButtonElement.onclick = (e) => {

        e.preventDefault();

        const nativePicker = document.createElement('input');

        nativePicker.type = 'file';

        nativePicker.accept = 'image/*';

        nativePicker.onchange = (event) => {

            const filesList = event.target.files;

            if (!filesList || filesList.length === 0) return;

            // ✅ REAL FILE
            const file = filesList[0];

            if (!file) return;

            console.log("REAL IMAGE:", file.name, file.size);

            const reader = new FileReader();

           reader.onload = (fileEvent) => {

    const dataUrl = fileEvent.target.result;

    if (!dataUrl) {
        alert("Image conversion failed");
        return;
    }

    const targetPreview =
        document.getElementById('imagePreview');

    const targetContainer =
        document.getElementById('imagePreviewContainer');

    const targetWrapper =
        document.getElementById('expandingContainer');

    // ✅ IMAGE COMPRESSION SYSTEM
    const img = new Image();

    img.onload = () => {

        const canvas =
            document.createElement("canvas");

        const maxWidth = 1200;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {

            height *= maxWidth / width;

            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, width, height);

        // ✅ COMPRESS IMAGE
        const compressedDataUrl =
            canvas.toDataURL("image/jpeg", 0.7);

        // ✅ STORE CLEAN BASE64
        selectedImageBase64 =
            compressedDataUrl.split(',')[1];

        selectedImageMime = "image/jpeg";

        console.log(
            "Compressed Image Ready"
        );

        if (targetPreview && targetContainer) {

            targetPreview.src =
                compressedDataUrl;

            targetContainer.style.display =
                "flex";

            if (targetWrapper) {
                targetWrapper.style.minHeight =
                    "120px";
            }
        }

        toggleButtons();
    };

    img.src = dataUrl;
}; 
           
            reader.onerror = (err) => {
                console.error("Reader Error:", err);
                alert("Image failed to load");
            };

            reader.readAsDataURL(file);
        };

        nativePicker.click();
    };
}
    
    // REMOVE IMAGE
    if (ui.removeImg) {

        ui.removeImg.onclick = () => {

            selectedImageBase64 = null;
            selectedImageMime = null;

            if (ui.fileInput) {
                ui.fileInput.value = "";
            }

            if (ui.previewContainer) {
                ui.previewContainer.style.setProperty('display', 'none', 'important');
            }

            if (ui.previewImg) {
                ui.previewImg.src = "";
            }

            const expandingContainer = document.getElementById('expandingContainer');

            if (expandingContainer) {
                expandingContainer.style.cssText = "";
            }

            toggleButtons();
        };
    }
}

// --- 3. SUGGESTION LOGIC ---
function useSuggestion(text) {

    if (!ui.input) return;

    ui.input.value = text;

    toggleButtons();

    sendMessage();
}

// --- 4. MESSAGE TRANSMISSION ---
async function sendMessage() {

    if (!ui.input) return;

    const text = ui.input.value.trim();

    if (!text && !selectedImageBase64) return;

    if (ui.welcome) {
        ui.welcome.style.display = 'none';
    }

    // --- EDIT MODE ---
    if (currentlyEditingId) {

        const userWrapper = document.getElementById(currentlyEditingId);

        if (userWrapper) {

            let newContent = "";

            if (selectedImageBase64) {

                newContent = `
                    <div class="msg-image-container">
                        <img src="data:${selectedImageMime};base64,${selectedImageBase64}" style="max-width:200px; border-radius:8px;">
                    </div>
                    <div class="msg-text">${escapeHtml(text)}</div>
                `;

            } else {

                newContent = `<div class="msg-text">${escapeHtml(text)}</div>`;
            }

            const bubble = userWrapper.querySelector('.user-msg-bubble');

            if (bubble) {
                bubble.innerHTML = newContent;
            }

            while (
                userWrapper.nextElementSibling &&
                userWrapper.nextElementSibling !== ui.think
            ) {
                userWrapper.nextElementSibling.remove();
            }

            const histIndex = chatHistory.findIndex(m => m.id === currentlyEditingId);

            if (histIndex !== -1) {

                let messageParts = [{ text: text }];

                if (selectedImageBase64) {
                    messageParts.push({
                        inlineData: {
                            mimeType: selectedImageMime,
                            data: selectedImageBase64
                        }
                    });
                }

                chatHistory[histIndex].parts = messageParts;

                chatHistory = chatHistory.slice(0, histIndex + 1);
            }
        }

        if (ui.think) {
            ui.display.appendChild(ui.think);
            ui.think.style.display = 'flex';
        }

        currentlyEditingId = null;

        if (ui.send) {
            ui.send.innerHTML = '<i class="fas fa-arrow-up"></i>';
        }

    } else {

        // --- NEW MESSAGE ---
         const msgId = "msg-" + Date.now();

        let displayHTML = "";

        if (selectedImageBase64) {

            displayHTML = `
                <div class="msg-image-container">
                    <img src="data:${selectedImageMime};base64,${selectedImageBase64}" style="max-width:200px; border-radius:8px;">
                </div>
                <div class="msg-text">${escapeHtml(text)}</div>
            `;

        } else {

            displayHTML = `<div class="msg-text">${escapeHtml(text)}</div>`;
        }

        appendBubble('user', displayHTML, msgId);

        let messageParts = [{ text: text }];

        if (selectedImageBase64) {

            messageParts.push({
                inlineData: {
                    mimeType: selectedImageMime,
                    data: selectedImageBase64
                }
            });
        }

        chatHistory.push({
            role: "user",
            parts: messageParts,
            id: msgId
        });

        if (ui.think) {
            ui.display.appendChild(ui.think);
            ui.think.style.display = 'flex';
        }
    }

    // SAVE BEFORE RESET
    const sendingImage = selectedImageBase64;
    const sendingMime = selectedImageMime;
    
    // RESET UI
    ui.input.value = "";

    ui.input.style.height = "24px";
    ui.input.style.overflowY = "hidden";
    
    selectedImageBase64 = null;
    selectedImageMime = null;

    if (ui.fileInput) {
        ui.fileInput.value = "";
    }

    if (ui.previewContainer) {
        ui.previewContainer.style.setProperty('display', 'none', 'important');
    }

    const expandingContainer = document.getElementById('expandingContainer');

    if (expandingContainer) {
        expandingContainer.style.cssText = "";
    }

    toggleButtons();

    if (ui.display) {
        ui.display.scrollTop = ui.display.scrollHeight;
    }

    // --- API REQUEST ---
    try {

        const { data: { user } } = await sb.auth.getUser();

        let response;

        // --- IMAGE ROUTE ---
     if (sendingImage) {

// SAVE IMAGE INSIDE CHAT HISTORY
chatHistory.push({
    role: "user",
    parts: [
        {
            text: text || "Explain this image"
        },
        {
            image: `data:${sendingMime};base64,${sendingImage}`
        }
    ]
});

const visionPayload = {
    messages: chatHistory,
    prompt: text || "Explain wetin dey inside this image in Pidgin."
};

response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(visionPayload)
});

     } else {
            
         // --- CHAT ROUTE ---
            const chatPayload = {
                messages: chatHistory.map(msg => ({
                    role: msg.role,
                    parts: msg.parts
                })),
                user_id: user?.id || null
            };

            response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatPayload)
            });
        }

        if (ui.think) {
            ui.think.style.display = 'none';
        }

        if (!response.ok) {

    const errorData = await response.json().catch(() => ({}));

    throw new Error(
        errorData.error || `Server status: ${response.status}`
    );
        }

    const reader = response.body.getReader();

const decoder = new TextDecoder();

let aiReply = "";

const aiId = "ai-" + Date.now();

window.lastAiId = aiId;
        
appendBubble("ai", "", aiId);

const aiBubble = document
    .getElementById(aiId)
    .querySelector(".ai-msg-bubble");

while (true) {

    const { done, value } =
        await reader.read();

    if (done) break;

    const chunk =
        decoder.decode(value);

    const lines =
        chunk.split("\n");

    for (const line of lines) {

        if (!line.startsWith("data: ")) continue;

        const text =
            line.replace("data: ", "");

        if (text === "[DONE]") continue;

        try {

            const json =
                JSON.parse(text);

            aiReply += json.token;

            await smoothType(
                aiBubble,
                aiReply
            );

            ui.display.scrollTop =
                ui.display.scrollHeight;

        } catch (err) {

            console.error(err);

        }

    }

}

  // Save to memory      

        aiBubble.innerHTML =
    formatAIResponse(aiReply);

Prism.highlightAllUnder(aiBubble);
        
aiBubble.classList.remove("typing");

addAiActions(aiId);

window.lastResponse = aiReply;

chatHistory.push({
    role: "assistant",
    parts: [
        {
            text: aiReply
        }
    ]
});    

} catch (e) {

    console.error("Fetch Error:", e);

    if (ui.think) {
        ui.think.style.display = 'none';
    }

    let message = "Omo, something no work. Try again small.";

    // User has no internet
    if (!navigator.onLine) {

        message = "Omo, network wahala. Check your internet connection and try again.";

    }

    // Render server is sleeping
    else if (e.message.includes("Failed to fetch")) {

        message = "Naija AI dey wake up. Give am about 30 seconds and try again.";

    }

    // Server busy
    else if (
        e.message.includes("429") ||
        e.message.toLowerCase().includes("busy")
    ) {

        message = "Naija AI dey busy. Try again in a few seconds.";

    }

    // Show backend message if available
    else if (e.message) {

        message = e.message;

    }

    appendAiBubble(message);

    }

}

async function regenerateResponse() {

    if (!window.lastPrompt) return;

    // Remove previous AI response
    if (window.lastAiId) {
        document.getElementById(window.lastAiId)?.remove();
    }

    // Remove assistant from memory
    if (
        chatHistory.length &&
        chatHistory[chatHistory.length - 1].role === "assistant"
    ) {
        chatHistory.pop();
    }

    // Call sendMessage again using the same prompt
    ui.input.value = window.lastPrompt.text;

    if (window.lastPrompt.sendingImage) {
        selectedImageBase64 = window.lastPrompt.sendingImage;
        selectedImageMime = window.lastPrompt.sendingMime;
    }

    await sendMessage();
}

// --- 5. UI BUBBLES & TEXT PROCESSING ---

function formatAIResponse(text) {

    if (!text) return "";

    // Save code blocks first
    const codeBlocks = [];

    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {

        const id = "code-" + Math.random().toString(36).substring(2);

        codeBlocks.push(`
<div class="code-block">

    <div class="code-header">
        <span>${(lang || "CODE").toUpperCase()}</span>

        <button
            class="copy-code-btn"
            onclick="copyCode('${id}', this)">
            <i class="far fa-copy"></i> Copy
        </button>
    </div>

<pre><code id="${id}" class="language-${lang || "markup"}">${escapeHtml(code.trim())}</code></pre>

</div>
`);

        return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
    });

    // Headings
    text = text.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.*)$/gm, "<h1>$1</h1>");

    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline code
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links
    text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank">$1</a>'
    );

    // Line breaks
    text = text.replace(/\n/g, "<br>");

    // Restore code blocks LAST
    text = text.replace(/%%CODEBLOCK(\d+)%%/g, (_, index) => codeBlocks[index]);

    return text;
}

let typingQueue = [];
let typingRunning = false;

async function smoothType(element, fullText) {

    typingQueue.push({
        element,
        fullText
    });

    if (typingRunning) return;

    typingRunning = true;

    while (typingQueue.length > 0) {

        const item = typingQueue.shift();

        item.element.innerHTML =
            formatAIResponse(item.fullText) +
            '<span class="typing-cursor">▋</span>';

        await new Promise(resolve =>
            requestAnimationFrame(resolve)
        );
    }

    typingRunning = false;
}

function escapeHtml(text) {

    if (!text) return "";

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
                 }

function appendBubble(role, contentHTML, msgId) {

    if (!ui.display) return;

    const wrapper = document.createElement('div');
    wrapper.id = msgId;

    if (role === 'user') {

        wrapper.className = 'user-msg-container';

        wrapper.innerHTML = `
            <div class="user-message-wrapper">

                <div class="user-msg-bubble">
                    ${contentHTML}
                </div>

                <div class="message-actions">
                    <button class="msg-action-btn"
                        onclick="copyUserMessage(this)">
                        <i class="far fa-copy"></i>
                    </button>

                    <button class="msg-action-btn"
                        onclick="editMessage('${msgId}')">
                        <i class="fas fa-pen"></i>
                    </button>
                </div>

            </div>
        `;

} else {

    wrapper.className = 'ai-msg-container';

    wrapper.innerHTML = `
        <div class="ai-message-wrapper">

            <div class="ai-msg-bubble">
                ${contentHTML}
            </div>

        </div>
    `;
    }

    if (ui.think) {
        ui.display.insertBefore(wrapper, ui.think);
    } else {
        ui.display.appendChild(wrapper);
    }

    ui.display.scrollTop = ui.display.scrollHeight;
    }

// 👇 Put it here (outside appendBubble)

function addAiActions(aiId) {

    const wrapper = document.getElementById(aiId);

    if (!wrapper) return;

    const messageWrapper = wrapper.querySelector(".ai-message-wrapper");

    const actions = document.createElement("div");

    actions.className = "message-actions";

    actions.innerHTML = `
        <button class="msg-action-btn"
            onclick="copyAiMessage(this)">
            <i class="far fa-copy"></i>
        </button>

        <button class="msg-action-btn"
            onclick="shareMessage(this)">
            <i class="fas fa-share"></i>
        </button>

        <button class="msg-action-btn"
         onclick="regenerateResponse()">
           <i class="fas fa-rotate-right"></i>
        </button>

        <button class="msg-action-btn like-btn"
            onclick="sendFeedback(this,'like')">
            <i class="far fa-thumbs-up"></i>
        </button>

        <button class="msg-action-btn dislike-btn"
            onclick="sendFeedback(this,'dislike')">
            <i class="far fa-thumbs-down"></i>
        </button>
    `;

    messageWrapper.appendChild(actions);
}

function appendAiBubble(rawText) {

    const formattedHTML = formatAIResponse(rawText);

    appendBubble(
        'ai',
        formattedHTML,
        'ai-' + Date.now()
    );
}

async function editMessage(msgId) {

    const wrapper = document.getElementById(msgId);

    if (!wrapper || !ui.input) return;

    const textNode = wrapper.querySelector('.msg-text');

    if (!textNode) return;

    ui.input.value = textNode.innerText;

    currentlyEditingId = msgId;

    ui.input.focus();

    if (ui.send) {
        ui.send.innerHTML = '<i class="fas fa-check"></i>';
    }

    toggleButtons();
}

async function copyCode(id, button) {

    const code = document.getElementById(id);

    if (!code) return;

    try {

        await navigator.clipboard.writeText(code.innerText);

        button.innerHTML =
            '<i class="fas fa-check"></i> Copied';

        setTimeout(() => {

            button.innerHTML =
                '<i class="far fa-copy"></i> Copy';

        }, 2000);

    } catch (err) {

        console.error(err);

    }

}

async function copyAiMessage(button) {

    const bubble = button
        .closest('.ai-message-wrapper')
        .querySelector('.ai-msg-bubble');

    if (!bubble) return;

    try {

        await navigator.clipboard.writeText(bubble.innerText);

        const old = button.innerHTML;

        button.innerHTML = '<i class="fas fa-check"></i>';

        setTimeout(() => {
            button.innerHTML = old;
        }, 2000);

    } catch (err) {

        console.error(err);
    }
}

async function copyUserMessage(button) {

    const bubble = button
        .closest('.user-message-wrapper')
        .querySelector('.user-msg-bubble');

    if (!bubble) return;

    try {

        await navigator.clipboard.writeText(bubble.innerText);

        const old = button.innerHTML;

        button.innerHTML = '<i class="fas fa-check"></i>';

        setTimeout(() => {
            button.innerHTML = old;
        }, 2000);

    } catch (err) {

        console.error(err);
    }
}

async function sendFeedback(btn, type) {

    const wrapper = btn.closest('.ai-message-wrapper');

    if (!wrapper) return;

    // Get both feedback buttons
    const likeBtn = wrapper.querySelector('.like-btn');
    const dislikeBtn = wrapper.querySelector('.dislike-btn');

    // Reset buttons to normal state
    if (likeBtn) {
        likeBtn.classList.remove('active-like');
        likeBtn.innerHTML =
            '<i class="fas fa-thumbs-up"></i>';
    }

    if (dislikeBtn) {
        dislikeBtn.classList.remove('active-dislike');
        dislikeBtn.innerHTML =
            '<i class="fas fa-thumbs-down"></i>';
    }

    // Activate selected button
    if (type === 'like' && likeBtn) {

        likeBtn.classList.add('active-like');

        likeBtn.innerHTML =
            '<i class="fas fa-check"></i>';

    } else if (type === 'dislike' && dislikeBtn) {

        dislikeBtn.classList.add('active-dislike');

        dislikeBtn.innerHTML =
            '<i class="fas fa-check"></i>';
    }

    try {

        const message = wrapper
            .querySelector('.ai-msg-bubble')
            ?.innerText || "";

        const response = await fetch(
            `${BACKEND_URL}/api/feedback`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    message
                })
            }
        );

        const data = await response.json();

        if (data.success) {

            showFeedbackToast(
                "Thanks for your feedback."
            );

        } else {

            showFeedbackToast(
                "Feedback could not be saved."
            );
        }

    } catch (err) {

        console.error(
            'Feedback failed:',
            err
        );

        showFeedbackToast(
            "Failed to send feedback."
        );
    }
}
    
async function shareMessage(button) {

    const bubble = button
        .closest('.ai-message-wrapper')
        .querySelector('.ai-msg-bubble');

    if (!bubble) return;

    const text = bubble.innerText;

    try {

        if (navigator.share) {

            await navigator.share({
                title: "Naija AI",
                text
            });

        } else {

            await navigator.clipboard.writeText(text);

            alert("Message copied. You can now share it.");
        }

    } catch (err) {

        console.error(err);
    }
}

function likeMessage(button) {

    const wrapper = button.closest('.message-actions');

    if (!wrapper) return;

    wrapper.querySelectorAll('.like-btn')
        .forEach(btn => btn.classList.remove('active-like'));

    wrapper.querySelectorAll('.dislike-btn')
        .forEach(btn => btn.classList.remove('active-dislike'));

    button.classList.add('active-like');
}

function dislikeMessage(button) {

    const wrapper = button.closest('.message-actions');

    if (!wrapper) return;

    wrapper.querySelectorAll('.like-btn')
        .forEach(btn => btn.classList.remove('active-like'));

    wrapper.querySelectorAll('.dislike-btn')
        .forEach(btn => btn.classList.remove('active-dislike'));

    button.classList.add('active-dislike');
}

// --- 6. SIDEBAR HISTORY MANAGEMENT ---
async function loadSidebarHistory() {

    try {

        const { data: { user } } = await sb.auth.getUser();

        if (!user) return;

        const historyList = document.getElementById('chatHistoryList');

        if (!historyList) return;

        historyList.innerHTML = '';

        const listItem = document.createElement('div');

        listItem.className = 'history-item active';

        listItem.innerHTML = `
            <i class="far fa-comments"></i>
            <span>Current Conversation</span>
        `;

        historyList.appendChild(listItem);

    } catch (err) {

        console.error("Error building sidebar tree:", err);
    }
}

function showFeedbackToast(message) {

    let toast = document.getElementById(
        'feedbackToast'
    );

    if (!toast) {

        toast = document.createElement('div');

        toast.id = 'feedbackToast';

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add('show');

    clearTimeout(toast.hideTimer);

    toast.hideTimer = setTimeout(() => {

        toast.classList.remove('show');

    }, 2500);
}

init();
