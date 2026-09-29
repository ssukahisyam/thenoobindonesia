import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storage } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import {
  generateRoundRobinMatches,
  generateSingleEliminationBracket,
  generateDoubleEliminationStructure,
  evaluateSingleEliminationMatchWinners,
  evaluateDoubleEliminationProgression
} from '../services/schedulerService';
import { calculateStandingsForGroup } from '../services/standingsService';
import { sound } from '../services/soundService';
import { TOURNAMENT_MODES, PLAYOFF_TYPES, DEFAULT_CONFIG } from '../models/tournament';

const TournamentContext = createContext(null);

// Helper function to synchronously build all schedules and brackets for a tournament object
export function buildTournamentStructure(tournament) {
  const t = { ...tournament };
  const mode = t.mode || TOURNAMENT_MODES.LEAGUE;
  const config = t.config || DEFAULT_CONFIG;
  const teams = t.teams || [];
  const teamNames = teams.map(x => (typeof x === 'string' ? x : x.name));

  if (mode === TOURNAMENT_MODES.LEAGUE) {
    t.groups = {
      'Liga': teamNames
    };
    t.groupMatches = generateRoundRobinMatches('Liga', teamNames, config.groupLegs || 1);

    if (config.hasPlayoffs) {
      if (config.playoffType === PLAYOFF_TYPES.DOUBLE_ELIM) {
        const upperCount = config.playoffUpperCount || 2;
        const lowerCount = config.playoffLowerCount || (teamNames.length >= 6 ? 4 : 2);
        const upperSlots = Array.from({ length: upperCount }, (_, i) => `Seed ${i + 1} (Menunggu Upper)`);
        const lowerSlots = Array.from({ length: lowerCount }, (_, i) => `Seed ${i + 3} (Play-in)`);
        t.doubleElimination = generateDoubleEliminationStructure(upperSlots, lowerSlots, config);
      } else {
        const total = (config.playoffUpperCount || 2) + (config.playoffLowerCount || 2);
        const slots = Array.from({ length: total }, (_, i) => `Seed ${i + 1}`);
        t.knockoutMatches = generateSingleEliminationBracket(slots, config);
      }
    } else {
      t.doubleElimination = null;
      t.knockoutMatches = [];
    }
  } else if (mode === TOURNAMENT_MODES.CUP) {
    const gCount = config.groupCount || 2;
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, gCount);
    t.groups = {};
    groupLetters.forEach(g => (t.groups[g] = []));

    // Distribute teams to groups
    teamNames.forEach((name, idx) => {
      const gKey = groupLetters[idx % gCount];
      t.groups[gKey].push(name);
    });

    t.groupMatches = [];
    groupLetters.forEach(gKey => {
      const matches = generateRoundRobinMatches(gKey, t.groups[gKey], config.groupLegs || 1);
      t.groupMatches.push(...matches);
    });

    const totalQual = gCount * (config.advancePerGroup || 2);
    const qualSlots = Array.from({ length: totalQual }, (_, i) => `Lolos #${i + 1}`);
    t.knockoutMatches = generateSingleEliminationBracket(qualSlots, config);
  } else if (mode === TOURNAMENT_MODES.KNOCKOUT) {
    t.groups = {};
    t.groupMatches = [];
    t.knockoutMatches = generateSingleEliminationBracket(teamNames, config);
  }

  t.wheelRemainingTeams = [...teamNames];
  return t;
}

