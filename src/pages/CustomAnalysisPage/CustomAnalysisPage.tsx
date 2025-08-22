import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Symbol, MarketType, DashboardData, AlertSignal } from '../../types';
import { useOptionChain } from '../../hooks/useOptionChain';
import { formatTime } from '../../utils/helpers';
import { FontAwesomeIcon, faRefresh, faPlay, faPause, faClock } from '../../utils/fontawesome';
import { Button } from '../../components/ui/button';
import Dashboard from '../../components/Dashboard/Dashboard';
import CustomOptionTable from '../../components/CustomOptionTable/CustomOptionTable';
import { ApiService } from '../../services/ApiService';
import MarketSelector from '../../components/MarketSelector/MarketSelector';

const PageContainer = styled.div`
  padding: 20px;
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
`;

const TitleSection = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SelectorSection = styled.div`
  margin-top: 16px;
`;

// Live signal UI components removed per requirement
const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const LastUpdateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #ccc;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

// Removed unused styled component


// Removed unused styled component

const DashboardSection = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 12px;
  padding: 20px;
`;

const TableSection = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 12px;
  padding: 20px;
`;

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 1.1rem;
  text-align: center;
`;

const MCXAnalysisHeader = styled.div`
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
`;

const MCXAnalysisTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #fff200;
`;

const MCXAnalysisSubtitle = styled.p`
  color: #ccc;
  margin-bottom: 20px;
`;

const MCXAnalysisCard = styled.div`
  background-color: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #444;
`;

const MCXAnalysisCardTitle = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff200;
`;

const MCXAnalysisCardDescription = styled.div`
  opacity: 0.8;
  line-height: 1.5;
  color: #ccc;
`;

const NoDataContainer = styled.div`
  padding: 40px;
  text-align: center;
  background-color: #2d2d2d;
  border-radius: 8px;
`;

const NoDataText = styled.div`
  color: #ccc;
  font-size: 1.1rem;
