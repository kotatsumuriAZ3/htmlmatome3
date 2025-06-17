# htmlmatome3

このアプリは html が書かれたファイルを読み込んで、
「div id="数値"」の ID を持つタグの部分を抜き出し
必要な部分を選択したり順番を入れ替えたり特定のタグをつけたりして
加工した html を出力します。

# デプロイ先

https://kotatsumuriAZ3.github.io/htmlmatome3/

# 注意点

このアプリは開発学習用として作成しており、品質保証はしていません。
Gemini 2.5 Flash でコーディングしています。
ライセンスは MPL-2.0 を採用しています。(https://www.mozilla.org/en-US/MPL/2.0/)
MPL-2.0 非公式日本語訳(https://www.mozilla.jp/documents/mpl/2.0/)

# Vite + React + Typescript + SWC

npm install
npm install react-virtuoso
npm install dompurify

## 🔧 利用技術スタック

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
- [React-Virtuoso](https://virtuoso.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
