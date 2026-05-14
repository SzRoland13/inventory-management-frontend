import { FileUpload } from '@/lib/services/dtos/mediaDtos';
import axios from 'axios';

export const ObjectStorageService = {
  putImage: async (data: FileUpload): Promise<void> => {
    axios.put(data.url, data.file, {
      headers: { 'Content-Type': data.file.type },
    });
  },
};
