'use client';

import { DailyProvider } from "@daily-co/daily-react";
import Daily from '@daily-co/daily-js';
import { useEffect, useState } from 'react';

export const CVIProvider = ({ children }: { children: React.ReactNode }) => {
  const [callObject, setCallObject] = useState<any>(null);

  useEffect(() => {
    // Create Daily instance
    const daily = Daily.createCallObject({
      strictMode: false // Disable strict mode to prevent double mounting issues
    });
    console.log('🌐 CVIProvider: Created Daily instance');
    setCallObject(daily);

    // Cleanup
    return () => {
      console.log('🧹 CVIProvider: Cleaning up Daily instance');
      daily.destroy();
    };
  }, []);

  if (!callObject) {
    return <div>Initializing video...</div>;
  }

  return (
    <DailyProvider callObject={callObject}>
      {children}
    </DailyProvider>
  )
}
