const { JSDOM } = require('jsdom');
// HTMLセレクター
function article_extraction(htmlString) {
    const dom = new JSDOM(htmlString);
    const paragraphs = dom.window.document.querySelectorAll('p'); // jsdomのインスタンスから提供されているwindowからhtml全体(document)のpタグを抽出する
    const extractedTextArray = Array.from(paragraphs, element => element.textContent); // 第一引数(paragraphs)を["First paragraph", "Second paragraph", "Third paragraph"]みたいに取得している
    return extractedTextArray.join('\n'); // extractedTextArrayで得た文章を改行で結合して文字列にしている
}
module.exports = article_extraction;