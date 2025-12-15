import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCachedSubCategories, userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import Categories from "../../components/Categories/Categories";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";

const AddAds = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const currentLang = localStorage.getItem('i18nextLng') || 'ar';
    const isRTL = currentLang === 'ar';

    const [showForm, setShowForm] = useState(false);
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
    const [dataLoading, setDataLoading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");
        if (categoryFromUrl) {
            setFormData((prev) => ({ ...prev, category_id: categoryFromUrl }));
            setShowForm(true);
            loadInitialData(categoryFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        if (formData.category_id) {
            loadSubCategories(formData.category_id);
            loadCategoryAttributes(formData.category_id);
        }
    }, [formData.category_id]);

    const loadInitialData = async (categoryId) => {
        setDataLoading(true);
        setError(null);
        try {
            const userData = JSON.parse(localStorage.getItem("userData"));
            const country_id = userData.country?.id;

            const [categoriesRes, governoratesRes] = await Promise.all([
                userAPI.get("/categories"),
                userAPI.get(`/governorates?country_id=${country_id}`),
            ]);

            const categoriesData = categoriesRes?.data?.data || categoriesRes?.data?.categories;
            const governoratesData = governoratesRes?.data?.data?.governorates;

            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setGovernorates(Array.isArray(governoratesData) ? governoratesData : []);

            if (categoryId) {
                loadSubCategories(categoryId);
                loadCategoryAttributes(categoryId);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setError(isRTL ? "حدث خطأ في تحميل البيانات" : "Error loading data");
            setCategories([]);
            setGovernorates([]);
        } finally {
            setDataLoading(false);
        }
    };

    const loadSubCategories = async (categoryId) => {
        try {
            const { data, fromCache } = await getCachedSubCategories(categoryId);
            console.log(fromCache ? '📦 SubCategories من الكاش' : '🌐 SubCategories من API');
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
            console.log('Category Attributes:', attributes);
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

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const renderAttributeInput = (attribute) => {
        const value = formData.attributes[attribute.name_en] || '';
        const label = isRTL ? attribute.name_ar : attribute.name_en;

        if (attribute.name_en === 'image') {
            return null;
        }

        if (attribute.name_en === 'governorate_id') {
            const governorateOptions = [
                { value: "", label: isRTL ? 'اختر المحافظة' : 'Select Governorate' },
                ...governorates.map(gov => ({
                    value: gov.id.toString(),
                    label: isRTL ? gov.name_ar : gov.name_en
                }))
            ];

            return (
                <div key={attribute.id}>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">{label}</label>
                    <CustomSelect
                        options={governorateOptions}
                        value={value}
                        onChange={(val) => handleAttributeChange(attribute.name_en, val)}
                        placeholder={isRTL ? 'اختر المحافظة' : 'Select Governorate'}
                        isRTL={isRTL}
                        required
                    />
                </div>
            );
        }

        if (attribute.name_en === 'sub_category_id') {
            const subCategoryOptions = [
                { value: "", label: isRTL ? 'اختر النوع' : 'Select Type' },
                ...subCategories.map(sub => ({
                    value: sub.id.toString(),
                    label: isRTL ? sub.name_ar : sub.name_en
                }))
            ];

            return (
                <div key={attribute.id}>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">{label}</label>
                    <CustomSelect
                        options={subCategoryOptions}
                        value={formData.sub_category_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, sub_category_id: val }))}
                        placeholder={isRTL ? 'اختر النوع' : 'Select Type'}
                        isRTL={isRTL}
                        required
                        disabled={!formData.category_id}
                    />
                </div>
            );
        }

        if (attribute.type === 'dropdown' && attribute.options && attribute.options.length > 0) {
            const dropdownOptions = [
                { value: "", label: isRTL ? 'اختر' : 'Select' },
                ...attribute.options.map(option => ({
                    value: option.value,
                    label: isRTL ? option.label_ar : option.label_en
                }))
            ];

            return (
                <div key={attribute.id}>
                    <label className="block text-gray-700 font-medium mb-2 text-sm">{label}</label>
                    <CustomSelect
                        options={dropdownOptions}
                        value={value}
                        onChange={(val) => handleAttributeChange(attribute.name_en, val)}
                        placeholder={isRTL ? 'اختر' : 'Select'}
                        isRTL={isRTL}
                    />
                </div>
            );
        }

        if (attribute.name_en.includes('description')) {
            return (
                <div key={attribute.id} className="lg:col-span-2">
                    <label className="block text-gray-700 font-medium mb-2 text-sm">{label}</label>
                    <textarea
                        value={value}
                        onChange={(e) => handleAttributeChange(attribute.name_en, e.target.value)}
                        rows="2"
                        placeholder={label}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                </div>
            );
        }

        return (
            <div key={attribute.id}>
                <label className="block text-gray-700 font-medium mb-2 text-sm">{label}</label>
                <input
                    type={attribute.name_en === 'price' || attribute.name_en === 'quantity' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => handleAttributeChange(attribute.name_en, e.target.value)}
                    placeholder={label}
                    min={attribute.name_en === 'price' || attribute.name_en === 'quantity' ? '0' : undefined}
                    step={attribute.name_en === 'price' ? '0.01' : undefined}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-transparent"
                />
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.images.length === 0) {
            showToast(
                isRTL ? 'يجب إضافة صورة واحدة على الأقل' : 'Please add at least one image',
                'error'
            );
            return;
        }
        
        setLoading(true);

        try {
            const dataToSend = new FormData();

            dataToSend.append("category_id", formData.category_id);
            dataToSend.append("sub_category_id", formData.sub_category_id);

            Object.keys(formData.attributes).forEach(key => {
                if (formData.attributes[key]) {
                    dataToSend.append(key, formData.attributes[key]);
                }
            });

            formData.images.forEach((image, index) => {
                dataToSend.append(`images[${index}]`, image);
            });

            await userAPI.post("/products", dataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            showToast(isRTL ? 'تم نشر الإعلان بنجاح!' : 'Ad published successfully!', 'success');
            setTimeout(() => {
                navigate("/ads");
            }, 1500);
        } catch (error) {
            console.error("Error creating product:", error);
            console.error("Error response:", error.response?.data);
            
            const validationErrors = error.response?.data?.errors;
            let errorMessage = '';
            
            if (validationErrors) {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstError = validationErrors[firstErrorKey];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
                errorMessage = isRTL ? 'حدث خطأ أثناء نشر الإعلان' : 'Error publishing ad';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!showForm) {
        return <Categories mode="create-ad" />;
    }

    if (dataLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-600 text-center mb-4 text-base font-medium">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            loadInitialData(formData.category_id);
                        }}
                        className="w-full bg-main text-white py-3 px-4 rounded-lg hover:bg-green-700 text-sm font-semibold transition"
                    >
                        {isRTL ? "إعادة المحاولة" : "Retry"}
                    </button>
                </div>
            </div>
        );
    }

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
        <div className={`w-full max-w-5xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"} px-4 sm:px-6`} dir={isRTL ? "rtl" : "ltr"}>
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

            <div className="text-main text-center py-6">
                <h1 className="text-2xl sm:text-3xl font-bold">{t("ads.publishYourAd")}</h1>
            </div>

            <form onSubmit={handleSubmit} className="pb-6 space-y-6">
                {/* Images Upload */}
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            id="images-upload"
                        />
                        <label htmlFor="images-upload" className="cursor-pointer block">
                            <div className="flex flex-col items-center">
                                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3" />
                                <p className="text-gray-600 font-medium mb-1 text-sm sm:text-base">
                                    {isRTL ? 'اضغط لإضافة صور' : 'Click to add images'}
                                </p>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                    {isRTL ? 'يمكنك اختيار أكثر من صورة' : 'You can select multiple images'}
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Display Image Previews */}
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img 
                                        src={preview} 
                                        alt={`Preview ${index + 1}`} 
                                        className="w-full h-28 sm:h-32 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-2 left-2 bg-main text-white text-[10px] sm:text-xs px-2 py-1 rounded font-medium">
                                            {isRTL ? 'رئيسية' : 'Main'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                        {leftColumnAttrs.map(attr => renderAttributeInput(attr))}
                    </div>
                    
                    <div className="space-y-4">
                        {rightColumnAttrs.map(attr => renderAttributeInput(attr))}
                    </div>
                    
                    {descriptionAttrs.map(attr => renderAttributeInput(attr))}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-semibold py-3 sm:py-3.5 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg"
                >
                    {loading ? (isRTL ? "جاري النشر..." : "Publishing...") : t("ads.publish")}
                </button>
            </form>
        </div>
    );
};

export default AddAds;