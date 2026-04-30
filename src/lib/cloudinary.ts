import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(base64: string, folder = 'bahirdar-homes'): Promise<{ url: string; thumbnailUrl: string }> {
  const result = await cloudinary.uploader.upload(base64, {
    folder,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })
  const thumbnailUrl = cloudinary.url(result.public_id, {
    width: 400, height: 300, crop: 'fill', quality: 'auto', fetch_format: 'auto',
  })
  return { url: result.secure_url, thumbnailUrl }
}

export async function deleteImage(url: string): Promise<void> {
  const publicId = url.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '')
  await cloudinary.uploader.destroy(publicId)
}
