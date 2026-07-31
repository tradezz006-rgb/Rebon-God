export interface WhiteboardContent {
  id?: string;
  text?: string;
  code?: string;
  image?: string; 
}

export type AvaStatus = 'offline' | 'connecting' | 'listening' | 'thinking' | 'speaking';
