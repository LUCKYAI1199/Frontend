import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ApiService } from '../../services/ApiService';
import { Symbol } from '../../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Card = styled.div`
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 10px;
  padding: 16px;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #fff200;
`;

const Label = styled.label`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const Select = styled.select`
  background: #111827;
  color: #e5e7eb;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 8px 10px;
`;

const Button = styled.button`
  background: #fff200;
  color: #111;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  align-items: stretch;
  grid-auto-rows: 1fr;
  gap: 12px;
`;

const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Small = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
`;

const Table = styled.table`
  width: 100%;
  min-width: 720px; /* ensures no truncation; wrapper provides horizontal scroll if needed */
  border-collapse: collapse;
  /* Column widths moved from inline styles to CSS */
  colgroup col:nth-child(1) { width: 10%; }
  colgroup col:nth-child(2) { width: 15%; }
  colgroup col:nth-child(3) { width: 15%; }
  colgroup col:nth-child(4) { width: 19%; }
  colgroup col:nth-child(5) { width: 19%; }
  colgroup col:nth-child(6) { width: 22%; }
  td, th {
    border-bottom: 1px solid #374151;
    padding: 6px 8px;
    white-space: nowrap;
    overflow: visible;
  }
  thead th { color: #93c5fd; font-weight: 600; }
  tbody td { font-variant-numeric: tabular-nums; }
  th:nth-child(1), td:nth-child(1) { text-align: center; }
  th:nth-child(2), td:nth-child(2),
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4),
  th:nth-child(5), td:nth-child(5),
  th:nth-child(6), td:nth-child(6) { text-align: right; }
`;


const KeyStat = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
`;

const StatLabel = styled.span`
  opacity: 0.8;
  margin-right: 6px;
`;

const AlignEnd = styled.div`
  align-self: flex-end;
`;

type AdditionalSharpProResult = {
  symbol: Symbol;
  expiry?: string;
  prev_day_spot_close: number;
  atm_from_prev_close: number;
  strike_interval: number;
  atm_round_50: number;
  atm_round_100: number;
  atm_pair: { strike: number; ce_prev_close: number; pe_prev_close: number; smd: number };
  itm_steps: { step: number; ce_strike: number; pe_strike: number; ce_prev_close: number; pe_prev_close: number; smd: number }[];
  otm_steps: { step: number; ce_strike: number; pe_strike: number; ce_prev_close: number; pe_prev_close: number; smd: number }[];
  summary: Record<string, number>;
  timestamp: string;
};

