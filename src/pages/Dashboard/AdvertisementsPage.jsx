import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

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
    setTargetSection(section);
    setFormFile(null);
    setFormOrder(computeNextOrder(section));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setFormFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formFile) {
      alert(t("dashboard.advertisements.errors.fileRequired"));
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
      alert(t("dashboard.advertisements.messages.created"));
    } catch (err) {
      console.error("Error uploading advertisement:", err);
      alert(t("dashboard.advertisements.errors.upload"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adId) => {
    const confirmed = window.confirm(
      t("dashboard.advertisements.actions.confirmDelete")
    );
    if (!confirmed) return;

    try {
      await adminAPI.delete(`/advertisements/${adId}`);
      await fetchAdvertisements();
      alert(t("dashboard.advertisements.messages.deleted"));
    } catch (err) {
      console.error("Error deleting advertisement:", err);
      alert(t("dashboard.advertisements.errors.delete"));
    }
  };

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
          className="relative h-24 w-24 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm"
        >
          <img
            src={ad.image_url}
            alt={`advertisement-${ad.id}`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => handleDelete(ad.id)}
            className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-600"
          >
            ×
          </button>
          <span className="absolute bottom-1 right-2 rounded-full bg-white/70 px-2 text-xs font-semibold text-emerald-700">
            #{ad.order ?? "-"}
          </span>
        </div>
      ))}
    </div>
  );

  return (
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
          <h2 className="text-lg font-semibold text-emerald-700">
            {t("dashboard.advertisements.heroTitle")}
          </h2>
          <button
            onClick={() => openModal("hero")}
            className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
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
          <h2 className="text-lg font-semibold text-emerald-700">
            {t("dashboard.advertisements.sliderTitle")}
          </h2>
          <button
            onClick={() => openModal("slider")}
            className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
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
            className="w-full max-w-md space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-emerald-700">
              {t("dashboard.advertisements.modal.title")}
            </h3>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.advertisements.modal.imageLabel")}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.advertisements.modal.orderLabel")}
              <input
                type="number"
                min={1}
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value) || 1)}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.advertisements.modal.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {submitting
                  ? t("dashboard.advertisements.modal.saving")
                  : t("dashboard.advertisements.modal.save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default AdvertisementsPage;

