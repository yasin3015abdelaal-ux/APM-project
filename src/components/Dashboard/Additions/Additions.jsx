import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../api';
import Loader from '../../Ui/Loader/Loader';

const Additions = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.get('/categories');
        setCategories(response.data.data || response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleToggleStatus = (category) => {
    setSelectedCategory(category);
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    try {
      await adminAPI.patch(`/categories/${selectedCategory.id}/toggle-status`);

      setCategories(categories.map(cat =>
        cat.id === selectedCategory.id
          ? { ...cat, is_active: !cat.is_active }
          : cat
      ));

      setShowConfirmModal(false);
      showToast(
        isRTL
          ? `تم ${selectedCategory.is_active ? 'إيقاف' : 'تفعيل'} الصنف بنجاح`
          : `Category ${selectedCategory.is_active ? 'deactivated' : 'activated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling category status:', error);
      showToast(isRTL ? 'حدث خطأ أثناء تغيير حالة الصنف' : 'Error toggling category status', 'error');
    }
  };

  const handleCategoryClick = (category) => {
    if (!category.is_active) {
      showToast(
        isRTL
          ? 'لا يمكن الدخول على صنف موقوف'
          : 'Cannot access inactive category',
        'error'
      );
      return;
    }
    navigate(`category/${category.id}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Header */}
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold text-main">
          {t('dashboard.additions.title')}
        </h1>
        <button className="bg-white text-main cursor-pointer px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors">
          <svg width="30" height="30" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5H10C7.25 5 5.025 7.25 5.025 10L5 55L15 45H50C52.75 45 55 42.75 55 40V10C55 7.25 52.75 5 50 5ZM42.5 35H17.5C16.125 35 15 33.875 15 32.5C15 31.125 16.125 30 17.5 30H42.5C43.875 30 45 31.125 45 32.5C45 33.875 43.875 35 42.5 35ZM42.5 27.5H17.5C16.125 27.5 15 26.375 15 25C15 23.625 16.125 22.5 17.5 22.5H42.5C43.875 22.5 45 23.625 45 25C45 26.375 43.875 27.5 42.5 27.5ZM42.5 20H17.5C16.125 20 15 18.875 15 17.5C15 16.125 16.125 15 17.5 15H42.5C43.875 15 45 16.125 45 17.5C45 18.875 43.875 20 42.5 20Z" fill="#4CAF50" />
          </svg>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {categories.map((item) => {
          const isHovered = hoveredId === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`rounded-lg p-3 md:p-4 shadow-sm border-2 transition-all relative ${isHovered
                  ? 'bg-main border-main text-white'
                  : 'bg-transparent border-main text-main'
                } ${!item.is_active ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Toggle Switch */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(item);
                }}
                className={`absolute top-1.5 ${isRTL ? 'left-1.5' : 'right-1.5'} cursor-pointer transition z-10`}
              >
                <div className={`w-7 h-4 sm:w-9 sm:h-5 rounded-full transition-colors ${item.is_active ? 'bg-main' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-md transform transition-transform ${item.is_active ? (isRTL ? 'translate-x-[-14px] sm:translate-x-[-18px]' : 'translate-x-[14px] sm:translate-x-[18px]') : 'translate-x-[-2px]'} translate-y-[2px]`} />
                </div>
              </button>

              <div
                onClick={() => handleCategoryClick(item)}
                className={`flex flex-col items-center text-center gap-2 md:gap-3 ${item.is_active ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain rounded"
                  />
                )}
                <h3 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2">
                  {isRTL ? item.name_ar : item.name_en}
                </h3>
                {!item.is_active && (
                  <span className="text-xs font-medium text-red-500">
                    {isRTL ? '(موقوف)' : '(Inactive)'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Toggle Status Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-main mb-4 text-center">
              {isRTL
                ? `هل أنت متأكد من ${selectedCategory?.is_active ? 'إيقاف' : 'تفعيل'} هذا الصنف؟`
                : `Are you sure you want to ${selectedCategory?.is_active ? 'deactivate' : 'activate'} this category?`
              }
            </h2>
            <div className="flex gap-3">
              <button
                onClick={confirmToggleStatus}
                className="flex-1 cursor-pointer bg-main hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
              >
                {t('dashboard.additions.yes')}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 cursor-pointer bg-green-100 hover:bg-green-200 text-main py-2 rounded-lg font-medium transition"
              >
                {t('dashboard.additions.no')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Additions;