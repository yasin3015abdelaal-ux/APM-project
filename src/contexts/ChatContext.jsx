import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { chatAPI } from "../api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const prevUnreadCountRef = useRef(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await chatAPI.getUnreadCount();
            if (response.data.success) {
                const newCount = response.data.count || 0;
                
                // ✅ بس لو العدد اتغير فعلاً، نحدث الـ state
                if (prevUnreadCountRef.current !== newCount) {
                    setUnreadCount(newCount);
                    prevUnreadCountRef.current = newCount;
                }
                
                if (!isInitialized) {
                    setIsInitialized(true);
                }
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, [isInitialized]);

    useEffect(() => {
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []); // ✅ إزالة fetchUnreadCount من dependencies

    const updateUnreadCount = useCallback((newCount) => {
        if (prevUnreadCountRef.current !== newCount) {
            setUnreadCount(newCount);
            prevUnreadCountRef.current = newCount;
        }
    }, []);

    const decrementUnreadCount = useCallback((amount = 1) => {
        setUnreadCount(prev => {
            const newCount = Math.max(0, prev - amount);
            prevUnreadCountRef.current = newCount;
            return newCount;
        });
    }, []);

    const incrementUnreadCount = useCallback((amount = 1) => {
        setUnreadCount(prev => {
            const newCount = prev + amount;
            prevUnreadCountRef.current = newCount;
            return newCount;
        });
    }, []);

    return (
        <ChatContext.Provider value={{
            unreadCount,
            fetchUnreadCount,
            updateUnreadCount,
            decrementUnreadCount,
            incrementUnreadCount,
            isInitialized
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within ChatProvider");
    }
    return context;
};