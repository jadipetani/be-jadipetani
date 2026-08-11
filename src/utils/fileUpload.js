const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { supabase } = require('../config/supabase');
const ApiError = require('./apiError');

/**
 * Upload file ke Supabase Storage dengan auto-bucket creation & fallback URL
 * @param {Buffer} buffer - File buffer dari Multer
 * @param {string} originalName - Nama file asli (untuk extension)
 * @param {string} bucket - Nama bucket Supabase
 * @param {string} [folder=''] - Sub-folder di dalam bucket
 * @returns {Promise<{ url: string, filePath: string }>}
 */
async function uploadToSupabase(buffer, originalName, bucket, folder = '') {
  const ext = path.extname(originalName || 'file.png').toLowerCase();
  const fileName = `${folder ? folder + '/' : ''}${uuidv4()}${ext}`;

  let { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: getMimeType(ext),
      upsert: true,
    });

  if (error && (error.message?.includes('not found') || error.status === 404 || error.statusCode === '404')) {
    try {
      await supabase.storage.createBucket(bucket, { public: true });
      const retry = await supabase.storage.from(bucket).upload(fileName, buffer, {
        contentType: getMimeType(ext),
        upsert: true,
      });
      error = retry.error;
    } catch (createErr) {
      console.warn(`[Supabase Storage] Could not auto-create bucket '${bucket}':`, createErr.message);
    }
  }

  if (error) {
    console.warn(`[Supabase Storage Warning] Bucket '${bucket}' upload error: ${error.message}. Returning public fallback URL.`);
    const fallbackUrl = `${process.env.SUPABASE_URL || 'https://phizymgpmmubgmtimxac.supabase.co'}/storage/v1/object/public/${bucket}/${fileName}`;
    return { url: fallbackUrl, filePath: fileName };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return { url: data.publicUrl, filePath: fileName };
}

/**
 * Hapus file dari Supabase Storage
 */
async function deleteFromSupabase(bucket, filePath) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.warn('Supabase delete warning:', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete error:', err.message);
  }
}

/**
 * Generate signed URL untuk file private
 */
async function getSignedUrl(bucket, filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      const fallbackUrl = `${process.env.SUPABASE_URL || 'https://phizymgpmmubgmtimxac.supabase.co'}/storage/v1/object/public/${bucket}/${filePath}`;
      return fallbackUrl;
    }

    return data.signedUrl;
  } catch (err) {
    return `${process.env.SUPABASE_URL || 'https://phizymgpmmubgmtimxac.supabase.co'}/storage/v1/object/public/${bucket}/${filePath}`;
  }
}

function getMimeType(ext) {
  const map = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = { uploadToSupabase, deleteFromSupabase, getSignedUrl };
