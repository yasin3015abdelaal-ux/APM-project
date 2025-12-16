import { useState, useEffect, useMemo, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { chatAPI } from "../../api";
import { useChat } from "../../contexts/ChatContext";
import ChatView from "./ChatView";

// Skeleton Loading Component
const MessagesSkeleton = ({ isRTL }) => (
    <div className="h-[calc(100vh-90px)] flex bg-gradient-to-br from-gray-50 to-green-50/20 p-4 gap-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col flex-shrink-0 overflow-hidden">
            {/* Header Skeleton */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-green-50/30 flex-shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    {/* Icon Skeleton */}
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse"
                        style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>

                    {/* Title Skeleton */}
                    <div className="flex-1">
                        <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                            style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                    </div>

                    {/* Count Skeleton */}
                    <div className="w-10 h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse"
                        style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="flex gap-2 mb-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-1 h-9 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse"
                            style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                    ))}
                </div>

                {/* Search Skeleton */}
                <div className="h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse"
                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
            </div>

            {/* Message Cards Skeleton */}
            <div className="flex-1 overflow-y-auto">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 border-b border-gray-100/50">
                        {/* Avatar Skeleton */}
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full animate-pulse flex-shrink-0"
                            style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>

                        <div className="flex-1 min-w-0">
                            {/* Name Skeleton */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '60%' }}></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '50px' }}></div>
                            </div>

                            {/* Message Skeleton */}
                            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
                                style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', width: '80%' }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Empty State Skeleton for Desktop */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="text-center p-8">
                <div className="w-32 h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-3xl mx-auto mb-6 animate-pulse"
                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                <div className="h-6 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mx-auto mb-3"
                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
                <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mx-auto"
                    style={{ animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }}></div>
            </div>
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

