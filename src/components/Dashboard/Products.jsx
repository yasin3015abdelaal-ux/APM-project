import React, { useState, useEffect } from 'react';
import { Check, X, Download } from 'lucide-react';
import { adminAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import { useTranslation } from 'react-i18next';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

const ProductsReview = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, statusFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.get('/products');
            setProducts(response?.data?.data?.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast(t('dashboard.products.messages.loadError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        setFilteredProducts(filtered);
    };

    const handleAcceptProduct = async (productId) => {
        try {
            setActionLoading(productId);
            await adminAPI.put(`/products/${productId}/update-status`, { 
                status: 'active' 
            });

            setProducts(products.map(p =>
                p.id === productId ? { ...p, status: 'active' } : p
            ));

            showToast(t('dashboard.products.messages.acceptSuccess'));
        } catch (error) {
            console.error('Error accepting product:', error);
            showToast(t('dashboard.products.messages.updateError'), 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectProduct = async (productId) => {
        try {
            setActionLoading(productId);
            await adminAPI.put(`/products/${productId}/update-status`, { 
                status: 'rejected' 
            });

            setProducts(products.map(p =>
                p.id === productId ? { ...p, status: 'rejected' } : p
            ));

            showToast(t('dashboard.products.messages.rejectSuccess'));
        } catch (error) {
            console.error('Error rejecting product:', error);
            showToast(t('dashboard.products.messages.updateError'), 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const exportToCSV = () => {
        const getStatusLabel = (status) => {
            const labels = {
                'pending': isRTL ? 'قيد المراجعة' : 'Pending',
                'active': isRTL ? 'مقبول' : 'Accepted',
                'rejected': isRTL ? 'مرفوض' : 'Rejected'
            };
            return labels[status] || status;
        };

        const csvContent = [
            ['ID', 'Name AR', 'Name EN', 'Price', 'Status', 'Category', 'User', 'Date'],
            ...filteredProducts.map(p => [
                p.id,
                p.name_ar,
                p.name_en,
                p.price,
                getStatusLabel(p.status),
                isRTL ? p.category?.name_ar : p.category?.name_en,
                p.user?.name,
                new Date(p.created_at).toLocaleDateString('ar-EG')
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showToast(t('dashboard.products.messages.exportSuccess'));
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'active': { bg: 'bg-green-100', text: 'text-green-800', label: isRTL ? 'مقبول' : 'Accepted' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: isRTL ? 'مرفوض' : 'Rejected' },
            'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: isRTL ? 'قيد المراجعة' : 'Pending' },
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const stats = {
        total: products.length,
        pending: products.filter(p => p.status === 'pending').length,
        active: products.filter(p => p.status === 'active').length,
        rejected: products.filter(p => p.status === 'rejected').length,
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="container mx-auto px-4">
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

                <h3 className="text-2xl text-center font-bold text-main mb-6">
                    {t('dashboard.products.title')}
                </h3>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={exportToCSV}
                        className="bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        {t('dashboard.products.export')}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div 
                        onClick={() => setStatusFilter('all')}
                        className={`p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                            statusFilter === 'all' 
                            ? 'border-main bg-green-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-main hover:shadow-md'
                        }`}
                    >
                        <p className="text-gray-600 text-xs mb-1 font-medium">
                            {t('dashboard.products.stats.totalProducts')}
                        </p>
                        <p className="text-2xl font-bold text-main">{stats.total}</p>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('pending')}
                        className={`p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                            statusFilter === 'pending' 
                            ? 'border-yellow-600 bg-yellow-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-yellow-600 hover:shadow-md'
                        }`}
                    >
                        <p className="text-gray-600 text-xs mb-1 font-medium">
                            {t('dashboard.products.stats.pending')}
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('active')}
                        className={`p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                            statusFilter === 'active' 
                            ? 'border-green-600 bg-green-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-green-600 hover:shadow-md'
                        }`}
                    >
                        <p className="text-gray-600 text-xs mb-1 font-medium">
                            {t('dashboard.products.stats.accepted')}
                        </p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>

                    <div 
                        onClick={() => setStatusFilter('rejected')}
                        className={`p-4 rounded-lg shadow-sm border-2 cursor-pointer transition-all ${
                            statusFilter === 'rejected' 
                            ? 'border-red-600 bg-red-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-red-600 hover:shadow-md'
                        }`}
                    >
                        <p className="text-gray-600 text-xs mb-1 font-medium">
                            {t('dashboard.products.stats.rejected')}
                        </p>
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.length === 0 ? (
                        <p className="col-span-full text-center text-xl md:text-2xl font-bold min-h-96 flex items-center justify-center text-gray-500">
                            {t('dashboard.products.noProducts')}
                        </p>
                    ) : (
                        filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="relative w-full h-48 bg-gray-50">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={isRTL ? product.name_ar : product.name_en}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextElementSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        className={`${product.image ? 'hidden' : 'block'} w-full h-full`}
                                        style={{ display: product.image ? 'none' : 'block' }}
                                    >
                                        <PlaceholderSVG />
                                    </div>
                                    
                                    <div className="absolute top-2 right-2">
                                        {getStatusBadge(product.status)}
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1 p-3">
                                    <h3 className="font-bold text-base mb-2 line-clamp-2 min-h-[3rem]">
                                        {isRTL ? product.name_ar : product.name_en}
                                    </h3>

                                    <div className="space-y-1.5 mb-3 text-xs">
                                        <p className="text-gray-700">
                                            <span className="font-medium">{t('dashboard.products.table.seller')}:</span> <span className="text-main">{product.user?.name || 'N/A'}</span>
                                        </p>

                                        <p className="text-gray-700">
                                            <span className="font-medium">{t('dashboard.products.details.category')}:</span> {isRTL ? product.category?.name_ar : product.category?.name_en}
                                        </p>

                                        {product.sub_category && (
                                            <p className="text-gray-700">
                                                <span className="font-medium">{t('dashboard.products.details.subCategory')}:</span> {isRTL ? product.sub_category?.name_ar : product.sub_category?.name_en}
                                            </p>
                                        )}

                                        <p className="text-gray-700">
                                            <span className="font-medium">{t('dashboard.products.details.governorate')}:</span> {isRTL ? product.governorate?.name_ar : product.governorate?.name_en}
                                        </p>
                                    </div>

                                    {product.description && (
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                            {isRTL ? product.description_ar : product.description_en}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-3 border-t border-gray-100">
                                        <h6 className="font-bold text-lg text-main mb-2">
                                            {product.price} {product.country?.currency || (isRTL ? 'جنيه' : 'EGP')}
                                        </h6>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleAcceptProduct(product.id)}
                                                disabled={actionLoading === product.id || product.status === 'active'}
                                                className={`flex-1 p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    product.status === 'active'
                                                    ? 'bg-green-400 text-white cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                                }`}
                                                title={t('dashboard.products.actions.accept')}
                                            >
                                                <Check size={20} className="mx-auto" />
                                            </button>
                                            <button
                                                onClick={() => handleRejectProduct(product.id)}
                                                disabled={actionLoading === product.id || product.status === 'rejected'}
                                                className={`flex-1 p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    product.status === 'rejected'
                                                    ? 'bg-red-400 text-white cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                                                }`}
                                                title={t('dashboard.products.actions.reject')}
                                            >
                                                <X size={20} className="mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductsReview;