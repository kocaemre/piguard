"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DemoContextType = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  loading: boolean;
};

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  loading: true,
});

export const DemoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demoMode');
    if (savedDemoMode !== null) {
      setIsDemoMode(savedDemoMode === 'true');
    }
    setLoading(false);
  }, []);

  const toggleDemoMode = () => {
    const newValue = !isDemoMode;
    setIsDemoMode(newValue);
    localStorage.setItem('demoMode', String(newValue));
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      toggleDemoMode, 
      loading
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext); 