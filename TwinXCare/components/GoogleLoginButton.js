import React from 'react';
import { signInWithPopup, User } from 'firebase/auth';
import { auth, provider } from '../firebase';

interface GoogleLoginButtonProps {
  onLogin?: (user: User) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onLogin }) => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in:', user);
      if (onLogin) {
        onLogin(user);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;

