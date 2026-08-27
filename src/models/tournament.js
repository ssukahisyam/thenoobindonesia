// Data Models and Default Structures for eFootball Tournament Manager

export const TOURNAMENT_MODES = {
  LEAGUE: 'league',        // Full League / Liga Penuh
  CUP: 'cup',              // Group Stage + Playoff
  KNOCKOUT: 'knockout'     // Pure Knockout Bracket
};

export const PLAYOFF_TYPES = {
  NONE: 'none',
  SINGLE_ELIM: 'single_elim',
  DOUBLE_ELIM: 'double_elim' // Upper & Lower Bracket
};

export const DEFAULT_CONFIG = {
  mode: TOURNAMENT_MODES.LEAGUE,
  groupCount: 2,
  groupLegs: 2,
  advancePerGroup: 2,
  knockoutLegs: 1,
  hasThirdPlace: true,
  
  // League Playoff Settings
  hasPlayoffs: true,
  playoffType: PLAYOFF_TYPES.DOUBLE_ELIM,
  playoffUpperCount: 2,    // e.g. Rank 1-2 go to Upper Bracket
  playoffLowerCount: 2,    // e.g. Rank 3-4 go to Lower Bracket
                           // Rank 5+ are eliminated
  
  // Scoring & Tiebreakers
  winPts: 3,
  drawPts: 1,
  lossPts: 0,
  tieBreaker: 'pts_gd_gf_h2h'
};

export const DEFAULT_TEAMS_PRESET = [
  { id: 't1', name: 'FC Barcelona', player: 'Rian' },
  { id: 't2', name: 'Arsenal FC', player: 'Budi' },
  { id: 't3', name: 'Real Madrid', player: 'Deni' },
  { id: 't4', name: 'Bayern München', player: 'Eko' },
  { id: 't5', name: 'AC Milan', player: 'Bayu' },
  { id: 't6', name: 'Inter Milan', player: 'Andi' }
];

export const INITIAL_DEMO_TOURNAMENT = {
  id: 'tourney_demo_league_double_elim',
  name: 'eFootball Champions League 2026',
  mode: TOURNAMENT_MODES.LEAGUE,
  status: 'active', // active, completed, draft
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  config: {
    ...DEFAULT_CONFIG,
    mode: TOURNAMENT_MODES.LEAGUE,
    groupLegs: 2,
    hasPlayoffs: true,
    playoffType: PLAYOFF_TYPES.DOUBLE_ELIM,
    playoffUpperCount: 2,
    playoffLowerCount: 2
  },
  teams: [...DEFAULT_TEAMS_PRESET],
  groups: {
    'Liga': ['FC Barcelona', 'Arsenal FC', 'Real Madrid', 'Bayern München', 'AC Milan', 'Inter Milan']
  },
  groupMatches: [],
  knockoutMatches: [],
  doubleElimination: {
    upperMatches: [],
    lowerMatches: [],
    grandFinal: null,
    champion: null
  },
  topScorers: [],
  wheelRemainingTeams: ['FC Barcelona', 'Arsenal FC', 'Real Madrid', 'Bayern München', 'AC Milan', 'Inter Milan']
};
