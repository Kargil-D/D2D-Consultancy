export type UserRole = "admin" | "consultant" | "customer";

/** One entry per AdminModule (see src/types/admin.ts) — undefined for Customer accounts, which never touch /admin. */
export type UserPermissions = Record<string, { canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }>;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  permissions?: UserPermissions;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
