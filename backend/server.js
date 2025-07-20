import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword, comparePassword } from './hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, 'users.json');
const feedbackFilePath = path.join(__dirname, 'feedback.log');
const PORT = 8080;

async function readUsers() {
    try {
        await fs.access(usersFilePath);
        const data = await fs.readFile(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });

    req.on('end', async () => {
        try {
            const parsedBody = body ? JSON.parse(body) : {};
            const users = await readUsers();

            if (req.url === '/api/register' && req.method === 'POST') {
                const { username, password } = parsedBody;
                if (!username || !password) {
                    res.writeHead(400).end(JSON.stringify({ error: 'Username and password required' }));
                    return;
                }
                if (users[username]) {
                    res.writeHead(409).end(JSON.stringify({ error: 'User already exists' }));
                    return;
                }
                users[username] = { password: await hashPassword(password) };
                await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
                res.writeHead(201).end(JSON.stringify({ message: 'User registered successfully' }));

            } else if (req.url === '/api/login' && req.method === 'POST') {
                const { username, password } = parsedBody;
                if (!username || !password) {
                    res.writeHead(400).end(JSON.stringify({ error: 'Username and password required' }));
                    return;
                }
                const user = users[username];
                if (!user || !(await comparePassword(password, user.password))) {
                    res.writeHead(401).end(JSON.stringify({ error: 'Invalid credentials' }));
                    return;
                }
                res.writeHead(200).end(JSON.stringify({ message: 'Login successful' }));

            } else if (req.url === '/api/change-password' && req.method === 'POST') {
                const { username, oldPassword, newPassword } = parsedBody;
                if (!username || !oldPassword || !newPassword) {
                    res.writeHead(400).end(JSON.stringify({ error: 'All fields are required' }));
                    return;
                }
                const user = users[username];
                if (!user || !(await comparePassword(oldPassword, user.password))) {
                    res.writeHead(401).end(JSON.stringify({ error: 'Invalid username or old password' }));
                    return;
                }
                users[username].password = await hashPassword(newPassword);
                await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
                res.writeHead(200).end(JSON.stringify({ message: 'Password changed successfully' }));

            } else if (req.url === '/api/send-feedback' && req.method === 'POST') {
                const { username, feedback } = parsedBody;
                if (!feedback) {
                    res.writeHead(400).end(JSON.stringify({ error: 'Feedback message is required' }));
                    return;
                }
                const timestamp = new Date().toISOString();
                const entry = `[${timestamp}] (User: ${username || 'Anonymous'}): ${feedback}\n`;
                await fs.appendFile(feedbackFilePath, entry);
                res.writeHead(200).end(JSON.stringify({ message: 'Feedback received. Thank you!' }));

            } else if (req.url === '/api/getPasswords' && req.method === 'POST') {
                const { username, password } = parsedBody;
                const user = users[username];
                if (!user || username !== 'admin' || !(await comparePassword(password, user.password))) {
                    res.writeHead(403).end(JSON.stringify({ error: 'Forbidden' }));
                    return;
                }
                res.writeHead(200).end(JSON.stringify({ users: Object.keys(users) }));

            } else if (req.url === '/api/resetPassword' && req.method === 'POST') {
                const { adminUsername, adminPassword, targetUsername, newPassword } = parsedBody;
                if (!adminUsername || !adminPassword || !targetUsername || !newPassword) {
                    res.writeHead(400).end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                const admin = users[adminUsername];
                if (
                    !admin ||
                    adminUsername !== 'admin' ||
                    !(await comparePassword(adminPassword, admin.password))
                ) {
                    res.writeHead(403).end(JSON.stringify({ error: 'Admin authentication failed' }));
                    return;
                }
                if (!users[targetUsername]) {
                    res.writeHead(404).end(JSON.stringify({ error: 'Target user not found' }));
                    return;
                }
                users[targetUsername].password = await hashPassword(newPassword);
                await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
                res.writeHead(200).end(JSON.stringify({ message: 'Password reset successful' }));

            } else if (req.url === '/api/deleteUser' && req.method === 'POST') {
                const { adminUsername, adminPassword, targetUsername } = parsedBody;
                if (!adminUsername || !adminPassword || !targetUsername) {
                    res.writeHead(400).end(JSON.stringify({ error: 'Missing required fields' }));
                    return;
                }
                const admin = users[adminUsername];
                if (
                    !admin ||
                    adminUsername !== 'admin' ||
                    !(await comparePassword(adminPassword, admin.password))
                ) {
                    res.writeHead(403).end(JSON.stringify({ error: 'Admin authentication failed' }));
                    return;
                }
                if (!users[targetUsername]) {
                    res.writeHead(404).end(JSON.stringify({ error: 'User not found' }));
                    return;
                }
                delete users[targetUsername];
                await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
                res.writeHead(200).end(JSON.stringify({ message: 'User deleted successfully' }));

            } else {
                res.writeHead(404).end(JSON.stringify({ error: 'Route not found' }));
            }
        } catch (err) {
            console.error('Server error:', err);
            res.writeHead(500).end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
