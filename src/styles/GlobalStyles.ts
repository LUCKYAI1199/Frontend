import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    min-height: 100vh;
    background: #1a1a1a;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #e0e0e0;
    overflow-x: auto;
  }

  body {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    background-attachment: fixed;
  }

  #root {
    min-height: 100vh;
  }

  /* Custom scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #232323;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
    border: 1px solid #333;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: #444 #232323;
  }

  /* Focus styles */
  button:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid #0f0;
    outline-offset: 2px;
  }

  /* Animation keyframes */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes flash {
    0% { box-shadow: 0 0 15px rgba(65, 105, 225, 0.5); }
    50% { box-shadow: 0 0 30px rgba(65, 105, 225, 1), 0 0 60px rgba(65, 105, 225, 0.8); }
    100% { box-shadow: 0 0 15px rgba(65, 105, 225, 0.5); }
  }

  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Utility classes */
  .fade-in {
    animation: fadeIn 0.3s ease-in;
  }

  .fade-in-up {
    animation: fadeInUp 0.3s ease-out;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  .flash {
    animation: flash 2s infinite;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  /* Text selection */
  ::selection {
    background: rgba(0, 255, 0, 0.3);
    color: #fff;
  }

  ::-moz-selection {
    background: rgba(0, 255, 0, 0.3);
    color: #fff;
  }

  /* Print styles */
  @media print {
    body {
      background: white !important;
      color: black !important;
    }
    
    .no-print {
      display: none !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    body {
      background: #000;
      color: #fff;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Mobile-specific styles */
  @media (max-width: 768px) {
    body {
      font-size: 14px;
    }
    
    /* Improve touch targets */
    button,
    input,
    select,
    textarea {
      min-height: 44px;
    }
    
    /* Better mobile scrolling */
    body {
      -webkit-overflow-scrolling: touch;
    }
  }

  /* Tablet-specific styles */
  @media (min-width: 769px) and (max-width: 1024px) {
    body {
      font-size: 15px;
    }
  }

  /* Desktop-specific styles */
  @media (min-width: 1025px) {
    body {
      font-size: 16px;
    }
  }

  /* Responsive utility classes */
  .desktop-only {
    display: inline;
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-only {
    display: none;
    
    @media (max-width: 768px) {
      display: inline;
    }
  }

  .tablet-only {
    display: none;
    
    @media (min-width: 769px) and (max-width: 1024px) {
      display: inline;
    }
  }

  /* Dark mode specific adjustments */
  @media (prefers-color-scheme: dark) {
    body {
      background: #1a1a1a;
      color: #e0e0e0;
    }
  }

  /* Light mode fallback */
  @media (prefers-color-scheme: light) {
    .force-dark-mode {
      background: #1a1a1a !important;
      color: #e0e0e0 !important;
    }
  }
`;
