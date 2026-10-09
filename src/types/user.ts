export type UserRole = 'admin' | 'sales';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  isEmailVerified: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
}
