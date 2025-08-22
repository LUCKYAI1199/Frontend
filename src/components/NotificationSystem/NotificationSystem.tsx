import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
`;

const NotificationItem = styled.div<{ 
  type: 'success' | 'error' | 'warning' | 'info';
  isRemoving: boolean;
}>`
  background: ${({ type }) => {
    switch (type) {
      case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'error': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
  }};
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  font-weight: 500;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  animation: ${({ isRemoving }) => isRemoving ? slideOut : slideIn} 0.3s ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px 8px 0 0;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const NotificationIcon = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  font-size: 18px;
  line-height: 1;
  
  &::before {
    content: '${({ type }) => {
      switch (type) {
        case 'success': return '✓';
        case 'error': return '✕';
        case 'warning': return '⚠';
        default: return 'ℹ';
      }
    }}';
  }
`;

const NotificationText = styled.div`
  flex: 1;
  line-height: 1.4;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const NotificationMessage = styled.div`
  opacity: 0.9;
  font-size: 13px;
`;

const ProgressBar = styled.div<{ duration: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 8px 8px;
  animation: progress ${({ duration }) => duration}ms linear forwards;
  
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  isRemoving?: boolean;
}

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRemoving: true }
          : notification
      )
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  }, []);

  const addNotification = useCallback((
    type: Notification['type'],
    message: string,
    title?: string,
    duration: number = 5000
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      isRemoving: false,
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  useEffect(() => {
    // Listen for notification events
    const handleNotification = (event: CustomEvent) => {
      const { type, title, message, duration = 5000 } = event.detail;
      addNotification(type, message, title, duration);
    };

    window.addEventListener('notification', handleNotification as EventListener);

    return () => {
      window.removeEventListener('notification', handleNotification as EventListener);
    };
  }, [addNotification]);

  const handleNotificationClick = (id: string) => {
    removeNotification(id);
  };

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          type={notification.type}
          isRemoving={notification.isRemoving || false}
          onClick={() => handleNotificationClick(notification.id)}
        >
          <NotificationContent>
            <NotificationIcon type={notification.type} />
            <NotificationText>
              {notification.title && (
                <NotificationTitle>{notification.title}</NotificationTitle>
              )}
              <NotificationMessage>{notification.message}</NotificationMessage>
            </NotificationText>
            <CloseButton
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </CloseButton>
          </NotificationContent>
          {notification.duration && notification.duration > 0 && (
            <ProgressBar duration={notification.duration} />
          )}
        </NotificationItem>
      ))}
    </NotificationContainer>
  );
};

// Utility function to trigger notifications
export const showNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  title?: string,
  duration?: number
) => {
  const event = new CustomEvent('notification', {
    detail: { type, message, title, duration },
  });
  window.dispatchEvent(event);
};

export default NotificationSystem;
