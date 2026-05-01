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
  },

  // --- Chat Messages ---
  defaultWelcomeMessage: () => ({
    role: 'assistant',
    text: 'こんにちは！Honest BabyのAIコンサルタントです🧸 ご自宅用からギフトまで、何でも相談してね！'
  }),
  getChatMessages: () => {
    try {
      const stored = localStorage.getItem('hb_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [storage.defaultWelcomeMessage()];
  },
  saveChatMessages: (messages) => {
    try {
      localStorage.setItem('hb_chat_messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
  },

  // --- Archived Chats ---
  getArchivedChats: () => {
    try {
      return JSON.parse(localStorage.getItem('hb_archived_chats') || '[]');
    } catch {
      return [];
    }
  },
  archiveCurrentChat: (messages) => {
    try {
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length === 0) return;
      const archives = storage.getArchivedChats();
      const preview = userMessages[0].text.slice(0, 40);
      archives.unshift({
        id: Date.now().toString(),
        archivedAt: new Date().toISOString(),
        preview,
        messages,
      });
      // Keep at most 20 archived conversations
      localStorage.setItem('hb_archived_chats', JSON.stringify(archives.slice(0, 20)));
      // Clear current chat
      localStorage.removeItem('hb_chat_messages');
    } catch {
      // ignore
    }
  },
  deleteArchivedChat: (id) => {
    try {
      const archives = storage.getArchivedChats().filter(a => a.id !== id);
      localStorage.setItem('hb_archived_chats', JSON.stringify(archives));
    } catch {
      // ignore
    }
  },
  restoreArchivedChat: (id) => {
    try {
      const archives = storage.getArchivedChats();
      const target = archives.find(a => a.id === id);
      if (!target) return null;
      // Save as current chat
      localStorage.setItem('hb_chat_messages', JSON.stringify(target.messages));
      // Remove from archives
      localStorage.setItem('hb_archived_chats', JSON.stringify(archives.filter(a => a.id !== id)));
      return target.messages;
    } catch {
      return null;
    }
  },
};
