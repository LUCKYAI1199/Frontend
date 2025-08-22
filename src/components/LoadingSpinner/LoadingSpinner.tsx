import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 200px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.border.secondary};
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 14px;
  margin: 0;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const DotsContainer = styled.span`
  display: inline-block;
  width: 20px;
`;

const Dot = styled.span<{ delay: number }>`
  animation: ${pulse} 1.4s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showDots?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'medium',
  showDots = true,
}) => {
  const spinnerSize = {
    small: '24px',
    medium: '40px',
    large: '60px',
  }[size];

  return (
    <LoadingContainer>
      <Spinner style={{ width: spinnerSize, height: spinnerSize }} />
      <LoadingText>
        {message}
        {showDots && (
          <DotsContainer>
            <Dot delay={0}>.</Dot>
            <Dot delay={0.2}>.</Dot>
            <Dot delay={0.4}>.</Dot>
          </DotsContainer>
        )}
      </LoadingText>
    </LoadingContainer>
  );
};

export default LoadingSpinner;
