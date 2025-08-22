import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { ThemeProvider } from './styles/ThemeProvider';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import OptionChainPage from './pages/OptionChainPage/OptionChainPage';
import CustomAnalysisPage from './pages/CustomAnalysisPage/CustomAnalysisPage';
import EarthLogicPage from './pages/EarthLogicPage/EarthLogicPage';
import SharpeLogicPage from './pages/SharpeLogicPage/SharpeLogicPage';
import AdditionalSharpProPage from './pages/AdditionalSharpProPage/AdditionalSharpProPage';
import OHLCPage from './pages/OHLCPage/OHLCPage';
import AdvancedAnalysisPage from './pages/AdvancedAnalysisPage/AdvancedAnalysisPage';
import SignalPage from './pages/SignalPage/SignalPage';
import SmdLiqHlcZ2hBtstPage from './pages/SmdLiqHlcZ2hBtstPage/SmdLiqHlcZ2hBtstPage';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';
import { SocketProvider } from './services/SocketService';
import { ScreenMode } from './types';
import { useScreenMode } from './hooks/useScreenMode';

// Import Tailwind CSS and Font Awesome
import './styles/globals.css';
import './utils/fontawesome';

const AppContainer = styled.div<{ screenMode: ScreenMode; sidebarOpen: boolean }>`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  background-attachment: fixed;
  color: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  
  ${({ screenMode }) => {
    switch (screenMode) {
      case 'mobile':
        return `
          flex-direction: column;
          font-size: 14px;
        `;
      case 'tablet':
        return `
          font-size: 15px;
        `;
      default:
        return `
          font-size: 16px;
        `;
    }
  }}
`;

const MainContent = styled.main<{ screenMode: ScreenMode; sidebarOpen: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${({ screenMode, sidebarOpen }) => {
    if (screenMode === 'mobile') {
      return `
        margin-left: 0;
        width: 100%;
      `;
    }
    return `
      margin-left: ${sidebarOpen ? '280px' : '60px'};
      width: ${sidebarOpen ? 'calc(100% - 280px)' : 'calc(100% - 60px)'};
    `;
  }}
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const MarketClosedOverlay = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'flex' : 'none')};
  position: fixed;
  z-index: 10000;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 24, 24, 0.98);
  color: #f00;
  font-size: 2.2rem;
  font-weight: bold;
  text-align: center;
  align-items: center;
  justify-content: center;
  letter-spacing: 2px;
  flex-direction: column;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const MarketClosedSubtext = styled.div`
  font-size: 1rem;
  margin-top: 20px;
  opacity: 0.8;
`;

function App() {
  const [currentPage, setCurrentPage] = useState<string>('option-chain');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showMarketClosed, setShowMarketClosed] = useState<boolean>(false);
  const screenMode = useScreenMode();

  // Check market status on mount and periodically
  useEffect(() => {
    const checkMarketStatus = () => {
      // Market status check is disabled for development
      // Uncomment below lines to enable market hours checking
      
      // const now = new Date();
      // const hours = now.getHours();
      // const minutes = now.getMinutes();
      // const currentMinutes = hours * 60 + minutes;
      // 
      // // Market timings: 9:15 AM to 3:30 PM (IST)
      // const marketOpen = 9 * 60 + 15; // 9:15 AM
      // const marketClose = 15 * 60 + 30; // 3:30 PM
      // 
      // setShowMarketClosed(currentMinutes < marketOpen || currentMinutes > marketClose);
      
      setShowMarketClosed(false); // Disabled for development
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (screenMode === 'mobile') {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [screenMode]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    // Auto-collapse sidebar on mobile after page selection
    if (screenMode === 'mobile') {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'option-chain':
        return <OptionChainPage />;
      case 'custom-analysis':
        return <CustomAnalysisPage />;
      case 'earth-logic':
        return <EarthLogicPage />;
      case 'sharpe-logic':
        return <SharpeLogicPage />;
      case 'additional-sharp-pro':
        return <AdditionalSharpProPage />;
      case 'smd-liq-hlc-z2h-btst':
        return <SmdLiqHlcZ2hBtstPage />;
      case 'ohlc-data':
        return <OHLCPage />;
      case 'advanced-analysis':
        return <AdvancedAnalysisPage />;
      case 'signal':
        return <SignalPage />;
      default:
        return <OptionChainPage />;
    }
  };

  return (
    <ThemeProvider>
      <SocketProvider>
        <GlobalStyles />
        <AppContainer screenMode={screenMode} sidebarOpen={sidebarOpen}>
          {/* Market Closed Overlay */}
          <MarketClosedOverlay show={showMarketClosed}>
            <div>MARKET CLOSED</div>
            <MarketClosedSubtext>
              Live data will resume when market opens
            </MarketClosedSubtext>
          </MarketClosedOverlay>

          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onToggle={toggleSidebar}
            screenMode={screenMode}
          />

          {/* Main Content */}
          <MainContent screenMode={screenMode} sidebarOpen={sidebarOpen}>
            {/* Header */}
            <Header
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onToggleSidebar={toggleSidebar}
              screenMode={screenMode}
              onScreenModeChange={() => {}} // Screen mode is auto-detected, no manual change needed
            />

            {/* Content Area */}
            <ContentArea>
              {renderPage()}
            </ContentArea>
          </MainContent>

          {/* Notification System */}
          <NotificationSystem />
        </AppContainer>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
