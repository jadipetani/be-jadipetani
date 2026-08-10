const router = require('express').Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { uploadAvatar } = require('../../middlewares/upload');
const { updateProfileSchema, changePasswordSchema } = require('./user.schema');
const controller = require('./user.controller');

router.get('/profile', auth, controller.getProfile);
router.get('/profile/completion', auth, controller.getProfileCompletion);
router.post('/profile/avatar', auth, uploadAvatar, controller.uploadAvatar);
router.put('/profile', auth, validate(updateProfileSchema), controller.updateProfile);
router.put('/change-password', auth, validate(changePasswordSchema), controller.changePassword);
router.delete('/me', auth, controller.deleteAccount);

module.exports = router;
