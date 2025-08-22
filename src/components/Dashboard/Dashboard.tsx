import React from 'react';
import styled from 'styled-components';
import { Symbol, ScreenMode } from '../../types';
import { formatLargeNumber, formatCurrency } from '../../utils/helpers';

const DashboardContainer = styled.div<{ screenMode: ScreenMode }>`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: grid;
  grid-template-columns: ${({ screenMode }) => {
    switch (screenMode) {
      case 'mobile': return '1fr';
      case 'tablet': return 'repeat(2, 1fr)';
      default: return 'repeat(4, 1fr)';
    }
  }};
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const MetricCard = styled.div<{ highlight?: boolean; trend?: 'up' | 'down' | 'neutral' }>`
  background: ${({ theme, highlight }) => 
    highlight ? theme.colors.primary + '10' : theme.colors.background.tertiary};
  border: 1px solid ${({ theme, highlight, trend }) => {
    if (highlight) return theme.colors.primary;
    if (trend === 'up') return theme.colors.success;
    if (trend === 'down') return theme.colors.error;
    return theme.colors.border.secondary;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme, trend, highlight }) => {
      if (highlight) return theme.colors.primary;
      if (trend === 'up') return theme.colors.success;
      if (trend === 'down') return theme.colors.error;
      return 'transparent';
    }};
  }
`;

const MetricLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const MetricValue = styled.div<{ color?: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${({ color, theme }) => color || theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 16px;
  }
`;

const MetricSubtext = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  opacity: 0.8;
`;

const SectionTitle = styled.h3`
  grid-column: 1 / -1;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.sm} 0;
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const PCRBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 4px;
  margin-top: ${({ theme }) => theme.spacing.xs};
  overflow: hidden;
`;

const PCRFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${({ percentage }) => Math.min(percentage, 100)}%;
  background: ${({ percentage, theme }) => {
    if (percentage < 30) return theme.colors.error;
    if (percentage > 70) return theme.colors.success;
    return theme.colors.warning;
  }};
  transition: width 0.3s ease;
`;

interface DashboardData {
  totalCEOI: number;
  totalPEOI: number;
  pcr: number;
  atmStrike: number;
  totalCEVolume: number;
  totalPEVolume: number;
  maxPain: number;
  maxGain: number;
  highRallyStrike: string;
  highBearDipStrike: string;
  dailySupport: number;
  weeklySupport: number;
  dailyResistance: number;
  weeklyResistance: number;
}

interface DashboardProps {
  data: DashboardData;
  spotPrice: number;
  symbol: Symbol;
  screenMode?: ScreenMode;
}

