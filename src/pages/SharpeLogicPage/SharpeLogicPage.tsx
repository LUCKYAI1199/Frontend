import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ApiService } from '../../services/ApiService';
import { Symbol } from '../../types';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
  color: #fff200;
  text-shadow: 0 0 20px rgba(255, 242, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  color: #ccc;
`;

// removed unused ComingSoon components

const Controls = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  align-items:center;
`;

const Label = styled.label`
  color:#ccc;
`;

const Select = styled.select`
  background:#111;
  color:#fff;
  border:1px solid #444;
  border-radius:6px;
  padding:8px 10px;
`;
const InlineNote = styled.span`
  color:#ff6b6b; margin-left:8px;
`;

const SectionTitle = styled.h3`
  color:#fff; margin:16px 0 8px;
`;

const AutoScroll = styled.div`
  overflow-x:auto;
`;

const Table = styled.table`
  width:100%; border-collapse:collapse;
  th{ color:#bbb; font-weight:600; text-align:left; }
  td{ color:#eee; }
`;

const Highlight = styled.span`
  color:#fff200; font-weight:700;
`;

const Muted = styled.div`
  color:#bbb;
`;

const Button = styled.button<{variant?:'primary'|'ghost'}>`
  background:${p=>p.variant==='ghost'?'transparent':'#fff200'};
  color:${p=>p.variant==='ghost'?'#fff':'#000'};
  border:1px solid #555;
  border-radius:8px;
  padding:8px 12px;
  font-weight:600;
  cursor:pointer;
  &:disabled{ opacity:0.5; cursor:not-allowed; }
`;

const Card = styled.div`
  background:linear-gradient(135deg,#1a1a1a 0%, #2d2d2d 100%);
  border:1px solid #444;
  border-radius:12px;
  padding:18px;
`;

const StatGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:14px;
`;

const Stat = styled.div`
  background:rgba(255,242,0,0.06);
  border:1px solid rgba(255,242,0,0.2);
  border-radius:10px;
  padding:12px;
`;

const StatLabel = styled.div`
  color:#bbb; font-size:12px; margin-bottom:6px;
`;
const StatValue = styled.div`
  color:#fff; font-size:20px; font-weight:700;
`;


const SharpeLogicPage: React.FC = () => {
  const [symbol, setSymbol] = useState<Symbol>('NIFTY');
  const [indices, setIndices] = useState<Symbol[]>([]);
  const [stocks, setStocks] = useState<Symbol[]>([]);
  const [commodities, setCommodities] = useState<Symbol[]>([]);
  const [selIndex, setSelIndex] = useState('NIFTY');
  const [selStock, setSelStock] = useState('');
  const [selCommodity, setSelCommodity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();
  const [data, setData] = useState<any|null>(null);
  const [recent, setRecent] = useState<any[]>([]);

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

  const onCalculate = async () => {
    setLoading(true); setError(undefined);
    try {
      const resp = await ApiService.smdCalculate(symbol);
      setData(resp);
    } catch(e:any){
      setError(ApiService.handleApiError(e) || 'Failed to calculate');
    } finally { setLoading(false); }
  };

  const onFetch = async () => {
    setLoading(true); setError(undefined);
    try {
      const resp = await ApiService.smdFetch(24);
      const items = resp?.items || resp?.data?.items || [];
      setRecent(items);
    } catch(e:any){
      setError(ApiService.handleApiError(e) || 'Failed to fetch');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ onFetch(); },[]);

  return (
    <PageContainer>
      <HeaderSection>
        <Title>SHARPE Logic · SMD Key Buy</Title>
  <Subtitle>Compute SMD Key Buy using previous-day SPOT/ATM and OTM CE/PE previous closes</Subtitle>
      </HeaderSection>

      <Card>
        <Controls>
          <Label>Symbols</Label>
          <Select id="smd-index" value={selIndex} onChange={e=>{ const v = e.target.value; setSelIndex(v); setSelStock(''); setSelCommodity(''); setSymbol(v as Symbol); }}>
            <option value="">Select Index</option>
            {indices.map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select id="smd-stock" value={selStock} onChange={e=>{ const v = e.target.value; setSelStock(v); setSelIndex(''); setSelCommodity(''); setSymbol(v as Symbol); }}>
            <option value="">Select Stock</option>
            {stocks.map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select id="smd-commodity" value={selCommodity} onChange={e=>{ const v = e.target.value; setSelCommodity(v); setSelIndex(''); setSelStock(''); setSymbol(v as Symbol); }}>
            <option value="">Select Commodity</option>
            {commodities.map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
          <Button onClick={onCalculate} disabled={loading}>Calculate</Button>
          <Button variant="ghost" onClick={onFetch} disabled={loading}>Fetch saved</Button>
          {error && <InlineNote>{error}</InlineNote>}
        </Controls>

        {data && (
          <>
            <SectionTitle>Previous-day Calculation</SectionTitle>
            <StatGrid>
              <Stat><StatLabel>Previous Day SPOT</StatLabel><StatValue>{(data.spot_price??0).toFixed(2)}</StatValue></Stat>
              <Stat><StatLabel>Previous Day ATM</StatLabel><StatValue>{data.atm_strike}</StatValue></Stat>
              <Stat><StatLabel>Prev OTM CE ({data.otm_call_strike}) (+100) Close</StatLabel><StatValue>{(data.otm_call_close??0).toFixed(2)}</StatValue></Stat>
              <Stat><StatLabel>Prev OTM PE ({data.otm_put_strike}) (-100) Close</StatLabel><StatValue>{(data.otm_put_close??0).toFixed(2)}</StatValue></Stat>
              <Stat><StatLabel>SMD KEY BUY</StatLabel><StatValue>{(data.smd_key_buy??0).toFixed(2)}</StatValue></Stat>
              {data.status && <Stat><StatLabel>Status</StatLabel><StatValue>{data.status}</StatValue></Stat>}
            </StatGrid>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>Recent Saved (24h)</SectionTitle>
        {recent.length? (
          <AutoScroll>
            <Table>
              <thead>
                <tr>
                  <th align="left">Time</th>
                  <th align="left">Symbol</th>
                  <th align="right">Prev SPOT</th>
                  <th align="right">Prev ATM</th>
                  <th align="right">Prev CE Close</th>
                  <th align="right">Prev PE Close</th>
                  <th align="right">SMD</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r:any)=> (
                  <tr key={r.id}>
                    <td>{(r.created_at||'').replace('T',' ').slice(0,19)}</td>
                    <td>{r.symbol}</td>
                    <td align="right">{(r.spot_price??0).toFixed(2)}</td>
                    <td align="right">{r.atm_strike}</td>
                    <td align="right">{(r.otm_call_close??0).toFixed(2)}</td>
                    <td align="right">{(r.otm_put_close??0).toFixed(2)}</td>
                    <td align="right"><Highlight>{(r.smd_key_buy??0).toFixed(2)}</Highlight></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </AutoScroll>
  ): (<Muted>No saved records yet.</Muted>)}
      </Card>
    </PageContainer>
  );
};

export default SharpeLogicPage;
