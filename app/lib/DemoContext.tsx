"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DemoContextType = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  loading: boolean;
  useDummyGpsData: boolean;
  toggleDummyGpsData: () => void;
};

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  loading: true,
  useDummyGpsData: false,
  toggleDummyGpsData: () => {},
});

export const DemoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [useDummyGpsData, setUseDummyGpsData] = useState(false);

  // Load demo preference from localStorage on client-side
  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demoMode');
    const savedDummyGpsData = localStorage.getItem('dummyGpsData');
    
    if (savedDemoMode !== null) {
      setIsDemoMode(savedDemoMode === 'true');
    }
    
    if (savedDummyGpsData !== null) {
      setUseDummyGpsData(savedDummyGpsData === 'true');
    }
    
    setLoading(false);
  }, []);

  const toggleDemoMode = () => {
    const newValue = !isDemoMode;
    setIsDemoMode(newValue);
    localStorage.setItem('demoMode', String(newValue));
  };

  const toggleDummyGpsData = () => {
    const newValue = !useDummyGpsData;
    setUseDummyGpsData(newValue);
    localStorage.setItem('dummyGpsData', String(newValue));
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      toggleDemoMode, 
      loading,
      useDummyGpsData,
      toggleDummyGpsData
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext); 