const AdditionalSharpProPage: React.FC = () => {
  const [indices, setIndices] = useState<Symbol[]>([]);
  const [stocks, setStocks] = useState<Symbol[]>([]);
  const [commodities, setCommodities] = useState<Symbol[]>([]);
  const [symbol, setSymbol] = useState<Symbol>('NIFTY');
  const [selIndex, setSelIndex] = useState<string>('NIFTY');
  const [selStock, setSelStock] = useState<string>('');
  const [selCommodity, setSelCommodity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdditionalSharpProResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [allSymbols, stocksResp] = await Promise.all([
        ApiService.getAllSymbolsFull(),
        ApiService.getAllStocks(), // matches Option Chain stocks dropdown
      ]);

      const filterFn = (arr: string[]): Symbol[] =>
        (arr || []).filter((s) => {
          if (!s) return false;
          if (s.startsWith('0')) return false; // drop series like 0MOFSL26-N1
          if (/-[A-Z]\d+$/i.test(s)) return false; // drop -N1/-P2 etc.
          return true;
        }) as Symbol[];

      const idx = filterFn((allSymbols.indices as string[]) || []);
      const com = filterFn((allSymbols.commodities as string[]) || []);
      const stkSrc = (stocksResp.success && stocksResp.data) ? stocksResp.data : [];
      const stk = filterFn(stkSrc);

      setIndices(idx);
      setStocks(stk);
      setCommodities(com);

      // Default selection priority: NIFTY -> first index -> first stock -> first commodity
      if (idx.includes('NIFTY' as Symbol)) {
        setSelIndex('NIFTY');
        setSymbol('NIFTY' as Symbol);
        setSelStock('');
        setSelCommodity('');
      } else if (idx.length) {
        setSelIndex(idx[0]);
        setSymbol(idx[0]);
        setSelStock('');
        setSelCommodity('');
      } else if (stk.length) {
        setSelStock(stk[0]);
        setSymbol(stk[0]);
        setSelIndex('');
        setSelCommodity('');
      } else if (com.length) {
        setSelCommodity(com[0]);
        setSymbol(com[0]);
        setSelIndex('');
        setSelStock('');
      }
    })();
  }, []);

  useEffect(() => {
    // Ensure symbol remains valid when lists update
    if (indices.length && ![...indices, ...stocks, ...commodities].includes(symbol)) {
      setSymbol(indices[0] || stocks[0] || commodities[0]);
    }
  }, [indices, stocks, commodities, symbol]);

  const run = async () => {
    setLoading(true);
    setError(null);
    
    try {
  const result = await ApiService.additionalSharpPro(symbol);
      setData(result);
    } catch (err) {
      setError(ApiService.handleApiError(err) || 'Failed to calculate SHARP PRO data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderSteps = (title: string, steps?: AdditionalSharpProResult['itm_steps']) => (
    <Card>
      <Title>{title}</Title>
      {!steps?.length ? <Small>No data</Small> : (
        <TableWrap>
        <Table>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Step</th>
              <th>CE strike</th>
              <th>PE strike</th>
              <th>CE prev</th>
              <th>PE prev</th>
              <th>SMD</th>
            </tr>
          </thead>
          <tbody>
            {steps.map(s => (
              <tr key={title + s.step}>
                <td>{s.step}</td>
                <td>{s.ce_strike}</td>
                <td>{s.pe_strike}</td>
                <td>{s.ce_prev_close?.toFixed(2)}</td>
                <td>{s.pe_prev_close?.toFixed(2)}</td>
                <td><strong>{s.smd?.toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </Table>
        </TableWrap>
      )}
    </Card>
  );

  return (
    <Container>
      <Title>Additional SHARP PRO Logic</Title>
      <Row>
        <div>
          <Label htmlFor="idx">Indices</Label><br />
          <Select
            id="idx"
            value={selIndex}
            onChange={(e) => {
              const v = e.target.value;
              setSelIndex(v);
              setSelStock('');
              setSelCommodity('');
              setSymbol(v as Symbol);
            }}
          >
            <option value="">Select index</option>
            {indices.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="stk">Stocks</Label><br />
          <Select
            id="stk"
            value={selStock}
            onChange={(e) => {
              const v = e.target.value;
              setSelStock(v);
              setSelIndex('');
              setSelCommodity('');
              setSymbol(v as Symbol);
            }}
          >
            <option value="">Select stock</option>
            {stocks.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="com">Commodities</Label><br />
          <Select
            id="com"
            value={selCommodity}
            onChange={(e) => {
              const v = e.target.value;
              setSelCommodity(v);
              setSelIndex('');
              setSelStock('');
              setSymbol(v as Symbol);
            }}
          >
            <option value="">Select commodity</option>
            {commodities.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <AlignEnd>
          <Button onClick={run} disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</Button>
        </AlignEnd>
      </Row>

      {error && <Card style={{borderColor:'#b91c1c', color:'#fecaca'}}>{error}</Card>}

      {data && (
        <>
          <Grid>
            <Card>
              <Title>Overview</Title>
              <KeyStat><StatLabel>Prev day spot close:</StatLabel>{data.prev_day_spot_close.toFixed(2)}</KeyStat>
              <KeyStat><StatLabel>ATM (prev close):</StatLabel>{data.atm_from_prev_close}</KeyStat>
              <KeyStat><StatLabel>ATM round 50 / 100:</StatLabel>{data.atm_round_50} / {data.atm_round_100}</KeyStat>
              <Small>Strike step: {data.strike_interval} | Expiry: {data.expiry || 'nearest'}</Small>
            </Card>
            <Card>
              <Title>ATM Pair</Title>
              <div>Strike: {data.atm_pair.strike}</div>
              <div>CE prev: {data.atm_pair.ce_prev_close?.toFixed(2)}</div>
              <div>PE prev: {data.atm_pair.pe_prev_close?.toFixed(2)}</div>
              <div>SMD: <strong>{data.atm_pair.smd?.toFixed(2)}</strong></div>
            </Card>
            <Card>
              <Title>Summary</Title>
              {Object.entries(data.summary).map(([k,v]) => (
                <div key={k}><StatLabel>{k}</StatLabel><strong>{v?.toFixed(2)}</strong></div>
              ))}
            </Card>
            {/* Removed Threshold Mapping (ATM + ITM) card per request */}
          </Grid>

          <Grid>
            {renderSteps('ITM (10 steps)', data.itm_steps)}
            {renderSteps('OTM (10 steps)', data.otm_steps)}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default AdditionalSharpProPage;
