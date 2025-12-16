import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../contexts/NotificationContext";
import { notificationAPI } from "../../api";

const Notifications = () => {
    const { t, i18n } = useTranslation();
    const { decreaseCount, resetCount, fetchUnreadCount } = useNotification();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingAction, setLoadingAction] = useState(null);
    const [toast, setToast] = useState(null);
    const perPage = 15;

    const currentLang = i18n.language || 'ar';
    const isRTL = currentLang === 'ar';

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Fetch notifications from API
    const fetchNotifications = async (page = 1, status = "all") => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications({
                status: status,
                per_page: perPage,
                page: page
            });
            
            const data = response.data?.data || response.data || [];
            const pagination = response.data?.pagination || {};
            
            setNotifications(Array.isArray(data) ? data : []);
            setTotalPages(pagination.last_page || 1);
            setCurrentPage(pagination.current_page || 1);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            showToast(t("notifications.fetchError") || "Failed to load notifications", "error");
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(1, filter);
    }, [filter]);

    const markAsRead = async (id) => {
        try {
            setLoadingAction(id);
            await notificationAPI.markAsRead(id);
            
            setNotifications(notifications.map(notif => 
                notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
            ));
            
            // Update context count
            decreaseCount(1);
            
            showToast(t("notifications.markedAsRead") || "Marked as read", "success");
        } catch (error) {
            console.error("Error marking as read:", error);
            showToast(t("notifications.markError") || "Failed to mark as read", "error");
        } finally {
            setLoadingAction(null);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoadingAction("all");
            await notificationAPI.markAllAsRead();
            
            const unreadBeforeCount = notifications.filter(n => !n.read_at).length;
            
            setNotifications(notifications.map(notif => ({ 
                ...notif, 
                read_at: new Date().toISOString() 
            })));
            
            // Reset context count
            resetCount();
            
            showToast(t("notifications.allMarkedAsRead") || "All marked as read", "success");
        } catch (error) {
            console.error("Error marking all as read:", error);
            showToast(t("notifications.markAllError") || "Failed to mark all as read", "error");
        } finally {
            setLoadingAction(null);
        }
    };

    const deleteNotification = async (id) => {
        try {
            setLoadingAction(`delete-${id}`);
            await notificationAPI.deleteNotification(id);
            
            const deletedNotif = notifications.find(n => n.id === id);
            if (deletedNotif && !deletedNotif.read_at) {
                decreaseCount(1);
            }
            
            setNotifications(notifications.filter(notif => notif.id !== id));
            showToast(t("notifications.deleted") || "Notification deleted", "success");
            
            // Refresh count from server
            fetchUnreadCount();
        } catch (error) {
            console.error("Error deleting notification:", error);
            showToast(t("notifications.deleteError") || "Failed to delete notification", "error");
        } finally {
            setLoadingAction(null);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchNotifications(newPage, filter);
        }
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const getIconByType = (type) => {
        const icons = {
            'auction': 'gavel',
            'message': 'envelope',
            'order': 'shopping-cart',
            'product': 'box',
            'price_alert': 'exclamation-triangle',
            'system': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
        };
        return icons[type] || 'bell';
    };

    const getIconColor = (type) => {
        const colors = {
            'auction': 'text-purple-500',
            'message': 'text-blue-500',
            'order': 'text-green-500',
            'product': 'text-orange-500',
            'price_alert': 'text-yellow-500',
            'system': 'text-gray-500',
            'success': 'text-green-500',
            'warning': 'text-yellow-500',
            'error': 'text-red-500',
        };
        return colors[type] || 'text-main';
    };

    const getBgColor = (type) => {
        const colors = {
            'auction': 'bg-purple-50',
            'message': 'bg-blue-50',
            'order': 'bg-green-50',
            'product': 'bg-orange-50',
            'price_alert': 'bg-yellow-50',
            'system': 'bg-gray-50',
            'success': 'bg-green-50',
            'warning': 'bg-yellow-50',
            'error': 'bg-red-50',
        };
        return colors[type] || 'bg-gray-50';
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t("notifications.justNow") || "Just now";
        if (diffMins < 60) return `${t("notifications.minutesAgo") || "منذ"} ${diffMins} ${t("notifications.minutes") || "دقيقة"}`;
        if (diffHours < 24) return `${t("notifications.hoursAgo") || "منذ"} ${diffHours} ${t("notifications.hours") || "ساعة"}`;
        if (diffDays < 7) return `${t("notifications.daysAgo") || "منذ"} ${diffDays} ${t("notifications.days") || "يوم"}`;
        
        return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
    };

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg width="100" height="100" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="#4CAF50"/>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
                {t("notifications.noNotifications") || "لا توجد إشعارات"}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
                {t("notifications.noNotificationsDesc") || "ستظهر هنا جميع إشعاراتك عند وصولها"}
            </p>
        </div>
    );

    const NotificationCard = ({ notification }) => {
        const isRead = !!notification.read_at;
        const isDeleting = loadingAction === `delete-${notification.id}`;
        const isMarking = loadingAction === notification.id;

        return (
            <div 
                className={`flex items-start gap-3 p-4 border-b border-gray-200 transition hover:bg-gray-50 ${
                    !isRead ? 'bg-green-50' : 'bg-white'
                } ${isDeleting ? 'opacity-50' : ''}`}
            >
                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getBgColor(notification.type)} flex items-center justify-center`}>
                    <i className={`fas fa-${getIconByType(notification.type)} text-xl ${getIconColor(notification.type)}`}></i>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-semibold text-gray-900 ${!isRead ? 'font-bold' : ''}`}>
                            {notification.title}
                        </h4>
                        {!isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-main rounded-full mt-1.5"></span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message || notification.body}</p>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                        </span>
                        <div className="flex gap-2">
                            {!isRead && (
                                <button
                                    onClick={() => markAsRead(notification.id)}
                                    disabled={isMarking}
                                    className={`text-xs text-main hover:underline ${isMarking ? 'opacity-50' : ''}`}
                                >
                                    {isMarking ? t("notifications.marking") || "جاري..." : t("notifications.markAsRead") || "تعيين كمقروء"}
                                </button>
                            )}
                            <button
                                onClick={() => deleteNotification(notification.id)}
                                disabled={isDeleting}
                                className={`text-xs text-red-500 hover:underline ${isDeleting ? 'opacity-50' : ''}`}
                                >
                                {isDeleting ? t("notifications.deleting") || "جاري..." : t("notifications.delete") || "حذف"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const Pagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className={`fas fa-chevron-${i18n.language === 'ar' ? 'right' : 'left'}`}></i>
                </button>
                
                <span className="text-sm text-gray-600">
                    {t("notifications.page") || "صفحة"} {currentPage} {t("notifications.of") || "من"} {totalPages}
                </span>
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className={`fas fa-chevron-${i18n.language === 'ar' ? 'left' : 'right'}`}></i>
                </button>
            </div>
        );
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-4 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            {/* Toast Component */}
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="border-b-2 border-gray-200 p-4 sm:p-6 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-main flex items-center gap-3">
                                <svg width="32" height="32" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="#4CAF50"/>
                                </svg>
                                {t("notifications.title") || "الإشعارات"}
                            </h2>
                            {unreadCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-main text-white text-sm rounded-full font-semibold">
                                        {unreadCount} {t("notifications.unread") || "غير مقروء"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    disabled={unreadCount === 0 || loadingAction === "all"}
                                    className="px-4 py-2 text-sm bg-main text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingAction === "all" 
                                        ? (t("notifications.marking") || "جاري...") 
                                        : (t("notifications.markAllAsRead") || "تعيين الكل كمقروء")
                                    }
                                </button>
                                <button
                                    onClick={() => fetchNotifications(currentPage, filter)}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm border-2 border-main text-main rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                                >
                                    <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
                                    <span className="mr-2">{t("notifications.refresh") || "تحديث"}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    {notifications.length > 0 && (
                        <div className="flex border-b-2 border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setFilter("all")}
                                disabled={loading}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "all"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.all") || "الكل"}
                                {notifications.length > 0 && (
                                    <span className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-xs bg-gray-200 px-2 py-0.5 rounded-full`}>
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter("unread")}
                                disabled={loading}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "unread"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.unread") || "غير مقروء"}
                                {unreadCount > 0 && (
                                    <span className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-xs bg-main text-white px-2 py-0.5 rounded-full`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter("read")}
                                disabled={loading}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "read"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.read") || "مقروء"}
                                {notifications.filter(n => n.read_at).length > 0 && (
                                    <span className={`${i18n.language === 'ar' ? 'mr-2' : 'ml-2'} text-xs bg-gray-200 px-2 py-0.5 rounded-full`}>
                                        {notifications.filter(n => n.read_at).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-[600px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <EmptyState />
                        ) : (
                            notifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} />
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination />
                </div>

                {/* Info Text */}
                {notifications.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                        {t("notifications.autoDelete") || "يتم حذف الإشعارات تلقائياً بعد 30 يوماً"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;