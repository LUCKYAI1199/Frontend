import React from 'react';
import styled from 'styled-components';
import { ScreenMode } from '../../types';

const SidebarContainer = styled.aside<{ isOpen: boolean; screenMode: ScreenMode }>`
  background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
  border-right: 1px solid #444;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  
  ${({ isOpen, screenMode }) => {
    if (screenMode === 'mobile') {
      return `
        width: ${isOpen ? '250px' : '0'};
        transform: translateX(${isOpen ? '0' : '-100%'});
      `;
    }
    return `
      width: ${isOpen ? '280px' : '60px'};
      transform: translateX(0);
    `;
  }}
  
  overflow: hidden;
`;

const SidebarHeader = styled.div<{ isOpen: boolean }>`
  padding: 20px;
  border-bottom: 1px solid #444;
  text-align: center;
  transition: opacity 0.3s ease;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
`;

const Logo = styled.h1`
  color: #fff200;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 242, 0, 0.3);
`;

const Tagline = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  margin: 5px 0 0 0;
  opacity: 0.8;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 20px;
  right: 8px; /* keep inside the sidebar to avoid clipping */
  background: #fff200;
  color: #000;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  z-index: 1001;
  border: 1px solid rgba(0,0,0,0.2); /* subtle edge so it stands out on light bg */

  &:hover {
    background: #ffed4e;
    transform: scale(1.1);
  }
`;

const NavigationList = styled.ul`
  list-style: none;
  padding: 20px 0;
  margin: 0;
`;

const NavigationItem = styled.li<{ isActive: boolean; isOpen: boolean }>`
  margin: 2px 0;
`;

const NavigationLink = styled.button<{ isActive: boolean; isOpen: boolean }>`
  width: 100%;
  background: ${({ isActive }) => (isActive ? '#fff200' : 'transparent')};
  color: ${({ isActive }) => (isActive ? '#000' : '#e0e0e0')};
  border: none;
  padding: ${({ isOpen }) => (isOpen ? '15px 20px' : '15px 5px')};
  text-align: ${({ isOpen }) => (isOpen ? 'left' : 'center')};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.95rem;
  font-weight: ${({ isActive }) => (isActive ? 'bold' : 'normal')};
  position: relative;

  &:hover {
    background: ${({ isActive }) => (isActive ? '#fff200' : 'rgba(255, 242, 0, 0.1)')};
    color: ${({ isActive }) => (isActive ? '#000' : '#fff200')};
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #fff200;
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
    transition: opacity 0.3s ease;
  }
`;

const IconWrapper = styled.span`
  font-size: 1.2rem;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LinkText = styled.span<{ isOpen: boolean }>`
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;
  white-space: nowrap;
`;

const StatusSection = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 20px;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  font-size: 0.85rem;
  color: #aaa;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'offline' | 'connecting' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status }) => {
    switch (status) {
      case 'online': return '#4ade80';
      case 'offline': return '#ef4444';
      case 'connecting': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
  animation: ${({ status }) => 
    status === 'connecting' ? 'pulse 2s infinite' : 'none'};
`;

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  onPageChange: (page: string) => void;
  onToggle: () => void;
  screenMode: ScreenMode;
}

const navigationItems = [
  {
    id: 'option-chain',
    label: 'Option Chain',
    icon: '📊',
    description: 'Live option chain data'
  },
  {
    id: 'custom-analysis',
    label: 'Custom Analysis',
    icon: '🔍',
    description: 'Custom option analysis'
  },
  {
    id: 'signal',
    label: 'Signals',
    icon: '🚨',
  description: 'Additional Sharp Pro signals'
  },
  {
    id: 'earth-logic',
    label: 'Earth Logic',
    icon: '🌍',
    description: 'Earth logic analysis'
  },
  {
    id: 'sharpe-logic',
    label: 'SHARPE Logic',
    icon: '📈',
    description: 'SHARPE ratio analysis'
  },
  {
    id: 'additional-sharp-pro',
    label: 'Additional SHARP PRO',
    icon: '🧠',
    description: 'Prev-day ATM based SMD matrix'
  },
  {
    id: 'smd-liq-hlc-z2h-btst',
    label: 'SMD LIQ + HLC + Z2H + BTST',
    icon: '🎯',
    description: 'SMD liquidity with HLC Z2H BTST analysis'
  },
  {
    id: 'ohlc-data',
    label: 'OHLC Data',
    icon: '📉',
    description: 'OHLC data analysis'
  },
  {
    id: 'advanced-analysis',
    label: 'Advanced Analysis',
    icon: '⚡',
    description: 'Advanced analytics'
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  currentPage,
  onPageChange,
  onToggle,
  screenMode,
}) => {
  return (
    <SidebarContainer isOpen={isOpen} screenMode={screenMode}>
      <ToggleButton onClick={onToggle}>
        {isOpen ? '‹' : '›'}
      </ToggleButton>

      <SidebarHeader isOpen={isOpen}>
        <Logo>SMD</Logo>
        <Tagline>Trading Platform</Tagline>
      </SidebarHeader>

      <NavigationList>
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.id}
            isActive={currentPage === item.id}
            isOpen={isOpen}
          >
            <NavigationLink
              isActive={currentPage === item.id}
              isOpen={isOpen}
              onClick={() => onPageChange(item.id)}
              title={!isOpen ? item.label : undefined}
            >
              <IconWrapper>{item.icon}</IconWrapper>
              <LinkText isOpen={isOpen}>{item.label}</LinkText>
            </NavigationLink>
          </NavigationItem>
        ))}
      </NavigationList>

      <StatusSection isOpen={isOpen}>
        <StatusItem>
          <StatusIndicator status="online" />
          <span>Live Data</span>
        </StatusItem>
        <StatusItem>
          <StatusIndicator status="online" />
          <span>Market Open</span>
        </StatusItem>
      </StatusSection>
    </SidebarContainer>
  );
};

export default Sidebar;
