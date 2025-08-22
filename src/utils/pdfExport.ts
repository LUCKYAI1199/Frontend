import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OptionData, Symbol } from '../types';
import { formatCurrency } from './helpers';

interface PDFExportOptions {
  data: OptionData[];
  symbol: Symbol;
  spotPrice: number;
  atmStrike: number;
  timestamp: Date;
}

interface PDFRowData {
  callLTP: string;
  callBuyPercent: string;
  callSellPercent: string;
  callTP1: string;
  callTP2: string;
  callTP3: string;
  callStopLoss: string;
  strike: string;
  putStopLoss: string;
  putTP3: string;
  putTP2: string;
  putTP1: string;
  putSellPercent: string;
  putBuyPercent: string;
  putLTP: string;
}

const formatPrice = (price: any): string => {
  if (typeof price !== 'number' || price === null || price === undefined) {
    return '-';
  }
  return formatCurrency(price);
};

const formatPercent = (percent: any): string => {
  if (typeof percent !== 'number' || percent === null || percent === undefined) {
    return '-';
  }
  return `${percent.toFixed(2)}%`;
};

// Zone detection functions (same as in CustomOptionTable)
const getStrikeInterval = (data: OptionData[]): number => {
  const strikes = data.map(row => row.strike_price).sort((a, b) => a - b);
  let strikeInterval = 50; // Default for NIFTY
  
  if (strikes.length > 1) {
    const intervals = [];
    for (let i = 1; i < strikes.length; i++) {
      intervals.push(strikes[i] - strikes[i - 1]);
    }
    strikeInterval = Math.min(...intervals.filter(interval => interval > 0));
  }
  
  return strikeInterval;
};

const isATMStrike = (strike: number, atmStrike: number): boolean => {
  return strike === atmStrike;
};

const isATMPlusMinusOne = (strike: number, atmStrike: number, data: OptionData[]): boolean => {
  const strikeInterval = getStrikeInterval(data);
  return (strike === atmStrike - strikeInterval || 
          strike === atmStrike + strikeInterval) && 
         strike !== atmStrike;
};

const isCallOTMZone = (strike: number, atmStrike: number, data: OptionData[]): boolean => {
  const strikeInterval = getStrikeInterval(data);
  const atmPlusOne = atmStrike + strikeInterval;
  
  for (let i = 1; i <= 5; i++) {
    if (strike === atmPlusOne + (i * strikeInterval)) {
      return true;
    }
  }
  return false;
};

const isPutOTMZone = (strike: number, atmStrike: number, data: OptionData[]): boolean => {
  const strikeInterval = getStrikeInterval(data);
  const atmMinusOne = atmStrike - strikeInterval;
  
  for (let i = 1; i <= 5; i++) {
    if (strike === atmMinusOne - (i * strikeInterval)) {
      return true;
    }
  }
  return false;
};

const isCallITMZone = (strike: number, atmStrike: number, data: OptionData[]): boolean => {
  const strikeInterval = getStrikeInterval(data);
  const atmMinusOne = atmStrike - strikeInterval;
  
  for (let i = 1; i <= 5; i++) {
    if (strike === atmMinusOne - (i * strikeInterval)) {
      return true;
    }
  }
  return false;
};

const isPutITMZone = (strike: number, atmStrike: number, data: OptionData[]): boolean => {
  const strikeInterval = getStrikeInterval(data);
  const atmPlusOne = atmStrike + strikeInterval;
  
  for (let i = 1; i <= 5; i++) {
    if (strike === atmPlusOne + (i * strikeInterval)) {
      return true;
    }
  }
  return false;
};

const isITM = (strike: number, spotPrice: number, type: 'CE' | 'PE'): boolean => {
  if (type === 'CE') return strike < spotPrice;
  return strike > spotPrice;
};

