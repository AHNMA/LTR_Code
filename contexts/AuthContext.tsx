
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { User, UserRole } from '../types';
import { syncService } from '../services/sync';

interface LoginResult { success: boolean; message?: string; }
interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  verifyEmail: (email: string) => void;
  checkAvailability: (field: 'username' | 'email', value: string) => boolean;
  updateUserProfile: (id: string, data: Partial<User>) => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<boolean>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  isAuthenticated: boolean;
  canAccessAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ALLOWED_ADMIN_ROLES: UserRole[] = ['admin', 'it', 'editor', 'author', 'moderator'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authVersion, setAuthVersion] = useState(0);
  const forceUpdate = () => setAuthVersion(v => v + 1);
  const users = useLiveQuery(() => db.users.toArray(), [authVersion]) || [];
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
      const initSession = async () => {
          const storedId = localStorage.getItem('pp_userId');
          if (storedId) {
              const user = await db.users.get(storedId);
              if (user) setCurrentUser(user);
          }
          setLoadingSession(false);
      };
      initSession();
  }, []);

  const login = async (identifier: string, password: string): Promise<LoginResult> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = await db.users.filter(u => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()).first();
      if (!user) return { success: false, message: 'Benutzer nicht gefunden.' };
      if (user.isBanned) return { success: false, message: 'Account gesperrt.' };
      if (user.isVerified === false) return { success: false, message: 'Bitte bestätigen Sie zuerst Ihre E-Mail Adresse.' };
      setCurrentUser(user);
      localStorage.setItem('pp_userId', user.id);
      return { success: true };
  };

  const logout = () => { setCurrentUser(null); localStorage.removeItem('pp_userId'); };

  const register = async (userData: Partial<User>, password: string): Promise<boolean> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const allUsers = await db.users.toArray();
      const maxId = allUsers.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
      const newUser: User = {
          id: (maxId + 1).toString(),
          username: userData.username!,
          email: userData.email!,
          firstName: '', lastName: '', avatar: '', role: 'user', 
          joinedDate: new Date().toISOString().split('T')[0], socials: {}, isVerified: false, 
          ...userData
      };
      await db.users.add(newUser);
      forceUpdate();
      syncService.autoPush();
      return true;
  };

  const verifyEmail = async (email: string) => {
      const user = await db.users.where({ email }).first();
      if (user) { await db.users.update(user.id, { isVerified: true }); forceUpdate(); syncService.autoPush(); }
  };

  const checkAvailability = (field: 'username' | 'email', value: string) => !users.some(u => u[field].toLowerCase() === value.toLowerCase());

  const updateUserProfile = async (id: string, data: Partial<User>) => {
      // 1. Get old user data before update to handle migration if needed
      const oldUser = await db.users.get(id);

      // 2. Perform Update
      await db.users.update(id, data);
      
      // 3. Get fresh user data to construct new display name
      const updatedUser = await db.users.get(id);
      
      if (updatedUser) {
          const newAuthorName = (updatedUser.firstName && updatedUser.lastName) 
            ? `${updatedUser.firstName} ${updatedUser.lastName}` 
            : updatedUser.username;

          // 4. Update all posts authored by this user
          await db.transaction('rw', db.posts, async () => {
              // A. Update posts that already have the authorId linked
              await db.posts.where('authorId').equals(id).modify({ author: newAuthorName });
              
              // B. Migration / Safety: Update posts that have the OLD name but missing authorId
              // This links existing/legacy content to the user for the first time
              if (oldUser) {
                  const oldAuthorName = (oldUser.firstName && oldUser.lastName) 
                    ? `${oldUser.firstName} ${oldUser.lastName}` 
                    : oldUser.username;
                  
                  // Only update if exact string match and no ID set yet
                  await db.posts.filter(p => p.author === oldAuthorName && !p.authorId).modify({ 
                      author: newAuthorName, 
                      authorId: id 
                  });
              }
          });

          // Update local session if it's the current user
          if (currentUser && currentUser.id === id) {
              setCurrentUser(updatedUser);
          }
      }
      
      forceUpdate();
      syncService.autoPush();
  };

  const updateUserRole = async (id: string, role: UserRole) => {
      await db.users.update(id, { role });
      if (currentUser && currentUser.id === id) setCurrentUser(prev => prev ? { ...prev, role } : null);
      forceUpdate();
      syncService.autoPush();
  };

  const deleteUser = async (id: string) => {
      await db.users.delete(id);
      // NOTE: We do NOT delete the posts, but they now become "Legacy" because authorId won't resolve to a user anymore.
      if (currentUser && currentUser.id === id) logout();
      forceUpdate();
      syncService.autoPush();
  };

  const requestPasswordReset = async (identifier: string) => {
      const user = await db.users.filter(u => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()).first();
      return !!user;
  };

  const changePassword = async (oldPw: string, newPw: string) => true;

  if (loadingSession) return null;
  
  // Unrestricted access for testing as requested
  const canAccessAdmin = true; 

  return (
    <AuthContext.Provider value={{
        currentUser, users, login, logout, register, verifyEmail, checkAvailability,
        updateUserProfile, updateUserRole, deleteUser, requestPasswordReset, changePassword,
        isAuthenticated: !!currentUser, canAccessAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
