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

// New Data Science & ML Lifecycle Pages
import { DataIntelligenceHubPage } from './pages/DataIntelligenceHubPage';
import { DatasetInsightsStudioPage } from './pages/DatasetInsightsStudioPage';
import { DataQualityCenterPage } from './pages/DataQualityCenterPage';
import { FeatureEngineeringLabPage } from './pages/FeatureEngineeringLabPage';
import { FeatureNormalizationStudioPage } from './pages/FeatureNormalizationStudioPage';
import { PrincipalComponentExplorerPage } from './pages/PrincipalComponentExplorerPage';
import { ModelTrainingCenterPage } from './pages/ModelTrainingCenterPage';
import { ModelPerformanceLabPage } from './pages/ModelPerformanceLabPage';
import { ModelExplainabilityCenterPage } from './pages/ModelExplainabilityCenterPage';
import { MLExperimentRegistryPage } from './pages/MLExperimentRegistryPage';

import { User } from './types';
import { authApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
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

  const handleAuthSuccess = (_token: string, userData: any) => {
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

  const navigateToTab = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedSessionId(null);
  };

  const renderPage = () => {
    if (activeTab === 'history' && selectedSessionId) {
      return <SessionDetailPage sessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
    }
    switch (activeTab) {
      case 'dashboard': return <DashboardPage onSelectSession={handleViewSession} onNavigate={navigateToTab} />;
      case 'live-transceiver': return <LiveTransceiverPage isDemoMode={isDemoMode} />;
      case 'stt': return <STTPage />;
      case 'language-detection': return <LanguageDetectionPage />;
      case 'translation': return <TranslationPage />;
      case 'history': return <HistoryPage onViewSession={handleViewSession} />;

      // Machine Learning Lifecycle Modules
      case 'ml-hub': return <DataIntelligenceHubPage onNavigate={navigateToTab} />;
      case 'ml-eda': return <DatasetInsightsStudioPage onNavigate={navigateToTab} />;
      case 'ml-quality': return <DataQualityCenterPage onNavigate={navigateToTab} />;
      case 'ml-features': return <FeatureEngineeringLabPage onNavigate={navigateToTab} />;
      case 'ml-scaling': return <FeatureNormalizationStudioPage onNavigate={navigateToTab} />;
      case 'ml-pca': return <PrincipalComponentExplorerPage onNavigate={navigateToTab} />;
      case 'ml-training': return <ModelTrainingCenterPage onNavigate={navigateToTab} />;
      case 'ml-performance': return <ModelPerformanceLabPage onNavigate={navigateToTab} />;
      case 'ml-explainability': return <ModelExplainabilityCenterPage onNavigate={navigateToTab} />;
      case 'ml-registry': return <MLExperimentRegistryPage onNavigate={navigateToTab} />;
      case 'ml-model': return <MLModelPage onNavigate={navigateToTab} />;

      // Radio & Signals
      case 'radio-simulation': return <RadioSimulationPage />;
      case 'nlp-analysis': return <NLPPage />;

      // System
      case 'analytics': return <AnalyticsPage />;
      case 'system-monitoring': return <SystemMonitoringPage />;
      case 'viva-guide': return <VivaGuidePage />;
      case 'admin': return user?.role === 'ADMIN' ? <AdminPage /> : <div className="text-center py-12 text-rose-600 font-semibold">Admin access required.</div>;
      default: return <DashboardPage onSelectSession={handleViewSession} onNavigate={navigateToTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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
          onSelectTab={navigateToTab}
          user={user}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 min-h-screen">
          <div className="max-w-[1600px] mx-auto w-full">
            {renderPage()}
          </div>
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
