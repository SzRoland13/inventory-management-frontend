export type MediaUploadRequest = {
  filename: string;
  mimeType: string;
};

export type MediaUploadInitResponse = {
  id: number;
  putUrl: string;
  expiry: number;
};

export type MediaPreviewResponse = {
  id: number;
  getUrl: string;
  expiry: number;
};

export type FileUpload = {
  url: string;
  file: File;
};
