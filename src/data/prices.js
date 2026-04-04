export const prices = {
  'p-001': {
    amazon: { price: 29800, shipping: 0, points: 298, link: 'https://amazon.co.jp' },
    rakuten: { price: 31000, shipping: 0, points: 3100, link: 'https://rakuten.co.jp' }, // points represent 10%
    yahoo: { price: 30500, shipping: 500, points: 1500, link: 'https://shopping.yahoo.co.jp' },
    mercari: { lowestUsed: 15000, avgUsed: 18000, condition: '良', link: 'https://jp.mercari.com' }
  },
  'p-002': {
    amazon: { price: 54000, shipping: 0, points: 540, link: 'https://amazon.co.jp' },
    rakuten: { price: 58000, shipping: 0, points: 8700, link: 'https://rakuten.co.jp' }, // 15% points
    yahoo: { price: 55000, shipping: 0, points: 2750, link: 'https://shopping.yahoo.co.jp' },
    mercari: { lowestUsed: 25000, avgUsed: 30000, condition: '目立った傷や汚れなし', link: 'https://jp.mercari.com' }
  },
  'p-003': {
    amazon: { price: 18000, shipping: 0, points: 180, link: 'https://amazon.co.jp' },
    rakuten: { price: 19500, shipping: 0, points: 1950, link: 'https://rakuten.co.jp' },
    yahoo: { price: 18500, shipping: 0, points: 925, link: 'https://shopping.yahoo.co.jp' },
    mercari: { lowestUsed: 8000, avgUsed: 10000, condition: 'やや傷や汚れあり', link: 'https://jp.mercari.com' }
  }
};
