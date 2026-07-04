# HonestBaby SEO・集客・収益最大化プラン（2026-07 全コード調査版）

全コード（App Router ページ / SPA本体 / API routes / vercel.json / next.config / Supabase マイグレーション）を調査した結果に基づく改善プラン。
**P0（不具合の疑い・即対応）→ P1（効果大）→ P2（中期）→ P3（拡張）** の優先度順。

---

## 0. 現状できていること（維持すべき資産）

- トップ / カテゴリ / 商品 / iHerb ページの ISR（revalidate 3600）+ クローラー向け SSR HTML
- Product / AggregateOffer / AggregateRating / BreadcrumbList / WebSite / Organization / CollectionPage の JSON-LD
- `app/sitemap.js`（商品・カテゴリを網羅）、robots.txt、canonical、www→apex リダイレクト
- 楽天 affiliateId 付きURLのDB保存、ValueCommerce 直リンク生成（Yahoo）、iHerb Partnerize の土台
- PWA + Web Push（週次 / 月齢マイルストーン）による再訪問導線
- 画像プロキシ `/api/img`（SSRF対策・キャッシュ `s-maxage=31536000, immutable` 済み）
- 選び方ガイド（ベビーカーのみ）、記事配信の仕組み（`/article/:slug` → `/api/article`）

---

## P0: 不具合の疑い — 即検証・修正（SEOに致命傷の可能性）

### P0-1. vercel.json が存在しないAPIへ rewrite している【最重要】

`vercel.json` に以下の rewrite が残っているが、**`app/api/sitemap` と `app/api/ogp` はコードベースに存在しない**（旧 Vite SPA 時代の遺物）。

| rewrite | 宛先 | 影響 |
|---|---|---|
| `/sitemap.xml` → `/api/sitemap` | **存在しない** | Next の `app/sitemap.js` が生成するサイトマップに到達できず 404 の可能性。Google がサイトマップを読めない＝インデックス登録が大幅に阻害される |
| `/product/:id`（bot UA時）→ `/api/ogp?id=` | **存在しない** | `Google-InspectionTool`・Twitterbot・LINE 等のボットに 404 を返す可能性。URL検査ツールでの検証失敗、SNSシェアでOGP不表示 |
| `/category/:cat`（bot UA時）→ `/api/ogp?cat=` | **存在しない** | 同上 |

**対応:**
1. Search Console の URL検査で `/product/...` を検査、`curl -A "Twitterbot" https://honestbaby-care.com/sitemap.xml` 等で実挙動を確認（本セッションの実行環境からは外部到達不可のため未検証）。
2. 404 が確認されたら、`/sitemap.xml` rewrite と bot UA rewrite 2件を **vercel.json から削除**。App Router のページは既に OGP 画像（`opengraph-image.jsx`）とメタデータを SSR で返せるため、この rewrite 自体が不要。
3. 修正後、Search Console でサイトマップを再送信。

### P0-2. Search Console のカバレッジ確認

P0-1 が実際に発生していた場合、インデックス未登録ページが大量にあるはず。修正後 2〜4 週間はカバレッジレポート（登録済み / クロール済み-未登録）を毎週確認する。

---

## P1: 効果の大きい SEO 改善（1〜2週間で実装可能）

### P1-1. 記事（/article/:slug）を SEO 資産に昇格

現状の記事配信は API route の手書き HTML で、以下が欠けている:

- **sitemap 未掲載**（`app/sitemap.js` は products とカテゴリのみ）
- **Article / BreadcrumbList JSON-LD なし**
- **記事一覧ページなし**（SPA 内でしか一覧できない → クローラーが記事を発見できない）
- **記事→商品・カテゴリへの内部リンクが CTA 1本のみ**
- 著者・公開日・更新日の表示なし（E-E-A-T シグナル欠如)

**対応:**
- `app/article/[slug]/page.jsx` + `app/article/page.jsx`（一覧）を App Router に新設し ISR 配信。vercel.json の `/article/:slug` rewrite を廃止。
- `generateMetadata`（canonical / OGP 絶対URL）、Article + BreadcrumbList JSON-LD、`datePublished` / `dateModified` を出力。
- sitemap に articles テーブルの published 記事を追加。
- トップページ SSR とカテゴリページに「関連ガイド記事」セクションを追加して内部リンクを張る（記事⇄カテゴリ⇄商品の三角リンク）。

### P1-2. サブカテゴリのランディングページ化【検索ボリューム獲得の本丸】

現状サブカテゴリ（A型ベビーカー、テープSサイズ等）は **CategoryClient のクライアント状態**で、URLも専用ページも存在しない。「A型ベビーカー おすすめ」「おむつ M パンツ 比較」のようなロングテールキーワードを取りこぼしている。

