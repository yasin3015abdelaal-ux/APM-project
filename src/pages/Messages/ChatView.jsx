import { Send } from "lucide-react";
import { memo, useCallback, useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Ui/Loader/Loader";
import SellerRatingModal from "../../components/SellerRating/SellerRating";
import SellerReportModal from "../../components/SellerRating/SellerReport";

const ChatView = memo(({
    conversation,
    messages,
    onSendMessage,
    onBack,
    isLoadingMessages,
    newMessage,
    setNewMessage,
    currentUserId,
    showChatOptions,
    setShowChatOptions,
    chatOptionsRef,
    isSendingMessage
}) => {
    const { t, i18n } = useTranslation();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isRTL = i18n.language === "ar";
    const prevMessagesLengthRef = useRef(messages.length);
    const isUserScrollingRef = useRef(false);
    const hasInitialScrollRef = useRef(false);
    const conversationIdRef = useRef(conversation?.id);

    // State for modals
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const isAtBottom = useCallback(() => {
        if (!messagesContainerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        return scrollHeight - scrollTop - clientHeight < 100;
    }, []);

    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        }
    }, []);

    const handleScroll = useCallback(() => {
        isUserScrollingRef.current = !isAtBottom();
    }, [isAtBottom]);

    useEffect(() => {
        if (conversationIdRef.current !== conversation?.id) {
            hasInitialScrollRef.current = false;
            isUserScrollingRef.current = false;
            conversationIdRef.current = conversation?.id;
        }
    }, [conversation?.id]);

    useEffect(() => {
        if (!hasInitialScrollRef.current && messages.length > 0 && !isLoadingMessages) {
            setTimeout(() => {
                scrollToBottom("auto");
                hasInitialScrollRef.current = true;
            }, 0);
        }
    }, [messages.length, isLoadingMessages, scrollToBottom]);

    useEffect(() => {
        const isNewMessage = messages.length > prevMessagesLengthRef.current;

        if (isNewMessage && hasInitialScrollRef.current) {
            const lastMessage = messages[messages.length - 1];
            const isMyMessage = lastMessage?.sender_id === currentUserId;

            if (isMyMessage || !isUserScrollingRef.current) {
                setTimeout(() => scrollToBottom("smooth"), 100);
            }
        }

        prevMessagesLengthRef.current = messages.length;
    }, [messages.length, currentUserId, scrollToBottom]);

    const handleSubmit = useCallback(() => {
        if (newMessage.trim() && !isSendingMessage) {
            onSendMessage(newMessage);
        }
    }, [newMessage, onSendMessage, isSendingMessage]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    const formatMessageTime = useCallback((dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [isRTL]);

    const handleRateSeller = () => {
        setShowChatOptions(false);
        setShowRatingModal(true);
    };

    const handleReportSeller = () => {
        setShowChatOptions(false);
        setShowReportModal(true);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gradient-to-r from-white to-green-50/30 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="lg:hidden cursor-pointer text-main hover:bg-green-50 p-2 rounded-xl transition-all"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: isRTL ? 'none' : 'scaleX(-1)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex-shrink-0">
                    {conversation?.other_user?.image ? (
                        <img
                            src={conversation.other_user.image}
                            alt={conversation.other_user.name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-main flex items-center justify-center">
                            <span className="text-base font-bold text-white">
                                {conversation?.other_user?.name?.charAt(0) || (isRTL ? 'م' : 'U')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                        {conversation?.other_user?.name}
                    </h3>
                </div>

                <div className="relative" ref={chatOptionsRef}>
                    <button
                        onClick={() => setShowChatOptions(!showChatOptions)}
                        className="p-2 rounded-xl cursor-pointer text-gray-600 hover:bg-green-50 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {showChatOptions && (
                        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden`}>
                            <button
                                onClick={handleRateSeller}
                                className="w-full cursor-pointer px-4 py-3 hover:bg-green-50 flex items-center gap-2 transition text-gray-700 text-sm border-b border-gray-100"
                            >
                                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-medium">{t('messages.rateSeller')}</span>
                            </button>
                            
                            <button
                                onClick={handleReportSeller}
                                className="w-full cursor-pointer px-4 py-3 hover:bg-red-50 flex items-center gap-2 transition text-red-600 text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="font-medium">
                                    {isRTL ? 'الإبلاغ عن البائع' : 'Report Seller'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100"
            >
                {isLoadingMessages ? (
                    <Loader />
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center">
                                <svg className="w-10 h-10 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <p className="text-base font-bold text-gray-800 mb-2">
                                {t('messages.startChatNow')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const isMe = msg.sender_id === currentUserId;
                            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                            const showTime = index === messages.length - 1 ||
                                messages[index + 1]?.sender_id !== msg.sender_id ||
                                new Date(messages[index + 1]?.created_at).getTime() - new Date(msg.created_at).getTime() > 300000;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${!showAvatar ? 'mt-1' : 'mt-4'}`}
                                >
                                    {!isMe && (
                                        <div className="flex-shrink-0 w-8 h-8">
                                            {showAvatar ? (
                                                conversation?.other_user?.image ? (
                                                    <img
                                                        src={conversation.other_user.image}
                                                        alt={conversation.other_user.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-main flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">
                                                            {conversation?.other_user?.name?.charAt(0) || (isRTL ? 'م' : 'U')}
                                                        </span>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="w-8"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe
                                                    ? `bg-gradient-to-br from-green-500 to-main text-white ${isRTL ? 'rounded-br-sm' : 'rounded-bl-sm'
                                                    }`
                                                    : `bg-white text-gray-900 border border-gray-200 ${isRTL ? 'rounded-bl-sm' : 'rounded-br-sm'
                                                    }`
                                                }`}
                                        >
                                            <p className="break-words leading-relaxed whitespace-pre-wrap">
                                                {msg.message}
                                            </p>
                                        </div>

                                        {showTime && (
                                            <div className="flex items-center gap-1.5 mt-1 px-1">
                                                <span className="text-[10px] text-gray-400">
                                                    {formatMessageTime(msg.created_at)}
                                                </span>
                                                {isMe && (
                                                    msg.status === 'sending' ? (
                                                        <div className="flex items-center gap-0.5">
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                        </div>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5 text-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isMe && <div className="w-8"></div>}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex gap-2 items-center">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder={t('messages.typePlaceholder')}
                        className="flex-1 px-5 py-3 text-sm border border-gray-200 rounded-full outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all bg-gray-50 resize-none"
                        disabled={isSendingMessage}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={handleSubmit}
                        className="bg-gradient-to-br cursor-pointer from-green-500 to-main text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 relative group"
                        disabled={!newMessage.trim() || isSendingMessage}
                    >
                        <Send />
                    </button>
                </div>
            </div>

            {/* Rating Modal */}
            <SellerRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                sellerId={conversation?.other_user?.id}
                sellerName={conversation?.other_user?.name}
            />

            {/* Report Modal */}
            <SellerReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                sellerId={conversation?.other_user?.id}
                sellerName={conversation?.other_user?.name}
            />
        </div>
    );
});

ChatView.displayName = 'ChatView';

export default ChatView;