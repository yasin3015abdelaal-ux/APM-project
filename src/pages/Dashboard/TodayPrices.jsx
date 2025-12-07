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

  const handleExport = () => {
    const dataForExport = records.map((record) => ({
      [t("dashboard.todayPrices.table.accountNumber")]: record.user?.id ? `APM${String(record.user.id).padStart(8, '0')}` : "-",
      [t("dashboard.todayPrices.table.predictionDate")]: record.submitted_at || "-",
      [t("dashboard.todayPrices.table.name")]: record.user?.name || "-",
      [t("dashboard.todayPrices.table.accountType")]: i18n.language === "ar" 
        ? record.governorate?.name_ar || "-"
        : record.governorate?.name_en || "-",
      [t("dashboard.todayPrices.table.expected")]: record.net_price || 0,
      [t("dashboard.todayPrices.table.current")]: record.standing_price || 0,
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
    <section
      className="space-y-6"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
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
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    {record.user?.id ? `APM${String(record.user.id).padStart(8, '0')}` : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.submitted_at
                      ? new Date(record.submitted_at).toLocaleDateString(
                          i18n.language === "ar" ? "ar-EG" : "en-US"
                        )
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">{record.user?.name || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {i18n.language === "ar" 
                      ? record.governorate?.name_ar || "-"
                      : record.governorate?.name_en || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.net_price ? parseFloat(record.net_price).toFixed(2) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {record.standing_price ? parseFloat(record.standing_price).toFixed(2) : "-"}
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
              setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))
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