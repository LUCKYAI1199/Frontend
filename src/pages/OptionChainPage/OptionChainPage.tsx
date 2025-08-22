import React, { useState } from 'react';
import { ApiService } from '../../services/ApiService';
import { Symbol, MarketType } from '../../types';
import { useOptionChain } from '../../hooks/useOptionChain';
import { formatTime } from '../../utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FontAwesomeIcon, faChartLine, faRefresh, faClock, faPlay, faPause } from '../../utils/fontawesome';
import MarketSelector from '../../components/MarketSelector/MarketSelector';
import OptionTable from '../../components/OptionTable/OptionTable';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';

interface OptionChainPageProps {}

const OptionChainPage: React.FC<OptionChainPageProps> = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('NSE & BSE');
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  const {
    data: optionChainData,
    loading,
    error,
    lastUpdate,
    refresh,
  } = useOptionChain({
    symbol: selectedSymbol,
    expiry: selectedExpiry,
    autoRefresh: autoRefreshEnabled,
    refreshInterval: 1000,
  });

  const handleMarketChange = (market: MarketType) => {
    setSelectedMarket(market);
  };

  const handleSymbolChange = (symbol: Symbol) => {
    setSelectedSymbol(symbol);
    setSelectedExpiry(''); // Reset expiry when symbol changes
  };

  const handleExpiryChange = (expiry: string) => {
    setSelectedExpiry(expiry);
  };

  const handleManualRefresh = () => {
    refresh();
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  if (!optionChainData && loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-primary" />
              Live Option Chain - Kite API
            </CardTitle>
            <CardDescription className="text-lg">
              Real-time option chain data with advanced analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-12">
            <LoadingSpinner message="Loading option chain data..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !optionChainData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-primary" />
              Live Option Chain - Kite API
            </CardTitle>
            <CardDescription className="text-lg">
              Real-time option chain data with advanced analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorMessage 
              message={typeof error === 'string' ? error : ApiService.handleApiError(error)} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-primary" />
            Live Option Chain - Kite API
          </CardTitle>
          <CardDescription className="text-lg">
            Real-time option chain data with advanced analytics
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <MarketSelector
              selectedMarket={selectedMarket}
              selectedSymbol={selectedSymbol}
              selectedExpiry={selectedExpiry}
              onMarketChange={handleMarketChange}
              onSymbolChange={handleSymbolChange}
              onExpiryChange={handleExpiryChange}
            />
            
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                  Last updated: {formatTime(lastUpdate)}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleManualRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faRefresh} className="h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={handleAutoRefreshToggle} 
                  variant={autoRefreshEnabled ? "default" : "outline"} 
                  size="sm"
                >
                  <FontAwesomeIcon 
                    icon={autoRefreshEnabled ? faPause : faPlay} 
                    className="h-4 w-4" 
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="space-y-6">
        {selectedMarket === 'MCX' ? (
          /* MCX Commodity Display */
          <>
            <Card>
              <CardHeader>
                <CardTitle>MCX Commodity Information</CardTitle>
                <CardDescription>
                  MCX commodities trade as futures and may have options. Live data shown below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold mb-2">
                    {selectedSymbol} - Live Option Chain
                  </div>
                  <div className="text-muted-foreground">
                    Real-time MCX commodity option chain data from Kite API
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Show Option Chain for MCX if data is available */}
            {optionChainData && optionChainData.option_chain && optionChainData.option_chain.length > 0 ? (
              <OptionTable
                data={optionChainData.option_chain}
                spotPrice={optionChainData.spot_price}
                atmStrike={optionChainData.atm_strike}
                symbol={selectedSymbol}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-lg text-muted-foreground">
                    {loading ? 'Loading MCX option chain data...' : 
                     error ? `Error loading data: ${error}` :
                     'No option chain data available for this MCX commodity'}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Traditional Option Chain for NSE/BSE */
          optionChainData && (
            <>
              {/* Option Table */}
              <OptionTable
                data={optionChainData.option_chain}
                spotPrice={optionChainData.spot_price}
                atmStrike={optionChainData.atm_strike}
                symbol={selectedSymbol}
              />
            </>
          )
        )}
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="text-center py-4">
          <div className="text-sm font-semibold">SMD TRADING PLATFORM - LIVE OPTION CHAIN ANALYSIS</div>
          {lastUpdate && (
            <div className="text-xs text-muted-foreground mt-2">
              Last updated: {formatTime(lastUpdate)} • Data refreshes every 1 second
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OptionChainPage;
