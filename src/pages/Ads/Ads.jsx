import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRegEdit } from "react-icons/fa";
import { Trash2, X, RefreshCw } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";
import { useNavigate } from "react-router-dom";
import { getCachedCategories, getCachedMyProducts, userAPI } from "../../api";
import ProductCard from "../../components/ProductCard/ProductCard";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";

function RenewConfirmModal({ isOpen, onClose, onConfirm, isRTL = false, loading = false }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {isRTL ? 'تجديد الإعلان' : 'Renew Ad'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-main" />
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          {isRTL
            ? 'هل تريد تجديد هذا الإعلان؟ سيظهر الإعلان مرة أخرى لمدة 3 أشهر'
            : 'Do you want to renew this ad? The ad will appear again for 3 months'}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 cursor-pointer bg-main hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isRTL ? 'جاري التجديد...' : 'Renewing...'}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>{isRTL ? 'تأكيد التجديد' : 'Confirm Renewal'}</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isRTL = false }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReasonText, setOtherReasonText] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = [
    {
      value: "product_sold",
      labelAr: "تم بيع المنتج",
      labelEn: "Product sold",
      bgColor: "bg-green-50",
      activeBg: "bg-green-100",
      activeBorder: "border-green-600",
      dotColor: "bg-green-600",
    },
    {
      value: "no_longer_available",
      labelAr: "المنتج لم يعد متاحاً",
      labelEn: "No longer available",
      bgColor: "bg-orange-50",
      activeBg: "bg-orange-100",
      activeBorder: "border-orange-600",
      dotColor: "bg-orange-600",
    },
    {
      value: "duplicate_listing",
      labelAr: "إعلان مكرر",
      labelEn: "Duplicate listing",
      bgColor: "bg-blue-50",
      activeBg: "bg-blue-100",
      activeBorder: "border-blue-600",
      dotColor: "bg-blue-600",
    },
    {
      value: "wrong_information",
      labelAr: "معلومات خاطئة",
      labelEn: "Wrong information",
      bgColor: "bg-red-50",
      activeBg: "bg-red-100",
      activeBorder: "border-red-600",
      dotColor: "bg-red-600",
    },
    {
      value: "other",
      labelAr: "سبب آخر",
      labelEn: "Other reason",
      bgColor: "bg-purple-50",
      activeBg: "bg-purple-100",
      activeBorder: "border-purple-600",
      dotColor: "bg-purple-600",
    },
  ];

  const handleReasonChange = (value) => {
    setSelectedReason(value);
    if (value !== "other") {
      setOtherReasonText("");
    }
  };

  const handleConfirm = async () => {
    const finalReason = selectedReason === "other" ? otherReasonText : selectedReason;

    setLoading(true);
    await onConfirm(finalReason);
    setLoading(false);
    handleClose();
  };

  const isConfirmDisabled = !selectedReason ||
    (selectedReason === "other" && otherReasonText.trim() === "");

  const handleClose = () => {
    setSelectedReason("");
    setOtherReasonText("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {isRTL ? 'حذف الإعلان' : 'Delete Ad'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-5">
          {isRTL
            ? 'الرجاء اختيار سبب حذف الإعلان:'
            : 'Please select a reason for deletion:'}
        </p>

        <div className="space-y-2 mb-5">
          {reasons.map((reason) => {
            const isSelected = selectedReason === reason.value;
            return (
              <label
                key={reason.value}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer
                transition-colors duration-200
                ${isSelected
                    ? `${reason.activeBg} border-2 ${reason.activeBorder}`
                    : `${reason.bgColor} border border-transparent`
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                transition-colors
                ${isSelected ? reason.activeBorder : "border-gray-300"}
              `}
                >
                  {isSelected && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${reason.dotColor}`}
                    />
                  )}
                </span>

                <span className="flex-1 font-medium text-sm">
                  {isRTL ? reason.labelAr : reason.labelEn}
                </span>

                <input
                  type="radio"
                  name="deleteReason"
                  value={reason.value}
                  checked={isSelected}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>

        {selectedReason === "other" && (
          <div className="mb-5">
            <textarea
              value={otherReasonText}
              onChange={(e) => setOtherReasonText(e.target.value)}
              placeholder={isRTL ? "اكتب السبب هنا..." : "Write the reason here..."}
              className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-purple-50"
              rows="2"
              maxLength="200"
            />
            <p className="text-xs text-purple-600 mt-1 text-right font-medium">
              {otherReasonText.length}/200
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading || isConfirmDisabled}
            className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{isRTL ? 'جاري الحذف...' : 'Deleting...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>{isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdsItem({ item, onDelete, onRenew }) {
  const { id, images, image, name, name_ar, name_en, governorate, price, created_at, renewed_at } = item;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const allImages = images && images.length > 0 ? images : (image ? [image] : []);

  const checkNeedsRenewal = () => {
    const lastUpdateDate = renewed_at ? new Date(renewed_at) : new Date(created_at);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - lastUpdateDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 90; 
  };

  const needsRenewal = checkNeedsRenewal();

  const handleProductClick = (productId) => {
    navigate(`/product-details/${productId}`);
  };

  const handleEditClick = (e, productId) => {
    e.stopPropagation();
    navigate(`/ads/${productId}/edit`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleRenewClick = (e) => {
    e.stopPropagation();
    setShowRenewModal(true);
  };

  const handleConfirmDelete = async (reason) => {
    try {
      await onDelete(id, reason);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const handleConfirmRenew = async () => {
    try {
      setIsRenewing(true);
      await onRenew(id);
      setShowRenewModal(false);
    } catch (error) {
      console.error('Error renewing ad:', error);
    } finally {
      setIsRenewing(false);
    }
  };

  const productData = {
    ...item,
    id: id,
    name_ar: name_ar,
    name_en: name_en || name,
    price: price,
    images: allImages,
    image: allImages[0],
    governorate: governorate,
    created_at: created_at
  };

  return (
    <>
      <div className="relative">
        {/* Renewal Badge */}
        {needsRenewal && (
          <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} z-10`}>
            <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              <span>{isRTL ? 'يحتاج تجديد' : 'Needs Renewal'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10 flex gap-2`}>
          {needsRenewal && (
            <button
              onClick={handleRenewClick}
              className="cursor-pointer rounded-full p-1.5 shadow-sm hover:scale-110 transition-all bg-main hover:bg-green-700 text-white"
              title={isRTL ? 'تجديد الإعلان' : 'Renew Ad'}
            >
              <RefreshCw size={16} />
            </button>
          )}

          <button
            onClick={(e) => handleEditClick(e, id)}
            className="cursor-pointer rounded-full p-1.5 shadow-sm hover:scale-110 transition-all bg-white hover:bg-gray-50"
          >
            <FaRegEdit size={16} className="text-gray-400" />
          </button>

          <button
            onClick={handleDeleteClick}
            className="cursor-pointer rounded-full p-1.5 shadow-sm hover:scale-110 transition-all bg-white hover:bg-red-50"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>

        <ProductCard
          product={productData}
          onProductClick={handleProductClick}
        />
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isRTL={isRTL}
      />

      <RenewConfirmModal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        onConfirm={handleConfirmRenew}
        isRTL={isRTL}
        loading={isRenewing}
      />
    </>
  );
}

export default function Ads() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [filter, setFilter] = useState({ status: "all", category_id: "all" });
  const [adsItems, setAdsItems] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, fromCache } = await getCachedCategories();
        console.log(fromCache ? '📦 Categories من الكاش' : '🌐 Categories من API');
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, fromCache } = await getCachedMyProducts();
        console.log(fromCache ? '📦 My Products من الكاش' : '🌐 My Products من API');
        setAdsItems(data);
        setFilteredAds(data);
      } catch (err) {
        console.error("Error fetching ads:", err);
        setError(isRTL ? "فشل في تحميل الإعلانات..." : "Failed to load ads...");
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [isRTL]);

  useEffect(() => {
    let filtered = [...adsItems];

    if (filter.category_id && filter.category_id !== "all") {
      filtered = filtered.filter(
        (item) => item.category_id === parseInt(filter.category_id)
      );
    }

    if (filter.status && filter.status !== "all") {
      filtered = filtered.filter((item) => item.status === filter.status);
    }

    setFilteredAds(filtered);
  }, [filter, adsItems]);

  const handleDelete = async (productId, reason) => {
    try {
      await userAPI.delete(`/products/${productId}`, {
        data: {
          reason: reason,
          other_reason: reason === "other" ? reason : undefined
        }
      });

      setAdsItems(prev => prev.filter(item => item.id !== productId));
      setFilteredAds(prev => prev.filter(item => item.id !== productId));

      showToast(
        isRTL ? 'تم حذف الإعلان بنجاح' : 'Ad deleted successfully',
        'success'
      );
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(
        isRTL ? 'حدث خطأ أثناء حذف الإعلان' : 'Error deleting ad',
        'error'
      );
    }
  };

  const handleRenew = async (productId) => {
    try {
      await userAPI.post(`/products/${productId}/renew`);

      const updatedAds = adsItems.map(item => 
        item.id === productId 
          ? { ...item, renewed_at: new Date().toISOString() }
          : item
      );
      
      setAdsItems(updatedAds);
      setFilteredAds(updatedAds.filter(item => {
        let matches = true;
        
        if (filter.category_id && filter.category_id !== "all") {
          matches = matches && item.category_id === parseInt(filter.category_id);
        }
        
        if (filter.status && filter.status !== "all") {
          matches = matches && item.status === filter.status;
        }
        
        return matches;
      }));

      showToast(
        isRTL ? 'تم تجديد الإعلان بنجاح' : 'Ad renewed successfully',
        'success'
      );
    } catch (error) {
      console.error('Error renewing product:', error);
      showToast(
        isRTL ? 'حدث خطأ أثناء تجديد الإعلان' : 'Error renewing ad',
        'error'
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="py-6">
        <div className="container">
          <h3 className="text-2xl font-bold text-main mb-4">{t("ads.title")}</h3>
          <div className="flex justify-center items-center min-h-64">
            <p className="text-center text-red-500 text-lg">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  const categoryOptions = [
    { value: "all", label: t("ads.filterSection.allCategories") },
    ...categories.map(cat => ({
      value: cat.id.toString(),
      label: isRTL ? cat.name_ar : cat.name_en
    }))
  ];

  const statusOptions = [
    { value: "all", label: isRTL ? "كل الحالات" : "All Status" },
    { value: "accepted", label: isRTL ? "مقبول" : "Accepted" },
    { value: "rejected", label: isRTL ? "مرفوض" : "Rejected" },
    { value: "pending", label: isRTL ? "تحت المراجعة" : "Pending" },
  ];

  return (
    <section className="py-4">
      <div className="container">
        {toast && (
          <div className={`fixed top-3 ${isRTL ? "left-3" : "right-3"} z-50 animate-slide-in max-w-[90%]`}>
            <div className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
              {toast.type === "success" ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium break-words text-xs">{toast.message}</span>
            </div>
          </div>
        )}

        <h3 className="text-2xl text-center font-bold text-main mb-6">{t("ads.title")}</h3>

        {/* Create Ad Button */}
        <div className="block sm:hidden mb-4">
          <button
            onClick={() => navigate("/ads/create")}
            className="w-full flex items-center justify-center bg-gradient-to-r from-main to-green-700 text-white py-3.5 px-8 rounded-xl hover:from-green-700 hover:to-main transition-all duration-300 text-base font-bold cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <svg className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("ads.makeAds")}
          </button>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row items-stretch justify-between sm:items-center gap-4 mb-6 bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 rounded-2xl shadow-md border border-gray-200/60 backdrop-blur-sm relative z-20">
          {/* Desktop Button */}
          <div className={`hidden sm:block ${isRTL ? 'sm:order-2' : 'sm:order-1'}`}>
            <button
              onClick={() => navigate("/ads/create")}
              className="flex items-center bg-main text-white py-3 px-8 whitespace-nowrap rounded-lg hover:bg-green-700 transition-all duration-200 text-base font-semibold cursor-pointer shadow-sm hover:shadow-md"
            >
              {t("ads.makeAds")}
            </button>
          </div>

          {/* Desktop Filters */}
          <div className={`hidden sm:flex gap-3 ${isRTL ? 'sm:order-1' : 'sm:order-2'}`}>
            <CustomSelect
              options={categoryOptions}
              value={filter.category_id}
              onChange={(value) => setFilter((prev) => ({ ...prev, category_id: value }))}
              placeholder={t("ads.filterSection.allCategories")}
              isRTL={isRTL}
              className="min-w-[180px]"
            />

            <CustomSelect
              options={statusOptions}
              value={filter.status}
              onChange={(value) => setFilter((prev) => ({ ...prev, status: value }))}
              placeholder={isRTL ? "كل الحالات" : "All Status"}
              isRTL={isRTL}
              className="min-w-[160px]"
            />
          </div>

          {/* Mobile Filters Only */}
          <div className="w-full block sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                options={categoryOptions}
                value={filter.category_id}
                onChange={(value) => setFilter(prev => ({ ...prev, category_id: value }))}
                placeholder={t("ads.filterSection.allCategories")}
                isRTL={isRTL}
              />

              <CustomSelect
                options={statusOptions}
                value={filter.status}
                onChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                placeholder={isRTL ? "كل الحالات" : "All Status"}
                isRTL={isRTL}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {filteredAds.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 rounded-2xl">
              <p className="text-xl font-bold mb-2">{t("ads.noContent")}</p>
            </div>
          ) : (
            filteredAds.map((item) => (
              <AdsItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onRenew={handleRenew}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}