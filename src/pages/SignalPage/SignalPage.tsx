import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { formatTime } from '../../utils/helpers';
import { ApiService } from '../../services/ApiService';
import { jsPDF } from 'jspdf';
// @ts-ignore - typings for autotable may not be present
import autoTable from 'jspdf-autotable';

// Signal interface based on SMD Key Buy breakouts
interface Signal {
  id: string;
  symbol: string;
  strike: number;
  optionType: 'CE' | 'PE';
  signalType: 'BUY' | 'SELL';
  // Mark if this signal has already flipped from BUY to SELL to avoid ping-pong
  hasFlipped?: boolean;
  
  // Breakout data
  breakoutPrice: number;
  breakoutTime: Date;
  smdKeyBuyValue: number;
  
  // Target levels (TP)
  tp1Value?: number;
  tp1Price?: number;
  tp1Time?: Date;
  
  tp2Value?: number;
  tp2Price?: number;
  tp2Time?: Date;
  
  tp3Value?: number;
  tp3Price?: number;
  tp3Time?: Date;
  
  // Stop Loss
  slValue?: number;
  slPrice?: number;
  slTime?: Date;
  
  isActive: boolean;
  currentPrice: number;
}

// Persist first-trigger prices/times across refreshes
type FrozenState = {
  breakoutPrice?: number;
  breakoutTime?: string; // ISO string
  tp1Price?: number;
  tp1Time?: string;
  tp2Price?: number;
  tp2Time?: string;
  tp3Price?: number;
  tp3Time?: string;
  slPrice?: number;
  slTime?: string;
};

const FREEZE_STORAGE_KEY = 'smdSignalsFreezeV2';

const loadFreezeStore = (): Record<string, FrozenState> => {
  try {
    const raw = localStorage.getItem(FREEZE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveFreezeStore = (store: Record<string, FrozenState>) => {
  try {
    localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(store));
  } catch {}
};

const makeFreezeKey = (id: string, leg: 'BUY' | 'SELL') => `${id}__${leg}`;

const getFrozen = (key: string): FrozenState | undefined => {
  const store = loadFreezeStore();
  return store[key];
};

const setFrozen = (key: string, patch: Partial<FrozenState>, onlyIfMissing = true) => {
  const store = loadFreezeStore();
  const cur = store[key] || {};
  const next: FrozenState = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    const kk = k as keyof FrozenState;
    if (!onlyIfMissing || next[kk] === undefined) {
      next[kk] = v as any;
    }
  }
  store[key] = next;
  saveFreezeStore(store);
};

const applyFrozenToSignal = (signal: Signal) => {
  const key = makeFreezeKey(signal.id, signal.signalType);
  const f = getFrozen(key);
  if (!f) return;
  if (f.breakoutPrice !== undefined) signal.breakoutPrice = f.breakoutPrice;
  if (f.breakoutTime) signal.breakoutTime = new Date(f.breakoutTime);
  if (f.tp1Price !== undefined) signal.tp1Price = f.tp1Price;
  if (f.tp1Time) signal.tp1Time = new Date(f.tp1Time);
  if (f.tp2Price !== undefined) signal.tp2Price = f.tp2Price;
  if (f.tp2Time) signal.tp2Time = new Date(f.tp2Time);
  if (f.tp3Price !== undefined) signal.tp3Price = f.tp3Price;
  if (f.tp3Time) signal.tp3Time = new Date(f.tp3Time);
  if (f.slPrice !== undefined) signal.slPrice = f.slPrice;
  if (f.slTime) signal.slTime = new Date(f.slTime);
};

// Persist rendered signals so they remain visible across navigation/reload
const SIGNALS_STORAGE_KEY = 'smdSignalsListV2';
const SIGNALS_DAY_KEY = 'smdSignalsDayV2';

const getTodayIstKey = (): string => {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().slice(0, 10);
};

const saveSignalsToStorage = (arr: Signal[]) => {
  try {
  localStorage.setItem(SIGNALS_DAY_KEY, getTodayIstKey());
    const serializable = arr.map(s => ({
      ...s,
      breakoutTime: s.breakoutTime ? (s.breakoutTime as any as Date).toISOString?.() || new Date(s.breakoutTime as any).toISOString() : undefined,
      tp1Time: s.tp1Time ? (s.tp1Time as any as Date).toISOString?.() || new Date(s.tp1Time as any).toISOString() : undefined,
      tp2Time: s.tp2Time ? (s.tp2Time as any as Date).toISOString?.() || new Date(s.tp2Time as any).toISOString() : undefined,
      tp3Time: s.tp3Time ? (s.tp3Time as any as Date).toISOString?.() || new Date(s.tp3Time as any).toISOString() : undefined,
      slTime: s.slTime ? (s.slTime as any as Date).toISOString?.() || new Date(s.slTime as any).toISOString() : undefined,
    }));
    localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(serializable));
  } catch {}
};

const loadSignalsFromStorage = (): Signal[] => {
  try {
    const raw = localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    return (parsed || []).map(item => {
      const s: Signal = {
        id: item.id,
        symbol: item.symbol,
        strike: item.strike,
        optionType: item.optionType,
        signalType: item.signalType,
        hasFlipped: item.hasFlipped,
        breakoutPrice: item.breakoutPrice,
        breakoutTime: item.breakoutTime ? new Date(item.breakoutTime) : new Date(),
        smdKeyBuyValue: item.smdKeyBuyValue,
        tp1Value: item.tp1Value,
        tp1Price: item.tp1Price,
        tp1Time: item.tp1Time ? new Date(item.tp1Time) : undefined,
        tp2Value: item.tp2Value,
        tp2Price: item.tp2Price,
        tp2Time: item.tp2Time ? new Date(item.tp2Time) : undefined,
        tp3Value: item.tp3Value,
        tp3Price: item.tp3Price,
        tp3Time: item.tp3Time ? new Date(item.tp3Time) : undefined,
        slValue: item.slValue,
        slPrice: item.slPrice,
        slTime: item.slTime ? new Date(item.slTime) : undefined,
        isActive: item.isActive,
        currentPrice: item.currentPrice ?? 0,
      };
      // Re-apply any frozen values to ensure first-trigger semantics
      applyFrozenToSignal(s);
      return s;
    });
  } catch {
    return [];
  }
};

const PageWrap = styled.div`
  display:flex;
  flex-direction:column;
  gap:20px;
`;

const Title = styled.h1`
  font-size:2rem;
  margin:0;
  color:#fff200;
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`;

const MajorSymbolsInfo = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  color: #ccc;
  
  strong {
    color: #fff200;
  }
`;

const DropdownContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CategorySelect = styled.select`
  background: linear-gradient(135deg, #333, #444);
  color: #fff;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:hover {
    border-color: #fff200;
  }
  
  &:focus {
    border-color: #fff200;
    box-shadow: 0 0 0 2px rgba(255, 242, 0, 0.2);
  }
  
  option {
    background: #333;
    color: #fff;
  }
`;

const LoadingText = styled.div`
  color: #fff200;
  font-size: 16px;
  text-align: center;
  margin: 20px 0;
`;

const SymbolCount = styled.div`
  color: #888;
  font-size: 14px;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

const DownloadButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) => (disabled ? '#444' : 'linear-gradient(135deg,#b71c1c,#e53935)')};
  color: #fff;
  border: 1px solid ${({ disabled }) => (disabled ? '#555' : '#ff8a80')};
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  transition: filter .15s ease-in-out;
  &:hover { filter: ${({ disabled }) => (disabled ? 'none' : 'brightness(1.05)')}; }
`;

const SignalsContainer = styled.div`
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:18px;
`;

const SignalCard = styled.div<{ isActive: boolean; signalType: 'BUY' | 'SELL' }>`
  position:relative;
  border:1px solid ${({isActive, signalType})=> signalType==='SELL' ? '#ff5252' : (isActive? '#00c853':'#666')};
  background:${({isActive, signalType})=> signalType==='SELL' 
    ? 'linear-gradient(135deg,#2b0d0d,#1a0f0f)'
    : (isActive? 'linear-gradient(135deg,#002d19,#081f17)': 'linear-gradient(135deg,#1a1a1a,#252525)')};
  padding:16px;
  border-radius:12px;
  font-size:12px;
  min-height:280px;
  display:flex;
  flex-direction:column;
`;

const SignalTitle = styled.div`
  font-weight:600;
  font-size:14px;
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:8px;
`;

const SymbolBadge = styled.span`
  display:inline-block;
  background:linear-gradient(90deg,#444,#555);
  color:#fff200;
  font-size:0.7rem;
  font-weight:600;
  padding:3px 8px;
  border-radius:4px;
  letter-spacing:0.5px;
  border:1px solid #666;
`;

const StrikeBadge = styled.span`
  display:inline-block;
  background:#333;
  color:#fff;
  font-size:0.65rem;
  font-weight:600;
  padding:2px 6px;
  border-radius:3px;
`;

const SignalTypeBadge = styled.span<{ signalType: 'BUY' | 'SELL' }>`
  display:inline-block;
  background: ${({signalType}) => signalType === 'BUY' ? '#00c853' : '#ff5722'};
  color:#fff;
  font-size:0.6rem;
  font-weight:600;
  padding:2px 6px;
  border-radius:3px;
  margin-left: auto;
`;

const SignalMetaRow = styled.div`
  font-size:12px;
  line-height:1.4;
  display:flex;
  flex-direction:column;
  gap:6px;
`;

const DataRow = styled.div`
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:2px 0;
`;

const Label = styled.span`
  color:#bbb;
  font-weight:500;
`;

const Value = styled.span<{ highlight?: boolean; color?: string }>`
  color:${({highlight, color}) => color || (highlight ? '#00c853' : '#fff')};
  font-weight:600;
`;

const HitTime = styled.span<{ color?: string }>`
  color: ${({color}) => color || '#888'};
  font-size:10px;
`;

const Status = styled.div<{ active: boolean }>`
  font-size:10px;
  color:${({active})=>active? '#00c853':'#666'};
  font-weight:600;
  text-transform:uppercase;
  margin-top:8px;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
  background: ${({active})=>active? 'rgba(0, 200, 83, 0.1)':'rgba(102, 102, 102, 0.1)'};
`;

const NoSignalsMessage = styled.div`
  text-align: center;
  color: #666;
  margin-top: 40px;
  grid-column: 1 / -1;
`;

const NoSignalsNote = styled.div`
  font-size: 12px;
  margin-top: 10px;
  opacity: 0.7;
`;

// Helper: nearest perfect square below or equal to x (returns undefined for non-positive or NaN)
const floorSquareBelow = (x?: number): number | undefined => {
  if (typeof x !== 'number' || !isFinite(x) || x <= 0) return undefined;
  const r = Math.floor(Math.sqrt(x));
  const sq = r * r;
  return sq > 0 ? sq : undefined;
};

// Major symbols that always show signals
const majorSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 
                       'COPPER', 'CRUDEOIL', 'CRUDEOILM', 'GOLD', 'GOLDM', 
                       'NATGASMINI', 'NATURALGAS', 'SILVER', 'SILVERM', 'ZINC'];

export const SignalPage: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [smdData, setSmdData] = useState<any>({});
  const [optionChainData, setOptionChainData] = useState<any>({});
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stocksList, setStocksList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Major symbols are defined at module scope for stable reference

  // Refs to avoid interval recreation on every state change
  const signalsRef = React.useRef<Signal[]>(signals);
  const smdDataRef = React.useRef<any>(smdData);
  useEffect(() => { signalsRef.current = signals; }, [signals]);
  useEffect(() => { smdDataRef.current = smdData; }, [smdData]);

  // Get current symbols to monitor
  const symbolsToMonitor = useMemo(() => {
    const symbols = [...majorSymbols];
    if (selectedStock) {
      symbols.push(selectedStock);
    }
    return symbols;
  }, [selectedStock]);

  const tp1HitCount = useMemo(() => signals.filter(s => !!s.tp1Time).length, [signals]);

  // Hydrate previously persisted signals on first mount
  useEffect(() => {
    const lastDay = localStorage.getItem(SIGNALS_DAY_KEY);
    const today = getTodayIstKey();
    if (lastDay !== today) {
      try {
        localStorage.removeItem(SIGNALS_STORAGE_KEY);
        localStorage.setItem(SIGNALS_DAY_KEY, today);
        localStorage.removeItem(FREEZE_STORAGE_KEY);
      } catch {}
      setSignals([]);
      return;
    }
    const restored = loadSignalsFromStorage();
    if (restored.length) setSignals(restored);
  }, []);

  // Persist signals whenever they change
  useEffect(() => {
    if (signals && signals.length >= 0) {
      saveSignalsToStorage(signals);
    }
  }, [signals]);

  const handleDownloadTP1PDF = useCallback(() => {
    const hits = signals.filter(s => !!s.tp1Time);
    if (hits.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const now = new Date();
    const title = `TP1 Hit Signals (${hits.length})`;

    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 40, 58);

    const head = [[
      'Symbol', 'Strike', 'Type', 'Side', 'Breakout Price', 'Breakout Time',
      'TP1 Value', 'TP1 Hit Price', 'TP1 Hit Time', 'Current Price'
    ]];

    const body = hits.map(s => [
      s.symbol,
      `${s.strike} ${s.optionType}`,
      s.optionType,
      s.signalType,
      s.breakoutPrice?.toFixed(2) ?? '-',
      s.breakoutTime ? formatTime(s.breakoutTime) : '-',
      s.tp1Value !== undefined ? s.tp1Value.toFixed(2) : '-',
      s.tp1Price !== undefined ? s.tp1Price.toFixed(2) : '-',
      s.tp1Time ? formatTime(s.tp1Time) : '-',
      s.currentPrice !== undefined ? s.currentPrice.toFixed(2) : '-'
    ]);

    (autoTable as any)(doc, {
      head,
      body,
      startY: 80,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [183, 28, 28] },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      }
    });

    const fname = `tp1_signals_${now.toISOString().slice(0,10)}.pdf`;
    doc.save(fname);
  }, [signals]);

  // Fetch stocks list for dropdown
  useEffect(() => {
    const fetchStocksList = async () => {
      try {
        setIsLoading(true);
        const symbolsData = await ApiService.getAllSymbolsFull();
        const stocks = symbolsData.stocks_with_options.map((s: any) => s.symbol || s);
        setStocksList(stocks);
        console.log('Stocks list loaded:', stocks.length, 'stocks');
      } catch (error) {
        console.error('Failed to fetch stocks list:', ApiService.handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocksList();
  }, []);

  // Fetch SMD data for symbols
  const fetchSmdData = useCallback(async () => {
    try {
      const { results } = await ApiService.additionalSharpProBatch(symbolsToMonitor as any[]);
      setSmdData(results || {});
    } catch (e) {
      console.error('Batch ASP failed, falling back to per-symbol', e);
      const tasks = symbolsToMonitor.map(sym =>
        ApiService.additionalSharpPro(sym as any)
          .then((data: any) => ({ sym, data }))
          .catch((error: unknown) => ({ sym, error }))
      );
      const results = await Promise.allSettled(tasks);
      const next: any = {};
      results.forEach(r => {
        const v: any = (r.status === 'fulfilled' ? r.value : (r as any).reason) || {};
        if (v && v.sym && v.data) next[v.sym] = v.data;
      });
      setSmdData(next);
    }
  }, [symbolsToMonitor]);

  // Fetch option chain data for symbols
  const fetchOptionChainData = useCallback(async () => {
    const tasks = symbolsToMonitor.map(sym =>
      ApiService.getOptionChain(sym as any)
        .then((data: any) => ({ sym, data }))
        .catch((error: unknown) => ({ sym, error }))
    );
    const results = await Promise.allSettled(tasks);
    const next: any = {};
    results.forEach(r => {
      const v: any = (r.status === 'fulfilled' ? r.value : (r as any).reason) || {};
      if (v && v.sym && v.data) next[v.sym] = v.data;
    });
    setOptionChainData(next);
  }, [symbolsToMonitor]);

  // Generate signals based on SMD Key Buy breakouts
  const generateSignals = useCallback(() => {
    console.log('🚀 Starting signal generation...');
    
    if (Object.keys(smdData).length === 0 || Object.keys(optionChainData).length === 0) {
      console.log('❌ Insufficient data for signal generation');
      return;
    }

    setSignals(prevSignals => {
      const newSignalsToAdd: Signal[] = [];

      Object.keys(smdData).forEach(symbol => {
        const smd = smdData[symbol];
        const chain = optionChainData[symbol];
        
        if (!smd || !chain || !chain.option_chain) return;

        console.log(`Processing ${symbol} for signal generation...`);

        // Helper: get relative position (in steps) of a strike vs ATM for CE/PE.
        // pos definition:
        //  - 0 for ATM strike
        //  - +n if the strike is OTM n steps for that option type (higher strikes for CE, lower for PE)
        //  - -n if the strike is ITM n steps for that option type
        const getRelativePos = (strike: number, optionType: 'CE' | 'PE'): number | null => {
          const atmStrike = smd?.atm_pair?.strike;
          if (!atmStrike || !smd?.otm_steps || !smd?.itm_steps) return null;
          if (strike === atmStrike) return 0;

          if (optionType === 'CE') {
            const idxOtm = smd.otm_steps.findIndex((st: any) => st?.ce_strike === strike);
            if (idxOtm >= 0) return idxOtm + 1; // +1..+N
            const idxItm = smd.itm_steps.findIndex((st: any) => st?.ce_strike === strike);
            if (idxItm >= 0) return -(idxItm + 1); // -1..-N
          } else {
            const idxOtm = smd.otm_steps.findIndex((st: any) => st?.pe_strike === strike);
            if (idxOtm >= 0) return idxOtm + 1; // +1..+N
            const idxItm = smd.itm_steps.findIndex((st: any) => st?.pe_strike === strike);
            if (idxItm >= 0) return -(idxItm + 1); // -1..-N
          }
          return null;
        };

        // Helper: SL is SMD at next +2 OTM steps from the signal's strike
        const slFromPlusTwoOTM = (strike: number, optionType: 'CE' | 'PE'): number | undefined => {
          const pos = getRelativePos(strike, optionType);
          if (pos === null) return undefined;
          const target = pos + 2; // move two steps toward OTM from current strike

          // ATM
          if (target === 0) {
            return smd?.atm_pair?.smd;
          }

          // OTM side (positive target)
          if (target > 0) {
            const otmSteps: any[] = smd?.otm_steps || [];
            if (!otmSteps.length) return undefined;
            const idx = Math.min(otmSteps.length - 1, target - 1); // 0-based
            return otmSteps[idx]?.smd;
          }

          // ITM side (negative target)
          const itmSteps: any[] = smd?.itm_steps || [];
          if (!itmSteps.length) return undefined;
          const idx = Math.min(itmSteps.length - 1, -target - 1); // -1 -> 0, -2 -> 1, etc.
          return itmSteps[idx]?.smd;
        };

        // Build TP ladder for an OTM breakout at index `idx` moving toward ATM then ITM
        // Rules from examples:
        //  - OTM idx 0 (nearest OTM): TP1 = ATM, TP2 = ITM1, TP3 = ITM2
        //  - Deeper OTM (idx >= 2): Walk back toward ATM using prior OTM steps until 3 targets,
        //    then ATM, then ITM steps if still short.
        // This produces sequences like:
        //  - OTM2: [OTM1, ATM, ITM1]
        //  - OTM3: [OTM2, OTM1, ATM]
        //  - OTM4: [OTM3, OTM2, OTM1]
        const getOTMTargets = (idx: number): Array<number | undefined> => {
          const out: Array<number | undefined> = [];
          const otmSteps: any[] = smd?.otm_steps || [];
          const itmSteps: any[] = smd?.itm_steps || [];
          const atmVal: number | undefined = smd?.atm_pair?.smd;

          if (idx === 0) {
            // Nearest OTM: start from ATM then ITM side
            if (atmVal !== undefined) out.push(atmVal);
            if (itmSteps[0]?.smd !== undefined) out.push(itmSteps[0]?.smd);
            if (itmSteps[1]?.smd !== undefined) out.push(itmSteps[1]?.smd);
            return out.slice(0, 3);
          }

          if (idx === 1) {
            // Second OTM: step back via prior OTM first, then ATM, then ITM1
            const prevOtm = otmSteps[0]?.smd; // OTM1
            if (prevOtm !== undefined) out.push(prevOtm);
            if (atmVal !== undefined) out.push(atmVal);
            if (itmSteps[0]?.smd !== undefined) out.push(itmSteps[0]?.smd);
            return out.slice(0, 3);
          }

          // For deeper OTM (idx >= 2), step back toward ATM via prior OTM steps
          for (let i = idx - 1; i >= 0 && out.length < 3; i--) {
            const v = otmSteps[i]?.smd;
            if (v !== undefined) out.push(v);
          }
          if (out.length < 3 && atmVal !== undefined) out.push(atmVal);
          for (let j = 0; out.length < 3 && j < itmSteps.length; j++) {
            const v = itmSteps[j]?.smd;
            if (v !== undefined) out.push(v);
          }
          return out.slice(0, 3);
        };

        // Helper to create a CE/PE signal from a specific ITM step index
        const maybeCreateITMSignal = (idx: number) => {
          if (!smd.itm_steps || smd.itm_steps.length <= idx) return;
          const step = smd.itm_steps[idx];

          // CE side
          if (step?.ce_strike && step?.smd) {
            const opt = chain.option_chain.find((o: any) => o.strike_price === step.ce_strike);
            if (opt) {
              const ltp = opt.ce_ltp || 0;
              const id = `${symbol}_${step.ce_strike}_CE_ITM${idx}`;
              const existing = prevSignals.find(s => s.id === id);
              if (ltp > step.smd && !existing) {
                const nsBase: Signal = {
                  id,
                  symbol,
                  strike: step.ce_strike,
                  optionType: 'CE',
                  signalType: 'BUY',
                  breakoutPrice: step.smd,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: step.smd,
                  isActive: true,
                  currentPrice: ltp,
                };
                setFrozen(makeFreezeKey(id, 'BUY'), { breakoutPrice: nsBase.breakoutPrice, breakoutTime: nsBase.breakoutTime.toISOString() }, true);
                const ns: Signal = { ...nsBase };
                applyFrozenToSignal(ns);
                // TP ladder forward on ITM with near-below-square logic
                if (smd.itm_steps && smd.itm_steps.length > idx + 1) {
                  const nxt1 = smd.itm_steps[idx + 1]?.smd;
                  const nxt2 = smd.itm_steps[idx + 2]?.smd;
                  ns.tp1Value = floorSquareBelow(nxt1) ?? 0;
                  ns.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                  ns.tp3Value = floorSquareBelow(nxt2) ?? 0;
                }
                // SL: next +2 OTM from this strike
                const sl = slFromPlusTwoOTM(step.ce_strike, 'CE');
                if (sl !== undefined) ns.slValue = sl;
                newSignalsToAdd.push(ns);
                console.log(`🔥 New ITM CE signal generated for ${symbol} ${step.ce_strike} at ${ltp}`);
              } else if (existing) {
                // Update TP mapping on existing signal to reflect rule change
                const nxt1 = smd.itm_steps[idx + 1]?.smd;
                const nxt2 = smd.itm_steps[idx + 2]?.smd;
                existing.tp1Value = floorSquareBelow(nxt1) ?? 0;
                existing.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                existing.tp3Value = floorSquareBelow(nxt2) ?? 0;
              }
            }
          }

          // PE side
          if (step?.pe_strike && step?.smd) {
            const opt = chain.option_chain.find((o: any) => o.strike_price === step.pe_strike);
            if (opt) {
              const ltp = opt.pe_ltp || 0;
              const id = `${symbol}_${step.pe_strike}_PE_ITM${idx}`;
              const existing = prevSignals.find(s => s.id === id);
              if (ltp > step.smd && !existing) {
                const nsBase: Signal = {
                  id,
                  symbol,
                  strike: step.pe_strike,
                  optionType: 'PE',
                  signalType: 'BUY',
                  breakoutPrice: step.smd,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: step.smd,
                  isActive: true,
                  currentPrice: ltp,
                };
                setFrozen(makeFreezeKey(id, 'BUY'), { breakoutPrice: nsBase.breakoutPrice, breakoutTime: nsBase.breakoutTime.toISOString() }, true);
                const ns: Signal = { ...nsBase };
                applyFrozenToSignal(ns);
                if (smd.itm_steps && smd.itm_steps.length > idx + 1) {
                  const nxt1 = smd.itm_steps[idx + 1]?.smd;
                  const nxt2 = smd.itm_steps[idx + 2]?.smd;
                  ns.tp1Value = floorSquareBelow(nxt1) ?? 0;
                  ns.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                  ns.tp3Value = floorSquareBelow(nxt2) ?? 0;
                }
                const sl = slFromPlusTwoOTM(step.pe_strike, 'PE');
                if (sl !== undefined) ns.slValue = sl;
                newSignalsToAdd.push(ns);
                console.log(`🔥 New ITM PE signal generated for ${symbol} ${step.pe_strike} at ${ltp}`);
              } else if (existing) {
                const nxt1 = smd.itm_steps[idx + 1]?.smd;
                const nxt2 = smd.itm_steps[idx + 2]?.smd;
                existing.tp1Value = floorSquareBelow(nxt1) ?? 0;
                existing.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                existing.tp3Value = floorSquareBelow(nxt2) ?? 0;
              }
            }
          }
        };

        // Process ATM signals
        if (smd.atm_pair && smd.atm_pair.strike && smd.atm_pair.smd) {
          const atmStrike = smd.atm_pair.strike;
          const smdValue = smd.atm_pair.smd;
          
          // Find current option prices for ATM strike
          const atmOption = chain.option_chain.find((opt: any) => opt.strike_price === atmStrike);
          
          if (atmOption) {
            // Process CE signal
            const cePrice = atmOption.ce_ltp || 0;
            const ceSignalId = `${symbol}_${atmStrike}_CE_ATM`;
            const existingCE = prevSignals.find(s => s.id === ceSignalId);
            if (cePrice > smdValue) {
              if (!existingCE) {
                // New breakout signal for CE
                const newSignal: Signal = {
                  id: ceSignalId,
                  symbol,
                  strike: atmStrike,
                  optionType: 'CE',
                  signalType: 'BUY',
                  breakoutPrice: smdValue,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: smdValue,
                  isActive: true,
                  currentPrice: cePrice
                };
                // Freeze breakout first time and re-apply from storage
                setFrozen(makeFreezeKey(ceSignalId, 'BUY'), { breakoutPrice: newSignal.breakoutPrice, breakoutTime: newSignal.breakoutTime.toISOString() }, true);
                applyFrozenToSignal(newSignal);

                // Set TP levels from ITM steps with near-below-square logic
                if (smd.itm_steps && smd.itm_steps.length > 0) {
                  const nxt1 = smd.itm_steps[0]?.smd;
                  const nxt2 = smd.itm_steps[1]?.smd;
                  newSignal.tp1Value = floorSquareBelow(nxt1) ?? 0; // e.g., 90.56 -> 81
                  newSignal.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0); // 90.56
                  newSignal.tp3Value = floorSquareBelow(nxt2) ?? 0; // 125.98 -> 121
                }
                
                // SL: next +2 OTM from this strike
                const slCE = slFromPlusTwoOTM(atmStrike, 'CE');
                if (slCE !== undefined) newSignal.slValue = slCE;
                
                newSignalsToAdd.push(newSignal);
                console.log(`🔥 New CE signal generated for ${symbol} ${atmStrike} at ${cePrice}`);
              } else {
                // Update existing CE signal to new TP mapping
                const nxt1 = smd.itm_steps?.[0]?.smd;
                const nxt2 = smd.itm_steps?.[1]?.smd;
                existingCE.tp1Value = floorSquareBelow(nxt1) ?? 0;
                existingCE.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                existingCE.tp3Value = floorSquareBelow(nxt2) ?? 0;
              }
            } else if (existingCE) {
              // Even if price is below SMD now, refresh TP mapping for existing signal
              const nxt1 = smd.itm_steps?.[0]?.smd;
              const nxt2 = smd.itm_steps?.[1]?.smd;
              existingCE.tp1Value = floorSquareBelow(nxt1) ?? 0;
              existingCE.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
              existingCE.tp3Value = floorSquareBelow(nxt2) ?? 0;
            }
            
            // Process PE signal
            const pePrice = atmOption.pe_ltp || 0;
            const peSignalId = `${symbol}_${atmStrike}_PE_ATM`;
            const existingPE = prevSignals.find(s => s.id === peSignalId);
            if (pePrice > smdValue) {
              if (!existingPE) {
                // New breakout signal for PE
                const newSignal: Signal = {
                  id: peSignalId,
                  symbol,
                  strike: atmStrike,
                  optionType: 'PE',
                  signalType: 'BUY',
                  breakoutPrice: smdValue,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: smdValue,
                  isActive: true,
                  currentPrice: pePrice
                };
                setFrozen(makeFreezeKey(peSignalId, 'BUY'), { breakoutPrice: newSignal.breakoutPrice, breakoutTime: newSignal.breakoutTime.toISOString() }, true);
                applyFrozenToSignal(newSignal);

                // Set TP levels from ITM steps with near-below-square logic
                if (smd.itm_steps && smd.itm_steps.length > 0) {
                  const nxt1 = smd.itm_steps[0]?.smd;
                  const nxt2 = smd.itm_steps[1]?.smd;
                  newSignal.tp1Value = floorSquareBelow(nxt1) ?? 0;
                  newSignal.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                  newSignal.tp3Value = floorSquareBelow(nxt2) ?? 0;
                }
                
                // SL: next +2 OTM from this strike
                const slPE = slFromPlusTwoOTM(atmStrike, 'PE');
                if (slPE !== undefined) newSignal.slValue = slPE;
                
                newSignalsToAdd.push(newSignal);
                console.log(`🔥 New PE signal generated for ${symbol} ${atmStrike} at ${pePrice}`);
              } else {
                // Update existing PE signal to new TP mapping
                const nxt1 = smd.itm_steps?.[0]?.smd;
                const nxt2 = smd.itm_steps?.[1]?.smd;
                existingPE.tp1Value = floorSquareBelow(nxt1) ?? 0;
                existingPE.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
                existingPE.tp3Value = floorSquareBelow(nxt2) ?? 0;
              }
            } else if (existingPE) {
              // Even if price is below SMD now, refresh TP mapping for existing signal
              const nxt1 = smd.itm_steps?.[0]?.smd;
              const nxt2 = smd.itm_steps?.[1]?.smd;
              existingPE.tp1Value = floorSquareBelow(nxt1) ?? 0;
              existingPE.tp2Value = (typeof nxt1 === 'number' ? nxt1 : 0);
              existingPE.tp3Value = floorSquareBelow(nxt2) ?? 0;
            }
          }
        }

  // Note: ITM signals are created only for marked steps using maybeCreateITMSignal

        // Helper to create a CE/PE signal from a specific OTM step index
        const maybeCreateOTMSignal = (idx: number) => {
          if (!smd.otm_steps || smd.otm_steps.length <= idx) return;
          const step = smd.otm_steps[idx];
          // CE side
          if (step?.ce_strike && step?.smd) {
            const opt = chain.option_chain.find((o: any) => o.strike_price === step.ce_strike);
            if (opt) {
              const ltp = opt.ce_ltp || 0;
              const id = `${symbol}_${step.ce_strike}_CE_OTM${idx}`;
              const existing = prevSignals.find(s => s.id === id);
              if (ltp > step.smd && !existing) {
                const nsBase: Signal = {
                  id,
                  symbol,
                  strike: step.ce_strike,
                  optionType: 'CE',
                  signalType: 'BUY',
                  breakoutPrice: step.smd,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: step.smd,
                  isActive: true,
                  currentPrice: ltp,
                };
                setFrozen(makeFreezeKey(id, 'BUY'), { breakoutPrice: nsBase.breakoutPrice, breakoutTime: nsBase.breakoutTime.toISOString() }, true);
                const ns: Signal = { ...nsBase };
                applyFrozenToSignal(ns);
                // Compute TP ladder moving toward ATM then ITM based on OTM index
                const tps = getOTMTargets(idx);
                // OTM logic per examples: TP1=squareBelow(first target), TP2=first target raw, TP3=squareBelow(second target)
                ns.tp1Value = floorSquareBelow(tps[0]) ?? 0;
                ns.tp2Value = (typeof tps[0] === 'number' ? tps[0] : 0);
                ns.tp3Value = floorSquareBelow(tps[1]) ?? 0;
                // SL
                const sl = slFromPlusTwoOTM(step.ce_strike, 'CE');
                if (sl !== undefined) ns.slValue = sl;
                newSignalsToAdd.push(ns);
                console.log(`🔥 New OTM CE signal generated for ${symbol} ${step.ce_strike} at ${ltp}`);
              } else if (existing) {
                // Refresh TP mapping on existing signal to reflect rounding rules
                const tps = getOTMTargets(idx);
                existing.tp1Value = floorSquareBelow(tps[0]) ?? 0;
                existing.tp2Value = (typeof tps[0] === 'number' ? tps[0] : 0);
                existing.tp3Value = floorSquareBelow(tps[1]) ?? 0;
              }
            }
          }
          // PE side
          if (step?.pe_strike && step?.smd) {
            const opt = chain.option_chain.find((o: any) => o.strike_price === step.pe_strike);
            if (opt) {
              const ltp = opt.pe_ltp || 0;
              const id = `${symbol}_${step.pe_strike}_PE_OTM${idx}`;
              const existing = prevSignals.find(s => s.id === id);
              if (ltp > step.smd && !existing) {
                const nsBase: Signal = {
                  id,
                  symbol,
                  strike: step.pe_strike,
                  optionType: 'PE',
                  signalType: 'BUY',
                  breakoutPrice: step.smd,
                  breakoutTime: new Date(),
                  smdKeyBuyValue: step.smd,
                  isActive: true,
                  currentPrice: ltp,
                };
                setFrozen(makeFreezeKey(id, 'BUY'), { breakoutPrice: nsBase.breakoutPrice, breakoutTime: nsBase.breakoutTime.toISOString() }, true);
                const ns: Signal = { ...nsBase };
                applyFrozenToSignal(ns);
                const tps = getOTMTargets(idx);
                ns.tp1Value = floorSquareBelow(tps[0]) ?? 0;
                ns.tp2Value = (typeof tps[0] === 'number' ? tps[0] : 0);
                ns.tp3Value = floorSquareBelow(tps[1]) ?? 0;
                const sl = slFromPlusTwoOTM(step.pe_strike, 'PE');
                if (sl !== undefined) ns.slValue = sl;
                newSignalsToAdd.push(ns);
                console.log(`🔥 New OTM PE signal generated for ${symbol} ${step.pe_strike} at ${ltp}`);
              } else if (existing) {
                // Refresh TP mapping on existing signal to reflect rounding rules
                const tps = getOTMTargets(idx);
                existing.tp1Value = floorSquareBelow(tps[0]) ?? 0;
                existing.tp2Value = (typeof tps[0] === 'number' ? tps[0] : 0);
                existing.tp3Value = floorSquareBelow(tps[1]) ?? 0;
              }
            }
          }
        };

  // Generate ONLY the requested categories on Signals page:
  // - ATM
  // - ITM steps: 1, 2, 3, 5  -> indices: 0, 1, 2, 4
  // - OTM steps: 1, 2, 3, 5  -> indices: 0, 1, 2, 4
  // ITM steps
  maybeCreateITMSignal(0); // ITM1
  maybeCreateITMSignal(1); // ITM2
  maybeCreateITMSignal(2); // ITM3
  maybeCreateITMSignal(4); // ITM5
  // OTM steps
  maybeCreateOTMSignal(0); // OTM1
  maybeCreateOTMSignal(1); // OTM2
  maybeCreateOTMSignal(2); // OTM3
  maybeCreateOTMSignal(4); // OTM5
      });

      // Update existing signals with current prices and check for TP/SL hits
      const updatedSignals = [...prevSignals];
      const flipSignals: Signal[] = [];
      updatedSignals.forEach(signal => {
        const chain = optionChainData[signal.symbol];
        if (!chain || !chain.option_chain) return;

        const option = chain.option_chain.find((opt: any) => opt.strike_price === signal.strike);
        if (!option) return;

        const currentPrice = signal.optionType === 'CE' ? (option.ce_ltp || 0) : (option.pe_ltp || 0);
        signal.currentPrice = currentPrice;

        // Direction-aware TP checks (BUY: price up to target; SELL: price down to target)
        const isBuy = signal.signalType === 'BUY';
        const tpHit = (target?: number, timeField?: Date | undefined) =>
          target !== undefined && !timeField && (isBuy ? currentPrice >= target : currentPrice <= target);

        // Check TP hits (freeze price and time when first hit)
        if (tpHit(signal.tp1Value, signal.tp1Time)) {
          const key = makeFreezeKey(signal.id, signal.signalType);
          const nowISO = new Date().toISOString();
          setFrozen(key, { tp1Price: currentPrice, tp1Time: nowISO }, true);
          const f = getFrozen(key);
          signal.tp1Price = f?.tp1Price ?? currentPrice;
          signal.tp1Time = f?.tp1Time ? new Date(f.tp1Time) : new Date(nowISO);
          console.log(`🎯 TP1 hit for ${signal.signalType} ${signal.symbol} ${signal.strike} ${signal.optionType} at ${currentPrice}`);
        }
        if (tpHit(signal.tp2Value, signal.tp2Time)) {
          const key = makeFreezeKey(signal.id, signal.signalType);
          const nowISO = new Date().toISOString();
          setFrozen(key, { tp2Price: currentPrice, tp2Time: nowISO }, true);
          const f = getFrozen(key);
          signal.tp2Price = f?.tp2Price ?? currentPrice;
          signal.tp2Time = f?.tp2Time ? new Date(f.tp2Time) : new Date(nowISO);
          console.log(`🎯 TP2 hit for ${signal.signalType} ${signal.symbol} ${signal.strike} ${signal.optionType} at ${currentPrice}`);
        }
        if (tpHit(signal.tp3Value, signal.tp3Time)) {
          const key = makeFreezeKey(signal.id, signal.signalType);
          const nowISO = new Date().toISOString();
          setFrozen(key, { tp3Price: currentPrice, tp3Time: nowISO }, true);
          const f = getFrozen(key);
          signal.tp3Price = f?.tp3Price ?? currentPrice;
          signal.tp3Time = f?.tp3Time ? new Date(f.tp3Time) : new Date(nowISO);
          console.log(`🎯 TP3 hit for ${signal.signalType} ${signal.symbol} ${signal.strike} ${signal.optionType} at ${currentPrice}`);
        }

    // Direction-aware SL checks (BUY: price down to SL; SELL: price up to SL)
  const slTriggered = signal.slValue !== undefined && !signal.slTime && (isBuy ? currentPrice <= (signal.slValue as number) : currentPrice >= (signal.slValue as number));
        if (slTriggered) {
          console.log(`🛑 SL hit for ${signal.signalType} ${signal.symbol} ${signal.strike} ${signal.optionType} at ${currentPrice}`);

          if (isBuy && !signal.hasFlipped) {
            // In-place flip: convert this BUY signal to SELL as requested
            const prevTp1 = signal.tp1Value;

            signal.signalType = 'SELL';
      // Freeze SELL breakout first time
  // Preserve original BUY breakout threshold/time; do not overwrite on SELL flip
            signal.hasFlipped = true;

            // Re-map targets for SELL using OTM SMD steps (downside targets for SELL)
            const smdForSymbol = smdData?.[signal.symbol];
            const otmSteps: any[] = smdForSymbol?.otm_steps || [];
            // Apply rounding pattern: TP1 rounded-down square, TP2 raw, TP3 rounded-down square
            signal.tp1Value = floorSquareBelow(otmSteps[0]?.smd) ?? 0;
            signal.tp2Value = (typeof otmSteps?.[1]?.smd === 'number' ? otmSteps[1].smd : 0);
            signal.tp3Value = floorSquareBelow(otmSteps[2]?.smd) ?? 0;
            signal.slValue = prevTp1 ?? signal.breakoutPrice; // upside stop

            // Reset TP/SL times and prices for the new SELL leg
            signal.tp1Time = undefined;
            signal.tp2Time = undefined;
            signal.tp3Time = undefined;
            signal.tp1Price = undefined;
            signal.tp2Price = undefined;
            signal.tp3Price = undefined;
            signal.slTime = undefined;
            signal.slPrice = undefined;
            signal.isActive = true; // keep it active post flip

            console.log(`↔️  Flipped in-place to SELL for ${signal.symbol} ${signal.strike} ${signal.optionType}`);
          } else {
            // Non-BUY (or already flipped) SL: just mark inactive once
            const key = makeFreezeKey(signal.id, signal.signalType);
            const nowISO = new Date().toISOString();
            setFrozen(key, { slPrice: currentPrice, slTime: nowISO }, true);
            const f = getFrozen(key);
            signal.slPrice = f?.slPrice ?? currentPrice;
            signal.slTime = f?.slTime ? new Date(f.slTime) : new Date(nowISO);
            signal.isActive = false;
          }
        }

        // Visual SL hit for SELL when current price is below SL (do not change active/flip logic)
        if (!isBuy && signal.slValue !== undefined && !signal.slTime && currentPrice <= (signal.slValue as number)) {
          const key = makeFreezeKey(signal.id, signal.signalType);
          const nowISO = new Date().toISOString();
          setFrozen(key, { slPrice: currentPrice, slTime: nowISO }, true);
          const f = getFrozen(key);
          signal.slPrice = f?.slPrice ?? currentPrice;
          signal.slTime = f?.slTime ? new Date(f.slTime) : new Date(nowISO);
        }
      });

      // Add new signals to existing ones
      newSignalsToAdd.forEach(newSignal => {
        if (!updatedSignals.find(s => s.id === newSignal.id)) {
          updatedSignals.push(newSignal);
        }
      });

      // Append any flip-generated signals
      flipSignals.forEach(flip => {
        if (!updatedSignals.find(s => s.id === flip.id)) {
          updatedSignals.push(flip);
        }
      });

      // Prune to ONLY the allowed categories:
      // ATM, ITM(1,2,3,5) and OTM(1,2,3,5)
      const catOf = (
        id: string
      ): 'ATM' | 'ITM1' | 'ITM2' | 'ITM3' | 'ITM5' | 'OTM1' | 'OTM2' | 'OTM3' | 'OTM5' | null => {
        if (id.includes('_ATM')) return 'ATM';
        // ITM indices -> human steps
        if (/_ITM0(\b|_)/.test(id)) return 'ITM1';
        if (/_ITM1(\b|_)/.test(id)) return 'ITM2';
        if (/_ITM2(\b|_)/.test(id)) return 'ITM3';
        if (/_ITM4(\b|_)/.test(id)) return 'ITM5';
        // OTM indices -> human steps
        if (/_OTM0(\b|_)/.test(id)) return 'OTM1';
        if (/_OTM1(\b|_)/.test(id)) return 'OTM2';
        if (/_OTM2(\b|_)/.test(id)) return 'OTM3';
        if (/_OTM4(\b|_)/.test(id)) return 'OTM5';
        return null;
      };

      const bestBySymbolCat = new Map<string, Signal>();
      // Keep the earliest breakout per symbol/category to satisfy freeze-visibility intent
      const isEarlier = (a?: Signal, b?: Signal) => {
        if (!a) return true;
        if (!b) return false;
        const at = a.breakoutTime ? new Date(a.breakoutTime).getTime() : Number.MAX_SAFE_INTEGER;
        const bt = b.breakoutTime ? new Date(b.breakoutTime).getTime() : Number.MAX_SAFE_INTEGER;
        return bt < at;
      };

      updatedSignals.forEach(s => {
        if (!symbolsToMonitor.includes(s.symbol as any)) return; // ignore unmonitored
        const cat = catOf(s.id);
        if (!cat) return; // drop categories outside allowed
        const key = `${s.symbol}__${cat}`;
        const prev = bestBySymbolCat.get(key);
        // Prefer the one that broke out earlier (first to appear). If none, set current.
        if (!prev || isEarlier(prev, s)) {
          bestBySymbolCat.set(key, s);
        }
      });

      const pruned = Array.from(bestBySymbolCat.values());
      console.log(`📈 Signal generation complete: +${newSignalsToAdd.length}, kept ${pruned.length} after pruning`);
  // Save pruned for cross-page persistence
  saveSignalsToStorage(pruned);
  return pruned;
    });
  }, [smdData, optionChainData, symbolsToMonitor]);

  // Fetch data and generate signals on mount and periodically
  useEffect(() => {
    if (symbolsToMonitor.length === 0) return;
    
    const fetchData = async () => {
      console.log(`Fetching data for symbols:`, symbolsToMonitor);
      await Promise.all([fetchSmdData(), fetchOptionChainData()]);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchSmdData, fetchOptionChainData, symbolsToMonitor]);

  // Generate signals when data changes
  useEffect(() => {
    if (Object.keys(smdData).length > 0 && Object.keys(optionChainData).length > 0) {
      generateSignals();
    }
  }, [smdData, optionChainData, generateSignals]);

  // Lightweight 1-second ticker: update currentPrice and TP/SL for one symbol per tick (round-robin)
  useEffect(() => {
    if (!symbolsToMonitor.length) return;

  let idx = 0;
  let inFlight = false;
    let isMounted = true;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      // Prioritize symbols that currently have active signals; else fall back to monitored list
  const activeSymbols = Array.from(new Set(signalsRef.current.map(s => s.symbol)));
  const pollList = activeSymbols.length ? activeSymbols : symbolsToMonitor;
      if (!pollList.length) return;

      const symbol = pollList[idx % pollList.length];
      idx = (idx + 1) % pollList.length;

      try {
        const data = await ApiService.getOptionChain(symbol as any);
        if (!isMounted || !data) return;

        // Update currentPrice and TP/SL for existing signals of this symbol without regenerating
        setSignals(prevSignals => {
          if (!prevSignals?.length) return prevSignals;
          const smdForSymbol = smdDataRef.current?.[symbol];
          const updated = prevSignals.map(sig => {
            if (sig.symbol !== symbol) return sig;
            const option = data?.option_chain?.find((opt: any) => opt.strike_price === sig.strike);
            if (!option) return sig;

            const next = { ...sig } as Signal;
            const currentPrice = sig.optionType === 'CE' ? (option.ce_ltp || 0) : (option.pe_ltp || 0);
            next.currentPrice = currentPrice;

            const isBuy = next.signalType === 'BUY';
            const tpHit = (target?: number, timeField?: Date | undefined) =>
              target !== undefined && !timeField && (isBuy ? currentPrice >= target : currentPrice <= target);

            // TP checks with freeze semantics
            if (tpHit(next.tp1Value, next.tp1Time)) {
              const key = makeFreezeKey(next.id, next.signalType);
              const nowISO = new Date().toISOString();
              setFrozen(key, { tp1Price: currentPrice, tp1Time: nowISO }, true);
              const f = getFrozen(key);
              next.tp1Price = f?.tp1Price ?? currentPrice;
              next.tp1Time = f?.tp1Time ? new Date(f.tp1Time) : new Date(nowISO);
            }
            if (tpHit(next.tp2Value, next.tp2Time)) {
              const key = makeFreezeKey(next.id, next.signalType);
              const nowISO = new Date().toISOString();
              setFrozen(key, { tp2Price: currentPrice, tp2Time: nowISO }, true);
              const f = getFrozen(key);
              next.tp2Price = f?.tp2Price ?? currentPrice;
              next.tp2Time = f?.tp2Time ? new Date(f.tp2Time) : new Date(nowISO);
            }
            if (tpHit(next.tp3Value, next.tp3Time)) {
              const key = makeFreezeKey(next.id, next.signalType);
              const nowISO = new Date().toISOString();
              setFrozen(key, { tp3Price: currentPrice, tp3Time: nowISO }, true);
              const f = getFrozen(key);
              next.tp3Price = f?.tp3Price ?? currentPrice;
              next.tp3Time = f?.tp3Time ? new Date(f.tp3Time) : new Date(nowISO);
            }

            // SL check and flip behavior
            const slTriggered = next.slValue !== undefined && !next.slTime && (isBuy ? currentPrice <= (next.slValue as number) : currentPrice >= (next.slValue as number));
            if (slTriggered) {
              if (isBuy && !next.hasFlipped) {
                const prevTp1 = next.tp1Value;
                next.signalType = 'SELL';
                const nowISO = new Date().toISOString();
                setFrozen(makeFreezeKey(next.id, 'SELL'), { breakoutPrice: currentPrice, breakoutTime: nowISO }, true);
                const f = getFrozen(makeFreezeKey(next.id, 'SELL'));
                next.breakoutPrice = f?.breakoutPrice ?? currentPrice;
                next.breakoutTime = f?.breakoutTime ? new Date(f.breakoutTime) : new Date(nowISO);
                next.hasFlipped = true;
                // Map SELL targets using OTM steps with rounding
                const otmSteps: any[] = smdForSymbol?.otm_steps || [];
                next.tp1Value = floorSquareBelow(otmSteps[0]?.smd) ?? 0;
                next.tp2Value = (typeof otmSteps?.[1]?.smd === 'number' ? otmSteps[1].smd : 0);
                next.tp3Value = floorSquareBelow(otmSteps[2]?.smd) ?? 0;
                next.slValue = prevTp1 ?? next.breakoutPrice;
                // Reset hit states
                next.tp1Time = undefined; next.tp1Price = undefined;
                next.tp2Time = undefined; next.tp2Price = undefined;
                next.tp3Time = undefined; next.tp3Price = undefined;
                next.slTime = undefined; next.slPrice = undefined;
                next.isActive = true;
              } else {
                const key = makeFreezeKey(next.id, next.signalType);
                const nowISO = new Date().toISOString();
                setFrozen(key, { slPrice: currentPrice, slTime: nowISO }, true);
                const f = getFrozen(key);
                next.slPrice = f?.slPrice ?? currentPrice;
                next.slTime = f?.slTime ? new Date(f.slTime) : new Date(nowISO);
                next.isActive = false;
              }
            }

            // Visual SL hit for SELL when current price is below SL (do not change active/flip logic)
            if (!isBuy && next.slValue !== undefined && !next.slTime && currentPrice <= (next.slValue as number)) {
              const key = makeFreezeKey(next.id, next.signalType);
              const nowISO = new Date().toISOString();
              setFrozen(key, { slPrice: currentPrice, slTime: nowISO }, true);
              const f = getFrozen(key);
              next.slPrice = f?.slPrice ?? currentPrice;
              next.slTime = f?.slTime ? new Date(f.slTime) : new Date(nowISO);
            }

            return next;
          });

          // Persist after updates
          saveSignalsToStorage(updated);
          return updated;
        });
      } catch (e) {
        // Swallow errors to keep the ticker running
        // eslint-disable-next-line no-console
        console.warn('Ticker update failed for', symbol, e);
      } finally {
        inFlight = false;
      }
    };

    const id = setInterval(tick, 1000);
    return () => { isMounted = false; clearInterval(id); };
  }, [symbolsToMonitor]);

  return (
    <PageWrap>
      <Title>SMD Key Buy Signals</Title>
      
      <ControlsSection>
        <MajorSymbolsInfo>
          <strong>Major Symbols Always Monitored:</strong> NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY, SENSEX, COPPER, CRUDEOIL, CRUDEOILM, GOLD, GOLDM, NATGASMINI, NATURALGAS, SILVER, SILVERM, ZINC
        </MajorSymbolsInfo>
        
        <DropdownContainer>
          <label>Additional Stock: </label>
          <CategorySelect
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select Stock (Optional)</option>
            {stocksList.map(stock => (
              <option key={stock} value={stock}>{stock}</option>
            ))}
          </CategorySelect>
          
          {!isLoading && (
            <SymbolCount>
              Monitoring {symbolsToMonitor.length} symbols
            </SymbolCount>
          )}
        </DropdownContainer>

        <ActionsRow>
          <DownloadButton onClick={handleDownloadTP1PDF} disabled={tp1HitCount === 0}>
            Download TP1 Hits ({tp1HitCount})
          </DownloadButton>
        </ActionsRow>
      </ControlsSection>

      {isLoading ? (
        <LoadingText>Loading stocks list...</LoadingText>
      ) : (
        <SignalsContainer>
          {signals.map(signal => (
            <SignalCard key={signal.id} isActive={signal.isActive} signalType={signal.signalType}>
              <SignalTitle>
                <SymbolBadge>{signal.symbol}</SymbolBadge>
                <StrikeBadge>{signal.strike} {signal.optionType}</StrikeBadge>
                <SignalTypeBadge signalType={signal.signalType}>
                  {signal.signalType}
                </SignalTypeBadge>
              </SignalTitle>
              <SignalMetaRow>
                <DataRow>
                  <Label>Breakout Price:</Label>
                  <Value highlight>{signal.breakoutPrice.toFixed(2)}</Value>
                </DataRow>
                <DataRow>
                  <Label>Breakout Time:</Label>
                  <HitTime>{formatTime(signal.breakoutTime)}</HitTime>
                </DataRow>
                <DataRow>
                  <Label>Current Price:</Label>
                  <Value>{signal.currentPrice.toFixed(2)}</Value>
                </DataRow>
                
                <DataRow>
                  <Label>TP1:</Label>
                  <Value highlight={!!signal.tp1Time}>
                    {signal.tp1Value !== undefined ? signal.tp1Value.toFixed(2) : '-'}
                    {signal.tp1Price !== undefined && ` (Hit: ${signal.tp1Price.toFixed(2)})`}
                  </Value>
                </DataRow>
                <DataRow>
                  <Label>TP1 Hit Time:</Label>
                  <HitTime color="#00c853">{signal.tp1Time ? formatTime(signal.tp1Time) : '-'}</HitTime>
                </DataRow>

                <DataRow>
                  <Label>TP2:</Label>
                  <Value highlight={!!signal.tp2Time}>
                    {signal.tp2Value !== undefined ? signal.tp2Value.toFixed(2) : '-'}
                    {signal.tp2Price !== undefined && ` (Hit: ${signal.tp2Price.toFixed(2)})`}
                  </Value>
                </DataRow>
                <DataRow>
                  <Label>TP2 Hit Time:</Label>
                  <HitTime color="#00c853">{signal.tp2Time ? formatTime(signal.tp2Time) : '-'}</HitTime>
                </DataRow>

                <DataRow>
                  <Label>TP3:</Label>
                  <Value highlight={!!signal.tp3Time}>
                    {signal.tp3Value !== undefined ? signal.tp3Value.toFixed(2) : '-'}
                    {signal.tp3Price !== undefined && ` (Hit: ${signal.tp3Price.toFixed(2)})`}
                  </Value>
                </DataRow>
                <DataRow>
                  <Label>TP3 Hit Time:</Label>
                  <HitTime color="#00c853">{signal.tp3Time ? formatTime(signal.tp3Time) : '-'}</HitTime>
                </DataRow>

                <DataRow>
                  <Label>SL:</Label>
                  <Value highlight={!!signal.slTime} color={signal.slTime ? '#ff5722' : '#fff'}>
                    {signal.slValue !== undefined ? signal.slValue.toFixed(2) : '-'}
                    {signal.slPrice !== undefined && ` (Hit: ${signal.slPrice.toFixed(2)})`}
                  </Value>
                </DataRow>
                <DataRow>
                  <Label>SL Hit Time:</Label>
                  <HitTime color="#ff5722">{signal.slTime ? formatTime(signal.slTime) : '-'}</HitTime>
                </DataRow>
                
                <Status active={signal.isActive}>
                  {signal.isActive ? 'Active' : 'Inactive'}
                </Status>
              </SignalMetaRow>
            </SignalCard>
          ))}
          
          {signals.length === 0 && !isLoading && (
            <NoSignalsMessage>
              <div>No signals generated yet. Monitoring for SMD Key Buy breakouts...</div>
              <NoSignalsNote>
                Symbols being monitored: {symbolsToMonitor.join(', ')}
              </NoSignalsNote>
            </NoSignalsMessage>
          )}
        </SignalsContainer>
      )}
    </PageWrap>
  );
};

export default SignalPage;
