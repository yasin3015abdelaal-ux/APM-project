import { useEffect, useMemo, useState } from "react";
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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("slider"); // "slider" or "announcement"
  const [formFiles, setFormFiles] = useState([]); // للسلايدر - multiple files
  const [formFile, setFormFile] = useState(null); // للإعلان الافتتاحي - single file
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب الإعلانات المتحركة (Advertisements)
      const adsResponse = await adminAPI.get("/advertisements");
      const adsData = adsResponse.data?.data ?? adsResponse.data ?? [];
      setAds(Array.isArray(adsData) ? adsData : []);
      
      // جلب الإعلانات الافتتاحية (Announcements)
      const announcementsResponse = await adminAPI.get("/announcements");
      const announcementsData = announcementsResponse.data?.data ?? announcementsResponse.data ?? [];
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(t("dashboard.advertisements.errors.fetch"));
    } finally {
      setLoading(false);
    }
  };

  const sliderAds = useMemo(() => ads, [ads]);

  const openModal = (type) => {
    if (type === "slider") {
      const maxImages = 3;
      if (sliderAds.length >= maxImages) {
        showToast(t("dashboard.advertisements.errors.maxImages") || `Maximum ${maxImages} images allowed`, "error");
        return;
      }
    }
    
    setModalType(type);
    setFormFiles([]);
    setFormFile(null);
    setPreviewUrls([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setFormFiles([]);
    setFormFile(null);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // للسلايدر - multiple files
    if (modalType === "slider") {
      const remainingSlots = 3 - sliderAds.length;
      const filesToAdd = files.slice(0, remainingSlots);
      
      setFormFiles(filesToAdd);
      
      // إنشاء preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      const urls = filesToAdd.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    } 
    // للإعلان الافتتاحي - single file
    else if (modalType === "announcement") {
      const file = files[0];
      setFormFile(file);
      
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      const url = URL.createObjectURL(file);
      setPreviewUrls([url]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (modalType === "slider") {
      // رفع صور السلايدر (Multiple)
      if (formFiles.length === 0) {
        showToast(t("dashboard.advertisements.errors.fileRequired") || "Please select at least one image", "error");
        return;
      }

      try {
        setSubmitting(true);
        
        // رفع كل صورة لوحدها
        for (let i = 0; i < formFiles.length; i++) {
          const formData = new FormData();
          formData.append("image", formFiles[i]);
          formData.append("order", sliderAds.length + i + 2); // order يبدأ من 2 للسلايدر
          
          await adminAPI.post("/advertisements", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        
        closeModal();
        await fetchData();
        showToast(t("dashboard.advertisements.messages.created") || `${formFiles.length} advertisement(s) added successfully`, "success");
      } catch (err) {
        console.error("Error uploading advertisements:", err);
        showToast(t("dashboard.advertisements.errors.upload") || "Failed to upload advertisements", "error");
      } finally {
        setSubmitting(false);
      }
      
    } else if (modalType === "announcement") {
      // رفع الإعلان الافتتاحي (Single)
      if (!formFile) {
        showToast(t("dashboard.advertisements.errors.fileRequired") || "Please select an image", "error");
        return;
      }

      try {
        setSubmitting(true);
        
        // مسح الإعلان القديم لو موجود
        if (announcements.length > 0) {
          await adminAPI.delete(`/announcements/${announcements[0].id}`);
        }
        
        // رفع الإعلان الجديد
        const formData = new FormData();
        formData.append("image", formFile);
        
        await adminAPI.post("/announcements", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        closeModal();
        await fetchData();
        showToast(t("dashboard.advertisements.messages.announcementCreated") || "Opening announcement updated successfully", "success");
      } catch (err) {
        console.error("Error uploading announcement:", err);
        showToast(t("dashboard.advertisements.errors.upload") || "Failed to upload announcement", "error");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDelete = async (id, type) => {
    setDeleteConfirm({ id, type });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const endpoint = deleteConfirm.type === "announcement" 
        ? `/announcements/${deleteConfirm.id}`
        : `/advertisements/${deleteConfirm.id}`;
        
      await adminAPI.delete(endpoint);
      await fetchData();
      
      const message = deleteConfirm.type === "announcement"
        ? t("dashboard.advertisements.messages.announcementDeleted") || "Opening announcement deleted successfully"
        : t("dashboard.advertisements.messages.deleted") || "Advertisement deleted successfully";
        
      showToast(message, "success");
    } catch (err) {
      console.error("Error deleting:", err);
      showToast(t("dashboard.advertisements.errors.delete") || "Failed to delete", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <button
          onClick={fetchData}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
        >
          {t("common.retry")}
        </button>
      </section>
    );
  }

  const renderGallery = (list, emptyMessage, type) => (
    <div className="flex flex-wrap items-center gap-4">
      {list.length === 0 && (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      )}
      {list.map((item) => (
        <div
          key={item.id}
          className="relative h-32 w-32 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition hover:shadow-md"
        >
          <img
            src={item.image_url}
            alt={`${type}-${item.id}`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => handleDelete(item.id, type)}
            className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600"
          >
            ×
          </button>
          {item.order && (
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              #{item.order}
            </span>
          )}
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
            {t("dashboard.advertisements.pageTitle") || "Advertisements Management"}
          </h1>
          <p className="text-sm text-slate-500">
            {t("dashboard.advertisements.subtitle") || "Manage your advertisements"}
          </p>
        </header>

        {/* Opening Announcement Section */}
        <div className="space-y-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">
                {t("dashboard.advertisements.announcementTitle") || "Opening Announcement"}
              </h2>
              <p className="text-xs text-slate-500">
                {announcements.length}/1 {t("dashboard.advertisements.imageCount") || "image"}
              </p>
            </div>
            <button
              onClick={() => openModal("announcement")}
              className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              {announcements.length > 0 
                ? t("dashboard.advertisements.actions.updateAnnouncement") || "Update Announcement"
                : t("dashboard.advertisements.actions.addAnnouncement") || "Add Announcement"
              }
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-100 p-4">
            {renderGallery(
              announcements,
              t("dashboard.advertisements.emptyAnnouncementSection") || "No opening announcement yet",
              "announcement"
            )}
          </div>
        </div>

        {/* Slider Section */}
        <div className="space-y-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-emerald-700">
                {t("dashboard.advertisements.sliderTitle") || "Slider Advertisements"}
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
              {t("dashboard.advertisements.actions.addSlider") || "Add Slider Images"}
            </button>
          </div>
          <div className="rounded-2xl border border-emerald-100 p-4">
            {renderGallery(
              sliderAds,
              t("dashboard.advertisements.emptySliderSection") || "No slider images yet",
              "slider"
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md space-y-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-emerald-700">
                {modalType === "announcement"
                  ? t("dashboard.advertisements.modal.announcementTitle") || "Upload Opening Announcement"
                  : t("dashboard.advertisements.modal.sliderTitle") || "Upload Slider Images"
                }
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  {modalType === "announcement"
                    ? t("dashboard.advertisements.modal.singleImageLabel") || "Select Image (Will replace current)"
                    : t("dashboard.advertisements.modal.multipleImageLabel") || "Select Images (Multiple)"
                  }
                </label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple={modalType === "slider"}
                    onChange={handleFilesChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-6 py-8 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    {previewUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {previewUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ))}
                      </div>
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
                          {modalType === "announcement"
                            ? t("dashboard.advertisements.modal.uploadSingleText") || "Click to upload image"
                            : t("dashboard.advertisements.modal.uploadMultipleText") || "Click to upload images"
                          }
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          PNG, JPG up to 10MB {modalType === "slider" && "(Multiple files allowed)"}
                        </p>
                      </>
                    )}
                  </label>
                  {(formFiles.length > 0 || formFile) && (
                    <p className="mt-2 text-xs text-slate-600">
                      {modalType === "slider" 
                        ? `${formFiles.length} file(s) selected`
                        : formFile?.name
                      }
                    </p>
                  )}
                </div>
              </div>

              {modalType === "announcement" && announcements.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ {t("dashboard.advertisements.modal.replaceWarning") || "This will replace the current opening announcement"}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("dashboard.advertisements.modal.cancel") || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? t("dashboard.advertisements.modal.saving") || "Uploading..."
                    : t("dashboard.advertisements.modal.save") || "Upload"
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
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
                  {t("dashboard.advertisements.deleteModal.title") || "Delete"} {deleteConfirm.type === "announcement" ? "Announcement" : "Advertisement"}
                </h3>
              </div>
              
              <p className="text-sm text-slate-600">
                {t("dashboard.advertisements.deleteModal.message") || "Are you sure you want to delete this? This action cannot be undone."}
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