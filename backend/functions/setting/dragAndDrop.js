// ドラッグ＆ドロップ関数の定義（どこにも使ってないよ）
async function dragAndDrop(page, sourceSelector, destinationSelector) {
    const sourceElement = await page.$(sourceSelector);
    const destinationElement = await page.$(destinationSelector);
    const sourceBox = await sourceElement.boundingBox();
    const destinationBox = await destinationElement.boundingBox();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2);
    await page.mouse.up();
}
module.exports = dragAndDrop;