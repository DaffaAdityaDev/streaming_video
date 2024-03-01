// src/types/index.ts

export interface VideoDataType {
  id: number
  title: string
  channel: string
  img: string
  slug: string
  quality: string
  duration: number
  view: number
  timeUpload: string
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
  path: string
  message: string
  formMaker: FormInput[]
  handleBtnSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  alertMessage: { text: string; type: string }
  setAlertMessage: (message: { text: string; type: 'error' | 'success' }) => void;
  gotoAltPath?: string
  haveAccount?: boolean
}

export interface FormInput {
  type: string
  name: string
  placeholder: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  icon: string
}

export interface UploadProgressItem {
  file: string
  progress: number
  reso: string
  path: string
}

