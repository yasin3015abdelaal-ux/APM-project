import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../contexts/NotificationContext";
import { notificationAPI } from "../../api";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

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
    const [totalCounts, setTotalCounts] = useState({ all: 0, unread: 0, read: 0 });
    const perPage = 15;

    const currentLang = i18n.language || 'ar';
    const isRTL = currentLang === 'ar';

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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

            if (response.data?.counts) {
                setTotalCounts({
                    all: response.data.counts.all || 0,
                    unread: response.data.counts.unread || 0,
                    read: response.data.counts.read || 0
                });
            } else if (pagination.total !== undefined) {
                setTotalCounts(prev => ({
                    ...prev,
                    [status]: pagination.total || 0
                }));
            }
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

            setTotalCounts(prev => ({
                ...prev,
                unread: Math.max(0, prev.unread - 1),
                read: prev.read + 1
            }));

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

            setTotalCounts(prev => ({
                ...prev,
                unread: 0,
                read: prev.all
            }));

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

            setNotifications(notifications.filter(notif => notif.id !== id));

            setTotalCounts(prev => ({
                all: Math.max(0, prev.all - 1),
                unread: deletedNotif && !deletedNotif.read_at ? Math.max(0, prev.unread - 1) : prev.unread,
                read: deletedNotif && deletedNotif.read_at ? Math.max(0, prev.read - 1) : prev.read
            }));

            if (deletedNotif && !deletedNotif.read_at) {
                decreaseCount(1);
            }

            showToast(t("notifications.deleted") || "Notification deleted", "success");
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

    const unreadCount = totalCounts.unread;
    const readCount = totalCounts.read;
    const allCount = totalCounts.all;

    const getIconByType = (type) => {
        const icons = {
            'auction': 'gavel',
            'message': 'envelope',
            'order': 'shopping-cart',
            'product': 'box',
            'price_alert': 'bell',
            'system': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
        };
        return icons[type] || 'bell';
    };

    const getIconColor = (type) => {
        const colors = {
            'auction': 'from-purple-500 to-purple-600',
            'message': 'from-blue-500 to-blue-600',
            'order': 'from-green-500 to-green-600',
            'product': 'from-orange-500 to-orange-600',
            'price_alert': 'from-yellow-500 to-yellow-600',
            'system': 'from-gray-500 to-gray-600',
            'success': 'from-emerald-500 to-emerald-600',
            'warning': 'from-amber-500 to-amber-600',
            'error': 'from-red-500 to-red-600',
        };
        return colors[type] || 'from-green-500 to-green-600';
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t("notifications.justNow") || "الآن";
        if (diffMins < 60) return `${t("notifications.minutesAgo") || "منذ"} ${diffMins} ${t("notifications.minutes") || "دقيقة"}`;
        if (diffHours < 24) return `${t("notifications.hoursAgo") || "منذ"} ${diffHours} ${t("notifications.hours") || "ساعة"}`;
        if (diffDays < 7) return `${t("notifications.daysAgo") || "منذ"} ${diffDays} ${t("notifications.days") || "يوم"}`;

        return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
    };

    const EmptyState = () => {
        let message = t("notifications.noNotificationsDesc") || "ستظهر هنا جميع إشعاراتك عند وصولها";

        if (filter === "unread") {
            message = t("notifications.noUnreadNotifications") || "لا توجد إشعارات غير مقروءة";
        } else if (filter === "read") {
            message = t("notifications.noReadNotifications") || "لا توجد إشعارات مقروءة";
        }

        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-main/20 to-green-400/20 blur-2xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-full">
                        <svg width="50" height="50" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40">
                            <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="#4CAF50" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {filter === "all"
                        ? (t("notifications.noNotifications") || "لا توجد إشعارات")
                        : filter === "unread"
                            ? (t("notifications.noUnread") || "لا توجد إشعارات غير مقروءة")
                            : (t("notifications.noRead") || "لا توجد إشعارات مقروءة")
                    }
                </h3>
                <p className="text-gray-500 text-center max-w-md text-sm">
                    {message}
                </p>
            </div>
        );
    };

    const NotificationCard = ({ notification }) => {
        const isRead = !!notification.read_at;
        const isDeleting = loadingAction === `delete-${notification.id}`;
        const isMarking = loadingAction === notification.id;

        return (
            <div
                className={`group relative p-4 transition-all duration-300 border-b border-gray-100 hover:shadow-md hover:-translate-y-0.5 ${!isRead ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/50' : 'bg-white hover:bg-gray-50/50'
                    } ${isDeleting ? 'opacity-50 scale-95' : ''}`}
            >
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${getIconColor(notification.type)} flex items-center justify-center shadow-md transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                        <i className={`fas fa-${getIconByType(notification.type)} text-base text-white`}></i>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2 flex-1">
                                <h4 className={`font-bold text-gray-900 text-sm leading-snug ${!isRead ? 'text-main' : ''}`}>
                                    {notification.title}
                                </h4>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">
                            {notification.message || notification.body}
                        </p>

                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <i className="far fa-clock text-xs"></i>
                                <span className="font-medium">{formatTime(notification.created_at)}</span>
                            </div>

                            <div className="flex gap-2">
                                {!isRead && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        disabled={isMarking}
                                        className={`group/btn cursor-pointer flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${isMarking
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-main/10 text-main hover:bg-main hover:text-white hover:shadow-md'
                                            }`}
                                    >
                                        <IoCheckmarkDoneSharp className={`text-base ${isMarking ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    disabled={isDeleting}
                                    className={`group/btn cursor-pointer flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${isDeleting
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:shadow-md'
                                        }`}
                                >
                                    <i className={`fas text-xs ${isDeleting ? 'fa-spinner animate-spin' : 'fa-trash-alt'}`}></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const Pagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex cursor-pointer items-center justify-center w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-main hover:bg-main hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-600"
                >
                    <i className={`fas fa-chevron-${i18n.language === 'ar' ? 'right' : 'left'} text-xs`}></i>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200 font-semibold text-xs">
                    <span className="text-main">{currentPage}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">{totalPages}</span>
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="flex cursor-pointer items-center justify-center w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-main hover:bg-main hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-600"
                >
                    <i className={`fas fa-chevron-${i18n.language === 'ar' ? 'left' : 'right'} text-xs`}></i>
                </button>
            </div>
        );
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="max-w-5xl mx-auto p-4 min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-main/20 border-t-main"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <i className="fas fa-bell text-main text-lg animate-pulse"></i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 py-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in`}>
                    <div className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-sm transform transition-all hover:scale-105 ${toast.type === "success"
                        ? "bg-gradient-to-r from-main to-green-600 text-white"
                        : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        }`}>
                        <div className="flex-shrink-0">
                            {toast.type === "success" ? (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <i className="fas fa-check text-xs"></i>
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <i className="fas fa-times text-xs"></i>
                                </div>
                            )}
                        </div>
                        <span className="font-semibold text-sm">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="relative border-b border-gray-100 p-4 sm:p-6 bg-gradient-to-br from-white via-green-50/30 to-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-main/5 to-transparent rounded-full blur-3xl"></div>
                        <div className="relative">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-main to-green-600 blur-md opacity-40 rounded-xl"></div>
                                        <div className="relative bg-gradient-to-br from-main to-green-600 p-2 rounded-xl shadow-lg">
                                            <svg width="24" height="24" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="white" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-main to-green-700 bg-clip-text text-transparent">
                                            {t("notifications.title") || "الإشعارات"}
                                        </h2>
                                        {unreadCount > 0 && (
                                            <p className="text-xs text-gray-600 mt-0.5 font-medium">
                                                {unreadCount} {t("notifications.unread") || "إشعار جديد"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">

                                    {notifications.length > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            disabled={unreadCount === 0 || loadingAction === "all"}
                                            className="group cursor-pointer px-4 py-2 text-xs font-semibold bg-gradient-to-r from-main to-green-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <i className={`fas ${loadingAction === "all" ? 'fa-spinner animate-spin' : 'fa-check-double'}`}></i>
                                                <span className="hidden sm:inline">{loadingAction === "all"
                                                    ? (t("notifications.marking") || "جاري...")
                                                    : (t("notifications.markAllAsRead") || "تعيين الكل كمقروء")
                                                }</span>
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-gray-50/80 backdrop-blur-sm">
                        {[
                            { key: "all", label: t("notifications.filter.all") || "الكل", count: allCount },
                            { key: "unread", label: t("notifications.filter.unread") || "غير مقروء", count: unreadCount },
                            { key: "read", label: t("notifications.filter.read") || "مقروء", count: readCount }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                disabled={loading}
                                className={`group cursor-pointer flex-1 py-3 px-3 text-xs font-bold transition-all relative ${filter === tab.key ? "text-main" : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    {tab.label}
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold transition-all ${filter === tab.key
                                        ? "bg-main text-white shadow-md"
                                        : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                                        }`}>
                                        {tab.count}
                                    </span>
                                </span>
                                {filter === tab.key && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-main to-green-600 rounded-t-full shadow-md"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-main/20 border-t-main"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <i className="fas fa-bell text-main text-lg animate-pulse"></i>
                                    </div>
                                </div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <NotificationCard key={notification.id} notification={notification} />
                                ))}
                            </div>
                        )}
                    </div>

                    <Pagination />
                </div>

                {notifications.length > 0 && (
                    <div className="mt-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
                            <i className="fas fa-info-circle text-main text-xs"></i>
                            <span className="text-xs text-gray-600 font-medium">
                                {t("notifications.autoDelete") || "يتم حذف الإشعارات تلقائياً بعد 30 يوماً"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;