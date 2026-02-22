import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface UseFirebaseUploadResult {
    progress: number;
    error: Error | null;
    isUploading: boolean;
    uploadFile: (file: File) => Promise<string | null>;
}

export const useFirebaseUpload = (destinationFolder: string): UseFirebaseUploadResult => {
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<Error | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const uploadFile = (file: File): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("No file provided"));
                return;
            }

            setIsUploading(true);
            setError(null);
            setProgress(0);

            // 1. Tạo Storage Reference (kèm timestamp để tránh trùng tên file)
            const fileRef = ref(storage, `${destinationFolder}/${Date.now()}_${file.name}`);

            // 2. Bắt đầu upload (Resumable)
            const uploadTask = uploadBytesResumable(fileRef, file);

            // 3. Lắng nghe tiến trình
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const currentProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(currentProgress);
                },
                (err) => {
                    // Lỗi quá trình upload
                    setError(err);
                    setIsUploading(false);
                    reject(err);
                },
                async () => {
                    // Hoàn thành upload
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setIsUploading(false);
                        setProgress(100);
                        resolve(downloadURL);
                    } catch (urlError) {
                        setError(urlError as Error);
                        setIsUploading(false);
                        reject(urlError);
                    }
                }
            );
        });
    };

    return { progress, error, isUploading, uploadFile };
};
