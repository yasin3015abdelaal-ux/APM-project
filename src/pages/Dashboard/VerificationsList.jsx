import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const STATUS_TABS = ["pending", "approved", "rejected"];

const normalizeVerifications = (records) => {
  if (!Array.isArray(records)) return [];

  return records.map((item) => {
    const user = item.user || {};

    return {
      id: item.id,
      accountNumber: user.id || "-",
      name: user.name || "-",
      phone: user.phone || "-",
      createdAt: item.submitted_at || "",
      type: user.type || "-",
      email: user.email || "-",
      status: item.status || "pending",
    };
  });
};

const VerificationsList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchVerifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          status,
          search: debouncedSearch,
          per_page: "15",
        });

        const response = await adminAPI.get(`/verifications?${params.toString()}`, {
          signal: controller.signal,
        });

        const data = response.data?.data || [];
        setVerifications(normalizeVerifications(data));
      } catch (err) {
        if (err.name === "CanceledError") return;
        console.error("Error loading verifications:", err);
        setError(t("dashboard.verifications.errors.fetch"));
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();

    return () => controller.abort();
  }, [status, debouncedSearch, t]);

  if (loading && !verifications.length) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-3 text-center">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <button
          onClick={() => setStatus((prev) => prev)}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
        >
          {t("common.retry")}
        </button>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">
            {t("dashboard.verifications.sectionLabel")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("dashboard.verifications.title")}
          </h1>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("dashboard.verifications.searchPlaceholder")}
          className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 md:max-w-sm"
        />
      </header>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              status === tab
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {t(`dashboard.verifications.status.${tab}`)}
          </button>
        ))}
      </div>

      {loading && verifications.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-emerald-50 text-emerald-700">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.accountNumber")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.submittedAt")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.name")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.phone")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.accountType")}
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.email")}
              </th>
            </tr>
          </thead>
          <tbody>
            {verifications.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {t("dashboard.verifications.empty")}
                </td>
              </tr>
            ) : (
              verifications.map((verification) => (
                <tr
                  key={verification.id}
                  onClick={() =>
                    navigate(`/dashboard/verification/${verification.id}`)
                  }
                  className="cursor-pointer border-t border-emerald-50 text-right text-slate-700 transition hover:bg-emerald-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {verification.accountNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {verification.createdAt
                      ? new Date(verification.createdAt).toLocaleDateString(
                          i18n.language === "ar" ? "ar-EG" : "en-US"
                        )
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{verification.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{verification.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3">{verification.type}</td>
                  <td className="whitespace-nowrap px-4 py-3">{verification.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default VerificationsList;