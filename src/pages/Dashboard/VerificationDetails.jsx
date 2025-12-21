import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { FaTimes } from "react-icons/fa";

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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: "", title: "" });

  const isRTL = i18n.language === "ar";

  useEffect(() => {
    const fetchVerification = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.get(`/verifications/${id}`);
        const data = response.data?.data || response.data?.verification || response.data || null;
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
  const isIndividual = user.type === "individual";
  const isOrganization = user.type === "organization";

  const handleOpenImage = (url, title) => {
    if (!url) return;
    setSelectedImage({ url, title });
    setShowImageModal(true);
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

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    
    const statusText = {
      pending: isRTL ? "قيد المراجعة" : "Pending",
      approved: isRTL ? "موافق عليه" : "Approved",
      rejected: isRTL ? "مرفوض" : "Rejected",
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusClasses[status] || statusClasses.pending}`}>
        {statusText[status] || status}
      </span>
    );
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
    <section className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
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
            onClick={() => navigate(`/dashboard/accounts/update-account/${user.id}`)}
            className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
          >
            {t("dashboard.verifications.viewProfile") || (isRTL ? "عرض الملف الشخصي" : "View Profile")}
          </button>
          {verification.status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
              >
                {t("dashboard.verifications.actions.approve") || (isRTL ? "موافقة" : "Approve")}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="rounded-md bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60"
              >
                {t("dashboard.verifications.actions.reject") || (isRTL ? "رفض" : "Reject")}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        {/* User Info Card */}
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
          <p className="text-sm text-slate-500 mt-1">
            {user.type === "individual" 
              ? (isRTL ? "حساب فردي" : "Individual")
              : (isRTL ? "منظمة" : "Organization")
            }
          </p>
          <div className="mt-3">
            {getStatusBadge(verification.status)}
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.email") || (isRTL ? "البريد الإلكتروني" : "Email")}
              </p>
              <p className="font-semibold text-slate-800">{user.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.phone") || (isRTL ? "رقم الهاتف" : "Phone")}
              </p>
              <p className="font-semibold text-slate-800">{user.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.accountType") || (isRTL ? "نوع الحساب" : "Account Type")}
              </p>
              <p className="font-semibold text-slate-800">
                {user.type === "individual" 
                  ? (isRTL ? "حساب فردي" : "Individual")
                  : (isRTL ? "منظمة" : "Organization")
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {t("dashboard.verifications.fields.submittedAt") || (isRTL ? "تاريخ التقديم" : "Submitted At")}
              </p>
              <p className="font-semibold text-slate-800">
                {verification.submitted_at
                  ? new Date(verification.submitted_at).toLocaleString(
                      isRTL ? "ar-EG" : "en-US"
                    )
                  : "-"}
              </p>
            </div>
            {verification.reviewed_at && (
              <div>
                <p className="text-sm text-slate-500">
                  {isRTL ? "تاريخ المراجعة" : "Reviewed At"}
                </p>
                <p className="font-semibold text-slate-800">
                  {new Date(verification.reviewed_at).toLocaleString(
                    isRTL ? "ar-EG" : "en-US"
                  )}
                </p>
              </div>
            )}
            {verification.reviewed_by && (
              <div>
                <p className="text-sm text-slate-500">
                  {isRTL ? "تمت المراجعة بواسطة" : "Reviewed By"}
                </p>
                <p className="font-semibold text-slate-800">
                  {verification.reviewed_by.name || "-"}
                </p>
              </div>
            )}
            {verification.rejection_reason && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500">
                  {isRTL ? "سبب الرفض" : "Rejection Reason"}
                </p>
                <p className="font-semibold text-red-600">
                  {verification.rejection_reason}
                </p>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              {isRTL ? "المرفقات" : "Attachments"}
            </h3>
            
            {isIndividual && (
              <div className="grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => handleOpenImage(
                    verification.id_card_front_url,
                    isRTL ? "صورة البطاقة - الأمام" : "ID Card - Front"
                  )}
                  disabled={!verification.id_card_front_url}
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? "البطاقة - الأمام" : "ID Card - Front"}
                </button>
                <button
                  onClick={() => handleOpenImage(
                    verification.id_card_back_url,
                    isRTL ? "صورة البطاقة - الخلف" : "ID Card - Back"
                  )}
                  disabled={!verification.id_card_back_url}
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? "البطاقة - الخلف" : "ID Card - Back"}
                </button>
                <button
                  onClick={() => handleOpenImage(
                    verification.selfie_url,
                    isRTL ? "صورة السيلفي" : "Selfie"
                  )}
                  disabled={!verification.selfie_url}
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? "السيلفي" : "Selfie"}
                </button>
              </div>
            )}

            {isOrganization && (
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => handleOpenImage(
                    verification.commercial_registration_url,
                    isRTL ? "السجل التجاري" : "Commercial Registration"
                  )}
                  disabled={!verification.commercial_registration_url}
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? "السجل التجاري" : "Commercial Registration"}
                </button>
                <button
                  onClick={() => handleOpenImage(
                    verification.tax_number_document_url,
                    isRTL ? "مستند الرقم الضريبي" : "Tax Number Document"
                  )}
                  disabled={!verification.tax_number_document_url}
                  className="rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? "الرقم الضريبي" : "Tax Number"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-emerald-700">
              {t("dashboard.verifications.rejectModal.title") || (isRTL ? "سبب الرفض" : "Rejection Reason")}
            </h2>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("dashboard.verifications.rejectModal.placeholder") || (isRTL ? "اكتب سبب الرفض..." : "Enter rejection reason...")}
              className="h-32 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.verifications.rejectModal.cancel") || (isRTL ? "إلغاء" : "Cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {actionLoading
                  ? (t("dashboard.verifications.rejectModal.sending") || (isRTL ? "جاري الإرسال..." : "Sending..."))
                  : (t("dashboard.verifications.rejectModal.submit") || (isRTL ? "إرسال" : "Submit"))
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 transition"
            >
              <FaTimes size={20} className="text-gray-700" />
            </button>
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <h3 className="text-center text-lg font-semibold text-slate-800 mb-4">
                {selectedImage.title}
              </h3>
              <div className="flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VerificationDetails;