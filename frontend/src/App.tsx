import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { LiveTransceiverPage } from './pages/LiveTransceiverPage';
import { DashboardPage } from './pages/DashboardPage';
import { STTPage } from './pages/STTPage';
import { TranslationPage, LanguageDetectionPage } from './pages/TranslationPage';
import { NLPPage } from './pages/NLPPage';
import { RadioSimulationPage } from './pages/RadioSimulationPage';
import { MLModelPage } from './pages/MLModelPage';
import { HistoryPage, SessionDetailPage } from './pages/HistoryPage';
import { AnalyticsPage, SystemMonitoringPage } from './pages/AnalyticsPage';
import { AdminPage, VivaGuidePage } from './pages/AdminPage';
import { User } from './types';
import { authApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('live-transceiver');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('itantra_token');
    if (token) {
      authApi.getMe().then(setUser).catch(() => { localStorage.removeItem('itantra_token'); });
    }
  }, []);

  const handleAuthSuccess = (token: string, userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('itantra_token');
    setUser(null);
  };

  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('history');
  };

  const renderPage = () => {
    if (activeTab === 'history' && selectedSessionId) {
      return <SessionDetailPage sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
    }
    switch (activeTab) {
      case 'live-transceiver': return <LiveTransceiverPage isDemoMode={isDemoMode} />;
      case 'dashboard': return <DashboardPage onSelectSession={handleViewSession} />;
      case 'stt': return <STTPage />;
      case 'language-detection': return <LanguageDetectionPage />;
      case 'translation': return <TranslationPage />;
      case 'nlp-analysis': return <NLPPage />;
      case 'radio-simulation': return <RadioSimulationPage />;
      case 'ml-model': return <MLModelPage />;
      case 'history': return <HistoryPage onViewSession={handleViewSession} />;
      case 'analytics': return <AnalyticsPage />;
      case 'system-monitoring': return <SystemMonitoringPage />;
      case 'viva-guide': return <VivaGuidePage />;
      case 'admin': return user?.role === 'ADMIN' ? <AdminPage /> : <div className="text-center py-12 text-rose-400">Admin access required.</div>;
      default: return <LiveTransceiverPage isDemoMode={isDemoMode} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => { setActiveTab(tab); setSelectedSessionId(null); }}
          user={user}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
