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

export interface AuthProps {
  path: string
  message: string
  formMaker: FormInput[]
  handleBtnSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  error: string
  setError: (error: string) => void
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
