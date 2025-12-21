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
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
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
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
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
                <div key={attribute.id} className="w-full">
                    <label className="block text-gray-700 font-semibold mb-2.5 text-sm">
                        {label}
                    </label>
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
                if (image instanceof File) {
                    dataToSend.append('images[]', image);
                } else {
                    setToast.error(`Image ${index} is not a File object:`, image);
                }
            });

            const response = await userAPI.post("/products", dataToSend);

            console.log("✅ Success Response:", response.data);

            showToast(
                isRTL ? 'سيتم مراجعة إعلانك ونشره!' : 'Your advertisement will be reviewed and published!',
                'success'
            );

            setTimeout(() => {
                navigate("/ads");
            }, 1500);

        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            let errorMessage = '';

            if (validationErrors) {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstError = validationErrors[firstErrorKey];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
                errorMessage = error.response?.data?.message ||
                    (isRTL ? 'حدث خطأ أثناء نشر الإعلان' : 'Error publishing ad');
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
                        className="w-full cursor-pointer bg-main text-white py-3 px-4 rounded-lg hover:bg-green-700 text-sm font-semibold transition"
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
        <div className={`w-full max-w-5xl mx-auto bg-white px-4 sm:px-6 py-6`} dir={isRTL ? "rtl" : "ltr"}>
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
                <h1 className="text-2xl sm:text-3xl font-bold">{t("ads.publishYourAd")}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 rounded-xl p-6 space-y-5">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {isRTL ? 'صور الإعلان' : 'Ad Images'}
                    </h2>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-white hover:border-main transition-colors">
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

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 sm:h-36 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-shadow"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition shadow-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-2 left-2 bg-main text-white text-xs px-2.5 py-1 rounded-md font-semibold shadow">
                                            {isRTL ? 'رئيسية' : 'Main'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-main cursor-pointer hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isRTL ? "جاري النشر..." : "Publishing..."}
                        </span>
                    ) : (
                        t("ads.publish")
                    )}
                </button>
            </form>
        </div>
    );
};

export default AddAds;