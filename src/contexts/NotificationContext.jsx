import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            const count = response.data?.unread_count || response.data?.count || 0;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            fetchUnreadCount();
            
            // Poll every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [fetchUnreadCount]);

    // Decrease count
    const decreaseCount = useCallback((amount = 1) => {
        setUnreadCount(prev => Math.max(0, prev - amount));
    }, []);

    // Increase count
    const increaseCount = useCallback((amount = 1) => {
        setUnreadCount(prev => prev + amount);
    }, []);

    // Reset count
    const resetCount = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const value = {
        unreadCount,
        loading,
        fetchUnreadCount,
        decreaseCount,
        increaseCount,
        resetCount,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};