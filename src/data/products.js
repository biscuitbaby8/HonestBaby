export const products = [
  {
    id: 'p-001',
    name: 'AiryFold ベビーカー ライトエディション',
    category: 'ベビーカー',
    brand: 'HonestKids',
    jan: '4500123456789',
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80',
    dimensions: {
      width: 45, // cm
      depth: 85,
      height: 100,
      foldedWidth: 45,
      foldedDepth: 30,
      foldedHeight: 90
    },
    weight: 4.8, // kg
    rating: 4.2,
    features: ['超軽量', '片手で折りたたみ', 'UPF50+ サンシェード'],
    drawbacksSummary: {
      tldr: '軽さを追求した反面、段差に弱く荷物収納力は控えめ。',
      notRecommendedFor: [
        '未舗装の道や段差が多いエリアに住む人',
        '買い物の荷物をベビーカーにたくさん積みたい人',
        '高身長でハンドルの低さが気になる人'
      ],
      socialVoice: '「持ち運びには最高だけど、ちょっとした段差でつまずくからヒヤッとする。（Twitter）」'
    }
  },
  {
    id: 'p-002',
    name: 'SafeGuard チャイルドシート 360',
    category: 'チャイルドシート',
    brand: 'BabyRide',
    jan: '4500987654321',
    imageUrl: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?auto=format&fit=crop&w=400&q=80',
    /* 
      FitChecker will use dimensions vs user profile.
      isIsofix: true
    */
    dimensions: {
      width: 44,
      depth: 64,
      height: 61,
      baseArea: 44 * 64
    },
    weight: 12.5,
    rating: 4.5,
    features: ['ISOFIX対応', '360度回転', '洗えるシート'],
    drawbacksSummary: {
      tldr: '安全性と機能性は高いが、サイズが大きく重量級。軽自動車には不向き。',
      notRecommendedFor: [
        '軽自動車やコンパクトカーに乗っている人',
        'ママ一人で他の車へ頻繁に乗せ替える予定の人',
        '後部座席に大人が2人乗る必要がある人'
      ],
      socialVoice: '「回転式は乗せ降ろしが楽すぎる！でもN-BOXにつけたら隣に大人が座るのはキツイ…（Instagram）」'
    }
  },
  {
    id: 'p-003',
    name: 'エブリデイ・抱っこ紐 メッシュPro',
    category: '抱っこ紐',
    brand: 'HugMom',
    jan: '4500111222333',
    imageUrl: 'https://images.unsplash.com/photo-1544421554-1594e9f78eb9?auto=format&fit=crop&w=400&q=80',
    dimensions: {
      width: 33,
      depth: 15,
      height: 40 // packable size
    },
    weight: 0.8,
    rating: 4.0,
    features: ['全面メッシュ構造', '腰サポートパッド', '前向き抱っこ対応'],
    drawbacksSummary: {
      tldr: '通気性抜群だが、小柄な体型のママにはベルトが余り気味になる。',
      notRecommendedFor: [
        '身長150cm以下の小柄な方',
        '新生児期からインサート無しですぐ使いたい方'
      ],
      socialVoice: '「涼しくて夏は快適。だけど紐が長すぎて引きずりそうになる。（レビューサイト）」'
    }
  }
];
