export interface MindMap {
  id: string;
  title: string;
  content: string; // Markdown content
  createdAt: number;
  updatedAt: number;
  description?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
