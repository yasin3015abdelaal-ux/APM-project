import { useState, useEffect } from 'react';
import { Upload, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { clearCache, getCachedSubCategories, userAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import CustomSelect from '../../components/Ui/CustomSelect/CustomSelect';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

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

    const isConfirmDisabled = !selectedReason || (selectedReason === "other" && otherReasonText.trim() === "");

    const handleClose = () => {
        setSelectedReason("");
        setOtherReasonText("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isRTL ? 'حذف الإعلان' : 'Delete Ad'}
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-600 text-sm mb-5">
                    {isRTL ? 'الرجاء اختيار سبب حذف الإعلان:' : 'Please select a reason for deletion:'}
                </p>

                <div className="space-y-2 mb-5">
                    {reasons.map((reason) => {
                        const isSelected = selectedReason === reason.value;
                        return (
                            <label key={reason.value} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${isSelected ? `${reason.activeBg} border-2 ${reason.activeBorder}` : `${reason.bgColor} border border-transparent`}`}>
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? reason.activeBorder : "border-gray-300"}`}>
                                    {isSelected && <span className={`w-2.5 h-2.5 rounded-full ${reason.dotColor}`} />}
                                </span>
                                <span className="flex-1 font-medium text-sm">
                                    {isRTL ? reason.labelAr : reason.labelEn}
                                </span>
                                <input type="radio" name="deleteReason" value={reason.value} checked={isSelected} onChange={(e) => handleReasonChange(e.target.value)} className="hidden" />
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
                    <button onClick={handleConfirm} disabled={loading || isConfirmDisabled} className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
                    <button onClick={handleClose} disabled={loading} className="flex-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition disabled:opacity-50">
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const EditAds = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const currentLang = i18n.language || 'ar';
    const isRTL = currentLang === 'ar';

    const [formData, setFormData] = useState({
        category_id: "",
        sub_category_id: "",
        images: [],
        attributes: {}
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        loadInitialData();
    }, [id]);

    useEffect(() => {
        if (formData.category_id) {
            loadSubCategories(formData.category_id);
            loadCategoryAttributes(formData.category_id);
        }
    }, [formData.category_id]);

    const loadInitialData = async () => {
        setDataLoading(true);
        setError(null);
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const country_id = userData.country?.id;

            // جلب بيانات المنتج
            let productRes;
            try {
                productRes = await userAPI.get(`/products/${id}`);
            } catch (err) {
                if (err.response?.status === 404) {
                    throw new Error(isRTL ? 'المنتج غير موجود أو تم حذفه' : 'Product not found or deleted');
                } else if (err.response?.status === 403) {
                    throw new Error(isRTL ? 'ليس لديك صلاحية لتعديل هذا المنتج' : 'You do not have permission to edit this product');
                } else {
                    throw new Error(isRTL ? 'حدث خطأ في تحميل المنتج' : 'Error loading product');
                }
            }

            // جلب الفئات والمحافظات
            const [categoriesRes, governoratesRes] = await Promise.all([
                userAPI.get('/categories'),
                userAPI.get(`/governorates?country_id=${country_id}`)
            ]);

            const productData = productRes?.data?.data || productRes?.data;
            const categoriesData = categoriesRes?.data?.data || categoriesRes?.data?.categories;
            const governoratesData = governoratesRes?.data?.data?.governorates;

            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setGovernorates(Array.isArray(governoratesData) ? governoratesData : []);

            if (productData) {
                const categoryId = productData.category?.id || productData.category_id;
                const subCategoryId = productData.sub_category?.id || productData.sub_category_id;

                // نحمل attributes الفئة أولاً
                if (categoryId) {
                    const attrsResponse = await userAPI.get(`/categories/${categoryId}/attributes`);
                    const attrs = attrsResponse.data?.data || [];
                    setCategoryAttributes(attrs);

                    // بعد ما نجيب الـ attributes، نشوف القيم الموجودة في المنتج
                    const extractedAttributes = {};
                    
                    // نمر على كل attribute ونشوف لو موجود في المنتج
                    attrs.forEach(attr => {
                        const attrName = attr.name_en;
                        if (productData[attrName] !== undefined && productData[attrName] !== null) {
                            // نحول القيم للنوع الصحيح
                            let value = productData[attrName];
                            
                            // لو boolean، نحوله لـ string
                            if (typeof value === 'boolean') {
                                value = value.toString();
                            }
                            
                            extractedAttributes[attrName] = value;
                        }
                    });

                    console.log('Extracted Attributes:', extractedAttributes);

                    // نحمل الـ subcategories
                    await loadSubCategories(categoryId);

                    setFormData({
                        category_id: categoryId || '',
                        sub_category_id: subCategoryId || '',
                        images: [],
                        attributes: extractedAttributes
                    });
                }

                // معالجة الصور
                if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
                    setExistingImages(productData.images);
                } else if (productData.image) {
                    setExistingImages([productData.image]);
                } else {
                    setExistingImages([]);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError(error.message || (isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'));
            setCategories([]);
            setGovernorates([]);
        } finally {
            setDataLoading(false);
        }
    };

    const loadSubCategories = async (categoryId) => {
        try {
            const { data, fromCache } = await getCachedSubCategories(categoryId);
            setSubCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading subcategories:', error);
            setSubCategories([]);
        }
    };

    const loadCategoryAttributes = async (categoryId) => {
        try {
            const response = await userAPI.get(`/categories/${categoryId}/attributes`);
            const attributes = response.data?.data || [];
            setCategoryAttributes(attributes);
        } catch (error) {
            console.error('Error loading category attributes:', error);
            setCategoryAttributes([]);
        }
    };

    const handleAttributeChange = (attributeName, value) => {
        setFormData((prev) => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [attributeName]: value
            }
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 0) {
            const newImages = [...formData.images, ...files];
            setFormData((prev) => ({ ...prev, images: newImages }));

            files.forEach(file => {
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreviews((prev) => [...prev, reader.result]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        e.target.value = '';
    };

    const removeNewImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const renderAttributeInput = (attribute) => {
        const value = formData.attributes[attribute.name_en] || '';
        const label = isRTL ? attribute.name_ar : attribute.name_en;

        // نخفي حقل الصورة
        if (attribute.name_en === 'image') {
            return null;
        }

        // حقل المحافظة
        if (attribute.name_en === 'governorate_id') {
            const governorateOptions = [
                { value: "", label: isRTL ? 'اختر المحافظة' : 'Select Governorate' },
                ...governorates.map(gov => ({
                    value: gov.id.toString(),
                    label: isRTL ? gov.name_ar : gov.name_en
                }))
            ];

            return (
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
                    <CustomSelect
                        options={governorateOptions}
                        value={value.toString()}
                        onChange={(val) => handleAttributeChange(attribute.name_en, val)}
                        placeholder={isRTL ? 'اختر المحافظة' : 'Select Governorate'}
                        isRTL={isRTL}
                        required
                    />
                </div>
            );
        }

        // حقل الفئة الفرعية
        if (attribute.name_en === 'sub_category_id') {
            const subCategoryOptions = [
                { value: "", label: isRTL ? 'اختر النوع' : 'Select Type' },
                ...subCategories.map(sub => ({
                    value: sub.id.toString(),
                    label: isRTL ? sub.name_ar : sub.name_en
                }))
            ];

            return (
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
                    <CustomSelect
                        options={subCategoryOptions}
                        value={formData.sub_category_id.toString()}
                        onChange={(val) => setFormData(prev => ({ ...prev, sub_category_id: val }))}
                        placeholder={isRTL ? 'اختر النوع' : 'Select Type'}
                        isRTL={isRTL}
                        required
                        disabled={!formData.category_id}
                    />
                </div>
            );
        }

        // Dropdown attributes
        if (attribute.type === 'dropdown' && attribute.options && attribute.options.length > 0) {
            const dropdownOptions = [
                { value: "", label: isRTL ? 'اختر' : 'Select' },
                ...attribute.options.map(option => ({
                    value: option.value,
                    label: isRTL ? option.label_ar : option.label_en
                }))
            ];

            return (
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
                    <CustomSelect
                        options={dropdownOptions}
                        value={value.toString()}
                        onChange={(val) => handleAttributeChange(attribute.name_en, val)}
                        placeholder={isRTL ? 'اختر' : 'Select'}
                        isRTL={isRTL}
                    />
                </div>
            );
        }

        // حقول الوصف
        if (attribute.name_en.includes('description')) {
            return (
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
                    <textarea
                        value={value}
                        onChange={(e) => handleAttributeChange(attribute.name_en, e.target.value)}
                        rows="3"
                        placeholder={label}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all hover:border-gray-300"
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                    />
                </div>
            );
        }

        // الحقول العادية
        return (
            <div key={attribute.id} className="w-full">
                <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                    {label}
                </label>
                <input
                    type={attribute.name_en === 'price' || attribute.name_en === 'quantity' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => handleAttributeChange(attribute.name_en, e.target.value)}
                    placeholder={label}
                    min={attribute.name_en === 'price' || attribute.name_en === 'quantity' ? '0' : undefined}
                    step={attribute.name_en === 'price' ? '0.01' : undefined}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-gray-300"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                />
            </div>
        );
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (existingImages.length === 0 && formData.images.length === 0) {
            showToast(isRTL ? 'يجب إضافة صورة واحدة على الأقل' : 'Please add at least one image', 'error');
            return;
        }

        setLoading(true);

        try {
            const dataToSend = new FormData();
            dataToSend.append('_method', 'PUT');

            if (formData.category_id) {
                dataToSend.append("category_id", formData.category_id);
            }

            if (formData.sub_category_id) {
                dataToSend.append("sub_category_id", formData.sub_category_id);
            }

            // إضافة كل الـ attributes
            Object.keys(formData.attributes).forEach(key => {
                const value = formData.attributes[key];
                if (value !== null && value !== undefined && value !== '') {
                    dataToSend.append(key, value);
                }
            });

            // إضافة الصور الجديدة
            formData.images.forEach((image) => {
                dataToSend.append('images[]', image);
            });

            // إضافة الصور الموجودة
            if (existingImages.length > 0) {
                existingImages.forEach((image) => {
                    let imageValue;
                    if (typeof image === 'object' && image !== null) {
                        imageValue = image.id || image.image_id || image.url || image.image_url;
                    } else if (typeof image === 'string') {
                        imageValue = image;
                    }
                    if (imageValue) {
                        dataToSend.append('keep_images[]', imageValue);
                    }
                });
            }

            // طباعة الـ FormData للتأكد
            console.log("=== Data Being Sent ===");
            for (let pair of dataToSend.entries()) {
                console.log(pair[0] + ':', pair[1]);
            }

            const response = await userAPI.post(`/products/${id}`, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Update Response:', response.data);

            showToast(isRTL ? 'تم تعديل الإعلان بنجاح!' : 'Ad updated successfully!', 'success');

            setTimeout(() => {
                navigate('/ads');
            }, 1500);
        } catch (error) {
            console.error("Error updating product:", error);

            const validationErrors = error.response?.data?.errors;
            let errorMessage = '';

            if (validationErrors) {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstError = validationErrors[firstErrorKey];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
                errorMessage = error.response?.data?.message || (isRTL ? 'حدث خطأ أثناء تعديل الإعلان' : 'Error updating ad');
            }

            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (reason) => {
        try {
            await userAPI.delete(`/products/${id}`, {
                data: {
                    reason: reason,
                    other_reason: reason === "other" ? reason : undefined
                }
            });

            showToast(isRTL ? 'تم حذف الإعلان بنجاح' : 'Ad deleted successfully', 'success');
            setTimeout(() => {
                navigate('/ads');
            }, 1500);
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast(isRTL ? 'حدث خطأ أثناء حذف الإعلان' : 'Error deleting ad', 'error');
        }
        setShowDeleteConfirm(false);
    };

    if (dataLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-600 text-center mb-4 text-base font-medium">{error}</p>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/ads')} className="flex-1 cursor-pointer bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-semibold transition">
                            {isRTL ? 'الرجوع للإعلانات' : 'Back to Ads'}
                        </button>
                        <button onClick={() => { setError(null); loadInitialData(); }} className="flex-1 cursor-pointer bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 text-sm font-semibold transition">
                            {isRTL ? 'إعادة المحاولة' : 'Retry'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // تصفية الـ attributes حسب اللغة
    const filteredAttributes = categoryAttributes.filter(attr => {
        const attrName = attr.name_en.toLowerCase();
        if (isRTL) {
            return attrName !== 'name_en' && attrName !== 'description_en';
        } else {
            return attrName !== 'name_ar' && attrName !== 'description_ar';
        }
    });

    const regularAttrs = filteredAttributes.filter(attr => !attr.name_en.includes('description'));
    const descriptionAttrs = filteredAttributes.filter(attr => attr.name_en.includes('description'));

    const leftColumnAttrs = regularAttrs.filter((_, idx) => idx % 2 === 0);
    const rightColumnAttrs = regularAttrs.filter((_, idx) => idx % 2 !== 0);

    return (
        <div className="w-full max-w-5xl mx-auto bg-white px-4 sm:px-6 py-6" dir={isRTL ? "rtl" : "ltr"}>
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

            <div className="text-main text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">{t("ads.editYourAd")}</h1>
            </div>

            <form onSubmit={handleUpdate} className="space-y-8">
                {/* قسم الصور */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {isRTL ? 'صور الإعلان' : 'Ad Images'}
                    </h2>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white hover:border-main transition-colors">
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="images-upload" />
                        <label htmlFor="images-upload" className="cursor-pointer block">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-main" />
                                </div>
                                <p className="text-gray-700 font-semibold mb-2 text-base">
                                    {isRTL ? 'اضغط لإضافة صور' : 'Click to add images'}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {isRTL ? 'يمكنك اختيار أكثر من صورة' : 'You can select multiple images'}
                                </p>
                            </div>
                        </label>
                    </div>

                    {(existingImages.length > 0 || imagePreviews.length > 0) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {existingImages.map((img, index) => {
                                let imageUrl;
                                if (typeof img === 'string') {
                                    imageUrl = img;
                                } else if (typeof img === 'object' && img !== null) {
                                    imageUrl = img.image_url || img.url || img.path || '';
                                }

                                return (
                                    <div key={`existing-${index}`} className="relative group">
                                        <img src={imageUrl} alt={`Existing ${index + 1}`} className="w-full h-32 sm:h-36 object-cover rounded-xl border-2 border-blue-300 shadow-sm group-hover:shadow-md transition-shadow" />
                                        <button type="button" onClick={() => removeExistingImage(index)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition shadow-lg">
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2.5 py-1 rounded-md font-semibold shadow">
                                            {isRTL ? 'موجودة' : 'Existing'}
                                        </div>
                                    </div>
                                );
                            })}

                            {imagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative group">
                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 sm:h-36 object-cover rounded-xl border-2 border-green-400 shadow-sm group-hover:shadow-md transition-shadow" />
                                    <button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition shadow-lg">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute cursor-pointer bottom-2 left-2 bg-green-500 text-white text-xs px-2.5 py-1 rounded-md font-semibold shadow">
                                        {isRTL ? 'جديدة' : 'New'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* قسم البيانات */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">
                        {isRTL ? 'بيانات الإعلان' : 'Ad Details'}
                    </h2>

                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${isRTL ? 'rtl' : 'ltr'}`}>
                        {isRTL ? (
                            <>
                                <div className="space-y-6">
                                    {rightColumnAttrs.map(attr => renderAttributeInput(attr))}
                                </div>
                                <div className="space-y-6">
                                    {leftColumnAttrs.map(attr => renderAttributeInput(attr))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {leftColumnAttrs.map(attr => renderAttributeInput(attr))}
                                </div>
                                <div className="space-y-6">
                                    {rightColumnAttrs.map(attr => renderAttributeInput(attr))}
                                </div>
                            </>
                        )}
                    </div>

                    {descriptionAttrs.length > 0 && (
                        <div className="mt-6 space-y-6">
                            {descriptionAttrs.map(attr => renderAttributeInput(attr))}
                        </div>
                    )}
                </div>

                {/* أزرار التحكم */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button type="submit" disabled={loading} className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        {loading ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isRTL ? 'جاري التعديل...' : 'Updating...'}
                            </span>
                        ) : (
                            t("ads.update")
                        )}
                    </button>

                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-full cursor-pointer bg-white hover:bg-red-50 text-red-600 font-bold py-4 rounded-xl border-2 border-red-600 transition-all text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        {t('ads.delete')}
                    </button>
                </div>
            </form>

            <DeleteConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} isRTL={isRTL} />
        </div>
    );
};

export default EditAds;