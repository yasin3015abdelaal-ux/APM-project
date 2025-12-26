import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import { Flag, Calendar, User as UserIcon, Package, AlertTriangle, XCircle, Trash2, Eye, X, Check, DollarSign, MapPin } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const SellersReportsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]); // Store all reports for frontend filtering
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Filter state: 'product_reports' or 'user_reports'
  const [reportFilter, setReportFilter] = useState('product_reports');
  
  // Reason filter state
  const [selectedReasonId, setSelectedReasonId] = useState('all');
  const [reasons, setReasons] = useState([]);
  
  // Backend pagination states
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 6,
    total: 0,
    last_page: 1,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch reasons when report filter changes
  useEffect(() => {
    fetchReasons();
  }, [reportFilter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    setSelectedReasonId('all');
  }, [reportFilter]);

  useEffect(() => {
    fetchReports();
  }, [reportFilter]);

  const fetchReasons = async () => {
    try {
      const type = reportFilter === 'product_reports' ? 'product' : 'seller';
      const response = await adminAPI.get(`/report-reasons?type=${type}`);
      const reasonsData = response.data?.data || response.data || [];
      setReasons(reasonsData);
    } catch (err) {
      console.error('Error fetching reasons:', err);
      // Use hardcoded reasons as fallback
      if (reportFilter === 'product_reports') {
        setReasons([
          { id: 6, name_ar: "منتج تالف", name_en: "Damaged product", type: "product" },
          { id: 7, name_ar: "وصف خاطئ", name_en: "Wrong description", type: "product" },
          { id: 8, name_ar: "عنصر غير قانوني", name_en: "Illegal item", type: "product" },
          { id: 9, name_ar: "منتج مزيف", name_en: "Fake product", type: "product" },
        ]);
      } else {
        setReasons([
          { id: 1, name_ar: "احتيال", name_en: "Fraud", type: "seller" },
          { id: 2, name_ar: "سلوك غير لائق", name_en: "Inappropriate behavior", type: "seller" },
          { id: 3, name_ar: "سعر غير واقعي", name_en: "Unrealistic price", type: "seller" },
          { id: 4, name_ar: "أخرى", name_en: "Other", type: "seller" },
          { id: 5, name_ar: "تأخير في الشحن", name_en: "Delayed shipping", type: "seller" },
        ]);
      }
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const hasProduct = reportFilter === 'product_reports';
      // Fetch all reports (no pagination) for frontend filtering
      const response = await adminAPI.get('/reports', {
        params: {
          has_product: hasProduct,
        },
      });
      
      // Handle response structure: response.data.data is array, response.data.pagination has pagination info
      const responseData = response.data;
      let reportsData = [];
      if (responseData?.data && Array.isArray(responseData.data)) {
        reportsData = responseData.data;
      } else if (Array.isArray(responseData)) {
        reportsData = responseData;
      }
      
      // Store all reports for frontend filtering
      setAllReports(reportsData);
      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      showToast(
        isRTL ? 'فشل في تحميل البلاغات' : 'Failed to load reports',
        'error'
      );
      setAllReports([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (reportId) => {
    try {
      const response = await adminAPI.get(`/reports/${reportId}`);
      const report = response.data?.data || response.data;
      setSelectedReport(report);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching report details:', err);
      showToast(
        isRTL ? 'فشل في تحميل تفاصيل البلاغ' : 'Failed to load report details',
        'error'
      );
    }
  };

  const handleDeleteClick = (reportId) => {
    setConfirmTargetId(reportId);
    setConfirmAction('delete');
    setConfirmMessage(isRTL ? 'هل أنت متأكد من حذف هذا البلاغ؟' : 'Are you sure you want to delete this report?');
    setShowConfirmModal(true);
  };

  const handleProductActionClick = (productId, action) => {
    setConfirmTargetId(productId);
    setConfirmAction(action);
    setConfirmMessage(
      isRTL 
        ? `هل أنت متأكد من ${action === 'accept' ? 'قبول' : 'رفض'} هذا المنتج؟`
        : `Are you sure you want to ${action === 'accept' ? 'accept' : 'reject'} this product?`
    );
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'delete' && confirmTargetId) {
      setDeletingId(confirmTargetId);
      try {
        await adminAPI.delete(`/reports/${confirmTargetId}`);
        showToast(
          isRTL ? 'تم حذف البلاغ بنجاح' : 'Report deleted successfully',
          'success'
        );
        fetchReports();
      } catch (err) {
        console.error('Error deleting report:', err);
        showToast(
          isRTL ? 'فشل في حذف البلاغ' : 'Failed to delete report',
          'error'
        );
      } finally {
        setDeletingId(null);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmTargetId(null);
        setConfirmMessage('');
      }
    } else if ((confirmAction === 'accept' || confirmAction === 'reject') && confirmTargetId) {
      setActionLoading(`${confirmAction}-${confirmTargetId}`);
      try {
        const endpoint = confirmAction === 'accept' ? 'accept-product' : 'reject-product';
        await adminAPI.post(`/products/${confirmTargetId}/${endpoint}`);
        showToast(
          isRTL 
            ? `تم ${confirmAction === 'accept' ? 'قبول' : 'رفض'} المنتج بنجاح`
            : `Product ${confirmAction === 'accept' ? 'accepted' : 'rejected'} successfully`,
          'success'
        );
        // Update product status in modal
        if (showProductModal && selectedProduct && selectedProduct.id === confirmTargetId) {
          setSelectedProduct(prev => ({
            ...prev,
            status: confirmAction === 'accept' ? 'active' : 'rejected'
          }));
        }
        // Refresh reports to update product status in list
        fetchReports();
      } catch (err) {
        console.error(`Error ${confirmAction}ing product:`, err);
        showToast(
          isRTL 
            ? `فشل في ${confirmAction === 'accept' ? 'قبول' : 'رفض'} المنتج`
            : `Failed to ${confirmAction} product`,
          'error'
        );
      } finally {
        setActionLoading(null);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmTargetId(null);
        setConfirmMessage('');
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmTargetId(null);
    setConfirmMessage('');
  };


  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const goToPage = (page) => {
    const maxPage = filteredPagination.last_page;
    if (page >= 1 && page <= maxPage) {
      setPagination(prev => ({ ...prev, current_page: page }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (filteredPagination.last_page <= 1) return null;

    const pages = [];
    const showEllipsisStart = filteredPagination.current_page > 3;
    const showEllipsisEnd = filteredPagination.current_page < filteredPagination.last_page - 2;

    pages.push(
      <button
        key={1}
        onClick={() => goToPage(1)}
        className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          filteredPagination.current_page === 1
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

    const startPage = Math.max(2, filteredPagination.current_page - 1);
    const endPage = Math.min(filteredPagination.last_page - 1, filteredPagination.current_page + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filteredPagination.current_page === i
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

    if (filteredPagination.last_page > 1) {
      pages.push(
        <button
          key={filteredPagination.last_page}
          onClick={() => goToPage(filteredPagination.last_page)}
          className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filteredPagination.current_page === filteredPagination.last_page
              ? "bg-main text-white"
              : "border border-gray-200 text-gray-700 hover:border-main hover:text-main"
          }`}
        >
          {filteredPagination.last_page}
        </button>
      );
    }

    const startIndex = (filteredPagination.current_page - 1) * filteredPagination.per_page + 1;
    const endIndex = Math.min(filteredPagination.current_page * filteredPagination.per_page, filteredPagination.total);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 bg-white mt-4">
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          {isRTL ? (
            <>
              عرض {startIndex} - {endIndex} من {filteredPagination.total}
            </>
          ) : (
            <>
              Showing {startIndex} - {endIndex} of {filteredPagination.total}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            onClick={() => goToPage(filteredPagination.current_page - 1)}
            disabled={filteredPagination.current_page === 1}
            className={`p-2 rounded-lg border transition ${
              filteredPagination.current_page === 1
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-main text-main hover:bg-green-50"
            }`}
            aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
          >
            {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div className="flex gap-1">{pages}</div>

          <button
            onClick={() => goToPage(filteredPagination.current_page + 1)}
            disabled={filteredPagination.current_page === filteredPagination.last_page}
            className={`p-2 rounded-lg border transition ${
              filteredPagination.current_page === filteredPagination.last_page
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter reports by reason (frontend filtering)
  const filteredReports = useMemo(() => {
    if (selectedReasonId === 'all') {
      return allReports;
    }
    return allReports.filter(report => report.reason?.id === parseInt(selectedReasonId));
  }, [allReports, selectedReasonId]);

  // Frontend pagination for filtered results
  const paginatedReports = useMemo(() => {
    const startIndex = (pagination.current_page - 1) * pagination.per_page;
    const endIndex = startIndex + pagination.per_page;
    return filteredReports.slice(startIndex, endIndex);
  }, [filteredReports, pagination.current_page, pagination.per_page]);

  // Update pagination total based on filtered results
  const filteredPagination = useMemo(() => {
    return {
      ...pagination,
      total: filteredReports.length,
      last_page: Math.ceil(filteredReports.length / pagination.per_page),
    };
  }, [filteredReports.length, pagination]);

  // Reset to page 1 when reason filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, [selectedReasonId]);

  if (loading && reports.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in w-[calc(100%-2rem)] sm:w-auto sm:max-w-md`}>
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold text-sm break-words">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-main">
          {isRTL ? 'بلاغات البائعين' : 'Sellers Reports'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isRTL ? 'جميع البلاغات على البائعين والمنتجات' : 'All reports on sellers and products'}
        </p>
      </div>

      {/* Main Filters */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setReportFilter('product_reports')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
            reportFilter === 'product_reports'
              ? 'bg-main text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isRTL ? 'بلاغات المنتجات' : 'Product Reports'}
        </button>
        <button
          onClick={() => setReportFilter('user_reports')}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
            reportFilter === 'user_reports'
              ? 'bg-main text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isRTL ? 'بلاغات المستخدمين' : 'User Reports'}
        </button>
      </div>

      {/* Reason Filters */}
      {reasons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isRTL ? 'تصفية حسب السبب' : 'Filter by Reason'}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedReasonId('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedReasonId === 'all'
                  ? 'bg-main text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
            {reasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReasonId(reason.id.toString())}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedReasonId === reason.id.toString()
                    ? 'bg-main text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isRTL ? reason.name_ar : reason.name_en}
              </button>
            ))}
          </div>
        </div>
      )}

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
            {paginatedReports.map((report) => {
              const reporter = report.reporter || {};
              const product = report.product;
              
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Header with Report ID and Reason */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">
                        #{report.id}
                      </span>
                      {getReasonBadge(report.reason)}
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="px-4 py-3">
                    <div 
                      className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2"
                      onClick={() => navigate(`/dashboard/accounts/update-account/${reporter.id}`)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        {reporter.image ? (
                          <img
                            src={reporter.image}
                            alt={reporter.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {reporter.name || (isRTL ? 'مستخدم' : 'User')}
                          </h3>
                          <span className="text-xs text-main font-medium">
                            {isRTL ? '(المُبلغ)' : '(Reporter)'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {reporter.email || ''}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {reporter.phone || ''}
                        </p>
                      </div>
                    </div>

                    {/* Seller Info */}
                    {report.seller && (
                      <div 
                        className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -mx-2"
                        onClick={() => navigate(`/dashboard/accounts/update-account/${report.seller.id}`)}
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          {report.seller.image ? (
                            <img
                              src={report.seller.image}
                              alt={report.seller.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {report.seller.name || (isRTL ? 'بائع' : 'Seller')}
                            </h3>
                            <span className="text-xs text-blue-600 font-medium">
                              {isRTL ? '(البائع)' : '(Seller)'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {report.seller.email || ''}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {report.seller.phone || ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Product Info (if exists) */}
                    {product && (
                      <div 
                        className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Package size={16} className="text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            {isRTL ? 'منتج' : 'Product'}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 font-medium truncate">
                          {product.name || (isRTL ? 'منتج' : 'Product')}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {isRTL ? 'انقر للعرض' : 'Click to view'}
                        </p>
                      </div>
                    )}

                    {/* Report Details */}
                    {report.details && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-1">
                          {report.details}
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => fetchReportDetails(report.id)}
                      className="flex-1 bg-main text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      {isRTL ? 'عرض' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(report.id)}
                      disabled={deletingId === report.id}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      {isRTL ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-main sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  {isRTL ? "تفاصيل البلاغ" : "Report Details"}
                </h2>
                <p className="text-white/90 text-xs sm:text-sm mt-1">
                  {isRTL ? "رقم البلاغ" : "Report"} #{selectedReport.id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Reason Badge */}
              <div className="flex items-center justify-center">
                {getReasonBadge(selectedReport.reason)}
              </div>

              {/* Reporter Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-main mb-3 flex items-center gap-2">
                  <UserIcon size={20} />
                  {isRTL ? "معلومات المُبلغ" : "Reporter Information"}
                </h3>
                <div 
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors mb-3"
                  onClick={() => {
                    if (selectedReport.reporter?.id) {
                      navigate(`/dashboard/accounts/update-account/${selectedReport.reporter.id}`);
                      closeModal();
                    }
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        {isRTL ? "الاسم" : "Name"}
                      </label>
                      <p className="text-gray-900 font-semibold text-sm sm:text-base">
                        {selectedReport.reporter?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        {isRTL ? "الكود" : "Code"}
                      </label>
                      <p className="text-gray-900 font-semibold text-sm sm:text-base">
                        {selectedReport.reporter?.code || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        {isRTL ? "البريد الإلكتروني" : "Email"}
                      </label>
                      <p className="text-gray-900 font-semibold text-sm sm:text-base break-all">
                        {selectedReport.reporter?.email || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                        {isRTL ? "رقم الهاتف" : "Phone"}
                      </label>
                      <p className="text-gray-900 font-semibold text-sm sm:text-base direction-ltr">
                        {selectedReport.reporter?.phone || "-"}
                      </p>
                    </div>
                    {selectedReport.reporter?.address && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          {isRTL ? "العنوان" : "Address"}
                        </label>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base">
                          {selectedReport.reporter.address}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-main mt-2 font-medium">
                    {isRTL ? "انقر للانتقال إلى صفحة المستخدم" : "Click to view user account"}
                  </p>
                </div>
              </div>

              {/* Seller Info */}
              {selectedReport.seller && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <UserIcon size={20} />
                    {isRTL ? "معلومات البائع" : "Seller Information"}
                  </h3>
                  <div 
                    className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors mb-3"
                    onClick={() => {
                      if (selectedReport.seller?.id) {
                        navigate(`/dashboard/accounts/update-account/${selectedReport.seller.id}`);
                        closeModal();
                      }
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          {isRTL ? "الاسم" : "Name"}
                        </label>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base">
                          {selectedReport.seller?.name || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          {isRTL ? "الكود" : "Code"}
                        </label>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base">
                          {selectedReport.seller?.code || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          {isRTL ? "البريد الإلكتروني" : "Email"}
                        </label>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base break-all">
                          {selectedReport.seller?.email || "-"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          {isRTL ? "رقم الهاتف" : "Phone"}
                        </label>
                        <p className="text-gray-900 font-semibold text-sm sm:text-base direction-ltr">
                          {selectedReport.seller?.phone || "-"}
                        </p>
                      </div>
                      {selectedReport.seller?.address && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                            {isRTL ? "العنوان" : "Address"}
                          </label>
                          <p className="text-gray-900 font-semibold text-sm sm:text-base">
                            {selectedReport.seller.address}
                          </p>
                        </div>
                      )}
                      {selectedReport.seller?.activity_type && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                            {isRTL ? "نوع النشاط" : "Activity Type"}
                          </label>
                          <p className="text-gray-900 font-semibold text-sm sm:text-base">
                            {isRTL ? selectedReport.seller.activity_type.name_ar : selectedReport.seller.activity_type.name_en}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      {isRTL ? "انقر للانتقال إلى صفحة المستخدم" : "Click to view user account"}
                    </p>
                  </div>
                </div>
              )}

              {/* Product Info (if exists) */}
              {selectedReport.product && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-main mb-3 flex items-center gap-2">
                    <Package size={20} />
                    {isRTL ? "معلومات المنتج" : "Product Information"}
                  </h3>
                  <div 
                    className="bg-blue-50 rounded-lg p-4 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      setSelectedProduct(selectedReport.product);
                      setShowProductModal(true);
                      closeModal();
                    }}
                  >
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      {selectedReport.product.name || (isRTL ? 'منتج' : 'Product')}
                    </p>
                    <p className="text-xs text-blue-600">
                      {isRTL ? 'انقر للعرض' : 'Click to view'}
                    </p>
                  </div>
                </div>
              )}

              {/* Report Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-semibold text-main mb-3">
                  {isRTL ? "تفاصيل البلاغ" : "Report Details"}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {selectedReport.details || (isRTL ? 'لا توجد تفاصيل' : 'No details available')}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    {isRTL ? "تاريخ البلاغ" : "Report Date"}
                  </label>
                  <p className="text-gray-900 font-semibold text-sm sm:text-base">
                    {new Date(selectedReport.created_at).toLocaleString(isRTL ? "ar-EG" : "en-US", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => {
                  setConfirmTargetId(selectedReport.id);
                  setConfirmAction('delete');
                  setConfirmMessage(isRTL ? 'هل أنت متأكد من حذف هذا البلاغ؟' : 'Are you sure you want to delete this report?');
                  setShowConfirmModal(true);
                }}
                className="px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm sm:text-base flex items-center gap-2"
              >
                <Trash2 size={18} />
                {isRTL ? "حذف" : "Delete"}
              </button>
              <button
                onClick={closeModal}
                className="px-4 sm:px-6 py-2 bg-main text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
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
                  images={selectedProduct.images || (selectedProduct.image ? [selectedProduct.image] : [])}
                  productName={isRTL ? selectedProduct.name_ar : selectedProduct.name_en || selectedProduct.name}
                  isRTL={isRTL}
                />
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                {/* Name and Status */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {isRTL ? selectedProduct.name_ar : selectedProduct.name_en || selectedProduct.name}
                    </h3>
                    {selectedProduct.name_ar && selectedProduct.name_en && selectedProduct.name_ar !== selectedProduct.name_en && (
                      <p className="text-sm text-gray-500">
                        {isRTL ? selectedProduct.name_en : selectedProduct.name_ar}
                      </p>
                    )}
                  </div>
                  {selectedProduct.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedProduct.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedProduct.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      selectedProduct.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedProduct.status === 'active' ? (isRTL ? 'نشط' : 'Active') :
                       selectedProduct.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejected') :
                       selectedProduct.status === 'pending' ? (isRTL ? 'قيد الانتظار' : 'Pending') :
                       selectedProduct.status}
                    </span>
                  )}
                </div>

                {/* Price */}
                {selectedProduct.price && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={20} className="text-main" />
                      <span className="text-sm font-medium text-gray-700">
                        {isRTL ? 'السعر' : 'Price'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-main">
                      {selectedProduct.price} {isRTL ? 'جنيه' : 'EGP'}
                    </p>
                  </div>
                )}

                {/* Description */}
                {(selectedProduct.description || selectedProduct.description_ar || selectedProduct.description_en) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {isRTL ? 'الوصف' : 'Description'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {isRTL ? (selectedProduct.description_ar || selectedProduct.description) : (selectedProduct.description_en || selectedProduct.description)}
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
                        {isRTL ? selectedProduct.category.name_ar : selectedProduct.category.name_en}
                      </p>
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
                        {isRTL ? selectedProduct.governorate.name_ar : selectedProduct.governorate.name_en}
                      </p>
                      {selectedProduct.location && (
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedProduct.location}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  {selectedProduct.quantity !== undefined && selectedProduct.quantity !== null && (
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
                        {selectedProduct.age} {isRTL ? 'سنة' : 'years'}
                      </p>
                    </div>
                  )}

                  {/* Gender */}
                  {selectedProduct.gender && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon size={18} className="text-main" />
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
                  {selectedProduct.created_at && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-main" />
                        <span className="font-medium text-gray-700">
                          {isRTL ? 'تاريخ الإضافة' : 'Created At'}
                        </span>
                      </div>
                      <p className="text-gray-900">
                        {new Date(selectedProduct.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Delivery Available */}
                  {selectedProduct.delivery_available !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={18} className="text-main" />
                        <span className="font-medium text-gray-700">
                          {isRTL ? 'التوصيل متاح' : 'Delivery Available'}
                        </span>
                      </div>
                      <p className="text-gray-900">
                        {selectedProduct.delivery_available ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                      </p>
                    </div>
                  )}

                  {/* Price Negotiable */}
                  {selectedProduct.price_negotiable !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-main" />
                        <span className="font-medium text-gray-700">
                          {isRTL ? 'السعر قابل للتفاوض' : 'Price Negotiable'}
                        </span>
                      </div>
                      <p className="text-gray-900">
                        {selectedProduct.price_negotiable ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Accept/Reject Buttons */}
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => handleProductActionClick(selectedProduct.id, 'accept')}
                  disabled={actionLoading === `accept-${selectedProduct.id}` || selectedProduct.status === 'active'}
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
                  onClick={() => handleProductActionClick(selectedProduct.id, 'reject')}
                  disabled={actionLoading === `reject-${selectedProduct.id}` || selectedProduct.status === 'rejected'}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleCancelConfirm}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isRTL ? 'تأكيد الإجراء' : 'Confirm Action'}
              </h3>
              <p className="text-gray-700 mb-6">
                {confirmMessage}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={
                    (confirmAction === 'delete' && deletingId === confirmTargetId) ||
                    ((confirmAction === 'accept' || confirmAction === 'reject') && actionLoading === `${confirmAction}-${confirmTargetId}`)
                  }
                  className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmAction === 'delete' || confirmAction === 'reject'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirmAction === 'delete' 
                    ? (isRTL ? 'حذف' : 'Delete')
                    : confirmAction === 'accept'
                    ? (isRTL ? 'قبول' : 'Accept')
                    : (isRTL ? 'رفض' : 'Reject')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersReportsPage;

