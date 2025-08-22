import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { Symbol, MarketType, OptionData, OHLCResponse } from '../../types';
import { ApiService } from '../../services/ApiService';
import { useOptionChain } from '../../hooks/useOptionChain';
import MarketSelector from '../../components/MarketSelector/MarketSelector';
import { formatTime } from '../../utils/helpers';
import { FontAwesomeIcon, faClock, faRefresh, faPlay, faPause } from '../../utils/fontawesome';
import { Button } from '../../components/ui/button';

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

const ControlsBar = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  border: 1px solid #444;
  justify-content: space-between;
`;

const TableWrapper = styled.div`
  background: #121212;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  overflow: auto;
`;

const StrikeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
  th, td { padding: 4px 8px; text-align: right; }
  th { background: #1e1e1e; position: sticky; top: 0; z-index: 1; }
  tbody tr:nth-child(even){ background:#1a1a1a; }
  tbody tr:nth-child(odd){ background:#151515; }
  tbody tr:hover { background:#222; }
  td:first-child, th:first-child { text-align: center; }
`;

const SegmentTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{active:boolean}>`
  background: ${({active})=> active ? '#fff200' : 'transparent'};
  color: ${({active})=> active ? '#000' : '#fff200'};
  border: 1px solid #fff200;
  border-radius:6px;
  padding: 6px 14px;
  font-size:12px;
  font-weight:600;
  cursor:pointer;
  transition: background .15s ease;
  &:hover { background: ${({active})=> active ? '#ffe933' : 'rgba(255,242,0,0.15)'}; }
`;
const RightControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

// Selector for Intraday vs Previous-day table view
const DataSelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DataLabel = styled.label`
  font-size: 12px;
  color: #bbb;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const DataSelect = styled.select.attrs({
  title: 'Select OHLC data view',
  'aria-label': 'Select OHLC data view',
})`
  background: #111;
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
`;
const CallsHeader = styled.th`
  text-align: center;
  color: #00c853;
`;
const PutsHeader = styled.th`
  text-align: center;
  color: #ff1744;
`;

const LastUpdateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #bbb;
`;

const NoData = styled.div`
  padding: 40px;
  text-align: center;
  color: #888;
`;

const UnderlyingCard = styled.div`
  background:#1a1a1a;
  border:1px solid #333;
  border-radius:12px;
  padding:16px 20px;
  display:flex;
  flex-direction:column;
  gap:8px;
`;

const UnderlyingRows = styled.div`
  display:grid;
  grid-template-columns: repeat(auto-fit,minmax(120px,1fr));
  gap:8px;
  font-size:12px;
`;
const UCell = styled.div`
  display:flex;flex-direction:column;gap:2px; background:#111; padding:6px 8px; border-radius:8px; border:1px solid #242424;
  span.label{font-size:10px;letter-spacing:.5px;color:#888;text-transform:uppercase;font-weight:600;}
  span.val{font-weight:600;color:#fff;}
`;
const ChangeVal = styled.span<{pos:boolean}>`
  font-weight:700; color:${p=>p.pos?'#00c853':'#ff1744'};
`;

const UnderlyingHeading = styled.strong`
  color:#fff200;
  font-size:14px;
`;

const CollapseHeader = styled.button`
  width:100%;
  text-align:left;
  background:#171717;
  border:1px solid #333;
  color:#fff;
  padding:10px 12px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  cursor:pointer;
`;
const CollapseBody = styled.div`
  border:1px solid #2a2a2a;
  border-top:none;
  border-radius:0 0 10px 10px;
  padding:10px 12px;
  background:#121212;
`;

interface StrikeLeg {
  o?:number; h?:number; l?:number; c?:number; oi?:number; vol?:number;
  ce_prev_open?: number; ce_prev_high?: number; ce_prev_low?: number; ce_prev_close?: number;
  pe_prev_open?: number; pe_prev_high?: number; pe_prev_low?: number; pe_prev_close?: number;
}
interface StrikeOHLC { strike: number; ce?: StrikeLeg; pe?: StrikeLeg; }

