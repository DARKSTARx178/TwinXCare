export default function handler(req, res) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simple</title></head><body><div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial; padding:40px; font-size:18px;">To fully delete account and its data, email hu_yixiang_ethan@s2024.ssts.edu.sg or press the Assistance button on the home page and request your account and its data be deleted.</div></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
