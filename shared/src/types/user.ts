export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  lastActive: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}
