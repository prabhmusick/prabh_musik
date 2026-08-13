import api from "../lib/api";

/**
 * Centrally handles file uploads (audio, image, document) to the backend.
 * Uses the default Axios `api` client which is configured with `NEXT_PUBLIC_API_URL`.
 * 
 * @param file - The raw File object to upload
 * @param type - File category mapping to specific upload routes and fields
 * @param onProgress - Optional callback for tracking real network upload progress (0-100)
 */
export async function uploadFile(
  file: File,
  type: "image" | "banner" | "audio" | "document",
  onProgress?: (progress: number) => void
): Promise<{ 
  success: boolean; 
  fileName: string;
  storageKey?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  [key: string]: any;
}> {
  const formData = new FormData();
  
  let fieldName = "audio";
  let endpoint = "/uploads/audio";
  
  if (type === "image") {
    fieldName = "image";
    endpoint = "/uploads/image";
  } else if (type as string === "banner") {
    fieldName = "banner";
    endpoint = "/uploads/banner";
  } else if (type === "document") {
    fieldName = "document";
    endpoint = "/uploads/document";
  }
  
  formData.append(fieldName, file);
  
  const response = await api.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  
  return {
    success: response.data.success,
    fileName: response.data.data.storage_key,
    storageKey: response.data.data.storage_key,
    url: response.data.data.publicUrl || "",
    mimeType: response.data.data.mime_type,
    size: response.data.data.file_size,
    ...response.data.data
  };
}
