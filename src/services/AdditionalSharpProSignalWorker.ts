import { ApiService } from './ApiService';
import { OptionChainResponse, Symbol } from '../types';

type ThresholdHit = {
  id: string; // e.g., ASP_NIFTY_2025-08-13_step0_breakout
  symbol: Symbol;
  step: 0 | 1 | 2 | 3; // 0=ATM, 1..3=OTM steps
  kind: 'breakout' | 'tp1' | 'tp2' | 'tp3';
  level: number; // SMD target level
  hitTime: string; // ISO
};

let workerStarted = false;
let tickTimer: any = null;
let refreshTimer: any = null;

const DATE_KEY = () => new Date().toISOString().slice(0, 10);
const LS_SYMBOL_KEY = 'additional_sharp_pro_symbol';
const LS_STORE_KEY = (symbol: Symbol, date: string) => `asp_signals_${symbol}_${date}`;
const LS_CACHE_KEY = (symbol: Symbol, date: string) => `asp_cache_${symbol}_${date}`;

interface AspCache {
  result: any; // AdditionalSharpProResult
  lastFetch: number;
}

const loadStore = (symbol: Symbol, date: string): ThresholdHit[] => {
  try { const raw = localStorage.getItem(LS_STORE_KEY(symbol, date)); return raw? JSON.parse(raw): []; } catch { return []; }
};
const saveStore = (symbol: Symbol, date: string, arr: ThresholdHit[]) => {
  try { localStorage.setItem(LS_STORE_KEY(symbol, date), JSON.stringify(arr)); } catch {}
};
const loadCache = (symbol: Symbol, date: string): AspCache | null => {
  try { const raw = localStorage.getItem(LS_CACHE_KEY(symbol, date)); return raw? JSON.parse(raw): null; } catch { return null; }
};
const saveCache = (symbol: Symbol, date: string, cache: AspCache) => {
  try { localStorage.setItem(LS_CACHE_KEY(symbol, date), JSON.stringify(cache)); } catch {}
};

const pickPrice = (row: any, side: 'CE'|'PE'): number => {
  if (!row) return 0;
  if (side === 'CE') return row.ce_ltp ?? row.ce_last_price ?? row.ce_close ?? 0;
  return row.pe_ltp ?? row.pe_last_price ?? row.pe_close ?? 0;
};

const findRow = (chain: OptionChainResponse, strike: number) => (chain.option_chain || []).find(r => r.strike_price === strike);

export function startAdditionalSharpProSignalWorker() {
  if (workerStarted) return;
  workerStarted = true;

  const TICK_MS = 10000; // 10s for live checks
  const REFRESH_MS = 15 * 60 * 1000; // 15m refresh for thresholds (static per day)

  const tick = async () => {
    const date = DATE_KEY();
    const symbol = (localStorage.getItem(LS_SYMBOL_KEY) as Symbol) || ('NIFTY' as Symbol);
    // Load or refresh thresholds
    let cache = loadCache(symbol, date);
    const needsRefresh = !cache || (Date.now() - (cache.lastFetch || 0)) > REFRESH_MS;
    if (needsRefresh) {
      try {
        const result = await ApiService.additionalSharpPro(symbol);
        cache = { result, lastFetch: Date.now() };
        saveCache(symbol, date, cache);
      } catch {
        return; // Skip this tick if thresholds unavailable
      }
    }
    const asp = cache!.result;
    // Prepare thresholds
    const breakoutLevels: { step: 0|1|2|3; level: number; }[] = [
      { step: 0, level: asp?.atm_pair?.smd || 0 },
      { step: 1, level: asp?.otm_steps?.[0]?.smd || 0 },
      { step: 2, level: asp?.otm_steps?.[1]?.smd || 0 },
      { step: 3, level: asp?.otm_steps?.[2]?.smd || 0 },
    ];
    const tp1 = asp?.itm_steps?.[0]?.smd || 0;
    const tp2 = asp?.itm_steps?.[1]?.smd || 0;
    const tp3 = asp?.itm_steps?.[2]?.smd || 0;

    // Fetch current option chain
    let chain: OptionChainResponse | null = null;
    try { chain = await ApiService.getOptionChain(symbol); } catch { return; }
    if (!chain) return;

    const rows = chain.option_chain || [];
    if (!rows.length) return;

    // Compute current SMD for steps 0..3
    const curSmdByStep = new Map<number, number>();
    // step 0: ATM pair
    const atmStrike = asp?.atm_pair?.strike;
    if (typeof atmStrike === 'number') {
      const atmRow = findRow(chain, atmStrike);
      const ce = pickPrice(atmRow, 'CE');
      const pe = pickPrice(atmRow, 'PE');
      curSmdByStep.set(0, (Number(ce)||0 + Number(pe)||0)/2);
    }
    // steps 1..3: use otm_steps ce_strike & pe_strike from asp result
    for (let i=0;i<3;i++){
      const st = asp?.otm_steps?.[i];
      if (!st) continue;
      const ceRow = findRow(chain, st.ce_strike);
      const peRow = findRow(chain, st.pe_strike);
      const ce = pickPrice(ceRow, 'CE');
      const pe = pickPrice(peRow, 'PE');
      curSmdByStep.set(i+1, (Number(ce)||0 + Number(pe)||0)/2);
    }

    const store = loadStore(symbol, date);
    const storeMap = new Map(store.map(s => [s.id, s] as const));

    const ensureHit = (step: 0|1|2|3, kind: 'breakout'|'tp1'|'tp2'|'tp3', level: number) => {
      if (!level || !isFinite(level)) return;
      const cur = curSmdByStep.get(step) || 0;
      if (cur < level) return;
      const id = `ASP_${symbol}_${date}_step${step}_${kind}`;
      if (storeMap.has(id)) return; // already recorded
      const hit: ThresholdHit = { id, symbol, step, kind, level, hitTime: new Date().toISOString() };
      storeMap.set(id, hit);
    };

    // Breakouts
    breakoutLevels.forEach(b => ensureHit(b.step as 0|1|2|3, 'breakout', Number(b.level)||0));
    // TPs (same ATM ITM levels for all steps)
    (['tp1','tp2','tp3'] as const).forEach((k, idx) => {
      const level = idx===0? tp1 : idx===1? tp2 : tp3;
      [0,1,2,3].forEach(st => ensureHit(st as 0|1|2|3, k, Number(level)||0));
    });

    const updated = Array.from(storeMap.values()).sort((a,b)=> a.hitTime.localeCompare(b.hitTime));
    saveStore(symbol, date, updated);
  };

  // Start timers
  tickTimer = setInterval(tick, TICK_MS);
  // Also periodic refresh of cached thresholds
  refreshTimer = setInterval(()=>{
    const symbol = (localStorage.getItem(LS_SYMBOL_KEY) as Symbol) || ('NIFTY' as Symbol);
    const date = DATE_KEY();
    localStorage.removeItem(LS_CACHE_KEY(symbol, date));
  }, REFRESH_MS);

  // Initial immediate tick
  tick();
}

export function stopAdditionalSharpProSignalWorker(){
  if (tickTimer) clearInterval(tickTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  workerStarted = false;
}
