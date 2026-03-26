
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface ChatConfig {
  sourceType: 'domain' | 'company' | 'evaluation';
  documentId: string;
  usecaseId: string;
  title?: string;
}

interface CortexContextType {
  isChatOpen: boolean;
  activeChat: ChatConfig | null;
  openChat: (config: ChatConfig) => void;
  closeChat: () => void;
  isGlobalSearchOpen: boolean;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
  isAskPdfOpen: boolean;
  openAskPdf: () => void;
  closeAskPdf: () => void;
  credits: number;
  refreshCredits: () => Promise<void>;
}

const CortexContext = createContext<CortexContextType | undefined>(undefined);

export const CortexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatConfig | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAskPdfOpen, setIsAskPdfOpen] = useState(false);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.credits !== undefined) setCredits(user.credits);
      } catch (e) {
        console.error("Failed to parse user credits");
      }
    }
    refreshCredits();
  }, []);

  const refreshCredits = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const res = await apiService.auth.getCredits();
      console.log("Credits refresh response:", res);
      
      // Handle various response structures: 
      // 1. { credits: 50 }
      // 2. { data: { credits: 50 } }
      // 3. { success: true, credits: 50 }
      let newCredits = undefined;
      
      if (typeof res === 'number') {
        newCredits = res;
      } else if (res.credits !== undefined) {
        newCredits = res.credits;
      } else if (res.data?.credits !== undefined) {
        newCredits = res.data.credits;
      } else if (res.data !== undefined && typeof res.data === 'number') {
        newCredits = res.data;
      } else if (res.user?.credits !== undefined) {
        newCredits = res.user.credits;
      } else if (res.data?.user?.credits !== undefined) {
        newCredits = res.data.user.credits;
      }
      
      if (newCredits !== undefined) {
        const numericCredits = Number(newCredits);
        setCredits(numericCredits);
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.credits = numericCredits;
            sessionStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error("Error updating user in sessionStorage", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh credits", err);
    }
  };

  const openChat = (config: ChatConfig) => {
    setActiveChat(config);
    setIsChatOpen(true);
    setIsGlobalSearchOpen(false);
    setIsAskPdfOpen(false);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setActiveChat(null);
  };

  const openGlobalSearch = () => {
    setIsGlobalSearchOpen(true);
    setIsChatOpen(false);
    setActiveChat(null);
    setIsAskPdfOpen(false);
  };

  const closeGlobalSearch = () => {
    setIsGlobalSearchOpen(false);
  };

  const openAskPdf = () => {
    setIsAskPdfOpen(true);
    setIsGlobalSearchOpen(false);
    setIsChatOpen(false);
    setActiveChat(null);
  };

  const closeAskPdf = () => {
    setIsAskPdfOpen(false);
  };

  return (
    <CortexContext.Provider value={{ 
      isChatOpen, 
      activeChat, 
      openChat, 
      closeChat,
      isGlobalSearchOpen,
      openGlobalSearch,
      closeGlobalSearch,
      isAskPdfOpen,
      openAskPdf,
      closeAskPdf,
      credits,
      refreshCredits
    }}>
      {children}
    </CortexContext.Provider>
  );
};

export const useCortex = () => {
  const context = useContext(CortexContext);
  if (context === undefined) {
    throw new Error('useCortex must be used within a CortexProvider');
  }
  return context;
};
