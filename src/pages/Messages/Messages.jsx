import { useState, useEffect, useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Ui/Loader/Loader";

const MessageCard = memo(({ message, isSelected, onSelect }) => (
    <div 
        className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition ${
            isSelected ? 'bg-green-50 border-l-4 border-l-main' : ''
        }`}
        onClick={onSelect}
    >
        <div className="flex-shrink-0">
            {message.userImage ? (
                <img
                    src={message.userImage}
                    alt={message.userName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-main"
                />
            ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-main flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            )}
        </div>

        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 truncate">{message.userName}</h4>
                <span className="text-xs text-gray-500 flex-shrink-0">{message.time}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1 truncate">{message.adTitle}</p>
            <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${message.unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {message.lastMessage}
                </p>
                {message.unread > 0 && (
                    <span className="flex-shrink-0 ml-2 bg-main text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {message.unread}
                    </span>
                )}
            </div>
        </div>
    </div>
));

const Messages = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [selectedTab, setSelectedTab] = useState("all"); 
    const [searchQuery, setSearchQuery] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setSelectedChatId(null);
            }
        };
        
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        setTimeout(() => {
            const dummyMessages = [
                {
                    id: 1,
                    userName: "محمد إبراهيم",
                    userImage: null,
                    lastMessage: "السلام عليكم، الذبيحة لسه متاحة؟",
                    time: "10:00 am",
                    unread: 2,
                    adTitle: "خروف بلدي للبيع - وزن 45 كجم",
                    type: "sell"
                },
                {
                    id: 2,
                    userName: "أحمد علي",
                    userImage: null,
                    lastMessage: "ممكن أشوف الدجاج البلدي؟",
                    time: "8:02 am",
                    unread: 0,
                    adTitle: "دجاج بلدي بياض - 20 فرخة",
                    type: "buy"
                },
                {
                    id: 3,
                    userName: "سارة محمود",
                    userImage: null,
                    lastMessage: "كم سعر الكيلو لحم الضاني؟",
                    time: "أمس",
                    unread: 1,
                    adTitle: "لحم ضاني طازج - للبيع بالكيلو",
                    type: "sell"
                },
                {
                    id: 4,
                    userName: "عمر حسن",
                    userImage: null,
                    lastMessage: "المزاد النهارده الساعة كام؟",
                    time: "أمس",
                    unread: 0,
                    adTitle: "مزاد ماشية - عجول وجاموس",
                    type: "buy"
                },
                {
                    id: 5,
                    userName: "فاطمة أحمد",
                    userImage: null,
                    lastMessage: "البط متاح للحجز؟",
                    time: "منذ يومين",
                    unread: 3,
                    adTitle: "بط مسكوفي للبيع - 15 بطة",
                    type: "sell"
                },
                {
                    id: 6,
                    userName: "خالد محمد",
                    userImage: null,
                    lastMessage: "عايز أحجز 5 كيلو لحم بقري",
                    time: "منذ يومين",
                    unread: 0,
                    adTitle: "لحم بقري طازج - جزارة الأمانة",
                    type: "buy"
                },
                {
                    id: 7,
                    userName: "نور الدين",
                    userImage: null,
                    lastMessage: "الأرانب لسه موجودة؟",
                    time: "منذ 3 أيام",
                    unread: 0,
                    adTitle: "أرانب للبيع - نيوزلندي أبيض",
                    type: "sell"
                },
                {
                    id: 8,
                    userName: "ياسمين سعيد",
                    userImage: null,
                    lastMessage: "في توصيل للقاهرة؟",
                    time: "منذ 3 أيام",
                    unread: 1,
                    adTitle: "عجل جاموسي - وزن 250 كجم",
                    type: "buy"
                }
            ];
            setMessages(dummyMessages);
            setLoading(false);
        }, 1000);
    }, []);

    const selectedChat = useMemo(() => {
        return messages.find(m => m.id === selectedChatId);
    }, [messages, selectedChatId]);

    const handleChatSelect = (message) => {
        setSelectedChatId(message.id);
        setMessages(prevMessages => prevMessages.map(msg => 
            msg.id === message.id ? { ...msg, unread: 0 } : msg
        ));
        
        const dummyChatMessages = message.type === "sell" ? [
            {
                id: 1,
                text: "السلام عليكم ورحمة الله",
                time: "10:00 am",
                sender: "other"
            },
            {
                id: 2,
                text: "وعليكم السلام ورحمة الله وبركاته، أهلاً وسهلاً",
                time: "10:01 am",
                sender: "me"
            },
            {
                id: 3,
                text: message.lastMessage,
                time: "10:02 am",
                sender: "other"
            },
            {
                id: 4,
                text: "نعم متاح والحمد لله، تقدر تيجي تشوفه",
                time: "10:03 am",
                sender: "me"
            },
            {
                id: 5,
                text: "ممتاز، السعر النهائي كام؟",
                time: "10:04 am",
                sender: "other"
            }
        ] : [
            {
                id: 1,
                text: "صباح الخير",
                time: "8:00 am",
                sender: "me"
            },
            {
                id: 2,
                text: "صباح النور، أهلاً بيك",
                time: "8:01 am",
                sender: "other"
            },
            {
                id: 3,
                text: message.lastMessage,
                time: "8:02 am",
                sender: "me"
            },
            {
                id: 4,
                text: "طبعاً، تعال في أي وقت",
                time: "8:03 am",
                sender: "other"
            }
        ];
        setChatMessages(dummyChatMessages);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const newMsg = {
                id: chatMessages.length + 1,
                text: newMessage,
                time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                sender: "me"
            };
            setChatMessages(prev => [...prev, newMsg]);
            setNewMessage("");
        }
    };

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const matchesTab = selectedTab === "all" || msg.type === selectedTab;
            const matchesSearch = msg.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 msg.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [messages, selectedTab, searchQuery]);

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full py-16 px-4">
            <svg width="100" height="100" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z" fill="#4CAF50"/>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
                {t("messages.noMessages")}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
                {t("messages.startConversation")}
            </p>
        </div>
    );

    const ChatView = () => (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center gap-3 p-4 border-b-2 border-gray-200 bg-gray-50">
                <button
                    onClick={() => setSelectedChatId(null)}
                    className="lg:hidden text-main hover:bg-gray-200 p-2 rounded-lg cursor-pointer"
                >
                    <i className="fas fa-arrow-right"></i>
                </button>
                <div className="flex-shrink-0">
                    {selectedChat.userImage ? (
                        <img
                            src={selectedChat.userImage}
                            alt={selectedChat.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-main"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-main flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{selectedChat.userName}</h3>
                    <p className="text-sm text-gray-600 truncate">{selectedChat.adTitle}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.02) 10px, rgba(0,0,0,.02) 20px)' }}>
                {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>{t("messages.startChatNow")}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-2' : 'order-1'}`}>
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${
                                            msg.sender === 'me'
                                                ? 'bg-main text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                        }`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                    <span className={`text-xs text-gray-500 mt-1 block ${msg.sender === 'me' ? 'text-left' : 'text-right'}`}>
                                        {msg.time}
                                    </span>
                                </div>
                            </div>
                        ))}
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
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t("messages.typePlaceholder")}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-full outline-none focus:border-main transition"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className="bg-main text-white p-3 rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                        disabled={!newMessage.trim()}
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );

    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <div className="h-screen flex flex-col" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <div className={`flex-1 flex ${selectedChat ? 'gap-0' : ''} overflow-hidden`}>
                {/* Sidebar - Messages List */}
                <div className={`${
                    selectedChat 
                        ? 'hidden lg:flex lg:w-[400px] xl:w-[450px] border-l-2 border-gray-200' 
                        : 'w-full lg:w-[400px] xl:w-[450px] lg:border-l-2 border-gray-200'
                } bg-white flex flex-col flex-shrink-0`}>
                    <div className="border-b-2 border-gray-200 p-4 bg-white">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <svg width="28" height="28" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z" fill="#4CAF50"/>
                            </svg>
                            {t("messages.title")}
                        </h2>
    
                        <div className="relative mb-4">
                            <input
                                type="text"
                                name="search"
                                id="search-messages"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("messages.searchPlaceholder")}
                                className="w-full px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
                                autoComplete="off"
                            />
                            <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
    
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="messageType"
                                    value="all"
                                    checked={selectedTab === "all"}
                                    onChange={(e) => setSelectedTab(e.target.value)}
                                    className="w-4 h-4 text-main focus:ring-main accent-main cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {t("messages.tabs.all")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="messageType"
                                    value="buy"
                                    checked={selectedTab === "buy"}
                                    onChange={(e) => setSelectedTab(e.target.value)}
                                    className="w-4 h-4 text-main focus:ring-main accent-main cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {t("messages.tabs.buy")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="messageType"
                                    value="sell"
                                    checked={selectedTab === "sell"}
                                    onChange={(e) => setSelectedTab(e.target.value)}
                                    className="w-4 h-4 text-main focus:ring-main accent-main cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    {t("messages.tabs.sell")}
                                </span>
                            </label>
                        </div>
                    </div>
    
                    <div className="flex-1 overflow-y-auto">
                        {filteredMessages.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filteredMessages.map((message) => (
                                <MessageCard 
                                    key={message.id} 
                                    message={message} 
                                    isSelected={message.id === selectedChatId}
                                    onSelect={() => handleChatSelect(message)}
                                />
                            ))
                        )}
                    </div>
                </div>
    
                {/* Chat Area */}
                {selectedChat ? (
                    <div className="flex-1">
                        <ChatView />
                    </div>
                ) : (
                    messages.length > 0 && (
                        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
                            <div className="text-center text-gray-500">
                                <svg width="120" height="120" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 opacity-50">
                                    <path d="M10 30H30V25H10V30ZM10 22.5H40V17.5H10V22.5ZM10 15H40V10H10V15ZM0 50V5C0 3.625 0.49 2.44833 1.47 1.47C2.45 0.491667 3.62667 0.00166667 5 0H45C46.375 0 47.5525 0.49 48.5325 1.47C49.5125 2.45 50.0017 3.62667 50 5V35C50 36.375 49.5108 37.5525 48.5325 38.5325C47.5542 39.5125 46.3767 40.0017 45 40H10L0 50ZM7.875 35H45V5H5V37.8125L7.875 35Z" fill="#4CAF50"/>
                                </svg>
                                <p className="text-xl font-semibold">{t("messages.selectChat")}</p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Messages;