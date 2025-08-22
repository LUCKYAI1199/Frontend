import { io, Socket } from 'socket.io-client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Symbol, OptionChainResponse, OHLCResponse } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToSymbol: (symbol: Symbol) => void;
  unsubscribeFromSymbol: (symbol: Symbol) => void;
  subscriptions: Set<Symbol>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  subscribeToSymbol: () => {},
  unsubscribeFromSymbol: () => {},
  subscriptions: new Set(),
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Set<Symbol>>(new Set());

  // Add throttling to prevent rapid subscribe/unsubscribe cycles
  const subscriptionTimeouts = new Map<Symbol, NodeJS.Timeout>();
  const SUBSCRIPTION_DELAY = 1000; // 1 second delay between subscription changes

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'https://backend-15-ie19.onrender.com', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionDelay: 2000, // Increase reconnection delay
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('🔗 Connected to server');
      setIsConnected(true);
      
      // Re-subscribe to all symbols after reconnection with delay
      setTimeout(() => {
        subscriptions.forEach(symbol => {
          socketInstance.emit('subscribe_symbol', { symbol });
        });
      }, 500); // Small delay after connection
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Connection error:', error);
      setIsConnected(false);
    });

    // Data event handlers
    socketInstance.on('option_chain_update', (data: OptionChainResponse) => {
      console.log('📊 Option chain update received:', data);
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('optionChainUpdate', { detail: data }));
    });

    socketInstance.on('ohlc_update', (data: OHLCResponse) => {
      console.log('📈 OHLC update received:', data);
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('ohlcUpdate', { detail: data }));
    });

    socketInstance.on('subscription_status', (data: { symbol: Symbol; status: string }) => {
      console.log(`📡 Subscription status for ${data.symbol}: ${data.status}`);
    });

    socketInstance.on('subscription_error', (data: { error: string }) => {
      console.error('❌ Subscription error:', data.error);
    });

    socketInstance.on('connection_status', (data: { status: string; message: string }) => {
      console.log('🔗 Connection status:', data);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subscribeToSymbol = (symbol: Symbol) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot subscribe: Socket not connected');
      return;
    }

    // Clear any existing timeout for this symbol
    if (subscriptionTimeouts.has(symbol)) {
      clearTimeout(subscriptionTimeouts.get(symbol)!);
    }

    // Add throttling to prevent rapid subscription changes
    const timeout = setTimeout(() => {
      if (socket && isConnected) {
        socket.emit('subscribe_symbol', { symbol });
        setSubscriptions(prev => new Set([...prev, symbol]));
        console.log(`📡 Subscribed to ${symbol}`);
      }
      subscriptionTimeouts.delete(symbol);
    }, SUBSCRIPTION_DELAY);

    subscriptionTimeouts.set(symbol, timeout);
  };

  const unsubscribeFromSymbol = (symbol: Symbol) => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot unsubscribe: Socket not connected');
      return;
    }

    // Clear any existing timeout for this symbol
    if (subscriptionTimeouts.has(symbol)) {
      clearTimeout(subscriptionTimeouts.get(symbol)!);
    }

    // Add throttling to prevent rapid subscription changes
    const timeout = setTimeout(() => {
      if (socket && isConnected) {
        socket.emit('unsubscribe_symbol', { symbol });
        setSubscriptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(symbol);
          return newSet;
        });
        console.log(`📡 Unsubscribed from ${symbol}`);
      }
      subscriptionTimeouts.delete(symbol);
    }, SUBSCRIPTION_DELAY);

    subscriptionTimeouts.set(symbol, timeout);
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    subscriptions,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