const OHLCPage: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('NSE & BSE');
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [view, setView] = useState<'combined'|'ce'|'pe'>('combined');
  const [underlying, setUnderlying] = useState<OHLCResponse | null>(null);
  const [underlyingError, setUnderlyingError] = useState<string | null>(null);
  const [underlyingLastUpdate, setUnderlyingLastUpdate] = useState<Date | null>(null);
  const [showDailyPanel, setShowDailyPanel] = useState<boolean>(false);
  const [ohlcView, setOhlcView] = useState<'intraday'|'previous'>('intraday');

  // Fetch underlying OHLC (previous + current) every 2s aligned with option chain refresh
  useEffect(()=>{
    let timer: any;
    const fetchUnderlying = async () => {
      try {
        const data = await ApiService.getUnderlyingOHLC(selectedSymbol);
        setUnderlying(data);
        setUnderlyingError(null);
        setUnderlyingLastUpdate(new Date());
      } catch (e:any) {
        setUnderlyingError(e?.message || 'Failed underlying OHLC');
      }
    };
    fetchUnderlying();
    if (autoRefreshEnabled){
      timer = setInterval(fetchUnderlying,2000);
    }
    return ()=> timer && clearInterval(timer);
  },[selectedSymbol, autoRefreshEnabled]);

  const { data: optionChainData, lastUpdate, loading, error, refresh } = useOptionChain({
    symbol: selectedSymbol,
    expiry: selectedExpiry,
    autoRefresh: autoRefreshEnabled,
    refreshInterval: 2000,
  });

  const rows: StrikeOHLC[] = useMemo(() => {
    if (!optionChainData?.option_chain) return [];
    return optionChainData.option_chain.map((r:OptionData) => ({
      strike: r.strike_price,
    ce: {
        o: r.ce_open ?? r.ce_o,
        h: r.ce_high ?? r.ce_h,
        l: r.ce_low ?? r.ce_l,
        c: r.ce_close ?? r.ce_c ?? r.ce_ltp ?? r.ce_last_price,
  ce_prev_open: (r as any).ce_prev_open,
  ce_prev_high: (r as any).ce_prev_high,
  ce_prev_low: (r as any).ce_prev_low,
  ce_prev_close: (r as any).ce_prev_close,
        oi: r.ce_oi,
        vol: r.ce_volume,
      },
    pe: {
        o: r.pe_open ?? r.pe_o,
        h: r.pe_high ?? r.pe_h,
        l: r.pe_low ?? r.pe_l,
        c: r.pe_close ?? r.pe_c ?? r.pe_ltp ?? r.pe_last_price,
  pe_prev_open: (r as any).pe_prev_open,
  pe_prev_high: (r as any).pe_prev_high,
  pe_prev_low: (r as any).pe_prev_low,
  pe_prev_close: (r as any).pe_prev_close,
        oi: r.pe_oi,
        vol: r.pe_volume,
      }
    }));
  }, [optionChainData]);

  return (
    <PageContainer>
      <HeaderSection>
        <Title>All Strikes OHLC</Title>
  <Subtitle>Live per-strike Open / High / Low / Close</Subtitle>
      </HeaderSection>

      <ControlsBar>
        <MarketSelector
          selectedMarket={selectedMarket}
          selectedSymbol={selectedSymbol}
          selectedExpiry={selectedExpiry}
          onMarketChange={setSelectedMarket}
          onSymbolChange={setSelectedSymbol}
          onExpiryChange={setSelectedExpiry}
        />

        <RightControls>
          <SegmentTabs>
            <TabButton active={view==='combined'} onClick={()=>setView('combined')}>Combined</TabButton>
            <TabButton active={view==='ce'} onClick={()=>setView('ce')}>Calls (CE)</TabButton>
            <TabButton active={view==='pe'} onClick={()=>setView('pe')}>Puts (PE)</TabButton>
          </SegmentTabs>
          <DataSelectContainer>
            <DataLabel id="ohlcViewLabel" htmlFor="ohlcView">Data</DataLabel>
            <DataSelect
              id="ohlcView"
              name="ohlcView"
              value={ohlcView}
              onChange={e=>setOhlcView(e.target.value as any)}
              aria-labelledby="ohlcViewLabel"
              title="Select OHLC data view"
              aria-label="Select OHLC data view"
            >
              <option value="intraday">Intraday</option>
              <option value="previous">Previous Day</option>
            </DataSelect>
          </DataSelectContainer>
          <ButtonRow>
            <Button onClick={()=>refresh()} variant="outline" size="sm" disabled={loading} style={{border:'1px solid #fff200', color:'#fff200', background:'transparent'}}>
              <FontAwesomeIcon icon={faRefresh} />
            </Button>
            <Button onClick={()=>setAutoRefreshEnabled(a=>!a)} variant={autoRefreshEnabled? 'default':'outline'} size="sm" style={{border:'1px solid #fff200', background: autoRefreshEnabled? '#fff200':'transparent', color: autoRefreshEnabled? '#000':'#fff200'}}>
              <FontAwesomeIcon icon={autoRefreshEnabled? faPause: faPlay} />
            </Button>
            {lastUpdate && (
              <LastUpdateInfo>
                <FontAwesomeIcon icon={faClock} /> {formatTime(lastUpdate)}
              </LastUpdateInfo>
            )}
          </ButtonRow>
        </RightControls>
      </ControlsBar>

      <UnderlyingCard>
        <UnderlyingHeading>Underlying OHLC</UnderlyingHeading>
        {underlyingError && <NoData style={{padding:'8px 0'}}>{underlyingError}</NoData>}
        {!underlyingError && (
          <UnderlyingRows>
            <UCell><span className="label">Prev High</span><span className="val">{underlying?.previous_day?.high?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">Prev Low</span><span className="val">{underlying?.previous_day?.low?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">Prev Open</span><span className="val">{underlying?.previous_day?.open?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">Open</span><span className="val">{underlying?.current_day?.open?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">High</span><span className="val">{underlying?.current_day?.high?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">Low</span><span className="val">{underlying?.current_day?.low?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">LTP</span><span className="val">{underlying?.current_day?.close?.toFixed(2) ?? '—'}</span></UCell>
            <UCell><span className="label">Prev Close</span><span className="val">{underlying?.reference_price?.toFixed(2) ?? '—'}</span></UCell>
            <UCell>
              <span className="label">Change %</span>
              <ChangeVal pos={((underlying?.current_day?.close||0) - (underlying?.reference_price||0))>=0}>
                {underlying?.reference_price ? (((underlying?.current_day?.close||0)-(underlying?.reference_price||0))/(underlying?.reference_price||1)*100).toFixed(2)+'%' : '—'}
              </ChangeVal>
            </UCell>
            <UCell><span className="label">Updated</span><span className="val">{underlyingLastUpdate? formatTime(underlyingLastUpdate): '—'}</span></UCell>
          </UnderlyingRows>
        )}
      </UnderlyingCard>

      <div>
        <CollapseHeader onClick={()=>setShowDailyPanel(s=>!s)}>
          <span>Daily candles (Prev day + Today) per strike</span>
          <span>{showDailyPanel? '▾':'▸'}</span>
        </CollapseHeader>
        {showDailyPanel && (
          <CollapseBody>
            <StrikeTable>
              <thead>
                <tr>
                  <th>Strike</th>
                  <CallsHeader colSpan={8}>CALLS (Daily)</CallsHeader>
                  <PutsHeader colSpan={8}>PUTS (Daily)</PutsHeader>
                </tr>
                <tr>
                  <th></th>
                  {['PrevO','PrevH','PrevL','PrevC','TodayO','TodayH','TodayL','TodayC'].map(h=> <th key={'ced'+h}>{h}</th>)}
                  {['PrevO','PrevH','PrevL','PrevC','TodayO','TodayH','TodayL','TodayC'].map(h=> <th key={'ped'+h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={'d'+r.strike}>
                    <td>{r.strike}</td>
                    {/* For calls, prev values come from ce_prev_*; today values approximate from ce ohlc */}
                    <td>{r.ce?.ce_prev_open?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.ce_prev_high?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.ce_prev_low?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.ce_prev_close?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.o?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.h?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.l?.toFixed(2) ?? '-'}</td>
                    <td>{r.ce?.c?.toFixed(2) ?? '-'}</td>
                    {/* Puts */}
                    <td>{r.pe?.pe_prev_open?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.pe_prev_high?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.pe_prev_low?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.pe_prev_close?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.o?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.h?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.l?.toFixed(2) ?? '-'}</td>
                    <td>{r.pe?.c?.toFixed(2) ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </StrikeTable>
          </CollapseBody>
        )}
      </div>

      <TableWrapper>
  {error && <NoData>Error: {typeof error === 'string' ? error : ApiService.handleApiError(error)}</NoData>}
        {!error && rows.length === 0 && <NoData>{loading? 'Loading strikes...' : 'No strike data'}</NoData>}
        {!error && rows.length>0 && (
          <StrikeTable>
            <thead>
              <tr>
                <th>Strike</th>
                { (view==='combined' || view==='ce') && (
                  <CallsHeader colSpan={ohlcView==='intraday'? 4: 4}>CALLS</CallsHeader>
                )}
                { (view==='combined' || view==='pe') && (
                  <PutsHeader colSpan={ohlcView==='intraday'? 4: 4}>PUTS</PutsHeader>
                )}
              </tr>
              <tr>
                <th></th>
                { (view==='combined' || view==='ce') && (
                  (ohlcView==='intraday'
                    ? ['O','H','L','C']
                    : ['PrevO','PrevH','PrevL','PrevC']
                  ).map(h=> <th key={'ceh'+h}>{h}</th>)
                )}
                { (view==='combined' || view==='pe') && (
                  (ohlcView==='intraday'
                    ? ['O','H','L','C']
                    : ['PrevO','PrevH','PrevL','PrevC']
                  ).map(h=> <th key={'peh'+h}>{h}</th>)
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.strike}>
                  <td>{r.strike}</td>
                  {(view==='combined' || view==='ce') && (
                    ohlcView==='intraday' ? (
                      <>
                        <td>{r.ce?.o?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.h?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.l?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.c?.toFixed(2) ?? '-'}</td>
                      </>
                    ) : (
                      <>
                        <td>{r.ce?.ce_prev_open?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.ce_prev_high?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.ce_prev_low?.toFixed(2) ?? '-'}</td>
                        <td>{r.ce?.ce_prev_close?.toFixed(2) ?? '-'}</td>
                      </>
                    )
                  )}
                  {(view==='combined' || view==='pe') && (
                    ohlcView==='intraday' ? (
                      <>
                        <td>{r.pe?.o?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.h?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.l?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.c?.toFixed(2) ?? '-'}</td>
                      </>
                    ) : (
                      <>
                        <td>{r.pe?.pe_prev_open?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.pe_prev_high?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.pe_prev_low?.toFixed(2) ?? '-'}</td>
                        <td>{r.pe?.pe_prev_close?.toFixed(2) ?? '-'}</td>
                      </>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </StrikeTable>
        )}
      </TableWrapper>
    </PageContainer>
  );
};

export default OHLCPage;
