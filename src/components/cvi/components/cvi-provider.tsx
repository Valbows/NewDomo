import React, { createContext, useContext, ReactNode } from 'react';

interface CVIContextType {
  isConnected: boolean;
  conversationId?: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  startConversation: () => void;
  endConversation: () => void;
}

const CVIContext = createContext<CVIContextType | undefined>(undefined);

interface CVIProviderProps {
  children: ReactNode;
  conversationId?: string;
}

export const CVIProvider: React.FC<CVIProviderProps> = ({ 
  children, 
  conversationId 
}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [status, setStatus] = React.useState<CVIContextType['status']>('idle');

  const startConversation = React.useCallback(() => {
    setStatus('connecting');
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
      setStatus('connected');
    }, 1000);
  }, []);

  const endConversation = React.useCallback(() => {
    setStatus('disconnected');
    setIsConnected(false);
    setTimeout(() => {
      setStatus('idle');
    }, 500);
  }, []);

  const value: CVIContextType = {
    isConnected,
    conversationId,
    status,
    startConversation,
    endConversation,
  };

  return (
    <CVIContext.Provider value={value}>
      <div data-testid="cvi-provider">
        {children}
      </div>
    </CVIContext.Provider>
  );
};

export const useCVI = (): CVIContextType => {
  const context = useContext(CVIContext);
  if (context === undefined) {
    throw new Error('useCVI must be used within a CVIProvider');
  }
  return context;
};

export default CVIProvider;