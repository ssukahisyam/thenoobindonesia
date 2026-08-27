// Scheduler and Bracket Progression Generator

export function generateRoundRobinMatches(groupName, teamList, legCount = 1) {
  let list = [...teamList];
  if (list.length < 2) return [];

  const isOdd = list.length % 2 !== 0;
  if (isOdd) list.push('BYE_DUMMY');

  const n = list.length;
  const roundsCount = n - 1;
  const halfSize = n / 2;

  let matches = [];
  let matchIdCounter = 1;

  // Leg 1
  for (let round = 0; round < roundsCount; round++) {
    const roundNum = round + 1;

    for (let i = 0; i < halfSize; i++) {
      let home = list[i];
      let away = list[n - 1 - i];

      if (home !== 'BYE_DUMMY' && away !== 'BYE_DUMMY') {
        if (i === 0 && round % 2 === 1) {
          const tmp = home;
          home = away;
          away = tmp;
        }

        matches.push({
          id: `${groupName}_M${matchIdCounter++}`,
          group: groupName,
          round: roundNum,
          home,
          away,
          homeScore: null,
          awayScore: null,
          leg: 1
        });
      }
    }

    // Rotate list
    list.splice(1, 0, list.pop());
  }

  // Leg 2 (Reversed fixtures)
  if (legCount === 2) {
    const leg1Matches = [...matches];
    leg1Matches.forEach(m => {
      matches.push({
        id: `${groupName}_M${matchIdCounter++}`,
        group: groupName,
        round: m.round + roundsCount,
        home: m.away,
        away: m.home,
        homeScore: null,
        awayScore: null,
        leg: 2
      });
    });
  }

  return matches;
}

// -------------------------------------------------------------
// SINGLE ELIMINATION BRACKET ENGINE
// -------------------------------------------------------------

