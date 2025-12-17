import React, { useState, useEffect } from 'react';
import { Check, X, Download, XCircle, User, MapPin, Calendar, DollarSign, Package, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
        setCurrentPage(1); // Reset to first page when filter changes
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const goToPage = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

            if (selectedProduct?.id === productId) {
                setSelectedProduct({ ...selectedProduct, status: 'active' });
            }

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

            if (selectedProduct?.id === productId) {
                setSelectedProduct({ ...selectedProduct, status: 'rejected' });
            }

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

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    const navigateToUser = (userId) => {
        window.location.href = `/dashboard/accounts/update-account/${userId}`;
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
        <div className="min-h-screen py-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-full px-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                    {currentProducts.length === 0 ? (
                        <p className="col-span-full text-center text-xl md:text-2xl font-bold min-h-96 flex items-center justify-center text-gray-500">
                            {t('dashboard.products.noProducts')}
                        </p>
                    ) : (
                        currentProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => openProductModal(product)}
                                className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full"
                            >
                                <div className="relative w-full h-48 bg-gray-50 flex-shrink-0">
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
                                    
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'}`}>
                                        {getStatusBadge(product.status)}
                                    </div>
                                </div>

                                <div className="flex flex-col flex-1 p-4">
                                    <h3 className="font-bold text-base mb-2 line-clamp-1">
                                        {isRTL ? product.name_ar : product.name_en}
                                    </h3>

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-grow">
                                        {isRTL ? product.description_ar : product.description_en}
                                    </p>

                                    <div className="mt-auto pt-2 border-t border-gray-100">
                                        <h6 className="font-bold text-lg text-main">
                                            {product.price} {product.country?.currency || (isRTL ? 'جنيه' : 'EGP')}
                                        </h6>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pb-6">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border transition ${
                                currentPage === 1
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-main text-main hover:bg-green-50 cursor-pointer'
                            }`}
                        >
                            {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                const showPage = 
                                    pageNumber === 1 || 
                                    pageNumber === totalPages || 
                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                                if (!showPage && pageNumber === currentPage - 2) {
                                    return <span key={pageNumber} className="px-2 py-1 text-gray-500">...</span>;
                                }
                                if (!showPage && pageNumber === currentPage + 2) {
                                    return <span key={pageNumber} className="px-2 py-1 text-gray-500">...</span>;
                                }
                                if (!showPage) {
                                    return null;
                                }

                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => goToPage(pageNumber)}
                                        className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition ${
                                            currentPage === pageNumber
                                                ? 'bg-main text-white'
                                                : 'border border-gray-200 text-gray-700 hover:border-main hover:text-main cursor-pointer'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border transition ${
                                currentPage === totalPages
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-main text-main hover:bg-green-50 cursor-pointer'
                            }`}
                        >
                            {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>
                )}

                {/* Product Details Modal */}
                {showModal && selectedProduct && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        onClick={closeModal}
                    >
                        <div 
                            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
                            onClick={(e) => e.stopPropagation()}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-main">
                                    {isRTL ? 'تفاصيل المنتج' : 'Product Details'}
                                </h2>
                                <button 
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {/* Product Image */}
                                <div className="mb-6">
                                    <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden">
                                        {selectedProduct.image ? (
                                            <img
                                                src={selectedProduct.image}
                                                alt={isRTL ? selectedProduct.name_ar : selectedProduct.name_en}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <PlaceholderSVG />
                                        )}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="space-y-4">
                                    {/* Name and Status */}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                                {isRTL ? selectedProduct.name_ar : selectedProduct.name_en}
                                            </h3>
                                            {selectedProduct.name_ar !== selectedProduct.name_en && (
                                                <p className="text-sm text-gray-500">
                                                    {isRTL ? selectedProduct.name_en : selectedProduct.name_ar}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(selectedProduct.status)}
                                    </div>

                                    {/* Price */}
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign size={20} className="text-main" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {isRTL ? 'السعر' : 'Price'}
                                            </span>
                                        </div>
                                        <p className="text-3xl font-bold text-main">
                                            {selectedProduct.price} {selectedProduct.country?.currency || (isRTL ? 'جنيه' : 'EGP')}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    {selectedProduct.description && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-900 mb-2">
                                                {isRTL ? 'الوصف' : 'Description'}
                                            </h4>
                                            <p className="text-gray-700 leading-relaxed">
                                                {isRTL ? selectedProduct.description_ar : selectedProduct.description_en}
                                            </p>
                                        </div>
                                    )}

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Category */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package size={18} className="text-main" />
                                                <span className="font-medium text-gray-700">
                                                    {isRTL ? 'الفئة' : 'Category'}
                                                </span>
                                            </div>
                                            <p className="text-gray-900">
                                                {isRTL ? selectedProduct.category?.name_ar : selectedProduct.category?.name_en}
                                            </p>
                                            {selectedProduct.sub_category && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {isRTL ? selectedProduct.sub_category?.name_ar : selectedProduct.sub_category?.name_en}
                                                </p>
                                            )}
                                        </div>

                                        {/* Location */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin size={18} className="text-main" />
                                                <span className="font-medium text-gray-700">
                                                    {isRTL ? 'الموقع' : 'Location'}
                                                </span>
                                            </div>
                                            <p className="text-gray-900">
                                                {isRTL ? selectedProduct.governorate?.name_ar : selectedProduct.governorate?.name_en}
                                            </p>
                                            {selectedProduct.location && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {selectedProduct.location}
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package size={18} className="text-main" />
                                                <span className="font-medium text-gray-700">
                                                    {isRTL ? 'الكمية' : 'Quantity'}
                                                </span>
                                            </div>
                                            <p className="text-gray-900">{selectedProduct.quantity}</p>
                                        </div>

                                        {/* Age */}
                                        {selectedProduct.age && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar size={18} className="text-main" />
                                                    <span className="font-medium text-gray-700">
                                                        {isRTL ? 'العمر' : 'Age'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900">
                                                    {selectedProduct.age} {isRTL ? 'سنوات' : 'years'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Gender */}
                                        {selectedProduct.gender && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User size={18} className="text-main" />
                                                    <span className="font-medium text-gray-700">
                                                        {isRTL ? 'النوع' : 'Gender'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 capitalize">
                                                    {selectedProduct.gender === 'male' ? (isRTL ? 'ذكر' : 'Male') : (isRTL ? 'أنثى' : 'Female')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Created Date */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar size={18} className="text-main" />
                                                <span className="font-medium text-gray-700">
                                                    {isRTL ? 'تاريخ الإضافة' : 'Created At'}
                                                </span>
                                            </div>
                                            <p className="text-gray-900">
                                                {new Date(selectedProduct.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Seller Info */}
                                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <User size={20} className="text-main" />
                                            {isRTL ? 'معلومات البائع' : 'Seller Information'}
                                        </h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => navigateToUser(selectedProduct.user?.id)}
                                                className="text-main hover:text-green-700 font-medium text-lg hover:underline transition"
                                            >
                                                {selectedProduct.user?.name}
                                            </button>
                                            {selectedProduct.user?.email && (
                                                <p className="text-gray-700 flex items-center gap-2">
                                                    <Mail size={16} />
                                                    {selectedProduct.user?.email}
                                                </p>
                                            )}
                                            {selectedProduct.user?.phone && (
                                                <p className="text-gray-700 flex items-center gap-2">
                                                    <Phone size={16} />
                                                    {selectedProduct.user?.phone}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600">
                                                {isRTL ? 'نوع الحساب: ' : 'Account Type: '}
                                                <span className="font-medium capitalize">
                                                    {selectedProduct.user?.type === 'individual' ? (isRTL ? 'فردي' : 'Individual') : (isRTL ? 'شركة' : 'Company')}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleAcceptProduct(selectedProduct.id)}
                                            disabled={actionLoading === selectedProduct.id || selectedProduct.status === 'active'}
                                            className={`flex-1 py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                selectedProduct.status === 'active'
                                                ? 'bg-green-400 text-white cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                            }`}
                                        >
                                            <Check size={20} />
                                            {isRTL ? 'قبول المنتج' : 'Accept Product'}
                                        </button>
                                        <button
                                            onClick={() => handleRejectProduct(selectedProduct.id)}
                                            disabled={actionLoading === selectedProduct.id || selectedProduct.status === 'rejected'}
                                            className={`flex-1 py-3 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                selectedProduct.status === 'rejected'
                                                ? 'bg-red-400 text-white cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                                            }`}
                                        >
                                            <X size={20} />
                                            {isRTL ? 'رفض المنتج' : 'Reject Product'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsReview;