// Multi-Tournament Storage Service with LocalStorage and IndexedDB support
import { INITIAL_DEMO_TOURNAMENT } from '../models/tournament';

const STORAGE_KEY_PREFIX = 'efootball_t2_';
const TOURNAMENT_LIST_KEY = 'efootball_t2_list';
const ACTIVE_TOURNAMENT_ID_KEY = 'efootball_t2_active_id';

class StorageService {
  constructor() {
    this.initDemoIfEmpty();
  }

  initDemoIfEmpty() {
    const list = this.getTournamentsList();
    if (list.length === 0) {
      this.saveTournament(INITIAL_DEMO_TOURNAMENT);
      this.setActiveTournamentId(INITIAL_DEMO_TOURNAMENT.id);
    }
  }

  getTournamentsList() {
    try {
      const raw = localStorage.getItem(TOURNAMENT_LIST_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading tournaments list:', e);
      return [];
    }
  }

  getActiveTournamentId() {
    try {
      const activeId = localStorage.getItem(ACTIVE_TOURNAMENT_ID_KEY);
      const list = this.getTournamentsList();
      if (activeId && list.some(t => t.id === activeId)) {
        return activeId;
      }
      return list.length > 0 ? list[0].id : null;
    } catch (e) {
      return null;
    }
  }

  setActiveTournamentId(id) {
    try {
      localStorage.setItem(ACTIVE_TOURNAMENT_ID_KEY, id);
    } catch (e) {
      console.error('Error setting active tournament id:', e);
    }
  }

  getTournamentById(id) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Error loading tournament ${id}:`, e);
      return null;
    }
  }

  saveTournament(tournament) {
    if (!tournament || !tournament.id) return false;

    try {
      const updated = {
        ...tournament,
        updatedAt: new Date().toISOString()
      };

      // Save full tournament data
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tournament.id}`, JSON.stringify(updated));

      // Update summary in list
      let list = this.getTournamentsList();
      const existingIdx = list.findIndex(t => t.id === tournament.id);

      const summary = {
        id: updated.id,
        name: updated.name,
        mode: updated.mode,
        status: updated.status || 'active',
        teamCount: updated.teams ? updated.teams.length : 0,
        createdAt: updated.createdAt || new Date().toISOString(),
        updatedAt: updated.updatedAt
      };

      if (existingIdx >= 0) {
        list[existingIdx] = summary;
      } else {
        list.unshift(summary);
      }

      localStorage.setItem(TOURNAMENT_LIST_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Error saving tournament:', e);
      return false;
    }
  }

  deleteTournament(id) {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      let list = this.getTournamentsList().filter(t => t.id !== id);
      localStorage.setItem(TOURNAMENT_LIST_KEY, JSON.stringify(list));

      if (this.getActiveTournamentId() === id) {
        if (list.length > 0) {
          this.setActiveTournamentId(list[0].id);
        } else {
          localStorage.removeItem(ACTIVE_TOURNAMENT_ID_KEY);
        }
      }
      return true;
    } catch (e) {
      console.error('Error deleting tournament:', e);
      return false;
    }
  }

  duplicateTournament(id) {
    const original = this.getTournamentById(id);
    if (!original) return null;

    const newId = `tourney_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cloned = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveTournament(cloned);
    return cloned;
  }

  exportTournamentJson(id) {
    const tournament = this.getTournamentById(id);
    if (!tournament) return null;
    return JSON.stringify(tournament, null, 2);
  }

  exportAllJson() {
    const list = this.getTournamentsList();
    const all = list.map(item => this.getTournamentById(item.id)).filter(Boolean);
    return JSON.stringify({ version: '2.0', exportDate: new Date().toISOString(), tournaments: all }, null, 2);
  }

  importTournamentJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      if (parsed.tournaments && Array.isArray(parsed.tournaments)) {
        parsed.tournaments.forEach(t => {
          if (t.id && t.name) {
            this.saveTournament(t);
          }
        });
        return { success: true, count: parsed.tournaments.length };
      } else if (parsed.id && parsed.name) {
        this.saveTournament(parsed);
        this.setActiveTournamentId(parsed.id);
        return { success: true, count: 1 };
      }
      return { success: false, error: 'Format JSON tidak dikenali' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const storage = new StorageService();
