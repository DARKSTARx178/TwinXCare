import { useState, useEffect } from "react";
// import { onAuthStateChanged, User } from "firebase/auth";
// import { auth } from '@/utils/firebase';

// Stub hook: always returns null user and not loading
export const useAuth = () => {
    return { user: null, loading: false };
};