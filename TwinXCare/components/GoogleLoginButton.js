import React from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const GoogleLoginButton = ({ onLogin }) => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in:', user);
      if (onLogin) onLogin(user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return <button onClick={handleLogin}>Sign in with Google</button>;
};

export default GoogleLoginButton;
