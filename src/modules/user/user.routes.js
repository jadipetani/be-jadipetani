const router = require('express').Router();
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { updateProfileSchema, changePasswordSchema } = require('./user.schema');
const controller = require('./user.controller');

router.put('/profile', auth, validate(updateProfileSchema), controller.updateProfile);
router.put('/change-password', auth, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
