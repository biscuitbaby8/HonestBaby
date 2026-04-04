// Profile structure default
const defaultProfile = {
  carType: 'none', // 'none', 'kei' (軽自動車), 'compact' (コンパクト), 'minivan' (ミニバン)
  trunkCapacity: 'medium', // 'small', 'medium', 'large'
  doorWidth: 80, // cm
  livingArea: 10, // 畳
  hasElevator: true,
};

export const storage = {
  // --- Profile ---
  getProfile: () => {
    try {
      const stored = localStorage.getItem('hb_profile');
      return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  },
  saveProfile: (profile) => {
    try {
      localStorage.setItem('hb_profile', JSON.stringify(profile));
      return true;
    } catch {
      return false;
    }
  },

  // --- Search History ---
  getSearchHistory: () => {
    try {
      return JSON.parse(localStorage.getItem('hb_search_history') || '[]');
    } catch {
      return [];
    }
  },
  addSearchHistory: (query) => {
    try {
      const history = storage.getSearchHistory();
      const updated = [query, ...history.filter(q => q !== query)].slice(0, 5);
      localStorage.setItem('hb_search_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  // --- Price Alerts ---
  getAlerts: () => {
    try {
      return JSON.parse(localStorage.getItem('hb_alerts') || '[]');
    } catch {
      return [];
    }
  },
  addAlert: (productId, targetPrice) => {
    try {
      const alerts = storage.getAlerts();
      const existingIdx = alerts.findIndex(a => a.productId === productId);
      if (existingIdx !== -1) {
        alerts[existingIdx].targetPrice = targetPrice;
      } else {
        alerts.push({ id: Date.now().toString(), productId, targetPrice, createdAt: new Date().toISOString() });
      }
      localStorage.setItem('hb_alerts', JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }
};
