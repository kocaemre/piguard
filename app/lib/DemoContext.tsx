"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type DemoContextType = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  loading: boolean;
  useDummyGpsData: boolean;
  toggleDummyGpsData: () => void;
  useDummyData: boolean;
  toggleDummyData: () => void;
};

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  loading: true,
  useDummyGpsData: false,
  toggleDummyGpsData: () => {},
  useDummyData: false,
  toggleDummyData: () => {},
});

export const DemoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [useDummyGpsData, setUseDummyGpsData] = useState(false);
  const [useDummyData, setUseDummyData] = useState(false);

  // Load demo preference from localStorage on client-side
  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demoMode');
    const savedDummyGpsData = localStorage.getItem('dummyGpsData');
    const savedDummyData = localStorage.getItem('dummyData');
    
    if (savedDemoMode !== null) {
      setIsDemoMode(savedDemoMode === 'true');
    }
    
    if (savedDummyGpsData !== null) {
      setUseDummyGpsData(savedDummyGpsData === 'true');
    }
    
    if (savedDummyData !== null) {
      setUseDummyData(savedDummyData === 'true');
    } else {
      // Default to true since we currently can't connect to the Pi4 database
      setUseDummyData(true);
      localStorage.setItem('dummyData', 'true');
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
  
  const toggleDummyData = () => {
    const newValue = !useDummyData;
    setUseDummyData(newValue);
    localStorage.setItem('dummyData', String(newValue));
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      toggleDemoMode, 
      loading,
      useDummyGpsData,
      toggleDummyGpsData,
      useDummyData,
      toggleDummyData
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext); 