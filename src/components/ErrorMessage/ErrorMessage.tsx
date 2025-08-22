import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  min-height: 200px;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorTitle = styled.h3`
  color: ${({ theme }) => theme.colors.error};
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  max-width: 400px;
`;

const RetryButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: #000;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}dd;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorDetails = styled.details`
  margin-top: ${({ theme }) => theme.spacing.md};
  max-width: 500px;
  
  summary {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    cursor: pointer;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const ErrorDetailsContent = styled.pre`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.secondary};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

interface ErrorMessageProps {
  message: string | any;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  details?: string;
  showIcon?: boolean;
}

const ErrorMessageComponent: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Something went wrong',
  onRetry,
  retryText = 'Try Again',
  details,
  showIcon = true,
}) => {
  const safeMessage = typeof message === 'string' ? message : (message?.toString?.() || 'An error occurred');
  return (
    <ErrorContainer>
      {showIcon && <ErrorIcon>⚠️</ErrorIcon>}
      <ErrorTitle>{title}</ErrorTitle>
  <ErrorMessage>{safeMessage}</ErrorMessage>
      
      {onRetry && (
        <RetryButton onClick={onRetry}>
          {retryText}
        </RetryButton>
      )}

      {details && (
        <ErrorDetails>
          <summary>View technical details</summary>
          <ErrorDetailsContent>{details}</ErrorDetailsContent>
        </ErrorDetails>
      )}
    </ErrorContainer>
  );
};

export default ErrorMessageComponent;
