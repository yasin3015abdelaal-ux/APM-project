import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ReportsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchStatistics();
    fetchReports();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await adminAPI.get("/contact-messages/statistics");
      setStatistics(res.data?.data || null);
    } catch (err) {
      console.error(err);
      showToast(
        isRTL ? "فشل في تحميل الإحصائيات" : "Failed to load statistics",
        "error"
      );
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get("/contact-messages");
      setReports(res.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast(
        isRTL ? "فشل في تحميل البلاغات" : "Failed to load reports",
        "error"
      );
    }
    setLoading(false);
  };

  const fetchReportDetails = async (id) => {
    setLoading(true);
    try {
      const res = await adminAPI.get(`/contact-messages/${id}`);
      setSelectedReport(res.data?.data || null);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      showToast(
        isRTL ? "فشل في تحميل تفاصيل البلاغ" : "Failed to load report details",
        "error"
      );
    }
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const getTypeLabel = (type) => {
    const typeLabels = {
      suggestion: { ar: "اقتراح", en: "Suggestion" },
      complaint: { ar: "شكوى", en: "Complaint" },
      subscription_issue: { ar: "مشكلة في الاشتراكات", en: "Subscription Issue" },
      other: { ar: "سبب آخر", en: "Other" },
    };
    return isRTL ? typeLabels[type]?.ar || type : typeLabels[type]?.en || type;
  };

  const filterCounts = useMemo(() => {
    if (!statistics) return { all: 0, suggestion: 0, complaint: 0, subscription_issue: 0, other: 0 };
    
    return {
      all: statistics.total || 0,
      suggestion: statistics.by_type?.suggestion || 0,
      complaint: statistics.by_type?.complaint || 0,
      subscription_issue: statistics.by_type?.subscription_issue || 0,
      other: statistics.by_type?.other || 0,
    };
  }, [statistics]);

  const filteredReports = useMemo(() => {
    if (selectedFilter === "all") return reports;
    return reports.filter((r) => r.type === selectedFilter);
  }, [selectedFilter, reports]);

  const handleExport = () => {
    try {
      const exportData = filteredReports.map((report) => ({
        [isRTL ? "رقم البلاغ" : "Report Number"]: report.id || "-",
        [isRTL ? "نوع البلاغ" : "Report Type"]: getTypeLabel(report.type),
        [isRTL ? "تاريخ الإرسال" : "Submission Date"]: new Date(report.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US"),
        [isRTL ? "اسم المُبلغ" : "Reporter Name"]: report.user?.name || "-",
        [isRTL ? "البريد الإلكتروني" : "Email"]: report.user?.email || "-",
        [isRTL ? "رقم الهاتف" : "Phone Number"]: report.user?.phone || "-",
        [isRTL ? "الرسالة" : "Message"]: report.message || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 40 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isRTL ? "البلاغات" : "Reports");

      const date = new Date().toISOString().split("T")[0];
      const fileName = `${isRTL ? "البلاغات" : "Reports"}_${date}.xlsx`;

      XLSX.writeFile(wb, fileName);
      showToast(isRTL ? "تم التصدير بنجاح" : "Exported successfully", "success");
    } catch (err) {
      console.error("Error exporting:", err);
      showToast(
        isRTL ? "فشل في تصدير البيانات" : "Failed to export data",
        "error"
      );
    }
  };

  const getFilterLabel = (key) => {
    const labels = {
      all: isRTL ? "الكل" : "All",
      suggestion: isRTL ? "اقتراح" : "Suggestion",
      complaint: isRTL ? "شكوى" : "Complaint",
      subscription_issue: isRTL ? "مشكلة في الاشتراكات" : "Subscription Issue",
      other: isRTL ? "سبب آخر" : "Other",
    };
    return labels[key] || key;
  };

  if (loading && !reports.length) {
    return <Loader />;
  }

  return (
    <section className="space-y-4 sm:space-y-6 p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in w-[calc(100%-2rem)] sm:w-auto sm:max-w-md`}>
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold text-sm break-words">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
        <button
          onClick={handleExport}
          disabled={filteredReports.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <svg className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isRTL ? "تصدير Excel" : "Export Excel"}
        </button>
        <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
          {isRTL ? "البلاغات والرسائل" : "Reports & Messages"}
        </h1>
      </header>

      {/* Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {["all", "suggestion", "complaint", "subscription_issue", "other"].map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`rounded-lg sm:rounded-xl border-2 px-2 sm:px-4 py-2 sm:py-3 text-center transition ${
              selectedFilter === filter
                ? "border-emerald-500 bg-emerald-50"
                : "border-emerald-200 bg-white hover:bg-emerald-50"
            }`}
          >
            <p className="text-xs sm:text-sm font-medium text-emerald-700 truncate">
              {getFilterLabel(filter)}
            </p>
            <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold text-emerald-600">
              {filterCounts[filter]}
            </p>
          </button>
        ))}
      </div>

      {/* Table Container with Internal Scroll */}
      <div className="rounded-xl border border-emerald-300 bg-white shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-350px)]">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-emerald-500 text-white sticky top-0 z-10">
              <tr>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">
                  {isRTL ? "رقم" : "#"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">
                  {isRTL ? "النوع" : "Type"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden sm:table-cell">
                  {isRTL ? "المُبلغ" : "Reporter"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden md:table-cell">
                  {isRTL ? "البريد" : "Email"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden lg:table-cell">
                  {isRTL ? "الهاتف" : "Phone"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium hidden xl:table-cell">
                  {isRTL ? "التاريخ" : "Date"}
                </th>
                <th className="whitespace-nowrap px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">
                  {isRTL ? "عرض" : "View"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {isRTL ? "لا توجد بلاغات" : "No reports found"}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-emerald-100 text-center text-slate-800 transition hover:bg-emerald-50"
                  >
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-emerald-600">
                      #{report.id}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 py-1 inline-flex text-[10px] sm:text-xs leading-4 sm:leading-5 font-semibold rounded-full ${
                        report.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                        report.type === 'complaint' ? 'bg-red-100 text-red-800' :
                        report.type === 'subscription_issue' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <span className="hidden sm:inline">{getTypeLabel(report.type)}</span>
                        <span className="sm:hidden">
                          {report.type === 'suggestion' ? (isRTL ? 'اقتراح' : 'Sug') :
                           report.type === 'complaint' ? (isRTL ? 'شكوى' : 'Comp') :
                           report.type === 'subscription_issue' ? (isRTL ? 'اشتراك' : 'Sub') :
                           (isRTL ? 'آخر' : 'Other')}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium hidden sm:table-cell max-w-[150px] truncate">
                      {report.user?.name || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden md:table-cell max-w-[180px] truncate">
                      {report.user?.email || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden lg:table-cell">
                      <span className="direction-ltr inline-block">{report.user?.phone || "-"}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden xl:table-cell whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <button
                        onClick={() => fetchReportDetails(report.id)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium transition inline-flex items-center gap-1 text-xs sm:text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden sm:inline">{isRTL ? "عرض" : "View"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-emerald-50 sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-emerald-700">
                  {isRTL ? "تفاصيل البلاغ" : "Report Details"}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-600 mt-1">
                  {isRTL ? "رقم البلاغ" : "Report"} #{selectedReport.id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Type Badge */}
              <div className="flex items-center justify-center">
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 inline-flex text-xs sm:text-sm font-semibold rounded-full ${
                  selectedReport.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                  selectedReport.type === 'complaint' ? 'bg-red-100 text-red-800' :
                  selectedReport.type === 'subscription_issue' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getTypeLabel(selectedReport.type)}
                </span>
              </div>

              {/* Personal Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-700 mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {isRTL ? "معلومات المُبلغ" : "Reporter Information"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "الاسم" : "Name"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-lg break-words">{selectedReport.user?.name || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "البريد الإلكتروني" : "Email"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-lg break-all">{selectedReport.user?.email || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "رقم الهاتف" : "Phone"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-lg direction-ltr">{selectedReport.user?.phone || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "تاريخ الإرسال" : "Submission Date"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-lg">
                      {new Date(selectedReport.created_at).toLocaleString(isRTL ? "ar-EG" : "en-US", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-700 mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {isRTL ? "محتوى الرسالة" : "Message Content"}
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-2 border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm sm:text-base break-words">
                    {selectedReport.message || (isRTL ? "لا توجد رسالة" : "No message available")}
                  </p>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-emerald-700 mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isRTL ? "معلومات إضافية" : "Additional Information"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
                    <label className="block text-xs sm:text-sm font-medium text-emerald-700 mb-1">
                      {isRTL ? "معرف المستخدم" : "User ID"}
                    </label>
                    <p className="text-emerald-900 font-bold text-sm sm:text-lg">#{selectedReport.user_id}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 border border-emerald-200">
                    <label className="block text-xs sm:text-sm font-medium text-emerald-700 mb-1">
                      {isRTL ? "آخر تحديث" : "Last Updated"}
                    </label>
                    <p className="text-emerald-900 font-bold text-sm sm:text-lg">
                      {new Date(selectedReport.updated_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => {
                  console.log("THIS IS THE SELECTED REPORT ::", selectedReport);
                  if (selectedReport?.user.id) {
                    navigate(`/dashboard/messages?user_id=${selectedReport.user_id}`);
                    closeModal();
                  }
                }}
                className="px-4 sm:px-6 py-2 bg-main text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base flex items-center gap-2"
                disabled={!selectedReport?.user.id}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {isRTL ? "رد   ,,,,,," : "Reply"}
              </button>
              <button
                onClick={closeModal}
                className="px-4 sm:px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm sm:text-base"
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportsPage;