
export enum Subject {
  MATH = 'Toán Học',
  ECON_LAW = 'GDKTPL',
  HISTORY = 'Lịch Sử'
}

export enum InputMethod {
  CAMERA = 'Camera',
  UPLOAD = 'Tải Ảnh',
  VOICE = 'Giọng Nói',
  TEXT = 'Văn Bản'
}

export interface AIResponse {
  socratic: string;
  notebookLM: string;
  perplexity: string;
  specialized: string; // Casio / Law / Documents
  diagram: string;
}

export interface HistoryItem {
  id: string;
  subject: Subject;
  timestamp: number;
  input: string;
  image?: string;
  response: AIResponse;
}
