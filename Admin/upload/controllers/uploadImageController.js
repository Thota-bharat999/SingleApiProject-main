const Messages = require('../../../utils/messages');
const messages = require('../../../utils/messages');
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message:Messages.ADMIN.ERROR.NO_IMAGE_FILE });
  }

  res.status(200).json({
    success: true,
    message: Messages.ADMIN.SUCCESS.IMAGE_FILE,
    filePath: `/upload/images/${req.file.filename}`,
  });
};
