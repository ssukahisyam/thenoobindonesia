import React, { useState, useEffect, Component } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import Navbar from './components/layout/Navbar';
import HeaderStats from './components/layout/HeaderStats';
import Toast from './components/layout/Toast';
import StandingsView from './components/views/StandingsView';
import BracketView from './components/views/BracketView';
import WheelSpinView from './components/views/WheelSpinView';
import SetupView from './components/views/SetupView';
import ShareStudioView from './components/views/ShareStudioView';
import TournamentListModal from './components/modals/TournamentListModal';
import CreateTournamentModal from './components/modals/CreateTournamentModal';
import BulkAddTeamsModal from './components/modals/BulkAddTeamsModal';
import CloudSyncModal from './components/modals/CloudSyncModal';
import HistoryBackupModal from './components/modals/HistoryBackupModal';
import { AlertCircle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Terjadi Kendala Memuat Data</h2>
            <p className="text-xs text-slate-400">
              Sistem telah mendeteksi error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainLayout() {
  const { activeTournament } = useTournament();
  const [activeTab, setActiveTab] = useState('standings');
  const [isTournamentListOpen, setIsTournamentListOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Auto-switch tabs based on tournament format
  useEffect(() => {
    if (activeTournament) {
      if (activeTournament.mode === 'knockout' && activeTab === 'standings') {
        setActiveTab('bracket');
      } else if (activeTournament.mode !== 'cup' && activeTab === 'wheel') {
        setActiveTab('standings');
      }
    }
  }, [activeTournament, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-efootball-darkBg text-slate-100 selection:bg-efootball-neonGreen selection:text-black">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTournamentList={() => setIsTournamentListOpen(true)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* Tournament Overview Stats Cards */}
        <HeaderStats />

        {/* Tab Views */}
        {activeTab === 'standings' && (
          <StandingsView
            onNavigateToBracket={() => setActiveTab('bracket')}
            onNavigateToShare={() => setActiveTab('share')}
          />
        )}

        {activeTab === 'bracket' && (
          <BracketView
            onNavigateToShare={() => setActiveTab('share')}
          />
        )}

        {activeTab === 'wheel' && (
          <WheelSpinView
            onNavigateToStandings={() => setActiveTab('standings')}
          />
        )}

        {activeTab === 'setup' && (
          <SetupView
            onOpenBulkModal={() => setIsBulkModalOpen(true)}
          />
        )}

        {activeTab === 'share' && (
          <ShareStudioView />
        )}

      </main>

      {/* Global Modals */}
      <TournamentListModal
        isOpen={isTournamentListOpen}
        onClose={() => setIsTournamentListOpen(false)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BulkAddTeamsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />

      <HistoryBackupModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Global Toast */}
      <Toast />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>eFootball Tournament Manager PRO v2 • Firebase Realtime Database Synced with Auto-Snapshots</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TournamentProvider>
        <MainLayout />
      </TournamentProvider>
    </ErrorBoundary>
  );
}
