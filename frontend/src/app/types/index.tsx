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
};