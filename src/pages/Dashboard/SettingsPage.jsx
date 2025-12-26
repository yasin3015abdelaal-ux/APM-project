import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const normalizeContentResponse = (response) => {
  const payload = response?.data;
  if (!payload) return {};
  if (payload.data) return payload.data;
  return payload;
};

const SettingsPage = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [aboutContent, setAboutContent] = useState({
    content_en: "",
    content_ar: "",
  });
  const [termsContent, setTermsContent] = useState({
    content_en: "",
    content_ar: "",
  });

  const [aboutModalMode, setAboutModalMode] = useState(null);
  const [termsModalMode, setTermsModalMode] = useState(null);

  const [aboutForm, setAboutForm] = useState({
    content_en: "",
    content_ar: "",
  });
  const [termsForm, setTermsForm] = useState({
    content_en: "",
    content_ar: "",
  });

  const [viewAboutMode, setViewAboutMode] = useState(false);
  const [viewTermsMode, setViewTermsMode] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const [aboutRes, termsRes] = await Promise.all([
          adminAPI.get("/app-content/about_us", { signal: controller.signal }),
          adminAPI.get("/app-content/terms_and_conditions", {
            signal: controller.signal,
          }),
        ]);

        const about = normalizeContentResponse(aboutRes);
        const terms = normalizeContentResponse(termsRes);

        setAboutContent({
          content_en: about.content_en || "",
          content_ar: about.content_ar || "",
        });
        setTermsContent({
          content_en: terms.content_en || "",
          content_ar: terms.content_ar || "",
        });
      } catch (err) {
        if (err.name === "CanceledError") return;
        console.error("Error fetching app content:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load app content."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    return () => controller.abort();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openAboutModal = (mode) => {
    setAboutModalMode(mode);
    setAboutForm(
      mode === "update"
        ? { ...aboutContent }
        : { content_en: "", content_ar: "" }
    );
  };

  const openTermsModal = (mode) => {
    setTermsModalMode(mode);
    setTermsForm(
      mode === "update"
        ? { ...termsContent }
        : { content_en: "", content_ar: "" }
    );
  };

  const closeAboutModal = () => {
    setAboutModalMode(null);
  };

  const closeTermsModal = () => {
    setTermsModalMode(null);
  };

  const handleSaveAbout = async () => {
    try {
      setSaving(true);
      setError(null);

      await adminAPI.put("/app-content/about_us", {
        content_en: aboutForm.content_en,
        content_ar: aboutForm.content_ar,
      });

      setAboutContent({ ...aboutForm });
      showToast("About Us content saved successfully.", "success");
      closeAboutModal();
      setViewAboutMode(false);
    } catch (err) {
      console.error("Error saving About Us content:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save About Us content."
      );
      showToast("Failed to save About Us content.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async () => {
    try {
      setSaving(true);
      setError(null);

      await adminAPI.put("/app-content/terms_and_conditions", {
        content_en: termsForm.content_en,
        content_ar: termsForm.content_ar,
      });

      setTermsContent({ ...termsForm });
      showToast("Terms & Conditions content saved successfully.", "success");
      closeTermsModal();
      setViewTermsMode(false);
    } catch (err) {
      console.error("Error saving Terms & Conditions content:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save Terms & Conditions content."
      );
      showToast("Failed to save Terms & Conditions content.", "error");
    } finally {
      setSaving(false);
    }
  };

  const tinyInit = (direction = "ltr", language = "en") => ({
    height: 300,
    menubar: true,
    directionality: direction,
    language,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount",
    ],
    toolbar:
      "undo redo | blocks fontfamily fontsize | " +
      "bold italic underline strikethrough forecolor backcolor | " +
      "alignleft aligncenter alignright alignjustify | " +
      "bullist numlist outdent indent | " +
      "removeformat | link image media table | help",
    content_style: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #334155;
      }
      ${
        direction === "rtl"
          ? `
        body {
          direction: rtl;
          text-align: right;
        }
        .tox-toolbar__group {
          flex-direction: row-reverse;
        }
      `
          : ""
      }
    `,
    images_upload_url: "/api/upload",
    automatic_uploads: false,
    file_picker_types: "image",
    image_title: true,
    image_caption: true,
    image_advtab: true,
    branding: false,
    skin: "oxide",
    content_css: "default",
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {toast && (
        <div
          className={`fixed top-4 z-50 ${
            isRTL ? "left-4" : "right-4"
          } animate-slide-in`}
        >
          <div
            className={`flex items-center gap-3 rounded-xl px-6 py-4 shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <section className="space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-emerald-700 sm:text-3xl">
            {isRTL ? "اعدادات المحتوى" : "App Content Settings"}
          </h1>
          <p className="text-sm text-slate-500">
            {isRTL
              ? "مدير المحتوى العام للتطبيق"
              : "Manage the public About Us and Terms & Conditions content for your app."}
          </p>
        </header>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* About Us Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-500">
                  {isRTL ? "الصفحة الثابتة" : "Static Page"}
                </p>
                <h2 className="text-lg font-semibold text-slate-800">
                  {isRTL ? "عنا" : "About Us"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isRTL
                    ? "عرض للمستخدمين في قسم عنا للتطبيق"
                    : "Shown to users in the About Us section of the app."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openAboutModal("update")}
                  className="rounded-lg border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  {isRTL ? "تحديث" : "Update"}
                </button>
                {(aboutContent.content_en || aboutContent.content_ar) && (
                  <button
                    onClick={() => setViewAboutMode(!viewAboutMode)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    {viewAboutMode
                      ? isRTL
                        ? "إخفاء"
                        : "Hide"
                      : isRTL
                      ? "عرض"
                      : "View"}
                  </button>
                )}
              </div>
            </div>

            {viewAboutMode ? (
              <div className="rounded-xl border border-emerald-200 bg-white p-4 max-h-[500px] overflow-y-auto">
                <style>
                  {`
                    .content-display ul {
                      list-style-type: disc;
                      padding-left: 1.5rem;
                      padding-right: 1.5rem;
                      margin: 1rem 0;
                    }
                    .content-display ol {
                      list-style-type: decimal;
                      padding-left: 1.5rem;
                      padding-right: 1.5rem;
                      margin: 1rem 0;
                    }
                    .content-display li {
                      margin: 0.5rem 0;
                      line-height: 1.6;
                    }
                    .content-display h1 {
                      font-size: 2rem;
                      font-weight: bold;
                      margin: 1.5rem 0 1rem 0;
                    }
                    .content-display h2 {
                      font-size: 1.5rem;
                      font-weight: bold;
                      margin: 1.25rem 0 0.75rem 0;
                    }
                    .content-display h3 {
                      font-size: 1.25rem;
                      font-weight: bold;
                      margin: 1rem 0 0.5rem 0;
                    }
                    .content-display p {
                      margin: 0.75rem 0;
                      line-height: 1.6;
                    }
                    .content-display strong {
                      font-weight: bold;
                    }
                    .content-display em {
                      font-style: italic;
                    }
                  `}
                </style>
                <div
                  className="content-display prose prose-slate max-w-none text-slate-700"
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.8",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      (isRTL
                        ? aboutContent.content_ar
                        : aboutContent.content_en) ||
                      aboutContent.content_en ||
                      aboutContent.content_ar,
                  }}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/40 p-3 text-sm text-slate-700">
                {aboutContent.content_en || aboutContent.content_ar ? (
                  <p className="text-slate-600">
                    {isRTL
                      ? "اضغط على زر 'عرض' لعرض المحتوى الكامل"
                      : "Click 'View' button to display the full content"}
                  </p>
                ) : (
                  <p className="text-slate-400">
                    {isRTL
                      ? "لم يتم إضافة محتوى عنا بعد"
                      : "No About Us content has been added yet."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Terms & Conditions Card */}
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-500">
                  {isRTL ? "الصفحة الثابتة" : "Static Page"}
                </p>
                <h2 className="text-lg font-semibold text-slate-800">
                  {isRTL ? "الشروط والأحكام" : "Terms & Conditions"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isRTL
                    ? "عرض للمستخدمين في قسم الشروط والأحكام للتطبيق"
                    : "Shown to users in the Terms & Conditions section of the app."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openTermsModal("update")}
                  className="rounded-lg border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  {isRTL ? "تحديث" : "Update"}
                </button>
                {(termsContent.content_en || termsContent.content_ar) && (
                  <button
                    onClick={() => setViewTermsMode(!viewTermsMode)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    {viewTermsMode
                      ? isRTL
                        ? "إخفاء"
                        : "Hide"
                      : isRTL
                      ? "عرض"
                      : "View"}
                  </button>
                )}
              </div>
            </div>

            {viewTermsMode ? (
              <div className="rounded-xl border border-emerald-200 bg-white p-4 max-h-[500px] overflow-y-auto">
                <style>
                  {`
                    .content-display ul {
                      list-style-type: disc;
                      padding-left: 1.5rem;
                      padding-right: 1.5rem;
                      margin: 1rem 0;
                    }
                    .content-display ol {
                      list-style-type: decimal;
                      padding-left: 1.5rem;
                      padding-right: 1.5rem;
                      margin: 1rem 0;
                    }
                    .content-display li {
                      margin: 0.5rem 0;
                      line-height: 1.6;
                    }
                    .content-display h1 {
                      font-size: 2rem;
                      font-weight: bold;
                      margin: 1.5rem 0 1rem 0;
                    }
                    .content-display h2 {
                      font-size: 1.5rem;
                      font-weight: bold;
                      margin: 1.25rem 0 0.75rem 0;
                    }
                    .content-display h3 {
                      font-size: 1.25rem;
                      font-weight: bold;
                      margin: 1rem 0 0.5rem 0;
                    }
                    .content-display p {
                      margin: 0.75rem 0;
                      line-height: 1.6;
                    }
                    .content-display strong {
                      font-weight: bold;
                    }
                    .content-display em {
                      font-style: italic;
                    }
                  `}
                </style>
                <div
                  className="content-display prose prose-slate max-w-none text-slate-700"
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.8",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      (isRTL
                        ? termsContent.content_ar
                        : termsContent.content_en) ||
                      termsContent.content_en ||
                      termsContent.content_ar,
                  }}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-100 bg-emerald-50/40 p-3 text-sm text-slate-700">
                {termsContent.content_en || termsContent.content_ar ? (
                  <p className="text-slate-600">
                    {isRTL
                      ? "اضغط على زر 'عرض' لعرض المحتوى الكامل"
                      : "Click 'View' button to display the full content"}
                  </p>
                ) : (
                  <p className="text-slate-400">
                    {isRTL
                      ? "لم يتم إضافة محتوى الشروط والأحكام بعد"
                      : "No Terms & Conditions content has been added yet."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Modal */}
      {aboutModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-400 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-emerald-200 z-10">
              <h2 className="text-xl font-semibold text-emerald-700">
                {aboutModalMode === "add"
                  ? isRTL
                    ? "إضافة محتوى عنا"
                    : "Add About Us Content"
                  : isRTL
                  ? "تحديث محتوى عنا"
                  : "Update About Us Content"}
              </h2>
              <button
                onClick={closeAboutModal}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isRTL ? "عنا (إنجليزي)" : "About Us (English)"}
                </label>
                <div className="overflow-hidden rounded-md border border-emerald-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Editor
                    apiKey={
                      process.env.REACT_APP_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={aboutForm.content_en}
                    onEditorChange={(content) =>
                      setAboutForm((prev) => ({ ...prev, content_en: content }))
                    }
                    init={tinyInit("ltr", "en")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isRTL ? "عنا (عربي)" : "About Us (Arabic)"}
                </label>
                <div className="overflow-hidden rounded-md border border-emerald-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Editor
                    apiKey={
                      process.env.REACT_APP_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={aboutForm.content_ar}
                    onEditorChange={(content) =>
                      setAboutForm((prev) => ({ ...prev, content_ar: content }))
                    }
                    init={tinyInit("rtl", "ar")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSaveAbout}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? isRTL
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isRTL
                  ? "حفظ"
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-400 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-emerald-200 z-10">
              <h2 className="text-xl font-semibold text-emerald-700">
                {termsModalMode === "add"
                  ? isRTL
                    ? "إضافة محتوى الشروط والأحكام"
                    : "Add Terms & Conditions Content"
                  : isRTL
                  ? "تحديث محتوى الشروط والأحكام"
                  : "Update Terms & Conditions Content"}
              </h2>
              <button
                onClick={closeTermsModal}
                className="text-gray-500 hover:text-gray-700"
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

            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isRTL
                    ? "الشروط والأحكام (إنجليزي)"
                    : "Terms & Conditions (English)"}
                </label>
                <div className="overflow-hidden rounded-md border border-emerald-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Editor
                    apiKey={
                      process.env.REACT_APP_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={termsForm.content_en}
                    onEditorChange={(content) =>
                      setTermsForm((prev) => ({ ...prev, content_en: content }))
                    }
                    init={tinyInit("ltr", "en")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isRTL
                    ? "الشروط والأحكام (عربي)"
                    : "Terms & Conditions (Arabic)"}
                </label>
                <div className="overflow-hidden rounded-md border border-emerald-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <Editor
                    apiKey={
                      process.env.REACT_APP_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={termsForm.content_ar}
                    onEditorChange={(content) =>
                      setTermsForm((prev) => ({ ...prev, content_ar: content }))
                    }
                    init={tinyInit("rtl", "ar")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSaveTerms}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? isRTL
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isRTL
                  ? "حفظ"
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;