export function TournamentProvider({ children }) {
  const [tournamentList, setTournamentList] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [toast, setToast] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('connecting');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Reload list of tournaments
  const refreshList = useCallback(() => {
    const list = storage.getTournamentsList();
    setTournamentList(list);
    return list;
  }, []);

  // Load active tournament from storage
  const loadActiveTournament = useCallback((id) => {
    const targetId = id || storage.getActiveTournamentId();
    if (!targetId) return;

    let data = storage.getTournamentById(targetId);
    if (data) {
      if (
        data.teams &&
        data.teams.length >= 2 &&
        data.mode !== TOURNAMENT_MODES.KNOCKOUT &&
        (!data.groupMatches || data.groupMatches.length === 0)
      ) {
        data = buildTournamentStructure(data);
        storage.saveTournament(data);
      }

      setActiveTournament(data);
      storage.setActiveTournamentId(data.id);
    }
    refreshList();
  }, [refreshList]);

  // Initial load & Firebase Cloud subscription
  useEffect(() => {
    refreshList();
    loadActiveTournament();

    const unsubStatus = firebaseService.onStatusChange((st) => {
      setCloudStatus(st);
    });

    // Real-time synchronization of all slots and active tournament
    const unsubUpdates = firebaseService.subscribeToCloudUpdates((allTournamentsObj, activeId) => {
      if (allTournamentsObj && typeof allTournamentsObj === 'object') {
        let activeToSet = null;
        const targetActiveId = activeId || storage.getActiveTournamentId();

        for (const [tId, tData] of Object.entries(allTournamentsObj)) {
          if (tData && tData.name) {
            const formatted = {
              ...tData,
              id: tData.id || tId
            };
            storage.saveTournament(formatted);

            if (formatted.id === targetActiveId) {
              activeToSet = formatted;
            }
          }
        }

        if (activeToSet) {
          setActiveTournament(activeToSet);
          storage.setActiveTournamentId(activeToSet.id);
        } else if (targetActiveId) {
          const fallback = storage.getTournamentById(targetActiveId);
          if (fallback) setActiveTournament(fallback);
        }

        refreshList();
      }
    });

    return () => {
      unsubStatus();
      unsubUpdates();
    };
  }, [loadActiveTournament, refreshList]);

  // Save changes to active tournament (LocalStorage + Firebase Realtime DB)
  const saveActiveTournament = useCallback((updatedTournament) => {
    if (!updatedTournament) return;
    setActiveTournament(updatedTournament);
    storage.saveTournament(updatedTournament);
    refreshList();

    // Async push to Firebase Cloud
    firebaseService.saveTournamentToCloud(updatedTournament);
  }, [refreshList]);

  // Switch active tournament
  const switchTournament = useCallback((id) => {
    sound.playClick();
    loadActiveTournament(id);
    const target = storage.getTournamentById(id);
    if (target) {
      firebaseService.saveTournamentToCloud(target);
    }
    showToast('Turnamen berhasil dimuat!');
  }, [loadActiveTournament, showToast]);

  // Create new tournament
  const createNewTournament = useCallback((newTournamentData) => {
    sound.playClick();
    const id = `tourney_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    let fullTournament = {
      id,
      name: newTournamentData.name || 'Turnamen Baru',
      mode: newTournamentData.mode || TOURNAMENT_MODES.LEAGUE,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: { ...newTournamentData.config },
      teams: newTournamentData.teams || [],
      groups: {},
      groupMatches: [],
      knockoutMatches: [],
      doubleElimination: {
        playInMatches: [],
        upperMatches: [],
        lowerMatches: [],
        grandFinal: null,
        champion: null
      },
      topScorers: [],
      wheelRemainingTeams: (newTournamentData.teams || []).map(t => (typeof t === 'string' ? t : t.name))
    };

    // Automatically build all schedules and brackets
    fullTournament = buildTournamentStructure(fullTournament);

    storage.saveTournament(fullTournament);
    storage.setActiveTournamentId(fullTournament.id);
    setActiveTournament(fullTournament);
    refreshList();

    // Sync to Firebase Cloud
    firebaseService.saveTournamentToCloud(fullTournament);

    showToast(`Turnamen '${fullTournament.name}' (${fullTournament.teams.length} Peserta) berhasil dibuat!`);
    return fullTournament;
  }, [refreshList, showToast]);

  // Duplicate tournament
  const duplicateTournament = useCallback((id) => {
    sound.playClick();
    const cloned = storage.duplicateTournament(id);
    if (cloned) {
      refreshList();
      firebaseService.saveTournamentToCloud(cloned);
      showToast(`Salinan turnamen '${cloned.name}' berhasil dibuat!`);
    }
  }, [refreshList, showToast]);

  // Delete tournament
  const deleteTournament = useCallback((id) => {
    sound.playClick();
    storage.deleteTournament(id);
    refreshList();
    loadActiveTournament();
    showToast('Turnamen telah dihapus.');
  }, [loadActiveTournament, refreshList, showToast]);

  // Compute Live Standings
  const standingsMap = useMemo(() => {
    if (!activeTournament || !activeTournament.groups) return {};

    const result = {};
    for (let gKey in activeTournament.groups) {
      const teamList = activeTournament.groups[gKey] || [];
      result[gKey] = calculateStandingsForGroup(
        gKey,
        teamList,
        activeTournament.groupMatches || [],
        activeTournament.config
      );
    }
    return result;
  }, [activeTournament]);

  // Update MPL Playoff seedings when standings change
  const syncStandingsToPlayoffs = useCallback((tData, computedStandings) => {
    if (!tData) return tData;

    const isLeague = tData.mode === TOURNAMENT_MODES.LEAGUE;
    const isCup = tData.mode === TOURNAMENT_MODES.CUP;

    if (isLeague && tData.config?.hasPlayoffs) {
      const leagueStandings = computedStandings['Liga'] || [];
      const isDoubleElim = tData.config?.playoffType === PLAYOFF_TYPES.DOUBLE_ELIM;

      if (isDoubleElim) {
        const uCount = tData.config?.playoffUpperCount || 2;
        const lCount = tData.config?.playoffLowerCount || (leagueStandings.length >= 6 ? 4 : 2);

        const upperTeams = leagueStandings.slice(0, uCount).map(s => s.name);
        const lowerTeams = leagueStandings.slice(uCount, uCount + lCount).map(s => s.name);

        tData.doubleElimination = generateDoubleEliminationStructure(upperTeams, lowerTeams, tData.config);
        tData.doubleElimination = evaluateDoubleEliminationProgression(tData.doubleElimination, tData.config);
      } else {
        const totalPlayoff = (tData.config?.playoffUpperCount || 2) + (tData.config?.playoffLowerCount || 2);
        const topTeams = leagueStandings.slice(0, totalPlayoff).map(s => s.name);
        if (tData.knockoutMatches?.length > 0 && topTeams.length > 0) {
          const sf1 = tData.knockoutMatches.find(m => m.id === 'SF1');
          const sf2 = tData.knockoutMatches.find(m => m.id === 'SF2');
          if (sf1) {
            if (topTeams[0]) sf1.homeTeam = topTeams[0];
            if (topTeams[3]) sf1.awayTeam = topTeams[3];
          }
          if (sf2) {
            if (topTeams[1]) sf2.homeTeam = topTeams[1];
            if (topTeams[2]) sf2.awayTeam = topTeams[2];
          }
          tData.knockoutMatches = evaluateSingleEliminationMatchWinners(tData.knockoutMatches, tData.config);
        }
      }
    } else if (isCup) {
      const gA = computedStandings['A'] || [];
      const gB = computedStandings['B'] || [];
      const sf1 = tData.knockoutMatches?.find(m => m.id === 'SF1');
      const sf2 = tData.knockoutMatches?.find(m => m.id === 'SF2');

      if (sf1 && sf2) {
        if (gA[0]) sf1.homeTeam = gA[0].name;
        if (gB[1]) sf1.awayTeam = gB[1].name;
        if (gB[0]) sf2.homeTeam = gB[0].name;
        if (gA[1]) sf2.awayTeam = gA[1].name;
      }
      if (tData.knockoutMatches) {
        tData.knockoutMatches = evaluateSingleEliminationMatchWinners(tData.knockoutMatches, tData.config);
      }
    }

    return tData;
  }, []);

  // Update Group/League match score
  const updateGroupScore = useCallback((matchId, field, val) => {
    if (!activeTournament) return;
    const parsed = val === '' ? null : parseInt(val, 10);

    const matches = [...(activeTournament.groupMatches || [])];
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (field === 'home') match.homeScore = parsed;
    else if (field === 'away') match.awayScore = parsed;

    if (match.homeScore !== null && match.awayScore !== null) {
      sound.playGoal();
    }

    let updated = {
      ...activeTournament,
      groupMatches: matches
    };

    // Calculate standings and re-sync playoffs
    const newStandings = {};
    for (let gKey in updated.groups) {
      newStandings[gKey] = calculateStandingsForGroup(
        gKey,
        updated.groups[gKey] || [],
        matches,
        updated.config
      );
    }

    updated = syncStandingsToPlayoffs(updated, newStandings);
    saveActiveTournament(updated);
  }, [activeTournament, saveActiveTournament, syncStandingsToPlayoffs]);

  // Update Knockout (Single Elim) match score
  const updateKnockoutScore = useCallback((matchId, field, val) => {
    if (!activeTournament) return;
    const parsed = val === '' ? null : parseInt(val, 10);

    const matches = [...(activeTournament.knockoutMatches || [])];
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (field === 'h1') match.homeLeg1 = parsed;
    else if (field === 'a1') match.awayLeg1 = parsed;
    else if (field === 'h2') match.homeLeg2 = parsed;
    else if (field === 'a2') match.awayLeg2 = parsed;
    else if (field === 'hp') match.homePen = parsed;
    else if (field === 'ap') match.awayPen = parsed;

    sound.playGoal();
    const evaluated = evaluateSingleEliminationMatchWinners(matches, activeTournament.config);

    const updated = {
      ...activeTournament,
      knockoutMatches: evaluated
    };

    saveActiveTournament(updated);
  }, [activeTournament, saveActiveTournament]);

  // Update Double Elimination match score (supports playin, upper, lower, grand_final)
  const updateDoubleElimScore = useCallback((matchId, field, val, bracketType) => {
    if (!activeTournament || !activeTournament.doubleElimination) return;
    const parsed = val === '' ? null : parseInt(val, 10);

    const dElim = { ...activeTournament.doubleElimination };
    let match = null;

    if (bracketType === 'playin') {
      match = (dElim.playInMatches || []).find(m => m.id === matchId);
    } else if (bracketType === 'upper') {
      match = (dElim.upperMatches || []).find(m => m.id === matchId);
    } else if (bracketType === 'lower') {
      match = (dElim.lowerMatches || []).find(m => m.id === matchId);
    } else if (bracketType === 'grand_final') {
      match = dElim.grandFinal;
    }

    if (!match) return;

    if (field === 'h1') match.homeLeg1 = parsed;
    else if (field === 'a1') match.awayLeg1 = parsed;
    else if (field === 'h2') match.homeLeg2 = parsed;
    else if (field === 'a2') match.awayLeg2 = parsed;
    else if (field === 'hp') match.homePen = parsed;
    else if (field === 'ap') match.awayPen = parsed;

    sound.playGoal();
    const evaluated = evaluateDoubleEliminationProgression(dElim, activeTournament.config);

    const updated = {
      ...activeTournament,
      doubleElimination: evaluated
    };

    saveActiveTournament(updated);
  }, [activeTournament, saveActiveTournament]);

  // Regenerate all schedules & brackets
  const regenerateTournamentSchedule = useCallback(() => {
    if (!activeTournament) return;
    sound.playClick();

    const t = buildTournamentStructure(activeTournament);
    saveActiveTournament(t);
    showToast('Jadwal & format turnamen berhasil digenerate ulang!');
  }, [activeTournament, saveActiveTournament, showToast]);

  // Reset scores only
  const resetScores = useCallback(() => {
    if (!activeTournament) return;
    sound.playClick();

    const t = { ...activeTournament };
    if (t.groupMatches) {
      t.groupMatches.forEach(m => {
        m.homeScore = null;
        m.awayScore = null;
      });
    }

    if (t.knockoutMatches) {
      t.knockoutMatches.forEach(m => {
        m.homeLeg1 = null;
        m.awayLeg1 = null;
        m.homeLeg2 = null;
        m.awayLeg2 = null;
        m.homePen = null;
        m.awayPen = null;
        m.winner = null;
        m.loser = null;
      });
    }

    if (t.doubleElimination) {
      const uCount = t.config.playoffUpperCount || 2;
      const lCount = t.config.playoffLowerCount || (t.teams.length >= 6 ? 4 : 2);
      t.doubleElimination = generateDoubleEliminationStructure(
        Array.from({ length: uCount }, (_, i) => `Seed ${i + 1} (Upper)`),
        Array.from({ length: lCount }, (_, i) => `Seed ${i + 3} (Play-in)`),
        t.config
      );
    }

    saveActiveTournament(t);
    showToast('Semua skor berhasil direset.');
  }, [activeTournament, saveActiveTournament, showToast]);

  // Add single team
  const addTeam = useCallback((teamName, player = '') => {
    if (!activeTournament) return;
    const trimmed = teamName.trim();
    if (!trimmed) return;

    if (activeTournament.teams.some(t => (t.name || t).toLowerCase() === trimmed.toLowerCase())) {
      showToast('Nama tim/player sudah ada!', 'warning');
      return;
    }

    const newTeam = {
      id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      player: player.trim()
    };

    let updated = {
      ...activeTournament,
      teams: [...activeTournament.teams, newTeam]
    };

    updated = buildTournamentStructure(updated);
    saveActiveTournament(updated);
    showToast(`'${trimmed}' berhasil ditambahkan dan jadwal diperbarui!`);
  }, [activeTournament, saveActiveTournament, showToast]);

  // Bulk add multiple teams
  const bulkAddTeams = useCallback((namesArray) => {
    if (!activeTournament || !namesArray || namesArray.length === 0) return;

    const existingNames = new Set(activeTournament.teams.map(t => (t.name || t).toLowerCase()));
    const newTeams = [];

    namesArray.forEach((rawName, i) => {
      const trimmed = rawName.trim();
      if (trimmed && !existingNames.has(trimmed.toLowerCase())) {
        existingNames.add(trimmed.toLowerCase());
        newTeams.push({
          id: `t_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 4)}`,
          name: trimmed,
          player: `Player ${activeTournament.teams.length + newTeams.length + 1}`
        });
      }
    });

    if (newTeams.length === 0) {
      showToast('Semua nama yang dimasukkan sudah terdaftar.', 'warning');
      return;
    }

    let updated = {
      ...activeTournament,
      teams: [...activeTournament.teams, ...newTeams]
    };

    updated = buildTournamentStructure(updated);
    saveActiveTournament(updated);
    showToast(`Berhasil menambahkan ${newTeams.length} peserta dan menyusun jadwal!`);
  }, [activeTournament, saveActiveTournament, showToast]);

  // Remove team
  const removeTeam = useCallback((teamId) => {
    if (!activeTournament) return;
    const teamToRemove = activeTournament.teams.find(t => t.id === teamId);
    if (!teamToRemove) return;

    const updatedTeams = activeTournament.teams.filter(t => t.id !== teamId);

    let updated = {
      ...activeTournament,
      teams: updatedTeams
    };

    updated = buildTournamentStructure(updated);
    saveActiveTournament(updated);
    showToast(`'${teamToRemove.name || teamToRemove}' telah dihapus.`);
  }, [activeTournament, saveActiveTournament, showToast]);

  // Update Config
  const updateConfig = useCallback((newConfig) => {
    if (!activeTournament) return;
    let updated = {
      ...activeTournament,
      config: {
        ...activeTournament.config,
        ...newConfig
      }
    };

    updated = buildTournamentStructure(updated);
    saveActiveTournament(updated);
  }, [activeTournament, saveActiveTournament]);

  // Set Team Group Assignment
  const setTeamGroup = useCallback((teamName, newGroup) => {
    if (!activeTournament) return;
    const updatedGroups = { ...activeTournament.groups };

    // Remove from existing
    for (let g in updatedGroups) {
      updatedGroups[g] = updatedGroups[g].filter(t => t !== teamName);
    }

    if (newGroup !== 'NONE' && updatedGroups[newGroup]) {
      updatedGroups[newGroup].push(teamName);
    }

    let newMatches = [];
    for (let g in updatedGroups) {
      const gMatches = generateRoundRobinMatches(g, updatedGroups[g], activeTournament.config.groupLegs || 1);
      newMatches.push(...gMatches);
    }

    const updated = {
      ...activeTournament,
      groups: updatedGroups,
      groupMatches: newMatches
    };

    saveActiveTournament(updated);
  }, [activeTournament, saveActiveTournament]);

  const value = {
    tournamentList,
    activeTournament,
    standingsMap,
    toast,
    cloudStatus,
    showToast,
    switchTournament,
    createNewTournament,
    duplicateTournament,
    deleteTournament,
    updateGroupScore,
    updateKnockoutScore,
    updateDoubleElimScore,
    regenerateTournamentSchedule,
    resetScores,
    addTeam,
    bulkAddTeams,
    removeTeam,
    updateConfig,
    setTeamGroup,
    saveActiveTournament
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within a TournamentProvider');
  return ctx;
}