`;

const CustomAnalysisPage: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('NSE & BSE');
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const consolidatedRef = useRef(false); // run duplicate consolidation once
  // Always-tracked symbols (indices + key commodities) – ensure uppercase to match backend expectations
  const coreSymbolsRef = useRef<Symbol[]>([
    'NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX',
    'COPPER','CRUDEOIL','CRUDEOILM','GOLD','GOLDM','SILVER','SILVERM','NATURALGAS','NATGASMINI'
  ]);

  // Load persisted signals (including triggered times) once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('alert_signals_v1');
      if (raw) {
        const parsed: AlertSignal[] = JSON.parse(raw, (key, value) => {
          if (['createdAt','targetHitTime','hitTime','triggeredTime'].includes(key) && value) {
            return new Date(value);
          }
          return value;
        });
        setSignals(parsed);
      }
    } catch(e) {
      // ignore
    }
  }, []);

  // Consolidate duplicates (legacy IDs with strike) to a single per symbol/category
  useEffect(() => {
    if (consolidatedRef.current || !signals.length) return;
    const map = new Map<string, AlertSignal>();
    signals.forEach(sig => {
      const category = sig.category || (sig.id.split('_')[0] as any);
      const symbol = sig.meta?.symbol || sig.id.split('_')[1] || 'UNKNOWN';
      const key = `${category}_${symbol}`;
      const existing = map.get(key);
      if (!existing || (sig.createdAt && existing.createdAt && sig.createdAt > existing.createdAt)) {
        // Normalize ID to stable form
        map.set(key, { ...sig, id: key });
      }
    });
    if (map.size !== signals.length) {
      consolidatedRef.current = true;
      setSignals(Array.from(map.values()));
    } else {
      consolidatedRef.current = true;
    }
  }, [signals]);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem('alert_signals_v1', JSON.stringify(signals));
    } catch(e) {/* ignore */}
  }, [signals]);

  const {
    data: optionChainData,
    error: optionChainError,
    loading,
    lastUpdate,
    refresh,
  } = useOptionChain({
    symbol: selectedSymbol,
    expiry: selectedExpiry,
    autoRefresh: autoRefreshEnabled,
  });

  // Create dashboard data from option chain
  useEffect(() => {
    if (optionChainData?.option_chain) {
      const dashboard: DashboardData = {
        totalCEOI: optionChainData.total_ce_oi || 0,
        totalPEOI: optionChainData.total_pe_oi || 0,
        pcr: optionChainData.pcr_oi || 0,
        atmStrike: optionChainData.atm_strike || 0,
        totalCEVolume: optionChainData.total_ce_volume || 0,
        totalPEVolume: optionChainData.total_pe_volume || 0,
        maxPain: optionChainData.max_pain || 0,
        maxGain: optionChainData.max_gain || 0,
        highRallyStrike: `${optionChainData.atm_strike + 200} CE / ${optionChainData.atm_strike + 100} PE`,
        highBearDipStrike: `${optionChainData.atm_strike - 100} CE / ${optionChainData.atm_strike - 200} PE`,
        dailySupport: (optionChainData.atm_strike || 0) - 100,
        weeklySupport: (optionChainData.atm_strike || 0) - 200,
        dailyResistance: (optionChainData.atm_strike || 0) + 100,
        weeklyResistance: (optionChainData.atm_strike || 0) + 200,
      };
      setDashboardData(dashboard);

  // Evaluate alert signals for currently selected symbol
  evaluateSignals(optionChainData, dashboard, selectedSymbol);
    }
  }, [optionChainData, selectedSymbol]);

  const handleManualRefresh = () => {
    refresh();
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  // --- Signal evaluation logic ---
  const evaluateSignals = (chain: any, dash: DashboardData, sym: Symbol) => {
    if (!chain) return;
    const newSignals: AlertSignal[] = [];
    const pcr = dash.pcr;
    const spot = chain.spot_price || 0;
    const atm = dash.atmStrike;
    const maxPain = dash.maxPain;
    const maxGain = dash.maxGain;
    const dailySupport = dash.dailySupport;
    const dailyResistance = dash.dailyResistance;
    const weeklySupport = dash.weeklySupport;
    const weeklyResistance = dash.weeklyResistance;

    const optionRows = chain.option_chain || [];
    const findRow = (strike:number) => optionRows.find((r:any) => r.strike_price === strike);

    // Helper to derive target based on available TP fields or fallback multiples
    const deriveTarget = (row: any, side: 'CE' | 'PE', hero: boolean) => {
      if (!row) return undefined;
      if (side === 'CE') {
        if (hero && typeof row.ce_tp2 === 'number') return row.ce_tp2;
        if (typeof row.ce_tp1 === 'number') return row.ce_tp1;
        if (typeof row.ce_ltp === 'number') return row.ce_ltp * (hero ? 2 : 1.2);
      } else {
        if (hero && typeof row.pe_tp2 === 'number') return row.pe_tp2;
        if (typeof row.pe_tp1 === 'number') return row.pe_tp1;
        if (typeof row.pe_ltp === 'number') return row.pe_ltp * (hero ? 2 : 1.2);
      }
      return undefined;
    };

    // Helper: CE OI increasing condition (compare ATM vs next 1-2 strikes)
    const rallyCEOIIncreasing = (() => {
      const ceRows = [findRow(atm), findRow(atm + 50), findRow(atm + 100)].filter(Boolean);
      if (ceRows.length < 2) return false;
      for (let i=1;i<ceRows.length;i++) {
        if ((ceRows[i].ce_oi||0) <= (ceRows[i-1].ce_oi||0)) return false;
      }
      return true;
    })();

    // BUY ZONE (Bullish) criteria
    const buyZoneCond = (
      pcr < 1 &&
      spot > dailySupport &&
      spot > maxPain &&
      (atm === maxGain || rallyCEOIIncreasing)
    );
    if (buyZoneCond) {
      const ceStrikes:number[] = [atm, atm + 100].filter((v,i,a)=>a.indexOf(v)===i);
      const peStrikes:number[] = [weeklySupport, atm - 100].filter(s => s>0);
      const atmRow = findRow(atm);
  const entryPrice = (atmRow?.ce_ltp ?? atmRow?.ce_last_price);
      newSignals.push({
        id: `BUY_ZONE_${sym}`,
        category: 'BUY_ZONE',
        title: '🟢 BUY ZONE (Bullish)',
        direction: 'bullish',
        description: 'PCR<1, Spot above support & max pain, ATM==MaxGain or CE OI rising',
        ceStrikes,
        peStrikes,
        entryPrice,
        target: deriveTarget(atmRow, 'CE', false),
        targetHitTime: null,
        createdAt: new Date(),
  meta: { pcr, spot, maxPain, maxGain, side: 'CE', entryStrike: atm, symbol: sym },
        ceDetails: ceStrikes.map(s => {
          const r = findRow(s);
          return { strike: s, side: 'CE', entry: (r?.ce_ltp ?? r?.ce_last_price), target: deriveTarget(r,'CE',false), hitTime: null, triggeredTime: new Date() };
        }),
        peDetails: peStrikes.map(s => {
          const r = findRow(s);
          return { strike: s, side: 'PE', entry: (r?.pe_ltp ?? r?.pe_last_price), target: deriveTarget(r,'PE',false), hitTime: null, triggeredTime: new Date() };
        })
      });
    }

    // SELL ZONE (Bearish) criteria
    const sellZoneCond = (
      pcr < 0.85 &&
      spot < maxPain &&
      spot < dailyResistance &&
      (dash.totalCEOI > dash.totalPEOI)
    );
    if (sellZoneCond) {
      const peStrikes:number[] = [atm, atm - 100].filter(s=>s>0);
      const ceStrikes:number[] = [dailyResistance, weeklyResistance];
      const atmRow = findRow(atm);
  const entryPrice = (atmRow?.pe_ltp ?? atmRow?.pe_last_price);
      newSignals.push({
        id: `SELL_ZONE_${sym}`,
        category: 'SELL_ZONE',
        title: '🔴 SELL ZONE (Bearish)',
        direction: 'bearish',
        description: 'PCR<0.85, Spot below max pain & resistance, CE OI > PE OI',
        ceStrikes,
        peStrikes,
        entryPrice,
        target: deriveTarget(atmRow, 'PE', false),
        targetHitTime: null,
        createdAt: new Date(),
  meta: { pcr, spot, maxPain, side: 'PE', entryStrike: atm, symbol: sym },
        ceDetails: ceStrikes.map(s => {
          const r = findRow(s);
          return { strike: s, side: 'CE', entry: (r?.ce_ltp ?? r?.ce_last_price), target: deriveTarget(r,'CE',false), hitTime: null, triggeredTime: new Date() };
        }),
        peDetails: peStrikes.map(s => {
          const r = findRow(s);
          return { strike: s, side: 'PE', entry: (r?.pe_ltp ?? r?.pe_last_price), target: deriveTarget(r,'PE',false), hitTime: null, triggeredTime: new Date() };
        })
      });
    }

    // HERO CE trade
    const heroCECond = (
      pcr < 0.80 &&
      spot > 0 &&
      (spot > maxGain || spot > atm + 100)
    );
    if (heroCECond) {
      const targetStrikeLow = Math.round((spot + 300) / 50) * 50;
      const targetStrikeHigh = Math.round((spot + 400) / 50) * 50;
  const volRows = optionRows.filter((r:any) => r.strike_price>=targetStrikeLow && r.strike_price<=targetStrikeHigh);
  const volumeIncreasing = volRows.length>1 && volRows.every((r: any)=> (r.ce_volume||0) > 0);
      if (volumeIncreasing) {
        const heroStrike = targetStrikeLow;
        const heroRow = findRow(heroStrike);
  const entryPrice = (heroRow?.ce_ltp ?? heroRow?.ce_last_price);
        newSignals.push({
          id: `HERO_CE_${sym}`,
          category: 'HERO_CE',
          title: '🟢 Zero-Hero CE Opportunity',
          direction: 'bullish',
            description: 'PCR<0.80 with OTM CE OI & volume expansion (300-400 OTM)',
          ceStrikes: [heroStrike],
          peStrikes: [],
          entryPrice,
          target: deriveTarget(heroRow, 'CE', true),
          targetHitTime: null,
          createdAt: new Date(),
          meta: { targetRange: [targetStrikeLow, targetStrikeHigh], side: 'CE', entryStrike: heroStrike, symbol: sym },
          ceDetails: [{ strike: heroStrike, side: 'CE', entry: entryPrice, target: deriveTarget(heroRow,'CE',true), hitTime: null, triggeredTime: new Date() }],
          peDetails: []
        });
      }
    }

    // HERO PE trade
    const heroPECond = (
      pcr > 1.2 &&
      spot < Math.max(maxPain, atm) &&
      spot > 0
    );
    if (heroPECond) {
      const targetStrikeLow = Math.round((spot - 400) / 50) * 50;
      const targetStrikeHigh = Math.round((spot - 300) / 50) * 50;
  const volRows = optionRows.filter((r:any) => r.strike_price>=targetStrikeLow && r.strike_price<=targetStrikeHigh);
  const volumeIncreasing = volRows.length>1 && volRows.every((r: any)=> (r.pe_volume||0) > 0);
      if (volumeIncreasing) {
        const heroStrike = targetStrikeHigh;
        const heroRow = findRow(heroStrike);
  const entryPrice = (heroRow?.pe_ltp ?? heroRow?.pe_last_price);
        newSignals.push({
          id: `HERO_PE_${sym}`,
          category: 'HERO_PE',
          title: '🔴 Zero-Hero PE Opportunity',
          direction: 'bearish',
          description: 'PCR>1.2 with OTM PE OI & volume expansion (300-400 OTM)',
          ceStrikes: [],
          peStrikes: [heroStrike],
          entryPrice,
          target: deriveTarget(heroRow, 'PE', true),
          targetHitTime: null,
          createdAt: new Date(),
          meta: { targetRange: [targetStrikeLow, targetStrikeHigh], side: 'PE', entryStrike: heroStrike, symbol: sym },
          peDetails: [{ strike: heroStrike, side: 'PE', entry: entryPrice, target: deriveTarget(heroRow,'PE',true), hitTime: null, triggeredTime: new Date() }],
          ceDetails: []
        });
      }
    }

    setSignals(prev => {
      const map = new Map<string, AlertSignal>();
      // seed with previous
      prev.forEach(p => map.set(p.id, p));
      // merge new
      newSignals.forEach(ns => {
        if (map.has(ns.id)) {
          const existing = map.get(ns.id)!;
          // Update dynamic fields while preserving createdAt & triggered times where appropriate
          const mergeDetails = (oldArr: any[]|undefined, newArr: any[]|undefined) => {
            if (!newArr) return oldArr;
            return newArr.map(nd => {
              const match = oldArr?.find(o => o.strike === nd.strike && o.side === nd.side);
              if (!match) return nd; // entirely new strike
              // If legacy entry differs from freshly derived (open-based stale) then replace with new entry
              const shouldUpdateEntry = typeof nd.entry === 'number' && nd.entry !== match.entry;
              return {
                ...match,
                entry: shouldUpdateEntry ? nd.entry : match.entry,
                target: nd.target // always adopt latest target
              };
            });
          };
          map.set(ns.id, {
            ...existing,
            // Overwrite mutable fields
            ceStrikes: ns.ceStrikes,
            peStrikes: ns.peStrikes,
            entryPrice: (typeof ns.entryPrice === 'number' ? ns.entryPrice : existing.entryPrice),
            target: ns.target ?? existing.target,
            meta: { ...(existing.meta||{}), ...(ns.meta||{}) },
            ceDetails: mergeDetails(existing.ceDetails, ns.ceDetails),
            peDetails: mergeDetails(existing.peDetails, ns.peDetails),
          });
        } else {
          map.set(ns.id, ns);
        }
      });
      return Array.from(map.values());
    });
  };

  // Background polling for core symbols (excluding currently selected to avoid duplicate immediate fetch pressure)
  useEffect(() => {
    let cancelled = false;
    const intervalMs = 5000; // 5s cadence for background updates

    const poll = async () => {
      for (const sym of coreSymbolsRef.current) {
        try {
          // Skip if it's the currently selected symbol (handled by hook already)
          if (sym === selectedSymbol) continue;
          const chain = await ApiService.getOptionChain(sym);
          if (!chain || cancelled) continue;
          const dash: DashboardData = {
            totalCEOI: chain.total_ce_oi || 0,
            totalPEOI: chain.total_pe_oi || 0,
            pcr: chain.pcr_oi || 0,
            atmStrike: chain.atm_strike || 0,
            totalCEVolume: chain.total_ce_volume || 0,
            totalPEVolume: chain.total_pe_volume || 0,
            maxPain: chain.max_pain || 0,
            maxGain: chain.max_gain || 0,
            highRallyStrike: `${(chain.atm_strike||0) + 200} CE / ${(chain.atm_strike||0) + 100} PE`,
            highBearDipStrike: `${(chain.atm_strike||0) - 100} CE / ${(chain.atm_strike||0) - 200} PE`,
            dailySupport: (chain.atm_strike || 0) - 100,
            weeklySupport: (chain.atm_strike || 0) - 200,
            dailyResistance: (chain.atm_strike || 0) + 100,
            weeklyResistance: (chain.atm_strike || 0) + 200,
          };
          evaluateSignals(chain, dash, sym);
        } catch (e) {
          // Silently ignore individual symbol errors to keep loop resilient
          // console.debug('Background poll error for', sym, e);
        }
        if (cancelled) break;
      }
    };

    // Initial kick
    poll();
    const id = setInterval(poll, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [selectedSymbol]);

  // Render signal block
  // Live signal deletion removed (signals UI removed)

  // Live Alert Signals removed per requirement

  // Track target hits on each data refresh
  useEffect(() => {
    if (!optionChainData || !optionChainData.option_chain?.length) return;
    setSignals(prev => prev.map(sig => {
      const updated = { ...sig };
      // Overall target logic (legacy)
      if (sig.target && !sig.targetHitTime) {
        const entryStrike = sig.meta?.entryStrike;
        const side = sig.meta?.side as 'CE' | 'PE';
        const row = optionChainData.option_chain.find((r:any) => r.strike_price === entryStrike);
        const ltp = row ? (side === 'CE' ? (row.ce_ltp ?? row.ce_last_price) : (row.pe_ltp ?? row.pe_last_price)) : undefined;
        if (typeof ltp === 'number' && ltp >= sig.target) {
          updated.targetHitTime = new Date();
        }
      }
      // Per strike details
      if (updated.ceDetails) {
        updated.ceDetails = updated.ceDetails.map(d => {
          if (d.hitTime || !d.target) return d;
          const row = optionChainData.option_chain.find((r:any) => r.strike_price === d.strike);
            const ltp = row ? (row.ce_ltp ?? row.ce_last_price) : undefined;
          if (typeof ltp === 'number' && ltp >= d.target) {
            return { ...d, hitTime: new Date() };
          }
          return d;
        });
      }
      if (updated.peDetails) {
        updated.peDetails = updated.peDetails.map(d => {
          if (d.hitTime || !d.target) return d;
          const row = optionChainData.option_chain.find((r:any) => r.strike_price === d.strike);
          const ltp = row ? (row.pe_ltp ?? row.pe_last_price) : undefined;
          if (typeof ltp === 'number' && ltp >= d.target) {
            return { ...d, hitTime: new Date() };
          }
          return d;
        });
      }
      return updated;
    }));
  }, [optionChainData]);

  return (
    <PageContainer>
      <HeaderSection>
        <TitleSection>
          <Title>Custom Analysis</Title>
          <Subtitle>Advanced option analysis with Greeks and key metrics</Subtitle>
        </TitleSection>
        
        <ControlsSection>
          {lastUpdate && (
            <LastUpdateInfo>
              <FontAwesomeIcon icon={faClock} />
              Last updated: {formatTime(lastUpdate)}
            </LastUpdateInfo>
          )}
          
          <ButtonGroup>
            <Button 
              onClick={handleManualRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
              style={{ 
                backgroundColor: 'transparent', 
                border: '1px solid #fff200',
                color: '#fff200'
              }}
            >
              <FontAwesomeIcon icon={faRefresh} />
            </Button>
            
            <Button 
              onClick={handleAutoRefreshToggle} 
              variant={autoRefreshEnabled ? "default" : "outline"} 
              size="sm"
              style={{ 
                backgroundColor: autoRefreshEnabled ? '#fff200' : 'transparent',
                border: '1px solid #fff200',
                color: autoRefreshEnabled ? '#000' : '#fff200'
              }}
            >
              <FontAwesomeIcon 
                icon={autoRefreshEnabled ? faPause : faPlay} 
              />
            </Button>
          </ButtonGroup>
        </ControlsSection>
        
        <SelectorSection>
          <MarketSelector
            selectedMarket={selectedMarket}
            selectedSymbol={selectedSymbol}
            selectedExpiry={selectedExpiry}
            onMarketChange={setSelectedMarket}
            onSymbolChange={setSelectedSymbol}
            onExpiryChange={setSelectedExpiry}
          />
        </SelectorSection>
      </HeaderSection>

      {/* Dashboard Metrics */}
      {dashboardData && optionChainData && (
        <DashboardSection>
          <Dashboard
            data={dashboardData}
            spotPrice={optionChainData.spot_price || 0}
            symbol={selectedSymbol}
            screenMode="desktop"
          />
        </DashboardSection>
      )}

      {/* Render signals */}
  {/* Live Alert Signals removed per requirement */}

      {/* Custom Option Table */}
      <TableSection>
        {selectedMarket === 'MCX' ? (
          /* MCX Commodity Analysis */
          <>
            <MCXAnalysisHeader>
              <MCXAnalysisTitle>
                MCX Commodity Analysis
              </MCXAnalysisTitle>
              <MCXAnalysisSubtitle>
                MCX commodities may have futures and options. Live analysis data shown below.
              </MCXAnalysisSubtitle>
              <MCXAnalysisCard>
                <MCXAnalysisCardTitle>
                  {selectedSymbol} - Live Option Chain Analysis
                </MCXAnalysisCardTitle>
                <MCXAnalysisCardDescription>
                  Real-time MCX commodity analysis with option chain data and Greeks
                </MCXAnalysisCardDescription>
              </MCXAnalysisCard>
            </MCXAnalysisHeader>

            {/* Show Option Chain for MCX if data is available */}
            {optionChainError && (
              <ErrorState>
                Error loading option chain: {optionChainError}
              </ErrorState>
            )}
            
            {!optionChainError && optionChainData && optionChainData.option_chain && optionChainData.option_chain.length > 0 && (
              <CustomOptionTable
                data={optionChainData.option_chain || []}
                spotPrice={optionChainData.spot_price || 0}
                atmStrike={optionChainData.atm_strike || 0}
                symbol={selectedSymbol}
                screenMode="desktop"
              />
            )}

            {!optionChainError && (!optionChainData || !optionChainData.option_chain || optionChainData.option_chain.length === 0) && (
              <NoDataContainer>
                <NoDataText>
                  No option chain data available for this MCX commodity
                </NoDataText>
              </NoDataContainer>
            )}
          </>
        ) : (
          <>
            {optionChainError && (
              <ErrorState>
                Error loading option chain: {optionChainError}
              </ErrorState>
            )}
            
            {!optionChainError && (
              <CustomOptionTable
                data={optionChainData?.option_chain || []}
                spotPrice={optionChainData?.spot_price || 0}
                atmStrike={optionChainData?.atm_strike || 0}
                symbol={selectedSymbol}
                screenMode="desktop"
              />
            )}
          </>
        )}
      </TableSection>
    </PageContainer>
  );
};

export default CustomAnalysisPage;
