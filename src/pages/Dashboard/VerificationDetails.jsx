import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const VerificationDetails = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchVerification = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.get(`/verifications/${id}`);
        const data =
          response.data?.data ||
          response.data?.verification ||
          response.data ||
          null;
        setVerification(data);
      } catch (err) {
        console.error("Error fetching verification:", err);
        setError(t("dashboard.verifications.errors.fetchOne"));
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id, t]);

  const user = verification?.user || {};
  const attachments = verification?.attachments || verification || {};

  const handleOpenFile = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await adminAPI.post(`/verifications/${id}/approve`);
      alert(t("dashboard.verifications.messages.approved"));
      navigate("/dashboard/verification");
    } catch (err) {
      console.error("Error approving verification:", err);
      alert(t("dashboard.verifications.errors.approve"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      return;
    }
    try {
      setActionLoading(true);
      await adminAPI.post(`/verifications/${id}/reject`, {
        rejection_reason: rejectionReason,
      });
      alert(t("dashboard.verifications.messages.rejected"));
      setShowRejectModal(false);
      navigate("/dashboard/verification");
    } catch (err) {
      console.error("Error rejecting verification:", err);
      alert(t("dashboard.verifications.errors.reject"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !verification) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">
          {error || t("dashboard.verifications.errors.notFound")}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-500">
            {t("dashboard.verifications.sectionLabel")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("dashboard.verifications.detailsTitle")}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              navigate(`/dashboard/accounts/update-account/${user.id}`)
            }
            className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
          >
            {t("dashboard.verifications.viewProfile")}
          </button>
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
          >
            {t("dashboard.verifications.actions.approve")}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
            className="rounded-md bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60"
          >
            {t("dashboard.verifications.actions.reject")}
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-emerald-100">
            {user.avatar || user.image ? (
              <img
                src={user.avatar || user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-3xl font-bold text-emerald-500">
                {user.name?.charAt(0) || "A"}
              </div>
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {user.name || "-"}
          </h2>
          <p className="text-sm text-slate-500">{user.country ?? ""}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.email")}
              </p>
              <p className="font-semibold text-slate-800">
                {user.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.phone")}
              </p>
              <p className="font-semibold text-slate-800">
                {user.phone || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.accountType")}
              </p>
              <p className="font-semibold text-slate-800">
                {user.account_type || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.submittedAt")}
              </p>
              <p className="font-semibold text-slate-800">
                {verification.created_at
                  ? new Date(verification.created_at).toLocaleString(
                      i18n.language === "ar" ? "ar-EG" : "en-US"
                    )
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <button
              onClick={() => handleOpenFile(attachments.front_image)}
              className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
            >
              {t("dashboard.verifications.attachments.front")}
            </button>
            <button
              onClick={() => handleOpenFile(attachments.back_image)}
              className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
            >
              {t("dashboard.verifications.attachments.back")}
            </button>
            <button
              onClick={() => handleOpenFile(attachments.selfie_image)}
              className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
            >
              {t("dashboard.verifications.attachments.selfie")}
            </button>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-emerald-700">
              {t("dashboard.verifications.rejectModal.title")}
            </h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("dashboard.verifications.rejectModal.placeholder")}
              className="h-32 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.verifications.rejectModal.cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {actionLoading
                  ? t("dashboard.verifications.rejectModal.sending")
                  : t("dashboard.verifications.rejectModal.submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VerificationDetails;

