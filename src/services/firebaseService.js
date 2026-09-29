// Firebase Realtime Database Service for Multi-Device Cloud Sync & Automated Snapshots
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, update, onValue, off, get, child, remove } from 'firebase/database';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAN7ifCozONKz0kNj5DnfEL_mkZkPMMk5M",
  authDomain: "the-noob-indonesia.firebaseapp.com",
  databaseURL: "https://the-noob-indonesia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-noob-indonesia",
  storageBucket: "the-noob-indonesia.firebasestorage.app",
  messagingSenderId: "1012903582106",
  appId: "1:1012903582106:web:ff96ee9cf6ba1d29a78223"
};

const STORAGE_KEY_CUSTOM_FB = 'efootball_custom_firebase_config';
const MAX_CLOUD_SNAPSHOTS = 20;

// Smart Merge: Preserves existing valid scores so stale clients cannot wipe out filled matches
export function mergeTournamentData(existing, incoming) {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const merged = { ...incoming };

  // Ensure groupMatches is an array
  const incomingMatches = Array.isArray(incoming.groupMatches)
    ? incoming.groupMatches
    : incoming.groupMatches && typeof incoming.groupMatches === 'object'
    ? Object.values(incoming.groupMatches)
    : [];

  const existingMatches = Array.isArray(existing.groupMatches)
    ? existing.groupMatches
    : existing.groupMatches && typeof existing.groupMatches === 'object'
    ? Object.values(existing.groupMatches)
    : [];

  if (existingMatches.length > 0 && incomingMatches.length > 0) {
    const existingMap = new Map();
    existingMatches.forEach(m => {
      if (m && m.id) existingMap.set(m.id, m);
    });

    merged.groupMatches = incomingMatches.map(inMatch => {
      if (!inMatch) return inMatch;
      const exMatch = existingMap.get(inMatch.id);
      if (!exMatch) return inMatch;

      const inHasScore = inMatch.homeScore !== null && inMatch.homeScore !== undefined && inMatch.awayScore !== null && inMatch.awayScore !== undefined;
      const exHasScore = exMatch.homeScore !== null && exMatch.homeScore !== undefined && exMatch.awayScore !== null && exMatch.awayScore !== undefined;

      if (!inHasScore && exHasScore) {
        // Keep existing valid score instead of overwriting with null
        return {
          ...inMatch,
          homeScore: exMatch.homeScore,
          awayScore: exMatch.awayScore
        };
      }
      return inMatch;
    });
  } else {
    merged.groupMatches = incomingMatches.length > 0 ? incomingMatches : existingMatches;
  }

  // Ensure teams is an array
  if (incoming.teams && typeof incoming.teams === 'object' && !Array.isArray(incoming.teams)) {
    merged.teams = Object.values(incoming.teams);
  }

  return merged;
}

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'error' | 'disconnected'
    this.statusListeners = new Set();
    this.isApplyingRemote = false;
    this.lastSnapshotTime = 0;

    this.init();
  }

  getConfig() {
    try {
      const custom = localStorage.getItem(STORAGE_KEY_CUSTOM_FB);
      if (custom) return JSON.parse(custom);
    } catch (e) {
      console.warn('Failed to parse custom Firebase config, using default', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(newConfig) {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_FB, JSON.stringify(newConfig));
      this.init();
      return true;
    } catch (e) {
      console.error('Failed to save Firebase config', e);
      return false;
    }
  }

  resetToDefaultConfig() {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_FB);
    this.init();
  }

  init() {
    try {
      this.setStatus('connecting');
      const config = this.getConfig();

      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }

      this.db = getDatabase(this.app);
      this.setStatus('connected');
      console.log('⚡ Firebase Realtime Database connected to', config.projectId);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.setStatus('error');
    }
  }

  setStatus(status) {
    this.status = status;
    this.statusListeners.forEach(cb => {
      try { cb(status); } catch (e) {}
    });
  }

  onStatusChange(cb) {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  // Count finished matches for summary
  getFinishedMatchesCount(tournament) {
    if (!tournament) return 0;
    const groupMatches = Array.isArray(tournament.groupMatches)
      ? tournament.groupMatches
      : Object.values(tournament.groupMatches || {});
    const groupCount = groupMatches.filter(
      m => m && m.homeScore !== null && m.homeScore !== undefined
    ).length;
    const koMatches = Array.isArray(tournament.knockoutMatches)
      ? tournament.knockoutMatches
      : Object.values(tournament.knockoutMatches || {});
    const koCount = koMatches.filter(
      m => m && m.winner
    ).length;
    return groupCount + koCount;
  }

  // Automated Cloud Snapshot creation (runs on score changes & significant events)
  async createCloudSnapshot(tournament, label = 'Auto-Snapshot') {
    if (!this.db || !tournament || !tournament.id) return;

    try {
      const now = Date.now();
      // Throttle automatic snapshots to max once every 10 seconds unless explicit
      if (label === 'Auto-Snapshot' && now - this.lastSnapshotTime < 10000) {
        return;
      }
      this.lastSnapshotTime = now;

      const finishedCount = this.getFinishedMatchesCount(tournament);
      const snapshotKey = `snap_${now}`;
      const snapshotRef = ref(this.db, `snapshots/${tournament.id}/${snapshotKey}`);

      const snapshotData = {
        key: snapshotKey,
        timestamp: new Date().toISOString(),
        label,
        tournamentName: tournament.name || 'Turnamen',
        tournamentId: tournament.id,
        finishedCount,
        totalMatches: tournament.groupMatches?.length || 0,
        tournamentState: tournament
      };

      await set(snapshotRef, snapshotData);

      // Clean up oldest snapshots if more than MAX_CLOUD_SNAPSHOTS
      const allSnapshotsRef = ref(this.db, `snapshots/${tournament.id}`);
      const snap = await get(allSnapshotsRef);
      if (snap.exists()) {
        const all = snap.val();
        const keys = Object.keys(all).sort();
        if (keys.length > MAX_CLOUD_SNAPSHOTS) {
          const toDelete = keys.slice(0, keys.length - MAX_CLOUD_SNAPSHOTS);
          for (const k of toDelete) {
            await remove(ref(this.db, `snapshots/${tournament.id}/${k}`));
          }
        }
      }
    } catch (err) {
      console.warn('Could not create cloud snapshot:', err);
    }
  }

  // Fetch all cloud snapshots for a tournament
  async getCloudSnapshots(tournamentId) {
    if (!this.db || !tournamentId) return [];

    try {
      const snapRef = ref(this.db, `snapshots/${tournamentId}`);
      const snapshot = await get(snapRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return [];
    } catch (err) {
      console.error('Error fetching cloud snapshots:', err);
      return [];
    }
  }

  // Save single active tournament to Firebase Cloud + Auto Snapshot
  async saveTournamentToCloud(tournament, options = {}) {
    if (!this.db || !tournament || this.isApplyingRemote) return;

    try {
      const tournamentRef = ref(this.db, `tournaments/${tournament.id}`);
      const activeIdRef = ref(this.db, 'activeTournamentId');

      const payload = {
        ...tournament,
        lastCloudSync: new Date().toISOString()
      };

      await set(tournamentRef, payload);
      await set(activeIdRef, tournament.id);

      // Create snapshot automatically
      this.createCloudSnapshot(payload, options.snapshotLabel || 'Auto-Snapshot');
    } catch (error) {
      console.error('Error uploading tournament to Firebase:', error);
      this.setStatus('error');
    }
  }

  // Save full state (all save slots) to Firebase Cloud
  async syncAllToCloud(tournamentList, activeTournamentId) {
    if (!this.db || this.isApplyingRemote) return;

    try {
      const payload = {};
      (tournamentList || []).forEach(t => {
        payload[t.id] = t;
      });

      const rootRef = ref(this.db, 'tournaments');
      const activeIdRef = ref(this.db, 'activeTournamentId');

      await set(rootRef, payload);
      if (activeTournamentId) {
        await set(activeIdRef, activeTournamentId);
      }
    } catch (error) {
      console.error('Error syncing all tournaments to Firebase:', error);
    }
  }

  // Listen to remote changes for both all tournaments & active tournament
  subscribeToCloudUpdates(onRemoteUpdate) {
    if (!this.db) return () => {};

    try {
      const tournamentsRef = ref(this.db, 'tournaments');
      const activeRef = ref(this.db, 'activeTournamentId');
      
      let latestTournaments = null;
      let latestActiveId = null;

      const trigger = () => {
        if (!latestTournaments) return;
        this.isApplyingRemote = true;
        try {
          onRemoteUpdate(latestTournaments, latestActiveId);
        } finally {
          setTimeout(() => {
            this.isApplyingRemote = false;
          }, 100);
        }
      };

      const unsubActive = onValue(activeRef, (snapshot) => {
        latestActiveId = snapshot.val();
        trigger();
      });

      const unsubTournaments = onValue(tournamentsRef, (snapshot) => {
        if (snapshot.exists()) {
          latestTournaments = snapshot.val();
          trigger();
        }
      }, (err) => {
        console.error('Firebase onValue error:', err);
        this.setStatus('error');
      });

      return () => {
        off(activeRef);
        off(tournamentsRef);
      };
    } catch (err) {
      console.error('Error setting up Firebase cloud listener:', err);
      return () => {};
    }
  }
}

export const firebaseService = new FirebaseService();
