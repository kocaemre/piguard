"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from "react";

type DemoContextType = {
  isDemoMode: boolean;
  setIsDemoMode: (value: boolean) => void;
  loading: boolean;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch demo mode setting from the server
    const fetchDemoMode = async () => {
      try {
        const response = await fetch("/api/settings/demo-mode");
        if (response.ok) {
          const data = await response.json();
          setIsDemoMode(data.enabled || false);
        }
      } catch (error) {
        console.error("Failed to fetch demo mode setting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoMode();
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode, setIsDemoMode, loading }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  
  return context;
} 