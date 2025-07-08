import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage } from "../firebase";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export const uploadImageToFirebase = async (
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    // Create a reference to the file location
    const storageRef = ref(storage, path);
    
    // Create the upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            });
          }
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          // Handle successful uploads
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImageFromFirebase = async (imagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const generateImagePath = (programId: string, fileName: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `program-images/${programId}/${timestamp}.${extension}`;
};