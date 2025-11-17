import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const Notifications = () => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("all"); 

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            // Example data 
            const dummyNotifications = [
                {
                    id: 1,
                    title: "تم قبول إعلانك",
                    message: "تم قبول ونشر إعلان 'خروف بلدي للبيع - وزن 45 كجم' بنجاح",
                    time: "منذ 10 دقائق",
                    isRead: false,
                    type: "success",
                    icon: "check-circle"
                },
                {
                    id: 2,
                    title: "رسالة جديدة",
                    message: "لديك رسالة جديدة من محمد إبراهيم بخصوص إعلان اللحم الضاني",
                    time: "منذ ساعة",
                    isRead: false,
                    type: "info",
                    icon: "envelope"
                },
                {
                    id: 3,
                    title: "تنبيه السعر",
                    message: "انخفض سعر اللحم البقري اليوم إلى 280 جنيه للكيلو",
                    time: "منذ 3 ساعات",
                    isRead: true,
                    type: "warning",
                    icon: "exclamation-triangle"
                },
                {
                    id: 4,
                    title: "مزاد جديد",
                    message: "بدأ مزاد الماشية الآن! 15 رأس عجول وجاموس متاحة للمزايدة",
                    time: "منذ 5 ساعات",
                    isRead: false,
                    type: "info",
                    icon: "gavel"
                },
                {
                    id: 5,
                    title: "طلب جديد",
                    message: "أحمد علي يريد شراء 20 فرخة دجاج بلدي من إعلانك",
                    time: "أمس",
                    isRead: true,
                    type: "success",
                    icon: "shopping-cart"
                },
                {
                    id: 6,
                    title: "تحذير",
                    message: "إعلانك 'أرانب للبيع - نيوزلندي أبيض' على وشك الانتهاء. قم بتجديده الآن",
                    time: "أمس",
                    isRead: false,
                    type: "warning",
                    icon: "clock"
                },
                {
                    id: 7,
                    title: "تم رفض إعلانك",
                    message: "تم رفض إعلان 'بط للبيع' بسبب عدم وضوح الصور. يرجى إعادة النشر بصور أفضل",
                    time: "منذ يومين",
                    isRead: true,
                    type: "error",
                    icon: "times-circle"
                },
                {
                    id: 8,
                    title: "عميل مهتم",
                    message: "سارة محمود أبدت اهتمامها بإعلان 'لحم ضاني طازج' وتريد التواصل معك",
                    time: "منذ يومين",
                    isRead: false,
                    type: "info",
                    icon: "user-plus"
                }
            ];
            setNotifications(dummyNotifications);
            // setNotifications([]); 
            setLoading(false);
        }, 1000);
    }, []);

    const markAsRead = (id) => {
        setNotifications(notifications.map(notif => 
            notif.id === id ? { ...notif, isRead: true } : notif
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(notif => notif.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === "unread") return !notif.isRead;
        if (filter === "read") return notif.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIconColor = (type) => {
        switch (type) {
            case "success": return "text-green-500";
            case "info": return "text-blue-500";
            case "warning": return "text-yellow-500";
            case "error": return "text-red-500";
            default: return "text-gray-500";
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case "success": return "bg-green-50";
            case "info": return "bg-blue-50";
            case "warning": return "bg-yellow-50";
            case "error": return "bg-red-50";
            default: return "bg-gray-50";
        }
    };

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg width="100" height="100" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="#4CAF50"/>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-2">
                {t("notifications.noNotifications")}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
                {t("notifications.noNotificationsDesc")}
            </p>
        </div>
    );

    const NotificationCard = ({ notification }) => (
        <div 
            className={`flex items-start gap-3 p-4 border-b border-gray-200 transition hover:bg-gray-50 ${
                !notification.isRead ? 'bg-green-50' : 'bg-white'
            }`}
        >
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getBgColor(notification.type)} flex items-center justify-center`}>
                <i className={`fas fa-${notification.icon} text-xl ${getIconColor(notification.type)}`}></i>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                        {notification.title}
                    </h4>
                    {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-main rounded-full mt-1.5"></span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">{notification.time}</span>
                    <div className="flex gap-2">
                        {!notification.isRead && (
                            <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-main hover:underline"
                            >
                                {t("notifications.markAsRead")}
                            </button>
                        )}
                        <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-500 hover:underline"
                        >
                            {t("notifications.delete")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="border-b-2 border-gray-200 p-4 sm:p-6 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-main flex items-center gap-3">
                                <svg width="32" height="32" viewBox="0 0 43 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.5 3.75C22.5 3.41848 22.3683 3.10054 22.1339 2.86612C21.8995 2.6317 21.5815 2.5 21.25 2.5C20.9185 2.5 20.6005 2.6317 20.3661 2.86612C20.1317 3.10054 20 3.41848 20 3.75V7.575C14.375 8.2 10 12.95 10 18.75V33.525L6.025 37.5H36.475L32.5 33.525V18.75C32.5 12.95 28.125 8.2 22.5 7.575V3.75ZM21.25 0C22.2446 0 23.1984 0.395088 23.9017 1.09835C24.6049 1.80161 25 2.75544 25 3.75V5.525C30.775 7.15 35 12.5 35 18.75V32.5L42.5 40H0L7.5 32.5V18.75C7.5 12.5 11.725 7.15 17.5 5.525V3.75C17.5 2.75544 17.8951 1.80161 18.5983 1.09835C19.3016 0.395088 20.2554 0 21.25 0ZM21.25 47.5C19.8092 47.5003 18.4125 47.0028 17.2964 46.0916C16.1802 45.1805 15.4132 43.9117 15.125 42.5H17.725C17.9821 43.2296 18.4593 43.8614 19.0906 44.3083C19.722 44.7552 20.4765 44.9952 21.25 44.9952C22.0235 44.9952 22.778 44.7552 23.4094 44.3083C24.0407 43.8614 24.5179 43.2296 24.775 42.5H27.375C27.0868 43.9117 26.3198 45.1805 25.2036 46.0916C24.0875 47.0028 22.6908 47.5003 21.25 47.5Z" fill="#4CAF50"/>
                                </svg>
                                {t("notifications.title")}
                            </h2>
                            {unreadCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-main text-white text-sm rounded-full font-semibold">
                                        {unreadCount} {t("notifications.unread")}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 text-sm bg-main text-white rounded-lg hover:bg-green-700 transition"
                                    disabled={unreadCount === 0}
                                >
                                    {t("notifications.markAllAsRead")}
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="px-4 py-2 text-sm border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
                                >
                                    {t("notifications.clearAll")}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    {notifications.length > 0 && (
                        <div className="flex border-b-2 border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setFilter("all")}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "all"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.all")}
                                {notifications.length > 0 && (
                                    <span className="mr-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter("unread")}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "unread"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.unread")}
                                {unreadCount > 0 && (
                                    <span className="mr-2 text-xs bg-main text-white px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter("read")}
                                className={`flex-1 py-3 px-4 text-sm font-semibold transition ${
                                    filter === "read"
                                        ? "text-main border-b-2 border-main bg-white"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {t("notifications.filter.read")}
                                {notifications.filter(n => n.isRead).length > 0 && (
                                    <span className="mr-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                                        {notifications.filter(n => n.isRead).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-[600px] overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filteredNotifications.map((notification) => (
                                <NotificationCard key={notification.id} notification={notification} />
                            ))
                        )}
                    </div>
                </div>

                {/* Info Text */}
                {notifications.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                        {t("notifications.autoDelete")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;