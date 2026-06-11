import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth, getUserData } from '../firebase/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const data = await getUserData(firebaseUser.uid);
          setUserData(data || {});
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserData({});
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    try {
      if (user) {
        const data = await getUserData(user.uid);
        setUserData(data || {});
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
