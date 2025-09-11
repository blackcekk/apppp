import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<AuthResponse>;
  signUp(email: string, password: string, name: string): Promise<AuthResponse>;
  signOut(): Promise<void>;
  verifyEmail(code: string): Promise<AuthResponse>;
  resendVerification(): Promise<AuthResponse>;
  resetPassword(email: string): Promise<AuthResponse>;
  confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse>;
}

class MockAuthService implements IAuthService {
  private readonly STORAGE_KEY = 'auth_user';
  private readonly VERIFIED_KEY = 'email_verified';

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!userData) return null;

      const user = JSON.parse(userData);
      const verified = await AsyncStorage.getItem(this.VERIFIED_KEY);
      
      return {
        ...user,
        verified: verified === 'true',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!email?.trim() || !password?.trim()) {
      return { success: false, message: 'Email and password are required' };
    }

    if (email.length > 100 || password.length > 100) {
      return { success: false, message: 'Invalid input length' };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email.trim() === 'test@example.com' && password === 'password') {
      const user: User = {
        id: '1',
        email: email.trim(),
        name: 'Test User',
        verified: true,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(this.VERIFIED_KEY, 'true');

      return { success: true, user, token: 'mock_token' };
    }

    return { success: false, message: 'Invalid credentials' };
  }

  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      return { success: false, message: 'All fields are required' };
    }

    if (email.length > 100 || password.length > 100 || name.length > 50) {
      return { success: false, message: 'Invalid input length' };
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const user: User = {
      id: Date.now().toString(),
      email: email.trim(),
      name: name.trim(),
      verified: false,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(this.VERIFIED_KEY, 'false');

    return { success: true, user, message: 'Account created. Please verify your email.' };
  }

  async signOut(): Promise<void> {
    await AsyncStorage.multiRemove([this.STORAGE_KEY, this.VERIFIED_KEY]);
  }

  async verifyEmail(code: string): Promise<AuthResponse> {
    if (!code?.trim() || code.length !== 6) {
      return { success: false, message: 'Invalid verification code' };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (code.trim() === '123456') {
      await AsyncStorage.setItem(this.VERIFIED_KEY, 'true');
      const user = await this.getCurrentUser();
      return { success: true, user: user || undefined, message: 'Email verified successfully' };
    }

    return { success: false, message: 'Invalid verification code' };
  }

  async resendVerification(): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, message: 'Verification code sent to your email' };
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    if (!email?.trim() || email.length > 100) {
      return { success: false, message: 'Valid email is required' };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Password reset link sent to your email' };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    if (!token?.trim() || !newPassword?.trim()) {
      return { success: false, message: 'Token and new password are required' };
    }

    if (token.length > 100 || newPassword.length > 100) {
      return { success: false, message: 'Invalid input length' };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Password reset successfully' };
  }
}

class RemoteAuthService implements IAuthService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('auth_token');
        }
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!email?.trim() || !password?.trim()) {
      return { success: false, message: 'Email and password are required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await AsyncStorage.setItem('auth_token', data.token);
        return { success: true, user: data.user, token: data.token };
      }

      return { success: false, message: data.message || 'Sign in failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      return { success: false, message: 'All fields are required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim(), 
          name: name.trim() 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data.user, message: data.message };
      }

      return { success: false, message: data.message || 'Sign up failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  }

  async verifyEmail(code: string): Promise<AuthResponse> {
    if (!code?.trim()) {
      return { success: false, message: 'Verification code is required' };
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${this.baseUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async resendVerification(): Promise<AuthResponse> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${this.baseUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    if (!email?.trim()) {
      return { success: false, message: 'Email is required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse> {
    if (!token?.trim() || !newPassword?.trim()) {
      return { success: false, message: 'Token and new password are required' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/confirm-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token.trim(), 
          newPassword: newPassword.trim() 
        }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return { success: false, message: 'Network error' };
    }
  }
}

export class AuthServiceFactory {
  private static instance: IAuthService | null = null;

  static getInstance(): IAuthService {
    if (!this.instance) {
      const provider = Constants.expoConfig?.extra?.authProvider || 'mock';
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://toolkit.rork.com';

      console.log(`Initializing auth provider: ${provider}`);

      if (provider === 'remote') {
        this.instance = new RemoteAuthService(apiBaseUrl);
      } else {
        this.instance = new MockAuthService();
      }
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

export const authService = AuthServiceFactory.getInstance();