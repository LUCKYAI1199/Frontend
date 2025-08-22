import * as XLSX from 'xlsx';
import { OptionData, Symbol } from '../types';
import { formatCurrency, formatInLakhs } from './helpers';

export interface ExcelExportData {
  data: OptionData[];
  symbol: Symbol;
  spotPrice: number;
  atmStrike: number;
  timestamp?: Date;
}

export const exportToExcel = ({
  data,
  symbol,
  spotPrice,
  atmStrike,
  timestamp = new Date()
}: ExcelExportData) => {
  // Prepare data for Excel export
  const excelData = data.map((row, index) => {
    const isATM = row.strike_price === atmStrike;
    const ceITM = row.strike_price < spotPrice;
    const peITM = row.strike_price > spotPrice;

    return {
      'S.No': index + 1,
      'CE OI': row.ce_oi ? formatInLakhs(row.ce_oi) : '-',
      'CE Volume': row.ce_volume ? formatInLakhs(row.ce_volume) : '-',
      'CE IV': row.ce_iv ? `${row.ce_iv.toFixed(2)}%` : '-',
      'CE LTP': row.ce_ltp ? formatCurrency(row.ce_ltp) : '-',
      'CE Change': row.ce_change ? `${row.ce_change > 0 ? '+' : ''}${row.ce_change.toFixed(2)}` : '-',
      'CE Change %': row.ce_change && row.ce_ltp ? `${((row.ce_change / (row.ce_ltp - row.ce_change)) * 100).toFixed(2)}%` : '-',
      'CE Bid': row.ce_bid ? formatCurrency(row.ce_bid) : '-',
      'CE Ask': row.ce_ask ? formatCurrency(row.ce_ask) : '-',
      'CE Delta': row.ce_delta ? row.ce_delta.toFixed(4) : '-',
      'CE Gamma': row.ce_gamma ? row.ce_gamma.toFixed(4) : '-',
      'CE Theta': row.ce_theta ? row.ce_theta.toFixed(4) : '-',
      'CE Vega': row.ce_vega ? row.ce_vega.toFixed(4) : '-',
      'CE Rho': row.ce_rho ? row.ce_rho.toFixed(6) : '-',
      'CE Signal': row.ce_signal_type || '-',
      'CE Signal Strength': row.ce_signal_strength || '-',
      'CE Signal Quality': row.ce_signal_quality || '-',
      'Strike Price': row.strike_price,
      'Strike Type': isATM ? 'ATM' : (ceITM ? 'CE ITM' : peITM ? 'PE ITM' : 'OTM'),
      'PE Signal Quality': row.pe_signal_quality || '-',
      'PE Signal Strength': row.pe_signal_strength || '-',
      'PE Signal': row.pe_signal_type || '-',
      'PE Rho': row.pe_rho ? row.pe_rho.toFixed(6) : '-',
      'PE Vega': row.pe_vega ? row.pe_vega.toFixed(4) : '-',
      'PE Theta': row.pe_theta ? row.pe_theta.toFixed(4) : '-',
      'PE Gamma': row.pe_gamma ? row.pe_gamma.toFixed(4) : '-',
      'PE Delta': row.pe_delta ? row.pe_delta.toFixed(4) : '-',
      'PE Ask': row.pe_ask ? formatCurrency(row.pe_ask) : '-',
      'PE Bid': row.pe_bid ? formatCurrency(row.pe_bid) : '-',
      'PE Change %': row.pe_change && row.pe_ltp ? `${((row.pe_change / (row.pe_ltp - row.pe_change)) * 100).toFixed(2)}%` : '-',
      'PE Change': row.pe_change ? `${row.pe_change > 0 ? '+' : ''}${row.pe_change.toFixed(2)}` : '-',
      'PE LTP': row.pe_ltp ? formatCurrency(row.pe_ltp) : '-',
      'PE IV': row.pe_iv ? `${row.pe_iv.toFixed(2)}%` : '-',
      'PE Volume': row.pe_volume ? formatInLakhs(row.pe_volume) : '-',
      'PE OI': row.pe_oi ? formatInLakhs(row.pe_oi) : '-',
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const colWidths = [
    { wch: 6 },   // S.No
    { wch: 12 },  // CE OI
    { wch: 12 },  // CE Volume
    { wch: 10 },  // CE IV
    { wch: 10 },  // CE LTP
    { wch: 10 },  // CE Change
    { wch: 12 },  // CE Change %
    { wch: 10 },  // CE Bid
    { wch: 10 },  // CE Ask
    { wch: 10 },  // CE Delta
    { wch: 10 },  // CE Gamma
    { wch: 10 },  // CE Theta
    { wch: 10 },  // CE Vega
    { wch: 12 },  // CE Rho
    { wch: 10 },  // CE Signal
    { wch: 15 },  // CE Signal Strength
    { wch: 15 },  // CE Signal Quality
    { wch: 12 },  // Strike Price
    { wch: 12 },  // Strike Type
    { wch: 15 },  // PE Signal Quality
    { wch: 15 },  // PE Signal Strength
    { wch: 10 },  // PE Signal
    { wch: 12 },  // PE Rho
    { wch: 10 },  // PE Vega
    { wch: 10 },  // PE Theta
    { wch: 10 },  // PE Gamma
    { wch: 10 },  // PE Delta
    { wch: 10 },  // PE Ask
    { wch: 10 },  // PE Bid
    { wch: 12 },  // PE Change %
    { wch: 10 },  // PE Change
    { wch: 10 },  // PE LTP
    { wch: 10 },  // PE IV
    { wch: 12 },  // PE Volume
    { wch: 12 },  // PE OI
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Option Chain');

  // Create summary sheet with key metrics
  const summaryData = [
    ['Report Details', ''],
    ['Symbol', symbol],
    ['Spot Price', formatCurrency(spotPrice)],
    ['ATM Strike', atmStrike],
    ['Export Date', timestamp.toLocaleString()],
    ['Total Records', data.length],
    ['', ''],
    ['Key Metrics', ''],
    ['Total CE OI', formatInLakhs(data.reduce((sum, row) => sum + (row.ce_oi || 0), 0))],
    ['Total PE OI', formatInLakhs(data.reduce((sum, row) => sum + (row.pe_oi || 0), 0))],
    ['Total CE Volume', formatInLakhs(data.reduce((sum, row) => sum + (row.ce_volume || 0), 0))],
    ['Total PE Volume', formatInLakhs(data.reduce((sum, row) => sum + (row.pe_volume || 0), 0))],
    ['PCR (OI)', ((data.reduce((sum, row) => sum + (row.pe_oi || 0), 0)) / (data.reduce((sum, row) => sum + (row.ce_oi || 0), 0) || 1)).toFixed(2)],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate filename with timestamp
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `${symbol}_Option_Chain_${dateStr}_${timeStr}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);

  return filename;
};
