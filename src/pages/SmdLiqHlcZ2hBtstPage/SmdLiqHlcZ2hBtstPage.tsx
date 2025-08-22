import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { io, Socket } from 'socket.io-client';
import { ApiService } from '../../services/ApiService';
import { Symbol } from '../../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore - typings for autotable may not be present
import autoTable from 'jspdf-autotable';

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 50%, #1e1e1e 100%);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #333;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(90deg, #fff200, #ffed4e, #fff200);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(255, 242, 0, 0.2);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  color: #000;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  margin: 10px 0 0 0;
  color: #333;
  font-weight: 500;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.h3`
  color: #fff200;
  font-size: 1.3rem;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionIcon = styled.span`
  font-size: 1.5rem;
`;

const MetricValue = styled.div<{ isPositive?: boolean; isNegative?: boolean }>`
  color: ${props => 
    props.isPositive ? '#4ade80' : 
    props.isNegative ? '#ef4444' : 
    '#fff200'};
  font-size: 1.4rem;
  font-weight: bold;
`;

const ControlsSection = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const ControlsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  color: #ccc;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Select = styled.select`
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #e0e0e0;
  padding: 8px 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #fff200;
    box-shadow: 0 0 0 2px rgba(255, 242, 0, 0.2);
  }

  option {
    background: #1a1a1a;
    color: #e0e0e0;
  }
`;


const ActionButton = styled.button`
  background: linear-gradient(135deg, #fff200 0%, #ffed4e 100%);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(255, 242, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 242, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #444;
    color: #888;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusIndicator = styled.div<{ status: 'active' | 'inactive' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(74, 222, 128, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(239, 68, 68, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#4ade80';
      case 'warning': return '#f59e0b';
      default: return '#ef4444';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return 'rgba(74, 222, 128, 0.2)';
      case 'warning': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(239, 68, 68, 0.2)';
    }
  }};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 242, 0, 0.3);
  border-radius: 50%;
  border-top-color: #fff200;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingContainer = styled.div`
  color: #999;
  text-align: center;
  padding: 40px;
`;

const LoadingText = styled.div`
  margin-top: 10px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const UniverseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin: 20px 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const UniverseCard = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #fff200;
    box-shadow: 0 4px 15px rgba(255, 242, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const UniverseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const UniverseSymbol = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff200;
`;

const UniverseTradingSymbol = styled.div`
  font-size: 0.8rem;
  color: #999;
`;

const UniverseExpiry = styled.div`
  font-size: 0.8rem;
  color: #ccc;
  margin-bottom: 12px;
`;

const UniverseStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
`;

const UniverseStat = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px;
`;

const UniverseStatLabel = styled.div`
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 2px;
`;

const UniverseStatValue = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #e0e0e0;
`;

const TableContainer = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #333;
  border-radius: 12px;
  overflow: hidden;
  margin: 20px 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const TableHeader = styled.thead`
  background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
`;

const TableHeaderCell = styled.th`
  padding: 12px 8px;
  text-align: left;
  color: #fff200;
  font-weight: 600;
  border-bottom: 1px solid #444;
  white-space: nowrap;

  &.text-right {
    text-align: right;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #333;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(255, 242, 0, 0.05);
  }
`;

const TableCell = styled.td<{ positive?: boolean; negative?: boolean }>`
  padding: 10px 8px;
  color: ${props => 
    props.positive ? '#4ade80' : 
    props.negative ? '#ef4444' : 
    '#e0e0e0'};
  white-space: nowrap;

  &.text-right {
    text-align: right;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #333;
  border-radius: 8px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  margin-right: 8px;
  accent-color: #fff200;
`;

const ExportButton = styled(ActionButton)`
  padding: 8px 16px;
  font-size: 0.8rem;
  margin-left: 8px;
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ccc;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #666;
    color: #e0e0e0;
  }
`;

const FlexContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetricCard = styled.div<{ selected?: boolean }>`
  margin: 2px;
  padding: 8px 12px;
  background: ${props => props.selected ? 'rgba(255, 242, 0, 0.2)' : 'transparent'};
  cursor: pointer;
`;

const CalibrationStatus = styled.div<{ success?: boolean }>`
  margin: 20px 0;
  padding: 15px;
  background: ${props => props.success ? 'rgba(74, 222, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
  border-radius: 8px;
  border: 1px solid ${props => props.success ? 'rgba(74, 222, 128, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
`;

const CalibrationHeader = styled.div`
  color: #4ade80;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CalibrationInfo = styled.div`
  color: #ccc;
  font-size: 0.9rem;
`;

const SymbolTag = styled.div`
  padding: 4px 8px;
  background: rgba(255, 242, 0, 0.1);
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fff200;
  border: 1px solid rgba(255, 242, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 242, 0, 0.2);
    transform: translateY(-1px);
  }
`;

// Row container for selected symbols chips (replaces inline styles)
const SelectedSymbolsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
`;

// Row container for weight tags (replaces inline styles)
const WeightTagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

// Highlighted symbol text in calibration table
const SymbolName = styled.div`
  font-weight: bold;
  color: #fff200;
`;

