import React, { useState, useEffect } from 'react';
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
    <TournamentProvider>
      <MainLayout />
    </TournamentProvider>
  );
}
