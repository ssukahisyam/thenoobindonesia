// Export Service: WhatsApp Formatter & Poster Exporter
import html2canvas from 'html2canvas';

export function generateStandingsWAText(tournament, standingsMap) {
  if (!tournament) return '';

  let text = `🏆 *${tournament.name.toUpperCase()}*\n`;
  text += `📅 Update Klasemen: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (let gKey in standingsMap) {
    const list = standingsMap[gKey] || [];
    text += `📌 *KLASEMEN ${gKey.toUpperCase()}*\n`;
    text += `*POS | TIM | P | W | D | L | GD | PTS*\n`;

    list.forEach((item, idx) => {
      const gdText = item.gd > 0 ? `+${item.gd}` : `${item.gd}`;
      let badge = '';
      if (item.status === 'upper_bracket') badge = ' 🟢 [Upper Semis]';
      else if (item.status === 'playin_round' || item.status === 'lower_bracket') badge = ' 🟡 [Play-in]';
      else if (item.status === 'qualified') badge = ' 🟢 [Lolos]';
      else if (item.status === 'eliminated') badge = ' 🔴 [Gugur]';

      text += `${idx + 1}. *${item.name}* | ${item.p} | ${item.w} | ${item.d} | ${item.l} | ${gdText} | *${item.pts}*${badge}\n`;
    });
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Dibuat dengan eFootball Tournament Manager PRO_`;

  return text;
}

export function generateDoubleElimWAText(tournament, doubleElim) {
  if (!tournament || !doubleElim) return '';

  let text = `🔥 *HASIL PLAYOFF SISTEM MPL (HYBRID DOUBLE ELIMINATION)*\n`;
  text += `🏆 *${tournament.name.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if ((doubleElim.playInMatches || []).length > 0) {
    text += `⚔️ *TAHAP 1: BABAK PLAY-IN (SUDDEN DEATH)*\n`;
    doubleElim.playInMatches.forEach(m => {
      const s1 = m.homeLeg1 !== null ? m.homeLeg1 : '-';
      const s2 = m.awayLeg1 !== null ? m.awayLeg1 : '-';
      text += `• *${m.roundName}*: ${m.homeTeam}  *${s1} - ${s2}*  ${m.awayTeam}`;
      if (m.winner) text += ` -> *Menang (Lolos ke Upper): ${m.winner}*`;
      text += `\n`;
    });
    text += `\n`;
  }

  text += `🟢 *TAHAP 2: UPPER BRACKET (2 NYAWA)*\n`;
  (doubleElim.upperMatches || []).forEach(m => {
    const s1 = m.homeLeg1 !== null ? m.homeLeg1 : '-';
    const s2 = m.awayLeg1 !== null ? m.awayLeg1 : '-';
    text += `• *${m.roundName}*: ${m.homeTeam}  *${s1} - ${s2}*  ${m.awayTeam}`;
    if (m.winner) text += ` -> *Pemenang: ${m.winner}*`;
    text += `\n`;
  });
  text += `\n`;

  text += `🟡 *TAHAP 3: LOWER BRACKET (PENENTUAN)*\n`;
  (doubleElim.lowerMatches || []).forEach(m => {
    const s1 = m.homeLeg1 !== null ? m.homeLeg1 : '-';
    const s2 = m.awayLeg1 !== null ? m.awayLeg1 : '-';
    text += `• *${m.roundName}*: ${m.homeTeam}  *${s1} - ${s2}*  ${m.awayTeam}`;
    if (m.winner) text += ` -> *Lolos: ${m.winner}*`;
    text += `\n`;
  });
  text += `\n`;

  if (doubleElim.grandFinal) {
    const gf = doubleElim.grandFinal;
    const s1 = gf.homeLeg1 !== null ? gf.homeLeg1 : '-';
    const s2 = gf.awayLeg1 !== null ? gf.awayLeg1 : '-';
    text += `👑 *GRAND FINAL*\n`;
    text += `${gf.homeTeam}  *${s1} - ${s2}*  ${gf.awayTeam}\n`;
    if (gf.winner) text += `🏆 *JUARA 1: ${gf.winner}* 🎉\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Dibuat dengan eFootball Tournament Manager PRO_`;

  return text;
}

export function generateSingleElimWAText(tournament, matches) {
  if (!tournament || !matches) return '';

  let text = `🔥 *HASIL BABAK GUGUR (PLAYOFF)*\n`;
  text += `🏆 *${tournament.name.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  matches.forEach(m => {
    const s1 = m.homeLeg1 !== null ? m.homeLeg1 : '-';
    const s2 = m.awayLeg1 !== null ? m.awayLeg1 : '-';
    text += `• *${m.roundName}*: ${m.homeTeam}  *${s1} - ${s2}*  ${m.awayTeam}`;
    if (m.winner) text += ` -> *Menang: ${m.winner}*`;
    text += `\n`;
  });

  const finalMatch = matches.find(m => m.id === 'FINAL');
  if (finalMatch && finalMatch.winner) {
    text += `\n👑 *JUARA 1*: 🏆 *${finalMatch.winner}* 🎉\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Dibuat dengan eFootball Tournament Manager PRO_`;

  return text;
}

export async function exportElementAsImage(elementId, filename = 'tournament-poster.png') {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#080c14',
      useCORS: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (error) {
    console.error('Error generating image poster:', error);
    return false;
  }
}
