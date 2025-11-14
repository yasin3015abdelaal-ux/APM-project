import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';

const EditAds = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';

    const [formData, setFormData] = useState({
        category_id: '',
        sub_category_id: '',
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        image: null,
        gender: '',
        quantity: '',
        price: '',
        age: '',
        weight: '',
        delivery_available: false,
        governorate_id: '',
        location: '',
        needs_vaccinations: false,
        retail_sale_available: false,
        price_negotiable: false,
        contact_method: ''
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, [id]);

    useEffect(() => {
        if (formData.category_id) {
            loadSubCategories(formData.category_id);
        }
    }, [formData.category_id]);

    const loadInitialData = async () => {
        setDataLoading(true);
        setError(null);
        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const country_id = userData.country?.id;

            const [productRes, categoriesRes, governoratesRes] = await Promise.all([
                userAPI.get(`/products/${id}`),
                userAPI.get('/categories'),
                userAPI.get(`/governorates?country_id=${country_id}`)
            ]);

            console.log('Product:', productRes.data);
            console.log('Categories:', categoriesRes.data);
            console.log('Governorates:', governoratesRes.data.data.governorates);

            const productData = productRes?.data?.data || productRes?.data;
            const categoriesData = categoriesRes?.data?.data || categoriesRes?.data?.categories;
            const governoratesData = governoratesRes?.data?.data?.governorates;

            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            setGovernorates(Array.isArray(governoratesData) ? governoratesData : []);

            // Set form data from product
            if (productData) {
                setFormData({
                    category_id: productData.category_id || '',
                    sub_category_id: productData.sub_category_id || '',
                    name_ar: productData.name_ar || '',
                    name_en: productData.name_en || '',
                    description_ar: productData.description_ar || '',
                    description_en: productData.description_en || '',
                    image: null,
                    gender: productData.gender || '',
                    quantity: productData.quantity || '',
                    price: productData.price || '',
                    age: productData.age || '',
                    weight: productData.weight || '',
                    delivery_available: productData.delivery_available || false,
                    governorate_id: productData.governorate_id || '',
                    location: productData.location || '',
                    needs_vaccinations: productData.needs_vaccinations || false,
                    retail_sale_available: productData.retail_sale_available || false,
                    price_negotiable: productData.price_negotiable || false,
                    contact_method: productData.contact_method || ''
                });

                if (productData.image) {
                    setImagePreview(productData.image);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('حدث خطأ في تحميل البيانات');
            setCategories([]);
            setGovernorates([]);
        } finally {
            setDataLoading(false);
        }
    };

    const loadSubCategories = async (categoryId) => {
        try {
            const res = await userAPI.get(`/subcategories/${categoryId}`);
            console.log('SubCategories:', res.data);
            const subCategoriesData = res?.data?.data || res?.data?.subcategories;
            setSubCategories(Array.isArray(subCategoriesData) ? subCategoriesData : []);
        } catch (error) {
            console.error('Error loading subcategories:', error);
            setSubCategories([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSend = new FormData();

            // Required fields
            dataToSend.append('category_id', formData.category_id);
            dataToSend.append('sub_category_id', formData.sub_category_id);
            dataToSend.append('name_ar', formData.name_ar || '');
            dataToSend.append('name_en', formData.name_en || '');
            dataToSend.append('description_ar', formData.description_ar || '');
            dataToSend.append('description_en', formData.description_en || '');
            dataToSend.append('gender', formData.gender);
            dataToSend.append('quantity', formData.quantity);
            dataToSend.append('price', formData.price);
            dataToSend.append('age', formData.age);
            dataToSend.append('governorate_id', formData.governorate_id);
            dataToSend.append('location', formData.location);
            dataToSend.append('contact_method', formData.contact_method);

            // Boolean fields
            dataToSend.append('delivery_available', formData.delivery_available ? '1' : '0');
            dataToSend.append('needs_vaccinations', formData.needs_vaccinations ? '1' : '0');
            dataToSend.append('retail_sale_available', formData.retail_sale_available ? '1' : '0');
            dataToSend.append('price_negotiable', formData.price_negotiable ? '1' : '0');

            // Image - only if new image was selected
            if (formData.image instanceof File) {
                dataToSend.append('image', formData.image);
            }

            await userAPI.put(`/products/${id}`, dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert(t('ads.updateSuccess') || 'تم تعديل الإعلان بنجاح!');
            navigate('/ads');
        } catch (error) {
            console.error('Error updating product:', error);
            alert(error.response?.data?.message || t('ads.updateError') || 'حدث خطأ أثناء تعديل الإعلان');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await userAPI.delete(`/products/${id}`);
            alert(t('ads.deleteSuccess') || 'تم حذف الإعلان بنجاح!');
            navigate('/ads');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(error.response?.data?.message || t('ads.deleteError') || 'حدث خطأ أثناء حذف الإعلان');
        }
        setShowDeleteConfirm(false);
    };

    // Loading state
    if (dataLoading) {
        return <Loader />;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-600 text-center mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            loadInitialData();
                        }}
                        className="w-full bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                        {isRTL ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-5xl mx-auto bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="text-main text-center py-4 rounded-t-lg">
                <h1 className="text-3xl font-bold">{t('ads.editYourAd')}</h1>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6">
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload-edit"
                    />
                    <label htmlFor="image-upload-edit" className="cursor-pointer block">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                <p className="text-gray-600 mb-2">{t('ads.clickToUpload')}</p>
                                <p className="text-gray-400 text-sm">{t('ads.pngOrJpg') || 'PNG or JPG'}</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Type */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                {t('ads.type')}{' '}
                                {categories.find((cat) => cat.id == formData.category_id)?.[
                                    isRTL ? 'name_ar' : 'name_en'
                                ]}
                            </label>
                            <select
                                name="sub_category_id"
                                value={formData.sub_category_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.category_id}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 bg-main text-white disabled:text-gray-500"
                            >
                                <option value="">{t('ads.selectAdType')}</option>
                                {Array.isArray(subCategories) &&
                                    subCategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {isRTL ? sub.name_ar : sub.name_en}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Ad Name Arabic */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.adNameAr')}</label>
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

                        {/* Ad Name English */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.adNameEn')}</label>
                            <input
                                type="text"
                                name="name_en"
                                value={formData.name_en}
                                onChange={handleChange}
                                placeholder={t('ads.adNamePlaceholderEn')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.age')}</label>
                            <input
                                type="text"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                required
                                placeholder={t('ads.agePlaceholder')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.location')}</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder={t('ads.locationPlaceholder')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.price')}</label>
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

                        {/* Quantity */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.quantity')}</label>
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

                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Gender */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.gender')}</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{t('ads.male')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{t('ads.female')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="both"
                                        checked={formData.gender === 'both'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{t('ads.both')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Description Arabic */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.descriptionAr')}</label>
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

                        {/* Description English */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.descriptionEn')}</label>
                            <textarea
                                name="description_en"
                                value={formData.description_en}
                                onChange={handleChange}
                                rows="3"
                                placeholder={t('ads.descriptionPlaceholderEn')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Governorate */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">{t('ads.governorate')}</label>
                            <select
                                name="governorate_id"
                                value={formData.governorate_id}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-main text-white"
                            >
                                <option value="">{t('ads.selectGovernorate')}</option>
                                {Array.isArray(governorates) &&
                                    governorates.map((gov) => (
                                        <option key={gov.id} value={gov.id}>
                                            {isRTL ? gov.name_ar : gov.name_en}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Contact Method */}
                        <div className="flex items-center gap-6 rounded-lg">
                            <h3 className="text-gray-700 font-medium whitespace-nowrap">{t('ads.contactMethod')}</h3>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="contact_method"
                                        value="phone"
                                        checked={formData.contact_method === 'phone'}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-main border-gray-300 focus:ring-green-500"
                                    />
                                    <span className="text-gray-700">{t('ads.call')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="contact_method"
                                        value="whatsapp"
                                        checked={formData.contact_method === 'whatsapp'}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-main border-gray-300 focus:ring-green-500"
                                    />
                                    <span className="text-gray-700">{t('ads.whatsapp')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="contact_method"
                                        value="both"
                                        checked={formData.contact_method === 'both'}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-main border-gray-300 focus:ring-green-500"
                                    />
                                    <span className="text-gray-700">{t('ads.both')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Delivery Available */}
                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">
                                {t('ads.deliveryAvailable')}
                            </label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="delivery_available"
                                        value="true"
                                        checked={formData.delivery_available === true}
                                        onChange={() => setFormData((prev) => ({ ...prev, delivery_available: true }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'نعم' : 'Yes'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="delivery_available"
                                        checked={formData.delivery_available === false}
                                        onChange={() => setFormData((prev) => ({ ...prev, delivery_available: false }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'لا' : 'No'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Needs Vaccinations */}
                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">
                                {t('ads.needsVaccinations')}
                            </label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="needs_vaccinations"
                                        value="true"
                                        checked={formData.needs_vaccinations === true}
                                        onChange={() => setFormData((prev) => ({ ...prev, needs_vaccinations: true }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'نعم' : 'Yes'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="needs_vaccinations"
                                        checked={formData.needs_vaccinations === false}
                                        onChange={() => setFormData((prev) => ({ ...prev, needs_vaccinations: false }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'لا' : 'No'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Retail Sale Available */}
                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">
                                {t('ads.retailSaleAvailable')}
                            </label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retail_sale_available"
                                        value="true"
                                        checked={formData.retail_sale_available === true}
                                        onChange={() => setFormData((prev) => ({ ...prev, retail_sale_available: true }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'نعم' : 'Yes'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retail_sale_available"
                                        checked={formData.retail_sale_available === false}
                                        onChange={() => setFormData((prev) => ({ ...prev, retail_sale_available: false }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'لا' : 'No'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Price Negotiable */}
                        <div className="flex items-center gap-6 mb-4">
                            <label className="text-gray-700 font-medium whitespace-nowrap w-40">
                                {t('ads.priceNegotiable')}
                            </label>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="price_negotiable"
                                        value="true"
                                        checked={formData.price_negotiable === true}
                                        onChange={() => setFormData((prev) => ({ ...prev, price_negotiable: true }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'نعم' : 'Yes'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="price_negotiable"
                                        checked={formData.price_negotiable === false}
                                        onChange={() => setFormData((prev) => ({ ...prev, price_negotiable: false }))}
                                        className="w-4 h-4 text-main"
                                    />
                                    <span>{isRTL ? 'لا' : 'No'}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-main hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                    >
                        {loading ? (isRTL ? 'جاري التعديل...' : 'Updating...') : t('ads.update')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-white hover:bg-red-50 text-red-600 font-bold py-4 px-6 rounded-lg border-2 border-red-600 transition-colors text-lg"
                    >
                        {t('ads.delete')}
                    </button>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{t('ads.deleteConfirmTitle')}</h3>
                            <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">{t('ads.deleteConfirmMessage')}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                {t('ads.yes')}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                {t('ads.no')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditAds;