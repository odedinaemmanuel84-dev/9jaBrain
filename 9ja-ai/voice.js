const BACKEND_WS_URL = "wss://your-render-app.onrender.com/voice"; // Use wss:// for Render
let socket;
let myVAD;

async function initVoice() {
    const status = document.getElementById('callStatus');
    const stateText = document.getElementById('aiStateText');

    // 1. Connect to Backend WebSocket
    socket = new WebSocket(BACKEND_WS_URL);

    socket.onopen = () => {
        status.innerText = "Live";
        status.style.background = "#00ff88";
        startListening();
    };

    socket.onmessage = async (event) => {
        // AI sends audio back as Blobs or Base64
        const audioBlob = new Blob([event.data], { type: 'audio/pcm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        stateText.innerText = "Naija AI is speaking...";
        document.querySelector('.avatar-glow').classList.add('talking');
        
        await audio.play();
        
        audio.onended = () => {
            stateText.innerText = "Naija AI is listening...";
            document.querySelector('.avatar-glow').classList.remove('talking');
        };
    };

    socket.onerror = () => {
        status.innerText = "Error";
        status.style.background = "#ff4d4d";
    };
}

async function startListening() {
    // 2. Initialize VAD (Voice Activity Detection)
    myVAD = await vad.mic.create({
        onSpeechStart: () => {
            console.log("User started talking");
            // If AI is talking, stop it (Barge-in)
            socket.send(JSON.stringify({ type: "INTERRUPT" }));
        },
        onSpeechEnd: (audio) => {
            console.log("User finished talking");
            // Send audio data to backend
            socket.send(audio.buffer);
        }
    });
    myVAD.receive();
}

// Mute Toggle
let isMuted = false;
document.getElementById('muteBtn').onclick = () => {
    isMuted = !isMuted;
    if (isMuted) {
        myVAD.pause();
        document.getElementById('muteBtn').innerHTML = '<i class="fas fa-microphone-slash"></i>';
        document.getElementById('muteBtn').classList.add('muted');
    } else {
        myVAD.receive();
        document.getElementById('muteBtn').innerHTML = '<i class="fas fa-microphone"></i>';
        document.getElementById('muteBtn').classList.remove('muted');
    }
};

initVoice();
