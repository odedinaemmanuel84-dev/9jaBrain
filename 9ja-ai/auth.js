const SUPABASE_URL = " https://fkizxpuzwuerryoguyyu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraXp4cHV6d3VlcnJ5b2d1eXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTM4NjIsImV4cCI6MjA5MzIyOTg2Mn0.P7plmQphMbXqvF84qIE4iJNJO51wvSUuhWnbXL-frTA"; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authBtn = document.getElementById('authBtn');
const toggleAuth = document.getElementById('toggleAuth');
let isLogin = true;

toggleAuth.onclick = () => {
    isLogin = !isLogin;
    document.getElementById('authTitle').innerText = isLogin ? "Login" : "Register";
    authBtn.innerText = isLogin ? "Enter Gist" : "Sign Up";
    toggleAuth.innerHTML = isLogin ? "No get account? <b>Register here</b>" : "Get account? <b>Login here</b>";
};

authBtn.onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (isLogin) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else window.location.href = "index.html";
    } else {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) alert(error.message);
        else alert("Check your email to confirm!");
    }
};
