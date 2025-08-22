import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Trading specific utility functions
export const getOptionTypeClass = (optionType: 'CE' | 'PE', value?: number) => {
  if (!value || value === 0) return 'text-neutral'
  
  if (optionType === 'CE') {
    return value > 0 ? 'text-bullish' : 'text-bearish'
  } else {
    return value > 0 ? 'text-bearish' : 'text-bullish'
  }
}

export const getPriceChangeClass = (change: number) => {
  if (change > 0) return 'text-bullish'
  if (change < 0) return 'text-bearish'
  return 'text-neutral'
}

export const getVolumeOIClass = (value: number, threshold: number) => {
  if (value >= threshold) return 'option-cell-high-volume'
  return ''
}

export const getOIClass = (value: number, threshold: number) => {
  if (value >= threshold) return 'option-cell-high-oi'
  return ''
}

export const getATMClass = (isATM: boolean) => {
  return isATM ? 'option-cell-atm' : ''
}

export const getSignalTypeClass = (signalType: string) => {
  switch (signalType?.toLowerCase()) {
    case 'buy':
      return 'text-bullish font-semibold'
    case 'sell':
      return 'text-bearish font-semibold'
    case 'hold':
      return 'text-neutral font-medium'
    default:
      return 'text-neutral'
  }
}

export const getSignalStrengthClass = (strength: number) => {
  if (strength >= 4) return 'text-bullish font-bold'
  if (strength >= 3) return 'text-neutral font-medium'
  return 'text-bearish font-light'
}

export const getSignalQualityClass = (quality: string) => {
  switch (quality?.toLowerCase()) {
    case 'strong':
      return 'text-bullish font-bold'
    case 'moderate':
      return 'text-neutral font-medium'
    case 'weak':
      return 'text-bearish font-light'
    default:
      return 'text-neutral'
  }
}

export const getSignalConfidenceClass = (confidence: string) => {
  switch (confidence?.toLowerCase()) {
    case 'high':
      return 'text-bullish'
    case 'medium':
      return 'text-neutral'
    case 'low':
      return 'text-bearish'
    default:
      return 'text-neutral'
  }
}
