const { admin } = require('../../utils/firebaseUtils');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const bucket = admin.storage().bucket();
const tempDir = os.tmpdir();    // ローカルの'C:\Users\<username>\AppData\Local\Temp'を返す
const tempFolderPath = path.join(tempDir, 'firebase_temp_folder');

const downloadImageFromFirebaseStorage = async(storageFilePath) => {
  try {
      // 一時的なディレクトリにファイルをダウンロード
      await fs.mkdir(tempFolderPath, { recursive: true });  // Local\Tempに'firebase_temp_folderが無かったら作成する'
      const [fileArray] = await bucket.getFiles({ prefix: storageFilePath });

      if(!fileArray.length) {
        console.warn(`No files found for prefix: ${storageFilePath}`);
        return;
      
      }

      for(const file of fileArray) {
        const storagePath = file.metadata.name;
        const normalizedPath = storagePath.replace(/\\/g, '/');
        let sanitizedFileName = path.basename(normalizedPath);
        const localFilePath = path.join(tempFolderPath, sanitizedFileName);
        console.log(`Downloading: ${storagePath} -> ${localFilePath}`);
        await file.download({ destination: localFilePath });

      }
  } catch (error) {
      console.error('error:', error);
      
  }
}

module.exports = {
    downloadImageFromFirebaseStorage, tempFolderPath,
}