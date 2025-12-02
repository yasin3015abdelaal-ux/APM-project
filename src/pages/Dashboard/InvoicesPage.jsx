import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const statusStyles = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const ITEMS_PER_PAGE = 8;

const InvoicesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get("/invoice-requests");
      setInvoices(res.data?.data || []);
    } catch (err) {
      console.error(err);
      showToast(
        isRTL ? "فشل في تحميل الفواتير" : "Failed to load invoices",
        "error"
      );
    }
    setLoading(false);
  };

  const handleViewDetails = (invoiceId) => {
    navigate(`/dashboard/invoice/${invoiceId}`);
  };

  const handleExport = () => {
    try {
      const exportData = invoices.map((invoice) => ({
        [isRTL ? "رقم الطلب" : "Request Number"]: invoice.request_number || "-",
        [isRTL ? "اسم العميل" : "Customer Name"]: invoice.user?.name || "-",
        [isRTL ? "البريد الإلكتروني" : "Email"]: invoice.email || invoice.user?.email || "-",
        [isRTL ? "رقم الهاتف" : "Phone"]: invoice.user?.phone || "-",
        [isRTL ? "المبلغ الإجمالي" : "Total Amount"]: invoice.total_amount || "-",
        [isRTL ? "الحالة" : "Status"]: invoice.status || "-",
        [isRTL ? "التاريخ" : "Date"]: new Date(invoice.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US"),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isRTL ? "الفواتير" : "Invoices");

      const date = new Date().toISOString().split("T")[0];
      const fileName = `${isRTL ? "الفواتير" : "Invoices"}_${date}.xlsx`;

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

  const getStatusLabel = (status) => {
    const labels = {
      paid: { ar: "مدفوع", en: "Paid" },
      pending: { ar: "قيد الانتظار", en: "Pending" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
    };
    return isRTL ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  // Frontend Pagination
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return invoices.slice(startIndex, endIndex);
  }, [invoices, currentPage]);

  if (loading && !invoices.length) {
    return <Loader />;
  }

  return (
    <section className="space-y-4 sm:space-y-6 p-4 sm:p-6 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
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
          disabled={invoices.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <svg className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isRTL ? "تصدير Excel" : "Export Excel"}
        </button>
        <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
          {isRTL ? "طلبات الفواتير" : "Invoice Requests"}
        </h1>
      </header>

      {/* Table Container with Horizontal Scroll */}
      <div className="w-full rounded-xl border border-emerald-300 bg-white shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #f3f4f6' }}>
          <table className="text-xs sm:text-sm border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
            <thead className="bg-emerald-500 text-white">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '120px', width: 'fit-content' }}>
                  {isRTL ? "رقم الطلب" : "Request #"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '150px', width: 'fit-content' }}>
                  {isRTL ? "اسم العميل" : "Customer"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '200px', width: 'fit-content' }}>
                  {isRTL ? "البريد الإلكتروني" : "Email"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '130px', width: 'fit-content' }}>
                  {isRTL ? "رقم الهاتف" : "Phone"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '140px', width: 'fit-content' }}>
                  {isRTL ? "المبلغ الإجمالي" : "Total Amount"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '100px', width: 'fit-content' }}>
                  {isRTL ? "عدد الباقات" : "Items"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '130px', width: 'fit-content' }}>
                  {isRTL ? "التاريخ" : "Date"}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-medium" style={{ minWidth: '120px', width: 'fit-content' }}>
                  {isRTL ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {isRTL ? "لا توجد فواتير" : "No invoices found"}
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => handleViewDetails(invoice.id)}
                    className="border-t border-emerald-100 text-center text-slate-800 transition hover:bg-emerald-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-bold text-emerald-600" style={{ minWidth: '120px', width: 'fit-content' }}>
                      {invoice.request_number}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ minWidth: '150px', width: 'fit-content' }}>
                      {invoice.user?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600" style={{ minWidth: '200px', width: 'fit-content' }}>
                      {invoice.email || invoice.user?.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600" style={{ minWidth: '130px', width: 'fit-content' }}>
                      <span className="direction-ltr inline-block">{invoice.user?.phone || "-"}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700" style={{ minWidth: '140px', width: 'fit-content' }}>
                      {Number(invoice.total_amount).toLocaleString()} {isRTL ? "ج.م" : "EGP"}
                    </td>
                    <td className="px-4 py-3" style={{ minWidth: '100px', width: 'fit-content' }}>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {invoice.items?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap" style={{ minWidth: '130px', width: 'fit-content' }}>
                      {new Date(invoice.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                    </td>
                    <td className="px-4 py-3" style={{ minWidth: '120px', width: 'fit-content' }}>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 ">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
            {/* {isRTL ? "السابق" : "Previous"} */}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                    currentPage === pageNum
                      ? "bg-emerald-500 text-white"
                      : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* {isRTL ? "التالي" : "Next"} */}
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
                d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default InvoicesPage;