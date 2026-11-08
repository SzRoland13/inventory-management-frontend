export type MediaUploadRequest = {
  filename: string;
  mimeType: string;
  fileSize: number;
};

export type MediaUploadInitResponse = {
  id: number;
  putUrl: string;
  expiry: string;
};

export type MediaPreviewResponse = {
  id: number;
  getUrl: string;
  expiry: string;
};

export enum MediaThumbnailStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export type MediaThumbnailPreviewResponse = {
  id: number;
  status: MediaThumbnailStatus;
  getUrl: string | null;
  expiry: string | null;
};

export type FileUpload = {
  url: string;
  file: File;
  onProgress?: (progress: number) => void;
};
