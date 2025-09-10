# Phalandra Project

## 概要
- このリポジトリはフロントエンド (Vue 3 + Vite) とバックエンド (Node/Express) のセットです。
- Firebase を使用したデータ管理機能を含みます。
- Puppeteer を使って、オフィシャルサイトや外部サイトの情報を抽出し DB に反映することができます。
- 逆に、こちらから DB に追加した情報をオフィシャルサイトや外部サイトに反映することも可能です（双方向同期対応）。

---

## 機能
- フロントエンド：
  - Vue 3 + Vite を用いた SPA
  - フォーム入力、画像アップロード、プレビュー表示
- バックエンド：
  - Node.js + Express API
  - Firebase Realtime Database へのデータ追加・取得
  - Firebase Storage への画像アップロード

---

## 使用技術
- フロントエンド：
  - Vue 3
  - Vite
  - Vue Router
  - Pinia / Vuex（状態管理）
  - Bootstrap 5
- バックエンド：
  - Node.js
  - Express
  - Firebase Realtime Database, Storage
  - Puppeteer（スクレイピング・双方向同期）

---

## ディレクトリ構成
test_phalandra/

├─ frontend/ # Vue 3 + Vite フロントエンド

└─ backend/ # Node/Express バックエンド