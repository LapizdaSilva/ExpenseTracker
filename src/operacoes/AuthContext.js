import React, { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropTypes } from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserEmail = await AsyncStorage.getItem("userEmail");
        if (storedUserEmail) {
          setUser({ email: storedUserEmail }); // Set a dummy user object for AsyncStorage
        }
      } catch (e) {
        console.error("Failed to load user from AsyncStorage", e);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        AsyncStorage.setItem("userEmail", firebaseUser.email);
      } else {
        setUser(null);
        AsyncStorage.removeItem("userEmail");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);
