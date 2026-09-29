import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  Trophy,
  Calendar,
  Share2,
  GitFork,
  CheckCircle2,
  Clock,
  Filter,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Users,
  Search,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { generateStandingsWAText } from '../../services/exportService';

export default function StandingsView({ onNavigateToBracket, onNavigateToShare }) {
  const {
    activeTournament,
    standingsMap,
    updateGroupScore,
    regenerateTournamentSchedule,
    showToast
  } = useTournament();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unplayed' | 'finished'
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [selectedMatchdayFilter, setSelectedMatchdayFilter] = useState('all');

  if (!activeTournament) return null;

  const mode = activeTournament.mode;
  const isLeague = mode === 'league';
  const isKnockout = mode === 'knockout';
  const groupMatches = activeTournament.groupMatches || [];
  const teams = activeTournament.teams || [];
  const teamNames = teams.map(t => (typeof t === 'string' ? t : t.name));

  // Group filter list
  const groupKeys = Object.keys(standingsMap);

  // Matchday filter list
  const matchdays = Array.from(
    new Set(groupMatches.map(m => m.round))
  ).sort((a, b) => a - b);

  // Total finished & unplayed stats
  const totalFinished = groupMatches.filter(m => m.homeScore !== null && m.awayScore !== null).length;
  const totalUnplayed = groupMatches.length - totalFinished;

  // Filtered matches logic with Search Query, Player Chip, Status Filter, Group, & Matchday
  const filteredMatches = useMemo(() => {
    return groupMatches.filter(m => {
      // 1. Search Query (matches home or away)
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        m.home.toLowerCase().includes(query) ||
        m.away.toLowerCase().includes(query) ||
        `matchday ${m.round}`.includes(query) ||
        `md ${m.round}`.includes(query);

      // 2. Player Chip Filter
      const matchPlayer =
        selectedPlayerFilter === 'all' ||
        m.home.toLowerCase() === selectedPlayerFilter.toLowerCase() ||
        m.away.toLowerCase() === selectedPlayerFilter.toLowerCase();

      // 3. Status Filter (finished vs unplayed)
      const isFinished = m.homeScore !== null && m.awayScore !== null;
      let matchStatus = true;
      if (statusFilter === 'unplayed') matchStatus = !isFinished;
      if (statusFilter === 'finished') matchStatus = isFinished;

      // 4. Group & Matchday Filter
      const matchGroup = selectedGroupFilter === 'all' || m.group === selectedGroupFilter;
      const matchRound = selectedMatchdayFilter === 'all' || m.round === parseInt(selectedMatchdayFilter, 10);

      return matchSearch && matchPlayer && matchStatus && matchGroup && matchRound;
    });
  }, [groupMatches, searchQuery, selectedPlayerFilter, statusFilter, selectedGroupFilter, selectedMatchdayFilter]);

  // Group filtered matches by section (e.g. "Matchday 1" or "Grup A - Matchday 1")
  const matchesByGroupAndRound = useMemo(() => {
    const grouped = {};
    filteredMatches.forEach(m => {
      const key = isLeague ? `Matchday ${m.round}` : `Grup ${m.group} - Matchday ${m.round}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  }, [filteredMatches, isLeague]);

  const handleCopyStandingsWA = () => {
    const text = generateStandingsWAText(activeTournament, standingsMap);
    navigator.clipboard.writeText(text);
    showToast('Teks Klasemen disalin! Siap dipaste ke WhatsApp.');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlayerFilter('all');
    setStatusFilter('all');
    setSelectedGroupFilter('all');
    setSelectedMatchdayFilter('all');
  };

  const isFiltering =
    searchQuery !== '' ||
    selectedPlayerFilter !== 'all' ||
    statusFilter !== 'all' ||
    selectedGroupFilter !== 'all' ||
    selectedMatchdayFilter !== 'all';

  const getRankBadgeClass = (status) => {
    switch (status) {
      case 'upper_bracket':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold';
      case 'lower_bracket':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold';
      case 'qualified':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold';
      case 'champion':
        return 'bg-amber-500 text-slate-950 font-black';
      case 'eliminated':
        return 'bg-red-500/10 text-red-400/70 border border-red-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span>{isLeague ? 'Klasemen & Jadwal Pertandingan Liga' : 'Klasemen & Jadwal Pertandingan'}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isLeague
              ? 'Format Liga Penuh (Round Robin) • Skor yang diisi langsung memperbarui klasemen dan alokasi Playoff Upper/Lower.'
              : 'Skor yang diisi langsung memperbarui peringkat klasemen dan otomatis meloloskan tim ke babak playoff.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyStandingsWA}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Klasemen WA</span>
          </button>

          {(isLeague && activeTournament.config?.hasPlayoffs) || mode === 'cup' || isKnockout ? (
            <button
              onClick={onNavigateToBracket}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <GitFork className="w-4 h-4" />
              <span>Lihat Playoff Bracket</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Knockout Mode Direct Info Banner */}
      {isKnockout && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 text-center space-y-3">
          <GitFork className="w-8 h-8 mx-auto text-purple-400" />
          <h3 className="text-base font-bold text-white">
            Turnamen ini menggunakan Format Bagan Knockout Murni
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Jadwal dan pengisian skor babak gugur (Playoff) langsung ditampilkan di tab bagan pohon eliminasi.
          </p>
          <button
            onClick={onNavigateToBracket}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/20 inline-flex items-center gap-2"
          >
            <GitFork className="w-4 h-4" />
            <span>Buka Bagan Playoff Knockout</span>
          </button>
        </div>
      )}

      {/* Standings Tables Grid */}
      {!isKnockout && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groupKeys.map(gKey => {
            const list = standingsMap[gKey] || [];

            return (
              <div
                key={gKey}
                className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
                  groupKeys.length === 1 ? 'lg:col-span-2' : ''
                }`}
              >
                {/* Table Header */}
                <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="font-extrabold text-white text-base">
                      {isLeague ? 'Klasemen Liga Utama' : `Klasemen Grup ${gKey}`}
                    </h3>
                  </div>

                  {/* Qualification Legend */}
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    {isLeague && activeTournament.config?.playoffType === 'double_elim' ? (
                      <>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🟢 Upper Bracket ({activeTournament.config.playoffUpperCount || 2})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          🟡 Lower Bracket ({activeTournament.config.playoffLowerCount || 2})
                        </span>
                      </>
                    ) : isLeague && activeTournament.config?.hasPlayoffs ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🟢 Top {(activeTournament.config.playoffUpperCount || 2) + (activeTournament.config.playoffLowerCount || 2)} Playoff
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Top {activeTournament.config?.advancePerGroup || 2} Lolos
                      </span>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/40 text-[10px] uppercase font-black text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3 text-center w-10">Pos</th>
                        <th className="py-2.5 px-3">Tim / Player</th>
                        <th className="py-2.5 px-2 text-center" title="Main">P</th>
                        <th className="py-2.5 px-2 text-center text-emerald-400" title="Menang">W</th>
                        <th className="py-2.5 px-2 text-center text-amber-400" title="Seri">D</th>
                        <th className="py-2.5 px-2 text-center text-red-400" title="Kalah">L</th>
                        <th className="py-2.5 px-2 text-center text-slate-400 hidden sm:table-cell" title="Gol Masuk">GF</th>
                        <th className="py-2.5 px-2 text-center text-slate-400 hidden sm:table-cell" title="Kebobolan">GA</th>
                        <th className="py-2.5 px-2 text-center" title="Selisih Gol">GD</th>
                        <th className="py-2.5 px-3 text-center text-emerald-400 font-black">PTS</th>
                        <th className="py-2.5 px-3 text-right">Status Zona</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {list.map((item) => {
                        const rankClass = getRankBadgeClass(item.status);
                        const gdText = item.gd > 0 ? `+${item.gd}` : `${item.gd}`;

                        return (
                          <tr
                            key={item.name}
                            className={`hover:bg-slate-800/40 transition cursor-pointer ${
                              selectedPlayerFilter.toLowerCase() === item.name.toLowerCase()
                                ? 'bg-emerald-500/10 border-l-2 border-emerald-400'
                                : item.status === 'upper_bracket'
                                ? 'bg-emerald-500/[0.03]'
                                : item.status === 'lower_bracket'
                                ? 'bg-amber-500/[0.03]'
                                : item.status === 'eliminated'
                                ? 'opacity-60'
                                : ''
                            }`}
                            onClick={() => {
                              setSelectedPlayerFilter(
                                selectedPlayerFilter.toLowerCase() === item.name.toLowerCase()
                                  ? 'all'
                                  : item.name
                              );
                            }}
                            title="Klik untuk memfilter semua jadwal pertandingan tim ini"
                          >
                            {/* Rank */}
                            <td className="py-3 px-3 text-center font-bold">
                              <span className={`w-6 h-6 rounded-lg text-xs inline-flex items-center justify-center ${rankClass}`}>
                                {item.rank}
                              </span>
                            </td>

                            {/* Team Name */}
                            <td className="py-3 px-3 font-extrabold text-white text-xs sm:text-sm">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{item.name}</span>
                              </div>
                            </td>

                            {/* Stats */}
                            <td className="py-3 px-2 text-center text-slate-300 font-semibold">{item.p}</td>
                            <td className="py-3 px-2 text-center text-emerald-400 font-bold">{item.w}</td>
                            <td className="py-3 px-2 text-center text-amber-400 font-bold">{item.d}</td>
                            <td className="py-3 px-2 text-center text-red-400 font-bold">{item.l}</td>
                            <td className="py-3 px-2 text-center text-slate-400 hidden sm:table-cell">{item.gf}</td>
                            <td className="py-3 px-2 text-center text-slate-400 hidden sm:table-cell">{item.ga}</td>
                            <td className={`py-3 px-2 text-center font-bold ${item.gd > 0 ? 'text-emerald-400' : item.gd < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                              {gdText}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-emerald-400 text-sm sm:text-base">
                              {item.pts}
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3 text-right">
                              {item.status === 'upper_bracket' && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                  Upper Bracket
                                </span>
                              )}
                              {item.status === 'lower_bracket' && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                  Lower Bracket
                                </span>
                              )}
                              {item.status === 'qualified' && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                  Lolos Playoff
                                </span>
                              )}
                              {item.status === 'champion' && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-black bg-amber-500 text-slate-950 whitespace-nowrap">
                                  👑 Pimpinan
                                </span>
                              )}
                              {item.status === 'eliminated' && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/10 text-red-400/80 border border-red-500/20 whitespace-nowrap">
                                  Gugur
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matches & Interactive Search & Score Input Section */}
      {!isKnockout && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          
          {/* Section Title & Progress Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Jadwal & Input Skor Pertandingan
                </h3>
                <p className="text-[11px] text-slate-400">
                  Temukan pertandingan dengan cepat menggunakan pencarian dan filter di bawah
                </p>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ✅ {totalFinished} Laga Selesai
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                ⏳ {totalUnplayed} Belum Diisi
              </span>
            </div>
          </div>

          {/* SMART SEARCH & FILTER TOOLBAR */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            
            {/* Top Row: Search Input + Status Filter Chips */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Cari nama tim / pemain (contoh: Ghosani, Hisyam, Matchday 5)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs (Semua, Belum Selesai, Sudah Selesai) */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua ({groupMatches.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unplayed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'unplayed'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  ⏳ Belum Selesai ({totalUnplayed})
                </button>
                <button
                  onClick={() => setStatusFilter('finished')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === 'finished'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✅ Selesai ({totalFinished})
                </button>
              </div>

              {/* Matchday Select Dropdown */}
              {matchdays.length > 0 && (
                <select
                  value={selectedMatchdayFilter}
                  onChange={(e) => setSelectedMatchdayFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-400 shrink-0"
                >
                  <option value="all">Semua Matchday ({matchdays.length} Pekan)</option>
                  {matchdays.map(rd => (
                    <option key={rd} value={rd}>Matchday {rd}</option>
                  ))}
                </select>
              )}

              {/* Clear Filters Button */}
              {isFiltering && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
                  title="Reset Semua Filter"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>

            {/* Bottom Row: Quick Player Chips (Filter by Specific Player) */}
            {teamNames.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-850">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filter Cepat Tim:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                  <button
                    onClick={() => setSelectedPlayerFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedPlayerFilter === 'all'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Semua Tim
                  </button>

                  {teamNames.map(name => {
                    const isSelected = selectedPlayerFilter.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedPlayerFilter(isSelected ? 'all' : name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Empty / Unscheduled state */}
          {groupMatches.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <Calendar className="w-8 h-8 mx-auto text-slate-600" />
              <h4 className="text-sm font-bold text-slate-300">
                {teams.length < 2
                  ? 'Belum cukup peserta untuk menyusun jadwal pertandingan (minimal 2 peserta).'
                  : 'Jadwal pertandingan belum digenerate.'}
              </h4>
              {teams.length >= 2 && (
                <button
                  onClick={regenerateTournamentSchedule}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Susun & Generate Jadwal Sekarang ({teams.length} Peserta)</span>
                </button>
              )}
            </div>
          ) : Object.keys(matchesByGroupAndRound).length === 0 ? (
            <div className="p-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
              <p className="text-sm font-bold text-white">
                Tidak ada pertandingan yang cocok dengan pencarian / filter Anda.
              </p>
              <p className="text-xs text-slate-400">
                Coba ubah kata kunci pencarian atau klik tombol reset di bawah.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Pertandingan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(matchesByGroupAndRound).map(sectionKey => {
                const mList = matchesByGroupAndRound[sectionKey];
                const finishedCount = mList.filter(m => m.homeScore !== null && m.awayScore !== null).length;

                // Find resting team if odd number of participants in league/group
                const playingTeams = new Set(mList.flatMap(m => [m.home, m.away]));
                const totalInGroup = isLeague
                  ? (activeTournament.groups['Liga'] || [])
                  : (activeTournament.groups[mList[0]?.group] || []);
                const restingTeams = totalInGroup.filter(name => !playingTeams.has(name));

                return (
                  <div
                    key={sectionKey}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
                  >
                    {/* Round Subheader */}
                    <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sectionKey}</span>
                        {restingTeams.length > 0 && (
                          <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
                            Istirahat (Bye): {restingTeams.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {finishedCount} / {mList.length} Selesai
                      </span>
                    </div>

                    {/* Match Cards Container */}
                    <div className="divide-y divide-slate-800/40 p-2">
                      {mList.map(m => {
                        const hasScore = m.homeScore !== null && m.awayScore !== null;

                        return (
                          <div
                            key={m.id}
                            className={`py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition ${
                              hasScore ? 'bg-slate-900/40' : 'bg-amber-500/[0.02] border border-dashed border-slate-850'
                            }`}
                          >
                            {/* Home Team */}
                            <div className="flex-1 text-right font-black text-xs sm:text-sm text-slate-100 truncate">
                              <span className={searchQuery && m.home.toLowerCase().includes(searchQuery.toLowerCase()) ? 'text-emerald-400 font-black underline' : ''}>
                                {m.home}
                              </span>
                            </div>

                            {/* Score Input Box */}
                            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 shrink-0 shadow-inner">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={m.homeScore !== null ? m.homeScore : ''}
                                onChange={(e) => updateGroupScore(m.id, 'home', e.target.value)}
                                placeholder="-"
                                className={`w-9 h-8 bg-slate-950 border rounded-lg text-center font-black text-sm focus:outline-none focus:border-emerald-400 ${
                                  m.homeScore !== null ? 'text-emerald-400 border-slate-800' : 'text-slate-500 border-dashed border-slate-700'
                                }`}
                              />
                              <span className="text-slate-500 font-bold text-xs">:</span>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={m.awayScore !== null ? m.awayScore : ''}
                                onChange={(e) => updateGroupScore(m.id, 'away', e.target.value)}
                                placeholder="-"
                                className={`w-9 h-8 bg-slate-950 border rounded-lg text-center font-black text-sm focus:outline-none focus:border-emerald-400 ${
                                  m.awayScore !== null ? 'text-emerald-400 border-slate-800' : 'text-slate-500 border-dashed border-slate-700'
                                }`}
                              />
                            </div>

                            {/* Away Team */}
                            <div className="flex-1 text-left font-black text-xs sm:text-sm text-slate-100 truncate">
                              <span className={searchQuery && m.away.toLowerCase().includes(searchQuery.toLowerCase()) ? 'text-emerald-400 font-black underline' : ''}>
                                {m.away}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
