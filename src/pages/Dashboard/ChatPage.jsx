import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { adminChatAPI, chatMessagesAPI, adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const parseArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const formatMessage = (msg) => ({
  id: msg.id || msg.message_id || Math.random(),
  body: msg.body || msg.message || msg.text || "",
  created_at: msg.created_at || msg.time || new Date().toISOString(),
  sender_type: msg.sender_type || msg.sender || msg.author || "user",
});

const MessageCard = React.memo(({ conversation, isSelected, onSelect }) => {
  const { i18n } = useTranslation();
  const name =
    conversation.user?.name ||
    conversation.user?.full_name ||
    conversation.user?.username ||
    "Unknown user";
  const timestamp = conversation.last_message?.created_at || conversation.last_message?.time;
  const preview =
    conversation.last_message?.body ||
    conversation.last_message?.message ||
    conversation.last_message?.text ||
    "";

  return (
    <div
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition ${
        isSelected ? "bg-green-50 border-l-4 border-l-main" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        {conversation.user?.image ? (
          <img
            src={conversation.user.image}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-main"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-main flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
          {timestamp && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {new Date(timestamp).toLocaleTimeString(
                i18n.language === "ar" ? "ar-EG" : "en-US",
                { hour: "2-digit", minute: "2-digit" }
              )}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p
            className={`text-sm truncate ${
              conversation.unread > 0 ? "font-semibold text-gray-900" : "text-gray-500"
            }`}
            title={preview || (conversation.isNewUser ? "Start conversation" : "No messages yet")}
          >
            {conversation.isNewUser ? "Start conversation" : (preview || "No messages yet")}
          </p>
          {conversation.unread > 0 && !conversation.isNewUser && (
            <span className="flex-shrink-0 ml-2 bg-main text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const ChatPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === "ar";
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const initiatingRef = useRef(false);
  const userIdParamProcessedRef = useRef(null);

  const showToast = (message, type = "success") => {
    console.log(`${type}: ${message}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await adminChatAPI.get("/messages/unread-count");
      setUnreadCount(response.data?.data?.count || response.data?.count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const response = await adminAPI.get("/users");
      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      } else if (response.data) {
        usersData = [response.data];
      }
      setAllUsers(usersData);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId, page = 1) => {
      if (!conversationId) return;
      try {
        setMessagesLoading(true);
        const response = await adminChatAPI.get(`/conversations/${conversationId}/messages`, {
          params: { page, limit: 50 },
        });
        const messagesList = parseArray(response.data).map(formatMessage);
        setMessages(messagesList.reverse());
        
        try {
          await adminChatAPI.post(`/conversations/${conversationId}/mark-read`);
          fetchUnreadCount();
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId ? { ...conv, unread: 0 } : conv
            )
          );
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        showToast(t("dashboard.chat.errors.fetchMessages") || "Failed to load messages", "error");
      } finally {
        setMessagesLoading(false);
      }
    },
    [t, fetchUnreadCount]
  );

  const initiateConversationWithUser = useCallback(async (userId) => {
    // Prevent duplicate calls
    if (initiatingRef.current) {
      return null;
    }

    // Check if conversation already exists
    const existingConv = conversations.find((c) => c.user?.id === userId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      return existingConv;
    }

    try {
      initiatingRef.current = true;
      const response = await adminChatAPI.post("/conversations/initiate", {
        user_id: userId,
      });
      
      const convData = response.data?.data || response.data;
      
      // Find the correct user (not the admin)
      let userData = convData.user_one;
      if (userData?.role === 'admin' || userData?.role === 'super_admin' ||
          userData?.name?.toLowerCase().includes('admin') ||
          userData?.username?.toLowerCase().includes('admin')) {
        userData = convData.user_two || convData.user_one;
      }
      
      // If still not found, use the userId to find from allUsers
      if (!userData || userData.id === undefined) {
        userData = allUsers.find(u => u.id === userId) || { id: userId };
      }
      
      const newConv = {
        id: convData.id || convData.conversation_id,
        user: userData,
        last_message: null,
        unread: 0,
      };
      
      // Check again before adding to prevent duplicates
      setConversations((prev) => {
        const exists = prev.find(c => c.id === newConv.id || c.user?.id === userId);
        if (exists) {
          return prev;
        }
        return [newConv, ...prev];
      });
      setSelectedConversation(newConv);
      
      if (newConv.id) {
        await fetchMessages(newConv.id);
      }
      
      initiatingRef.current = false;
      return newConv;
    } catch (err) {
      console.error("Error initiating conversation:", err);
      showToast(t("dashboard.chat.errors.initiateFailed"), "error");
      initiatingRef.current = false;
      throw err;
    }
  }, [t, fetchMessages, allUsers, conversations]);

  const processConversationsData = useCallback((conversationsData) => {
    const conversationsArray = Array.isArray(conversationsData) ? conversationsData : [];
    
    return conversationsArray.map((conv) => {
      // Check both user_one and user_two to find the non-admin user
      let userData = conv.user_one;
      
      // If user_one is admin/super_admin, use user_two instead
      if (userData?.role === 'admin' || userData?.role === 'super_admin' || 
          userData?.name?.toLowerCase().includes('admin') ||
          userData?.username?.toLowerCase().includes('admin')) {
        userData = conv.user_two || conv.user_one;
      }
      
      // Fallback to other possible fields
      userData = userData || conv.user || conv.client || conv.participant || {};
      
      return {
        id: conv.id,
        user: userData,
        last_message: conv.last_message || conv.lastMessage || null,
        unread: conv.unread_count || conv.unread || 0,
      };
    });
  }, []);

  const fetchConversations = useCallback(async (skipAutoSelect = false, silent = false) => {
    try {
      if (!silent) {
        setConversationsLoading(true);
      }
      setConversationsError(null);
      
      const response = await adminChatAPI.get("/conversations", {
        params: {
          user_id: 14,
          // type: '',
          page: 1
        }
      });
      
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Failed to fetch conversations');
      }
      
      const conversationsData = response.data?.data || response.data;
      const list = processConversationsData(conversationsData);
      setConversations(list);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      if (!silent) {
        setConversationsError(t("dashboard.chat.errors.fetchConversations"));
      }
    } finally {
      if (!silent) {
        setConversationsLoading(false);
      }
    }
  }, [t, processConversationsData]);

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
    fetchUnreadCount();
  }, [fetchConversations, fetchAllUsers, fetchUnreadCount]);

  useEffect(() => {
    if (selectedConversation?.id && !initiatingRef.current) {
      fetchMessages(selectedConversation.id);
    } else if (!selectedConversation?.id) {
      setMessages([]);
    }
    if (initiatingRef.current) {
      setTimeout(() => {
        initiatingRef.current = false;
      }, 100);
    }
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    const userIdParam = searchParams.get("user_id");
    const currentUserId = userIdParam ? parseInt(userIdParam) : null;
    
    // Reset ref when user_id param is removed
    if (!userIdParam) {
      userIdParamProcessedRef.current = null;
      return;
    }
    
    // If we have a user_id and users are loaded, process it
    if (currentUserId && allUsers.length > 0) {
      // Check if this is a different user_id than what we processed before
      const lastProcessedUserId = userIdParamProcessedRef.current;
      
      if (lastProcessedUserId !== currentUserId) {
        userIdParamProcessedRef.current = currentUserId;
        const targetUser = allUsers.find((u) => u.id === currentUserId);
        
        if (targetUser) {
          // Check for existing conversation
          const existingConv = conversations.find((c) => c.user?.id === currentUserId);
          
          if (existingConv) {
            // Select existing conversation
            setSelectedConversation(existingConv);
          } else {
            // Initiate new conversation
            initiateConversationWithUser(currentUserId).catch((err) => {
              console.error("Failed to initiate conversation:", err);
            });
          }
        }
      }
    }
  }, [searchParams, allUsers, conversations, initiateConversationWithUser]);

  const allUsersWithConversations = useMemo(() => {
    const convMap = new Map();
    conversations.forEach((conv) => {
      if (conv.user?.id) {
        convMap.set(conv.user.id, conv);
      }
    });

    return allUsers.map((user) => {
      const existingConv = convMap.get(user.id);
      if (existingConv) {
        return existingConv;
      }
      return {
        id: null,
        user: user,
        last_message: null,
        unread: 0,
        isNewUser: true,
      };
    });
  }, [allUsers, conversations]);

  const filteredConversations = useMemo(() => {
    // Use conversations directly (not allUsersWithConversations for the list)
    if (!searchTerm.trim()) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter((item) => {
      const name =
        item.user?.name || item.user?.full_name || item.user?.username || "";
      const preview =
        item.last_message?.body || item.last_message?.message || "";
      return name.toLowerCase().includes(lower) || preview.toLowerCase().includes(lower);
    });
  }, [conversations, searchTerm]);

  const handleConversationSelect = async (conversation) => {
    if (conversation.isNewUser && conversation.user?.id) {
      try {
        await initiateConversationWithUser(conversation.user.id);
      } catch (err) {
        console.error("Error initiating conversation:", err);
      }
    } else {
      setSelectedConversation(conversation);
    }
  };

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !selectedConversation.id || sendingMessage) return;

    const messageText = newMessage.trim();
    const optimisticMessage = {
      id: Date.now(),
      body: messageText,
      created_at: new Date().toISOString(),
      sender_type: "admin",
    };

    try {
      setSendingMessage(true);
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      
      // Optimistically update the last message in conversations list (silently, no loading state)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                last_message: {
                  body: messageText,
                  created_at: optimisticMessage.created_at,
                  sender_type: "admin",
                },
              }
            : conv
        )
      );
      
      await adminChatAPI.post(`/conversations/${selectedConversation.id}/messages`, {
        message: messageText,
      });

      // Silently refresh messages and conversations in background without showing loading
      fetchMessages(selectedConversation.id).catch(console.error);
      // Silently update conversations list without showing loading spinner
      fetchConversations(false, true).catch(console.error);
    } catch (err) {
      console.error("Error sending message:", err);
      showToast(t("dashboard.chat.errors.sendFailed"), "error");
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setNewMessage(messageText);
      // Revert optimistic update on error - silently refresh
      fetchConversations(false, true).catch(console.error);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, sendingMessage, t, fetchMessages]);

  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      // Check if sender is USER (not admin) - user messages should be white
      const isUser = message.sender_type === "user" || message.sender_type === "client";
      return {
        ...message,
        sender: isUser ? "other" : "me", // User = other (white), Admin = me (green)
        text: message.body,
        time: new Date(message.created_at).toLocaleTimeString(
          i18n.language === "ar" ? "ar-EG" : "en-US",
          { hour: "2-digit", minute: "2-digit" }
        ),
      };
    });
  }, [messages, i18n.language]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full py-16 px-4">
      <svg width="100" height="100" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z"
          fill="#4CAF50"
        />
      </svg>
      <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
        {t("dashboard.chat.empty")}
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {t("dashboard.chat.selectConversation")}
      </p>
    </div>
  );

  const handleMessageChange = useCallback((e) => {
    setNewMessage(e.target.value);
  }, []);

  if ((conversationsLoading || usersLoading) && !conversations.length && !allUsers.length) {
    return <Loader />;
  }

  return (
    <div className="h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      {conversationsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {conversationsError}
        </div>
      )}
      <div className={`flex-1 flex ${selectedConversation ? "gap-0" : ""} overflow-hidden`}>
        <div
          className={`${
            selectedConversation
              ? "hidden lg:flex lg:w-[400px] xl:w-[450px] border-l-2 border-gray-200"
              : "w-full lg:w-[400px] xl:w-[450px] lg:border-l-2 border-gray-200"
          } bg-white flex flex-col flex-shrink-0`}
        >
          <div className="border-b-2 border-gray-200 p-4 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z"
                  fill="#4CAF50"
                />
              </svg>
              {t("dashboard.chat.title")}
            </h2>

            <div className="relative mb-4">
              <input
                type="text"
                name="search"
                id="search-messages"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("dashboard.chat.searchPlaceholder")}
                className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
                autoComplete="off"
              />
              <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <div className="border-b-2 border-gray-200 bg-white px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{t("dashboard.chat.allUsers") || "All Users"}</h3>
            <div className="overflow-x-auto hide-scrollbar">
              <div className="flex gap-4 pb-2">
                {allUsers.map((user) => {
                  const userName = user.name || user.full_name || user.username || "Unknown";
                  const hasConversation = conversations.some(conv => conv.user?.id === user.id);
                  const isSelected = selectedConversation?.user?.id === user.id;
                  
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        const existingConv = conversations.find(c => c.user?.id === user.id);
                        if (existingConv) {
                          setSelectedConversation(existingConv);
                        } else {
                          initiateConversationWithUser(user.id);
                        }
                      }}
                      className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group"
                    >
                      <div className={`relative ${isSelected ? 'ring-4 ring-main rounded-full' : ''}`}>
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={userName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 group-hover:border-main transition"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300 group-hover:border-main flex items-center justify-center transition">
                            <span className="text-xl font-semibold text-gray-600">
                              {userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {hasConversation && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-700 font-medium text-center max-w-[70px] truncate">
                        {userName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                <p className="text-gray-500 text-center">
                  {searchTerm.trim() 
                    ? (t("dashboard.chat.noResults") || "No conversations found") 
                    : (t("dashboard.chat.noConversations") || "No conversations yet")}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <MessageCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={conversation.id === selectedConversation?.id}
                  onSelect={() => handleConversationSelect(conversation)}
                />
              ))
            )}
          </div>
        </div>

        {selectedConversation ? (
          <div className="flex-1">
            {!selectedConversation.id && selectedConversation.isNewUser ? (
              <div className="flex flex-col h-full bg-white items-center justify-center p-8">
                <p className="text-gray-500 text-center">
                  {t("dashboard.chat.selectConversation")}
                </p>
              </div>
            ) : (
              (() => {
                const userName =
                  selectedConversation.user?.name ||
                  selectedConversation.user?.full_name ||
                  selectedConversation.user?.username ||
                  t("dashboard.chat.unknownUser");

                return (
                  <div className="flex flex-col h-full bg-white">
                    <div className="flex items-center gap-3 p-4 border-b-2 border-gray-200 bg-gray-50">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden text-main hover:bg-gray-200 p-2 rounded-lg cursor-pointer"
                      >
                        <i className="fas fa-arrow-right"></i>
                      </button>
                      <div className="flex-shrink-0">
                        {selectedConversation.user?.image ? (
                          <img
                            src={selectedConversation.user.image}
                            alt={userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-main"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-main flex items-center justify-center">
                            <span className="text-lg font-semibold text-gray-600">
                              {userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{userName}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {selectedConversation.user?.email || selectedConversation.user?.phone || ""}
                        </p>
                      </div>
                    </div>

                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 bg-gray-50"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.02) 10px, rgba(0,0,0,.02) 20px)",
                      }}
                    >
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader />
                        </div>
                      ) : renderedMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <p>{t("dashboard.chat.noMessagesYet")}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {renderedMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[70%] ${msg.sender === "me" ? "order-2" : "order-1"}`}>
                                <div
                                  className={`px-4 py-2 rounded-2xl ${
                                    msg.sender === "me"
                                      ? "bg-main text-white rounded-br-none"
                                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                                  }`}
                                >
                                  <p className="text-sm">{msg.text}</p>
                                </div>
                                <span
                                  className={`text-xs text-gray-500 mt-1 block ${
                                    msg.sender === "me" ? "text-left" : "text-right"
                                  }`}
                                >
                                  {msg.time}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t-2 border-gray-200 bg-white">
                      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <input
                          type="text"
                          name="message"
                          id="message-input"
                          value={newMessage}
                          onChange={handleMessageChange}
                          placeholder={t("dashboard.chat.typePlaceholder")}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-full outline-none focus:border-main transition"
                          autoComplete="off"
                          disabled={sendingMessage}
                        />
                        <button
                          type="submit"
                          className="bg-main text-white p-3 rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                          disabled={!newMessage.trim() || sendingMessage}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        ) : (
          conversations.length > 0 && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 50 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto mb-4 opacity-50"
                >
                  <path
                    d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z"
                    fill="#4CAF50"
                  />
                </svg>
                <p className="text-xl font-semibold">{t("dashboard.chat.selectConversation")}</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatPage;