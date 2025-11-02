'use client';

import { DailyProvider } from "@daily-co/daily-react";
import { useEffect, useState } from 'react';

export const CVIProvider = ({ children }: { children: React.ReactNode }) => {
  const [callObject, setCallObject] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Daily.co to avoid SSR issues
    const initializeDaily = async () => {
      try {
        const DailyModule = await import('@daily-co/daily-js');
        const Daily = DailyModule.default || DailyModule;
        
        // Reuse a global Daily callObject to prevent duplicate instances across mounts
        const w: any = typeof window !== 'undefined' ? window : {};
        let daily: any;

        if (w.__CVI_CALL_OBJECT__) {
          // Reuse existing instance and bump refcount
          daily = w.__CVI_CALL_OBJECT__;
          w.__CVI_CALL_REFCOUNT__ = (w.__CVI_CALL_REFCOUNT__ || 0) + 1;
          console.log('🌐 CVIProvider: Reusing global Daily instance (refcount =', w.__CVI_CALL_REFCOUNT__, ')');
        } else {
          // Create a new global instance
          daily = Daily.createCallObject({
            strictMode: false // Disable strict mode to prevent double mounting issues
          });
          w.__CVI_CALL_OBJECT__ = daily;
          w.__CVI_CALL_REFCOUNT__ = 1;
          console.log('🌐 CVIProvider: Created global Daily instance');
        }

        setCallObject(daily);
      } catch (error) {
        console.error('❌ Failed to initialize Daily.co:', error);
      }
    };

    initializeDaily();

    // Cleanup with ref counting; destroy only when last consumer unmounts
    return () => {
      const w: any = typeof window !== 'undefined' ? window : {};
      const nextRef = (w.__CVI_CALL_REFCOUNT__ || 1) - 1;
      w.__CVI_CALL_REFCOUNT__ = nextRef;
      console.log('🧹 CVIProvider: Unmount (refcount =', nextRef, ')');
      if (nextRef <= 0 && w.__CVI_CALL_OBJECT__) {
        try {
          w.__CVI_CALL_OBJECT__.destroy();
        } catch (e) {
          console.warn('⚠️ CVIProvider: Error destroying Daily instance', e);
        }
        delete w.__CVI_CALL_OBJECT__;
        delete w.__CVI_CALL_REFCOUNT__;
        console.log('🧨 CVIProvider: Destroyed global Daily instance');
      }
    };
  }, []);

  if (!callObject) {
    return <div>Initializing video...</div>;
  }

  return (
    <DailyProvider callObject={callObject}>
      {children}
    </DailyProvider>
  );
};
