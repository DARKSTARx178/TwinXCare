import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 */
export const useStorage = () => {
  const uploadFile = async (
    file: File,
    path: string = 'uploads/'
  ): Promise<string | null> => {
    try {
      const fileRef = ref(storage, `${path}${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  return { uploadFile };
};
