// src/types/index.ts

export interface VideoDataType {
  id_video: number;
  title_video: string;
  description: string;
  channel: string;
  thumbnail: string;
  slug: string;
  quality: string;
  views: number;
  likes: number;
  created_at: string;
  id_user: number;
}

export interface ListVideo {
  channel: string;
  created_at: string;
  description: string;
  id_user: number;
  id_video: number;
  likes: number;
  quality: string;
  slug: string;
  thumbnail: string;
  title_video: string;
}

export interface AuthProps {
  path: string;
  message: string;
  formMaker: FormInput[];
  handleBtnSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  alertMessage: { text: string; type: string };
  setAlertMessage: (message: { text: string; type: 'error' | 'success' }) => void;
  gotoAltPath?: string;
  haveAccount?: boolean;
}

export interface FormInput {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: string;
}

export interface UploadProgressItem {
  file: string;
  progress: number;
  reso: string;
  path: string;
}

interface FormField {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface FormGeneratorTemplateItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  form: FormField[];
}

interface User {
  id_user: number;
  username: string;
  email: string;
  image_url: string;
  created_at: string;
  password: string;
  token: null | string;
}

export interface Comment {
  id_comment: number;
  id_user: number;
  id_video: number;
  body: string;
  created_at: string;
  user: User;
}

export interface UserData {
  username: string;
  email: string;
  token: string;
  // id_user: number;
  // image_url: string;
}
