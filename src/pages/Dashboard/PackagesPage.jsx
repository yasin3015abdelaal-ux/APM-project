import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const PackagesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [categories, setCategories] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add | edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    package_category_id: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      fetchPackages(selectedSlug);
    }
  }, [selectedSlug]);

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get("/package-categories");
      const data = normalizeArray(response.data);
      setCategories(data);
      if (data.length && !selectedSlug) {
        setSelectedSlug(data[0].slug);
      }
    } catch (err) {
      console.error("Error fetching package categories:", err);
      setError(t("dashboard.packages.errors.fetchCategories"));
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async (slug) => {
    try {
      setLoading(true);
      const response = await adminAPI.get(`/packages?category_slug=${slug}`);
      setPackages(normalizeArray(response.data));
    } catch (err) {
      console.error("Error fetching packages:", err);
      setError(t("dashboard.packages.errors.fetchPackages"));
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      id: null,
      name: "",
      description: "",
      price: "",
      package_category_id:
        categories.find((c) => c.slug === selectedSlug)?.id || "",
    });
    setModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setModalMode("edit");
    setFormData({
      id: pkg.id,
      name: pkg.name || "",
      description: pkg.description || "",
      price: pkg.price ?? "",
      package_category_id: pkg.package_category_id || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.package_category_id) {
      showToast(t("dashboard.packages.errors.required"), "error");
      return;
    }

    const payload = {
      package_category_id: Number(formData.package_category_id),
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
    };

    try {
      if (modalMode === "edit" && formData.id) {
        await adminAPI.put(`/packages/${formData.id}`, payload);
        showToast(t("dashboard.packages.messages.updated"));
      } else {
        await adminAPI.post("/packages", payload);
        showToast(t("dashboard.packages.messages.created"));
      }
      setModalOpen(false);
      fetchPackages(selectedSlug);
    } catch (err) {
      console.error("Error saving package:", err);
      showToast(
        err.response?.data?.message ||
          t("dashboard.packages.errors.saveFailed"),
        "error"
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/packages/${deleteTarget.id}`);
      showToast(t("dashboard.packages.messages.deleted"));
      setDeleteTarget(null);
      fetchPackages(selectedSlug);
    } catch (err) {
      console.error("Error deleting package:", err);
      showToast(t("dashboard.packages.errors.deleteFailed"), "error");
    }
  };

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.slug === selectedSlug),
    [categories, selectedSlug]
  );

  if (loading && !categories.length && !packages.length) {
    return <Loader />;
  }

  return (
    <section className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {toast && (
        <div
          className={`fixed top-5 z-50 ${
            isRTL ? "left-5" : "right-5"
          } animate-slide-in`}
        >
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          {t("dashboard.packages.actions.add")}
        </button>
        <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
          {t("dashboard.packages.title")}
        </h1>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-rose-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedSlug(category.slug)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedSlug === category.slug
                ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-emerald-200 bg-white p-8 text-center text-slate-500">
            {t("dashboard.packages.empty")}
          </div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700">
                    {pkg.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedCategory?.name || ""}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(pkg)}
                  className="rounded-full bg-rose-500/10 p-2 text-rose-500 hover:bg-rose-500 hover:text-white"
                  title={t("dashboard.packages.actions.delete")}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <p className="mb-4 text-sm text-slate-600">{pkg.description}</p>
              <p className="mb-4 text-xl font-bold text-emerald-600">
                {pkg.price} {t("dashboard.packages.currency")}
              </p>
              <button
                onClick={() => openEditModal(pkg)}
                className="mt-auto rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("dashboard.packages.actions.edit")}
              </button>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-emerald-700">
                {modalMode === "edit"
                  ? t("dashboard.packages.actions.edit")
                  : t("dashboard.packages.actions.add")}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg
                  className="h-6 w-6"
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
              </button>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.packages.fields.category")}
              <select
                name="package_category_id"
                value={formData.package_category_id}
                onChange={handleInput}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">{t("dashboard.packages.fields.choose")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.packages.fields.name")}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInput}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder={t("dashboard.packages.fields.namePlaceholder")}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.packages.fields.description")}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInput}
                rows={4}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder={t("dashboard.packages.fields.descriptionPlaceholder")}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {t("dashboard.packages.fields.price")}
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInput}
                className="mt-2 w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.packages.actions.cancel")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                {modalMode === "edit"
                  ? t("dashboard.packages.actions.update")
                  : t("dashboard.packages.actions.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-center text-lg font-semibold text-slate-800">
              {t("dashboard.packages.delete.confirmTitle")}
            </h3>
            <p className="mb-6 text-center text-sm text-slate-600">
              {t("dashboard.packages.delete.confirmMessage")}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("dashboard.packages.actions.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              >
                {t("dashboard.packages.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PackagesPage;

