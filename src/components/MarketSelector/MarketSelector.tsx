import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Symbol, MarketType, CommoditySymbol, IndexSymbol, ScreenMode } from '../../types';
import { ApiService } from '../../services/ApiService';
import styles from './MarketSelector.module.css';

const SelectorContainer = styled.div<{ screenMode: ScreenMode }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  flex-wrap: ${({ screenMode }) => screenMode === 'mobile' ? 'wrap' : 'nowrap'};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 150px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SpotPriceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  min-width: 120px;
`;

const SpotLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SpotValue = styled.span<{ change?: number }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ change, theme }) => {
    if (change === undefined) return theme.colors.text.primary;
    return change >= 0 ? theme.colors.success : theme.colors.error;
  }};
`;

const ChangeValue = styled.span<{ change: number }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ change, theme }) => 
    change >= 0 ? theme.colors.success : theme.colors.error};
`;

const ChangeRow = styled.div`
  display: flex;
  gap: 8px;
`;

const HiddenDescription = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

interface MarketSelectorProps {
  selectedMarket: MarketType;
  selectedSymbol: Symbol;
  selectedExpiry: string;
  onMarketChange: (market: MarketType) => void;
  onSymbolChange: (symbol: Symbol) => void;
  onExpiryChange: (expiry: string) => void;
  screenMode?: ScreenMode;
}

const INDICES: IndexSymbol[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'];
const COMMODITIES: CommoditySymbol[] = ['COPPER', 'CRUDEOIL', 'CRUDEOILM', 'GOLD', 'GOLDM', 'NATGASMINI', 'NATURALGAS', 'SILVER', 'SILVERM', 'ZINC'];

const MarketSelector: React.FC<MarketSelectorProps> = ({
  selectedMarket,
  selectedSymbol,
  selectedExpiry,
  onMarketChange,
  onSymbolChange,
  onExpiryChange,
  screenMode = 'desktop',
}) => {
  const [expiries, setExpiries] = useState<string[]>([]);
  const [stocks, setStocks] = useState<string[]>([]);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // Use refs to avoid dependency issues
  const onExpiryChangeRef = useRef(onExpiryChange);
  const selectedExpiryRef = useRef(selectedExpiry);

  // Update refs when props change
  useEffect(() => {
    onExpiryChangeRef.current = onExpiryChange;
  }, [onExpiryChange]);

  useEffect(() => {
    selectedExpiryRef.current = selectedExpiry;
  }, [selectedExpiry]);

  // Fetch stocks on component mount (only for NSE & BSE market)
  useEffect(() => {
    if (selectedMarket === 'NSE & BSE') {
      const fetchStocks = async () => {
        try {
          setLoadingStocks(true);
          const response = await ApiService.getAllStocks();
          if (response.success && response.data) {
            setStocks(response.data);
          } else {
            console.error('Failed to fetch stocks:', response.error);
            setStocks([]);
          }
        } catch (error) {
          console.error('Error fetching stocks:', error);
          setStocks([]);
        } finally {
          setLoadingStocks(false);
        }
      };

      fetchStocks();
    } else {
      setStocks([]);
    }
  }, [selectedMarket]);

  // Fetch current spot price
  const fetchSpotPrice = useCallback(async () => {
    try {
      console.log(`Fetching spot price for ${selectedSymbol}...`);
      const response = await ApiService.getSpotPrice(selectedSymbol);
      console.log(`Spot price response for ${selectedSymbol}:`, response);
      if (response.success && response.data) {
        const { price, change } = response.data;
        setSpotPrice(price);
        setPriceChange(change);
        console.log(`Updated spot price: ${price}, change: ${change}`);
      } else {
        console.error('Spot price fetch failed:', response.error);
        setSpotPrice(0);
        setPriceChange(0);
      }
    } catch (error) {
      console.error('Error fetching spot price:', error);
      setSpotPrice(0);
      setPriceChange(0);
    }
  }, [selectedSymbol]);

  // Fetch expiries when symbol changes
  useEffect(() => {
    const fetchExpiries = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getExpiries(selectedSymbol);
        if (response.success && response.data) {
          setExpiries(response.data);
          // Auto-select first expiry if none selected and no expiry is currently set
          if (!selectedExpiryRef.current && response.data.length > 0) {
            onExpiryChangeRef.current(response.data[0]);
          }
        } else {
          console.error('Failed to fetch expiries:', response.error);
          setExpiries([]);
          // For MCX commodities, it's normal to not have expiries
          if (selectedMarket === 'MCX') {
            console.info('MCX commodities typically do not have traditional option expiries');
          }
        }
      } catch (error) {
        console.error('Error fetching expiries:', error);
        setExpiries([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSymbol) {
      fetchExpiries();
      fetchSpotPrice();
    }
  }, [selectedSymbol, fetchSpotPrice, selectedMarket]);

  // Update spot price periodically (updated to 1 second for real-time updates)
  useEffect(() => {
    const interval = setInterval(fetchSpotPrice, 1000);
    return () => clearInterval(interval);
  }, [fetchSpotPrice]);

  const handleMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMarket = event.target.value as MarketType;
    onMarketChange(newMarket);
    
    // Reset symbol and expiry when market changes
    if (newMarket === 'MCX') {
      // Default to first commodity for MCX
      onSymbolChange(COMMODITIES[0]);
    } else {
      // Default to first index for NSE & BSE
      onSymbolChange(INDICES[0]);
    }
    onExpiryChange('');
  };

  const handleSymbolChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSymbol = event.target.value as Symbol;
    if (newSymbol) {
      onSymbolChange(newSymbol);
      onExpiryChange(''); // Reset expiry when symbol changes
      
      // Clear the other dropdown to ensure only one selection at a time (for NSE & BSE only)
      if (selectedMarket === 'NSE & BSE') {
        const otherDropdown = event.target.name === 'index' ? 'stock-select' : 'index-select';
        const otherElement = document.getElementById(otherDropdown) as HTMLSelectElement;
        if (otherElement) {
          otherElement.value = '';
        }
      }
    }
  };

  const handleExpiryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onExpiryChange(event.target.value);
  };

  const formatSpotPrice = (price: number) => {
    return price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatPercentageChange = (change: number, spot: number) => {
    const percentage = (change / spot) * 100;
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  return (
    <SelectorContainer screenMode={screenMode}>
      {/* Market Selector */}
      <SelectGroup>
        <Label htmlFor="market-select" id="market-select-label">Market</Label>
        <HiddenDescription id="market-select-description">Choose between NSE & BSE or MCX market</HiddenDescription>
        <select
          id="market-select"
          value={selectedMarket}
          onChange={handleMarketChange}
          role="combobox"
          aria-label="Select a market"
          aria-labelledby="market-select-label"
          title="Select a market from the available options"
          aria-describedby="market-select-description"
          aria-expanded="false"
          aria-haspopup="listbox"
          className={styles.select}
        >
          <option value="NSE & BSE">NSE & BSE</option>
          <option value="MCX">MCX</option>
        </select>
      </SelectGroup>

      {/* Conditional rendering based on market type */}
      {selectedMarket === 'NSE & BSE' ? (
        <>
          {/* Index Selector */}
          <SelectGroup>
            <Label htmlFor="index-select" id="index-select-label">Index</Label>
            <HiddenDescription id="index-select-description">Choose an index from the available options</HiddenDescription>
            <select
              id="index-select"
              value={INDICES.includes(selectedSymbol as IndexSymbol) ? selectedSymbol : ''}
              onChange={(e) => handleSymbolChange(e)}
              name="index"
              role="combobox"
              aria-label="Select an index"
              aria-labelledby="index-select-label"
              title="Select an index from the available options"
              aria-describedby="index-select-description"
              aria-expanded="false"
              aria-haspopup="listbox"
              className={styles.select}
            >
              <option value="">Select Index</option>
              {INDICES.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </SelectGroup>

          {/* Stock Selector */}
          <SelectGroup>
            <Label htmlFor="stock-select" id="stock-select-label">Stock</Label>
            <HiddenDescription id="stock-select-description">Choose a stock from the available options</HiddenDescription>
            <select
              id="stock-select"
              value={stocks.includes(selectedSymbol) ? selectedSymbol : ''}
              onChange={(e) => handleSymbolChange(e)}
              disabled={loadingStocks || stocks.length === 0}
              name="stock"
              role="combobox"
              aria-label="Select a stock"
              aria-labelledby="stock-select-label"
              title="Select a stock from the available options"
              aria-describedby="stock-select-description"
              aria-expanded="false"
              aria-haspopup="listbox"
              className={styles.select}
            >
              {loadingStocks ? (
                <option value="">Loading stocks...</option>
              ) : stocks.length === 0 ? (
                <option value="">No stocks available</option>
              ) : (
                <>
                  <option value="">Select Stock</option>
                  {stocks.map(stock => (
                    <option key={stock} value={stock}>
                      {stock}
                    </option>
                  ))}
                </>
              )}
            </select>
          </SelectGroup>
        </>
      ) : (
        /* MCX Commodity Selector */
        <SelectGroup>
          <Label htmlFor="commodity-select" id="commodity-select-label">Commodity</Label>
          <HiddenDescription id="commodity-select-description">Choose a commodity from the available options</HiddenDescription>
          <select
            id="commodity-select"
            value={COMMODITIES.includes(selectedSymbol as CommoditySymbol) ? selectedSymbol : ''}
            onChange={(e) => handleSymbolChange(e)}
            name="commodity"
            role="combobox"
            aria-label="Select a commodity"
            aria-labelledby="commodity-select-label"
            title="Select a commodity from the available options"
            aria-describedby="commodity-select-description"
            aria-expanded="false"
            aria-haspopup="listbox"
            className={styles.select}
          >
            <option value="">Select Commodity</option>
            {COMMODITIES.map(commodity => (
              <option key={commodity} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        </SelectGroup>
      )}

      {/* Expiry Selector */}
      <SelectGroup>
        <Label htmlFor="expiry-select" id="expiry-select-label">Expiry</Label>
        <HiddenDescription id="expiry-select-description">Choose an expiry date for the selected symbol</HiddenDescription>
        <select 
          id="expiry-select"
          value={selectedExpiry} 
          onChange={handleExpiryChange}
          disabled={loading || expiries.length === 0}
          name="expiry"
          role="combobox"
          aria-label="Select an expiry date"
          aria-labelledby="expiry-select-label"
          title="Select an expiry date for the selected symbol"
          aria-describedby="expiry-select-description"
          aria-expanded="false"
          aria-haspopup="listbox"
          aria-required="true"
          className={styles.select}
        >
          {expiries.length === 0 ? (
            <option value="">{selectedMarket === 'MCX' ? 'MCX commodities - Futures only' : 'No expiries available'}</option>
          ) : (
            <>
              <option value="">Select Expiry</option>
              {expiries.map(expiry => (
                <option key={expiry} value={expiry}>
                  {new Date(expiry).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </option>
              ))}
            </>
          )}
        </select>
      </SelectGroup>

      {/* Spot Price Display */}
      {spotPrice !== null && (
        <SpotPriceDisplay>
          <SpotLabel>{selectedMarket === 'MCX' ? 'Commodity Price' : 'Spot Price'}</SpotLabel>
          <SpotValue change={priceChange ?? undefined}>
            {formatSpotPrice(spotPrice)}
          </SpotValue>
          {priceChange !== null && (
            <ChangeRow>
              <ChangeValue change={priceChange}>
                {formatPriceChange(priceChange)}
              </ChangeValue>
              <ChangeValue change={priceChange}>
                ({formatPercentageChange(priceChange, spotPrice)})
              </ChangeValue>
            </ChangeRow>
          )}
        </SpotPriceDisplay>
      )}
    </SelectorContainer>
  );
};

export default MarketSelector;
