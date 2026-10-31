import { FileUpload } from '@/features/shared/media/types/mediaDtos';
import axios from 'axios';

export const ObjectStorageService = {
  putImage: async (data: FileUpload): Promise<void> => {
    await axios.put(data.url, data.file, {
      headers: { 'Content-Type': data.file.type },
      onUploadProgress: (event) => {
        if (event.total && data.onProgress) {
          data.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },
};
