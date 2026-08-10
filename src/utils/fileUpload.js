const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { supabase } = require('../config/supabase');
const ApiError = require('./apiError');

/**
 * Upload file ke Supabase Storage
 * @param {Buffer} buffer - File buffer dari Multer
 * @param {string} originalName - Nama file asli (untuk extension)
 * @param {string} bucket - Nama bucket Supabase
 * @param {string} [folder=''] - Sub-folder di dalam bucket
 * @returns {Promise<{ url: string, filePath: string }>}
 */
async function uploadToSupabase(buffer, originalName, bucket, folder = '') {
  const ext = path.extname(originalName).toLowerCase();
  const fileName = `${folder ? folder + '/' : ''}${uuidv4()}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: getMimeType(ext),
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw ApiError.internal('Gagal mengupload file');
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return { url: data.publicUrl, filePath: fileName };
}

/**
 * Hapus file dari Supabase Storage
 * @param {string} bucket - Nama bucket
 * @param {string} filePath - Path file di bucket
 */
async function deleteFromSupabase(bucket, filePath) {
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error('Supabase delete error:', error);
    // Non-critical — jangan throw
  }
}

/**
 * Generate signed URL untuk file private
 * @param {string} bucket - Nama bucket
 * @param {string} filePath - Path file di bucket
 * @param {number} [expiresIn=3600] - Expiry dalam detik (default 1 jam)
 * @returns {Promise<string>}
 */
async function getSignedUrl(bucket, filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Supabase signed URL error:', error);
    throw ApiError.internal('Gagal membuat link download');
  }

  return data.signedUrl;
}

function getMimeType(ext) {
  const map = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };
  return map[ext] || 'application/octet-stream';
}

module.exports = { uploadToSupabase, deleteFromSupabase, getSignedUrl };
