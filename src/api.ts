const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthUser {
  id: number;
  username: string;
  profile_pic: string;
  online_status: boolean;
}

// Current authenticated user state
let currentUser: AuthUser | null = null;

export const apiService = {
  // Authentication methods
  async register(username: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    currentUser = data.user;
    return data.user;
  },

  async login(username: string, password: string, rememberMe: boolean = false): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, remember_me: rememberMe }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    currentUser = data.user;
    return data.user;
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth.php?action=logout`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    currentUser = null;
  },

  async checkSession(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth.php?action=check`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        currentUser = data.user;
        return data.user;
      }
      
      currentUser = null;
      return null;
    } catch (error) {
      currentUser = null;
      return null;
    }
  },

  getCurrentUser(): AuthUser | null {
    return currentUser;
  },

  // Existing user methods (for testing old functionality)
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users.php`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users;
  },

  async getUser(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users.php?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async createUser(name: string, email: string): Promise<{ id: number }> {
    const response = await fetch(`${API_BASE_URL}/users.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
};

export type { AuthUser, User };
