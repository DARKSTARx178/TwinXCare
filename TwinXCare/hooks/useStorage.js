import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const useStorage = () => {
  const uploadFile = async (file, path = 'uploads/') => {
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
