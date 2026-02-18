export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  language: 'zh' | 'en';
}

export interface MindMap {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: number;
  updatedAt: number;
  description?: string;
  isPublic?: boolean;
  userId?: string;
}

export interface UserApplication {
  id: string;
  email: string;
  username: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
