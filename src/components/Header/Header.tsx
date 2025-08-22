import React, { useState } from 'react';
import styled from 'styled-components';
import { ScreenMode } from '../../types';
import { formatTime } from '../../utils/helpers';

const HeaderContainer = styled.header<{ isCollapsed?: boolean }>`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  flex: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #000;
  font-size: 14px;
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

const CompanyName = styled.h1`
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  line-height: 1;
`;

const Tagline = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const MenuButton = styled.button<{ isActive?: boolean }>`
  background: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : 'transparent'};
  color: ${({ isActive, theme }) => 
    isActive ? '#000' : theme.colors.text.primary};
  border: 1px solid ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: #000;
    transform: translateY(-1px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xs};
    font-size: 10px;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-basis: 100%;
    justify-content: space-between;
    margin-top: ${({ theme }) => theme.spacing.sm};
  }
`;

const StatusIndicator = styled.div<{ status: 'connected' | 'disconnected' | 'connecting' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ status, theme }) => {
      switch (status) {
        case 'connected': return theme.colors.success;
        case 'disconnected': return theme.colors.error;
        case 'connecting': return theme.colors.warning;
        default: return theme.colors.border.secondary;
      }
    }};
    animation: ${({ status }) => 
      status === 'connecting' ? 'pulse 2s infinite' : 'none'};
  }
`;

const TimeDisplay = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 10px;
  }
`;

const MarketStatus = styled.div<{ status: 'open' | 'closed' | 'pre-open' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ status, theme }) => {
    switch (status) {
      case 'open': return theme.colors.success + '20';
      case 'closed': return theme.colors.error + '20';
      case 'pre-open': return theme.colors.warning + '20';
      default: return theme.colors.border.secondary + '20';
    }
  }};
  color: ${({ status, theme }) => {
    switch (status) {
      case 'open': return theme.colors.success;
      case 'closed': return theme.colors.error;
      case 'pre-open': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  }};
  border: 1px solid ${({ status, theme }) => {
    switch (status) {
      case 'open': return theme.colors.success;
      case 'closed': return theme.colors.error;
      case 'pre-open': return theme.colors.warning;
      default: return theme.colors.border.secondary;
    }
  }};
`;

const ScreenModeToggle = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  overflow: hidden;
`;

const ScreenModeButton = styled.button<{ isActive?: boolean }>`
  background: ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : 'transparent'};
  color: ${({ isActive, theme }) => 
    isActive ? '#000' : theme.colors.text.secondary};
  border: none;
  padding: ${({ theme }) => theme.spacing.xs};
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}80;
  }
`;

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onToggleSidebar: () => void;
  screenMode: ScreenMode;
  onScreenModeChange: (mode: ScreenMode) => void;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
  marketStatus?: 'open' | 'closed' | 'pre-open';
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageChange,
  onToggleSidebar,
  screenMode,
  onScreenModeChange,
  connectionStatus = 'connected',
  marketStatus = 'open',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'option-chain', label: 'Option Chain', shortLabel: 'Chain' },
    { id: 'earth-logic', label: 'Earth Logic', shortLabel: 'Earth' },
    { id: 'sharpe-logic', label: 'SHARPE Logic', shortLabel: 'SHARPE' },
    { id: 'ohlc-data', label: 'OHLC Data', shortLabel: 'OHLC' },
    { id: 'advanced-analysis', label: 'Advanced', shortLabel: 'Adv' },
  ];

  const getMarketStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Market Open';
      case 'closed': return 'Market Closed';
      case 'pre-open': return 'Pre-Open';
      default: return 'Unknown';
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Live';
      case 'disconnected': return 'Offline';
      case 'connecting': return 'Connecting';
      default: return 'Unknown';
    }
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <Logo>
          <LogoIcon>SMD</LogoIcon>
          <LogoText>
            <CompanyName>SMD TRADING</CompanyName>
            <Tagline>Live Option Analysis</Tagline>
          </LogoText>
        </Logo>

        <NavigationControls>
          {menuItems.map(item => (
            <MenuButton
              key={item.id}
              isActive={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
            >
              <span className="desktop-only">{item.label}</span>
              <span className="mobile-only">{item.shortLabel}</span>
            </MenuButton>
          ))}
        </NavigationControls>
      </LeftSection>

      <RightSection>
        <StatusIndicator status={connectionStatus}>
          {getConnectionStatusText(connectionStatus)}
        </StatusIndicator>

        <MarketStatus status={marketStatus}>
          {getMarketStatusText(marketStatus)}
        </MarketStatus>

        <TimeDisplay>
          {formatTime(currentTime)}
        </TimeDisplay>

        <ScreenModeToggle>
          <ScreenModeButton
            isActive={screenMode === 'desktop'}
            onClick={() => onScreenModeChange('desktop')}
            title="Desktop Mode"
          >
            🖥️
          </ScreenModeButton>
          <ScreenModeButton
            isActive={screenMode === 'tablet'}
            onClick={() => onScreenModeChange('tablet')}
            title="Tablet Mode"
          >
            📱
          </ScreenModeButton>
          <ScreenModeButton
            isActive={screenMode === 'mobile'}
            onClick={() => onScreenModeChange('mobile')}
            title="Mobile Mode"
          >
            📱
          </ScreenModeButton>
        </ScreenModeToggle>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