const WeightTag = styled.div`
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.7rem;
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// ---------- Types (aligned with backend payloads) ----------

type UniverseParent = {
  parent_token: number;
  symbol: string;
  tradingsymbol: string;
  expiry: string;
  step: number;
  children_total: number;
  ce_count: number;
  pe_count: number;
  window: number;
};

type UniverseResponse = {
  parents: UniverseParent[];
  children_total: number;
  config: Record<string, any>;
};

// Minimal signal payload (subset) — extend as your backend emits
export type SignalPayload = {
  ts?: number; // epoch seconds
  event?: string; // BUY/TP/SL/EXIT/PRZ/HLC
  symbol?: string; // parent symbol
  token?: number; // parent token
  strike?: number; // strike price
  expiry?: string; // expiry date
  tradingsymbol?: string; // full trading symbol
  price?: number; // ltp
  current_price?: number; // live price when available
  side?: "LONG" | "SHORT" | string;
  strategy?: string; // Z2H/BTST/SMDLIQ etc.
  key?: string; // ATM1/ATM2/...
  sl?: number;
  tp?: number;
  prz_low?: number;
  prz_high?: number;
  prz_mid?: number;
  prz_score?: number;
  prz_slope?: number; // optional (if enabled)
  earth_res?: number;
  earth_sup?: number;
  hlc_bias?: string; // NearHigh / NearLow / Neutral
  lot?: number;
  pnl?: number;
  note?: string;
};

// ---------- Calibration Types ----------

export type CalibrationConfig = {
  earth_factor: number;
  hlc_band: number;
  eps_eq: {
    a: number;
    b: number;
    min: number;
    max: number;
  };
  score_weights: {
    [key: string]: number;
  };
};

export type CalibrationData = {
  generated_at: string;
  days: number;
  symbols: {
    [symbol: string]: CalibrationConfig;
  };
};

export type DailyBar = {
  t: number; // epoch seconds
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
};

export type IV20Data = {
  t: number; // epoch seconds
  iv20: number;
};

// ---------- Helpers ----------

const fmt = (n?: number, d = 2) => (n == null ? "-" : n.toFixed(d));
const fromEpoch = (t?: number) =>
  t ? new Date(t * 1000).toLocaleString() : new Date().toLocaleString();

function useSocketIO(url: string, onMsg: (data: any) => void, setConnected: (connected: boolean) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cleanup = false;
    
  // Assume disconnected until the socket connects
  setConnected(false);

    const connect = () => {
      if (cleanup) return;
      
    try {
        console.log('🔄 Connecting to SocketIO:', url);
        
        const socket = io(url, {
          // Temporary: force polling to avoid OS-level WS aborts
          transports: ['polling'],
          path: '/socket.io',
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 2000,           // start at 2s
          reconnectionDelayMax: 30000,       // cap at 30s
          randomizationFactor: 0.5,          // jitter
          autoConnect: true,
          // Allow upgrade to WebSocket when possible, but don't "stick" if it fails once
          upgrade: false,
          rememberUpgrade: false,
          forceNew: false,
          withCredentials: false,
          timestampRequests: false,
        });
        
        socketRef.current = socket;
        
        socket.on('connect', () => {
          console.log('✅ SocketIO connected to', url);
          setConnected(true);
        });
        
        socket.on('disconnect', (reason) => {
          console.log('❌ SocketIO disconnected:', reason);
          setConnected(false);
        });
        
        socket.on('connect_error', (error) => {
          console.error('❌ SocketIO connection error:', error);
          setConnected(false);
        });

        socket.on('reconnect_attempt', (n) => {
          console.log('🔁 SocketIO reconnect attempt', n);
          setConnected(false);
        });
        socket.on('reconnect_failed', () => {
          console.warn('⚠️ SocketIO reconnect failed');
          setConnected(false);
        });
        
        // Listen for signal data
        socket.on('signal', (data) => {
          console.log('📡 Received signal:', data);
          onMsg(data);
        });
        
        // Listen for sharp_pro_signal events (backend is emitting these)
        socket.on('sharp_pro_signal', (data) => {
          // Log all sharp_pro_signal events to understand the data structure
          console.log('📡 Received sharp_pro_signal:', data);
          onMsg(data);
        });
        
        // Listen for any other messages
        socket.on('message', (data) => {
          console.log('📨 Received message:', data);
          onMsg(data);
        });

        // Listen for market data events
        socket.on('market_data', (data) => {
          console.log('📈 Received market data:', data);
          onMsg(data);
        });

        // Listen for real-time updates
        socket.on('real_time_update', (data) => {
          console.log('📊 Received real-time update:', data);
          onMsg(data);
        });
        
      } catch (error) {
        console.error('❌ SocketIO setup error:', error);
  setConnected(false);
      }
    };

    connect();
    
    return () => {
      cleanup = true;
      if (socketRef.current) {
        console.log('🔌 Disconnecting SocketIO');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
  // Reflect disconnected status on cleanup
  setConnected(false);
    };
  }, [url, onMsg, setConnected]);

  return socketRef.current;
}

// ---------- Calibration Functions ----------

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

const bestEarthFactor = (daily: DailyBar[]): number => {
  if (daily.length < 40) return 0.2611;
  
  const grid: number[] = [];
  for (let i = 0; i <= Math.floor((0.32 - 0.18) / 0.005); i++) {
    grid.push(0.18 + i * 0.005);
  }
  
  let bestF = 0.2611;
  let bestF1 = -1.0;
  
  for (const f of grid) {
    let tpHits = 0, tpPred = 0, tpReal = 0;
    
    for (let i = 1; i < daily.length - 1; i++) {
      const ph = daily[i - 1].h;
      const pl = daily[i - 1].l;
      const po = daily[i].o;
      const rng = Math.max(0.0, ph - pl);
      
      if (rng === 0) continue;
      
      const up = po + f * rng;
      const dn = po - f * rng;
      const nx = daily[i + 1];
      const touch = (nx.h >= up) || (nx.l <= dn);
      const pred = true; // we always predict "one of the bands is hittable"
      
      if (pred) tpPred += 1;
      if (touch) tpReal += 1;
      if (pred && touch) tpHits += 1;
    }
    
    const prec = tpPred ? tpHits / tpPred : 0;
    const rec = tpReal ? tpHits / tpReal : 0;
    const f1 = (prec + rec) === 0 ? 0 : 2 * prec * rec / (prec + rec);
    
    if (f1 > bestF1 || (Math.abs(f1 - bestF1) < 1e-6 && f < bestF)) {
      bestF = f;
      bestF1 = f1;
    }
  }
  
  return Math.round(bestF * 10000) / 10000;
};

const hlcBand = (daily: DailyBar[]): number => {
  if (daily.length < 40) return 0.10;
  
  const atr: number[] = [];
  let trPrev: number | null = null;
  
  for (let i = 1; i < daily.length; i++) {
    const h = daily[i].h;
    const l = daily[i].l;
    const c1 = daily[i - 1].c;
    const tr = Math.max(h - l, Math.abs(h - c1), Math.abs(l - c1));
    trPrev = trPrev === null ? tr : 0.9 * trPrev + 0.1 * tr;
    atr.push(trPrev);
  }
  
  const rng20: number[] = [];
  for (let i = 19; i < daily.length; i++) {
    const slice = daily.slice(i - 19, i + 1);
    const hi = Math.max(...slice.map(x => x.h));
    const lo = Math.min(...slice.map(x => x.l));
    rng20.push(hi - lo);
  }
  
  const n = Math.min(atr.length, rng20.length);
  if (n === 0) return 0.10;
  
  const bands: number[] = [];
  for (let i = 0; i < n; i++) {
    const denom = rng20[i] > 0 ? rng20[i] : 1.0;
    bands.push(clamp(atr[i] / denom, 0.06, 0.18));
  }
  
  bands.sort((a, b) => a - b);
  const median = bands.length % 2 === 0 
    ? (bands[Math.floor(bands.length / 2) - 1] + bands[Math.floor(bands.length / 2)]) / 2
    : bands[Math.floor(bands.length / 2)];
  
  return Math.round(median * 10000) / 10000;
};

const epsByIV = (iv20Series: IV20Data[]): { a: number; b: number } => {
  if (!iv20Series.length) return { a: 0.20, b: 0.0 };
  
  const xs = iv20Series.map(item => item.iv20).filter(iv => iv !== null && iv !== undefined);
  if (!xs.length) return { a: 0.20, b: 0.0 };
  
  xs.sort((a, b) => a - b);
  const med = xs.length % 2 === 0 
    ? (xs[Math.floor(xs.length / 2) - 1] + xs[Math.floor(xs.length / 2)]) / 2
    : xs[Math.floor(xs.length / 2)];
  
  const X: number[][] = [];
  const Y: number[] = [];
  
  for (const iv of xs) {
    const target = 0.18 + 0.6 * Math.max(0.0, iv - med);
    X.push([1.0, iv]);
    Y.push(target);
  }
  
  // Least squares for [a, b]
  const s00 = X.reduce((sum, x) => sum + x[0] * x[0], 0);
  const s01 = X.reduce((sum, x) => sum + x[0] * x[1], 0);
  const s11 = X.reduce((sum, x) => sum + x[1] * x[1], 0);
  const y0 = X.reduce((sum, x, i) => sum + x[0] * Y[i], 0);
  const y1 = X.reduce((sum, x, i) => sum + x[1] * Y[i], 0);
  
  const det = s00 * s11 - s01 * s01;
  if (Math.abs(det) < 1e-9) return { a: 0.20, b: 0.0 };
  
  const a = (y0 * s11 - s01 * y1) / det;
  const b = (s00 * y1 - s01 * y0) / det;
  
  return {
    a: Math.round(a * 10000) / 10000,
    b: Math.round(b * 10000) / 10000
  };
};

const scoreWeights = (daily: DailyBar[]): { [key: string]: number } => {
  // Simplified weights - in real implementation, calculate correlations with next-day returns
  return {
    "PRZ": 1.0,
    "Confluence": 1.0,
    "Regime": 1.0,
    "Momentum": 1.0,
    "Liquidity": 1.0
  };
};

const calibrateSymbol = async (symbol: string, days: number): Promise<CalibrationConfig> => {
  try {
    // In a real implementation, fetch historical data from your API
    // For now, we'll use mock data or fallback calculations
    const mockDaily: DailyBar[] = [];
    const mockIV20: IV20Data[] = [];
    
    // Generate mock historical data for demonstration
    const now = Math.floor(Date.now() / 1000);
    for (let i = days - 1; i >= 0; i--) {
      const t = now - (i * 24 * 60 * 60);
      const basePrice = symbol === 'NIFTY' ? 23000 : symbol === 'BANKNIFTY' ? 51000 : 25000;
      const volatility = 0.02 + Math.random() * 0.03;
      const change = (Math.random() - 0.5) * volatility * basePrice;
      
      mockDaily.push({
        t,
        o: basePrice + change,
        h: basePrice + change + Math.random() * volatility * basePrice * 0.5,
        l: basePrice + change - Math.random() * volatility * basePrice * 0.5,
        c: basePrice + change + (Math.random() - 0.5) * volatility * basePrice * 0.3,
        v: 100000 + Math.random() * 50000
      });
      
      mockIV20.push({
        t,
        iv20: 0.15 + Math.random() * 0.25
      });
    }
    
    const earthFactor = bestEarthFactor(mockDaily);
    const hlcBandValue = hlcBand(mockDaily);
    const epsValues = epsByIV(mockIV20);
    const weights = scoreWeights(mockDaily);
    
    return {
      earth_factor: earthFactor,
      hlc_band: hlcBandValue,
      eps_eq: {
        a: epsValues.a,
        b: epsValues.b,
        min: 0.10,
        max: 0.35
      },
      score_weights: weights
    };
  } catch (error) {
    console.error(`Error calibrating ${symbol}:`, error);
    // Return default values on error
    return {
      earth_factor: 0.2611,
      hlc_band: 0.10,
      eps_eq: {
        a: 0.20,
        b: 0.0,
        min: 0.10,
        max: 0.35
      },
      score_weights: {
        "PRZ": 1.0,
        "Confluence": 1.0,
        "Regime": 1.0,
        "Momentum": 1.0,
        "Liquidity": 1.0
      }
    };
  }
};

const SmdLiqHlcZ2hBtstPage: React.FC = () => {
  const [universe, setUniverse] = useState<UniverseParent[]>([]);
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  const [signals, setSignals] = useState<SignalPayload[]>([]);
  const [filters, setFilters] = useState({
    symbol: "ALL",
    onlyInPlay: true, // PRZ/HLC in-play
    event: "ALL",
  });

  // ----------- Live Signals export helpers -----------
  const exportLiveSignalsToXlsx = useCallback((rows: SignalPayload[]) => {
    const data = rows.map((s, i) => ({
      'S.No': i + 1,
      'Time': s.ts ? new Date(s.ts * 1000).toLocaleString() : '-',
      'Symbol': s.symbol ?? '-',
      'Strike': s.strike ?? '-',
      'Expiry': s.expiry ?? '-',
      'Event': s.event ?? '-',
      'Level Price': s.tp ?? s.sl ?? s.prz_mid ?? s.price ?? '-',
      'Price': s.price ?? '-',
      'Current Price': (s as any).current_price ?? s.price ?? '-',
      'Side': s.side ?? '-',
      'Key': s.key ?? '-',
      'SL': s.sl ?? '-',
      'TP': s.tp ?? '-',
      'PRZ Range': s.prz_low != null ? `${s.prz_low}–${s.prz_high}` : '-',
      'Score': s.prz_score ?? '-',
      'HLC Bias': s.hlc_bias ?? '-',
      'P&L': s.pnl ?? '-',
      'Notes': s.note ?? ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Live Signals');
    const filename = `Live_Signals_${new Date().toISOString().replace(/[:T]/g,'_').slice(0,19)}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, []);

  const exportLiveSignalsToCsv = useCallback((rows: SignalPayload[]) => {
    const header = ['Time','Symbol','Strike','Expiry','Event','Level Price','Price','Current Price','Side','Key','SL','TP','PRZ Range','Score','HLC Bias','P&L','Notes'];
    const csvRows = rows.map(s => [
      s.ts ? new Date(s.ts * 1000).toLocaleString() : '-',
      s.symbol ?? '-',
      s.strike ?? '-',
      s.expiry ?? '-',
      s.event ?? '-',
      s.tp ?? s.sl ?? s.prz_mid ?? s.price ?? '-',
      s.price ?? '-',
      (s as any).current_price ?? s.price ?? '-',
      s.side ?? '-',
      s.key ?? '-',
      s.sl ?? '-',
      s.tp ?? '-',
      s.prz_low != null ? `${s.prz_low}–${s.prz_high}` : '-',
      s.prz_score ?? '-',
      s.hlc_bias ?? '-',
      s.pnl ?? '-',
      (s.note ?? '').toString().replace(/\n/g,' ')
    ]);
    const csv = [header, ...csvRows].map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Live_Signals_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportLiveSignalsToPdf = useCallback((rows: SignalPayload[]) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Live Signals Feed', 14, 16);
    const head = [[
      'Time','Symbol','Strike','Expiry','Event','Level Price','Price','Current Price','Side','Key','SL','TP','PRZ Range','Score','HLC Bias','P&L','Notes'
    ]];
    const body = rows.map(s => [
      s.ts ? new Date(s.ts * 1000).toLocaleString() : '-',
      s.symbol ?? '-',
      s.strike ?? '-',
      s.expiry ?? '-',
      s.event ?? '-',
      s.tp ?? s.sl ?? s.prz_mid ?? s.price ?? '-',
      s.price ?? '-',
      (s as any).current_price ?? s.price ?? '-',
      s.side ?? '-',
      s.key ?? '-',
      s.sl ?? '-',
      s.tp ?? '-',
      s.prz_low != null ? `${s.prz_low}–${s.prz_high}` : '-',
      s.prz_score ?? '-',
      s.hlc_bias ?? '-',
      s.pnl ?? '-',
      s.note ?? ''
    ]);
    autoTable(doc, {
      head,
      body,
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 242, 0], textColor: [0,0,0] },
      columnStyles: {
        0: { cellWidth: 28 }, 1: { cellWidth: 20 }, 2: { cellWidth: 16 }, 3: { cellWidth: 22 },
        4: { cellWidth: 16 }, 5: { cellWidth: 20 }, 6: { cellWidth: 18 }, 7: { cellWidth: 22 },
        8: { cellWidth: 14 }, 9: { cellWidth: 14 }, 10: { cellWidth: 16 }, 11: { cellWidth: 16 },
        12: { cellWidth: 26 }, 13: { cellWidth: 14 }, 14: { cellWidth: 18 }, 15: { cellWidth: 16 },
        16: { cellWidth: 40 }
      }
    });
    doc.save(`Live_Signals_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.pdf`);
  }, []);

  // Additional state for enhanced features
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Caches to resolve missing Strike/Expiry in live feed
  const [aspCache, setAspCache] = useState<Record<string, any>>({});
  const [expiryCache, setExpiryCache] = useState<Record<string, string>>({});
  const aspFetchRef = useRef<Record<string, boolean>>({});
  const expFetchRef = useRef<Record<string, boolean>>({});

  // Symbol data from API
  const [allSymbols, setAllSymbols] = useState<{
    indices: Symbol[];
    stocks: Symbol[];
    commodities: Symbol[];
    stocks_with_options: Symbol[];
  }>({
    indices: [],
    stocks: [],
    commodities: [],
    stocks_with_options: []
  });

  // Calibration state
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [calibrationLoading, setCalibrationLoading] = useState(false);
  const [calibrationDays, setCalibrationDays] = useState<number>(90);
  const [selectedCalibrationSymbols, setSelectedCalibrationSymbols] = useState<string[]>(['NIFTY', 'BANKNIFTY']);

  // Load symbols from API first
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        setApiStatus('connecting');
        console.log('🔄 Loading symbols from API...');
        
        // Try to get API status first
        try {
          await ApiService.getApiStatus();
          setApiStatus('connected');
          console.log('✅ API is available');
        } catch (e) {
          setApiStatus('disconnected');
          console.warn('⚠️ API status check failed, using fallback data');
        }

        // Load all symbols
        const symbolsData = await ApiService.getAllSymbolsFull();
        console.log('📦 Loaded symbols:', symbolsData);
        
        setAllSymbols(symbolsData);
        
        // Create universe data from symbols
        const universeData: UniverseParent[] = [
          // Indices
          ...symbolsData.indices.map((symbol, index) => ({
            parent_token: 256265 + index,
            symbol,
            tradingsymbol: `${symbol}25FEB`,
            expiry: '2025-02-27',
            step: symbol === 'BANKNIFTY' ? 100 : 50,
            children_total: symbol === 'NIFTY' ? 200 : symbol === 'BANKNIFTY' ? 160 : 120,
            ce_count: symbol === 'NIFTY' ? 100 : symbol === 'BANKNIFTY' ? 80 : 60,
            pe_count: symbol === 'NIFTY' ? 100 : symbol === 'BANKNIFTY' ? 80 : 60,
            window: 10
          })),
          // Top commodities
          ...symbolsData.commodities.slice(0, 5).map((symbol, index) => ({
            parent_token: 300000 + index,
            symbol,
            tradingsymbol: `${symbol}25FEB`,
            expiry: '2025-02-28',
            step: 100,
            children_total: 80,
            ce_count: 40,
            pe_count: 40,
            window: 8
          })),
          // Top stocks with options
          ...symbolsData.stocks_with_options.slice(0, 10).map((symbol, index) => ({
            parent_token: 400000 + index,
            symbol,
            tradingsymbol: `${symbol}25FEB`,
            expiry: '2025-02-27',
            step: symbol.includes('RELIANCE') ? 50 : 10,
            children_total: 60,
            ce_count: 30,
            pe_count: 30,
            window: 6
          }))
        ];

        setUniverse(universeData);
        setCfg({ 
          bar_sec: 300, 
          cap_nearest_per_side: 10, 
          window: 10,
          total_symbols: symbolsData.indices.length + symbolsData.stocks.length + symbolsData.commodities.length
        });

      } catch (error) {
        console.error('❌ Error loading symbols:', error);
        setApiStatus('disconnected');
        
        // Fallback to hardcoded data
        const fallbackSymbols = {
          indices: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'] as Symbol[],
          stocks: ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY'] as Symbol[],
          commodities: ['CRUDEOIL', 'GOLD', 'SILVER', 'COPPER'] as Symbol[],
          stocks_with_options: ['RELIANCE', 'TCS', 'HDFCBANK'] as Symbol[]
        };
        
        setAllSymbols(fallbackSymbols);
      } finally {
        setLoading(false);
      }
    };

    loadSymbols();
  }, []);

  // load universe once
  useEffect(() => {
    (async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
        const r = await fetch(`${baseUrl}/universe`);
        if (r.ok) {
          const j: UniverseResponse = await r.json();
          setUniverse(j.parents || []);
          setCfg(j.config || {});
        } else {
          console.warn('Universe API not available, using mock data');
          // Fallback to mock data
          setUniverse([
            {
              parent_token: 256265,
              symbol: 'NIFTY',
              tradingsymbol: 'NIFTY25FEB',
              expiry: '2025-02-27',
              step: 50,
              children_total: 200,
              ce_count: 100,
              pe_count: 100,
              window: 10
            },
            {
              parent_token: 260105,
              symbol: 'BANKNIFTY',
              tradingsymbol: 'BANKNIFTY25FEB',
              expiry: '2025-02-26',
              step: 100,
              children_total: 160,
              ce_count: 80,
              pe_count: 80,
              window: 8
            },
            {
              parent_token: 257801,
              symbol: 'FINNIFTY',
              tradingsymbol: 'FINNIFTY25FEB',
              expiry: '2025-02-25',
              step: 50,
              children_total: 120,
              ce_count: 60,
              pe_count: 60,
              window: 6
            }
          ]);
          setCfg({ bar_sec: 300, cap_nearest_per_side: 10, window: 10 });
        }
      } catch (e) {
        console.error('Error loading universe:', e);
        // Use mock data on error
        setUniverse([]);
        setCfg({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // WebSocket connection
  const handleWSMessage = (data: any) => {
    setLastUpdate(Date.now());
    
    console.log('📡 Raw WebSocket data received:', data);
    
    // Accept multiple types of payloads:
    // 1) Single event { ... }
    // 2) Batch { events: [ ... ] }
    // 3) Sharp Pro signals (from backend sharp_pro_signal)
    const now = Math.floor(Date.now() / 1000);
    
    const append = (e: any) => {
      // Enhanced parsing for sharp_pro_signal events
      const row: SignalPayload = {
        ts: e.ts || e.timestamp || e.hitTime ? new Date(e.hitTime).getTime() / 1000 : now,
        event: e.event || e.type || e.kind || "SIGNAL",
        symbol: e.symbol || e.parent_symbol || "UNKNOWN",
        token: e.token || e.parent_token,
        strike: e.strike || e.ce_strike || e.pe_strike || e.strike_price,
        expiry: e.expiry || e.expiry_date || e.exp,
        tradingsymbol: e.tradingsymbol || e.trading_symbol,
        price: e.price || e.ltp || e.cur,
        side: e.side || (e.ce_strike ? "CE" : e.pe_strike ? "PE" : undefined),
        strategy: e.strategy || "ASP", // Additional Sharp Pro
        key: e.key || e.step?.toString() || e.id,
        sl: e.sl,
        tp: e.tp,
        prz_low: e.PRZ_low || e.prz_low,
        prz_high: e.PRZ_high || e.prz_high,
        prz_mid: e.PRZ_mid || e.prz_mid,
        prz_score: e.score || e.prz_score,
        prz_slope: e.prz_slope,
        earth_res: e.earth_res,
        earth_sup: e.earth_sup,
        hlc_bias: e.hlc_bias || e.bias,
        lot: e.lot,
        pnl: e.pnl,
        note: e.notes || e.note || `Step ${e.step} ${e.kind} - Level: ${e.level}, Current: ${e.cur}`,
      };

      // Proactively ensure caches for this symbol
      const sym = row.symbol || 'UNKNOWN';
      if (sym && !aspCache[sym] && !aspFetchRef.current[sym]) {
        aspFetchRef.current[sym] = true;
        ApiService.additionalSharpPro(sym as any).then((asp) => {
          setAspCache((m) => ({ ...m, [sym]: asp }));
        }).catch(() => {}).finally(() => { aspFetchRef.current[sym] = false; });
      }
      if (sym && !expiryCache[sym] && !expFetchRef.current[sym]) {
        expFetchRef.current[sym] = true;
        ApiService.getExpiryDates(sym as any).then((list) => {
          const picked = Array.isArray(list) && list.length ? list[0] : undefined;
          if (picked) setExpiryCache((m) => ({ ...m, [sym]: picked }));
        }).catch(() => {}).finally(() => { expFetchRef.current[sym] = false; });
      }
      
      // Derive strike/expiry immediately if cache available
      const asp = aspCache[sym];
      if (!row.strike && asp) {
        const stepIdx = Number(row.key ?? 0);
        const atm = asp?.atm_pair?.strike;
        const side = (row.side || '').toUpperCase();
        const uni = universe.find(u => u.symbol === sym);
        const stepSize = uni?.step || 0;
        if (side === 'CE' && asp?.otm_steps && asp.otm_steps[stepIdx]?.ce_strike) {
          row.strike = asp.otm_steps[stepIdx].ce_strike;
        } else if (side === 'PE' && asp?.otm_steps && asp.otm_steps[stepIdx]?.pe_strike) {
          row.strike = asp.otm_steps[stepIdx].pe_strike;
        } else if (atm && stepSize && !isNaN(stepIdx)) {
          // Fallback compute from ATM and step size
          row.strike = side === 'PE' ? atm - (stepIdx + 1) * stepSize : atm + (stepIdx + 1) * stepSize;
        } else if (atm) {
          row.strike = atm;
        }
      }
      if (!row.expiry) {
        const ex = expiryCache[sym];
        if (ex) row.expiry = ex;
      }
      
      console.log('📊 Processed signal:', row);
      setSignals((s) => [row, ...s].slice(0, 2000));
    };

    if (Array.isArray(data?.events)) {
      data.events.forEach(append);
    } else {
      append(data);
    }
  };

  // WebSocket URL
  const wsUrl = useMemo(() => {
    // Prefer backend URL from env if provided
    const envUrl = (process.env as any).REACT_APP_BACKEND_URL as string | undefined;
    if (envUrl) return envUrl.replace(/\/$/, '');
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'https' : 'http';
    if (process.env.NODE_ENV === 'development') {
      // Use current hostname to avoid localhost vs 127.0.0.1 mismatch
      const host = `${window.location.hostname}:5000`;
      return `${protocol}://${host}`;
    }
    // In production, default to same origin
    return `${protocol}://${window.location.host}`;
  }, []);

  // Call the hook without assigning the returned socket since we don't use it directly
  useSocketIO(wsUrl, handleWSMessage, setWsConnected);

  // derived lists with comprehensive symbol support
  const symbols = useMemo(() => {
    const set = new Set<string>(["ALL"]);
    
    // Add universe symbols
    universe.forEach((u) => set.add(u.symbol));
    
    // Add all available symbols from API
    allSymbols.indices.forEach(s => set.add(s));
    allSymbols.stocks.forEach(s => set.add(s));
    allSymbols.commodities.forEach(s => set.add(s));
    allSymbols.stocks_with_options.forEach(s => set.add(s));
    
    return Array.from(set).sort();
  }, [universe, allSymbols]);

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      if (filters.symbol !== "ALL" && s.symbol !== filters.symbol) return false;
      if (filters.event !== "ALL" && s.event !== filters.event) return false;
      if (filters.onlyInPlay) {
        const inPRZ = s.prz_low != null && s.prz_high != null && s.prz_score != null && s.prz_score >= 60;
        const inHLC = s.hlc_bias && s.hlc_bias !== "Neutral";
        if (!(inPRZ || inHLC)) return false;
      }
      return true;
    });
  }, [signals, filters]);

  // Test API connection and load option chain data
  const testApiConnection = useCallback(async () => {
    try {
      console.log('🔄 Testing API connection...');
      setApiStatus('connecting');
      
      // Test Kite API connection first
      console.log('🔄 Testing Kite API connection...');
      const kiteTest = await ApiService.testKiteConnection();
      
      if (!kiteTest.success) {
        console.error('❌ Kite API connection failed:', kiteTest.error);
        setApiStatus('disconnected');
        return;
      }
      
      console.log('✅ Kite API connection successful:', kiteTest.data);
      
      // Test WebSocket connection
      console.log('🔄 Testing WebSocket connection...');
      const wsTest = await ApiService.testWebSocketConnection();
      
      if (wsTest.success) {
        console.log('✅ WebSocket test signal sent:', wsTest.data);
      } else {
        console.warn('⚠️ WebSocket test failed:', wsTest.error);
      }
      
      // Test basic health status
      const healthCheck = await ApiService.getHealthStatus();
      console.log('✅ Health Status:', healthCheck);
      
      // Test option chain for NIFTY if available
      if (allSymbols.indices.includes('NIFTY' as Symbol)) {
        console.log('🔄 Testing option chain for NIFTY...');
        const optionChain = await ApiService.getOptionChain('NIFTY' as Symbol);
        console.log('✅ Option Chain loaded:', optionChain);
      }
      
      // Test spot prices for available symbols
      const testSymbols = allSymbols.indices.slice(0, 3);
      for (const symbol of testSymbols) {
        try {
          const spot = await ApiService.getSpotPrice(symbol);
          console.log(`✅ Spot price for ${symbol}:`, spot);
        } catch (e) {
          console.warn(`⚠️ Spot price failed for ${symbol}:`, e);
        }
      }
      
      setApiStatus('connected');
      console.log('✅ API connection test completed successfully');
      
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      setApiStatus('disconnected');
    }
  }, [allSymbols.indices, setApiStatus]);

  // Calibration functions
  const runCalibration = useCallback(async () => {
    setCalibrationLoading(true);
    try {
      console.log(`🔄 Running ${calibrationDays}-day calibration for symbols:`, selectedCalibrationSymbols);
      
      const symbolConfigs: { [symbol: string]: CalibrationConfig } = {};
      
      for (const symbol of selectedCalibrationSymbols) {
        console.log(`📊 Calibrating ${symbol}...`);
        const config = await calibrateSymbol(symbol, calibrationDays);
        symbolConfigs[symbol] = config;
      }
      
      const calibrationResult: CalibrationData = {
        generated_at: new Date().toISOString(),
        days: calibrationDays,
        symbols: symbolConfigs
      };
      
      setCalibrationData(calibrationResult);
      console.log('✅ Calibration completed:', calibrationResult);
      
    } catch (error) {
      console.error('❌ Calibration failed:', error);
    } finally {
      setCalibrationLoading(false);
    }
  }, [calibrationDays, selectedCalibrationSymbols]);

  const exportCalibration = useCallback(() => {
    if (!calibrationData) return;
    
    const dataStr = JSON.stringify(calibrationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calibration_${calibrationDays}days_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [calibrationData, calibrationDays]);

  const resetCalibration = useCallback(() => {
    setCalibrationData(null);
  }, []);

  // Auto-test API connection when symbols are loaded
  useEffect(() => {
    if (allSymbols.indices.length > 0 && apiStatus === 'connecting') {
      testApiConnection();
    }
  }, [allSymbols.indices.length, apiStatus, testApiConnection]);

  // Real-time data fetching - Remove mock data and rely on WebSocket
  useEffect(() => {
    console.log('📡 Waiting for real-time signals from WebSocket...');
    console.log('🔗 WebSocket Connected:', wsConnected);
    console.log('📊 Current signals count:', signals.length);
  }, [wsConnected, signals.length]);

  // Fetch existing signals on component mount
  useEffect(() => {
    const fetchExistingSignals = async () => {
      try {
        console.log('🔄 Fetching existing ASP signals...');
        const response = await ApiService.getTodayAspSignals();
        
        if (response.signals && Array.isArray(response.signals)) {
          console.log(`📊 Loaded ${response.signals.length} existing signals`);
          
          const processedSignals: SignalPayload[] = response.signals.map((signal: any) => ({
            ts: signal.ts || signal.timestamp || signal.hitTime ? new Date(signal.hitTime).getTime() / 1000 : Math.floor(Date.now() / 1000),
            event: signal.event || signal.type || signal.kind || "ASP",
            symbol: signal.symbol || signal.parent_symbol || "UNKNOWN",
            token: signal.token || signal.parent_token,
            strike: signal.strike || signal.ce_strike || signal.pe_strike || signal.strike_price,
            expiry: signal.expiry || signal.expiry_date || signal.exp,
            price: signal.price || signal.ltp || signal.cur,
            side: signal.side || (signal.ce_strike ? "CE" : signal.pe_strike ? "PE" : undefined),
            strategy: signal.strategy || "ASP",
            key: signal.key || signal.step?.toString() || signal.id,
            sl: signal.sl,
            tp: signal.tp,
            prz_low: signal.PRZ_low || signal.prz_low,
            prz_high: signal.PRZ_high || signal.prz_high,
            prz_mid: signal.PRZ_mid || signal.prz_mid,
            prz_score: signal.score || signal.prz_score,
            prz_slope: signal.prz_slope,
            earth_res: signal.earth_res,
            earth_sup: signal.earth_sup,
            hlc_bias: signal.hlc_bias || signal.bias,
            lot: signal.lot,
            pnl: signal.pnl,
            note: signal.notes || signal.note || `${signal.kind} signal - Level: ${signal.level}, Current: ${signal.cur}`,
          }));
          
          setSignals(processedSignals);

          // Ensure caches for the involved symbols
          const syms = Array.from(new Set(processedSignals.map(s => s.symbol).filter(Boolean))) as string[];
          syms.forEach(sym => {
            if (!aspCache[sym] && !aspFetchRef.current[sym]) {
              aspFetchRef.current[sym] = true;
              ApiService.additionalSharpPro(sym as any).then((asp) => {
                setAspCache((m) => ({ ...m, [sym]: asp }));
              }).catch(() => {}).finally(() => { aspFetchRef.current[sym] = false; });
            }
            if (!expiryCache[sym] && !expFetchRef.current[sym]) {
              expFetchRef.current[sym] = true;
              ApiService.getExpiryDates(sym as any).then((list) => {
                const picked = Array.isArray(list) && list.length ? list[0] : undefined;
                if (picked) setExpiryCache((m) => ({ ...m, [sym]: picked }));
              }).catch(() => {}).finally(() => { expFetchRef.current[sym] = false; });
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch existing signals:', error);
      }
    };

    // Only fetch if we have no signals yet and API is connected
    if (signals.length === 0 && apiStatus === 'connected') {
      fetchExistingSignals();
    }
  }, [apiStatus, signals.length, aspCache, expiryCache]);

  // Backfill strike/expiry when caches update
  useEffect(() => {
    if (!Object.keys(aspCache).length && !Object.keys(expiryCache).length) return;
  setSignals((prev) => prev.map((s) => {
      const sym = s.symbol || 'UNKNOWN';
      const asp = aspCache[sym];
      if (!s.strike && asp) {
        const stepIdx = Number(s.key ?? 0);
        const atm = asp?.atm_pair?.strike;
        const side = (s.side || '').toUpperCase();
        const uni = universe.find(u => u.symbol === sym);
        const stepSize = uni?.step || 0;
        let derived: number | undefined;
        if (side === 'CE' && asp?.otm_steps && asp.otm_steps[stepIdx]?.ce_strike) {
          derived = asp.otm_steps[stepIdx].ce_strike;
        } else if (side === 'PE' && asp?.otm_steps && asp.otm_steps[stepIdx]?.pe_strike) {
          derived = asp.otm_steps[stepIdx].pe_strike;
        } else if (atm && stepSize && !isNaN(stepIdx)) {
          derived = side === 'PE' ? atm - (stepIdx + 1) * stepSize : atm + (stepIdx + 1) * stepSize;
        } else if (atm) {
          derived = atm;
        }
  if (derived != null) { s = { ...s, strike: derived }; }
      }
      if (!s.expiry) {
        const ex = expiryCache[sym];
  if (ex) { s = { ...s, expiry: ex }; }
      }
      return s;
    }));
  }, [aspCache, expiryCache, universe]);

  return (
    <PageContainer>
      <Header>
        <Title>SMD LIQ + HLC + Z2H + BTST</Title>
        <Subtitle>
          Smart Money Distribution Liquidity with High-Low-Close Z2H BTST Analysis
        </Subtitle>
      </Header>

      {/* Connection Status & Config */}
      <ControlsSection>
        <SectionTitle>
          <SectionIcon>⚙️</SectionIcon>
          System Status & Configuration
        </SectionTitle>
        <ControlsGrid>
          <ControlGroup>
            <Label>API Status</Label>
            <StatusIndicator status={apiStatus === 'connected' ? 'active' : apiStatus === 'connecting' ? 'warning' : 'inactive'}>
              {apiStatus === 'connected' ? 'Connected' : apiStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
            </StatusIndicator>
          </ControlGroup>
          <ControlGroup>
            <Label>WebSocket Status</Label>
            <StatusIndicator status={wsConnected ? 'active' : 'inactive'}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </StatusIndicator>
          </ControlGroup>
          <ControlGroup>
            <Label>Total Symbols</Label>
            <MetricValue>
              I:{allSymbols.indices.length} | S:{allSymbols.stocks.length} | C:{allSymbols.commodities.length}
            </MetricValue>
          </ControlGroup>
          <ControlGroup>
            <Label>Bar Interval</Label>
            <MetricValue>{cfg.bar_sec ?? "-"}s</MetricValue>
          </ControlGroup>
          <ControlGroup>
            <Label>Chain Window</Label>
            <MetricValue>{cfg.cap_nearest_per_side ?? cfg.window ?? "-"}</MetricValue>
          </ControlGroup>
          <ControlGroup>
            <Label>Last Update</Label>
            <MetricValue style={{ fontSize: '0.8rem' }}>
              {new Date(lastUpdate).toLocaleTimeString()}
            </MetricValue>
          </ControlGroup>
        </ControlsGrid>
      </ControlsSection>

      {/* Filters */}
      <FilterGrid>
        <ControlGroup>
          <Label htmlFor="filter-symbol">Symbol</Label>
          <Select
            id="filter-symbol"
            aria-label="Symbol"
            value={filters.symbol}
            onChange={(e) => setFilters((f) => ({ ...f, symbol: e.target.value }))}
          >
            {symbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </ControlGroup>
        <ControlGroup>
          <Label htmlFor="filter-event">Event Type</Label>
          <Select
            id="filter-event"
            aria-label="Event Type"
            value={filters.event}
            onChange={(e) => setFilters((f) => ({ ...f, event: e.target.value }))}
          >
            {[
              "ALL","PRZ","HLC","BUY","SELL","TP","SL","EXIT","BOOK","Z2H","BTST","SMDLIQ"
            ].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </ControlGroup>
        <ControlGroup>
          <Label style={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={filters.onlyInPlay}
              onChange={(e) => setFilters(f => ({ ...f, onlyInPlay: e.target.checked }))}
            />
            Only in-play (PRZ/HLC)
          </Label>
        </ControlGroup>
          <ControlGroup style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
            <ExportButton onClick={() => exportLiveSignalsToCsv(filtered)}>
              Export CSV
            </ExportButton>
            <ExportButton onClick={() => exportLiveSignalsToXlsx(filtered)}>
              Export XLSX
            </ExportButton>
            <ExportButton onClick={() => exportLiveSignalsToPdf(filtered)}>
              Export PDF
            </ExportButton>
            <ActionButton onClick={testApiConnection}>
              Test Connection
            </ActionButton>
            <ActionButton 
              onClick={async () => {
                const wsTest = await ApiService.testWebSocketConnection();
                console.log('WebSocket test result:', wsTest);
              }}
            >
              Test WebSocket
            </ActionButton>
          </ControlGroup>
        </FilterGrid>
        <ContentGrid>
          <Section>
            <SectionTitle>
              <SectionIcon>📈</SectionIcon>
              Indices ({allSymbols.indices.length})
            </SectionTitle>
            <FlexContainer>
              {allSymbols.indices.slice(0, 20).map(symbol => (
              <MetricCard 
                key={symbol}
                style={{
                  margin: '2px', 
                  padding: '8px 12px',
                  background: filters.symbol === symbol ? 'rgba(255, 242, 0, 0.2)' : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => setFilters(f => ({ ...f, symbol }))}
              >
                <MetricValue style={{ fontSize: '0.9rem', margin: 0 }}>{symbol}</MetricValue>
              </MetricCard>
            ))}
            {allSymbols.indices.length > 20 && (
              <MetricCard style={{ margin: '2px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)' }}>
                <MetricValue style={{ fontSize: '0.8rem', margin: 0 }}>
                  +{allSymbols.indices.length - 20} more
                </MetricValue>
              </MetricCard>
            )}
          </FlexContainer>
        </Section>

        <Section>
          <SectionTitle>
            <SectionIcon>🏢</SectionIcon>
            Stocks ({allSymbols.stocks_with_options.length})
          </SectionTitle>
          <FlexContainer>
            {allSymbols.stocks_with_options.slice(0, 15).map(symbol => (
              <MetricCard 
                key={symbol}
                style={{
                  margin: '2px', 
                  padding: '8px 12px',
                  background: filters.symbol === symbol ? 'rgba(255, 242, 0, 0.2)' : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => setFilters(f => ({ ...f, symbol }))}
              >
                <MetricValue style={{ fontSize: '0.9rem', margin: 0 }}>{symbol}</MetricValue>
              </MetricCard>
            ))}
            {allSymbols.stocks_with_options.length > 15 && (
              <MetricCard style={{ margin: '2px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)' }}>
                <MetricValue style={{ fontSize: '0.8rem', margin: 0 }}>
                  +{allSymbols.stocks_with_options.length - 15} more
                </MetricValue>
              </MetricCard>
            )}
          </FlexContainer>
        </Section>

        <Section>
          <SectionTitle>
            <SectionIcon>💰</SectionIcon>
            Commodities ({allSymbols.commodities.length})
          </SectionTitle>
          <FlexContainer>
            {allSymbols.commodities.slice(0, 10).map(symbol => (
              <MetricCard 
                key={symbol}
                style={{
                  margin: '2px', 
                  padding: '8px 12px',
                  background: filters.symbol === symbol ? 'rgba(255, 242, 0, 0.2)' : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => setFilters(f => ({ ...f, symbol }))}
              >
                <MetricValue style={{ fontSize: '0.9rem', margin: 0 }}>{symbol}</MetricValue>
              </MetricCard>
            ))}
            {allSymbols.commodities.length > 10 && (
              <MetricCard style={{ margin: '2px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)' }}>
                <MetricValue style={{ fontSize: '0.8rem', margin: 0 }}>
                  +{allSymbols.commodities.length - 10} more
                </MetricValue>
              </MetricCard>
            )}
          </FlexContainer>
        </Section>
      </ContentGrid>

      {/* Universe Overview */}
      <Section>
        <SectionTitle>
          <SectionIcon>🌐</SectionIcon>
          Universe Overview
        </SectionTitle>
          <UniverseGrid>
            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading universe...</LoadingText>
              </LoadingContainer>
            ) : (
            universe.map((u) => (
              <UniverseCard key={u.parent_token}>
                <UniverseHeader>
                  <UniverseSymbol>{u.symbol}</UniverseSymbol>
                  <UniverseTradingSymbol>{u.tradingsymbol}</UniverseTradingSymbol>
                </UniverseHeader>
                <UniverseExpiry>Expiry: {u.expiry}</UniverseExpiry>
                <UniverseStats>
                  <UniverseStat>
                    <UniverseStatLabel>Step</UniverseStatLabel>
                    <UniverseStatValue>{u.step}</UniverseStatValue>
                  </UniverseStat>
                  <UniverseStat>
                    <UniverseStatLabel>CE</UniverseStatLabel>
                    <UniverseStatValue>{u.ce_count}</UniverseStatValue>
                  </UniverseStat>
                  <UniverseStat>
                    <UniverseStatLabel>PE</UniverseStatLabel>
                    <UniverseStatValue>{u.pe_count}</UniverseStatValue>
                  </UniverseStat>
                </UniverseStats>
              </UniverseCard>
            ))
          )}
        </UniverseGrid>
      </Section>

      {/* 90 Days Calibration */}
      <Section>
        <SectionTitle>
          <SectionIcon>⚙️</SectionIcon>
          90 Days Calibration
        </SectionTitle>

        <ControlsGrid>
          <ControlGroup>
            <Label htmlFor="calibration-days">Calibration Period (Days)</Label>
            <Select
              id="calibration-days"
              aria-label="Calibration Period (Days)"
              value={calibrationDays}
              onChange={(e) => setCalibrationDays(Number(e.target.value))}
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
              <option value={120}>120 Days</option>
              <option value={180}>180 Days</option>
            </Select>
          </ControlGroup>

          <ControlGroup>
            <Label>Selected Symbols ({selectedCalibrationSymbols.length})</Label>
            <SelectedSymbolsRow>
              {selectedCalibrationSymbols.map(symbol => (
                <SymbolTag
                  key={symbol}
                  onClick={() => setSelectedCalibrationSymbols(prev => prev.filter(s => s !== symbol))}
                  title={`Click to remove ${symbol}`}
                >
                  {symbol}
                </SymbolTag>
              ))}
            </SelectedSymbolsRow>
          </ControlGroup>

          <ControlGroup>
            <Label htmlFor="add-symbol">Add Symbol</Label>
            <Select
              id="add-symbol"
              aria-label="Add Symbol"
              value=""
              onChange={(e) => {
                const symbol = e.target.value;
                if (symbol && !selectedCalibrationSymbols.includes(symbol)) {
                  setSelectedCalibrationSymbols(prev => [...prev, symbol]);
                }
              }}
            >
              <option value="">Select symbol to add...</option>
              {symbols.filter(s => s !== 'ALL' && !selectedCalibrationSymbols.includes(s)).map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </Select>
          </ControlGroup>

          <ControlGroup>
            <Label>Actions</Label>
            <ActionButton
              onClick={runCalibration}
              disabled={calibrationLoading || selectedCalibrationSymbols.length === 0}
            >
              {calibrationLoading ? (
                <>
                  <LoadingSpinner style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Calibrating...
                </>
              ) : (
                `Run ${calibrationDays}D Calibration`
              )}
            </ActionButton>
            {calibrationData && (
              <>
                <ExportButton onClick={exportCalibration}>
                  Export JSON
                </ExportButton>
                <ClearButton onClick={resetCalibration}>
                  Clear
                </ClearButton>
              </>
            )}
          </ControlGroup>
        </ControlsGrid>

        {calibrationData && (
          <>
            <CalibrationStatus success>
              <CalibrationHeader>Calibration Complete</CalibrationHeader>
              <CalibrationInfo>
                Generated: {new Date(calibrationData.generated_at).toLocaleString()} | 
                Period: {calibrationData.days} days | 
                Symbols: {Object.keys(calibrationData.symbols).length}
              </CalibrationInfo>
            </CalibrationStatus>

            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Symbol</TableHeaderCell>
                    <TableHeaderCell className="text-right">Earth Factor</TableHeaderCell>
                    <TableHeaderCell className="text-right">HLC Band</TableHeaderCell>
                    <TableHeaderCell className="text-right">EPS A</TableHeaderCell>
                    <TableHeaderCell className="text-right">EPS B</TableHeaderCell>
                    <TableHeaderCell className="text-right">EPS Range</TableHeaderCell>
                    <TableHeaderCell>Score Weights</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {Object.entries(calibrationData.symbols).map(([symbol, config]) => (
                    <TableRow key={symbol}>
                      <TableCell>
                        <SymbolName>{symbol}</SymbolName>
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricValue style={{ fontSize: '0.9rem' }}>
                          {fmt(config.earth_factor, 4)}
                        </MetricValue>
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricValue style={{ fontSize: '0.9rem' }}>
                          {fmt(config.hlc_band, 4)}
                        </MetricValue>
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricValue style={{ fontSize: '0.9rem' }}>
                          {fmt(config.eps_eq.a, 4)}
                        </MetricValue>
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricValue style={{ fontSize: '0.9rem' }}>
                          {fmt(config.eps_eq.b, 4)}
                        </MetricValue>
                      </TableCell>
                      <TableCell className="text-right" style={{ fontSize: '0.8rem' }}>
                        {fmt(config.eps_eq.min, 2)} - {fmt(config.eps_eq.max, 2)}
                      </TableCell>
                      <TableCell>
                        <WeightTagsRow>
                          {Object.entries(config.score_weights).map(([key, weight]) => (
                            <WeightTag key={key}>
                              {key}: {fmt(weight, 1)}
                            </WeightTag>
                          ))}
                        </WeightTagsRow>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Section>

      {/* Live Signals Table */}
      <Section>
        <SectionTitle>
          <SectionIcon>📡</SectionIcon>
          Live Signals Feed
        </SectionTitle>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Time</TableHeaderCell>
                <TableHeaderCell>Symbol</TableHeaderCell>
                <TableHeaderCell>Strike</TableHeaderCell>
                <TableHeaderCell>Expiry</TableHeaderCell>
                <TableHeaderCell>Event</TableHeaderCell>
                <TableHeaderCell className="text-right">Level Price</TableHeaderCell>
                <TableHeaderCell className="text-right">Price</TableHeaderCell>
                <TableHeaderCell className="text-right">Current Price</TableHeaderCell>
                <TableHeaderCell>Side</TableHeaderCell>
                <TableHeaderCell>Key</TableHeaderCell>
                <TableHeaderCell className="text-right">SL</TableHeaderCell>
                <TableHeaderCell className="text-right">TP</TableHeaderCell>
                <TableHeaderCell className="text-right">PRZ Range</TableHeaderCell>
                <TableHeaderCell className="text-right">Score</TableHeaderCell>
                <TableHeaderCell>HLC Bias</TableHeaderCell>
                <TableHeaderCell className="text-right">P&L</TableHeaderCell>
                <TableHeaderCell>Notes</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filtered.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{fromEpoch(s.ts)}</TableCell>
                  <TableCell>{s.symbol}</TableCell>
                  <TableCell className="text-right">{s.strike || "-"}</TableCell>
                  <TableCell>{s.expiry || "-"}</TableCell>
                  <TableCell>
                    <StatusIndicator status={
                      s.event === 'BUY' || s.event === 'TP' ? 'active' :
                      s.event === 'SELL' || s.event === 'SL' ? 'inactive' : 'warning'
                    }>
                      {s.event}
                    </StatusIndicator>
                  </TableCell>
                  <TableCell className="text-right">{fmt(s.tp ?? s.sl ?? s.prz_mid ?? s.price)}</TableCell>
                  <TableCell className="text-right">{fmt(s.price)}</TableCell>
                  <TableCell className="text-right">{fmt(s.current_price ?? s.price)}</TableCell>
                  <TableCell positive={s.side === 'LONG'} negative={s.side === 'SHORT'}>
                    {s.side}
                  </TableCell>
                  <TableCell>{s.key}</TableCell>
                  <TableCell className="text-right">{fmt(s.sl)}</TableCell>
                  <TableCell className="text-right">{fmt(s.tp)}</TableCell>
                  <TableCell className="text-right">
                    {s.prz_low != null ? `${fmt(s.prz_low)}–${fmt(s.prz_high)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right" positive={s.prz_score ? s.prz_score >= 70 : false}>
                    {s.prz_score ?? "-"}
                  </TableCell>
                  <TableCell>
                    {s.hlc_bias ? (
                      <StatusIndicator status={
                        s.hlc_bias === 'NearHigh' ? 'inactive' :
                        s.hlc_bias === 'NearLow' ? 'active' : 'warning'
                      }>
                        {s.hlc_bias}
                      </StatusIndicator>
                    ) : "-"}
                  </TableCell>
                  <TableCell 
                    className="text-right"
                    positive={Boolean(s.pnl && s.pnl > 0)}
                    negative={Boolean(s.pnl && s.pnl < 0)}
                  >
                    {s.pnl != null ? fmt(s.pnl) : "-"}
                  </TableCell>
                  <TableCell>{s.note ?? ""}</TableCell>
                </TableRow>
              ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell style={{ textAlign: 'center', padding: '40px', color: '#666' }} colSpan={17}>
                  No signals found. Adjust filters or wait for live data.
                </TableCell>
              </TableRow>
            )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>
      
          </PageContainer>
        );
      };
      
      export default SmdLiqHlcZ2hBtstPage;
