'use client';

import { useEffect } from 'react';

export default function WarningSuppress() {
  useEffect(() => {
    // Suppress Ant Design React compatibility warnings
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      // Skip Ant Design React compatibility warnings
      if (typeof args[0] === 'string' && 
          (args[0].includes('antd v5 support React is 16') ||
           args[0].includes('antd: compatible'))) {
        return;
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      // Skip Ant Design React compatibility warnings
      if (typeof args[0] === 'string' && 
          (args[0].includes('antd v5 support React is 16') ||
           args[0].includes('antd: compatible'))) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  return null;
} 