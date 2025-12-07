import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ArticlesPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null,
    imagePreview: null,
  });

  // Get country ID from localStorage
  const getCountryId = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    return userData?.country?.id || 1;
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.get("/articles?per_page=15");
      let payload = response.data;

      if (Array.isArray(payload)) {
        setArticles(payload);
        return;
      }

      if (Array.isArray(payload?.data)) {
        setArticles(payload.data);
        return;
      }

      if (Array.isArray(payload?.data?.data)) {
        setArticles(payload.data.data);
        return;
      }

      setArticles([]);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err.response?.data?.message || err.message || t("dashboard.articles.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image: null,
      imagePreview: null,
    });
  };

  const handleAddArticle = async () => {
    try {
      if (!formData.title || !formData.content) {
        showToast(t("dashboard.articles.fillAllFields"), "error");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await adminAPI.post("/articles", formDataToSend, {
        headers: {
          "X-Country-Id": getCountryId(),
        },
      });

      showToast(t("dashboard.articles.addSuccess"), "success");
      setShowAddModal(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error("Error adding article:", err);
      showToast(err.response?.data?.message || t("dashboard.articles.addError"), "error");
    }
  };

  const handleEditClick = async (article) => {
    try {
      setLoading(true);
      const response = await adminAPI.get(`/articles/${article.id}`, {
        headers: { "X-Country-Id": getCountryId() },
      });
      const articleData = response.data?.data || response.data || article;
      setSelectedArticle(articleData);
      setFormData({
        title: articleData.title || "",
        content: articleData.content || "",
        image: null,
        imagePreview: articleData.image_url || null,
      });
      setShowEditModal(true);
    } catch (err) {
      console.error("Error fetching article:", err);
      showToast(t("dashboard.articles.fetchError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArticle = async () => {
    try {
      if (!formData.title || !formData.content) {
        showToast(t("dashboard.articles.fillAllFields"), "error");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("_method", "PUT");
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      await adminAPI.post(`/articles/${selectedArticle.id}`, formDataToSend, {
        headers: {
          "X-Country-Id": getCountryId(),
        },
      });

      showToast(t("dashboard.articles.updateSuccess"), "success");
      setShowEditModal(false);
      resetForm();
      setSelectedArticle(null);
      fetchArticles();
    } catch (err) {
      console.error("Error updating article:", err);
      showToast(err.response?.data?.message || t("dashboard.articles.updateError"), "error");
    }
  };

  const handleDeleteClick = (article) => {
    setSelectedArticle(article);
    setShowDeleteModal(true);
  };

  const handleDeleteArticle = async () => {
    try {
      await adminAPI.delete(`/articles/${selectedArticle.id}`, {
        headers: { "X-Country-Id": getCountryId() },
      });
      showToast(t("dashboard.articles.deleteSuccess"), "success");
      setShowDeleteModal(false);
      setSelectedArticle(null);
      fetchArticles();
    } catch (err) {
      console.error("Error deleting article:", err);
      showToast(err.response?.data?.message || t("dashboard.articles.deleteError"), "error");
    }
  };

  if (loading && articles.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 z-50 ${isRTL ? "left-4" : "right-4"} animate-slide-in`}
        >
          <div
            className={`flex items-center gap-3 rounded-xl px-6 py-4 shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
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
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <section className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            {t("dashboard.articles.addArticle")}
          </button>
          <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
            {t("dashboard.articles.title")}
          </h1>
        </header>

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
            {t("dashboard.articles.noArticles")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="group relative rounded-xl border border-emerald-300 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Trash Icon */}
                <button
                  onClick={() => handleDeleteClick(article)}
                  className="absolute top-2 left-2 z-10 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                  title={t("dashboard.articles.delete")}
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

                {/* Article Image */}
                {article.image_url && (
                  <div className="mb-3 h-40 overflow-hidden rounded-lg">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {article.title}
                  </h3>
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {article.content}
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(article)}
                  className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  {t("dashboard.articles.editArticle")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-emerald-400 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-emerald-700">
                {t("dashboard.articles.addArticle")}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => document.getElementById("add-image-input").click()}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("dashboard.articles.addImage")}
              </button>
              <input
                id="add-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {formData.imagePreview && (
                <div className="h-40 overflow-hidden rounded-lg">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("dashboard.articles.articleTitle")}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder={t("dashboard.articles.articleTitlePlaceholder")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("dashboard.articles.articleContent")}
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder={t("dashboard.articles.articleContentPlaceholder")}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAddArticle}
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("dashboard.articles.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Article Modal */}
      {showEditModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-emerald-400 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-emerald-700">
                {t("dashboard.articles.editArticle")}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                  setSelectedArticle(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => document.getElementById("edit-image-input").click()}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("dashboard.articles.addImage")}
              </button>
              <input
                id="edit-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {formData.imagePreview && (
                <div className="h-40 overflow-hidden rounded-lg">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("dashboard.articles.articleTitle")}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder={t("dashboard.articles.articleTitlePlaceholder")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("dashboard.articles.articleContent")}
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder={t("dashboard.articles.articleContentPlaceholder")}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleDeleteClick.bind(null, selectedArticle)}
                className="rounded-lg bg-red-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {t("dashboard.articles.delete")}
              </button>
              <button
                onClick={handleUpdateArticle}
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("dashboard.articles.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-300 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">
              {t("dashboard.articles.deleteConfirmTitle")}
            </h2>
            <p className="mb-6 text-center text-sm text-slate-600">
              {t("dashboard.articles.deleteConfirmMessage")}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedArticle(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("dashboard.articles.cancel")}
              </button>
              <button
                onClick={handleDeleteArticle}
                className="rounded-lg bg-red-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {t("dashboard.articles.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesPage;

