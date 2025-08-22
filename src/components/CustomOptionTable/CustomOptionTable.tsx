import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { OptionData, Symbol, ScreenMode } from '../../types';
import { formatCurrency, formatPercentage, formatInLakhs } from '../../utils/helpers';
import { exportToExcel } from '../../utils/excelExport';
import { exportToPDF } from '../../utils/pdfExport';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, 
  faDownload,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';

const TableContainer = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 65, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      rgba(0, 255, 65, 0.02) 0%, 
      rgba(0, 204, 51, 0.02) 100%);
    pointer-events: none;
    z-index: 1;
  }
  
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const StyledTableHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 2px solid #00ff41;
  background: linear-gradient(135deg, rgba(0, 255, 65, 0.05) 0%, rgba(0, 204, 51, 0.05) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  backdrop-filter: blur(10px);
  border-radius: 12px 12px 0 0;
  position: relative;
  z-index: 40; /* ensure header (and its dropdown) stays above scrollable table */
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ff41, transparent);
  }
`;

const HeaderLeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
`;

const HeaderRightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const TableTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &::before {
    content: '??';
    font-size: 1.5rem;
    filter: drop-shadow(0 0 8px rgba(0, 255, 65, 0.5));
  }
`;



const DownloadButton = styled.button`
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 255, 65, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 140px;
  justify-content: center;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #00ff41 0%, #00e63a 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 255, 65, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 255, 65, 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #666 0%, #555 100%);
    color: #999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 14px;
    ${({ disabled }) => disabled && `
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PDFDownloadButton = styled.button`
  background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 140px;
  justify-content: center;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff4444 0%, #ff3a3a 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 68, 68, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(255, 68, 68, 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #666 0%, #555 100%);
    color: #999;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 14px;
    ${({ disabled }) => disabled && `
      animation: spin 1s linear infinite;
    `}
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Column filter styles
const FilterButton = styled.button`
  background: linear-gradient(135deg, #1e90ff 0%, #1c6ed6 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  width: 44px;
  height: 44px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .25s ease;
  box-shadow: 0 4px 12px rgba(30,144,255,0.25);
  position: relative;
  &:hover { background: linear-gradient(135deg,#46a6ff,#1e90ff); transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  svg { font-size: 18px; }
`;

const ColumnFilterPanel = styled.div`
  position: absolute;
  top: 110%;
  left: 0;
  background: #101418;
  border: 1px solid #1e90ff;
  border-radius: 12px;
  padding: 16px 18px 14px 18px;
  width: 420px;
  max-height: 420px;
  overflow-y: auto;
  box-shadow: 0 12px 32px -4px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.06);
  z-index: 400; /* higher than sticky table header cells */
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
  /* Smooth appearing animation */
  animation: fadeSlide .18s ease;

  @keyframes fadeSlide {
    from { opacity:0; transform: translateY(-4px); }
    to { opacity:1; transform: translateY(0); }
  }
`;

const ColumnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(120px,1fr));
  gap: 6px 10px;
`;

const ColumnToggle = styled.label<{active?:boolean}>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 8px;
  border: 1px solid ${({active})=> active? '#1e90ff':'#333'};
  border-radius: 6px;
  background: ${({active})=> active? 'linear-gradient(135deg,#1e90ff33,#1e90ff11)':'#1a1f24'};
  cursor: pointer;
  user-select: none;
  transition: .2s;
  &:hover { border-color:#1e90ff; }
  input { accent-color:#1e90ff; }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
`;

const FilterWrapper = styled.div`
  position: relative;
`;

const SmallActionBtn = styled.button`
  flex:1;
  background:#1e90ff15;
  color:#1e90ff;
  border:1px solid #1e90ff55;
  padding:6px 10px;
  font-size:11px;
  font-weight:600;
  border-radius:6px;
  cursor:pointer;
  letter-spacing:.5px;
  transition:.2s;
  &:hover{background:#1e90ff30;}
`;



const TableWrapper = styled.div<{ screenMode: ScreenMode }>`
  overflow-x: auto;
  overflow-y: auto;
  max-height: ${({ screenMode }) => {
    switch (screenMode) {
      case 'mobile': return '60vh';
      case 'tablet': return '70vh';
      default: return '80vh';
    }
  }};
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.primary};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.secondary};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
  
  /* Ensure proper table layout */
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  min-width: 3380px; /* Increased to accommodate signal confidence columns */
  table-layout: fixed; /* Fixed table layout for consistent column widths */
  position: relative;
`;

const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ theme }) => theme.colors.background.tertiary};
`;

const HeaderRow = styled.tr`
  border-bottom: 2px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.tertiary};
`;

const HeaderCell = styled.th<{ align?: 'left' | 'center' | 'right'; width?: string }>`
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: ${({ align }) => align || 'center'};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  white-space: nowrap;
  width: ${({ width }) => width || '90px'}; /* Default column width */
  min-width: ${({ width }) => width || '90px'};
  max-width: ${({ width }) => width || '90px'};
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  z-index: 11;

  &:last-child {
    border-right: none;
  }
