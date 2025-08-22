import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ApiService } from '../../services/ApiService';
import { OHLCResponse, Symbol } from '../../types';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
`;

const Panel = styled.div`
  background: linear-gradient(135deg,#2d2d2d 0%,#1a1a1a 100%);
  border:1px solid #444;
  border-radius:12px;
  padding:28px 32px;
  box-shadow:0 4px 18px -4px rgba(0,0,0,0.5);
  display:flex;
  flex-direction:column;
  gap:16px;
`;

const Title = styled.h1`
  font-size:2rem;
  margin:0;
  font-weight:700;
  color:#fff200;
`;

const Rows = styled.div`
  display:flex;
  flex-direction:column;
  gap:8px;
  font-size:0.95rem;
  color:#e5e5e5;
`;

const Row = styled.div`
  display:flex;
  gap:8px;
  line-height:1.3;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  span.label { width:180px; color:#fff200; font-weight:600; }
  span.value { flex:1; color:#fafafa; }
`;

const Controls = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  align-items:center;
`;

const SelectStyles = styled.div`
  select {
    background:#1e1e1e;
    color:#fff;
    border:1px solid #555;
    padding:6px 10px;
    border-radius:6px;
    font-size:0.85rem;
    outline:none;
  }
  select:focus { border-color:#fff200; }
`;

const RefreshBtn = styled.button`
  background:#fff200;
  color:#000;
  border:none;
  padding:6px 14px;
  font-size:0.8rem;
  border-radius:6px;
  cursor:pointer;
  font-weight:600;
  &:disabled { opacity:.4; cursor:default; }
`;

const Status = styled.div`
  font-size:0.7rem;
  opacity:.65;
`;

const LabelWrap = styled.label`
  display:flex;
  flex-direction:column;
  gap:4px;
  font-size:0.7rem;
  text-transform:uppercase;
  letter-spacing:0.8px;
  color:#fff200;
  font-weight:600;
`;

const ErrorMsg = styled.div`
  color:#ff6b6b;
  font-size:0.85rem;
  margin-top:6px;
`;

const Spacer = styled.div`
  flex: 1 1 auto;
`;

const EarthLogicPage: React.FC = () => {
  const [symbol, setSymbol] = useState<Symbol>('NIFTY');
  const [indices, setIndices] = useState<Symbol[]>([]);
  const [stocks, setStocks] = useState<Symbol[]>([]);
  const [commodities, setCommodities] = useState<Symbol[]>([]);
  const [selIndex, setSelIndex] = useState('NIFTY');
  const [selStock, setSelStock] = useState('');
  const [selCommodity, setSelCommodity] = useState('');
  const [data, setData] = useState<OHLCResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const DIFF_PERCENT = 0.2611; // 26.11%

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await ApiService.getOHLCData(symbol);
      setData(resp);
      setLastUpdate(new Date());
    } catch (e:any) {
      setError(ApiService.handleApiError(e) || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load lists: indices & commodities from full symbols, stocks from Option Chain source
  useEffect(()=>{
    let mounted = true;
    (async()=>{
      try {
        const [full, stocksResp] = await Promise.all([
          ApiService.getAllSymbolsFull(),
          ApiService.getAllStocks(),
        ]);
        if(!mounted) return;
        const filterFn = (arr: string[]): Symbol[] => (arr||[]).filter(s=>{
          if(!s) return false;
          if (s.startsWith('0')) return false;
          if (/-[A-Z]\d+$/i.test(s)) return false;
          return true;
        }) as Symbol[];
        const idx = filterFn(full.indices as string[]);
        const com = filterFn(full.commodities as string[]);
        const stkSrc = (stocksResp.success && stocksResp.data) ? stocksResp.data : [];
        const stk = filterFn(stkSrc);
        setIndices(idx);
        setStocks(stk);
        setCommodities(com);
        // default selection
        if (idx.includes('NIFTY' as Symbol)) {
          setSelIndex('NIFTY');
          setSymbol('NIFTY' as Symbol);
          setSelStock(''); setSelCommodity('');
        } else if (idx.length) {
          setSelIndex(idx[0]); setSymbol(idx[0]);
          setSelStock(''); setSelCommodity('');
        } else if (stk.length) {
          setSelStock(stk[0]); setSymbol(stk[0]);
          setSelIndex(''); setSelCommodity('');
        } else if (com.length) {
          setSelCommodity(com[0]); setSymbol(com[0]);
          setSelIndex(''); setSelStock('');
        }
      } catch {
        // fallback minimal sets
        setIndices(['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY','SENSEX'] as Symbol[]);
        setCommodities(['COPPER','CRUDEOIL','GOLD','SILVER'] as Symbol[]);
        setStocks([]);
        setSelIndex('NIFTY'); setSymbol('NIFTY' as Symbol);
      }
    })();
    return ()=>{ mounted=false; };
  },[]);

  const prevHigh = data?.previous_day?.high ?? 0;
  const prevLow = data?.previous_day?.low ?? 0;
  const currOpen = data?.current_day?.open ?? 0;
  const earthLogic = prevHigh && prevLow ? (prevHigh - prevLow) : 0;
  const earthValue = earthLogic * DIFF_PERCENT;
  const earthResistance = earthValue + currOpen;
  // Earth Support should be based on current day's OPEN, not CLOSE
  const earthSupportRaw = currOpen ? (currOpen - earthValue) : 0;
  const earthSupport = earthSupportRaw < 0 ? 0 : earthSupportRaw;

  return (
    <PageContainer>
      <Panel>
        <Title>Earth Logic</Title>
        <Controls>
          <LabelWrap>Symbols</LabelWrap>
          <SelectStyles>
            <select id="earth-index" value={selIndex} onChange={e=>{ const v = e.target.value; setSelIndex(v); setSelStock(''); setSelCommodity(''); setSymbol(v as Symbol); }}>
              <option value="">Select Index</option>
              {indices.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </SelectStyles>
          <SelectStyles>
            <select id="earth-stock" value={selStock} onChange={e=>{ const v = e.target.value; setSelStock(v); setSelIndex(''); setSelCommodity(''); setSymbol(v as Symbol); }}>
              <option value="">Select Stock</option>
              {stocks.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </SelectStyles>
          <SelectStyles>
            <select id="earth-commodity" value={selCommodity} onChange={e=>{ const v = e.target.value; setSelCommodity(v); setSelIndex(''); setSelStock(''); setSymbol(v as Symbol); }}>
              <option value="">Select Commodity</option>
              {commodities.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </SelectStyles>
          <Spacer />
          <RefreshBtn onClick={fetchData} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</RefreshBtn>
          {lastUpdate && <Status>Updated {lastUpdate.toLocaleTimeString()}</Status>}
        </Controls>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Rows>
          <Row><span className="label">Previous Day High:</span><span className="value">{prevHigh ? prevHigh.toFixed(2) : '—'}</span></Row>
          <Row><span className="label">Previous Day Low:</span><span className="value">{prevLow ? prevLow.toFixed(2) : '—'}</span></Row>
          <Row><span className="label">Earth Resistance:</span><span className="value">{earthResistance ? earthResistance.toFixed(2) : '—'}</span></Row>
          <Row><span className="label">Earth Support:</span><span className="value">{earthSupport ? earthSupport.toFixed(2) : '—'}</span></Row>
        </Rows>
      </Panel>
    </PageContainer>
  );
};

export default EarthLogicPage;
