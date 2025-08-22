import * as XLSX from 'xlsx';
import { OptionData, Symbol } from '../types';
import { formatCurrency, formatLargeNumber } from './helpers';

export interface OptionChainExportData {
  data: OptionData[];
  symbol: Symbol;
  spotPrice: number;
  atmStrike: number;
  timestamp?: Date;
}

export const exportOptionChainToExcel = ({
  data,
  symbol,
  spotPrice,
  atmStrike,
  timestamp = new Date()
}: OptionChainExportData) => {
  // Prepare data for Excel export with bid/ask quantities
  const excelData = data.map((row, index) => {
    const isATM = row.strike_price === atmStrike;
    const ceITM = row.strike_price < spotPrice;
    const peITM = row.strike_price > spotPrice;

    return {
      'S.No': index + 1,
      'CE OI': row.ce_oi ? formatLargeNumber(row.ce_oi) : '-',
      'CE Volume': row.ce_volume ? formatLargeNumber(row.ce_volume) : '-',
      'CE Bid Qty': row.ce_bid_qty ? formatLargeNumber(row.ce_bid_qty) : '-',
      'CE Ask Qty': row.ce_ask_qty ? formatLargeNumber(row.ce_ask_qty) : '-',
      'CE IV': row.ce_iv ? `${row.ce_iv.toFixed(2)}%` : '-',
      'CE LTP': row.ce_ltp ? formatCurrency(row.ce_ltp) : '-',
      'CE Bid': row.ce_bid ? formatCurrency(row.ce_bid) : '-',
      'CE Ask': row.ce_ask ? formatCurrency(row.ce_ask) : '-',
      'Strike Price': row.strike_price,
      'Strike Type': isATM ? 'ATM' : (ceITM ? 'CE ITM' : peITM ? 'PE ITM' : 'OTM'),
      'PE Bid': row.pe_bid ? formatCurrency(row.pe_bid) : '-',
      'PE Ask': row.pe_ask ? formatCurrency(row.pe_ask) : '-',
      'PE LTP': row.pe_ltp ? formatCurrency(row.pe_ltp) : '-',
      'PE IV': row.pe_iv ? `${row.pe_iv.toFixed(2)}%` : '-',
      'PE Ask Qty': row.pe_ask_qty ? formatLargeNumber(row.pe_ask_qty) : '-',
      'PE Bid Qty': row.pe_bid_qty ? formatLargeNumber(row.pe_bid_qty) : '-',
      'PE Volume': row.pe_volume ? formatLargeNumber(row.pe_volume) : '-',
      'PE OI': row.pe_oi ? formatLargeNumber(row.pe_oi) : '-',
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
    { wch: 12 },  // CE Bid Qty
    { wch: 12 },  // CE Ask Qty
    { wch: 10 },  // CE IV
    { wch: 10 },  // CE LTP
    { wch: 10 },  // CE Bid
    { wch: 10 },  // CE Ask
    { wch: 12 },  // Strike Price
    { wch: 12 },  // Strike Type
    { wch: 10 },  // PE Bid
    { wch: 10 },  // PE Ask
    { wch: 10 },  // PE LTP
    { wch: 10 },  // PE IV
    { wch: 12 },  // PE Ask Qty
    { wch: 12 },  // PE Bid Qty
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
    ['Total CE OI', formatLargeNumber(data.reduce((sum, row) => sum + (row.ce_oi || 0), 0))],
    ['Total PE OI', formatLargeNumber(data.reduce((sum, row) => sum + (row.pe_oi || 0), 0))],
    ['Total CE Volume', formatLargeNumber(data.reduce((sum, row) => sum + (row.ce_volume || 0), 0))],
    ['Total PE Volume', formatLargeNumber(data.reduce((sum, row) => sum + (row.pe_volume || 0), 0))],
    ['Total CE Bid Qty', formatLargeNumber(data.reduce((sum, row) => sum + (row.ce_bid_qty || 0), 0))],
    ['Total PE Bid Qty', formatLargeNumber(data.reduce((sum, row) => sum + (row.pe_bid_qty || 0), 0))],
    ['Total CE Ask Qty', formatLargeNumber(data.reduce((sum, row) => sum + (row.ce_ask_qty || 0), 0))],
    ['Total PE Ask Qty', formatLargeNumber(data.reduce((sum, row) => sum + (row.pe_ask_qty || 0), 0))],
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

  return {
    success: true,
    filename,
    recordCount: data.length
  };
};