`;

const StrikeHeaderCell = styled(HeaderCell)`
  background: ${({ theme }) => theme.colors.primary};
  color: #000;
  font-weight: 800;
  font-size: 12px;
  width: 100px; /* Fixed width for strike column */
  min-width: 100px;
  max-width: 100px;
  z-index: 12;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ 
  isATM?: boolean; 
  isATMPlusMinusOne?: boolean;
}>`
  background: ${({ isATM, isATMPlusMinusOne, theme }) => {
    if (isATM) return '#000080'; // Navy blue background for actual ATM
    if (isATMPlusMinusOne) return '#ff4444'; // Red background for ATM � 1 rows
    return 'transparent';
  }};
  
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  ${({ isATM, theme }) => isATM && `
    position: sticky;
    top: 30px; /* Position below the header row */
    bottom: 0; /* Also stick to bottom when scrolling up */
    z-index: 10; /* Higher than regular rows but below strike cell */
    border-top: 2px solid #000080;
    border-bottom: 2px solid #000080;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.1);
    color: white; /* White text for better contrast on navy blue background */
  `}

  ${({ isATMPlusMinusOne }) => isATMPlusMinusOne && `
    border-top: 2px solid #ff0000;
    border-bottom: 2px solid #ff0000;
    font-weight: 600;
    color: white; /* White text for better contrast on red background */
    
    /* Style all cells in ATM�1 rows */
    td {
      color: white !important;
      font-weight: 600 !important;
      background: transparent !important;
    }
  `}
`;

const TableCell = styled.td<{ 
  align?: 'left' | 'center' | 'right';
  color?: string;
  highlight?: boolean;
  width?: string;
  isITM?: boolean;
  isOTM?: boolean;
  isCallOTMZone?: boolean;
  isPutOTMZone?: boolean;
  isCallITMZone?: boolean;
  isPutITMZone?: boolean;
  hideContent?: boolean; // New prop to hide content based on filter
}>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  text-align: ${({ align }) => align || 'center'};
  border-right: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  color: ${({ color, theme, isOTM, isPutOTMZone, isCallOTMZone, isPutITMZone, isCallITMZone, hideContent }) => {
    if (hideContent) return 'transparent'; // Hide text when content should be hidden
    if (isPutOTMZone || isCallOTMZone) return '#1e3a5f'; // Dark blue text for zone cells
    if (isPutITMZone || isCallITMZone) return '#8b0045'; // Dark pink text for zone cells
    if (isOTM) return '#888888'; // Grey text for regular OTM
    return color || theme.colors.text.primary;
  }};
  background: ${({ highlight, theme, isITM, isOTM, isCallOTMZone, isPutOTMZone, isCallITMZone, isPutITMZone, hideContent }) => {
    if (hideContent) return '#f0f0f0'; // Light grey background when hidden
    if (isCallOTMZone || isPutOTMZone) return '#add8e6'; // Light blue for zone cells
    if (isCallITMZone || isPutITMZone) return '#ffb3d9'; // Light pink for zone cells
    if (highlight) return theme.colors.primary + '15';
    if (isITM) return '#FF8C00'; // Orange background for regular ITM
    if (isOTM) return '#f5f5f5'; // Light grey background for regular OTM
    return '#ffffff'; // White background for default/neutral cells
  }};
  white-space: nowrap;
  font-weight: ${({ highlight, isITM, isCallOTMZone, isPutOTMZone, isCallITMZone, isPutITMZone }) => 
    (highlight || isITM || isCallOTMZone || isPutOTMZone || isCallITMZone || isPutITMZone) ? '600' : '400'};
  width: ${({ width }) => width || '90px'}; /* Default cell width */
  min-width: ${({ width }) => width || '90px'};
  max-width: ${({ width }) => width || '90px'};
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;

  &:last-child {
    border-right: none;
  }
`;

const StrikeCell = styled(TableCell)<{ 
  isATM?: boolean; 
  isATMPlusMinusOne?: boolean;
}>`
  background: ${({ isATM, isATMPlusMinusOne, theme }) => {
    if (isATM) return '#000080'; // Navy blue background for actual ATM
    if (isATMPlusMinusOne) return '#ff4444'; // Red background for ATM � 1
    return theme.colors.background.tertiary;
  }};
  color: ${({ isATM, isATMPlusMinusOne }) => {
    if (isATM) return 'white'; // White text on navy blue for actual ATM
    if (isATMPlusMinusOne) return 'white'; // White text on red for ATM � 1
    return 'inherit';
  }};
  font-weight: 700;
  font-size: 14px;
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  border-right: 2px solid ${({ theme }) => theme.colors.border.primary};
`;

const EmptyDataCell = styled.td`
  text-align: center;
  padding: 40px;
  color: #888;
  font-style: italic;
