import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Project, ProjectRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentProject: Project | null;
  projects: Project[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, projectRole?: ProjectRole) => Promise<void>;
  logout: () => void;
  setCurrentProject: (project: Project) => void;
  refreshProjects: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  updateUserContext: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const resolveActiveProject = (userId: string, availableProjects: Project[]): Project | null => {
    if (!availableProjects || availableProjects.length === 0) return null;
    const savedProjectId = localStorage.getItem(`devvalidate_active_project_${userId}`);
    if (savedProjectId) {
      const match = availableProjects.find((p) => p.id === savedProjectId);
      if (match) return match;
    }
    return availableProjects[0];
  };

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    if (user?.id) {
      localStorage.setItem(`devvalidate_active_project_${user.id}`, project.id);
    }
  };

  const initAuth = async () => {
    setIsLoading(true);
    try {
      let activeUser: User | null = null;
      if (token) {
        activeUser = await api.getCurrentUser();
        if (activeUser) {
          setUser(activeUser);
        } else {
          api.setToken(null);
          setToken(null);
        }
      }
      const fetchedProjects = await api.getProjects();
      setProjects(fetchedProjects);
      if (activeUser && fetchedProjects.length > 0) {
        const resolved = resolveActiveProject(activeUser.id, fetchedProjects);
        setCurrentProjectState(resolved);
      } else if (fetchedProjects.length > 0) {
        setCurrentProjectState(fetchedProjects[0]);
      }
    } catch {
      // Auth init failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      const prjs = await api.getProjects();
      setProjects(prjs);
      const resolved = resolveActiveProject(res.user.id, prjs);
      if (resolved) {
        setCurrentProject(resolved);
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, projectRole: ProjectRole = 'QA_ENGINEER') => {
    setIsLoading(true);
    try {
      await api.register(name, email, password, projectRole);
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentUser = async () => {
    const updated = await api.getCurrentUser();
    if (updated) {
      setUser(updated);
    }
  };

  const updateUserContext = (updated: User) => {
    setUser(updated);
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshProjects = async () => {
    const prjs = await api.getProjects();
    setProjects(prjs);
    if (user && prjs.length > 0) {
      const resolved = resolveActiveProject(user.id, prjs);
      setCurrentProjectState(resolved);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentProject,
        projects,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        setCurrentProject,
        refreshProjects,
        refreshCurrentUser,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
