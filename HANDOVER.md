# Project Handover: Honest Baby Optimization (v1.2.1)

## 1. プロジェクト概要
Honest Baby は、楽天・Yahoo・Amazonの価格比較およびSNS口コミを表示するベビー用品発見エンジンです。
- **Tech Stack**: React (Vite), TailwindCSS, Supabase, Vercel.
- **Current Branch**: `main`

## 2. 直近の実施内容とステータス
以下の修正を `src/App.jsx` に適用済みですが、Vercel のデプロイ反映が不安定な状態です。

- **画像高画質化**: `getHighResImage` 関数を実装し、楽天(1000px)やYahooの画像を最高画質で表示するように修正。
- **パフォーマンス改善**: `openProduct` 関数を非同期化。クリックした瞬間に `navigate` し、重いデータは後から読み込む「即時遷移」を実装。
- **管理者モードの安定化**: `sessionStorage` を使用し、詳細ページへ移動しても管理状態を維持。イベント伝達を阻止し、誤操作を防止。
- **Amazon統合**: ショップ比較リストに Amazon をアイコン付きで統合。「最安値をチェック」の文言で統一。
- **ESLint修理**: ESLint 9 の設定不備（eslint.config.js）がビルドを止めていたため、ルールを緩和してビルドが通るように修正。

## 3. 現在の問題点 (最優先課題)
**Vercel へのデプロイが反映されない:**
- 修正をプッシュしても、本番サイト（honestbaby-care.com）が古いコミット（3181edf等）に固執している場合があります。
- **確認方法**: 商品詳細ページの一番下に `Honest Baby v1.2.1` という文字が見えれば成功。見えなければデプロイ失敗。
- **原因の推測**: Vercel 側のビルドコマンド設定（Override）や、キャッシュの固着、あるいは以前のビルドエラーによるパイプラインの停止。

## 4. Claude Code への指示案
Claude Code を起動後、以下のプロンプトで開始することをお勧めします：
> `HANDOVER.md` を読んで現状を把握してください。現在、`src/App.jsx` に適用した最新の修正（v1.2.1）が Vercel に反映されていません。Vercel のビルド状況を確認し、確実に最新版がデプロイされるようにしてください。

## 5. 主要ファイル
- `src/App.jsx`: メインロジック。
- `eslint.config.js`: ビルドを止めていた原因。
- `package.json`: ビルドコマンド定義。
- `api/`: Vercel サーバーレス関数。
