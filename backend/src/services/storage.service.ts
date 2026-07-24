import { getSupabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   * @param bucket - Storage bucket name
   * @param file - File buffer
   * @param fileName - Original file name
   * @param folder - Optional folder path
   */
  async uploadFile(
    bucket: string,
    file: Buffer,
    fileName: string,
    folder: string = ''
  ): Promise<{ url: string; path: string }> {
    const supabase = getSupabase();
    const fileExt = fileName.split('.').pop() || '';
    const uniqueName = `${uuidv4()}.${fileExt}`;
    const filePath = folder ? `${folder}/${uniqueName}` : uniqueName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  },

  /**
   * Upload document file to 'documents' bucket
   */
  async uploadDocument(
    file: Buffer,
    fileName: string,
    customerId: string
  ): Promise<{ url: string; path: string }> {
    return this.uploadFile('documents', file, fileName, `customers/${customerId}`);
  },

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  /**
   * Delete a document file
   */
  async deleteDocument(path: string): Promise<void> {
    return this.deleteFile('documents', path);
  },

  /**
   * Get signed URL for secure access (if bucket is private)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * List files in a bucket/folder
   */
  async listFiles(bucket: string, folder?: string): Promise<string[]> {
    const supabase = getSupabase();
    const { data, error } = folder
      ? await supabase.storage.from(bucket).list(folder)
      : await supabase.storage.from(bucket).list('');

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return (data || []).map((f) => f.name);
  },
};
