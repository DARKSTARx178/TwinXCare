export default function handler(req, res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TwinXCare System Logs</title>
  <style>
    body { background-color: #1e1e1e; color: #d4d4d4; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; margin: 0; padding: 20px; font-size: 14px; }
    #login-container { max-width: 400px; margin: 100px auto; background: #252526; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-align: center; }
    input { width: 100%; padding: 10px; margin-bottom: 10px; background: #3c3c3c; border: 1px solid #555; color: #fff; border-radius: 4px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #0e639c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    button:hover { background: #1177bb; }
    #logs-container { display: none; }
    .log-entry { padding: 4px 0; border-bottom: 1px solid #333; display: flex; }
    .timestamp { color: #888; margin-right: 10px; min-width: 150px; }
    .level { margin-right: 10px; font-weight: bold; min-width: 50px; text-transform: uppercase; }
    .level.info { color: #4ec9b0; }
    .level.warn { color: #cca700; }
    .level.error { color: #f14c4c; }
    .message { white-space: pre-wrap; word-break: break-word; flex: 1; }
    #header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; }
    #status { color: #888; }
  </style>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBLq5KEYwGoODg-IhX-KD_wq7glWW719d0",
      authDomain: "twinxcarebackend.firebaseapp.com",
      projectId: "twinxcarebackend",
      storageBucket: "twinxcarebackend.firebasestorage.app",
      messagingSenderId: "791637368111",
      appId: "1:791637368111:web:2110bb059b6427ca3295da"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const loginContainer = document.getElementById('login-container');
    const logsContainer = document.getElementById('logs-container');
    const logsList = document.getElementById('logs-list');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMsg = document.getElementById('error-msg');

    let unsubscribe = null;

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verify admin role in Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            showLogs();
          } else {
            alert('Access Denied: Admins only.');
            await signOut(auth);
          }
        } catch (e) {
          console.error(e);
          alert('Error verifying role');
          await signOut(auth);
        }
      } else {
        showLogin();
      }
    });

    loginBtn.addEventListener('click', async () => {
      try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      } catch (e) {
        errorMsg.textContent = e.message;
        errorMsg.style.color = '#f14c4c';
      }
    });

    logoutBtn.addEventListener('click', () => signOut(auth));

    function showLogin() {
      loginContainer.style.display = 'block';
      logsContainer.style.display = 'none';
      if (unsubscribe) unsubscribe();
      logsList.innerHTML = '';
    }

    function showLogs() {
      loginContainer.style.display = 'none';
      logsContainer.style.display = 'block';
      const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(100));
      unsubscribe = onSnapshot(q, (snapshot) => {
      logsList.innerHTML = snapshot.docs.map(doc => {
        const data = doc.data();
        const ts = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : data.clientTimestamp;
        return '<div class="log-entry"><span class="timestamp">' + ts + '</span><span class="level ' + data.level + '">' + data.level + '</span><span class="message">' + escapeHtml(data.message) + '</span></div>';
      }).join('');
    });
    }

    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  </script>
</head>
<body>
  <div id="login-container">
    <h2 style="color: #fff; margin-top: 0;">Admin Login</h2>
    <input type="email" id="email" placeholder="Email" />
    <input type="password" id="password" placeholder="Password" />
    <button id="login-btn">Login</button>
    <p id="error-msg" style="margin-top: 10px;"></p>
  </div>

  <div id="logs-container">
    <div id="header">
      <h2 style="margin: 0;">System Logs (Live)</h2>
      <button id="logout-btn" style="width: auto; background: #333;">Logout</button>
    </div>
    <div id="logs-list"></div>
  </div>
</body>
</html>
  `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
}
