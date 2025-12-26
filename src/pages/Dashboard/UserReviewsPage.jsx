import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';
import { Star, User } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const UserReviewsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to get from location state first, otherwise fetch
        if (location.state?.reviews) {
          setReviews(location.state.reviews);
        } else {
          const response = await adminAPI.get(`/users/${userId}`);
          setReviews(response.data?.data?.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, location.state]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(reviews.length / itemsPerPage), [reviews.length, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  const paginatedReviews = useMemo(() => reviews.slice(startIndex, endIndex), [reviews, startIndex, endIndex]);

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
              عرض {startIndex + 1} - {Math.min(endIndex, reviews.length)} من {reviews.length}
            </>
          ) : (
            <>
              Showing {startIndex + 1} - {Math.min(endIndex, reviews.length)} of {reviews.length}
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

  const calculateOverallRating = (review) => {
    const ratings = [
      review.rating_honest || 0,
      review.rating_easy_to_deal_with || 0,
      review.rating_product_quality || 0
    ].filter(r => r > 0);
    
    if (ratings.length === 0) return 0;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-main">
          {isRTL ? 'مراجعات المستخدم' : 'User Reviews'}
        </h1>
        <button
          onClick={() => navigate(`/dashboard/accounts/update-account/${userId}`)}
          className="bg-white text-main px-4 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-arrow-right"></i>
          <span>{isRTL ? 'رجوع' : 'Back'}</span>
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
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
              
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Green Header */}
                  <div className="bg-main h-35 px-4 py-7 box-border flex items-start justify-start gap-4">
                  <div className="w-13 h-13 rounded-full bg-white flex items-center justify-center flex-shrink-0">
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
                    <div>
                      <h3 className="text-white font-semibold text-base">
                        {reviewerName}
                      </h3>
                      <p className="text-white/90 text-xs mt-0.5">
                        {formatDate(review.created_at)}
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
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default UserReviewsPage;

