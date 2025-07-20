import React, { useEffect, useState } from 'react';

function UserRow({ user, onDelete }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ flex: 1 }}>{user.username}</span>
      <button style={{ background: '#d00', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }} onClick={() => onDelete(user.username)}>Delete</button>
    </li>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/admin-users');
    setUsers(await res.json());
  };

  useEffect(() => { if (adminAuth) fetchUsers(); }, [adminAuth]);

  const addUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return setError('Missing fields');
    const res = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) setError((await res.json()).error || 'Error');
    setUsername(''); setPassword('');
    fetchUsers();
  };

  const deleteUser = async (username) => {
    await fetch('/api/admin-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    fetchUsers();
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser === 'admin' && adminPass === 'admin') {
      setAdminAuth(true);
      setError('');
    } else {
      setError('Invalid admin credentials');
    }
  };

  if (!adminAuth) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 24, fontFamily: 'sans-serif' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleAdminLogin} style={{ marginBottom: 16 }}>
          <input value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="Admin Username" required style={{ marginRight: 8 }} />
          <input value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Admin Password" type="password" required style={{ marginRight: 8 }} />
          <button type="submit">Login</button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 24, fontFamily: 'sans-serif' }}>
      <h2>User Admin Panel</h2>
      <form onSubmit={addUser} style={{ marginBottom: 16 }}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" pattern="[a-zA-Z0-9._-]+" required style={{ marginRight: 8 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required style={{ marginRight: 8 }} />
        <button type="submit">Add User</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <h3>Users</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(u => (
          <UserRow key={u.username} user={u} onDelete={deleteUser} />
        ))}
      </ul>
    </div>
  );
}
