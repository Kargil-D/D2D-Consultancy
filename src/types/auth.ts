export type UserRole = "admin" | "consultant" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
