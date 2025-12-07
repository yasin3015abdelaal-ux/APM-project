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
    const profile = user.profile || {};

    return {
      id: item.id || item.verification_id,
      accountNumber: user.account_number || user.id || "-",
      name: user.name || profile.full_name || "-",
      phone: user.phone || profile.phone || "-",
      createdAt: item.created_at || user.created_at || "",
      type: item.account_type || user.account_type || profile.account_type || "-",
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
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchVerifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          status,
          search,
          per_page: "15",
        });

        const response = await adminAPI.get(`/verifications?${params.toString()}`, {
          signal: controller.signal,
        });

        let data = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response.data?.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data?.data?.verifications)) {
          data = response.data.data.verifications;
        }

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
  }, [status, search, t]);

  if (loading) {
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
    <section className="space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
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

      <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-700">
            <tr>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.accountNumber")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.submittedAt")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.name")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.phone")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
                {t("dashboard.verifications.table.accountType")}
              </th>
              <th className="px-4 py-3 text-right font-medium">
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
                  <td className="px-4 py-3 font-medium">
                    {verification.accountNumber}
                  </td>
                  <td className="px-4 py-3">
                    {verification.createdAt
                      ? new Date(verification.createdAt).toLocaleDateString(
                          i18n.language === "ar" ? "ar-EG" : "en-US"
                        )
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{verification.name}</td>
                  <td className="px-4 py-3">{verification.phone}</td>
                  <td className="px-4 py-3">{verification.type}</td>
                  <td className="px-4 py-3">{verification.email}</td>
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

