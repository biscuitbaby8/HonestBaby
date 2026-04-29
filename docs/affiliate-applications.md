# アフィリエイト申請方法まとめ

## 各ASP・ショップへの申請先

| ショップ | 申請先ASP | 備考 |
|---|---|---|
| アカチャンホンポ公式 | A8.net / ValueCommerce | 両方に掲載あり。A8が審査通りやすい |
| ベビザラス（トイザらス） | A8.net | プログラム一覧で「トイザらス」検索 |
| コンビ公式 | もしもアフィリエイト | もしものプログラム一覧で検索 |
| アップリカ公式 | ValueCommerce / A8.net | 公式サイトでも確認推奨 |
| ピジョン公式 | A8.net | 楽天・Yahoo経由でもアフィリエイト可 |
| Amazon | Amazonアソシエイト（独自） | サイトへのアクセス実績が申請に必要 |
| 楽天市場 | 楽天アフィリエイト（独自） | 楽天会員登録後に申請 |
| Yahoo!ショッピング | ValueCommerce | ValueCommerce経由で申請 |

## 申請の共通手順

1. 各ASPに会員登録（無料）
   - [A8.net](https://www.a8.net)
   - [もしもアフィリエイト](https://af.moshimo.com)
   - [ValueCommerce](https://www.valuecommerce.ne.jp)
   - [アクセストレード](https://www.accesstrade.ne.jp)

2. 「プログラム一覧」でブランド名を検索 → 提携申請

3. 承認後、専用リンクを発行

4. **HonestBaby では ValueCommerce AutoMyLink を `index.html` に組み込み済み**
   → サイト内のリンクが自動でアフィリエイトリンクに変換される

## Vercelに設定が必要な環境変数

| 変数名 | 用途 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase接続 |
| `VITE_SUPABASE_ANON_KEY` | Supabase認証 |
| `RAKUTEN_APP_ID` | 楽天ランキング・検索API |
| `RAKUTEN_AFFILIATE_ID` | 楽天アフィリエイトID |
| `RAKUTEN_ACCESS_KEY` | 楽天APIアクセスキー |
| `YAHOO_CLIENT_ID` | Yahoo!ショッピングAPI |
| `VITE_GEMINI_API_KEY` | Gemini AI（なくても動作可） |
