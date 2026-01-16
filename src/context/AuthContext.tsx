'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInAnonymously,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UserProfile {
    credits: number;
    plan: 'free' | 'pro' | 'premium';
    isPremium: boolean;
    displayName?: string;
    role?: 'user' | 'admin' | 'interpreter';
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
    registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
    signInWithGoogle: async () => { },
    signInAsGuest: async () => { },
    registerWithEmail: async () => { },
    loginWithEmail: async () => { },
    logout: async () => { },
    resetPassword: async () => { },
    isGuest: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (currentUser: User) => {
        try {
            const token = await currentUser.getIdToken();
            const res = await fetch('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const syncUser = async (currentUser: User) => {
        try {
            await fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL
                })
            });
        } catch (error) {
            console.error('Failed to sync user', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // First sync user to DB (creates role if new, updates if existing)
                await syncUser(currentUser);
                // Then fetch profile
                await fetchProfile(currentUser);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) await fetchProfile(user);
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error: unknown) {
            // Handle cancelled popup (user closed window) - don't throw
            if (error instanceof Error && 'code' in error) {
                const firebaseError = error as { code: string };
                if (firebaseError.code === 'auth/cancelled-popup-request' ||
                    firebaseError.code === 'auth/popup-closed-by-user') {
                    console.log('Sign-in popup was cancelled');
                    return;
                }
            }
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInAsGuest = async () => {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error('Error signing in anonymously:', error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, {
                displayName: name
            });
            // Do not spread user object, it loses prototype methods like getIdToken
            setUser(userCredential.user);
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        const { sendPasswordResetEmail } = await import('firebase/auth');
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            isGuest: user?.isAnonymous ?? false,
            refreshProfile,
            signInWithGoogle,
            signInAsGuest,
            registerWithEmail,
            loginWithEmail,
            logout,
            resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
