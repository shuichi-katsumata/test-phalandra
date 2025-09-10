const { admin } = require('../../utils/firebaseUtils');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const bucket = admin.storage().bucket();
const tempDir = os.tmpdir();    // ローカルの'C:\Users\<username>\AppData\Local\Temp'を返す
const tempFolderPath = path.join(tempDir, 'firebase_temp_folder');

const downloadImageFromFirebaseStorage = async(accountKey, storageFilePath, data) => {
  try {
      // 一時的なディレクトリにファイルをダウンロード
      await fs.mkdir(tempFolderPath, { recursive: true });  // Local\Tempに'firebase_temp_folderが無かったら作成する'
      const files = await bucket.getFiles({ prefix: storageFilePath });
      for(const fileArray of files) {
        for(const file of fileArray) {
            const sanitizedFileName = file.metadata.name.replace(new RegExp(`^users\\/${accountKey}\\/add_girl\\/${data.castName}\\/.*?\\/`), ''); // 無効な文字をアンダースコアに置換　RegExpで正規表現の文字列として構築される。
            const localFilePath = path.join(tempFolderPath, sanitizedFileName);
            await file.download({ destination: localFilePath });

        }
      }
  } catch (error) {
      console.error('error:', error);
      
  }
}

module.exports = {
    downloadImageFromFirebaseStorage, tempFolderPath,
}