const getCellColor = (strike: number, atmStrike: number, spotPrice: number, data: OptionData[], type: 'CE' | 'PE'): string => {
  const isCallOTM = isCallOTMZone(strike, atmStrike, data);
  const isPutOTM = isPutOTMZone(strike, atmStrike, data);
  const isCallITM = isCallITMZone(strike, atmStrike, data);
  const isPutITM = isPutITMZone(strike, atmStrike, data);
  const regularITM = isITM(strike, spotPrice, type);
  const regularOTM = !regularITM;

  if (type === 'CE') {
    if (isCallOTM) return '#add8e6'; // Light blue for Call OTM zone
    if (isCallITM) return '#ffb3d9'; // Light pink for Call ITM zone
  } else {
    if (isPutOTM) return '#add8e6'; // Light blue for Put OTM zone
    if (isPutITM) return '#ffb3d9'; // Light pink for Put ITM zone
  }

  if (regularITM) return '#FF8C00'; // Orange for regular ITM
  if (regularOTM) return '#f5f5f5'; // Light grey for regular OTM
  
  return '#ffffff'; // Default white
};

const getStrikeColor = (strike: number, atmStrike: number, data: OptionData[]): string => {
  if (isATMStrike(strike, atmStrike)) return '#00ff41'; // Green for ATM
  if (isATMPlusMinusOne(strike, atmStrike, data)) return '#ff4444'; // Red for ATM±1
  return '#f5f5f5'; // Light grey for others
};

