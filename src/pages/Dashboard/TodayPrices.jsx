import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const categories = [
  { id: "sheep", labelKey: "dashboard.todayPrices.categories.sheep" },
  { id: "cow", labelKey: "dashboard.todayPrices.categories.cows" },
  { id: "camel", labelKey: "dashboard.todayPrices.categories.camels" },
];

const TodayPrices = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [updatingUsers, setUpdatingUsers] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.get(
          `/livestock-prices?product_type=${selectedCategory}&page=${currentPage}&per_page=8`,
          {
            signal: controller.signal,
          }
        );

        const data = response.data?.data || [];
        setRecords(Array.isArray(data) ? data : []);
        setPagination(response.data?.pagination || null);
      } catch (err) {
        if (err.name === "CanceledError") return;
        console.error("Error loading livestock prices:", err);
        setError(t("dashboard.todayPrices.errors.fetch"));
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    return () => controller.abort();
  }, [selectedCategory, currentPage, t]);

  const handleToggleVerification = async (userId, currentStatus) => {
    if (!userId) return;

    setUpdatingUsers((prev) => new Set(prev).add(userId));

    try {
      await adminAPI.put(`/users/${userId}/update-verification-status`, {
        verified_account: currentStatus ? 0 : 1,
      });

      // Update local state
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.user?.id === userId
            ? {
                ...record,
                user: {
                  ...record.user,
                  verified_account: currentStatus ? 0 : 1,
                },
              }
            : record
        )
      );

      showToast(
        i18n.language === "ar"
          ? currentStatus
            ? "تم تعطيل إدخال الأسعار"
            : "تم تفعيل إدخال الأسعار"
          : currentStatus
          ? "Price entry disabled"
          : "Price entry enabled",
        "success"
      );
    } catch (err) {
      console.error("Error updating verification status:", err);
      showToast(
        i18n.language === "ar"
          ? "فشل في تحديث الحالة"
          : "Failed to update status",
        "error"
      );
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleExport = () => {
    const dataForExport = records.map((record) => ({
      [t("dashboard.todayPrices.table.accountNumber")]: record.user?.id
        ? `APM${String(record.user.id).padStart(8, "0")}`
        : "-",
      [t("dashboard.todayPrices.table.predictionDate")]:
        record.submitted_at || "-",
      [t("dashboard.todayPrices.table.name")]: record.user?.name || "-",
      [t("dashboard.todayPrices.table.accountType")]:
        i18n.language === "ar"
          ? record.governorate?.name_ar || "-"
          : record.governorate?.name_en || "-",
      [t("dashboard.todayPrices.table.expected")]: record.net_price || 0,
      [t("dashboard.todayPrices.table.current")]: record.standing_price || 0,
      [i18n.language === "ar" ? "حالة إدخال الأسعار" : "Price Entry Status"]:
        record.user?.verified_account
          ? i18n.language === "ar"
            ? "مفعل"
            : "Enabled"
          : i18n.language === "ar"
          ? "معطل"
          : "Disabled",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "today-prices");
    XLSX.writeFile(workbook, `today-prices-${selectedCategory}.xlsx`);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-3 text-center">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <button
          onClick={() => setSelectedCategory((prev) => prev)}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
        >
          {t("common.retry")}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 ${
            i18n.language === "ar" ? "left-4" : "right-4"
          } z-50 animate-slide-in`}
        >
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">
            {t("dashboard.todayPrices.sectionLabel")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("dashboard.todayPrices.title")}
          </h1>
          <p className="text-xs text-slate-400">
            {t("dashboard.todayPrices.count", { count: records.length })}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={records.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {t("dashboard.todayPrices.export")}
        </button>
      </header>

      <div className="flex flex-wrap gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-emerald-700"
          >
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedCategory === category.id}
              onChange={() => {
                setSelectedCategory(category.id);
                setCurrentPage(1);
              }}
              className="h-4 w-4 border-emerald-400 text-emerald-500 focus:ring-emerald-500"
            />
            {t(category.labelKey)}
          </label>
        ))}
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-emerald-50 text-emerald-700">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.accountNumber")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.predictionDate")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.name")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.accountType")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.netPrice")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.standingPrice")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-medium">
                {i18n.language === "ar" ? "إدخال الأسعار" : "Price Entry"}
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {t("dashboard.todayPrices.empty")}
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr
                  key={record.id || index}
                  className="border-t border-emerald-50 text-right text-slate-700"
                >
                  <td className="whitespace-nowrap px-4 py-4 font-medium">
                    {record.user?.id
                      ? `APM${String(record.user.id).padStart(8, "0")}`
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.submitted_at
                      ? new Date(record.submitted_at).toLocaleDateString(
                          i18n.language === "ar" ? "ar-EG" : "en-US"
                        )
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.user?.name || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {i18n.language === "ar"
                      ? record.governorate?.name_ar || "-"
                      : record.governorate?.name_en || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.net_price
                      ? parseFloat(record.net_price).toFixed(2)
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.standing_price
                      ? parseFloat(record.standing_price).toFixed(2)
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-center">
                    <button
                      onClick={() =>
                        handleToggleVerification(
                          record.user?.id,
                          record.user?.verified_account
                        )
                      }
                      disabled={
                        !record.user?.id ||
                        updatingUsers.has(record.user?.id)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        record.user?.verified_account
                          ? "bg-emerald-500 shadow-sm"
                          : "bg-gray-300"
                      }`}
                      title={
                        i18n.language === "ar"
                          ? record.user?.verified_account
                            ? "اضغط لتعطيل إدخال الأسعار"
                            : "اضغط لتفعيل إدخال الأسعار"
                          : record.user?.verified_account
                          ? "Click to disable price entry"
                          : "Click to enable price entry"
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                          record.user?.verified_account
                            ? i18n.language === "ar"
                              ? "-translate-x-6"
                              : "translate-x-6"
                            : i18n.language === "ar"
                            ? "-translate-x-1"
                            : "translate-x-1"
                        } ${updatingUsers.has(record.user?.id) ? "opacity-0" : "opacity-100"}`}
                      />
                      {updatingUsers.has(record.user?.id) && (
                        <svg
                          className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
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
                d={i18n.language === "ar" ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
              let pageNum;
              if (pagination.last_page <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.last_page - 2) {
                pageNum = pagination.last_page - 4 + i;
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
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(pagination.last_page, prev + 1)
              )
            }
            disabled={currentPage === pagination.last_page}
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
                d={i18n.language === "ar" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default TodayPrices;