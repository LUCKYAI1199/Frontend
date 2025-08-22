# Styling Guide: Shadcn UI + Font Awesome Integration

This document explains how to use the integrated Shadcn UI components and Font Awesome icons in your trading application.

## 🎨 Overview

The application now supports:

- **Shadcn UI**: Modern, accessible React components with Tailwind CSS

- **Font Awesome**: Comprehensive icon library with React integration
- **Tailwind CSS**: Utility-first CSS framework with custom trading-specific classes
- **CSS Custom Properties**: For consistent theming and dark/light mode support

## 📦 Dependencies Added

```json
{
  "@radix-ui/react-*": "Latest versions for headless UI primitives",
  "@fortawesome/fontawesome-svg-core": "^6.5.1",
  "@fortawesome/free-solid-svg-icons": "^6.5.1",
  "@fortawesome/free-regular-svg-icons": "^6.5.1", 
  "@fortawesome/free-brands-svg-icons": "^6.5.1",
  "@fortawesome/react-fontawesome": "^0.2.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwindcss": "^3.3.6",
  "tailwindcss-animate": "^1.0.7",
  "lucide-react": "^0.294.0"
}
```

## 🎯 Available Components

### 1. Button Component

```tsx
import { Button } from '../components/ui/button';
import { FontAwesomeIcon } from '../utils/fontawesome';

// Basic usage
<Button>Click me</Button>

// Trading-specific variants
<Button variant="bullish">Buy Signal</Button>
<Button variant="bearish">Sell Signal</Button>
<Button variant="neutral">Hold</Button>

// With Font Awesome icons
<Button>
  <FontAwesomeIcon icon="chart-line" className="mr-2" />
  View Chart
</Button>
```

### 2. Card Component

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Option Chain Analysis</CardTitle>
    <CardDescription>Real-time data from Zerodha</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
</Card>
```

### 3. Badge Component

```tsx
import { Badge } from '../components/ui/badge';

// Trading-specific badges
<Badge variant="bullish">BUY</Badge>
<Badge variant="bearish">SELL</Badge>
<Badge variant="high-oi">High OI</Badge>
<Badge variant="high-volume">High Volume</Badge>
<Badge variant="atm">ATM</Badge>
```

### 4. Table Component

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Strike</TableHead>
      <TableHead>CE LTP</TableHead>
      <TableHead>PE LTP</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="strike-price">24500</TableCell>
      <TableCell className="price-positive">125.50</TableCell>
      <TableCell className="price-negative">95.25</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## 🎭 Font Awesome Icons

### Usage

```tsx
import { FontAwesomeIcon } from '../utils/fontawesome';

// Basic icon
<FontAwesomeIcon icon="chart-line" />

// With styling
<FontAwesomeIcon icon="arrow-up" className="text-bullish h-4 w-4" />

// Trading-specific icons
<FontAwesomeIcon icon="trending-up" className="text-bullish" />
<FontAwesomeIcon icon="trending-down" className="text-bearish" />
<FontAwesomeIcon icon="signal" className="text-neutral" />
<FontAwesomeIcon icon="coins" className="text-high-oi" />
```

### Available Icon Categories

#### Trading & Finance

- `chart-line`, `chart-area`, `chart-bar`
- `trending-up`, `trending-down`
- `coins`, `rupee`, `dollar`
- `signal`, `analytics`
- `percent`

#### Actions

- `download`, `upload`, `refresh`
- `search`, `filter`, `sort`
- `play`, `pause`, `stop`
- `save`, `edit`, `trash`

#### Navigation

- `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`
- `home`, `dashboard`
- `eye`, `eye-slash`

## 🎨 Tailwind CSS Classes

### Trading-Specific Utilities

```css
/* Text colors */
.text-bullish     /* Green for positive/buy signals */
.text-bearish     /* Red for negative/sell signals */
.text-neutral     /* Gray for neutral/hold signals */
.text-high-oi     /* Yellow for high open interest */
.text-high-volume /* Blue for high volume */