const MessageCard = memo(({ conversation, isSelected, onSelect }) => {
    const { t, i18n } = useTranslation();
    const lastMessage = conversation.last_message;
    const unreadCount = conversation.unread_count || 0;
    const otherUser = conversation.other_user;
    const isRTL = i18n.language === "ar";

    const formatTime = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffDays === 1) {
            return t('messages.yesterday');
        } else if (diffDays < 7) {
            return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} ${t('messages.daysAgo')}`;
        } else {
            return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US');
        }
    }, [isRTL, t]);

    return (
        <div
            className={`flex items-center gap-3 p-4 hover:bg-gray-50/80 cursor-pointer transition-all duration-200 border-b border-gray-100/50 ${isSelected ? 'bg-green-50/50 border-r-[3px] border-r-main' : ''
                }`}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect();
                }
            }}
        >
            <div className="flex-shrink-0 relative">
                {otherUser?.image ? (
                    <img
                        src={otherUser.image}
                        alt={otherUser.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-gray-200">
                        <span className="text-base font-bold text-white">
                            {otherUser?.name?.charAt(0) || (isRTL ? 'م' : 'U')}
                        </span>
                    </div>
                )}
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -left-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
                        <span className="text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 truncate text-base">
                        {otherUser?.name || t('messages.noUser')}
                    </h4>
                    {lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(lastMessage.created_at)}
                        </span>
                    )}
                </div>

                <p className={`text-sm truncate ${unreadCount > 0
                        ? 'font-semibold text-gray-800'
                        : 'text-gray-500'
                    }`}>
                    {lastMessage?.message || t('messages.noMessages')}
                </p>
            </div>
        </div>
    );
});

MessageCard.displayName = 'MessageCard';

const Messages = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const [showChatOptions, setShowChatOptions] = useState(false);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    const isRTL = i18n.language === "ar";

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { updateUnreadCount, decrementUnreadCount } = useChat();

    const fetchMessagesAbortController = useRef(null);
    const autoRefreshInterval = useRef(null);
    const messageRefreshInterval = useRef(null);
    const chatOptionsRef = useRef(null);

    const showToast = useCallback((message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatOptionsRef.current && !chatOptionsRef.current.contains(event.target)) {
                setShowChatOptions(false);
            }
        };

        if (showChatOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showChatOptions]);

    useEffect(() => {
        const userData = localStorage.getItem("userData");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.id) {
                    setCurrentUserId(user.id);
                } else {
                    console.error("Invalid user data structure");
                    showToast(t('messages.errorLoadingUserData'), "error");
                }
            } catch (error) {
                console.error("Error parsing user data:", error);
                showToast(t('messages.errorLoadingUserData'), "error");
                localStorage.removeItem("userData");
            }
        } else {
            console.warn("No user data found");
        }
    }, [showToast, t]);

    const sortConversationsByLastMessage = useCallback((convs) => {
        return [...convs].sort((a, b) => {
            if (!a.last_message && !b.last_message) {
                return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
            }
            if (!a.last_message) return 1;
            if (!b.last_message) return -1;
            
            const dateA = new Date(a.last_message.created_at);
            const dateB = new Date(b.last_message.created_at);
            return dateB - dateA;
        });
    }, []);

    const fetchConversations = useCallback(async (page = 1, silent = false) => {
        try {
            if (!silent) setLoading(true);

            const params = {
                page,
                limit: 50,
                type: 'auction'
            };

            if (activeFilter !== 'all') {
                params.conversation_type = activeFilter;
            }

            const response = await chatAPI.getConversations(params);

            if (response.data.success) {
                const sortedConversations = sortConversationsByLastMessage(response.data.data);
                setConversations(sortedConversations);
            } else {
                throw new Error(response.data.message || t('messages.errorLoadingConversations'));
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            if (!silent) {
                showToast(t('messages.errorLoadingConversations'), "error");
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [showToast, t, activeFilter, sortConversationsByLastMessage]);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await chatAPI.getUnreadCount();
            if (response.data.success) {
                updateUnreadCount(response.data.count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, [updateUnreadCount]);

    const handleFilterChange = useCallback((newFilter) => {
        setActiveFilter(newFilter);

        const params = {
            page: 1,
            limit: 50,
            type: 'auction'
        };

        if (newFilter !== 'all') {
            params.conversation_type = newFilter;
        }

        chatAPI.getConversations(params)
            .then(response => {
                if (response.data.success) {
                    const sortedConversations = sortConversationsByLastMessage(response.data.data);
                    setConversations(sortedConversations);
                }
            })
            .catch(error => {
                console.error("Error fetching conversations:", error);
                showToast(t('messages.errorLoadingConversations'), "error");
            });
    }, [showToast, t, sortConversationsByLastMessage]);

    const fetchMessages = useCallback(async (conversationId, silent = false) => {
        if (fetchMessagesAbortController.current) {
            fetchMessagesAbortController.current.abort();
        }

        fetchMessagesAbortController.current = new AbortController();

        try {
            if (!silent) setIsLoadingMessages(true);
            const response = await chatAPI.getMessages(
                conversationId,
                { page: 1, limit: 50 },
                { signal: fetchMessagesAbortController.current.signal }
            );

            if (response.data.success) {
                const newMessages = response.data.data;

                setMessages(prev => {
                    const prevIds = prev.map(m => m.id).join(',');
                    const newIds = newMessages.map(m => m.id).join(',');

                    if (prevIds === newIds && prev.length === newMessages.length) {
                        return prev;
                    }
                    return newMessages;
                });

                if (silent && conversationId === selectedConversationId) {
                    const conversation = conversations.find(c => c.id === conversationId);
                    if (conversation?.unread_count > 0) {
                        markAsRead(conversationId);
                    }
                }
            } else {
                throw new Error(response.data.message || t('messages.errorLoadingMessages'));
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Error fetching messages:", error);
                if (!silent) {
                    showToast(t('messages.errorLoadingMessages'), "error");
                }
            }
        } finally {
            if (!silent) setIsLoadingMessages(false);
        }
    }, [showToast, t, selectedConversationId, conversations]);

    const markAsRead = useCallback(async (conversationId) => {
        try {
            const conversation = conversations.find(c => c.id === conversationId);
            const unreadAmount = conversation?.unread_count || 0;

            if (unreadAmount === 0) return;

            setConversations(prev => prev.map(conv =>
                conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
            ));

            decrementUnreadCount(unreadAmount);

            await chatAPI.markAsRead(conversationId);
        } catch (error) {
            console.error("Error marking as read:", error);
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                setConversations(prev => prev.map(conv =>
                    conv.id === conversationId ? conversation : conv
                ));
            }
        }
    }, [conversations, decrementUnreadCount]);

    const handleSendMessage = useCallback(async (messageText) => {
        if (!messageText.trim() || isSendingMessage || !selectedConversationId) return;

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage = {
            id: tempId,
            message: messageText,
            sender_id: currentUserId,
            conversation_id: selectedConversationId,
            created_at: new Date().toISOString(),
            is_read: false,
            status: 'sending'
        };

        try {
            setIsSendingMessage(true);

            setMessages(prev => [...prev, optimisticMessage]);
            setNewMessage("");

            const response = await chatAPI.sendMessage(selectedConversationId, messageText);

            if (response.data.success) {
                const realMessage = response.data.data || optimisticMessage;

                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempId
                            ? { ...realMessage, id: realMessage.id || tempId, status: 'sent' }
                            : msg
                    )
                );

                setConversations(prev => {
                    const updated = prev.map(conv =>
                        conv.id === selectedConversationId
                            ? { ...conv, last_message: realMessage }
                            : conv
                    );
                    return sortConversationsByLastMessage(updated);
                });

                fetchUnreadCount();
            } else {
                throw new Error(response.data.message || t('messages.errorSendingMessage'));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            showToast(t('messages.errorSendingMessage'), "error");

            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setNewMessage(messageText);
        } finally {
            setIsSendingMessage(false);
        }
    }, [selectedConversationId, isSendingMessage, currentUserId, showToast, fetchUnreadCount, t, sortConversationsByLastMessage]);

    const handleChatSelect = useCallback((conversation) => {
        if (selectedConversationId === conversation.id) return;

        setSelectedConversationId(conversation.id);
        fetchMessages(conversation.id);

        if (conversation.unread_count > 0) {
            markAsRead(conversation.id);
        }
    }, [selectedConversationId, fetchMessages, markAsRead]);

    const handleCloseChat = useCallback(() => {
        setSelectedConversationId(null);
        setMessages([]);
        setNewMessage("");
        setShowChatOptions(false);

        if (fetchMessagesAbortController.current) {
            fetchMessagesAbortController.current.abort();
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        fetchUnreadCount();

        return () => {
            if (fetchMessagesAbortController.current) {
                fetchMessagesAbortController.current.abort();
                fetchMessagesAbortController.current = null;
            }

            if (autoRefreshInterval.current) {
                clearInterval(autoRefreshInterval.current);
                autoRefreshInterval.current = null;
            }

            if (messageRefreshInterval.current) {
                clearInterval(messageRefreshInterval.current);
                messageRefreshInterval.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' || event.keyCode === 27) {
                if (selectedConversationId) {
                    event.preventDefault();
                    event.stopPropagation();
                    handleCloseChat();
                }
            }
        };

        document.addEventListener('keydown', handleEscKey, true);

        return () => {
            document.removeEventListener('keydown', handleEscKey, true);
        };
    }, [selectedConversationId, handleCloseChat]);

    useEffect(() => {
        if (location.state?.conversationId && conversations.length > 0) {
            const convId = location.state.conversationId;
            const conv = conversations.find(c => c.id === convId);

            if (conv) {
                handleChatSelect(conv);
            }
        }
    }, [location.state?.conversationId, conversations, handleChatSelect]);

    useEffect(() => {
        if (autoRefreshInterval.current) {
            clearInterval(autoRefreshInterval.current);
        }
        if (messageRefreshInterval.current) {
            clearInterval(messageRefreshInterval.current);
        }

        autoRefreshInterval.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchConversations(1, true);
                fetchUnreadCount();
            }
        }, 10000);

        if (selectedConversationId) {
            messageRefreshInterval.current = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    fetchMessages(selectedConversationId, true);
                }
            }, 5000);
        }

        return () => {
            if (autoRefreshInterval.current) {
                clearInterval(autoRefreshInterval.current);
            }
            if (messageRefreshInterval.current) {
                clearInterval(messageRefreshInterval.current);
            }
        };
    }, [selectedConversationId, fetchConversations, fetchUnreadCount, fetchMessages]);

    const filteredConversations = useMemo(() => {
        let filtered = [...conversations];

        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(conv =>
                conv.other_user?.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [conversations, debouncedSearchQuery]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);

    const totalUnreadCount = useMemo(() => {
        return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
    }, [conversations]);

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full py-12 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{t('messages.noMessages')}</h3>
        </div>
    );

    if (loading) {
        return <MessagesSkeleton isRTL={isRTL} />;
    }

    return (
        <div className="h-[calc(100vh-90px)] flex bg-gradient-to-br from-gray-50 to-green-50/20 p-4 gap-4" dir={isRTL ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-6 ${isRTL ? "left-6" : "right-6"} z-50 animate-slide-in max-w-sm`}>
                    <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === "success"
                            ? "bg-gradient-to-r from-main to-green-600 text-white"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        }`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className={`${selectedConversation
                    ? 'hidden lg:flex lg:w-96'
                    : 'w-full lg:w-96'
                } bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col flex-shrink-0 overflow-hidden`}>
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-white to-green-50/30 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-main to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">{t('messages.title')}</h2>
                        </div>
                        {totalUnreadCount > 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => handleFilterChange("all")}
                            className={`flex-1 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === "all"
                                    ? "bg-main text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {t('messages.tabs.all')}
                        </button>
                        <button
                            onClick={() => handleFilterChange("buy")}
                            className={`flex-1 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === "buy"
                                    ? "bg-main text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {t('messages.tabs.buy')}
                        </button>
                        <button
                            onClick={() => handleFilterChange("sale")}
                            className={`flex-1 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === "sale"
                                    ? "bg-main text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {t('messages.tabs.sell')}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('messages.searchPlaceholder')}
                            className={`w-full ${isRTL ? 'pr-11 pl-5 text-right' : 'pl-11 pr-5 text-left'} py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-main focus:ring-2 focus:ring-main/20 transition-all bg-gray-50`}
                            autoComplete="off"
                            aria-label={t('messages.searchPlaceholder')}
                        />
                        <svg className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        searchQuery ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">{t('messages.noResults')}</p>
                                <p className="text-xs text-gray-500">{t('messages.tryAnotherSearch')}</p>
                            </div>
                        ) : (
                            <EmptyState />
                        )
                    ) : (
                        filteredConversations.map((conversation) => (
                            <MessageCard
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={conversation.id === selectedConversationId}
                                onSelect={() => handleChatSelect(conversation)}
                            />
                        ))
                    )}
                </div>
            </div>

            {selectedConversation ? (
                <div className="flex-1 h-full overflow-hidden">
                    <ChatView
                        conversation={selectedConversation}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onBack={handleCloseChat}
                        isLoadingMessages={isLoadingMessages}
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        currentUserId={currentUserId}
                        showChatOptions={showChatOptions}
                        setShowChatOptions={setShowChatOptions}
                        chatOptionsRef={chatOptionsRef}
                        isSendingMessage={isSendingMessage}
                    />
                </div>
            ) : (
                conversations.length > 0 && (
                    <div className="hidden lg:flex flex-1 items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                        <div className="text-center p-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">{t('messages.selectChat')}</h3>
                            <p className="text-sm text-gray-500 max-w-md">{t('messages.selectChatToStart')}</p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default Messages;