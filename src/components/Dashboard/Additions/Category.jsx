import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { adminAPI } from '../../../api';
import Loader from '../../Ui/Loader/Loader';

const Category = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { categoryId } = useParams();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [newSubCategoryNameAr, setNewSubCategoryNameAr] = useState('');
    const [newSubCategoryNameEn, setNewSubCategoryNameEn] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [subCategories, setSubCategories] = useState([]);
    const [categoryName, setCategoryName] = useState({ ar: '', en: '' });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    // Fetch category details and subcategories
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const allCategoriesResponse = await adminAPI.get('/categories');
                const allCategories = allCategoriesResponse.data.data || allCategoriesResponse.data;
                const currentCategory = allCategories.find(cat => cat.id === parseInt(categoryId));
                
                if (currentCategory) {
                    setCategoryName({
                        ar: currentCategory.name_ar,
                        en: currentCategory.name_en
                    });
                }
                
                const subCategoriesResponse = await adminAPI.get(`/subcategories?category_id=${categoryId}`);
                setSubCategories(subCategoriesResponse.data.data || subCategoriesResponse.data);
                
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) {
            fetchData();
        }
    }, [categoryId]);

    const handleAddSubCategory = async () => {
        if (newSubCategoryNameAr.trim() && newSubCategoryNameEn.trim()) {
            try {
                const response = await adminAPI.post('/subcategories', {
                    category_id: parseInt(categoryId),
                    name_ar: newSubCategoryNameAr,
                    name_en: newSubCategoryNameEn
                });

                setSubCategories([...subCategories, response.data.data || response.data]);
                
                setNewSubCategoryNameAr('');
                setNewSubCategoryNameEn('');
                setShowAddModal(false);
                setSuccessMessage(t('dashboard.additions.subCategoryAdded'));
                showToast(successMessage);
            } catch (error) {
                console.error('Error adding subcategory:', error);
                showToast(isRTL ? 'حدث خطأ أثناء إضافة الفئة الفرعية' : 'Error adding subcategory');
            }
        }
    };

    // Temporarily disabled until API is ready
    // const handleStopSubCategory = (subCategory) => {
    //     setSelectedSubCategory(subCategory);
    //     setShowConfirmModal(true);
    // };

    // const confirmStop = async () => {
    //     try {
    //         await adminAPI.put(`/subcategories/${selectedSubCategory.id}`, { is_active: false });
            
    //         setSubCategories(subCategories.map(sc =>
    //             sc.id === selectedSubCategory.id ? { ...sc, is_active: false } : sc
    //         ));
            
    //         setShowConfirmModal(false);
    //         setSuccessMessage(t('dashboard.additions.successMessage'));
    //         showToast(successMessge)
    //     } catch (error) {
    //         console.error('Error stopping subcategory:', error);
    //    showToast(isRTL ? 'حدث خطأ أثناء إيقاف الفئة' : 'Error stopping subcategory');
    //     }
    // };

    if (loading) {
        return (
            <Loader />
        );
    }

    return (
        <div className="min-h-screen relative" dir={isRTL ? 'rtl' : 'ltr'}>
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
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-main">
                    {(isRTL ? categoryName.ar : categoryName.en)}
                </h1>
            </div>

            {/* SubCategories List */}
            <div className="">
                {subCategories.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        {isRTL ? 'لا توجد فئات فرعية' : 'No subcategories found'}
                    </div>
                ) : (
                    subCategories.map((subCategory) => (
                        <div
                            key={subCategory.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                        >
                            <span className="text-main font-bold">
                                {isRTL ? subCategory.name_ar : subCategory.name_en}
                            </span>
                            {/* Delete button temporarily disabled until API is ready */}
                            {/* <button
                                onClick={() => handleStopSubCategory(subCategory)}
                                className="cursor-pointer text-main hover:text-green-700 transition"
                            >
                                <Trash2 size={20} />
                            </button> */}
                        </div>
                    ))
                )}
            </div>

            {/* Add Button */}
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-main cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    {t('dashboard.additions.addSubCategory')}
                </button>
            </div>

            {/* Add SubCategory Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-main">
                                {t('dashboard.additions.addSubCategoryTitle')}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewSubCategoryNameAr('');
                                    setNewSubCategoryNameEn('');
                                }}
                                className="cursor-pointer text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('dashboard.additions.subCategoryNameAr')}
                                </label>
                                <input
                                    type="text"
                                    value={newSubCategoryNameAr}
                                    onChange={(e) => setNewSubCategoryNameAr(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('dashboard.additions.subCategoryNameEn')}
                                </label>
                                <input
                                    type="text"
                                    value={newSubCategoryNameEn}
                                    onChange={(e) => setNewSubCategoryNameEn(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    dir="ltr"
                                />
                            </div>

                            <button
                                onClick={handleAddSubCategory}
                                disabled={!newSubCategoryNameAr.trim() || !newSubCategoryNameEn.trim()}
                                className="w-full cursor-pointer bg-main hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('dashboard.additions.addSubCategory')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Stop Modal - Temporarily disabled */}
            {/* {showConfirmModal && (
                <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <h2 className="text-lg font-bold text-main mb-4 text-center">
                            {t('dashboard.additions.confirmStop')}
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmStop}
                                className="flex-1 cursor-pointer bg-main hover:bg-main text-white py-2 rounded-lg font-medium transition"
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
            )} */}
        </div>
    );
};

export default Category;