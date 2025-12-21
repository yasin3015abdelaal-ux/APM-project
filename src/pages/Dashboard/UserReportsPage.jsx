import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import { Flag, Calendar, User as UserIcon, Package, AlertTriangle, XCircle, DollarSign, MapPin } from 'lucide-react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import PlaceholderSVG from '../../assets/PlaceholderSVG';

// Product Image Slider Component
const ProductImageSlider = ({ images, productName, isRTL }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageArray = Array.isArray(images) ? images : images ? [images] : [];

  if (imageArray.length === 0) {
    return (
      <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <PlaceholderSVG />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageArray.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="relative w-full">
      <div className="relative w-full h-64 sm:h-80 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={imageArray[currentImageIndex]}
          alt={`${productName} - ${currentImageIndex + 1}`}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden">
          <PlaceholderSVG />
        </div>

        {imageArray.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition z-10`}
            >
              {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
            </button>
            <button
              onClick={nextImage}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition z-10`}
            >
              {isRTL ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {imageArray.length}
            </div>
          </>
        )}
      </div>

      {imageArray.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {imageArray.map((img, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                currentImageIndex === index
                  ? 'border-main ring-2 ring-main ring-offset-2'
                  : 'border-gray-200 hover:border-main'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const UserReportsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('user_reports'); // 'all', 'user_reports', 'product_reports'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to get from location state first, otherwise fetch
        if (location.state?.reports) {
          setReports(location.state.reports);
        } else {
          const response = await adminAPI.get(`/users/${userId}`);
          setReports(response.data?.data?.reports || []);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, location.state]);

  // Filter reports based on type
  const filteredReports = useMemo(() => {
    if (reportFilter === 'user_reports') {
      return reports.filter(r => !r.product_id || r.product_id === null);
    }
    if (reportFilter === 'product_reports') {
      return reports.filter(r => r.product_id && r.product_id !== null);
    }
    return reports;
  }, [reports, reportFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [reportFilter]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredReports.length / itemsPerPage), [filteredReports.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  const paginatedReports = useMemo(() => filteredReports.slice(startIndex, endIndex), [filteredReports, startIndex, endIndex]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    pages.push(
      <button
        key={1}
        onClick={() => goToPage(1)}
        className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          currentPage === 1
            ? "bg-main text-white"
            : "border border-gray-200 text-gray-700 hover:border-main hover:text-main"
        }`}
      >
        1
      </button>
    );

    if (showEllipsisStart) {
      pages.push(
        <span key="ellipsis-start" className="px-2 text-gray-500">
          ...
        </span>
      );
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            currentPage === i
              ? "bg-main text-white"
              : "border border-gray-200 text-gray-700 hover:border-main hover:text-main"
          }`}
        >
          {i}
        </button>
      );
    }

    if (showEllipsisEnd) {
      pages.push(
        <span key="ellipsis-end" className="px-2 text-gray-500">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            currentPage === totalPages
              ? "bg-main text-white"
              : "border border-gray-200 text-gray-700 hover:border-main hover:text-main"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 bg-white mt-4">
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          {isRTL ? (
            <>
              عرض {startIndex + 1} - {Math.min(endIndex, filteredReports.length)} من {filteredReports.length}
            </>
          ) : (
            <>
              Showing {startIndex + 1} - {Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border transition ${
              currentPage === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-main text-main hover:bg-green-50"
            }`}
            aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
          >
            {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div className="flex gap-1">{pages}</div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border transition ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-main text-main hover:bg-green-50"
            }`}
            aria-label={isRTL ? "الصفحة التالية" : "Next page"}
          >
            {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    );
  };

  const getReasonBadge = (reason) => {
    if (!reason) return null;
    
    const reasonName = isRTL ? reason.name_ar : reason.name_en;
    const typeColor = reason.type === 'seller' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-orange-100 text-orange-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
        {reasonName}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { bg: 'bg-green-100', text: 'text-green-800', label: isRTL ? 'مقبول' : 'Accepted' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: isRTL ? 'مرفوض' : 'Rejected' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: isRTL ? 'قيد المراجعة' : 'Pending' },
      'expired': { bg: 'bg-gray-100', text: 'text-gray-800', label: isRTL ? 'منتهي' : 'Expired' },
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
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleAcceptProduct = async (productId) => {
    try {
      setActionLoading(productId);
      await adminAPI.put(`/products/${productId}/update-status`, { 
        status: 'active' 
      });

      // Update the product in the reports
      setReports(prevReports => 
        prevReports.map(report => 
          report.product && report.product.id === productId
            ? { ...report, product: { ...report.product, status: 'active' } }
            : report
        )
      );

      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, status: 'active' });
      }

      showToast(isRTL ? 'تم قبول المنتج بنجاح' : 'Product accepted successfully', 'success');
    } catch (error) {
      console.error('Error accepting product:', error);
      showToast(isRTL ? 'فشل قبول المنتج' : 'Failed to accept product', 'error');
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

      // Update the product in the reports
      setReports(prevReports => 
        prevReports.map(report => 
          report.product && report.product.id === productId
            ? { ...report, product: { ...report.product, status: 'rejected' } }
            : report
        )
      );

      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, status: 'rejected' });
      }

      showToast(isRTL ? 'تم رفض المنتج بنجاح' : 'Product rejected successfully', 'success');
    } catch (error) {
      console.error('Error rejecting product:', error);
      showToast(isRTL ? 'فشل رفض المنتج' : 'Failed to reject product', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getFilterCount = (filterType) => {
    if (filterType === 'user_reports') {
      return reports.filter(r => !r.product_id || r.product_id === null).length;
    }
    if (filterType === 'product_reports') {
      return reports.filter(r => r.product_id && r.product_id !== null).length;
    }
    return 0;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in`}>
          <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-main">
          {isRTL ? 'بلاغات المستخدم' : 'User Reports'}
        </h1>
        <button
          onClick={() => navigate(`/dashboard/accounts/update-account/${userId}`)}
          className="bg-white text-main px-4 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-arrow-right"></i>
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {[
          { key: 'user_reports', label: isRTL ? 'بلاغات المستخدم' : 'User Reports' },
          { key: 'product_reports', label: isRTL ? 'بلاغات المنتجات' : 'Product Reports' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setReportFilter(key)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              reportFilter === key
                ? 'border-main text-main'
                : 'border-transparent text-gray-600 hover:text-main'
            }`}
          >
            {label} ({getFilterCount(key)})
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {isRTL ? 'لا توجد بلاغات' : 'No reports found'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-15 h-15 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Flag size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {isRTL ? 'بلاغ ' : 'Report '}
                    </h3>
                    {getReasonBadge(report.reason)}
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              {report.reporter && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {isRTL ? 'المُبلغ' : 'Reporter'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {report.reporter.image ? (
                      <img
                        src={report.reporter.image}
                        alt={report.reporter.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                        <UserIcon size={20} className="text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {report.reporter.name}
                      </p>
                      {report.reporter.email && (
                        <p className="text-xs text-gray-600 truncate">
                          {report.reporter.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Info */}
              {report.product && (
                <div 
                  onClick={() => openProductModal(report.product)}
                  className="bg-green-50 rounded-lg p-3 mb-4 cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {isRTL ? 'المنتج المبلغ عنه' : 'Reported Product'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-semibold">
                    {isRTL ? report.product.name_ar : report.product.name_en}
                  </p>
                  {report.product.status && (
                    <div className="mt-2">
                      {getStatusBadge(report.product.status)}
                    </div>
                  )}
                </div>
              )}

              {/* Report Details */}
              {report.details && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {isRTL ? 'تفاصيل البلاغ' : 'Report Details'}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {report.details}
                  </p>
                </div>
              )}

              {/* Report Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                <Calendar size={16} />
                <span>
                  {new Date(report.created_at).toLocaleDateString(
                    isRTL ? 'ar-EG' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </span>
              </div>
            </div>
          ))}
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeProductModal}
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
                onClick={closeProductModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <XCircle size={28} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product Image Slider */}
              <div className="mb-6">
                <ProductImageSlider
                  images={selectedProduct.images || selectedProduct.image}
                  productName={isRTL ? selectedProduct.name_ar : selectedProduct.name_en}
                  isRTL={isRTL}
                />
              </div>

              {/* Product Info - NO USER DATA */}
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
                {(selectedProduct.description_ar || selectedProduct.description_en) && (
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
                  {selectedProduct.category && (
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
                  )}

                  {/* Location */}
                  {selectedProduct.governorate && (
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
                  )}

                  {/* Quantity */}
                  {selectedProduct.quantity && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={18} className="text-main" />
                        <span className="font-medium text-gray-700">
                          {isRTL ? 'الكمية' : 'Quantity'}
                        </span>
                      </div>
                      <p className="text-gray-900">{selectedProduct.quantity}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  {selectedProduct.created_at && (
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
                  )}
                </div>
              </div>

              {/* Accept/Reject Buttons */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200">
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
      )}
    </div>
  );
};

export default UserReportsPage;

