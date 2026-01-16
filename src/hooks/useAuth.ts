
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Ensure you have this export

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}
