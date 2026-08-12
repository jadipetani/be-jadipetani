const multer = require('multer');
const ApiError = require('../utils/apiError');
const { MAX_FILE_SIZE } = require('../utils/constants');

// Memory storage (tidak simpan ke disk, langsung ke buffer)
const storage = multer.memoryStorage();

/**
 * Create Multer fileFilter for allowed MIME types
 * @param {string[]} allowedTypes
 */
const fileFilter = (allowedTypes) => (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(422, `Tipe file tidak diizinkan. Hanya: ${allowedTypes.join(', ')}`),
      false
    );
  }
};

// Upload CV (single PDF, max 5MB)
const uploadCV = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['application/pdf']),
}).single('cv');

// Upload Portfolio (single PDF, max 5MB)
const uploadPortfolio = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['application/pdf']),
}).single('portfolio');

// Upload Documentation (multiple images, max 5MB each, max 10 files)
const uploadDocumentation = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
}).any();

// Upload Application (CV wajib + portfolio opsional)
const uploadApplication = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['application/pdf']),
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
]);

// Upload Avatar (single image, max 5MB)
const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('avatar');

module.exports = { uploadCV, uploadPortfolio, uploadDocumentation, uploadApplication, uploadAvatar };
