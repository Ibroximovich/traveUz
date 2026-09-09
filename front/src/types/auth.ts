export type UserRole = 'TOURIST' | 'GUIDE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isCustomAvatarUploaded?: boolean;
  phone?: string;
  telegramHandle?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokens?: AuthTokens;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface GoogleLoginDto {
  idToken: string;
  role?: UserRole;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  selectedRole: UserRole;

  // Actions
  setSelectedRole: (role: UserRole) => void;
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}
