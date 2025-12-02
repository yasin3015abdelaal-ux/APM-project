import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const Toast = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
      <div
        className={`rounded-lg px-6 py-3 shadow-lg ${
          type === "success"
            ? "bg-emerald-500 text-white"
            : "bg-rose-500 text-white"
        }`}
      >
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
};

const AdvertisementsPage = () => {
  const { t, i18n } = useTranslation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSection, setTargetSection] = useState("hero");
  const [formFile, setFormFile] = useState(null);
  const [formOrder, setFormOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.get("/advertisements");
      const data = response.data?.data ?? response.data ?? [];
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching advertisements:", err);
      setError(t("dashboard.advertisements.errors.fetch"));
    } finally {
      setLoading(false);
    }
  };

  const heroAds = useMemo(
    () =>
      ads.filter((ad) => {
        const order = Number(ad.order) || 0;
        return order <= 1;
      }),
    [ads]
  );

  const sliderAds = useMemo(
    () =>
      ads.filter((ad) => {
        const order = Number(ad.order) || 0;
        return order > 1;
      }),
    [ads]
  );

  const computeNextOrder = (section) => {
    if (section === "hero") {
      return 1;
    }
    const maxOrder = ads.reduce(
      (max, ad) => Math.max(max, Number(ad.order) || 0),
      1
    );
    return Math.max(2, maxOrder + 1);
  };

  const openModal = (section) => {
    const currentAds = section === "hero" ? heroAds : sliderAds;
    const maxImages = 3;
    
    if (currentAds.length >= maxImages) {
      showToast(t("dashboard.advertisements.errors.maxImages") || `Maximum ${maxImages} images allowed`, "error");
      return;
    }
    
    setTargetSection(section);
    setFormFile(null);
    setPreviewUrl(null);
    setFormOrder(computeNextOrder(section));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setFormFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formFile) {
      showToast(t("dashboard.advertisements.errors.fileRequired") || "Please select an image", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", formFile);
    formData.append("order", formOrder);

    try {
      setSubmitting(true);
      await adminAPI.post("/advertisements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      closeModal();
      await fetchAdvertisements();
      showToast(t("dashboard.advertisements.messages.created") || "Advertisement created successfully", "success");
    } catch (err) {
      console.error("Error uploading advertisement:", err);
      showToast(t("dashboard.advertisements.errors.upload") || "Failed to upload advertisement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adId) => {
    setDeleteConfirm(adId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await adminAPI.delete(`/advertisements/${deleteConfirm}`);
      await fetchAdvertisements();
      showToast(t("dashboard.advertisements.messages.deleted") || "Advertisement deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting advertisement:", err);
      showToast(t("dashboard.advertisements.errors.delete") || "Failed to delete advertisement", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <button
          onClick={fetchAdvertisements}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
        >
          {t("common.retry")}
        </button>
      </section>
    );
  }

  const renderGallery = (list, emptyMessage) => (
    <div className="flex flex-wrap items-center gap-4">
      {list.length === 0 && (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}
      {list.map((ad) => (
        <div
          key={ad.id}
          className="relative h-32 w-32 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition hover:shadow-md"
        >
          <img
            src={ad.image_url}
            alt={`advertisement-${ad.id}`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => handleDelete(ad.id)}
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600"
          >
            ×
          </button>
          <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            #{ad.order ?? "-"}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <section
        className="space-y-8"
        dir={i18n.language === "ar" ? "rtl" : "ltr"}
      >
        <header>
          <h1 className="text-2xl font-semibold text-emerald-700">
            {t("dashboard.advertisements.pageTitle")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("dashboard.advertisements.subtitle")}
          </p>
        </header>

        <div className="space-y-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">
                {t("dashboard.advertisements.heroTitle")}
              </h2>
              <p className="text-xs text-slate-500">
                {heroAds.length}/3 {t("dashboard.advertisements.imagesCount") || "images"}
              </p>
            </div>
            <button
              onClick={() => openModal("hero")}
              disabled={heroAds.length >= 3}
              className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("dashboard.advertisements.actions.addHero")}
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-100 p-4">
            {renderGallery(
              heroAds,
              t("dashboard.advertisements.emptyHeroSection")
            )}
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">
                {t("dashboard.advertisements.sliderTitle")}
              </h2>
              <p className="text-xs text-slate-500">
                {sliderAds.length}/3 {t("dashboard.advertisements.imagesCount") || "images"}
              </p>
            </div>
            <button
              onClick={() => openModal("slider")}
              disabled={sliderAds.length >= 3}
              className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("dashboard.advertisements.actions.addSlider")}
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-100 p-4">
            {renderGallery(
              sliderAds,
              t("dashboard.advertisements.emptySliderSection")
            )}
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md space-y-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-emerald-700">
                {t("dashboard.advertisements.modal.title")}
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {t("dashboard.advertisements.modal.imageLabel")}
                </label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-6 py-8 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                    ) : (
                      <>
                        <svg
                          className="mb-2 h-10 w-10 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <p className="text-sm font-medium text-emerald-600">
                          {t("dashboard.advertisements.modal.uploadText") || "Click to upload image"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          PNG, JPG up to 10MB
                        </p>
                      </>
                    )}
                  </label>
                  {formFile && (
                    <p className="mt-2 text-xs text-slate-600">
                      {formFile.name}
                    </p>
                  )}
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                {t("dashboard.advertisements.modal.orderLabel")}
                <input
                  type="number"
                  min={1}
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value) || 1)}
                  className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("dashboard.advertisements.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? t("dashboard.advertisements.modal.saving")
                    : t("dashboard.advertisements.modal.save")}
                </button>
              </div>
            </form>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                  <svg
                    className="h-6 w-6 text-rose-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {t("dashboard.advertisements.deleteModal.title") || "Delete Advertisement"}
                </h3>
              </div>
              
              <p className="text-sm text-slate-600">
                {t("dashboard.advertisements.deleteModal.message") || "Are you sure you want to delete this advertisement? This action cannot be undone."}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {t("dashboard.advertisements.deleteModal.cancel") || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  {t("dashboard.advertisements.deleteModal.confirm") || "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default AdvertisementsPage;