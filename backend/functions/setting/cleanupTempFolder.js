const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const tempDir = os.tmpdir();
const tempFolderPath = path.join(tempDir, 'firebase_temp_folder');

const cleanupTempFolder = async() => {
  try {
    const files = await fs.readdir(tempFolderPath);
    for (const file of files) {
      const filePath = path.join(tempFolderPath, file);
      await fs.unlink(filePath);
    
    }
  } catch(error) {
    console.error(error.messasge);

  }
}

module.exports = { cleanupTempFolder }