export const exportToPDF = (options: PDFExportOptions): string => {
  const { data, symbol, spotPrice, atmStrike, timestamp } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data available for PDF export');
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(`${symbol} Option Chain Analysis`, 14, 20);
  
  // Add metadata
  doc.setFontSize(12);
  doc.text(`Generated: ${timestamp.toLocaleString()}`, 14, 30);
  doc.text(`Spot Price: ${formatCurrency(spotPrice)} | ATM Strike: ${formatCurrency(atmStrike, 0)}`, 14, 37);

  // Prepare table data
  const tableData: PDFRowData[] = data.map(row => ({
    callLTP: formatPrice(row.ce_ltp),
    callBuyPercent: formatPercent(row.ce_buy_percent),
    callSellPercent: formatPercent(row.ce_sell_percent),
    callTP1: formatPrice(row.ce_tp1),
    callTP2: formatPrice(row.ce_tp2),
    callTP3: formatPrice(row.ce_tp3),
    callStopLoss: formatPrice(row.ce_stop_loss),
    strike: formatCurrency(row.strike_price, 0),
    putStopLoss: formatPrice(row.pe_stop_loss),
    putTP3: formatPrice(row.pe_tp3),
    putTP2: formatPrice(row.pe_tp2),
    putTP1: formatPrice(row.pe_tp1),
    putSellPercent: formatPercent(row.pe_sell_percent),
    putBuyPercent: formatPercent(row.pe_buy_percent),
    putLTP: formatPrice(row.pe_ltp)
  }));

  // Define table structure
  autoTable(doc, {
    head: [[
      'CE LTP', 'CE Buy%', 'CE Sell%', 'CE TP1', 'CE TP2', 'CE TP3', 'CE Stop Loss',
      'Strike',
      'PE Stop Loss', 'PE TP3', 'PE TP2', 'PE TP1', 'PE Sell%', 'PE Buy%', 'PE LTP'
    ]],
    body: tableData.map(row => [
      row.callLTP, row.callBuyPercent, row.callSellPercent, row.callTP1, row.callTP2, row.callTP3, row.callStopLoss,
      row.strike,
      row.putStopLoss, row.putTP3, row.putTP2, row.putTP1, row.putSellPercent, row.putBuyPercent, row.putLTP
    ]),
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [0, 255, 65],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9
    },
    didParseCell: (hookData) => {
      const rowIndex = hookData.row.index;
      const colIndex = hookData.column.index;
      
      if (hookData.section === 'body' && rowIndex < tableData.length) {
        const rowData = hookData.table.body[rowIndex];
        const strikePrice = parseFloat(rowData.cells[7].text[0].replace(/[₹,]/g, ''));
        
        // Color the strike column
        if (colIndex === 7) { // Strike column
          const strikeColor = getStrikeColor(strikePrice, atmStrike, data);
          if (strikeColor === '#00ff41') {
            hookData.cell.styles.fillColor = [0, 255, 65]; // Green for ATM
            hookData.cell.styles.textColor = [0, 0, 0]; // Black text
            hookData.cell.styles.fontStyle = 'bold';
          } else if (strikeColor === '#ff4444') {
            hookData.cell.styles.fillColor = [255, 68, 68]; // Red for ATM±1
            hookData.cell.styles.textColor = [255, 255, 255]; // White text
            hookData.cell.styles.fontStyle = 'bold';
          } else {
            hookData.cell.styles.fillColor = [245, 245, 245]; // Light grey
          }
        }
        // Color Call columns (0-6)
        else if (colIndex >= 0 && colIndex <= 6) {
          const cellColor = getCellColor(strikePrice, atmStrike, spotPrice, data, 'CE');
          if (cellColor === '#add8e6') {
            hookData.cell.styles.fillColor = [173, 216, 230]; // Light blue
            hookData.cell.styles.textColor = [30, 58, 95]; // Dark blue text
          } else if (cellColor === '#ffb3d9') {
            hookData.cell.styles.fillColor = [255, 179, 217]; // Light pink
            hookData.cell.styles.textColor = [139, 0, 69]; // Dark pink text
          } else if (cellColor === '#FF8C00') {
            hookData.cell.styles.fillColor = [255, 140, 0]; // Orange for ITM
          } else if (cellColor === '#f5f5f5') {
            hookData.cell.styles.fillColor = [245, 245, 245]; // Light grey for OTM
            hookData.cell.styles.textColor = [136, 136, 136]; // Grey text
          }
        }
        // Color Put columns (8-14)
        else if (colIndex >= 8 && colIndex <= 14) {
          const cellColor = getCellColor(strikePrice, atmStrike, spotPrice, data, 'PE');
          if (cellColor === '#add8e6') {
            hookData.cell.styles.fillColor = [173, 216, 230]; // Light blue
            hookData.cell.styles.textColor = [30, 58, 95]; // Dark blue text
          } else if (cellColor === '#ffb3d9') {
            hookData.cell.styles.fillColor = [255, 179, 217]; // Light pink
            hookData.cell.styles.textColor = [139, 0, 69]; // Dark pink text
          } else if (cellColor === '#FF8C00') {
            hookData.cell.styles.fillColor = [255, 140, 0]; // Orange for ITM
          } else if (cellColor === '#f5f5f5') {
            hookData.cell.styles.fillColor = [245, 245, 245]; // Light grey for OTM
            hookData.cell.styles.textColor = [136, 136, 136]; // Grey text
          }
        }
      }
    },
    columnStyles: {
      0: { halign: 'right', cellWidth: 18 }, // CE LTP
      1: { halign: 'right', cellWidth: 16 }, // CE Buy%
      2: { halign: 'right', cellWidth: 16 }, // CE Sell%
      3: { halign: 'right', cellWidth: 18 }, // CE TP1
      4: { halign: 'right', cellWidth: 18 }, // CE TP2
      5: { halign: 'right', cellWidth: 18 }, // CE TP3
      6: { halign: 'right', cellWidth: 20 }, // CE Stop Loss
      7: { halign: 'center', cellWidth: 20 }, // Strike
      8: { halign: 'left', cellWidth: 20 }, // PE Stop Loss
      9: { halign: 'left', cellWidth: 18 }, // PE TP3
      10: { halign: 'left', cellWidth: 18 }, // PE TP2
      11: { halign: 'left', cellWidth: 18 }, // PE TP1
      12: { halign: 'left', cellWidth: 16 }, // PE Sell%
      13: { halign: 'left', cellWidth: 16 }, // PE Buy%
      14: { halign: 'left', cellWidth: 18 } // PE LTP
    }
  });

  // Generate filename
  const formattedDate = timestamp.toISOString().split('T')[0];
  const formattedTime = timestamp.toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `${symbol}_OptionChain_Analysis_${formattedDate}_${formattedTime}.pdf`;

  // Save the PDF
  doc.save(filename);

  return filename;
};