**対応:**
- `/category/[name]/[sub]` ルートを新設（`generateStaticParams` で CATEGORY_TREE の subs を静的生成、約80ページ）。
- サブカテゴリ別の title / description / H1 / 商品一覧（`sub_category` でDBフィルタ）/ パンくず3階層 / JSON-LD を出力。
- 親カテゴリページからサブカテゴリタブを `<Link>` 化して内部リンクで辿れるようにする（現状は `<button>` でクローラー不可視）。

### P1-3. 選び方ガイドを全カテゴリへ拡充 + サーバー側で配信

`CATEGORY_GUIDES` は現在ベビーカー 1 カテゴリのみ。カテゴリページ本文が商品グリッドだけの「薄いコンテンツ」になっている。

**対応:**
- 主要カテゴリ（おむつ / 抱っこ紐 / チャイルドシート / ベビーベッド / 哺乳瓶 / マタニティ 優先）にタイプ解説 + チェックリスト + FAQ（3〜5問）を執筆。
- ガイド描画を CategoryClient から **サーバーコンポーネント側（page.jsx）へ移動**（商品0件時にも確実にHTMLに含まれ、クライアントJSにも依存しない）。
- FAQ は本文コンテンツとして追加（FAQリッチリザルトは現在ほぼ表示されないため、構造化データより本文の質を優先）。

### P1-4. 商品ページの薄いコンテンツ解消

商品SSRページは「商品名・価格・ショップ一覧・レビュー5件」のみ。DB に `description`・`ai_analysis` 列が存在するのに未使用。

**対応:**
- `description`（サニタイズの上）と `ai_analysis` の要約を SSR 本文に出力。
- title の改善: 楽天由来の長い商品名をそのまま使うと全ページ類似タイトルになる。`brand + 正規化商品名 + カテゴリ` で 60 文字以内に整形するユーティリティを導入。
- Product JSON-LD に `description`、`offers.url`（最安ショップ）、`review`（個別レビュー数件）を追加。
- 「この商品を見た人はこちらも」= 同ブランド商品リンクを追加（下記ブランドページと連動）。

### P1-5. ブランドページ新設

`brand` 列は整備済み（migration 009）。「エルゴベビー 抱っこ紐 比較」「ピジョン 哺乳瓶」などブランド指名検索は購買意欲が最も高い。

**対応:** `/brand/[name]` を ISR で新設（商品一覧 + ブランド紹介文 + JSON-LD + sitemap 登録 + 商品ページからの内部リンク）。

### P1-6. robots.txt / 細部の整備

- `Disallow: /api/`（画像プロキシ等のクロール浪費防止。`/article/:slug` はページパスなので影響なし）
- `app/layout.jsx` に `title.template: '%s | HonestBaby'` を導入し、子ページのタイトル管理を一元化。
- Bing Webmaster Tools 登録（Search Console 連携インポートで5分。日本では意外と流入がある + ChatGPT等のAI検索は Bing インデックスを参照）。

---

## P2: パフォーマンス改善（Core Web Vitals = 順位要因）

### P2-1. 初期表示の構造問題

全ページが「SSR HTML → スプラッシュ表示 → **5,300行の App.jsx** ロード → SPA 起動」という構成。検索流入ユーザーは商品ページを見に来たのに、毎回フルアプリの JS を待たされる。LCP / INP / TBT に不利で、直帰率を押し上げる。

**対応（段階的に）:**
1. **短期**: 商品・カテゴリページで SPA 起動を遅延（ユーザー操作があるまで `App` を dynamic import しない「lazy hydration」）。SSR コンテンツをそのまま初期表示として使い、スプラッシュを撤廃。
2. **中期**: App.jsx をルート単位で分割（検索 / 商品詳細 / お気に入り / 設定）し、ページごとに必要なチャンクだけ読む。
3. LCP 画像（商品ヒーロー画像）に `fetchpriority="high"` を付与、一覧の `<img>` に `width` / `height` を明示して CLS を防止。

### P2-2. next/image への移行（または現行 img の最適化徹底）

`next.config.mjs` に `remotePatterns` 設定済みなのに `<img>` 直書き。next/image に移行すれば AVIF/WebP 変換・srcset・サイズ最適化が自動になる。画像プロキシ `/api/img` と競合するため、「next/image の loader として /api/img を指定」する形が現実的。

---

## P3: 集客チャネルの拡大

