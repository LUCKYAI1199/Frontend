import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { OptionData, Symbol, ScreenMode } from '../../types';
import { formatCurrency, formatLargeNumber, formatPercentage } from '../../utils/helpers';

const TableContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const TableHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TableTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;


const TableWrapper = styled.div<{ screenMode: ScreenMode }>`
  overflow-x: auto;
  max-height: ${({ screenMode }) => {
    switch (screenMode) {
      case 'mobile': return '60vh';
      case 'tablet': return '70vh';
      default: return '80vh';
    }
  }};
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.primary};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.secondary};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1200px;
`;

const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.colors.background.tertiary};
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const HeaderCell = styled.th<{ align?: 'left' | 'center' | 'right' }>`
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: ${({ align }) => align || 'center'};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.secondary};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  white-space: nowrap;

  &:last-child {
    border-right: none;
  }
`;

const StrikeHeaderCell = styled(HeaderCell)`
  background: ${({ theme }) => theme.colors.primary};
  color: #000;
  font-weight: 800;
  font-size: 12px;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ isATM?: boolean; highlight?: boolean }>`
  background: ${({ isATM, highlight, theme }) => {
    if (isATM) return '#000080'; // Navy blue background for ATM
    if (highlight) return theme.colors.primary + '10';
    return 'transparent';
  }};
  
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  ${({ isATM, theme }) => isATM && `
    position: sticky;
    top: 30px; /* Position below the header row */
    bottom: 0; /* Also stick to bottom when scrolling up */
    z-index: 10; /* Higher than regular rows but below strike cell */
    border-top: 2px solid #000080;
    border-bottom: 2px solid #000080;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.1);
    color: white; /* White text for better contrast on navy blue background */
  `}
`;

const TableCell = styled.td<{ 
  align?: 'left' | 'center' | 'right';
  color?: string;
  highlight?: boolean;
  isITM?: boolean;
  isOTM?: boolean;
}>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  text-align: ${({ align }) => align || 'center'};
  border-right: 1px solid ${({ theme }) => theme.colors.border.secondary};
  color: ${({ color, theme, isOTM }) => {
    if (isOTM) return '#888888'; // Grey text for OTM
    return color || theme.colors.text.primary;
  }};
  background: ${({ highlight, theme, isITM, isOTM }) => {
    if (highlight) return theme.colors.primary + '15';
    if (isITM) return '#FF8C00'; // Orange background for ITM
    if (isOTM) return '#f5f5f5'; // Light grey background for OTM
    return 'transparent';
  }};
  white-space: nowrap;
  font-weight: ${({ highlight, isITM }) => (highlight || isITM) ? '600' : '400'};

  &:last-child {
    border-right: none;
  }
`;

