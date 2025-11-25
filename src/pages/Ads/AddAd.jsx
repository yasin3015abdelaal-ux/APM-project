import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminAPI, userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import Categories from "../../components/Categories/Categories";

const AddAds = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isRTL = i18n.language === "ar";

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        category_id: "",
        sub_category_id: "",
        name_ar: "",
        name_en: "",
        description_ar: "",
        description_en: "",
        image: null,
        gender: "",
        quantity: "",
        price: "",
        age: "",
        weight: "",
        delivery_available: "",
        governorate_id: "",
        location: "",
        needs_vaccinations: "",
        retail_sale_available: "",
        price_negotiable: "",
        contact_method: "",
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
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
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setError("حدث خطأ في تحميل البيانات");
            setCategories([]);
            setGovernorates([]);
        } finally {
            setDataLoading(false);
        }
    };

    const loadSubCategories = async (categoryId) => {
        try {
            let res;
            try {
                res = await adminAPI.get(`/subcategories?category_id=${categoryId}`);
            } catch (err) {
                res = await userAPI.get(`/subcategories/${categoryId}`);
            }
            
            const subCategoriesData = res?.data?.data || res?.data?.subcategories || res?.data;
            setSubCategories(Array.isArray(subCategoriesData) ? subCategoriesData : []);
        } catch (error) {
            console.error("Error loading subcategories:", error);
            setSubCategories([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const translateFieldName = (fieldName) => {
        const translations = {
            'category_id': 'الفئة',
            'sub_category_id': 'النوع',
            'name_ar': 'الاسم بالعربية',
            'name_en': 'الاسم بالإنجليزية',
            'description_ar': 'الوصف بالعربية',
            'description_en': 'الوصف بالإنجليزية',
            'gender': 'الجنس',
            'quantity': 'الكمية',
            'price': 'السعر',
            'age': 'العمر',
            'governorate_id': 'المحافظة',
            'location': 'الموقع',
            'contact_method': 'طريقة التواصل',
            'image': 'الصورة'
        };
        return translations[fieldName] || fieldName;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = new FormData();

            dataToSend.append("category_id", formData.category_id);
            dataToSend.append("sub_category_id", formData.sub_category_id);
            dataToSend.append("name_ar", formData.name_ar || "");
            dataToSend.append("name_en", formData.name_en || "");
            dataToSend.append("description_ar", formData.description_ar || "");
            dataToSend.append("description_en", formData.description_en || "");
            dataToSend.append("gender", formData.gender);
            dataToSend.append("quantity", formData.quantity);
            dataToSend.append("price", formData.price);
            dataToSend.append("age", formData.age);
            dataToSend.append("governorate_id", formData.governorate_id);
            dataToSend.append("location", formData.location);
            dataToSend.append("contact_method", formData.contact_method);

            dataToSend.append("delivery_available", formData.delivery_available ? "1" : "0");
            dataToSend.append("needs_vaccinations", formData.needs_vaccinations ? "1" : "0");
            dataToSend.append("retail_sale_available", formData.retail_sale_available ? "1" : "0");
            dataToSend.append("price_negotiable", formData.price_negotiable ? "1" : "0");

            if (formData.image instanceof File) {
                dataToSend.append("image", formData.image);
            }

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
                const errorText = Array.isArray(firstError) ? firstError[0] : firstError;
                
                if (isRTL) {
                    if (errorText.includes('required')) {
                        errorMessage = `حقل ${translateFieldName(firstErrorKey)} مطلوب`;
                    } else if (errorText.includes('invalid')) {
                        errorMessage = `حقل ${translateFieldName(firstErrorKey)} غير صالح`;
                    } else if (errorText.includes('must be')) {
                        errorMessage = `حقل ${translateFieldName(firstErrorKey)} يجب أن يكون صحيحاً`;
                    } else {
                        errorMessage = errorText;
                    }
                } else {
                    errorMessage = errorText;
                }
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
                    <p className="text-red-600 text-center mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            loadInitialData(formData.category_id);
                        }}
                        className="w-full bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                        {isRTL ? "إعادة المحاولة" : "Retry"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-5xl mx-auto bg-white ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
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

            <div className="text-main text-center py-4 rounded-t-lg">
                <h1 className="text-3xl font-bold">{t("ads.publishYourAd")}</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                        {imagePreview ? (
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setImagePreview(null);
                                        setFormData((prev) => ({ ...prev, image: null }));
                                        document.getElementById('image-upload').value = '';
                                    }}
                                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition shadow-lg"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">{t("ads.clickToUpload")}</p>
                                <p className="text-gray-400 text-sm">{t("ads.pngOrJpg") || "PNG or JPG"}</p>
                            </div>
                        )}
                    </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                {t("ads.type")} {categories.find((cat) => cat.id == formData.category_id)?.[isRTL ? "name_ar" : "name_en"]}
                            </label>
                            <select
                                name="sub_category_id"
                                value={formData.sub_category_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.category_id}
                                className="w-full cursor-pointer px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 bg-main text-white disabled:text-gray-500"
                            >
                                <option value="">{t("ads.selectAdType")}</option>
                                {Array.isArray(subCategories) && subCategories.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {isRTL ? sub.name_ar : sub.name_en}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.adNameAr")}</label>
                            <input
                                type="text"
                                name="name_ar"
                                value={formData.name_ar}
                                onChange={handleChange}
                                required
                                placeholder={t('ads.adNamePlaceholderAr')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.adNameEn")}</label>
                            <input
                                type="text"
                                name="name_en"
                                value={formData.name_en}
                                onChange={handleChange}
                                placeholder={t('ads.adNamePlaceholderEn')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.age")}</label>
                            <input
                                type="text"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                required
                                placeholder={t("ads.agePlaceholder")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.location")}</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder={t("ads.locationPlaceholder")}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.price")}</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.quantity")}</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                min="0"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.gender")}</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={handleChange} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{t("ads.male")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={handleChange} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{t("ads.female")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="gender" value="both" checked={formData.gender === "both"} onChange={handleChange} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{t("ads.both")}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.descriptionAr")}</label>
                            <textarea
                                name="description_ar"
                                value={formData.description_ar}
                                onChange={handleChange}
                                required
                                rows="3"
                                placeholder={t('ads.descriptionPlaceholderAr')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.descriptionEn")}</label>
                            <textarea
                                name="description_en"
                                value={formData.description_en}
                                onChange={handleChange}
                                rows="3"
                                placeholder={t('ads.descriptionPlaceholderEn')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t("ads.governorate")}</label>
                            <select
                                name="governorate_id"
                                value={formData.governorate_id}
                                onChange={handleChange}
                                required
                                className="w-full cursor-pointer px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-main text-white"
                            >
                                <option value="">{t("ads.selectGovernorate")}</option>
                                {Array.isArray(governorates) && governorates.map((gov) => (
                                    <option key={gov.id} value={gov.id}>
                                        {isRTL ? gov.name_ar : gov.name_en}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-5 rounded-lg">
                            <h3 className="text-gray-700 font-medium whitespace-nowrap">{t("ads.contactMethod")}</h3>
                            <div className="flex items-center flex-wrap gap-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="contact_method" value="phone" checked={formData.contact_method === "phone"} onChange={handleChange} className="w-5 h-5 text-main border-gray-300 focus:ring-green-500" />
                                    <span className="text-gray-700">{t("ads.call")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="contact_method" value="chat" checked={formData.contact_method === "chat"} onChange={handleChange} className="w-5 h-5 text-main border-gray-300 focus:ring-green-500" />
                                    <span className="text-gray-700">{t("ads.chat")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="contact_method" value="both" checked={formData.contact_method === "both"} onChange={handleChange} className="w-5 h-5 text-main border-gray-300 focus:ring-green-500" />
                                    <span className="text-gray-700">{t("ads.both")}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">{t("ads.deliveryAvailable")}</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="delivery_available" value="true" checked={formData.delivery_available === true} onChange={() => setFormData((prev) => ({ ...prev, delivery_available: true }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "نعم" : "Yes"}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="delivery_available" value="false" checked={formData.delivery_available === false} onChange={() => setFormData((prev) => ({ ...prev, delivery_available: false }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "لا" : "No"}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">{t("ads.needsVaccinations")}</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="needs_vaccinations" value="true" checked={formData.needs_vaccinations === true} onChange={() => setFormData((prev) => ({ ...prev, needs_vaccinations: true }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "نعم" : "Yes"}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="needs_vaccinations" value="false" checked={formData.needs_vaccinations === false} onChange={() => setFormData((prev) => ({ ...prev, needs_vaccinations: false }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "لا" : "No"}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">{t("ads.retailSaleAvailable")}</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="retail_sale_available" value="true" checked={formData.retail_sale_available === true} onChange={() => setFormData((prev) => ({ ...prev, retail_sale_available: true }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "نعم" : "Yes"}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="retail_sale_available" value="false" checked={formData.retail_sale_available === false} onChange={() => setFormData((prev) => ({ ...prev, retail_sale_available: false }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "لا" : "No"}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">{t("ads.priceNegotiable")}</label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="price_negotiable" value="true" checked={formData.price_negotiable === true} onChange={() => setFormData((prev) => ({ ...prev, price_negotiable: true }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "نعم" : "Yes"}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="price_negotiable" value="false" checked={formData.price_negotiable === false} onChange={() => setFormData((prev) => ({ ...prev, price_negotiable: false }))} className="w-4 h-4 cursor-pointer text-main" />
                                    <span>{isRTL ? "لا" : "No"}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer bg-main hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? (isRTL ? "جاري النشر..." : "Publishing...") : t("ads.publish")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAds;