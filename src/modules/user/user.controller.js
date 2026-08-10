const userService = require('./user.service');
const { success } = require('../../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    return success(res, { data: user });
  } catch (error) {
    next(error);
  }
};

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

const deleteAccount = async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user.id);
    return success(res, { message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
