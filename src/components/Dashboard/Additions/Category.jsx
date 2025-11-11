import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

const Category = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const { categoryId } = useParams();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newProductNameAr, setNewProductNameAr] = useState('');
    const [newProductNameEn, setNewProductNameEn] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const categoryName = {
        ar: 'الأضحية',
        en: 'Sacrifice'
    };

    const [products, setProducts] = useState([
        { id: 1, nameAr: 'خروف بلدي', nameEn: 'Local Sheep', active: true },
        { id: 2, nameAr: 'خروف صومالي', nameEn: 'Somali Sheep', active: true },
        { id: 3, nameAr: 'خروف سوداني', nameEn: 'Sudanese Sheep', active: true },
        { id: 4, nameAr: 'عجل صغير', nameEn: 'Small Calf', active: true },
        { id: 5, nameAr: 'عجل كبير', nameEn: 'Large Calf', active: true },
        { id: 6, nameAr: 'جمل', nameEn: 'Camel', active: true },
    ]);

    const handleAddProduct = () => {
        if (newProductNameAr.trim() && newProductNameEn.trim()) {
            const newProduct = {
                id: Date.now(),
                nameAr: newProductNameAr,
                nameEn: newProductNameEn,
                active: true
            };
            setProducts([...products, newProduct]);
            setNewProductNameAr('');
            setNewProductNameEn('');
            setShowAddModal(false);
            setSuccessMessage(t('dashboard.additions.productAdded'));
            setShowSuccessModal(true);
        }
    };

    const handleStopProduct = (product) => {
        setSelectedProduct(product);
        setShowConfirmModal(true);
    };

    const confirmStop = () => {
        setProducts(products.map(p =>
            p.id === selectedProduct.id ? { ...p, active: false } : p
        ));
        setShowConfirmModal(false);
        setSuccessMessage(t('dashboard.additions.successMessage'));
        setShowSuccessModal(true);
    };

    return (
        <div className="min-h-screen relative" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-main">
                    {isRTL ? categoryName.ar : categoryName.en}
                </h1>
            </div>

            {/* Products List */}
            <div className="">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition ${!product.active && 'opacity-50 bg-gray-50'
                                }`}
                        >
                            <span className="text-main font-bold">
                                {isRTL ? product.nameAr : product.nameEn}
                            </span>
                            {product.active && (
                                <button
                                    onClick={() => handleStopProduct(product)}
                                    className="cursor-pointer text-sm text-main hover:text-green-700 underline"
                                >
                                    <Trash2 />
                                </button>
                            )}
                        </div>
                    ))}
            </div>
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-main cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    {t('dashboard.additions.addProduct')}
                </button>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-main">
                                {t('dashboard.additions.addProductTitle')}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewProductNameAr('');
                                    setNewProductNameEn('');
                                }}
                                className="cursor-pointer text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('dashboard.additions.productNameAr')}
                                </label>
                                <input
                                    type="text"
                                    value={newProductNameAr}
                                    onChange={(e) => setNewProductNameAr(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('dashboard.additions.productNameEn')}
                                </label>
                                <input
                                    type="text"
                                    value={newProductNameEn}
                                    onChange={(e) => setNewProductNameEn(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    dir="ltr"
                                />
                            </div>

                            <button
                                onClick={handleAddProduct}
                                disabled={!newProductNameAr.trim() || !newProductNameEn.trim()}
                                className="w-full cursor-pointer bg-main hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('dashboard.additions.addProduct')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Stop Modal */}
            {showConfirmModal && (
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
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50 p-4">
                    <div className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className={`cursor-pointer absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1 rounded-full hover:bg-gray-200 transition z-50`}
                        >
                            <X size={18} />
                        </button>

                        <h2 className="text-lg font-bold text-main text-center">
                            {successMessage}
                        </h2>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Category;