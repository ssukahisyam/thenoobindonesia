// Standings Calculation & Qualification Engine

export const QUALIFICATION_STATUS = {
  UPPER_BRACKET: 'upper_bracket',
  LOWER_BRACKET: 'lower_bracket',
  PLAYIN_ROUND: 'playin_round',
  QUALIFIED: 'qualified',
  CHAMPION: 'champion',
  NONE: 'none',
  ELIMINATED: 'eliminated'
};

export function calculateStandingsForGroup(groupName, teamNames, matches, config) {
  const winPts = config?.winPts ?? 3;
  const drawPts = config?.drawPts ?? 1;
  const lossPts = config?.lossPts ?? 0;

  // Initialize stats dictionary
  const stats = {};
  teamNames.forEach(team => {
    stats[team] = {
      name: team,
      group: groupName,
      p: 0, // played
      w: 0, // won
      d: 0, // drawn
      l: 0, // lost
      gf: 0, // goals for
      ga: 0, // goals against
      gd: 0, // goal difference
      pts: 0 // points
    };
  });

  const groupMatches = matches.filter(m => m.group === groupName);

  // Accumulate match results
  groupMatches.forEach(m => {
    if (
      m.homeScore !== null &&
      m.awayScore !== null &&
      !isNaN(m.homeScore) &&
      !isNaN(m.awayScore) &&
      stats[m.home] &&
      stats[m.away]
    ) {
      const hs = parseInt(m.homeScore, 10);
      const as = parseInt(m.awayScore, 10);

      stats[m.home].p += 1;
      stats[m.away].p += 1;
      stats[m.home].gf += hs;
      stats[m.home].ga += as;
      stats[m.away].gf += as;
      stats[m.away].ga += hs;
      stats[m.home].gd = stats[m.home].gf - stats[m.home].ga;
      stats[m.away].gd = stats[m.away].gf - stats[m.away].ga;

      if (hs > as) {
        stats[m.home].w += 1;
        stats[m.home].pts += winPts;
        stats[m.away].l += 1;
        stats[m.away].pts += lossPts;
      } else if (as > hs) {
        stats[m.away].w += 1;
        stats[m.away].pts += winPts;
        stats[m.home].l += 1;
        stats[m.home].pts += lossPts;
      } else {
        stats[m.home].d += 1;
        stats[m.home].pts += drawPts;
        stats[m.away].d += 1;
        stats[m.away].pts += drawPts;
      }
    }
  });

  let sortedList = Object.values(stats);

  // Sorting with Head-to-Head tie-breaker support
  sortedList.sort((a, b) => {
    // 1. Points
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 2. Goal Difference
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Goals For
    if (b.gf !== a.gf) return b.gf - a.gf;

    // 4. Head-to-Head between tied teams
    const h2hMatches = groupMatches.filter(
      m =>
        ((m.home === a.name && m.away === b.name) ||
         (m.home === b.name && m.away === a.name)) &&
        m.homeScore !== null &&
        m.awayScore !== null
    );

    if (h2hMatches.length > 0) {
      let aH2HPts = 0;
      let bH2HPts = 0;
      let aH2HGD = 0;
      let bH2HGD = 0;

      h2hMatches.forEach(m => {
        const hs = parseInt(m.homeScore, 10);
        const as = parseInt(m.awayScore, 10);
        const isAHome = m.home === a.name;
        const aScore = isAHome ? hs : as;
        const bScore = isAHome ? as : hs;

        aH2HGD += aScore - bScore;
        bH2HGD += bScore - aScore;

        if (aScore > bScore) aH2HPts += winPts;
        else if (bScore > aScore) bH2HPts += winPts;
        else {
          aH2HPts += drawPts;
          bH2HPts += drawPts;
        }
      });

      if (bH2HPts !== aH2HPts) return bH2HPts - aH2HPts;
      if (bH2HGD !== aH2HGD) return bH2HGD - aH2HGD;
    }

    // 5. Alphabetical fallback
    return a.name.localeCompare(b.name);
  });

  // Assign Qualification Status based on configuration
  const totalTeams = sortedList.length;
  const isLeagueWithPlayoffs = config?.mode === 'league' && config?.hasPlayoffs;
  const isDoubleElim = config?.playoffType === 'double_elim';
  const upperCount = config?.playoffUpperCount ?? 2;
  const lowerCount = config?.playoffLowerCount ?? (totalTeams >= 6 ? 4 : 2);
  const advCount = config?.advancePerGroup ?? 2;

  return sortedList.map((item, idx) => {
    const rank = idx + 1;
    let status = QUALIFICATION_STATUS.NONE;
    let statusLabel = '';

    if (config?.mode === 'league') {
      if (isLeagueWithPlayoffs) {
        if (isDoubleElim) {
          if (rank <= 2) {
            status = QUALIFICATION_STATUS.UPPER_BRACKET;
            statusLabel = `Upper Bracket (Seed ${rank} - Menunggu)`;
          } else if (rank <= 2 + lowerCount) {
            status = QUALIFICATION_STATUS.PLAYIN_ROUND;
            statusLabel = `Play-in Playoff (Seed ${rank})`;
          } else {
            status = QUALIFICATION_STATUS.ELIMINATED;
            statusLabel = 'Tereliminasi';
          }
        } else {
          // Single Elim Playoff
          const totalPlayoff = upperCount + lowerCount;
          if (rank <= totalPlayoff) {
            status = QUALIFICATION_STATUS.QUALIFIED;
            statusLabel = `Playoff (Seed ${rank})`;
          } else {
            status = QUALIFICATION_STATUS.ELIMINATED;
            statusLabel = 'Tereliminasi';
          }
        }
      } else {
        // Pure League
        if (rank === 1) {
          status = QUALIFICATION_STATUS.CHAMPION;
          statusLabel = 'Pimpinan Klasemen';
        }
      }
    } else if (config?.mode === 'cup') {
      if (rank <= advCount) {
        status = QUALIFICATION_STATUS.QUALIFIED;
        statusLabel = `Lolos Playoff (#${rank})`;
      } else {
        status = QUALIFICATION_STATUS.ELIMINATED;
        statusLabel = 'Gugur';
      }
    }

    return {
      ...item,
      rank,
      status,
      statusLabel
    };
  });
}
