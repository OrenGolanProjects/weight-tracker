import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';
import imageCompression from 'browser-image-compression';

/**
 * Upload photo to Firebase Storage
 * @param userId - User ID
 * @param file - Image file
 * @param mediaId - Unique ID for the media
 * @returns Object with original and thumbnail URLs and storage paths
 */
export const uploadPhoto = async (
  userId: string,
  file: File,
  mediaId: string
): Promise<{
  originalUrl: string;
  thumbnailUrl: string;
  originalPath: string;
  thumbnailPath: string;
  fileSize: number;
}> => {
  try {
    // Compress original image (max 1MB)
    const compressedOriginal = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    // Create thumbnail (max 100KB)
    const thumbnail = await imageCompression(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 400,
      useWebWorker: true,
    });

    // Upload original
    const originalPath = `users/${userId}/progress-media/photos/${mediaId}_original.jpg`;
    const originalRef = ref(storage, originalPath);
    await uploadBytes(originalRef, compressedOriginal);
    const originalUrl = await getDownloadURL(originalRef);

    // Upload thumbnail
    const thumbnailPath = `users/${userId}/progress-media/photos/${mediaId}_thumb.jpg`;
    const thumbnailRef = ref(storage, thumbnailPath);
    await uploadBytes(thumbnailRef, thumbnail);
    const thumbnailUrl = await getDownloadURL(thumbnailRef);

    return {
      originalUrl,
      thumbnailUrl,
      originalPath,
      thumbnailPath,
      fileSize: compressedOriginal.size,
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

/**
 * Upload video to Firebase Storage
 * @param userId - User ID
 * @param file - Video file
 * @param mediaId - Unique ID for the media
 * @returns Object with video URL and storage path
 */
export const uploadVideo = async (
  userId: string,
  file: File,
  mediaId: string
): Promise<{
  videoUrl: string;
  videoPath: string;
  fileSize: number;
}> => {
  try {
    // Check file size (max 100MB as per storage rules)
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Video file size must be less than 100MB');
    }

    // Upload video
    const videoPath = `users/${userId}/progress-media/videos/${mediaId}.mp4`;
    const videoRef = ref(storage, videoPath);
    await uploadBytes(videoRef, file);
    const videoUrl = await getDownloadURL(videoRef);

    return {
      videoUrl,
      videoPath,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

/**
 * Delete media from Firebase Storage
 * @param storagePath - Path to the file in storage
 */
export const deleteMedia = async (storagePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

/**
 * Delete photo (both original and thumbnail)
 * @param originalPath - Path to original photo
 * @param thumbnailPath - Path to thumbnail
 */
export const deletePhoto = async (
  originalPath: string,
  thumbnailPath: string
): Promise<void> => {
  try {
    await Promise.all([
      deleteMedia(originalPath),
      deleteMedia(thumbnailPath),
    ]);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
};

/**
 * Get video duration from file
 * @param file - Video file
 * @returns Duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};
