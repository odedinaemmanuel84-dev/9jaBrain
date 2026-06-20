// --- CONFIGURATION ---
const BACKEND_URL = "https://nineja-ai-backend-5.onrender.com";
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let chatHistory = [];
let currentlyEditingId = null;
let selectedImageBase64 = null;
let selectedImageMime = null;

const ui = {
    input: document.getElementById('userInput'),
    display: document.getElementById('chatDisplay'),
    think: document.getElementById('thinkingIndicator'),
    voice: document.getElementById('voiceBtn'),
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
    if (!ui.input || !ui.voice || !ui.send) return;

    const hasText = ui.input.value.trim() !== "";
    const hasImage = selectedImageBase64 !== null;

    if (hasText || hasImage) {
        ui.voice.style.display = "none";
        ui.send.style.display = "flex";
    } else {
        ui.voice.style.display = "flex";
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

    const now = new Date();

    const dateString = now.toLocaleString('en-NG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const textWithDate = `[Current Date: ${dateString}] ${text}`;

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

                let messageParts = [{ text: textWithDate }];

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
        const msgId = 'msg-' + Date.now();

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

        let messageParts = [{ text: textWithDate }];

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

const data = await response.json();

if (data.reply) {  

        chatHistory.push({  
            role: "assistant",  
            parts: [{ text: data.reply }]  
        });  

        appendAiBubble(data.reply);  

    } else {  

        appendAiBubble("Omo, Naija AI is speechless. Try refreshing?");  
    }  

} catch (e) {  

    console.error("Fetch Error:", e);  

    if (ui.think) {  
        ui.think.style.display = 'none';  
    }  

    if (e.message.includes("Failed to fetch")) {  

        appendAiBubble(  
            "Omo, Render is still waking up the server. Give it 30 seconds and try again!"  
        );  

    } else {  

        appendAiBubble(  
            `Error: ${e.message}. Check your Render logs, Oga.`  
        );  
    }  
}

}

// --- 5. UI BUBBLES & TEXT PROCESSING ---

// Replace your existing formatAIResponse(text) with this function.
// It uses marked + DOMPurify when available, otherwise falls back to a safer minimal renderer.
// It also post-processes fenced code blocks into your .code-container UI and calls copyCode(this)
// so your existing copy handler will keep working.

function formatAIResponse(text) {
  if (!text) return "";

  // Helper: escape HTML for fallback code blocks
  function escapeHtml(s) {
    return (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // If marked + DOMPurify are available, use them (recommended)
  if (window.marked && window.DOMPurify) {
    // Configure marked for GitHub-flavored markdown
    marked.setOptions({
      gfm: true,
      breaks: false,
      smartLists: true,
      smartypants: false
    });

    // Convert markdown -> HTML
    const dirty = marked.parse(text);

    // Sanitize the produced HTML
    const clean = DOMPurify.sanitize(dirty, { ADD_ATTR: ["target"] });

    // Post-process HTML to wrap <pre><code> blocks into your code-container markup
    const tmp = document.createElement("div");
    tmp.innerHTML = clean;

    tmp.querySelectorAll("pre > code").forEach((codeEl, i) => {
      const pre = codeEl.closest("pre");
      const langClass = codeEl.className || "";
      const langMatch = langClass.match(/language-(\w+)/);
      const lang = (langMatch && langMatch[1]) ? langMatch[1] : "";

      // Build container
      const container = document.createElement("div");
      container.className = "code-container";

      const header = document.createElement("div");
      header.className = "code-header";
      const langLabel = document.createElement("span");
      langLabel.textContent = (lang || "code").toUpperCase();
      header.appendChild(langLabel);

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.type = "button";
      // Use your existing copyCode function when available
      if (typeof copyCode === "function") {
        copyBtn.setAttribute("onclick", "copyCode(this)");
      } else {
        // fallback copy handler uses navigator API
        copyBtn.addEventListener("click", () => {
          const codeText = codeEl.textContent || "";
          navigator.clipboard && navigator.clipboard.writeText(codeText).catch(()=>{});
        });
      }
      copyBtn.innerHTML = '<i class="far fa-copy"></i> Copy';
      header.appendChild(copyBtn);

      container.appendChild(header);

      // Clone the pre/code and append
      const clonedPre = pre.cloneNode(true);
      container.appendChild(clonedPre);

      // Replace the original pre with the new container
      pre.replaceWith(container);
    });

    return tmp.innerHTML;
  }

  // Fallback minimal renderer (no external libs) - supports headings, bold, italics, lists, blockquotes, inline code, fenced code
  // This fallback is conservative and escapes code blocks properly.
  // 1) Extract fenced code blocks first
  const codeBlocks = [];
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
    const id = codeBlocks.length;
    codeBlocks.push({ lang: lang || "", code: code });
    return `@@CODE_BLOCK_${id}@@`;
  });

  // Headings
  text = text.replace(/^###### (.*$)/gm, "<h6>$1</h6>");
  text = text.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
  text = text.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Blockquotes
  text = text.replace(/^\> (.*$)/gm, "<blockquote>$1</blockquote>");

  // Bold & italics
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists (naive)
  text = text.replace(/(^|\n)(?:\s*[-\*\+]\s+.+)+/g, (m) => {
    return m.replace(/(?:\n|^)\s*[-\*\+]\s+(.+)/g, "\n<li>$1</li>").replace(/^\n/, "").replace(/\n/g, "");
  }).replace(/(<li>.*<\/li>)/, "<ul>$1</ul>");

  // Ordered lists (naive)
  text = text.replace(/(^|\n)(?:\s*\d+\.\s+.+)+/g, (m) => {
    return m.replace(/(?:\n|^)\s*\d+\.\s+(.+)/g, "\n<li>$1</li>").replace(/^\n/, "").replace(/\n/g, "");
  }).replace(/(<li>.*<\/li>)/, "<ol>$1</ol>");

  // Paragraphs: split on double-newline
  const parts = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const html = parts.map(p => {
    if (/^<(h\d|ul|ol|blockquote|pre|div|p|code)/.test(p)) return p;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  // Restore code blocks into .code-container markup
  const out = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (m, idx) => {
    const cb = codeBlocks[Number(idx)];
    const safe = escapeHtml(cb.code);
    // Keep the copy button which will call copyCode(this) if exists; otherwise navigator fallback
    return `<div class="code-container">
      <div class="code-header">
        <span>${(cb.lang || 'code').toUpperCase()}</span>
        <button class="copy-btn" type="button" onclick="(typeof copyCode==='function'?copyCode(this):(function(btn){const pre=btn.nextElementSibling;const t=pre?pre.innerText:'';navigator.clipboard&&navigator.clipboard.writeText(t);})(this));"><i class="far fa-copy"></i> Copy</button>
      </div>
      <pre><code>${safe}</code></pre>
    </div>`;
  });

  return out;
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

            <div class="message-actions">

                <button class="msg-action-btn"
                    onclick="copyAiMessage(this)">
                    <i class="far fa-copy"></i>
                </button>

                <button class="msg-action-btn"
                    onclick="shareMessage(this)">
                    <i class="fas fa-share"></i>
                </button>

                 <button class="msg-action-btn like-btn"
                    onclick="sendFeedback(this,'like')">
                    <i class="far fa-thumbs-up"></i>
                </button>

                <button class="msg-action-btn dislike-btn"
                     onclick="sendFeedback(this,'dislike')">
                    <i class="far fa-thumbs-down"></i>
                </button>

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

async function copyCode(buttonElement) {

    const codeBlock = buttonElement
        .parentElement
        .nextElementSibling
        .querySelector('code');

    if (!codeBlock) return;

    try {

        await navigator.clipboard.writeText(codeBlock.innerText);

        buttonElement.innerHTML =
            '<i class="fas fa-check"></i> Copied!';

        buttonElement.style.borderColor = 'var(--accent)';

        setTimeout(() => {

            buttonElement.innerHTML =
                '<i class="far fa-copy"></i> Copy';

            buttonElement.style.borderColor = '#444';

        }, 2000);

    } catch (err) {

        console.error('Failed to copy text:', err);
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
