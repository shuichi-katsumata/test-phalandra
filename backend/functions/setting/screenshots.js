//  エラーが出た個所の画面確認用に使う

const fs = require('fs');
const path = require('path');

const screenshotStep = async (page, loginUrl, stepName) => {
  // screenshots.js と同じ階層に保存
  const dir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = loginUrl.replace(/https?:\/\//, '').replace(/[\/\?\=&]/g, '_') + `_${stepName}.png`;
  const filepath = path.join(dir, filename);

  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved as ${filepath}`);
};

module.exports = screenshotStep;