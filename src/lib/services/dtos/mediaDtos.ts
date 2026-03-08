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

export type FileUpload = {
  url: string;
  file: File;
};