`;

interface CustomOptionTableProps {
  data: OptionData[];
  spotPrice: number;
  atmStrike: number;
  symbol: Symbol;
  screenMode?: ScreenMode;
}

const CustomOptionTable: React.FC<CustomOptionTableProps> = ({
  data,
  spotPrice,
  atmStrike,
  symbol,
  screenMode = 'desktop',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [hasScrolledToATM, setHasScrolledToATM] = useState(false);
  // Column visibility state
  const allColumnKeys = useRef<string[]>([
    'ce_oi','ce_volume','ce_iv','ce_ltp','ce_delta','ce_gamma','ce_theta','ce_vega','ce_rho',
    'ce_intrinsic','ce_time_val','ce_buy_percent','ce_sell_percent','ce_tp1','ce_tp2','ce_tp3','ce_stop_loss',
    'ce_signal_type','ce_signal_strength','ce_signal_quality','ce_signal_confidence','strike',
    'pe_signal_confidence','pe_signal_quality','pe_signal_strength','pe_signal_type','pe_stop_loss',
    'pe_tp3','pe_tp2','pe_tp1','pe_sell_percent','pe_buy_percent','pe_time_val','pe_intrinsic',
    'pe_rho','pe_vega','pe_theta','pe_gamma','pe_delta','pe_ltp','pe_iv','pe_volume','pe_oi'
  ]);
  const loadStoredColumns = (): Record<string, boolean> => {
    try { const raw = localStorage.getItem('custom_option_table_columns_v1'); if (raw) return JSON.parse(raw);} catch(e){/*ignore*/}
    const obj: Record<string, boolean> = {}; allColumnKeys.current.forEach(k=> obj[k]=true); return obj;
  };
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(loadStoredColumns);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement|null>(null);

  useEffect(()=>{ try { localStorage.setItem('custom_option_table_columns_v1', JSON.stringify(visibleColumns)); } catch(e){/*ignore*/} }, [visibleColumns]);
  useEffect(()=>{ if(!showFilterPanel) return; const handler=(e:MouseEvent)=>{ if(filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterPanel(false);}; document.addEventListener('mousedown', handler); return ()=> document.removeEventListener('mousedown', handler); },[showFilterPanel]);
  const toggleColumn = (key:string)=> setVisibleColumns(prev=> ({...prev,[key]: !prev[key]}));
  const selectAll = ()=> { const obj:Record<string,boolean>={}; allColumnKeys.current.forEach(k=> obj[k]=true); setVisibleColumns(obj); };
  const clearAll = ()=> { const obj:Record<string,boolean>={}; allColumnKeys.current.forEach(k=> obj[k]=false); obj['strike']=true; setVisibleColumns(obj); };
  const defaultSet = ()=> selectAll();
  const show = (key:string)=> visibleColumns[key] !== false; // default true
  const visibleCount = Object.entries(visibleColumns).filter(([k,v])=> v).length;

  // Draggable column ordering -------------------------------------------------
  const DraggableHeaderCell = styled(HeaderCell)<{isDragging?: boolean}>`
    cursor: grab;
    ${({ isDragging }) => isDragging && `outline:2px dashed #1e90ff; opacity:0.6; cursor: grabbing;`}
  `;
  const DraggableStrikeHeaderCell = styled(StrikeHeaderCell)<{isDragging?: boolean}>`
    cursor: grab;
    ${({ isDragging }) => isDragging && `outline:2px dashed #1e90ff; opacity:0.6; cursor: grabbing;`}
  `;

  const loadStoredOrder = (): string[] => {
    try {
      const raw = localStorage.getItem('custom_option_table_column_order_v1');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return arr.filter((k: string) => allColumnKeys.current.includes(k));
        }
      }
    } catch (e) { /* ignore */ }
    return [...allColumnKeys.current];
  };
  const [orderedColumns, setOrderedColumns] = useState<string[]>(loadStoredOrder);
  // Heal order if new columns introduced
  useEffect(()=> {
    setOrderedColumns(prev => {
      const missing = allColumnKeys.current.filter(k => !prev.includes(k));
      const filtered = prev.filter(k => allColumnKeys.current.includes(k));
      if (!missing.length && filtered.length === prev.length) return prev;
      return [...filtered, ...missing];
    });
  }, [visibleColumns]);
  useEffect(()=> { try { localStorage.setItem('custom_option_table_column_order_v1', JSON.stringify(orderedColumns)); } catch(e){/*ignore*/} }, [orderedColumns]);
  const dragColKey = useRef<string|null>(null);
  const handleDragStart = (key: string) => (e: React.DragEvent) => {
    dragColKey.current = key;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (key: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (targetKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const source = dragColKey.current;
    if (!source || source === targetKey) return;
    setOrderedColumns(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(source);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, source);
      return next;
    });
    dragColKey.current = null;
  };
  const handleDragEnd = () => { dragColKey.current = null; };
  const isDraggingCol = (key: string) => dragColKey.current === key;

  // Column meta (labels, widths, alignment)
  const columnMeta: Record<string, { label: string; width: string; align: 'left' | 'right' | 'center' }> = {
    ce_oi:{label:'CE OI', width:'100px', align:'right'},
    ce_volume:{label:'CE Volume', width:'100px', align:'right'},
    ce_iv:{label:'CE IV', width:'80px', align:'right'},
    ce_ltp:{label:'CE LTP', width:'90px', align:'right'},
    ce_delta:{label:'CE Delta', width:'90px', align:'right'},
    ce_gamma:{label:'CE Gamma', width:'90px', align:'right'},
    ce_theta:{label:'CE Theta', width:'90px', align:'right'},
    ce_vega:{label:'CE Vega', width:'90px', align:'right'},
    ce_rho:{label:'CE Rho', width:'90px', align:'right'},
    ce_intrinsic:{label:'CE Intrinsic', width:'90px', align:'right'},
    ce_time_val:{label:'CE Time Val', width:'90px', align:'right'},
    ce_buy_percent:{label:'CE Buy%', width:'80px', align:'right'},
    ce_sell_percent:{label:'CE Sell%', width:'80px', align:'right'},
    ce_tp1:{label:'CE TP1', width:'90px', align:'right'},
    ce_tp2:{label:'CE TP2', width:'90px', align:'right'},
    ce_tp3:{label:'CE TP3', width:'90px', align:'right'},
    ce_stop_loss:{label:'CE Stop Loss', width:'90px', align:'right'},
    ce_signal_type:{label:'CE Signal Type', width:'100px', align:'right'},
    ce_signal_strength:{label:'CE Strength', width:'90px', align:'right'},
    ce_signal_quality:{label:'CE Quality', width:'90px', align:'right'},
    ce_signal_confidence:{label:'CE Confidence', width:'90px', align:'right'},
    strike:{label:'Strike', width:'90px', align:'center'},
    pe_signal_confidence:{label:'PE Confidence', width:'90px', align:'left'},
    pe_signal_quality:{label:'PE Quality', width:'90px', align:'left'},
    pe_signal_strength:{label:'PE Strength', width:'90px', align:'left'},
    pe_signal_type:{label:'PE Signal Type', width:'100px', align:'left'},
    pe_stop_loss:{label:'PE Stop Loss', width:'90px', align:'left'},
    pe_tp3:{label:'PE TP3', width:'90px', align:'left'},
    pe_tp2:{label:'PE TP2', width:'90px', align:'left'},
    pe_tp1:{label:'PE TP1', width:'90px', align:'left'},
    pe_sell_percent:{label:'PE Sell%', width:'80px', align:'left'},
    pe_buy_percent:{label:'PE Buy%', width:'80px', align:'left'},
    pe_time_val:{label:'PE Time Val', width:'90px', align:'left'},
    pe_intrinsic:{label:'PE Intrinsic', width:'90px', align:'left'},
    pe_rho:{label:'PE Rho', width:'90px', align:'left'},
    pe_vega:{label:'PE Vega', width:'90px', align:'left'},
    pe_theta:{label:'PE Theta', width:'90px', align:'left'},
    pe_gamma:{label:'PE Gamma', width:'90px', align:'left'},
    pe_delta:{label:'PE Delta', width:'90px', align:'left'},
    pe_ltp:{label:'PE LTP', width:'90px', align:'left'},
    pe_iv:{label:'PE IV', width:'80px', align:'left'},
    pe_volume:{label:'PE Volume', width:'100px', align:'left'},
    pe_oi:{label:'PE OI', width:'100px', align:'left'},
  };

  const renderHeaderCells = () => (
    orderedColumns.filter(show).map(key => {
      const meta = columnMeta[key];
      if (!meta) return null;
      const commonProps = {
        key,
        width: meta.width,
        align: meta.align,
        draggable: true,
        onDragStart: handleDragStart(key),
        onDragOver: handleDragOver(key),
        onDrop: handleDrop(key),
        onDragEnd: handleDragEnd,
        isDragging: isDraggingCol(key)
      } as any;
      if (key === 'strike') return <DraggableStrikeHeaderCell {...commonProps}>{meta.label}</DraggableStrikeHeaderCell>;
      return <DraggableHeaderCell {...commonProps}>{meta.label}</DraggableHeaderCell>;
    })
  );

  // Value formatting for generic row rendering
  const formatValue = (key: string, row: any) => {
    switch(key){
      case 'ce_oi': return typeof row.ce_oi==='number'? formatInLakhs(row.ce_oi):'-';
      case 'ce_volume': return typeof row.ce_volume==='number'? formatInLakhs(row.ce_volume):'-';
      case 'ce_iv': return typeof row.ce_iv==='number'? formatPercentage(row.ce_iv):'-';
      case 'ce_ltp': return typeof row.ce_ltp==='number'? formatCurrency(row.ce_ltp):'-';
      case 'ce_delta': return formatGreek(row.ce_delta);
      case 'ce_gamma': return formatGreek(row.ce_gamma);
      case 'ce_theta': return formatGreek(row.ce_theta);
      case 'ce_vega': return formatGreek(row.ce_vega);
      case 'ce_rho': return formatRho(row.ce_rho);
      case 'ce_intrinsic': return formatPrice(row.ce_intrinsic);
      case 'ce_time_val': return formatPrice(row.ce_time_val);
      case 'ce_buy_percent': return formatPercent(row.ce_buy_percent);
      case 'ce_sell_percent': return formatPercent(row.ce_sell_percent);
      case 'ce_tp1': return formatPrice(row.ce_tp1);
      case 'ce_tp2': return formatPrice(row.ce_tp2);
      case 'ce_tp3': return formatPrice(row.ce_tp3);
      case 'ce_stop_loss': return formatPrice(row.ce_stop_loss);
      case 'ce_signal_type': return formatSignal(row.ce_signal_type);
      case 'ce_signal_strength': return formatSignalStrength(row.ce_signal_strength);
      case 'ce_signal_quality': return formatSignal(row.ce_signal_quality);
      case 'ce_signal_confidence': return formatSignal(row.ce_signal_confidence);
      case 'pe_signal_confidence': return formatSignal(row.pe_signal_confidence);
      case 'pe_signal_quality': return formatSignal(row.pe_signal_quality);
      case 'pe_signal_strength': return formatSignalStrength(row.pe_signal_strength);
      case 'pe_signal_type': return formatSignal(row.pe_signal_type);
      case 'pe_stop_loss': return formatPrice(row.pe_stop_loss);
      case 'pe_tp3': return formatPrice(row.pe_tp3);
      case 'pe_tp2': return formatPrice(row.pe_tp2);
      case 'pe_tp1': return formatPrice(row.pe_tp1);
      case 'pe_sell_percent': return formatPercent(row.pe_sell_percent);
      case 'pe_buy_percent': return formatPercent(row.pe_buy_percent);
      case 'pe_time_val': return formatPrice(row.pe_time_val);
      case 'pe_intrinsic': return formatPrice(row.pe_intrinsic);
      case 'pe_rho': return formatRho(row.pe_rho);
      case 'pe_vega': return formatGreek(row.pe_vega);
      case 'pe_theta': return formatGreek(row.pe_theta);
      case 'pe_gamma': return formatGreek(row.pe_gamma);
      case 'pe_delta': return formatGreek(row.pe_delta);
      case 'pe_ltp': return typeof row.pe_ltp==='number'? formatCurrency(row.pe_ltp):'-';
      case 'pe_iv': return typeof row.pe_iv==='number'? formatPercentage(row.pe_iv):'-';
      case 'pe_volume': return typeof row.pe_volume==='number'? formatInLakhs(row.pe_volume):'-';
      case 'pe_oi': return typeof row.pe_oi==='number'? formatInLakhs(row.pe_oi):'-';
      case 'strike': return row.strike_price;
      default: return '-';
    }
  };

  // Zone detection functions - must be defined before sortedData useMemo
  const isATMStrike = (strike: number) => {
    // Only the exact ATM strike
    return strike === atmStrike;
  };

  const isATMPlusMinusOne = (strike: number) => {
    // Dynamically calculate strike interval by finding the smallest gap between strikes
    const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
    let strikeInterval = 50; // Default for NIFTY
    
    if (strikes.length > 1) {
      const intervals = [];
      for (let i = 1; i < strikes.length; i++) {
        intervals.push(strikes[i] - strikes[i - 1]);
      }
      strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
    }
    
    // Check if the strike is ATM-1 or ATM+1 (but not the actual ATM)
    return (strike === atmStrike - strikeInterval || 
            strike === atmStrike + strikeInterval) && 
           strike !== atmStrike;
  };


  // New zone detection functions for specific cells
  const isCallOTMZone = (strike: number) => {
    // From ATM+1: +5 strikes of CALL OTM (light blue)
    const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
    let strikeInterval = 50;
    
    if (strikes.length > 1) {
      const intervals = [];
      for (let i = 1; i < strikes.length; i++) {
        intervals.push(strikes[i] - strikes[i - 1]);
      }
      strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
    }
    
    const atmPlusOne = atmStrike + strikeInterval;
    
    // Check if strike is in the 5 CALL OTM strikes from ATM+1
    for (let i = 1; i <= 5; i++) {
      if (strike === atmPlusOne + (i * strikeInterval)) {
        return true;
      }
    }
    return false;
  };

  const isPutOTMZone = (strike: number) => {
    // From ATM-1: -5 strikes of PUT OTM (light blue)
    const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
    let strikeInterval = 50;
    
    if (strikes.length > 1) {
      const intervals = [];
      for (let i = 1; i < strikes.length; i++) {
        intervals.push(strikes[i] - strikes[i - 1]);
      }
      strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
    }
    
    const atmMinusOne = atmStrike - strikeInterval;
    
    // Check if strike is in the 5 PUT OTM strikes from ATM-1
    for (let i = 1; i <= 5; i++) {
      if (strike === atmMinusOne - (i * strikeInterval)) {
        return true;
      }
    }
    return false;
  };

  const isCallITMZone = (strike: number) => {
    // From ATM-1: -5 strikes of CALL ITM (light pink)
    const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
    let strikeInterval = 50;
    
    if (strikes.length > 1) {
      const intervals = [];
      for (let i = 1; i < strikes.length; i++) {
        intervals.push(strikes[i] - strikes[i - 1]);
      }
      strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
    }
    
    const atmMinusOne = atmStrike - strikeInterval;
    
    // Check if strike is in the 5 CALL ITM strikes from ATM-1
    for (let i = 1; i <= 5; i++) {
      if (strike === atmMinusOne - (i * strikeInterval)) {
        return true;
      }
    }
    return false;
  };

  const isPutITMZone = (strike: number) => {
    // From ATM+1: +5 strikes of PUT ITM (light pink)
    const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
    let strikeInterval = 50;
    
    if (strikes.length > 1) {
      const intervals = [];
      for (let i = 1; i < strikes.length; i++) {
        intervals.push(strikes[i] - strikes[i - 1]);
      }
      strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
    }
    
    const atmPlusOne = atmStrike + strikeInterval;
    
    // Check if strike is in the 5 PUT ITM strikes from ATM+1
    for (let i = 1; i <= 5; i++) {
      if (strike === atmPlusOne + (i * strikeInterval)) {
        return true;
      }
    }
    return false;
  };

  // Excel download handler
  const handleDownloadExcel = async () => {
    try {
      if (!data || data.length === 0) {
        alert('? No data available to export');
        return;
      }

      const dataToExport = data;
      
      if (dataToExport.length === 0) {
        alert('? No data matching current filter to export');
        return;
      }

      setIsDownloading(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        try {
          const filename = exportToExcel({
            data: dataToExport,
            symbol,
            spotPrice,
            atmStrike,
            timestamp: new Date()
          });
          
          // Show success message with animation
          console.log(`? Excel file exported successfully: ${filename}`);
          
          // Create a temporary success indicator
          const successDiv = document.createElement('div');
          successDiv.innerHTML = '? Downloaded!';
          successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff41, #00cc33);
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 700;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(0, 255, 65, 0.4);
            animation: slideIn 0.3s ease;
          `;
          
          // Add animation keyframes
          if (!document.querySelector('#success-animation-style')) {
            const style = document.createElement('style');
            style.id = 'success-animation-style';
            style.textContent = `
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `;
            document.head.appendChild(style);
          }
          
          document.body.appendChild(successDiv);
          
          // Remove success indicator after 3 seconds
          setTimeout(() => {
            if (successDiv.parentNode) {
              successDiv.parentNode.removeChild(successDiv);
            }
          }, 3000);
          
        } catch (error) {
          console.error('Error exporting to Excel:', error);
          alert('? Failed to export Excel file. Please try again.');
        } finally {
          setIsDownloading(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('? Failed to export Excel file. Please try again.');
      setIsDownloading(false);
    }
  };

  // PDF download handler
  const handleDownloadPDF = async () => {
    try {
      if (!data || data.length === 0) {
        alert('? No data available to export');
        return;
      }

      const dataToExport = data;
      
      if (dataToExport.length === 0) {
        alert('? No data matching current filter to export');
        return;
      }

      setIsDownloadingPDF(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        try {
          const filename = exportToPDF({
            data: dataToExport,
            symbol,
            spotPrice,
            atmStrike,
            timestamp: new Date()
          });
          
          // Show success message with animation
          console.log(`? PDF file exported successfully: ${filename}`);
          
          // Create a temporary success indicator
          const successDiv = document.createElement('div');
          successDiv.innerHTML = '?? PDF Downloaded!';
          successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff4444, #cc3333);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 700;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(255, 68, 68, 0.4);
            animation: slideIn 0.3s ease;
          `;
          
          // Add animation keyframes if not already present
          if (!document.querySelector('#success-animation-style')) {
            const style = document.createElement('style');
            style.id = 'success-animation-style';
            style.textContent = `
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `;
            document.head.appendChild(style);
          }
          
          document.body.appendChild(successDiv);
          
          // Remove success indicator after 3 seconds
          setTimeout(() => {
            if (successDiv.parentNode) {
              successDiv.parentNode.removeChild(successDiv);
            }
          }, 3000);
          
        } catch (error) {
          console.error('Error exporting to PDF:', error);
          alert('? Failed to export PDF file. Please try again.');
        } finally {
          setIsDownloadingPDF(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('? Failed to export PDF file. Please try again.');
      setIsDownloadingPDF(false);
    }
  };

  // Sort data by strike price
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => a.strike_price - b.strike_price);
  }, [data]);


  // Auto-scroll to ATM strike within table container only - ONLY on initial load
  useEffect(() => {
    if (atmStrike && sortedData.length > 0 && !hasScrolledToATM) {
      setTimeout(() => {
        const tableWrapper = document.querySelector('[data-table-wrapper="custom-option-table"]') as HTMLElement;
        const atmElement = document.querySelector(`[data-strike="${atmStrike}"]`) as HTMLElement;
        
        if (atmElement && tableWrapper) {
          // Calculate the position to scroll to center the ATM strike within the table
          const scrollTop = atmElement.offsetTop - (tableWrapper.clientHeight / 2) + (atmElement.clientHeight / 2);
          
          // Smooth scroll within the table wrapper only
          tableWrapper.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });
          
          // Mark as scrolled so it won't auto-scroll again
          setHasScrolledToATM(true);
        }
      }, 100);
    }
  }, [atmStrike, sortedData, hasScrolledToATM]);

  const isITM = (strike: number, type: 'CE' | 'PE') => {
    if (type === 'CE') return strike < spotPrice;
    return strike > spotPrice;
  };

  const isHighOI = (oi: number) => oi > 100000;
  const isHighVolume = (volume: number) => volume > 10000;
  
  const formatRho = (rho: any) => {
    if (typeof rho !== 'number' || rho === null || rho === undefined) {
      return '-';
    }
    if (Math.abs(rho) < 0.000001) {
      return '~0';
    }
    // For very small values, use more decimal places
    if (Math.abs(rho) < 0.01) {
      return rho.toFixed(6);
    }
    return rho.toFixed(4);
  };

  const formatPrice = (price: any) => {
    if (typeof price !== 'number' || price === null || price === undefined) {
      return '-';
    }
    return formatCurrency(price);
  };

  const formatPercent = (percent: any) => {
    if (typeof percent !== 'number' || percent === null || percent === undefined) {
      return '-';
    }
    return `${percent.toFixed(2)}%`;
  };

  const formatSignalStrength = (strength: any) => {
    if (typeof strength !== 'number' || strength === null || strength === undefined) {
      return '-';
    }
    return strength.toString(); // Display as integer (1-5)
  };

  const formatSignal = (signal: any) => {
    if (!signal || signal === null || signal === undefined) {
      return '-';
    }
    return String(signal);
  };

  // Helper function for Greeks formatting
  const formatGreek = (value: any) => {
    if (typeof value !== 'number' || value === null || value === undefined) {
      // Handle objects that might have code and details properties
      if (typeof value === 'object' && value !== null) {
        if (value.code !== undefined) {
          return String(value.code);
        }
        if (value.details !== undefined) {
          return String(value.details);
        }
        // Return a safe string representation
        return JSON.stringify(value);
      }
      return '-';
    }
    return value.toFixed(4);
  };

  if (!data || data.length === 0) {
    return (
      <TableContainer>
        <StyledTableHeader>
          <HeaderLeftSection>
            <TableTitle>Custom Option Analysis - {symbol}</TableTitle>
            <FilterWrapper ref={filterRef}>
              <FilterButton
                type="button"
                onClick={()=> setShowFilterPanel(s=> !s)}
                aria-label={`Filter columns (${visibleCount} visible)`}
                title={`Filter columns (${visibleCount} visible)`}
              >
                <FontAwesomeIcon icon={faFilter} />
              </FilterButton>
              {showFilterPanel && (
                <ColumnFilterPanel>
                  <ColumnsGrid>
                    {allColumnKeys.current.map(key => (
                      <ColumnToggle key={key} active={show(key)}>
                        <input
                          type="checkbox"
                          checked={show(key)}
                          onChange={()=> toggleColumn(key)}
                          title={`Toggle ${key}`}
                        />
                        {key.replace(/_/g,' ').toUpperCase()}
                      </ColumnToggle>
                    ))}
                  </ColumnsGrid>
                  <FilterActions>
                    <SmallActionBtn type="button" onClick={selectAll}>ALL</SmallActionBtn>
                    <SmallActionBtn type="button" onClick={clearAll}>CLEAR</SmallActionBtn>
                    <SmallActionBtn type="button" onClick={defaultSet}>RESET</SmallActionBtn>
                  </FilterActions>
                </ColumnFilterPanel>
              )}
            </FilterWrapper>
          </HeaderLeftSection>
          <HeaderRightSection>
            <DownloadButton onClick={handleDownloadExcel} disabled={isDownloading}>
              <FontAwesomeIcon icon={faDownload} />
              {isDownloading ? 'Exporting...' : 'Export Excel'}
            </DownloadButton>
            <PDFDownloadButton onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
              <FontAwesomeIcon icon={faFilePdf} />
              {isDownloadingPDF ? 'Generating...' : 'Export PDF'}
            </PDFDownloadButton>
          </HeaderRightSection>
        </StyledTableHeader>
        <TableWrapper screenMode={screenMode} data-table-wrapper="custom-option-table">
          <Table>
            <TableHead>
              <HeaderRow>
                {renderHeaderCells()}
              </HeaderRow>
            </TableHead>
            <TableBody>
              <tr>
                  <EmptyDataCell colSpan={visibleCount}>
                  Waiting for data...
                </EmptyDataCell>
              </tr>
            </TableBody>
          </Table>
        </TableWrapper>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <StyledTableHeader>
        <HeaderLeftSection>
          <TableTitle>Custom Option Analysis - {symbol}</TableTitle>
          <FilterWrapper ref={filterRef}>
            <FilterButton
              type="button"
              onClick={()=> setShowFilterPanel(s=> !s)}
              aria-label={`Filter columns (${visibleCount} visible)`}
              title={`Filter columns (${visibleCount} visible)`}
            >
              <FontAwesomeIcon icon={faFilter} />
            </FilterButton>
            {showFilterPanel && (
              <ColumnFilterPanel>
                <ColumnsGrid>
                  {allColumnKeys.current.map(key => (
                    <ColumnToggle key={key} active={show(key)}>
                      <input
                        type="checkbox"
                        checked={show(key)}
                        onChange={()=> toggleColumn(key)}
                        title={`Toggle ${key}`}
                      />
                      {key.replace(/_/g,' ').toUpperCase()}
                    </ColumnToggle>
                  ))}
                </ColumnsGrid>
                <FilterActions>
                  <SmallActionBtn type="button" onClick={selectAll}>ALL</SmallActionBtn>
                  <SmallActionBtn type="button" onClick={clearAll}>CLEAR</SmallActionBtn>
                  <SmallActionBtn type="button" onClick={defaultSet}>RESET</SmallActionBtn>
                </FilterActions>
              </ColumnFilterPanel>
            )}
          </FilterWrapper>
        </HeaderLeftSection>
        <HeaderRightSection>
          <DownloadButton onClick={handleDownloadExcel} disabled={isDownloading}>
            <FontAwesomeIcon icon={faDownload} />
            {isDownloading ? 'Exporting...' : 'Export Excel'}
          </DownloadButton>
          <PDFDownloadButton onClick={handleDownloadPDF} disabled={isDownloadingPDF}>
            <FontAwesomeIcon icon={faFilePdf} />
            {isDownloadingPDF ? 'Generating...' : 'Export PDF'}
          </PDFDownloadButton>
        </HeaderRightSection>
      </StyledTableHeader>

      <TableWrapper screenMode={screenMode} data-table-wrapper="custom-option-table">
        <Table>
          <TableHead>
            <HeaderRow>
              {renderHeaderCells()}
            </HeaderRow>
          </TableHead>
          
          <TableBody>
            {sortedData.map(row => (
              <TableRow
                key={row.strike_price}
                isATM={isATMStrike(row.strike_price)}
                isATMPlusMinusOne={isATMPlusMinusOne(row.strike_price)}
                data-strike={row.strike_price}
              >
                {orderedColumns.filter(show).map(colKey => {
                  const meta = columnMeta[colKey];
                  if (!meta) return null;
                  if (colKey === 'strike') {
                    return (
                      <StrikeCell
                        key={colKey}
                        isATM={isATMStrike(row.strike_price)}
                        isATMPlusMinusOne={isATMPlusMinusOne(row.strike_price)}
                      >{row.strike_price}</StrikeCell>
                    );
                  }
                  const isCE = colKey.startsWith('ce_');
                  const isPE = colKey.startsWith('pe_');
                  const highlight = (colKey === 'ce_oi' && isHighOI(row.ce_oi || 0)) ||
                                    (colKey === 'pe_oi' && isHighOI(row.pe_oi || 0)) ||
                                    (colKey === 'ce_volume' && isHighVolume(row.ce_volume || 0)) ||
                                    (colKey === 'pe_volume' && isHighVolume(row.pe_volume || 0));
                  return (
                    <TableCell
                      key={colKey}
                      align={meta.align === 'center' ? 'left' : meta.align}
                      width={meta.width}
                      highlight={highlight}
                      isITM={isCE ? isITM(row.strike_price,'CE') : isPE ? isITM(row.strike_price,'PE') : undefined}
                      isOTM={isCE ? !isITM(row.strike_price,'CE') : isPE ? !isITM(row.strike_price,'PE') : undefined}
                      isCallOTMZone={isCE ? isCallOTMZone(row.strike_price): undefined}
                      isCallITMZone={isCE ? isCallITMZone(row.strike_price): undefined}
                      isPutOTMZone={isPE ? isPutOTMZone(row.strike_price): undefined}
                      isPutITMZone={isPE ? isPutITMZone(row.strike_price): undefined}
                      hideContent={false}
                    >
                      {formatValue(colKey, row)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};

export default CustomOptionTable; 
