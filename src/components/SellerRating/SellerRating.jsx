import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";

const SellerRatingModal = ({ isOpen, onClose, sellerId, sellerName }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const [honestRating, setHonestRating] = useState(0);
    const [easyToDealRating, setEasyToDealRating] = useState(0);
    const [productQualityRating, setProductQualityRating] = useState(0);
    const [comment, setComment] = useState("");
    
    const [hoveredHonestStar, setHoveredHonestStar] = useState(0);
    const [hoveredEasyStar, setHoveredEasyStar] = useState(0);
    const [hoveredQualityStar, setHoveredQualityStar] = useState(0);
    
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const resetForm = () => {
        setHonestRating(0);
        setEasyToDealRating(0);
        setProductQualityRating(0);
        setComment("");
        setToast(null);
        setHoveredHonestStar(0);
        setHoveredEasyStar(0);
        setHoveredQualityStar(0);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (honestRating === 0 || easyToDealRating === 0 || productQualityRating === 0) {
            showToast(
                isRTL ? "من فضلك اختر جميع التقييمات" : "Please select all ratings",
                "error"
            );
            return;
        }

        if (comment.length > 200) {
            showToast(
                isRTL ? "التعليق طويل جداً (الحد الأقصى 200 حرف)" : "Comment is too long (max 200 characters)",
                "error"
            );
            return;
        }

        try {
            setLoading(true);
            const data = {
                seller_id: sellerId,
                rating_honest: honestRating,
                rating_easy_to_deal_with: easyToDealRating,
                rating_product_quality: productQualityRating,
                ...(comment.trim() && { comment: comment.trim() })
            };

            await userAPI.post('/seller-reviews', data);

            showToast(
                isRTL ? "تم إرسال التقييم بنجاح!" : "Review submitted successfully!",
                "success"
            );

            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error("Error submitting review:", error);
            if (error.response?.data?.message) {
                showToast(error.response.data.message, "error");
            } else {
                showToast(
                    isRTL ? "حدث خطأ أثناء إرسال التقييم" : "Error submitting review",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ rating, setRating, hoveredStar, setHoveredStar, disabled }) => {
        const handleStarClick = (starValue, isHalf) => {
            if (disabled) return;
            const newRating = isHalf ? starValue - 0.5 : starValue;
            setRating(newRating);
        };

        const handleStarHover = (starValue, isHalf) => {
            if (disabled) return;
            const newHover = isHalf ? starValue - 0.5 : starValue;
            setHoveredStar(newHover);
        };

        const displayRating = hoveredStar || rating;

        return (
            <div 
                className="flex gap-1.5 justify-center"
                onMouseLeave={() => !disabled && setHoveredStar(0)}
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.floor(displayRating);
                    const isHalfFilled = star === Math.ceil(displayRating) && displayRating % 1 !== 0;

                    return (
                        <div key={star} className="relative group">
                            {isRTL ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleStarClick(star, true)}
                                        onMouseEnter={() => handleStarHover(star, true)}
                                        className="absolute inset-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                                        style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                                        disabled={disabled}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleStarClick(star, false)}
                                        onMouseEnter={() => handleStarHover(star, false)}
                                        className="absolute inset-0 w-1/2 right-0 z-10 cursor-pointer focus:outline-none"
                                        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                                        disabled={disabled}
                                    />
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleStarClick(star, true)}
                                        onMouseEnter={() => handleStarHover(star, true)}
                                        className="absolute inset-0 w-1/2 right-0 z-10 cursor-pointer focus:outline-none"
                                        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                                        disabled={disabled}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleStarClick(star, false)}
                                        onMouseEnter={() => handleStarHover(star, false)}
                                        className="absolute inset-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                                        style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                                        disabled={disabled}
                                    />
                                </>
                            )}
                            <svg
                                className="w-7 h-7 transition-all duration-200 pointer-events-none group-hover:scale-110"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                            >
                                <path
                                    className="stroke-gray-300"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                                
                                {(isFilled || isHalfFilled) && (
                                    <>
                                        {isHalfFilled && (
                                            <defs>
                                                <linearGradient 
                                                    id={`half-gradient-${star}-${rating}-${hoveredStar}`} 
                                                    x1={isRTL ? "100%" : "0%"} 
                                                    y1="0%" 
                                                    x2={isRTL ? "0%" : "100%"} 
                                                    y2="0%"
                                                >
                                                    <stop offset="0%" stopColor="#FBBF24" />
                                                    <stop offset="50%" stopColor="#FBBF24" />
                                                    <stop offset="50%" stopColor="transparent" />
                                                    <stop offset="100%" stopColor="transparent" />
                                                </linearGradient>
                                            </defs>
                                        )}
                                        <path
                                            fill={isFilled ? "#FBBF24" : `url(#half-gradient-${star}-${rating}-${hoveredStar})`}
                                            stroke="#F59E0B"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
        >
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-[60] animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${
                        toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"
                    }`}>
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

            <div 
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div className="flex justify-center pt-4 pb-2 sticky top-0 bg-white z-10">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div className="text-center space-y-1 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isRTL ? "قيم تجربتك" : "Rate Your Experience"}
                        </h2>
                        <p className="text-gray-500 text-sm">{sellerName}</p>
                    </div>

                    {/* Honest Rating */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="p-2 bg-blue-500 rounded-xl shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="font-bold text-blue-800 text-sm whitespace-nowrap">
                                    {isRTL ? "الأمانة" : "Honesty"}
                                </span>
                            </div>
                            <StarRating
                                rating={honestRating}
                                setRating={setHonestRating}
                                hoveredStar={hoveredHonestStar}
                                setHoveredStar={setHoveredHonestStar}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Easy to Deal Rating */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="p-2 bg-green-500 rounded-xl shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                </div>
                                <span className="font-bold text-green-800 text-sm whitespace-nowrap">
                                    {isRTL ? "سهولة التعامل" : "Easy to Deal"}
                                </span>
                            </div>
                            <StarRating
                                rating={easyToDealRating}
                                setRating={setEasyToDealRating}
                                hoveredStar={hoveredEasyStar}
                                setHoveredStar={setHoveredEasyStar}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Product Quality Rating */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="p-2 bg-purple-500 rounded-xl shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <span className="font-bold text-purple-800 text-sm whitespace-nowrap">
                                    {isRTL ? "جودة المنتج" : "Product Quality"}
                                </span>
                            </div>
                            <StarRating
                                rating={productQualityRating}
                                setRating={setProductQualityRating}
                                hoveredStar={hoveredQualityStar}
                                setHoveredStar={setHoveredQualityStar}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {isRTL ? "أضف تعليقك" : "Add Your Comment"}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={isRTL ? "شاركنا تجربتك مع البائع... (اختياري)" : "Share your experience... (optional)"}
                            className="w-full px-4 py-3 pb-8 border-2 border-gray-200 rounded-2xl outline-none focus:border-main focus:ring-2 focus:ring-main/20 transition-all resize-none text-sm bg-white placeholder-gray-400"
                            rows={3}
                            maxLength={200}
                            disabled={loading}
                        />
                        <div className={`absolute bottom-3 text-xs font-medium ${
                            comment.length >= 10 ? "text-main" : "text-gray-400"
                        } ${isRTL ? 'left-4' : 'right-4'}`}>
                            {comment.length}/200
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-3.5 cursor-pointer bg-gradient-to-r from-main to-green-600 hover:from-green-600 hover:to-main text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        disabled={loading || honestRating === 0 || easyToDealRating === 0 || productQualityRating === 0}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                {isRTL ? "جاري الإرسال..." : "Submitting..."}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {isRTL ? "إرسال التقييم" : "Submit Review"}
                            </span>
                        )}
                    </button>
                </form>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }

                @keyframes slide-in {
                    from {
                        transform: translateX(${isRTL ? '-' : ''}100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SellerRatingModal;