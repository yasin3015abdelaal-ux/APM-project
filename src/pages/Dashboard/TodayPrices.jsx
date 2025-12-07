import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";

const dummyRecords = [
  {
    accountNumber: "APM00000001",
    name: "محمد مصطفى",
    accountType: "فردي",
    predictionDate: "2025-12-15",
    expectedPrice: 512,
    currentPrice: 600,
    category: "sheep",
  },
  {
    accountNumber: "APM00000012",
    name: "سالم الدوسري",
    accountType: "تاجر",
    predictionDate: "2025-12-11",
    expectedPrice: 1250,
    currentPrice: 1320,
    category: "cows",
  },
  {
    accountNumber: "APM00000022",
    name: "ليلى علي",
    accountType: "فردي",
    predictionDate: "2025-12-10",
    expectedPrice: 980,
    currentPrice: 950,
    category: "camels",
  },
];

const categories = [
  { id: "sheep", labelKey: "dashboard.todayPrices.categories.sheep" },
  { id: "cows", labelKey: "dashboard.todayPrices.categories.cows" },
  { id: "camels", labelKey: "dashboard.todayPrices.categories.camels" },
];

const TodayPrices = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);

  const filteredRecords = useMemo(
    () => dummyRecords.filter((record) => record.category === selectedCategory),
    [selectedCategory]
  );

  const handleExport = () => {
    const dataForExport = filteredRecords.map((record) => ({
      [t("dashboard.todayPrices.table.accountNumber")]: record.accountNumber,
      [t("dashboard.todayPrices.table.predictionDate")]: record.predictionDate,
      [t("dashboard.todayPrices.table.name")]: record.name,
      [t("dashboard.todayPrices.table.accountType")]: record.accountType,
      [t("dashboard.todayPrices.table.expected")]: record.expectedPrice,
      [t("dashboard.todayPrices.table.current")]: record.currentPrice,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "today-prices");
    XLSX.writeFile(workbook, "today-prices.xlsx");
  };

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
            {t("dashboard.todayPrices.count", { count: filteredRecords.length })}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          {t("dashboard.todayPrices.export")}
        </button>
      </header>

      <div className="flex flex-wrap gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        {categories.map((category) => (
          <label
            key={category.id}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700"
          >
            <input
              type="radio"
              name="category"
              value={category.id}
              checked={selectedCategory === category.id}
              onChange={() => setSelectedCategory(category.id)}
              className="h-4 w-4 border-emerald-400 text-emerald-500 focus:ring-emerald-500"
            />
            {t(category.labelKey)}
          </label>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-700">
            <tr>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.accountNumber")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.predictionDate")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.name")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.accountType")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.expected")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.todayPrices.table.current")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {t("dashboard.todayPrices.empty")}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr
                  key={record.accountNumber}
                  className="border-t border-emerald-50 text-right text-slate-700"
                >
                  <td className="px-4 py-4 font-medium">
                    {record.accountNumber}
                  </td>
                  <td className="px-4 py-4">
                    {new Date(record.predictionDate).toLocaleDateString(
                      i18n.language === "ar" ? "ar-EG" : "en-US"
                    )}
                  </td>
                  <td className="px-4 py-4">{record.name}</td>
                  <td className="px-4 py-4">{record.accountType}</td>
                  <td className="px-4 py-4">{record.expectedPrice}</td>
                  <td className="px-4 py-4">{record.currentPrice}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default TodayPrices;

