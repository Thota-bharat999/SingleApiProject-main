const fs = require('fs');
const path = require('path');
const Messages = require('../../../utils/messages');

exports.uploadJson = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message:Messages.ADMIN.ERROR.NO_JSON_FILE });
  }

  const filePath = path.join(__dirname, '../../upload/json/', req.file.filename);
  const fileContent = fs.readFileSync(filePath, 'utf8');

  try {
    const jsonData = JSON.parse(fileContent);

    res.status(200).json({
      success: true,
      message:Messages.ADMIN.SUCCESS.JSON_FILE,
      filePath: `/upload/json/${req.file.filename}`,
      content: jsonData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message:Messages.ADMIN.ERROR.INVALID_JSON });
  }
};
