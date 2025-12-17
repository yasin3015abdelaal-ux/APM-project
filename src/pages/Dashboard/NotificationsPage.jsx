import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { adminNotificationsAPI, dataAPI, adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { X, Eye, Send, Globe, BarChart3, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isAr = i18n.language === "ar";


  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Filters (temporary - only applied when Apply is clicked)
  const [tempFilters, setTempFilters] = useState({
    user_id: "",
    type: "",
    status: "",
    all: "",
  });
  
  // Applied filters (used for API calls)
  const [filters, setFilters] = useState({
    user_id: "",
    type: "",
    status: "",
    all: "",
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [toast, setToast] = useState(null);

  // Form data
  const [sendFormData, setSendFormData] = useState({
    user_ids: [],
    title: "",
    message: "",
    type: "info",
  });

  const [broadcastFormData, setBroadcastFormData] = useState({
    country_id: "",
    title: "",
    message: "",
    type: "info",
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    try {
      const response = await dataAPI.getCountries();
      const data = response.data?.data?.countries || response.data?.countries || response.data?.data || [];
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching countries:", err);
    }
  }, []);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await adminAPI.get("/users");
      
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data) {
        data = [response.data];
      }
      
      setAllUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Filter users by search term
  useEffect(() => {
    if (!userSearchTerm.trim()) {
      setFilteredUsers(allUsers);
      return;
    }
    
    const searchLower = userSearchTerm.toLowerCase();
    const filtered = allUsers.filter((user) => {
      const name = (user.name || user.full_name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      const code = (user.code || user.id || "").toString().toLowerCase();
      
      return (
        name.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower) ||
        code.includes(searchLower)
      );
    });
    
    setFilteredUsers(filtered);
  }, [userSearchTerm, allUsers]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        per_page: pagination.per_page,
        page,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      };

      const response = await adminNotificationsAPI.getNotifications(params);
      
      // Handle different response structures
      let data = [];
      let meta = {};
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        data = response.data.data.data;
        meta = response.data.data.meta || response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
        meta = response.data.meta || {};
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }

      setNotifications(data);
      
      if (meta.current_page) {
        setPagination({
          current_page: meta.current_page || 1,
          per_page: meta.per_page || 20,
          total: meta.total || 0,
          last_page: meta.last_page || 1,
        });
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      showToast(
        err.response?.data?.message || t("dashboard.notifications.errors.fetch"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.per_page, t]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      const params = {};
      if (filters.user_id) {
        params.user_id = filters.user_id;
      }
      const response = await adminNotificationsAPI.getStatistics(params);
      setStatistics(response.data?.data || response.data || null);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [filters.user_id]);

  // Fetch notification details
  const fetchNotificationDetails = async (notificationId) => {
    try {
      const response = await adminNotificationsAPI.getNotification(notificationId);
      const data = response.data?.data || response.data;
      setSelectedNotification(data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching notification details:", err);
      showToast(
        err.response?.data?.message || t("dashboard.notifications.errors.fetchDetails"),
        "error"
      );
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchUsers();
  }, [fetchCountries, fetchUsers]);

  useEffect(() => {
    fetchNotifications(pagination.current_page);
  }, [fetchNotifications, pagination.current_page]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Handle filter change (temporary - not applied yet)
  const handleFilterChange = (name, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      user_id: "",
      type: "",
      status: "",
      all: "",
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.last_page) {
      setPagination((prev) => ({ ...prev, current_page: page }));
    }
  };

  // Open send modal
  const handleOpenSendModal = () => {
    setSendFormData({
      user_ids: [],
      title: "",
      message: "",
      type: "info",
    });
    setFormErrors({});
    setUserSearchTerm("");
    setFilteredUsers(allUsers);
    setShowSendModal(true);
  };

  // Open broadcast modal
  const handleOpenBroadcastModal = () => {
    setBroadcastFormData({
      country_id: "",
      title: "",
      message: "",
      type: "info",
    });
    setFormErrors({});
    setShowBroadcastModal(true);
  };

  // Handle send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = {};
    if (!sendFormData.title.trim()) {
      errors.title = t("dashboard.notifications.errors.titleRequired");
    }
    if (!sendFormData.message.trim()) {
      errors.message = t("dashboard.notifications.errors.messageRequired");
    }
    if (!sendFormData.user_ids || sendFormData.user_ids.length === 0) {
      errors.user_ids = t("dashboard.notifications.errors.usersRequired");
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Ensure user_ids is an array of numbers
      const userIdsToSend = Array.isArray(sendFormData.user_ids) 
        ? sendFormData.user_ids 
        : sendFormData.user_ids.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      await adminNotificationsAPI.sendNotification({
        user_ids: userIdsToSend,
        title: sendFormData.title.trim(),
        message: sendFormData.message.trim(),
        type: sendFormData.type,
      });
      
      showToast(t("dashboard.notifications.messages.sendSuccess"));
      setShowSendModal(false);
      setSendFormData({
        user_ids: [],
        title: "",
        message: "",
        type: "info",
      });
      fetchNotifications(pagination.current_page);
      fetchStatistics();
    } catch (err) {
      console.error("Error sending notification:", err);
      showToast(
        err.response?.data?.message || t("dashboard.notifications.errors.sendFailed"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle broadcast notification
  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = {};
    if (!broadcastFormData.title.trim()) {
      errors.title = t("dashboard.notifications.errors.titleRequired");
    }
    if (!broadcastFormData.message.trim()) {
      errors.message = t("dashboard.notifications.errors.messageRequired");
    }
    if (!broadcastFormData.country_id) {
      errors.country_id = t("dashboard.notifications.errors.countryRequired");
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await adminNotificationsAPI.broadcastNotification({
        country_id: broadcastFormData.country_id,
        title: broadcastFormData.title.trim(),
        message: broadcastFormData.message.trim(),
        type: broadcastFormData.type,
      });
      
      showToast(t("dashboard.notifications.messages.broadcastSuccess"));
      setShowBroadcastModal(false);
      fetchNotifications(pagination.current_page);
      fetchStatistics();
    } catch (err) {
      console.error("Error broadcasting notification:", err);
      showToast(
        err.response?.data?.message || t("dashboard.notifications.errors.broadcastFailed"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get notification type as string (handles both string and object)
  const getNotificationType = (type) => {
    if (!type) return "info";
    if (typeof type === "string") return type;
    if (typeof type === "object") {
      return type.key || type.name || type.type || "info";
    }
    return "info";
  };

  // Get notification status (handles both boolean and object)
  const getNotificationStatus = (status) => {
    if (typeof status === "boolean") return status;
    if (typeof status === "object" && status !== null) {
      return status.is_read || status.read || false;
    }
    return false;
  };

  if (loading && notifications.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          <span className="text-sm sm:text-base">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-main mb-4">
          {t("dashboard.notifications.title")}
        </h1>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleOpenSendModal}
            className="flex items-center gap-2 bg-main text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition font-semibold shadow-md text-sm sm:text-base"
          >
            <Send size={18} />
            {t("dashboard.notifications.actions.send")}
          </button>
          <button
            onClick={handleOpenBroadcastModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md text-sm sm:text-base"
          >
            <Globe size={18} />
            {t("dashboard.notifications.actions.broadcast")}
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-main">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("dashboard.notifications.stats.total")}</p>
                  <p className="text-2xl font-bold text-main">{statistics.total || 0}</p>
                </div>
                <BarChart3 className="text-main" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("dashboard.notifications.stats.sent")}</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.sent || 0}</p>
                </div>
                <Send className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("dashboard.notifications.stats.read")}</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.read || 0}</p>
                </div>
                <Eye className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("dashboard.notifications.stats.unread")}</p>
                  <p className="text-2xl font-bold text-orange-600">{statistics.unread || 0}</p>
                </div>
                <BarChart3 className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-main" />
            <h3 className="text-lg font-semibold text-gray-800">{t("dashboard.notifications.filters.title")}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("dashboard.notifications.filters.userId")}
              </label>
              <input
                type="text"
                value={tempFilters.user_id}
                onChange={(e) => handleFilterChange("user_id", e.target.value)}
                placeholder={t("dashboard.notifications.filters.userIdPlaceholder")}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("dashboard.notifications.filters.type")}
              </label>
              <select
                value={tempFilters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
              >
                <option value="">{t("dashboard.notifications.filters.allTypes")}</option>
                <option value="custom">{!isAr?"Custom Notification":"إشعار مخصص"}</option>
                <option value="admin_announcement">{!isAr?"Announcement":"اعلان"}</option>
                
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("dashboard.notifications.filters.status")}
              </label>
              <select
                value={tempFilters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
              >
                <option value="">{t("dashboard.notifications.filters.allStatuses")}</option>
                <option value="read">{t("dashboard.notifications.status.read")}</option>
                <option value="unread">{t("dashboard.notifications.status.unread")}</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 bg-main text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
              >
                {t("dashboard.notifications.filters.apply")}
              </button>
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition font-medium text-sm sm:text-base"
              >
                {t("dashboard.notifications.filters.reset")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-main text-white">
              <tr>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.id")}
                </th>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.title")}
                </th>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.type")}
                </th>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.status")}
                </th>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.createdAt")}
                </th>
                <th className="px-4 py-3 text-sm sm:text-base font-semibold text-start">
                  {t("dashboard.notifications.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {t("dashboard.notifications.empty")}
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 text-sm">{notification.id || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium">{notification.title || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (() => {
                            const type = getNotificationType(notification.type);
                            return type === "error"
                              ? "bg-red-100 text-red-800"
                              : type === "warning"
                              ? "bg-yellow-100 text-yellow-800"
                              : type === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800";
                          })()
                        }`}
                      >
                        {getNotificationType(notification.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getNotificationStatus(notification.is_read || notification.status)
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {getNotificationStatus(notification.is_read || notification.status)
                          ? t("dashboard.notifications.status.read")
                          : t("dashboard.notifications.status.unread")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(notification.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchNotificationDetails(notification.id)}
                        className="p-2 text-main hover:bg-main/10 rounded transition"
                        title={t("dashboard.notifications.actions.viewDetails")}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t("dashboard.notifications.pagination.showing")} {(pagination.current_page - 1) * pagination.per_page + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t("dashboard.notifications.pagination.of")} {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                {t("dashboard.notifications.pagination.page")} {pagination.current_page} {t("dashboard.notifications.pagination.of")} {pagination.last_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            {t("dashboard.notifications.empty")}
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{notification.title || "-"}</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {notification.id || "-"}</p>
                </div>
                <button
                  onClick={() => fetchNotificationDetails(notification.id)}
                  className="p-2 text-main hover:bg-main/10 rounded transition"
                >
                  <Eye size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (() => {
                      const type = getNotificationType(notification.type);
                      return type === "error"
                        ? "bg-red-100 text-red-800"
                        : type === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : type === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800";
                    })()
                  }`}
                >
                  {getNotificationType(notification.type)}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getNotificationStatus(notification.is_read || notification.status)
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {getNotificationStatus(notification.is_read || notification.status)
                    ? t("dashboard.notifications.status.read")
                    : t("dashboard.notifications.status.unread")}
                </span>
              </div>
              <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.last_page > 1 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <p className="text-xs text-center text-gray-500">
              {t("dashboard.notifications.pagination.showing")} {(pagination.current_page - 1) * pagination.per_page + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t("dashboard.notifications.pagination.of")} {pagination.total}
            </p>
          </div>
        )}
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-main">
                {t("dashboard.notifications.details.title")}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                  {t("dashboard.notifications.details.id")}:
                </span>
                <span className="text-sm sm:text-base text-gray-900 font-medium">
                  {selectedNotification.id || "-"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                  {t("dashboard.notifications.details.title")}:
                </span>
                <span className="text-sm sm:text-base text-gray-900">
                  {selectedNotification.title || "-"}
                </span>
              </div>
              <div className="pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500 block mb-2">
                  {t("dashboard.notifications.details.message")}:
                </span>
                <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                  {selectedNotification.message || "-"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                  {t("dashboard.notifications.details.type")}:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                    (() => {
                      const type = getNotificationType(selectedNotification.type);
                      return type === "error"
                        ? "bg-red-100 text-red-800"
                        : type === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : type === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800";
                    })()
                  }`}
                >
                  {getNotificationType(selectedNotification.type)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                  {t("dashboard.notifications.details.status")}:
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                    getNotificationStatus(selectedNotification.is_read || selectedNotification.status)
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {getNotificationStatus(selectedNotification.is_read || selectedNotification.status)
                    ? t("dashboard.notifications.status.read")
                    : t("dashboard.notifications.status.unread")}
                </span>
              </div>
              {selectedNotification.created_at && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.notifications.details.createdAt")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900">
                    {formatDate(selectedNotification.created_at)}
                  </span>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-main text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
              >
                {t("dashboard.notifications.actions.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-main">
                {t("dashboard.notifications.send.title")}
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendNotification} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.send.selectUsers")} *
                  </label>
                  
                  {/* User Search */}
                  <div className="mb-2">
                    <div className="relative">
                      <Search
                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-gray-400`}
                        size={18}
                      />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder={t("dashboard.notifications.send.searchUsers")}
                        className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition`}
                      />
                    </div>
                  </div>

                  {/* Multi-select dropdown */}
                  <div className="relative">
                    <select
                      multiple
                      value={sendFormData.user_ids.map(String)}
                      onChange={(e) => {
                        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setSendFormData(prev => ({ ...prev, user_ids: selectedIds }));
                      }}
                      className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition min-h-[120px] ${
                        formErrors.user_ids
                          ? "border-red-500"
                          : "border-gray-300 focus:border-main"
                      }`}
                      size={5}
                    >
                      {loadingUsers ? (
                        <option disabled>{t("dashboard.notifications.send.loadingUsers")}</option>
                      ) : filteredUsers.length === 0 ? (
                        <option disabled>{t("dashboard.notifications.send.noUsersFound")}</option>
                      ) : (
                        filteredUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.full_name || "-"} {user.email ? `(${user.email})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("dashboard.notifications.send.selectMultipleHint")} ({sendFormData.user_ids.length} {t("dashboard.notifications.send.selected")})
                    </p>
                  </div>
                  
                  {formErrors.user_ids && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.user_ids}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.send.title")} *
                  </label>
                  <input
                    type="text"
                    value={sendFormData.title}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.title
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.notifications.send.titlePlaceholder")}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.send.message")} *
                  </label>
                  <textarea
                    value={sendFormData.message}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.message
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.notifications.send.messagePlaceholder")}
                  />
                  {formErrors.message && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.send.type")}
                  </label>
                  <select
                    value={sendFormData.type}
                    onChange={(e) => setSendFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
                  >
                    <option value="info">{t("dashboard.notifications.types.info")}</option>
                    <option value="warning">{t("dashboard.notifications.types.warning")}</option>
                    <option value="success">{t("dashboard.notifications.types.success")}</option>
                    <option value="error">{t("dashboard.notifications.types.error")}</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                >
                  {t("dashboard.notifications.actions.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-main text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submitting
                    ? t("dashboard.notifications.send.sending")
                    : t("dashboard.notifications.send.send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-main">
                {t("dashboard.notifications.broadcast.title")}
              </h2>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBroadcastNotification} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.broadcast.country")} *
                  </label>
                  <select
                    value={broadcastFormData.country_id}
                    onChange={(e) => setBroadcastFormData(prev => ({ ...prev, country_id: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.country_id
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                  >
                    <option value="">{t("dashboard.notifications.broadcast.selectCountry")}</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {isRTL ? country.name_ar : country.name_en}
                      </option>
                    ))}
                  </select>
                  {formErrors.country_id && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.country_id}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.broadcast.title")} *
                  </label>
                  <input
                    type="text"
                    value={broadcastFormData.title}
                    onChange={(e) => setBroadcastFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.title
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.notifications.broadcast.titlePlaceholder")}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.broadcast.message")} *
                  </label>
                  <textarea
                    value={broadcastFormData.message}
                    onChange={(e) => setBroadcastFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.message
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.notifications.broadcast.messagePlaceholder")}
                  />
                  {formErrors.message && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.notifications.broadcast.type")}
                  </label>
                  <select
                    value={broadcastFormData.type}
                    onChange={(e) => setBroadcastFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
                  >
                    <option value="info">{t("dashboard.notifications.types.info")}</option>
                    <option value="warning">{t("dashboard.notifications.types.warning")}</option>
                    <option value="success">{t("dashboard.notifications.types.success")}</option>
                    <option value="error">{t("dashboard.notifications.types.error")}</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                >
                  {t("dashboard.notifications.actions.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submitting
                    ? t("dashboard.notifications.broadcast.sending")
                    : t("dashboard.notifications.broadcast.broadcast")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

