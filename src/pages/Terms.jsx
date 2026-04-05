export default function Terms() {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">利用規約</h1>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          この利用規約（以下、「本規約」といいます。）は、HonestBaby（以下、「当アプリ」といいます。）が提供するサービスの利用条件を定めるものです。ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
        </p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">第1条（適用）</h2>
        <p>本規約は、ユーザーと当アプリとの間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">第2条（免責事項）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>価格・在庫の正確性について:</strong> 本サービスで表示される「実質最安値」や商品情報は、楽天Webサービス等の外部APIを利用して取得した時点のものです。実際の販売先サイトにおける価格、在庫、ポイント還元率とは異なる場合があり、当アプリはその正確性や完全性を保証するものではありません。<strong>必ずリンク先の販売サイトで最新情報をご確認ください。</strong></li>
          <li><strong>AI相談について:</strong> AIによるお買い物相談や「欠点」の要約は、一般的なデータやレビューに基づき機械的に生成された参考情報です。その内容の正確性、有用性、特定の目的への適合性について一切の保証を行わず、これに起因する損害について当アプリは責任を負いません。</li>
          <li><strong>非保証等:</strong> 当アプリは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">第3条（サービス内容の変更等）</h2>
        <p>当アプリは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。</p>

        <h2 className="text-lg font-bold text-slate-800 mt-6 mb-2">第4条（利用規約の変更）</h2>
        <p>当アプリは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
      </div>
    </div>
  );
}
