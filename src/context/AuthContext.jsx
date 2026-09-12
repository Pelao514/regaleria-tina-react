import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

const LOCAL_USERS_KEY = 'tina_users_data';
const CURRENT_USER_KEY = 'tina_current_user';

const INITIAL_USERS = [
  {
    id: 'usr-admin-1',
    email: 'admin@regaleriatina.com',
    password: 'admin123',
    full_name: 'Administrador Principal',
    role: 'admin'
  },
  {
    id: 'usr-cajero-1',
    email: 'cajero@regaleriatina.com',
    password: 'cajero123',
    full_name: 'Cajero de Turno',
    role: 'cajero'
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setLoading(true);
    loadLocalUsers();
    setLoading(false);
  };

  const loadLocalUsers = () => {
    const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
    let users = INITIAL_USERS;
    if (storedUsers) {
      try {
        users = JSON.parse(storedUsers);
      } catch (e) {
        users = INITIAL_USERS;
      }
    } else {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    setUsersList(users);

    const savedUserStr = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUserStr) {
      try {
        const saved = JSON.parse(savedUserStr);
        const match = users.find(u => u.id === saved.id || u.email?.toLowerCase() === saved.email?.toLowerCase());
        setUser(match || saved);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    let pool = usersList;
    if (!pool || pool.length === 0) {
      const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
      if (storedUsers) {
        try { pool = JSON.parse(storedUsers); } catch (e) { pool = INITIAL_USERS; }
      } else {
        pool = INITIAL_USERS;
      }
    }

    const found = pool.find(u => u.email?.trim().toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error('El correo electrónico no se encuentra registrado.');
    }

    if (found.password && cleanPassword && found.password !== cleanPassword) {
      throw new Error('La contraseña ingresada es incorrecta.');
    }

    setUser(found);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
    return found;
  };

  // Registro de nuevo usuario desde la pantalla de Login
  const register = async (email, password, fullName) => {
    const existing = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      email: email.trim(),
      password: password.trim(),
      full_name: fullName.trim(),
      role: 'cajero'
    };

    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  };

  // Restablecer / Modificar Contraseña Olvidada
  const resetPassword = async (email, newPassword) => {
    const found = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      throw new Error('No se encontró ningún usuario con ese correo electrónico.');
    }

    const updated = usersList.map(u => {
      if (u.id === found.id) {
        return { ...u, password: newPassword.trim() };
      }
      return u;
    });

    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    return true;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateUserRole = async (userId, newRole) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo un administrador puede asignar roles.');
    }
    const updated = usersList.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    
    if (user?.id === userId) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  // Editar usuario completo por el Administrador
  const updateUser = async (userId, data) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo un administrador puede modificar usuarios y contraseñas.');
    }

    const updated = usersList.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          full_name: data.full_name.trim(),
          email: data.email.trim(),
          password: data.password ? data.password.trim() : u.password,
          role: data.role
        };
      }
      return u;
    });

    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));

    if (user?.id === userId) {
      const updatedSelf = updated.find(u => u.id === userId);
      setUser(updatedSelf);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedSelf));
    }
  };

  const createNewUser = async (email, password, fullName, role) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo un administrador puede registrar nuevos usuarios.');
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      email: email.trim(),
      password: password ? password.trim() : '123456',
      full_name: fullName.trim(),
      role: role || 'cajero'
    };

    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
    return newUser;
  };

  const deleteUser = async (userId) => {
    if (user?.role !== 'admin') {
      throw new Error('Solo un administrador puede eliminar usuarios.');
    }
    if (user?.id === userId) {
      throw new Error('No puedes eliminar tu propia cuenta de administrador mientras tienes sesión activa.');
    }
    const updated = usersList.filter(u => u.id !== userId);
    setUsersList(updated);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      usersList,
      loading,
      login,
      register,
      resetPassword,
      logout,
      updateUserRole,
      updateUser,
      createNewUser,
      deleteUser,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
