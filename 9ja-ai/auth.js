// 1. Configuration & Initialization
const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA"; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authForm = document.getElementById('authForm');
const authMsg = document.getElementById('authMsg');
const authBtn = document.getElementById('authBtn');
let mode = 'login';

// 2. Toggle between Login and Register
function toggleAuth(newMode) {
    mode = newMode;
    
    // Update Tab UI
    document.getElementById('loginTab').classList.toggle('active', mode === 'login');
    document.getElementById('registerTab').classList.toggle('active', mode === 'register');
    
    // Show/Hide Name Field
    document.getElementById('nameField').style.display = mode === 'register' ? 'block' : 'none';
    
    // Update Button Text
    authBtn.innerText = mode === 'login' ? 'Sign In' : 'Create Account';
    
    // Clear old messages
    authMsg.innerText = "";
}

// 3. Forgot Password Logic
document.querySelector('.forgot-link').onclick = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    
    if (!email) {
        authMsg.style.color = "var(--error)";
        authMsg.innerText = "Abeg enter your email first!";
        return;
    }
    
    authMsg.style.color = "var(--text-dim)";
    authMsg.innerText = "Sending reset link...";
    
    const { error } = await sb.auth.resetPasswordForEmail(email);
    
    if (error) {
        authMsg.style.color = "var(--error)";
        authMsg.innerText = error.message;
    } else {
        authMsg.style.color = "var(--primary)";
        authMsg.innerText = "Check your email to reset password!";
    }
};

// 4. Form Submission (Login & Register)
authForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;

    authMsg.innerText = "Abeg wait...";
    authMsg.style.color = "var(--text-dim)";

    if (mode === 'register') {
        // REGISTER LOGIC
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });

        if (error) {
            // Check for "User already exists" error
            if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
                authMsg.style.color = "var(--error)";
                authMsg.innerText = "Oga, user already exist! Just sign in.";
            } else {
                authMsg.style.color = "var(--error)";
                authMsg.innerText = error.message;
            }
        } else {
            authMsg.style.color = "var(--primary)";
            authMsg.innerText = "Registration successful! Check your email.";
        }
    } else {
        // LOGIN LOGIC
        const { error } = await sb.auth.signInWithPassword({ email, password });
        
        if (error) {
            authMsg.style.color = "var(--error)";
            authMsg.innerText = "Invalid login details. Check your email/password.";
        } else {
            // Success - Redirect to chat page
            window.location.href = "index.html"; 
        }
    }
};
