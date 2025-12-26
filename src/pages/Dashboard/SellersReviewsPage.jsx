import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import { Star, User, Trash2, Eye, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SellersReviewsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]); // Store all reviews for frontend filtering/sorting
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  
  // Sort state
  const [sortBy, setSortBy] = useState('date'); // 'date', 'rating', 'seller'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showSellerDropdown, setShowSellerDropdown] = useState(false);
  
  // Frontend pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch all reviews for frontend sorting and pagination
      const response = await adminAPI.get('/reviews', {
        params: {
          per_page: 1000, // Fetch a large number to get all reviews
        },
      });
      
      const data = response.data?.data || response.data;
      let reviewsData = [];
      if (data?.data && Array.isArray(data.data)) {
        reviewsData = data.data;
      } else if (Array.isArray(data)) {
        reviewsData = data;
      }
      
      setAllReviews(reviewsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      showToast(
        isRTL ? 'فشل في تحميل المراجعات' : 'Failed to load reviews',
        'error'
      );
      setAllReviews([]);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewDetails = async (reviewId) => {
    try {
      const response = await adminAPI.get(`/reviews/${reviewId}`);
      const review = response.data?.data || response.data;
      setSelectedReview(review);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching review details:', err);
      showToast(
        isRTL ? 'فشل في تحميل تفاصيل المراجعة' : 'Failed to load review details',
        'error'
      );
    }
  };

  const handleDeleteClick = (reviewId) => {
    setConfirmTargetId(reviewId);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction === 'delete' && confirmTargetId) {
      setDeletingId(confirmTargetId);
      try {
        await adminAPI.delete(`/reviews/${confirmTargetId}`);
        showToast(
          isRTL ? 'تم حذف المراجعة بنجاح' : 'Review deleted successfully',
          'success'
        );
        // Refresh reviews
        fetchReviews();
      } catch (err) {
        console.error('Error deleting review:', err);
        showToast(
          isRTL ? 'فشل في حذف المراجعة' : 'Failed to delete review',
          'error'
        );
      } finally {
        setDeletingId(null);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmTargetId(null);
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmTargetId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  // Helper function to calculate overall rating
  const calculateOverallRating = (review) => {
    const ratings = [
      review.rating_honest || 0,
      review.rating_easy_to_deal_with || 0,
      review.rating_product_quality || 0
    ].filter(r => r > 0);
    
    if (ratings.length === 0) return 0;
    return parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  };

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...allReviews];
    sorted.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'rating') {
        const ratingA = calculateOverallRating(a);
        const ratingB = calculateOverallRating(b);
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      } else if (sortBy === 'seller') {
        const sellerA = (a.seller?.name || a.seller_name || '').toLowerCase();
        const sellerB = (b.seller?.name || b.seller_name || '').toLowerCase();
        if (sortOrder === 'asc') {
          return sellerA.localeCompare(sellerB);
        } else {
          return sellerB.localeCompare(sellerA);
        }
      }
      return 0;
    });
    return sorted;
  }, [allReviews, sortBy, sortOrder]);

  // Frontend pagination
  const totalPages = useMemo(() => Math.ceil(sortedReviews.length / itemsPerPage), [sortedReviews.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  const paginatedReviews = useMemo(() => sortedReviews.slice(startIndex, endIndex), [sortedReviews, startIndex, endIndex]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  const handleSort = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setShowDateDropdown(false);
    setShowRatingDropdown(false);
    setShowSellerDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.sort-dropdown')) {
        setShowDateDropdown(false);
        setShowRatingDropdown(false);
        setShowSellerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              عرض {startIndex + 1} - {Math.min(endIndex, sortedReviews.length)} من {sortedReviews.length}
            </>
          ) : (
            <>
              Showing {startIndex + 1} - {Math.min(endIndex, sortedReviews.length)} of {sortedReviews.length}
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

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={18}
        className={index < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return isRTL ? 'اليوم' : 'Today';
    } else if (diffDays === 1) {
      return isRTL ? 'أمس' : 'Yesterday';
    } else if (diffDays < 7) {
      return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };


  if (loading && allReviews.length === 0) {
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
          {isRTL ? 'مراجعات البائعين' : 'Sellers Reviews'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isRTL ? 'جميع المراجعات على البائعين' : 'All reviews on sellers'}
        </p>
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {isRTL ? 'ترتيب حسب:' : 'Sort by:'}
        </span>
        
        {/* Date Dropdown */}
        <div className="relative sort-dropdown">
          <button
            onClick={() => {
              setShowDateDropdown(!showDateDropdown);
              setShowRatingDropdown(false);
              setShowSellerDropdown(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 min-w-[140px] justify-between ${
              sortBy === 'date'
                ? 'bg-main text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>
              {sortBy === 'date' 
                ? (isRTL 
                    ? (sortOrder === 'desc' ? 'الأحدث' : 'الأقدم')
                    : (sortOrder === 'desc' ? 'Newest' : 'Oldest'))
                : (isRTL ? 'التاريخ' : 'Date')
              }
            </span>
            <ChevronDown size={16} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showDateDropdown && (
            <div className={`absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 ${isRTL ? 'right-0' : 'left-0'}`}>
              <button
                onClick={() => handleSort('date', 'desc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg ${
                  sortBy === 'date' && sortOrder === 'desc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'الأحدث' : 'Newest'}
              </button>
              <button
                onClick={() => handleSort('date', 'asc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg ${
                  sortBy === 'date' && sortOrder === 'asc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'الأقدم' : 'Oldest'}
              </button>
            </div>
          )}
        </div>

        {/* Rating Dropdown */}
        <div className="relative sort-dropdown">
          <button
            onClick={() => {
              setShowRatingDropdown(!showRatingDropdown);
              setShowDateDropdown(false);
              setShowSellerDropdown(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 min-w-[160px] justify-between ${
              sortBy === 'rating'
                ? 'bg-main text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>
              {sortBy === 'rating'
                ? (isRTL 
                    ? (sortOrder === 'desc' ? 'أعلى تقييم' : 'أقل تقييم')
                    : (sortOrder === 'desc' ? 'Highest Rating' : 'Lowest Rating'))
                : (isRTL ? 'التقييم' : 'Rating')
              }
            </span>
            <ChevronDown size={16} className={`transition-transform ${showRatingDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showRatingDropdown && (
            <div className={`absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 ${isRTL ? 'right-0' : 'left-0'}`}>
              <button
                onClick={() => handleSort('rating', 'desc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg ${
                  sortBy === 'rating' && sortOrder === 'desc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'أعلى تقييم' : 'Highest Rating'}
              </button>
              <button
                onClick={() => handleSort('rating', 'asc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg ${
                  sortBy === 'rating' && sortOrder === 'asc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'أقل تقييم' : 'Lowest Rating'}
              </button>
            </div>
          )}
        </div>

        {/* Seller Dropdown */}
        <div className="relative sort-dropdown">
          <button
            onClick={() => {
              setShowSellerDropdown(!showSellerDropdown);
              setShowDateDropdown(false);
              setShowRatingDropdown(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 min-w-[140px] justify-between ${
              sortBy === 'seller'
                ? 'bg-main text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>
              {sortBy === 'seller'
                ? (isRTL 
                    ? (sortOrder === 'asc' ? 'البائع أ-ي' : 'البائع ي-أ')
                    : (sortOrder === 'asc' ? 'Seller A-Z' : 'Seller Z-A'))
                : (isRTL ? 'البائع' : 'Seller')
              }
            </span>
            <ChevronDown size={16} className={`transition-transform ${showSellerDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSellerDropdown && (
            <div className={`absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 ${isRTL ? 'right-0' : 'left-0'}`}>
              <button
                onClick={() => handleSort('seller', 'asc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg ${
                  sortBy === 'seller' && sortOrder === 'asc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'البائع أ-ي' : 'Seller A-Z'}
              </button>
              <button
                onClick={() => handleSort('seller', 'desc')}
                className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg ${
                  sortBy === 'seller' && sortOrder === 'desc' ? 'bg-main text-white hover:bg-main/90' : 'text-gray-700'
                }`}
              >
                {isRTL ? 'البائع ي-أ' : 'Seller Z-A'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {isRTL ? 'لا توجد مراجعات' : 'No reviews found'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReviews.map((review) => {
              const overallRating = calculateOverallRating(review);
              const reviewerName = review.reviewer?.name || review.reviewer_name || (isRTL ? 'مستخدم' : 'User');
              const reviewerImage = review.reviewer?.image;
              const sellerName = review.seller?.name || review.seller_name || (isRTL ? 'بائع' : 'Seller');
              
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Green Header */}
                  <div className="bg-main h-35 px-4 py-7 box-border flex items-start justify-start gap-4">
                    <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center shrink-0">
                      {reviewerImage ? (
                        <img
                          src={reviewerImage}
                          alt={reviewerName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-main" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 
                        className="text-white font-semibold text-base cursor-pointer hover:text-white/90 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (review.reviewer?.id) {
                            navigate(`/dashboard/accounts/update-account/${review.reviewer.id}`);
                          }
                        }}
                      >
                        {reviewerName}
                      </h3>
                      <p className="text-white/90 text-xs mt-0.5">
                        {formatDate(review.created_at)}
                      </p>
                      <p 
                        className="text-white/80 text-xs mt-1 cursor-pointer hover:text-white/70 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (review.seller?.id) {
                            navigate(`/dashboard/accounts/update-account/${review.seller.id}`);
                          }
                        }}
                      >
                        {isRTL ? 'على' : 'on'} <span className="underline">{sellerName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Overall Rating Card */}
                  <div className="px-4 w-[75%] h-20 mx-auto py-3 -mt-10">
                    <div className="bg-white rounded-lg shadow-md p-3 flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-main">
                        {overallRating}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {renderStars(parseFloat(overallRating))}
                      </div>
                    </div>
                  </div>

                  {/* Category Ratings */}
                  <div className="px-4 pb-3 space-y-2.5">
                    {/* Honesty Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm">
                          {isRTL ? "الأمانة" : "Honesty"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {renderStars(review.rating_honest || 0)}
                      </div>
                    </div>

                    {/* Easy to Deal Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm">
                          {isRTL ? "سهولة التعامل" : "Easy to Deal"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {renderStars(review.rating_easy_to_deal_with || 0)}
                      </div>
                    </div>

                    {/* Quality Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium text-sm">
                          {isRTL ? "الجودة" : "Quality"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {renderStars(review.rating_product_quality || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Review Comment */}
                  {review.comment && (
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-1">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => fetchReviewDetails(review.id)}
                      className="flex-1 bg-main text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      {isRTL ? 'عرض' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(review.id)}
                      disabled={deletingId === review.id}
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

      {/* Review Details Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-main sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  {isRTL ? "تفاصيل المراجعة" : "Review Details"}
                </h2>
                <p className="text-white/90 text-xs sm:text-sm mt-1">
                  {isRTL ? "رقم المراجعة" : "Review"} #{selectedReview.id}
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
              {/* Reviewer Info */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-main mb-3 flex items-center gap-2">
                  <User size={20} />
                  {isRTL ? "معلومات المراجع" : "Reviewer Information"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      if (selectedReview.reviewer?.id) {
                        navigate(`/dashboard/accounts/update-account/${selectedReview.reviewer.id}`);
                        closeModal();
                      }
                    }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "الاسم" : "Name"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {selectedReview.reviewer?.name || selectedReview.reviewer_name || "-"}
                    </p>
                    {selectedReview.reviewer?.id && (
                      <p className="text-xs text-main mt-1 font-medium">
                        {isRTL ? "انقر للانتقال إلى صفحة المستخدم" : "Click to view user account"}
                      </p>
                    )}
                  </div>
                  <div 
                    className="bg-blue-50 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                      if (selectedReview.seller?.id) {
                        navigate(`/dashboard/accounts/update-account/${selectedReview.seller.id}`);
                        closeModal();
                      }
                    }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "البائع" : "Seller"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {selectedReview.seller?.name || selectedReview.seller_name || "-"}
                    </p>
                    {selectedReview.seller?.id && (
                      <p className="text-xs text-main mt-1 font-medium">
                        {isRTL ? "انقر للانتقال إلى صفحة المستخدم" : "Click to view user account"}
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      {isRTL ? "تاريخ المراجعة" : "Review Date"}
                    </label>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {new Date(selectedReview.created_at).toLocaleString(isRTL ? "ar-EG" : "en-US", {
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

              {/* Overall Rating */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-main mb-3 flex items-center gap-2">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                  {isRTL ? "التقييم العام" : "Overall Rating"}
                </h3>
                <div className="bg-main/10 rounded-lg p-4 flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold text-main">
                    {calculateOverallRating(selectedReview)}
                  </span>
                  <div className="flex items-center gap-1">
                    {renderStars(parseFloat(calculateOverallRating(selectedReview)))}
                  </div>
                </div>
              </div>

              {/* Category Ratings */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-base sm:text-lg font-semibold text-main mb-3">
                  {isRTL ? "التقييمات التفصيلية" : "Detailed Ratings"}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {isRTL ? "الأمانة" : "Honesty"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedReview.rating_honest || 0)}
                      <span className="text-gray-600 ml-2">({selectedReview.rating_honest || 0})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {isRTL ? "سهولة التعامل" : "Easy to Deal"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedReview.rating_easy_to_deal_with || 0)}
                      <span className="text-gray-600 ml-2">({selectedReview.rating_easy_to_deal_with || 0})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {isRTL ? "الجودة" : "Quality"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedReview.rating_product_quality || 0)}
                      <span className="text-gray-600 ml-2">({selectedReview.rating_product_quality || 0})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment */}
              {selectedReview.comment && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-main mb-3">
                    {isRTL ? "التعليق" : "Comment"}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                      {selectedReview.comment}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => {
                  setConfirmTargetId(selectedReview.id);
                  setConfirmAction('delete');
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleCancelConfirm}>
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
              <p className="text-gray-700 mb-6">
                {confirmAction === 'delete' 
                  ? (isRTL ? 'هل أنت متأكد من حذف هذه المراجعة؟' : 'Are you sure you want to delete this review?')
                  : ''}
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
                  disabled={deletingId === confirmTargetId}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRTL ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersReviewsPage;

