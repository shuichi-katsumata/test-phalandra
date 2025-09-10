const sharp = require('sharp');
const fs = require('fs'); // ファイルシステムの略
const path = require('path');

const resizeImagesProgram = async(inputPath, outputPath, targetSizeKB) => {
  let quality = 100; // 初期画質を100％に設定
  let imageBuffer = fs.readFileSync(inputPath);

  // 画像サイズがtargetSizeKBを超えている間、画質を落とす
  while (imageBuffer.length > targetSizeKB * 1024 && quality > 10) {  // imageBuffer.lengthは画像のバイトサイズを表す
    imageBuffer = await sharp(inputPath)
      .resize({ height: 1200, fit: 'inside' })  //  長辺が1200px以下になるようにリサイズ
      .jpeg({ quality })  //  sharpで画像読み込み
      .toBuffer();  //  バッファとして新しい画像データを取得
    quality -= 10;  //  画質を10％ずつ下げる
  }
  fs.writeFileSync(outputPath, imageBuffer);  //  リサイズした画像を新しいファイルに保存
}

const checkAndResizeImage = async(filePath, tempFolderPath, panelData, i, targetSizeKB) => {
  const fileStats = fs.statSync(filePath);
  const fileSizeKB = fileStats.size / 1024; //  バイトをKBに変換

  const image = sharp(filePath);  //  画像を読み込む
  const metadata = await image.metadata();

  let resizedPath = filePath;

  if (fileSizeKB > targetSizeKB || Math.max(metadata.width, metadata.height) > 1200) {
    resizedPath = path.join(tempFolderPath, `resized${panelData[i+1]}`); //  リサイズ後の画像ファイル名
    await resizeImagesProgram(filePath, resizedPath, targetSizeKB);
  }
  return resizedPath;
}

module.exports = checkAndResizeImage;