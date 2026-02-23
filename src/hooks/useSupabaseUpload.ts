import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UseSupabaseUploadResult {
 progress: number;
 error: Error | null;
 isUploading: boolean;
 uploadFile: (file: File) => Promise<string | null>;
}

export const useSupabaseUpload = (bucketName: string): UseSupabaseUploadResult => {
 const [progress, setProgress] = useState<number>(0);
 const [error, setError] = useState<Error | null>(null);
 const [isUploading, setIsUploading] = useState<boolean>(false);

 // Khởi tạo Supabase client
 const supabase = createClient();

 const uploadFile = async (file: File): Promise<string | null> => {
 if (!file) {
 const err = new Error("No file provided");
 setError(err);
 throw err;
 }

 setIsUploading(true);
 setError(null);
 setProgress(0); // Supabase js library does not directly support robust progress tracking out of the box for standard uploads, so we will simulate or just set 0 then 100.

 // Create a unique file path
 const filePath =`${Date.now()}_${file.name}`;

 try {
 // Upload to Supabase Storage
 const { data, error: uploadError } = await supabase.storage
 .from(bucketName)
 .upload(filePath, file, {
 cacheControl: '3600',
 upsert: false
 });

 if (uploadError) {
 throw uploadError;
 }

 setProgress(100);

 // Get public URL
 const { data: { publicUrl } } = supabase.storage
 .from(bucketName)
 .getPublicUrl(filePath);

 setIsUploading(false);
 return publicUrl;
 } catch (err: any) {
 setError(err);
 setIsUploading(false);
 throw err;
 }
 };

 return { progress, error, isUploading, uploadFile };
};
