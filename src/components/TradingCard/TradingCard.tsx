import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FontAwesomeIcon, faTrendingUp, faTrendingDown, faMinus } from '../../utils/fontawesome';
import { cn } from '../../utils/cn';

interface TradingCardProps {
  title: string;
  description: string;
  value: number;
  change: number;
  changePercent: number;
  signal?: 'BUY' | 'SELL' | 'HOLD';
  signalStrength?: number;
  signalQuality?: 'strong' | 'moderate' | 'weak';
  className?: string;
}

export const TradingCard: React.FC<TradingCardProps> = ({
  title,
  description,
  value,
  change,
  changePercent,
  signal = 'HOLD',
  signalStrength = 3,
  signalQuality = 'moderate',
  className
}) => {
  const getSignalVariant = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy': return 'bullish';
      case 'sell': return 'bearish';
      default: return 'neutral';
    }
  };

  const getQualityVariant = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'strong': return 'bullish';
      case 'weak': return 'bearish';
      default: return 'neutral';
    }
  };

  const getChangeIcon = () => {
    if (change > 0) return 'arrow-up';
    if (change < 0) return 'arrow-down';
    return 'arrow-right';
  };

  const getChangeClass = () => {
    if (change > 0) return 'text-bullish';
    if (change < 0) return 'text-bearish';
    return 'text-neutral';
  };

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <FontAwesomeIcon 
          icon="chart-line" 
          className="h-4 w-4 text-muted-foreground" 
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">₹{value.toLocaleString()}</div>
        <CardDescription className="text-xs text-muted-foreground">
          {description}
        </CardDescription>
        
        <div className="flex items-center space-x-2 mt-4">
          <div className={cn("flex items-center space-x-1", getChangeClass())}>
            <FontAwesomeIcon 
              icon={getChangeIcon()} 
              className="h-3 w-3" 
            />
            <span className="text-xs font-medium">
              {Math.abs(change).toFixed(2)} ({Math.abs(changePercent).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Badge variant={getSignalVariant(signal)}>
              <FontAwesomeIcon 
                icon={signal === 'BUY' ? faTrendingUp : signal === 'SELL' ? faTrendingDown : faMinus} 
                className="h-3 w-3 mr-1" 
              />
              {signal}
            </Badge>
            <Badge variant="outline">
              {signalStrength}/5
            </Badge>
          </div>
          
          <Badge variant={getQualityVariant(signalQuality)}>
            <FontAwesomeIcon icon="signal" className="h-3 w-3 mr-1" />
            {signalQuality}
          </Badge>
        </div>

        <div className="flex space-x-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            <FontAwesomeIcon icon="eye" className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="ghost">
            <FontAwesomeIcon icon="share" className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost">
            <FontAwesomeIcon icon="bookmark" className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingCard;