/* Background colors */
.bg-bullish/10    /* Light green background */
.bg-bearish/20    /* Light red background */
.bg-atm/30        /* ATM strike highlighting */

/* Component classes */
.option-table     /* Styled option chain table */
.option-cell      /* Individual option cell */
.strike-price     /* Strike price styling */
.price-positive   /* Positive price change */
.price-negative   /* Negative price change */
```

### Animation Classes

```css
.animate-price-flash    /* Flash animation for price changes */
.animate-fade-in        /* Fade in animation */
.animate-slide-in       /* Slide in animation */
```

## 🌙 Dark/Light Mode

The application supports automatic dark/light mode switching using CSS custom properties:

```tsx
// Toggle theme
<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  <FontAwesomeIcon icon={theme === 'dark' ? 'sun' : 'moon'} />
</Button>
```

## 💼 Example: Trading Dashboard Card

```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FontAwesomeIcon } from '../../utils/fontawesome';
import { cn } from '../../utils/cn';

interface OptionStrikeCardProps {
  strike: number;
  ceData: {
    ltp: number;
    volume: number;
    oi: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
  };
  peData: {
    ltp: number;
    volume: number;
    oi: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
  };
  isATM: boolean;
}

export const OptionStrikeCard: React.FC<OptionStrikeCardProps> = ({
  strike,
  ceData,
  peData,
  isATM
}) => {
  return (
    <Card className={cn("transition-all hover:shadow-lg", isATM && "ring-2 ring-atm")}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-center strike-price", isATM && "text-atm")}>
          {strike}
          {isATM && <Badge variant="atm" className="ml-2">ATM</Badge>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* CE Data */}
        <div className="border rounded p-3 bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">CE</span>
            <Badge variant={ceData.signal === 'BUY' ? 'bullish' : ceData.signal === 'SELL' ? 'bearish' : 'neutral'}>
              <FontAwesomeIcon 
                icon={ceData.signal === 'BUY' ? 'trending-up' : ceData.signal === 'SELL' ? 'trending-down' : 'minus'} 
                className="h-3 w-3 mr-1" 
              />
              {ceData.signal}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">LTP</div>
              <div className="font-mono font-semibold">₹{ceData.ltp.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Volume</div>
              <div className="font-mono">{(ceData.volume / 100000).toFixed(1)}L</div>
            </div>
            <div>
              <div className="text-muted-foreground">OI</div>
              <div className="font-mono">{(ceData.oi / 100000).toFixed(1)}L</div>
            </div>
          </div>
        </div>

        {/* PE Data */}
        <div className="border rounded p-3 bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">PE</span>
            <Badge variant={peData.signal === 'BUY' ? 'bullish' : peData.signal === 'SELL' ? 'bearish' : 'neutral'}>
              <FontAwesomeIcon 
                icon={peData.signal === 'BUY' ? 'trending-up' : peData.signal === 'SELL' ? 'trending-down' : 'minus'} 
                className="h-3 w-3 mr-1" 
              />
              {peData.signal}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">LTP</div>
              <div className="font-mono font-semibold">₹{peData.ltp.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Volume</div>
              <div className="font-mono">{(peData.volume / 100000).toFixed(1)}L</div>
            </div>
            <div>
              <div className="text-muted-foreground">OI</div>
              <div className="font-mono">{(peData.oi / 100000).toFixed(1)}L</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <FontAwesomeIcon icon="chart-line" className="h-3 w-3 mr-1" />
            Chart
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <FontAwesomeIcon icon="calculator" className="h-3 w-3 mr-1" />
            Greeks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Use components in your files:**

   ```tsx
   import { Button } from '../components/ui/button';
   import { FontAwesomeIcon } from '../utils/fontawesome';
   ```

3. **Apply Tailwind classes:**

   ```tsx
   <div className="bg-card text-card-foreground p-4 rounded-lg">
     <FontAwesomeIcon icon="chart-line" className="text-bullish h-6 w-6" />
   </div>
   ```

## 📚 Resources

- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Font Awesome Documentation](https://fontawesome.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)

The styling system is now fully integrated and ready to use across your trading application!
