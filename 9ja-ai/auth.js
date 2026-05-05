const SUPABASE_URL = "https://fkizxpuzwuerryoguyyu.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Use your full key
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let mode = 'login';

function toggleAuth(type) {
    mode = type;
    document.getElementById('loginTab').className = (type === 'login') ? 'active' : '';
    document.getElementById('registerTab').className = (type === 'register') ? 'active' : '';
    document.getElementById('nameField').style.display = (type === 'register') ? 'block' : 'none';
    document.getElementById('authBtn').innerText = (type === 'login') ? 'Welcome Back' : 'Create Account';
}

document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const msg = document.getElementById('authMsg');

    msg.innerText = "Processing...";

    if (mode === 'register') {
        // REGISTER LOGIC
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });

        if (error) {
            // Check if user already exists
            if (error.message.includes("already registered")) {
                msg.style.color = "orange";
                msg.innerText = "User already exist! Abeg login.";
            } else {
                msg.style.color = "red";
                msg.innerText = error.message;
            }
        } else {
            msg.style.color = "var(--primary)";
            msg.innerText = "Registration successful! Check your email.";
        }
    } else {
        // LOGIN LOGIC
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            msg.style.color = "red";
            msg.innerText = "Invalid login details.";
        } else {
            window.location.href = "index.html"; // Go to chat
        }
    }
};
