import { apiClient } from './client'

export interface UploadResponse {
  url: string
  size: number
  mimeType: string
  originalName: string
}

export async function uploadProfileAvatar(imageUri: string): Promise<UploadResponse> {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'avatar.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  formData.append('file', { uri: imageUri, name: filename, type: mimeType } as any)

  return apiClient.post('/v1/storage/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<UploadResponse>
}

export async function uploadOrganizationAvatar(imageUri: string, organizationPda: string): Promise<UploadResponse> {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'org-avatar.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  formData.append('file', { uri: imageUri, name: filename, type: mimeType } as any)
  formData.append('organizationPda', organizationPda)

  return apiClient.post('/v1/storage/upload/organization-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<UploadResponse>
}

export async function uploadEventImage(imageUri: string, eventPda: string): Promise<UploadResponse> {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'event-image.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  formData.append('file', { uri: imageUri, name: filename, type: mimeType } as any)
  formData.append('eventPda', eventPda)

  return apiClient.post('/v1/storage/upload/event-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<UploadResponse>
}

export async function uploadVenueImage(imageUri: string, eventPda: string): Promise<UploadResponse> {
  const formData = new FormData()
  const filename = imageUri.split('/').pop() ?? 'venue-image.jpg'
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  formData.append('file', { uri: imageUri, name: filename, type: mimeType } as any)
  formData.append('eventPda', eventPda)

  return apiClient.post('/v1/storage/upload/event-venue-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as Promise<UploadResponse>
}
