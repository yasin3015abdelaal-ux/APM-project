import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminChatAPI } from "../../api";
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

const ChatPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);

  const [toast, setToast] = useState(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactUserQuery, setContactUserQuery] = useState("");
  const [contactUserResults, setContactUserResults] = useState([]);
  const [contactSelectedUser, setContactSelectedUser] = useState(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      const response = await adminChatAPI.get("/conversations", {
        params: { user_id: "", type: "", page: 1 },
      });
      const list = parseArray(response.data).map((conv) => ({
        id: conv.id,
        user: conv.user || conv.client || conv.participant || {},
        last_message: conv.last_message || conv.lastMessage || null,
        unread: conv.unread_count || conv.unread || 0,
        messages: conv.messages ? conv.messages.map(formatMessage) : [],
      }));
      setConversations(list);
      if (!selectedConversation && list.length) {
        setSelectedConversation(list[0]);
        const initialMessages =
          list[0].messages.length > 0
            ? list[0].messages
            : list[0].last_message
            ? [formatMessage(list[0].last_message)]
            : [];
        setMessages(initialMessages);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversationsError(t("dashboard.chat.errors.fetchConversations"));
    } finally {
      setConversationsLoading(false);
    }
  }, [selectedConversation, t]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFilteredConversations(
      conversations.filter((conv) => {
        const name = conv.user?.name || conv.user?.full_name || "";
        const preview =
          conv.last_message?.body || conv.last_message?.message || "";
        return (
          name.toLowerCase().includes(lower) ||
          preview.toLowerCase().includes(lower)
        );
      })
    );
  }, [conversations, searchTerm]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    const baseMessages =
      conversation.messages.length > 0
        ? conversation.messages
        : conversation.last_message
        ? [formatMessage(conversation.last_message)]
        : [];
    setMessages(baseMessages);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const optimisticMessage = {
      id: Date.now(),
      body: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_type: "admin",
    };

    try {
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      await adminChatAPI.post(
        `/conversations/${selectedConversation.id}/messages`,
        {
          message: optimisticMessage.body,
        }
      );
    } catch (err) {
      console.error("Error sending message:", err);
      showToast(t("dashboard.chat.errors.sendFailed"), "error");
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setNewMessage(optimisticMessage.body);
    }
  };

  // Contact modal helpers
  useEffect(() => {
    if (!contactUserQuery.trim()) {
      setContactUserResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await adminChatAPI.get("/users/search", {
          signal: controller.signal,
          params: { q: contactUserQuery },
        });
        setContactUserResults(parseArray(response.data));
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Error searching users:", err);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [contactUserQuery]);

  const handleInitiateConversation = async (e) => {
    e.preventDefault();
    if (!contactSelectedUser) {
      showToast(t("dashboard.chat.errors.userRequired"), "error");
      return;
    }
    try {
      setContactLoading(true);
      await adminChatAPI.post("/conversations/initiate", {
        user_id: contactSelectedUser.id,
        subject: contactSubject,
        message: contactMessage,
      });
      showToast(t("dashboard.chat.messages.initiated"));
      setContactModalOpen(false);
      setContactUserQuery("");
      setContactSelectedUser(null);
      setContactSubject("");
      setContactMessage("");
      fetchConversations();
    } catch (err) {
      console.error("Error initiating conversation:", err);
      showToast(t("dashboard.chat.errors.initiateFailed"), "error");
    } finally {
      setContactLoading(false);
    }
  };

  const renderedMessages = useMemo(() => {
    return messages.map((message) => ({
      ...message,
      side:
        message.sender_type === "admin" || message.sender_type === "support"
          ? "me"
          : "them",
    }));
  }, [messages]);

  if (conversationsLoading && !conversations.length) {
    return <Loader />;
  }

  return (
    <section className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {toast && (
        <div
          className={`fixed top-5 z-50 ${
            isRTL ? "left-5" : "right-5"
          } animate-slide-in`}
        >
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setContactModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          {t("dashboard.chat.actions.contactClient")}
        </button>
        <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
          {t("dashboard.chat.title")}
        </h1>
      </header>

      {conversationsError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-rose-600">
          {conversationsError}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        {/* Conversations list */}
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-emerald-100 p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("dashboard.chat.searchPlaceholder")}
              className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {t("dashboard.chat.empty")}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const name =
                  conv.user?.name ||
                  conv.user?.full_name ||
                  conv.user?.username ||
                  t("dashboard.chat.unknownUser");
                const timestamp =
                  conv.last_message?.created_at || conv.last_message?.time;
                const preview =
                  conv.last_message?.body ||
                  conv.last_message?.message ||
                  conv.last_message?.text ||
                  t("dashboard.chat.noMessagesYet");
                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => handleConversationSelect(conv)}
                    className={`flex w-full items-start gap-3 border-b border-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-50 ${
                      selectedConversation?.id === conv.id
                        ? "bg-emerald-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{name}</p>
                        {timestamp && (
                          <span className="text-xs text-slate-500">
                            {new Date(timestamp).toLocaleTimeString(i18n.language === "ar" ? "ar-EG" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {preview}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center p-8 text-center text-slate-500">
              {t("dashboard.chat.selectConversation")}
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 border-b border-emerald-100 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-600">
                  {(selectedConversation.user?.name ||
                    selectedConversation.user?.full_name ||
                    t("dashboard.chat.unknownUser")
                  ).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedConversation.user?.name ||
                      selectedConversation.user?.full_name ||
                      t("dashboard.chat.unknownUser")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedConversation.user?.email ||
                      selectedConversation.user?.phone ||
                      ""}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-emerald-50/30 p-4">
                {renderedMessages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">
                    {t("dashboard.chat.noMessagesYet")}
                  </p>
                ) : (
                  renderedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.side === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          msg.side === "me"
                            ? "rounded-br-none bg-emerald-500 text-white"
                            : "rounded-bl-none border border-emerald-100 bg-white text-slate-800"
                        }`}
                      >
                        <p>{msg.body}</p>
                        <span className="mt-1 block text-xs opacity-75">
                          {new Date(msg.created_at).toLocaleTimeString(
                            i18n.language === "ar" ? "ar-EG" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border-t border-emerald-100 p-4"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t("dashboard.chat.typePlaceholder")}
                  className="flex-1 rounded-full border border-emerald-200 px-4 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12l14-8-5 8 5 8-14-8z"
                    />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Contact client modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleInitiateConversation}
            className="w-full max-w-2xl space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-emerald-700">
                {t("dashboard.chat.modal.title")}
              </h2>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.chat.modal.user")}
              <input
                type="text"
                value={contactUserQuery}
                onChange={(e) => {
                  setContactUserQuery(e.target.value);
                  setContactSelectedUser(null);
                }}
                placeholder={t("dashboard.chat.modal.userPlaceholder")}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {contactUserResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-emerald-200 bg-white text-sm">
                  {contactUserResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-emerald-50 ${
                        contactSelectedUser?.id === user.id
                          ? "bg-emerald-50"
                          : ""
                      }`}
                      onClick={() => {
                        setContactSelectedUser(user);
                        setContactUserQuery(
                          user.name ||
                            user.full_name ||
                            user.username ||
                            String(user.id)
                        );
                      }}
                    >
                      <span>
                        {user.name ||
                          user.full_name ||
                          user.username ||
                          `#${user.id}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {user.email || user.phone || ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.chat.modal.subject")}
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.chat.modal.message")}
              <textarea
                rows={5}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.chat.actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {contactLoading
                  ? t("dashboard.chat.modal.sending")
                  : t("dashboard.chat.actions.send")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default ChatPage;



