export default async function handler(req, res) {
  // Safety: only expose the dev form when not in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Send Email - Dev Form</title>
    <style>
      body{font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,'Helvetica Neue',Arial; padding:20px;background:#f6f7fb}
      .card{background:#fff;padding:16px;border-radius:8px;max-width:720px;margin:0 auto;box-shadow:0 6px 18px rgba(0,0,0,.06)}
      label{display:block;margin-top:12px;font-weight:600}
      textarea{width:100%;min-height:120px;padding:8px;font-size:14px}
      input[type=text]{width:100%;padding:8px;font-size:14px}
      button{margin-top:12px;padding:10px 14px;border-radius:6px;background:#7B61FF;color:#fff;border:0}
      pre{background:#111;color:#0f0;padding:8px;border-radius:6px;overflow:auto}
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Send Email (dev)</h2>
      <form id="frm">
        <label>Username</label>
        <input id="username" type="text" placeholder="Your username or email" />
        <label>Type</label>
        <input id="type" type="text" placeholder="assistance or feedback" />
        <label>Message</label>
        <textarea id="message" placeholder="Type your message here"></textarea>
        <button type="submit">Send</button>
      </form>

      <h3>Response</h3>
      <pre id="result">No action yet</pre>
      <h3>Recent Logs</h3>
      <pre id="logs">-</pre>
    </div>

    <script>
      const frm = document.getElementById('frm');
      const result = document.getElementById('result');
      const logs = document.getElementById('logs');
      async function refreshLogs(){
        try{
          const r = await fetch('/api/send-email', {cache:'no-store'});
          const j = await r.json();
          logs.textContent = (j.logs || []).join('\n') || '-';
        }catch(e){ logs.textContent = 'Failed to fetch logs: '+e }
      }
      frm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        result.textContent = 'Sending...';
        const payload = {
          username: document.getElementById('username').value,
          type: document.getElementById('type').value,
          message: document.getElementById('message').value,
        };
        try{
          const r = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const j = await r.json();
          result.textContent = JSON.stringify(j, null, 2);
          if (j.logs) logs.textContent = j.logs.join('\n');
        }catch(err){ result.textContent = 'Error: '+err }
      });

      // refresh logs on load
      refreshLogs();
      // also poll logs every 5s while open
      setInterval(refreshLogs, 5000);
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
