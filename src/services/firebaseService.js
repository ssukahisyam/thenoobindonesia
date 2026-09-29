// Firebase Realtime Database Service for Multi-Device Cloud Sync
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';

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

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'error' | 'disconnected'
    this.statusListeners = new Set();
    this.isApplyingRemote = false;

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

  // Save single active tournament to Firebase Cloud
  async saveTournamentToCloud(tournament) {
    if (!this.db || !tournament || this.isApplyingRemote) return;

    try {
      const tournamentRef = ref(this.db, `tournaments/${tournament.id}`);
      const activeIdRef = ref(this.db, 'activeTournamentId');

      await set(tournamentRef, {
        ...tournament,
        lastCloudSync: new Date().toISOString()
      });

      await set(activeIdRef, tournament.id);
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
      
      let currentActiveId = null;

      const unsubActive = onValue(activeRef, (snapshot) => {
        currentActiveId = snapshot.val();
      });

      const unsubTournaments = onValue(tournamentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allTournamentsObj = snapshot.val();
          this.isApplyingRemote = true;
          try {
            onRemoteUpdate(allTournamentsObj, currentActiveId);
          } finally {
            setTimeout(() => {
              this.isApplyingRemote = false;
            }, 100);
          }
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
