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
  type: "image" | "audio" | "document",
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; fileName: string }> {
  const formData = new FormData();
  
  let fieldName = "audio";
  let endpoint = "/uploads/upload-audio";
  
  if (type === "image") {
    fieldName = "image";
    endpoint = "/uploads/upload-image";
  } else if (type === "document") {
    fieldName = "document";
    endpoint = "/uploads/upload-document";
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
  
  return response.data;
}
