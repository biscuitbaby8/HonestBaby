export default function Privacy() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">プライバシーポリシー</h1>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          HonestBaby（以下、「当アプリ」といいます。）は、本アプリ上で提供するサービスにおける、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">1. 収集する情報とその利用目的</h2>
        <p>当アプリは、ユーザーがお買い物相談や商品検索を行うための前提知識として、「環境プロフィール（玄関の幅、車種など）」の情報を入力・保存する機能を提供しています。<br />これらはすべてユーザーの端末の「Local Storage（ローカルストレージ）」にのみ保存され、当アプリの運営サーバーに送信・蓄積されることはありません。</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">2. 外部APIの利用について</h2>
        <p>当アプリでは、最新の商品データ取得やAIによる相談機能を提供するため、以下の外部APIを利用しています。入力された検索キーワードや相談内容は、これらのサービスに送信される場合があります。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>楽天Webサービス / Yahoo!デベロッパーネットワーク</strong>: 商品検索のため。</li>
          <li><strong>Google Gemini API</strong>: AIへの相談内容の解析と返答生成のため。データはGoogleの利用規約に基づき処理され、個人の特定やAIの学習に利用されない設定としています。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">3. アフィリエイトプログラムについて</h2>
        <p>当アプリは、適格販売により収入を得るアフィリエイトプログラム（楽天アフィリエイト、バリューコマース等）の参加者です。アプリ内の商品リンクを経由して購入が行われた場合、紹介料を獲得することがあります。</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">4. お問い合わせ窓口</h2>
        <p>本ポリシーに関するお問い合わせは、各ストアのサポートフォームよりお願いいたします。</p>
      </div>
    </div>
  );
}