| 施策 | 内容 | 期待効果 |
|---|---|---|
| **月齢別ページ** | `/age/3-months` 等。「生後3ヶ月 必要なもの」は検索意図が強く、既存の月齢サジェスト機能（CATEGORY_AGE_SUGGESTIONS）のデータを流用できる | 検索流入 + アプリの月齢体験への導線 |
| **比較記事の型化** | 「メリーズ vs パンパース」「エルゴ オムニ360 vs アダプト」等の2商品比較。admin-article + AI生成の既存パイプラインでテンプレ化 | 指名比較KWは CVR が最も高い |
| **週次ランキングページ** | `/ranking/[category]`。popularity_rank を日次 cron で既に同期しているため実装コストが低い。「今週のおむつ売れ筋」など更新頻度シグナルにもなる | 再クロール促進 + SNSシェア素材 |
| **RSS フィード** | `app/feed.xml/route.js` で記事のRSSを配信 | Google Discover / RSSリーダー / 他サービス連携 |
| **SNS 自動投稿** | 週次ランキング・値下がり商品を X / Instagram に自動投稿（cron 追加）。SNS共有ボタンは実装済みなので発信側を作る | 非検索チャネルの確立 |
| **LINE 公式アカウント** | Push 通知の LINE 版。日本の子育て層への到達率は Web Push より高い | 再訪問・アラート開封率向上 |

---

## P4: 収益の最大化

### P4-1. アフィリエイトリンクの精度向上

- **Amazon**: 現状 `amazon.co.jp/s?k=検索語&tag=honestbaby-22` の検索結果リンク。検索結果ページは離脱が多く CVR が低い。PA-API 5.0（アソシエイト実績が要件）導入で ASIN 直リンク + Amazon実売価格の比較表示に格上げする。それまでは検索語の正規化（型番・ブランドを先頭に）でヒット精度を上げる。
- **iHerb**: Partnerize 承認後に `IHERB_CAMREF_ID` を Vercel に設定するだけで有効化される実装済み。承認され次第、/iherb 特集 + マタニティ記事から送客。
- **ValueCommerce**: AutoMyLink は SPA の動的挿入リンクを変換できないことがある。Yahoo は `toVCUrl` の直リンク生成済みなので、**SSR 商品ページの「見る」ボタンにも同じ変換を適用**されているか確認（現状 DB の `s.url` をそのまま出力しており、Yahoo 分に VC パラメータが乗っているか要確認）。
- **公式ECアフィリエイト**: `OFFICIAL_RETAILERS` の `affiliateParam` が全て空。docs/affiliate-applications.md の通り A8 / もしも / VC へ提携申請し、承認され次第設定（アカチャンホンポ・コンビ・アップリカ・ピジョン）。

### P4-2. 高単価カテゴリへの導線強化

- **マタニティ（葉酸サプリ）**: 物販の中で最も料率が高い分野の一つ。P1-3 のガイド + 専用記事を優先執筆。
- **レンタル**: ベビー用品レンタル専門ASP案件（Babyrenta / ベビレンタ等）は高料率。レンタルカテゴリからの送客先を楽天だけでなく専門サービスに拡張。
- **ギフトセット**: 出産祝いは価格感度が低く客単価が高い。「予算1万円の出産祝い」等のシーン別記事と相性が良い。

### P4-3. 収益計測基盤（現状ゼロ → 最優先の可視化）

現状、**アフィリエイトクリックのイベント計測が一切ない**（GA4 はページビューのみ）。何が稼いでいるか分からないままでは施策の優先順位が付けられない。

**対応:**
- SSR 商品ページ・SPA 双方の外部ショップリンクに GA4 カスタムイベント `affiliate_click`（product_id / shop / price / 導線 をパラメータ送信）を実装。
- 週次で「クリック数 × ショップ別」レポートを確認し、ASP 管理画面の成果と突合。CVR の高い導線（商品ページ直 / 記事経由 / 価格アラート経由）に投資を寄せる。
- 価格アラート Push・週次 Push の開封→クリック率も同様に計測。

---

## 実施ロードマップ（推奨順）

| 週 | 作業 | 種別 |
|---|---|---|
| 今すぐ | P0-1 vercel.json の死んだ rewrite 検証・削除、サイトマップ再送信 | 修正 |
| 1週目 | P1-6 robots/title template/Bing、P4-3 affiliate_click 計測 | 小粒・効果大 |
| 1-2週目 | P1-1 記事の App Router 移行 + sitemap + 内部リンク | 実装 |
| 2-3週目 | P1-2 サブカテゴリページ、P1-4 商品ページ増強 | 実装 |
| 3-4週目 | P1-3 ガイド執筆（6カテゴリ）、P1-5 ブランドページ | 実装+執筆 |
| 2ヶ月目 | P2 パフォーマンス（lazy hydration → コード分割）、P3 ランキング/月齢ページ | 実装 |
| 継続 | 比較記事を週1-2本、P4-1/4-2 の ASP 提携・高単価導線、Search Console 監視 | 運用 |

### 効果測定の目安
- P0 修正 → 2〜4週間でインデックス数の回復（Search Console カバレッジ）
- P1 群 → 2〜3ヶ月でロングテール流入の増加（サブカテゴリ・記事ページの表示回数）
- P4-3 → 実装直後から収益導線の可視化が可能