const Dashboard: React.FC<DashboardProps> = ({
  data,
  spotPrice,
  symbol,
  screenMode = 'desktop',
}) => {
  const {
    totalCEOI,
    totalPEOI,
    pcr,
    atmStrike,
    totalCEVolume,
    totalPEVolume,
    maxPain,
    maxGain,
    highRallyStrike,
    highBearDipStrike,
    dailySupport,
    weeklySupport,
    dailyResistance,
    weeklyResistance,
  } = data;

  // Calculate trends
  const getTrendFromPCR = (pcrValue: number): 'up' | 'down' | 'neutral' => {
    if (pcrValue < 0.8) return 'down'; // Bearish
    if (pcrValue > 1.2) return 'up'; // Bullish
    return 'neutral';
  };

  const getVolumeRatio = () => {
    const total = totalCEVolume + totalPEVolume;
    return total > 0 ? (totalPEVolume / total) * 100 : 50;
  };

  const getPCRColor = (pcrValue: number) => {
    if (pcrValue < 0.8) return '#ef4444'; // Red - Bearish
    if (pcrValue > 1.2) return '#22c55e'; // Green - Bullish
    return '#f59e0b'; // Yellow - Neutral
  };

  const isNearATM = (strike: number) => {
    return Math.abs(strike - atmStrike) <= 100;
  };

  return (
    <DashboardContainer screenMode={screenMode}>
      <SectionTitle>Market Overview - {symbol}</SectionTitle>

      {/* Open Interest Metrics */}
      <MetricCard trend={totalPEOI > totalCEOI ? 'up' : 'down'}>
        <MetricLabel>Total CE OI</MetricLabel>
        <MetricValue>{formatLargeNumber(totalCEOI)}</MetricValue>
        <MetricSubtext>Call Open Interest</MetricSubtext>
      </MetricCard>

      <MetricCard trend={totalPEOI > totalCEOI ? 'down' : 'up'}>
        <MetricLabel>Total PE OI</MetricLabel>
        <MetricValue>{formatLargeNumber(totalPEOI)}</MetricValue>
        <MetricSubtext>Put Open Interest</MetricSubtext>
      </MetricCard>

      <MetricCard highlight trend={getTrendFromPCR(pcr)}>
        <MetricLabel>PCR (OI)</MetricLabel>
        <MetricValue color={getPCRColor(pcr)}>
          {pcr.toFixed(3)}
        </MetricValue>
        <PCRBar>
          <PCRFill percentage={(pcr / 2) * 100} />
        </PCRBar>
        <MetricSubtext>Put/Call Ratio</MetricSubtext>
      </MetricCard>

      <MetricCard highlight={isNearATM(spotPrice)}>
        <MetricLabel>ATM Strike</MetricLabel>
        <MetricValue>{formatCurrency(atmStrike, 0)}</MetricValue>
        <MetricSubtext>
          Spot: {formatCurrency(spotPrice, 2)}
        </MetricSubtext>
      </MetricCard>

      {/* Volume Metrics */}
      <MetricCard>
        <MetricLabel>CE Volume</MetricLabel>
        <MetricValue>{formatLargeNumber(totalCEVolume)}</MetricValue>
        <MetricSubtext>Call Trading Volume</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>PE Volume</MetricLabel>
        <MetricValue>{formatLargeNumber(totalPEVolume)}</MetricValue>
        <MetricSubtext>Put Trading Volume</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>Volume Ratio</MetricLabel>
        <MetricValue>{getVolumeRatio().toFixed(1)}%</MetricValue>
        <MetricSubtext>PE Volume %</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>Total Volume</MetricLabel>
        <MetricValue>{formatLargeNumber(totalCEVolume + totalPEVolume)}</MetricValue>
        <MetricSubtext>Combined Volume</MetricSubtext>
      </MetricCard>

      <SectionTitle>Key Levels & Analysis</SectionTitle>

      {/* Pain/Gain Analysis */}
      <MetricCard highlight>
        <MetricLabel>Max Pain</MetricLabel>
        <MetricValue>{formatCurrency(maxPain, 0)}</MetricValue>
        <MetricSubtext>Options Pain Point</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>Max Gain</MetricLabel>
        <MetricValue>{formatCurrency(maxGain, 0)}</MetricValue>
        <MetricSubtext>Options Gain Point</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>Rally Strikes</MetricLabel>
        <MetricValue style={{ fontSize: '14px' }}>
          {highRallyStrike}
        </MetricValue>
        <MetricSubtext>High Rally Potential</MetricSubtext>
      </MetricCard>

      <MetricCard>
        <MetricLabel>Bear Dip Strikes</MetricLabel>
        <MetricValue style={{ fontSize: '14px' }}>
          {highBearDipStrike}
        </MetricValue>
        <MetricSubtext>High Bear Potential</MetricSubtext>
      </MetricCard>

      {/* Support & Resistance */}
      <MetricCard trend="up">
        <MetricLabel>Daily Support</MetricLabel>
        <MetricValue color="#22c55e">{formatCurrency(dailySupport, 0)}</MetricValue>
        <MetricSubtext>Immediate Support</MetricSubtext>
      </MetricCard>

      <MetricCard trend="up">
        <MetricLabel>Weekly Support</MetricLabel>
        <MetricValue color="#22c55e">{formatCurrency(weeklySupport, 0)}</MetricValue>
        <MetricSubtext>Strong Support</MetricSubtext>
      </MetricCard>

      <MetricCard trend="down">
        <MetricLabel>Daily Resistance</MetricLabel>
        <MetricValue color="#ef4444">{formatCurrency(dailyResistance, 0)}</MetricValue>
        <MetricSubtext>Immediate Resistance</MetricSubtext>
      </MetricCard>

      <MetricCard trend="down">
        <MetricLabel>Weekly Resistance</MetricLabel>
        <MetricValue color="#ef4444">{formatCurrency(weeklyResistance, 0)}</MetricValue>
        <MetricSubtext>Strong Resistance</MetricSubtext>
      </MetricCard>
    </DashboardContainer>
  );
};

export default Dashboard;
