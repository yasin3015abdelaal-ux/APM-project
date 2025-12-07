import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaRegEdit } from "react-icons/fa";
import { Trash2, X } from "lucide-react";
import Loader from "../../components/Ui/Loader/Loader";
import { useNavigate } from "react-router-dom";
import { getCachedCategories, getCachedMyProducts, userAPI } from "../../api";
import ProductCard from "../../components/ProductCard/ProductCard";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";

// Delete Confirmation Modal Component
function DeleteConfirmModal({ isOpen, onClose, onConfirm, isRTL }) {
  const [soldOnWebsite, setSoldOnWebsite] = useState(false);
  const [changedMind, setChangedMind] = useState(false);
  const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
  const handleSoldChange = (checked) => {
    if (checked) {
      setChangedMind(false);
    }
    setSoldOnWebsite(checked);
  };

  const handleChangedMindChange = (checked) => {
    if (checked) {
      setSoldOnWebsite(false);
    }
    setChangedMind(checked);
  };

const handleConfirm = async () => {
  setLoading(true);
  await onConfirm(soldOnWebsite);
  showToast(
    isRTL ? 'تم حذف الإعلان بنجاح' : 'Ad deleted successfully',  
    'success'
  );
  setLoading(false);
};

  const isConfirmDisabled = !soldOnWebsite && !changedMind;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-semibold text-sm sm:text-base break-words">{toast.message}</span>
                    </div>
                </div>
            )}
      <div 
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900">
            {isRTL ? 'حذف الإعلان' : 'Delete Ad'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={soldOnWebsite}
              onChange={(e) => handleSoldChange(e.target.checked)}
              className="w-5 h-5 text-main rounded cursor-pointer"
            />
            <span className="text-gray-800 font-medium text-sm">
              {isRTL 
                ? 'هل تم البيع على الموقع؟' 
                : 'Was it sold on the website?'}
            </span>
          </label>
        </div>

        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={changedMind}
              onChange={(e) => handleChangedMindChange(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded cursor-pointer"
            />
            <span className="text-gray-800 font-medium text-sm">
              {isRTL 
                ? 'هل غيرت رأيك من البيع؟' 
                : 'Did you change your mind about selling?'}
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading || isConfirmDisabled}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (isRTL ? 'جاري...' : 'Loading...') 
              : (isRTL ? 'متابعة' : 'Continue')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg transition cursor-pointer"
          >
            {isRTL ? 'الرجوع عن الحذف' : 'Cancel Delete'}
          </button>
        </div>

      </div>
    </div>
  );
}

function AdsItem({ item, onDelete }) {
  const { id, images, image, name, name_ar, name_en, governorate, price, created_at } = item;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const imageUrl = images && images.length > 0 ? images[0] : image;

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

  const handleConfirmDelete = async (soldOnWebsite) => {
    try {
      await onDelete(id, soldOnWebsite);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  const productData = {
    ...item,
    id: id,
    name_ar: name_ar,
    name_en: name_en || name,
    price: price,
    image: imageUrl,
    governorate: governorate,
    created_at: created_at
  };

  return (
    <>
      <div className="relative">
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10 flex gap-2`}>
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

  const handleDelete = async (productId, soldOnWebsite) => {
    try {
      // Send delete request with sold_on_website parameter
      await userAPI.delete(`/products/${productId}`, {
        data: { sold_on_website: soldOnWebsite }
      });
      
      // Update local state
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
        
        <div className="flex flex-col sm:flex-row items-stretch justify-between sm:items-center gap-4 mb-6 bg-gradient-to-r from-gray-50 to-gray-100/50 p-5 rounded-2xl shadow-md border border-gray-200/60 backdrop-blur-sm relative z-20">
          <div className={`w-full sm:w-auto ${isRTL ? 'sm:order-2' : 'sm:order-1'}`}>
            <button 
              onClick={() => navigate("/ads/create")}
              className="w-full flex sm:w-auto bg-main text-white py-3 px-8 whitespace-nowrap rounded-lg hover:bg-green-700 transition-all duration-200 text-base font-semibold cursor-pointer shadow-sm hover:shadow-md"
            >
              {t("ads.makeAds")}
            </button>
          </div>

          {/* Desktop Filters */}
          <div className={`hidden sm:flex gap-3 ${isRTL ? 'sm:order-2' : 'sm:order-1'}`}>
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

          {/* Mobile Filters */}
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
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}