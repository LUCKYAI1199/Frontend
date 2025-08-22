import { MarketPhase } from '../types';

// Format numbers with proper separators and decimals
export const formatNumber = (num: number | string, decimals: number = 2): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0.00';
  
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Format currency with ₹ symbol
export const formatCurrency = (num: number | string, decimals: number = 2): string => {
  return `₹${formatNumber(num, decimals)}`;
};

// Format percentage
export const formatPercentage = (num: number | string, decimals: number = 2): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0.00%';
  
  return `${formatNumber(value, decimals)}%`;
};

// Format large numbers with K, L, Cr suffixes
export const formatLargeNumber = (num: number | string): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 10000000) { // 1 Crore
    return `${sign}${formatNumber(absValue / 10000000, 2)}Cr`;
  } else if (absValue >= 100000) { // 1 Lakh
    return `${sign}${formatNumber(absValue / 100000, 2)}L`;
  } else if (absValue >= 1000) { // 1 Thousand
    return `${sign}${formatNumber(absValue / 1000, 2)}K`;
  } else {
    return `${sign}${formatNumber(absValue, 0)}`;
  }
};

// Format exact numbers without abbreviations (for volume and OI)
export const formatExactNumber = (num: number | string): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  // Return exact number with thousand separators
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
};

// Format numbers in lakhs (for OI and Volume display)
export const formatInLakhs = (num: number | string): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 100000) { // 1 Lakh or more
    return `${sign}${formatNumber(absValue / 100000, 2)}L`;
  } else if (absValue >= 1000) { // 1 Thousand or more
    return `${sign}${formatNumber(absValue / 1000, 2)}K`;
  } else {
    return `${sign}${formatNumber(absValue, 0)}`;
  }
};

// Format time
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Format date
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

// Format datetime
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
};

// Get relative time (e.g., "2 minutes ago")
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

// Get market phase based on current time
export const getCurrentMarketPhase = (): MarketPhase => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  // Market timings in minutes (IST)
  const preMarketStart = 9 * 60; // 9:00 AM
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  const postMarketEnd = 16 * 60; // 4:00 PM
  
  if (currentMinutes >= preMarketStart && currentMinutes < marketOpen) {
    return 'PRE_MARKET';
  } else if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    return 'MARKET_HOURS';
  } else if (currentMinutes >= marketClose && currentMinutes < postMarketEnd) {
    return 'POST_MARKET';
  } else {
    return 'CLOSED';
  }
};

// Get next market transition time
export const getNextMarketTransition = (): string => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (currentHour < 9) {
    return 'Market opens at 9:15 AM';
  } else if (currentHour < 15 || (currentHour === 15 && currentMinute < 30)) {
    return 'Market closes at 3:30 PM';
  } else if (currentHour < 16) {
    return 'Post-market ends at 4:00 PM';
  } else {
    return 'Market opens tomorrow at 9:15 AM';
  }
};

// Check if market is open
export const isMarketOpen = (): boolean => {
  const phase = getCurrentMarketPhase();
  return phase === 'MARKET_HOURS';
};

// Get color based on value change
export const getChangeColor = (value: number): string => {
  if (value > 0) return '#10b981'; // Green
  if (value < 0) return '#ef4444'; // Red
  return '#6b7280'; // Gray
};

// Get change indicator
export const getChangeIndicator = (value: number): string => {
  if (value > 0) return '📈';
  if (value < 0) return '📉';
  return '📊';
};

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
};

// Safe JSON parse
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Download file
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Get ATM strike based on spot price
export const getATMStrike = (spotPrice: number, strikeInterval: number = 50): number => {
  return Math.round(spotPrice / strikeInterval) * strikeInterval;
};

// Get OTM strikes
export const getOTMStrikes = (
  spotPrice: number,
  atmStrike: number,
  strikeInterval: number = 50,
  count: number = 3
): { calls: number[]; puts: number[] } => {
  const otmCalls: number[] = [];
  const otmPuts: number[] = [];
  
  for (let i = 1; i <= count; i++) {
    otmCalls.push(atmStrike + (i * strikeInterval));
    otmPuts.push(atmStrike - (i * strikeInterval));
  }
  
  return { calls: otmCalls, puts: otmPuts };
};

// Calculate PCR (Put-Call Ratio)
export const calculatePCR = (putValue: number, callValue: number): number => {
  if (callValue === 0) return 0;
  return putValue / callValue;
};

// Round to nearest
export const roundToNearest = (value: number, nearest: number): number => {
  return Math.round(value / nearest) * nearest;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Linear interpolation
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Convert to title case
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Remove HTML tags
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
