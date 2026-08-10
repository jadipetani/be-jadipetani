const userService = require('./user.service');
const { success } = require('../../utils/apiResponse');

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, { message: 'Profil berhasil diperbarui', data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(req.user.id, req.body);
    return success(res, { message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, changePassword };