const StrikeCell = styled(TableCell)<{ isATM?: boolean }>`
  background: ${({ isATM, theme }) => 
    isATM ? '#000080' : theme.colors.background.tertiary}; /* Navy blue for ATM strike */
  color: ${({ isATM }) => isATM ? 'white' : 'inherit'}; /* White text on navy blue */
  font-weight: 700;
  font-size: 14px;
  position: sticky;
  left: 0;
  z-index: ${({ isATM }) => isATM ? '15' : '6'}; /* Higher z-index for ATM strike to stay above other sticky elements */
  border-right: 2px solid ${({ theme }) => theme.colors.border.primary};
  box-shadow: ${({ isATM }) => isATM ? '2px 0 4px rgba(0, 0, 0, 0.1)' : 'none'}; /* Add shadow for ATM strike visibility */
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

interface OptionTableProps {
  data: OptionData[];
  spotPrice: number;
  atmStrike: number;
  symbol: Symbol;
  screenMode?: ScreenMode;
}

const OptionTable: React.FC<OptionTableProps> = ({
  data,
  spotPrice,
  atmStrike,
  symbol,
  screenMode = 'desktop',
}) => {
  const [hasScrolledToATM, setHasScrolledToATM] = useState(false);

  const isATMStrike = (strike: number) => strike === atmStrike;

  // Sort data by strike price
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => a.strike_price - b.strike_price);
  }, [data]);

  // Auto-scroll to ATM strike within table container only - ONLY on initial load
  useEffect(() => {
    if (atmStrike && sortedData.length > 0 && !hasScrolledToATM) {
      setTimeout(() => {
        const tableWrapper = document.querySelector('[data-table-wrapper="option-table"]') as HTMLElement;
        const atmElement = document.querySelector(`[data-strike="${atmStrike}"]`) as HTMLElement;
        
        if (atmElement && tableWrapper) {
          // Calculate the position to scroll to center the ATM strike within the table
          const scrollTop = atmElement.offsetTop - (tableWrapper.clientHeight / 2) + (atmElement.clientHeight / 2);
          
          // Smooth scroll within the table wrapper only
          tableWrapper.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
          
          // Mark as scrolled so it won't auto-scroll again
          setHasScrolledToATM(true);
        }
      }, 100); // Reduced timeout for faster response
    }
  }, [atmStrike, sortedData, hasScrolledToATM]);

  const isITM = (strike: number, type: 'CE' | 'PE') => {
    if (type === 'CE') return strike < spotPrice;
    return strike > spotPrice;
  };

  const isHighOI = (oi: number) => oi > 100000;
  const isHighVolume = (volume: number) => volume > 10000;

  if (!data || data.length === 0) {
    return (
      <TableContainer>
        <TableHeader>
          <TableTitle>Option Chain</TableTitle>
        </TableHeader>
        <EmptyState>
          No option chain data available
        </EmptyState>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>Option Chain - {symbol}</TableTitle>
      </TableHeader>

      <TableWrapper screenMode={screenMode} data-table-wrapper="option-table">
        <Table>
          <TableHead>
            <HeaderRow>
              {/* Call Side Headers */}
              <HeaderCell align="right">CE OI</HeaderCell>
              <HeaderCell align="right">CE Volume</HeaderCell>
              <HeaderCell align="right">CE Bid Qty</HeaderCell>
              <HeaderCell align="right">CE Ask Qty</HeaderCell>
              <HeaderCell align="right">CE IV</HeaderCell>
              <HeaderCell align="right">CE LTP</HeaderCell>
              <HeaderCell align="right">CE Bid</HeaderCell>
              <HeaderCell align="right">CE Ask</HeaderCell>
              
              {/* Strike Price */}
              <StrikeHeaderCell>Strike</StrikeHeaderCell>
              
              {/* Put Side Headers */}
              <HeaderCell align="left">PE Bid</HeaderCell>
              <HeaderCell align="left">PE Ask</HeaderCell>
              <HeaderCell align="left">PE LTP</HeaderCell>
              <HeaderCell align="left">PE IV</HeaderCell>
              <HeaderCell align="left">PE Ask Qty</HeaderCell>
              <HeaderCell align="left">PE Bid Qty</HeaderCell>
              <HeaderCell align="left">PE Volume</HeaderCell>
              <HeaderCell align="left">PE OI</HeaderCell>
            </HeaderRow>
          </TableHead>
          
          <TableBody>
            {sortedData.map((row) => (
              <TableRow
                key={row.strike_price}
                isATM={isATMStrike(row.strike_price)}
                data-strike={row.strike_price}
              >
                {/* Call Side */}
                <TableCell 
                  align="right" 
                  highlight={isHighOI(row.ce_oi || 0)}
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_oi === 'number' ? formatLargeNumber(row.ce_oi) : '-'}
                </TableCell>
                <TableCell 
                  align="right" 
                  highlight={isHighVolume(row.ce_volume || 0)}
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_volume === 'number' ? formatLargeNumber(row.ce_volume) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_bid_qty === 'number' ? formatLargeNumber(row.ce_bid_qty) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_ask_qty === 'number' ? formatLargeNumber(row.ce_ask_qty) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_iv === 'number' ? formatPercentage(row.ce_iv) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_ltp === 'number' ? formatCurrency(row.ce_ltp) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_bid === 'number' ? formatCurrency(row.ce_bid) : '-'}
                </TableCell>
                <TableCell 
                  align="right"
                  isITM={isITM(row.strike_price, 'CE')}
                  isOTM={!isITM(row.strike_price, 'CE')}
                >
                  {typeof row.ce_ask === 'number' ? formatCurrency(row.ce_ask) : '-'}
                </TableCell>

                {/* Strike Price */}
                <StrikeCell isATM={isATMStrike(row.strike_price)}>
                  {formatCurrency(row.strike_price, 0)}
                </StrikeCell>

                {/* Put Side */}
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_bid === 'number' ? formatCurrency(row.pe_bid) : '-'}
                </TableCell>
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_ask === 'number' ? formatCurrency(row.pe_ask) : '-'}
                </TableCell>
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_ltp === 'number' ? formatCurrency(row.pe_ltp) : '-'}
                </TableCell>
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_iv === 'number' ? formatPercentage(row.pe_iv) : '-'}
                </TableCell>
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_ask_qty === 'number' ? formatLargeNumber(row.pe_ask_qty) : '-'}
                </TableCell>
                <TableCell 
                  align="left"
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_bid_qty === 'number' ? formatLargeNumber(row.pe_bid_qty) : '-'}
                </TableCell>
                <TableCell 
                  align="left" 
                  highlight={isHighVolume(row.pe_volume || 0)}
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_volume === 'number' ? formatLargeNumber(row.pe_volume) : '-'}
                </TableCell>
                <TableCell 
                  align="left" 
                  highlight={isHighOI(row.pe_oi || 0)}
                  isITM={isITM(row.strike_price, 'PE')}
                  isOTM={!isITM(row.strike_price, 'PE')}
                >
                  {typeof row.pe_oi === 'number' ? formatLargeNumber(row.pe_oi) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};

export default OptionTable;