export function generateSingleEliminationBracket(participants, config = {}) {
  const count = participants.length;
  if (count < 2) return [];

  const hasThirdPlace = config.hasThirdPlace !== false;
  let matches = [];

  if (count <= 4) {
    // Semi Finals & Final
    matches.push({
      id: 'SF1',
      roundName: 'Semi Final 1',
      matchLabel: 'Semi Final 1',
      homeTeam: participants[0] || 'Tim 1',
      awayTeam: participants[3] || participants[1] || 'Tim 2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    matches.push({
      id: 'SF2',
      roundName: 'Semi Final 2',
      matchLabel: 'Semi Final 2',
      homeTeam: participants[1] || 'Tim 3',
      awayTeam: participants[2] || 'Tim 4',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    if (hasThirdPlace) {
      matches.push({
        id: '3RD',
        roundName: 'Perebutan Juara 3',
        matchLabel: 'Kalah SF1 vs Kalah SF2',
        homeTeam: 'Kalah SF1',
        awayTeam: 'Kalah SF2',
        homeLeg1: null, awayLeg1: null,
        homeLeg2: null, awayLeg2: null,
        homePen: null, awayPen: null,
        winner: null, loser: null
      });
    }

    matches.push({
      id: 'FINAL',
      roundName: 'Grand Final',
      matchLabel: 'Pemenang SF1 vs Pemenang SF2',
      homeTeam: 'Menang SF1',
      awayTeam: 'Menang SF2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });
  } else if (count <= 8) {
    // Quarter Finals, Semi Finals, Final
    for (let i = 1; i <= 4; i++) {
      matches.push({
        id: `QF${i}`,
        roundName: `Quarter Final ${i}`,
        matchLabel: `Perempat Final ${i}`,
        homeTeam: participants[(i - 1) * 2] || `Tim ${(i - 1) * 2 + 1}`,
        awayTeam: participants[(i - 1) * 2 + 1] || `Tim ${(i - 1) * 2 + 2}`,
        homeLeg1: null, awayLeg1: null,
        homeLeg2: null, awayLeg2: null,
        homePen: null, awayPen: null,
        winner: null, loser: null
      });
    }

    matches.push({
      id: 'SF1',
      roundName: 'Semi Final 1',
      matchLabel: 'Menang QF1 vs Menang QF2',
      homeTeam: 'Menang QF1',
      awayTeam: 'Menang QF2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    matches.push({
      id: 'SF2',
      roundName: 'Semi Final 2',
      matchLabel: 'Menang QF3 vs Menang QF4',
      homeTeam: 'Menang QF3',
      awayTeam: 'Menang QF4',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    if (hasThirdPlace) {
      matches.push({
        id: '3RD',
        roundName: 'Perebutan Juara 3',
        matchLabel: 'Kalah SF1 vs Kalah SF2',
        homeTeam: 'Kalah SF1',
        awayTeam: 'Kalah SF2',
        homeLeg1: null, awayLeg1: null,
        homeLeg2: null, awayLeg2: null,
        homePen: null, awayPen: null,
        winner: null, loser: null
      });
    }

    matches.push({
      id: 'FINAL',
      roundName: 'Grand Final',
      matchLabel: 'Menang SF1 vs Menang SF2',
      homeTeam: 'Menang SF1',
      awayTeam: 'Menang SF2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });
  }

  return matches;
}

export function evaluateSingleEliminationMatchWinners(matches, config = {}) {
  const is2Legs = config.knockoutLegs === 2;

  matches.forEach(m => {
    let hTotal = 0;
    let aTotal = 0;
    let isFinished = false;

    if (!is2Legs) {
      if (m.homeLeg1 !== null && m.awayLeg1 !== null) {
        hTotal = parseInt(m.homeLeg1, 10);
        aTotal = parseInt(m.awayLeg1, 10);
        isFinished = true;
      }
    } else {
      if (
        m.homeLeg1 !== null &&
        m.awayLeg1 !== null &&
        m.homeLeg2 !== null &&
        m.awayLeg2 !== null
      ) {
        hTotal = parseInt(m.homeLeg1, 10) + parseInt(m.homeLeg2, 10);
        aTotal = parseInt(m.awayLeg1, 10) + parseInt(m.awayLeg2, 10);
        isFinished = true;
      }
    }

    if (isFinished) {
      if (hTotal > aTotal) {
        m.winner = m.homeTeam;
        m.loser = m.awayTeam;
      } else if (aTotal > hTotal) {
        m.winner = m.awayTeam;
        m.loser = m.homeTeam;
      } else {
        // Tied -> check penalty
        if (m.homePen !== null && m.awayPen !== null) {
          const hp = parseInt(m.homePen, 10);
          const ap = parseInt(m.awayPen, 10);
          if (hp > ap) {
            m.winner = m.homeTeam;
            m.loser = m.awayTeam;
          } else if (ap > hp) {
            m.winner = m.awayTeam;
            m.loser = m.homeTeam;
          } else {
            m.winner = null;
            m.loser = null;
          }
        } else {
          m.winner = null;
          m.loser = null;
        }
      }
    } else {
      m.winner = null;
      m.loser = null;
    }
  });

  // Progress winners to next rounds
  const qf1 = matches.find(m => m.id === 'QF1');
  const qf2 = matches.find(m => m.id === 'QF2');
  const qf3 = matches.find(m => m.id === 'QF3');
  const qf4 = matches.find(m => m.id === 'QF4');
  const sf1 = matches.find(m => m.id === 'SF1');
  const sf2 = matches.find(m => m.id === 'SF2');
  const finalMatch = matches.find(m => m.id === 'FINAL');
  const thirdMatch = matches.find(m => m.id === '3RD');

  if (qf1 && qf2 && sf1) {
    sf1.homeTeam = qf1.winner || 'Menang QF1';
    sf1.awayTeam = qf2.winner || 'Menang QF2';
  }
  if (qf3 && qf4 && sf2) {
    sf2.homeTeam = qf3.winner || 'Menang QF3';
    sf2.awayTeam = qf4.winner || 'Menang QF4';
  }

  if (sf1 && sf2 && finalMatch) {
    finalMatch.homeTeam = sf1.winner || 'Menang SF1';
    finalMatch.awayTeam = sf2.winner || 'Menang SF2';
  }

  if (sf1 && sf2 && thirdMatch) {
    thirdMatch.homeTeam = sf1.loser || 'Kalah SF1';
    thirdMatch.awayTeam = sf2.loser || 'Kalah SF2';
  }

  return matches;
}

// -------------------------------------------------------------
// MPL MOBILE LEGENDS STYLE DOUBLE ELIMINATION (HYBRID PLAY-IN TO UPPER BRACKET)
// -------------------------------------------------------------
// Skenario 6 Tim Playoff (Standar Resmi MPL):
// - Peringkat 1 & Peringkat 2: Duduk di Upper Bracket Semis (Menunggu Pemenang Play-in).
// - Peringkat 3 vs Peringkat 6 (Match 1) & Peringkat 4 vs Peringkat 5 (Match 2) di Babak Play-in.
//   - Yang kalah di Play-in: LANGSUNG GUGUR (karena belum punya nyawa upper bracket).
//   - Yang menang di Play-in: MAJU KE UPPER BRACKET SEMIS melawan Peringkat 1 & Peringkat 2!
// - Dari Upper Semis:
//   - Yang kalah: Turun ke Lower Bracket Semis (mendapat nyawa kedua).
//   - Yang menang: Maju ke Upper Final.
// - Upper Final: Menang ke Grand Final, Kalah turun ke Lower Final.
// - Lower Semis: Kalah UB SF1 vs Kalah UB SF2 -> Menang ke Lower Final, Kalah Gugur (Juara 4).
// - Lower Final: Kalah UB Final vs Menang LB Semi -> Menang ke Grand Final, Kalah Juara 3.
// - Grand Final: Juara Upper vs Juara Lower -> Menentukan Juara 1 Turnamen!
// -------------------------------------------------------------

export function generateDoubleEliminationStructure(upperTeams = [], lowerTeams = [], config = {}) {
  const seed1 = upperTeams[0] || '1st Liga (Seed 1)';
  const seed2 = upperTeams[1] || '2nd Liga (Seed 2)';
  
  const seed3 = lowerTeams[0] || '3rd Liga (Seed 3)';
  const seed4 = lowerTeams[1] || '4th Liga (Seed 4)';
  const seed5 = lowerTeams[2] || '5th Liga (Seed 5)';
  const seed6 = lowerTeams[3] || '6th Liga (Seed 6)';

  const has6Teams = lowerTeams.length >= 3;

  const playInMatches = [];
  const upperMatches = [];
  const lowerMatches = [];

  if (has6Teams) {
    // 6-Team MPL Playoff Format
    // 1. Play-in Matches (Sudden Death)
    playInMatches.push({
      id: 'PLAYIN_M1',
      bracket: 'playin',
      roundName: 'Play-in Match 1',
      matchLabel: 'Seed 3 vs Seed 6 (Kalah Langsung Gugur, Menang Lawan Seed 1)',
      homeTeam: seed3,
      awayTeam: seed6,
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    playInMatches.push({
      id: 'PLAYIN_M2',
      bracket: 'playin',
      roundName: 'Play-in Match 2',
      matchLabel: 'Seed 4 vs Seed 5 (Kalah Langsung Gugur, Menang Lawan Seed 2)',
      homeTeam: seed4,
      awayTeam: seed5,
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // 2. Upper Bracket Semi Finals
    upperMatches.push({
      id: 'UB_SF1',
      bracket: 'upper',
      roundName: 'Upper Bracket Semis 1',
      matchLabel: 'Seed 1 (Menunggu) vs Pemenang Play-in 1',
      homeTeam: seed1,
      awayTeam: 'Pemenang Play-in 1',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    upperMatches.push({
      id: 'UB_SF2',
      bracket: 'upper',
      roundName: 'Upper Bracket Semis 2',
      matchLabel: 'Seed 2 (Menunggu) vs Pemenang Play-in 2',
      homeTeam: seed2,
      awayTeam: 'Pemenang Play-in 2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // 3. Upper Bracket Final
    upperMatches.push({
      id: 'UB_FINAL',
      bracket: 'upper',
      roundName: 'Upper Bracket Final',
      matchLabel: 'Pemenang UB SF1 vs Pemenang UB SF2 (Tiket Grand Final)',
      homeTeam: 'Pemenang UB SF1',
      awayTeam: 'Pemenang UB SF2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // 4. Lower Bracket Semi Final
    lowerMatches.push({
      id: 'LB_SEMI',
      bracket: 'lower',
      roundName: 'Lower Bracket Semi Final',
      matchLabel: 'Kalah UB SF1 vs Kalah UB SF2 (Eliminasi Juara 4)',
      homeTeam: 'Kalah UB SF1',
      awayTeam: 'Kalah UB SF2',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // 5. Lower Bracket Final
    lowerMatches.push({
      id: 'LB_FINAL',
      bracket: 'lower',
      roundName: 'Lower Bracket Final',
      matchLabel: 'Kalah Upper Final vs Pemenang Lower Semi (Tiket Grand Final)',
      homeTeam: 'Kalah Upper Final',
      awayTeam: 'Pemenang Lower Semi',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });
  } else {
    // 4-Team MPL/Page Playoff Format (Top 4 Lolos: 1, 2, 3, 4)
    // Match 1: Play-in (Seed 3 vs Seed 4) -> Kalah Gugur, Menang Masuk Upper Semis
    playInMatches.push({
      id: 'PLAYIN_M1',
      bracket: 'playin',
      roundName: 'Play-in Match (Round 1)',
      matchLabel: 'Seed 3 vs Seed 4 (Kalah Langsung Gugur, Menang Maju Lawan Seed 2)',
      homeTeam: seed3,
      awayTeam: seed4,
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // Upper Semis: Seed 2 vs Winner Play-in
    upperMatches.push({
      id: 'UB_SF1',
      bracket: 'upper',
      roundName: 'Upper Bracket Semis',
      matchLabel: 'Seed 2 (Menunggu) vs Pemenang Play-in (Kalah Turun ke Lower Final)',
      homeTeam: seed2,
      awayTeam: 'Pemenang Play-in',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // Upper Final: Seed 1 (Juara Liga) vs Winner UB Semis
    upperMatches.push({
      id: 'UB_FINAL',
      bracket: 'upper',
      roundName: 'Upper Bracket Final',
      matchLabel: 'Seed 1 (Pimpinan Liga) vs Pemenang UB Semis (Tiket Grand Final)',
      homeTeam: seed1,
      awayTeam: 'Pemenang UB Semis',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });

    // Lower Final: Kalah UB Semis vs Kalah Upper Final
    lowerMatches.push({
      id: 'LB_FINAL',
      bracket: 'lower',
      roundName: 'Lower Bracket Final',
      matchLabel: 'Kalah UB Semis vs Kalah Upper Final',
      homeTeam: 'Kalah UB Semis',
      awayTeam: 'Kalah Upper Final',
      homeLeg1: null, awayLeg1: null,
      homeLeg2: null, awayLeg2: null,
      homePen: null, awayPen: null,
      winner: null, loser: null
    });
  }

  // Grand Final
  const grandFinal = {
    id: 'GRAND_FINAL',
    bracket: 'grand_final',
    roundName: 'Grand Final',
    matchLabel: 'Juara Upper Bracket vs Juara Lower Bracket',
    homeTeam: 'Juara Upper Bracket',
    awayTeam: 'Juara Lower Bracket',
    homeLeg1: null, awayLeg1: null,
    homeLeg2: null, awayLeg2: null,
    homePen: null, awayPen: null,
    winner: null, loser: null
  };

  return {
    playInMatches,
    upperMatches,
    lowerMatches,
    grandFinal,
    champion: null
  };
}

export function evaluateDoubleEliminationProgression(doubleElimData, config = {}) {
  if (!doubleElimData) return doubleElimData;

  const is2Legs = config.knockoutLegs === 2;
  const evaluateMatch = (m) => {
    if (!m) return;
    let hTotal = 0;
    let aTotal = 0;
    let isFinished = false;

    if (!is2Legs) {
      if (m.homeLeg1 !== null && m.awayLeg1 !== null) {
        hTotal = parseInt(m.homeLeg1, 10);
        aTotal = parseInt(m.awayLeg1, 10);
        isFinished = true;
      }
    } else {
      if (
        m.homeLeg1 !== null &&
        m.awayLeg1 !== null &&
        m.homeLeg2 !== null &&
        m.awayLeg2 !== null
      ) {
        hTotal = parseInt(m.homeLeg1, 10) + parseInt(m.homeLeg2, 10);
        aTotal = parseInt(m.awayLeg1, 10) + parseInt(m.awayLeg2, 10);
        isFinished = true;
      }
    }

    if (isFinished) {
      if (hTotal > aTotal) {
        m.winner = m.homeTeam;
        m.loser = m.awayTeam;
      } else if (aTotal > hTotal) {
        m.winner = m.awayTeam;
        m.loser = m.homeTeam;
      } else {
        if (m.homePen !== null && m.awayPen !== null) {
          const hp = parseInt(m.homePen, 10);
          const ap = parseInt(m.awayPen, 10);
          if (hp > ap) {
            m.winner = m.homeTeam;
            m.loser = m.awayTeam;
          } else if (ap > hp) {
            m.winner = m.awayTeam;
            m.loser = m.homeTeam;
          } else {
            m.winner = null;
            m.loser = null;
          }
        } else {
          m.winner = null;
          m.loser = null;
        }
      }
    } else {
      m.winner = null;
      m.loser = null;
    }
  };

  const { playInMatches = [], upperMatches = [], lowerMatches = [], grandFinal } = doubleElimData;

  // 1. Evaluate Play-in Matches
  playInMatches.forEach(evaluateMatch);

  const p1 = playInMatches.find(m => m.id === 'PLAYIN_M1');
  const p2 = playInMatches.find(m => m.id === 'PLAYIN_M2');
  const ubSf1 = upperMatches.find(m => m.id === 'UB_SF1');
  const ubSf2 = upperMatches.find(m => m.id === 'UB_SF2');
  const ubFinal = upperMatches.find(m => m.id === 'UB_FINAL');
  const lbSemi = lowerMatches.find(m => m.id === 'LB_SEMI');
  const lbFinal = lowerMatches.find(m => m.id === 'LB_FINAL');

  if (p2) {
    // 6-team MPL logic
    if (p1 && ubSf1) {
      ubSf1.awayTeam = p1.winner || 'Pemenang Play-in 1';
      evaluateMatch(ubSf1);
    }
    if (p2 && ubSf2) {
      ubSf2.awayTeam = p2.winner || 'Pemenang Play-in 2';
      evaluateMatch(ubSf2);
    }

    if (ubSf1 && ubSf2 && ubFinal) {
      ubFinal.homeTeam = ubSf1.winner || 'Pemenang UB SF1';
      ubFinal.awayTeam = ubSf2.winner || 'Pemenang UB SF2';
      evaluateMatch(ubFinal);
    }

    if (ubSf1 && ubSf2 && lbSemi) {
      lbSemi.homeTeam = ubSf1.loser || 'Kalah UB SF1';
      lbSemi.awayTeam = ubSf2.loser || 'Kalah UB SF2';
      evaluateMatch(lbSemi);
    }

    if (ubFinal && lbSemi && lbFinal) {
      lbFinal.homeTeam = ubFinal.loser || 'Kalah Upper Final';
      lbFinal.awayTeam = lbSemi.winner || 'Pemenang Lower Semi';
      evaluateMatch(lbFinal);
    }
  } else {
    // 4-team MPL/Gauntlet logic
    if (p1 && ubSf1) {
      ubSf1.awayTeam = p1.winner || 'Pemenang Play-in';
      evaluateMatch(ubSf1);
    }
    if (ubSf1 && ubFinal) {
      ubFinal.awayTeam = ubSf1.winner || 'Pemenang UB Semis';
      evaluateMatch(ubFinal);
    }
    if (ubSf1 && ubFinal && lbFinal) {
      lbFinal.homeTeam = ubSf1.loser || 'Kalah UB Semis';
      lbFinal.awayTeam = ubFinal.loser || 'Kalah Upper Final';
      evaluateMatch(lbFinal);
    }
  }

  // Evaluate Lower matches
  lowerMatches.forEach(evaluateMatch);

  // Grand Final
  if (grandFinal && ubFinal && lbFinal) {
    grandFinal.homeTeam = ubFinal.winner || 'Juara Upper Bracket';
    grandFinal.awayTeam = lbFinal.winner || 'Juara Lower Bracket';
    evaluateMatch(grandFinal);
  }

  const champion = grandFinal && grandFinal.winner ? grandFinal.winner : null;

  return {
    ...doubleElimData,
    playInMatches,
    upperMatches,
    lowerMatches,
    grandFinal,
    champion
  };
}
