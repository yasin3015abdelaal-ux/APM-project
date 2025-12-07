import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { reviewAPI } from "../../api";

const SellerRatingModal = ({ isOpen, onClose, sellerId, sellerName }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const [honestRating, setHonestRating] = useState(0);
    const [easyToDealRating, setEasyToDealRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoveredHonestStar, setHoveredHonestStar] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [existingReviewId, setExistingReviewId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && sellerId) {
            checkExistingReview();
        }
    }, [isOpen, sellerId]);

    const checkExistingReview = async () => {
        try {
            setCheckingExisting(true);
            const response = await reviewAPI.getMyReview(sellerId);
            
            if (response.data?.data) {
                const review = response.data.data;
                setExistingReviewId(review.id);
                setHonestRating(review.honest_rating);
                setEasyToDealRating(review.easy_to_deal_rating);
                setComment(review.comment || "");
            }
        } catch (error) {
            setExistingReviewId(null);
        } finally {
            setCheckingExisting(false);
        }
    };

    const resetForm = () => {
        setHonestRating(0);
        setEasyToDealRating(0);
        setComment("");
        setError("");
        setSuccess(false);
        setExistingReviewId(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (honestRating === 0 || easyToDealRating === 0) {
            setError(isRTL ? "من فضلك اختر التقييمين" : "Please select both ratings");
            return;
        }

        if (comment.length > 200) {
            setError(isRTL ? "التعليق طويل جداً (الحد الأقصى 200 حرف)" : "Comment is too long (max 200 characters)");
            return;
        }

        try {
            setLoading(true);
            const data = {
                honest_rating: honestRating,
                easy_to_deal_rating: easyToDealRating,
                ...(comment.trim() && { comment: comment.trim() })
            };

            if (existingReviewId) {
                await reviewAPI.updateReview(existingReviewId, data);
            } else {
                await reviewAPI.createReview(sellerId, data);
            }

            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (error) {
            console.error("Error submitting review:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError(isRTL ? "حدث خطأ أثناء إرسال التقييم" : "Error submitting review");
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
                className="flex gap-2 justify-center"
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
                                        onMouseLeave={() => !disabled && setHoveredStar(0)}
                                        className="absolute inset-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                                        style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                                        disabled={disabled}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleStarClick(star, false)}
                                        onMouseEnter={() => handleStarHover(star, false)}
                                        onMouseLeave={() => !disabled && setHoveredStar(0)}
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
                                    onMouseLeave={() => !disabled && setHoveredStar(0)}
                                    className="absolute inset-0 w-1/2 right-0 z-10 cursor-pointer focus:outline-none"
                                    style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                                    disabled={disabled}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleStarClick(star, false)}
                                    onMouseEnter={() => handleStarHover(star, false)}
                                    onMouseLeave={() => !disabled && setHoveredStar(0)}
                                    className="absolute inset-0 w-1/2 z-10 cursor-pointer focus:outline-none"
                                    style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                                    disabled={disabled}
                                />
                            </>)}
                            <svg
                                className="w-11 h-11 sm:w-12 sm:h-12 transition-all duration-200 pointer-events-none group-hover:scale-110"
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
                                                    id={`half-gradient-${star}`} 
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
                                            fill={isFilled ? "#FBBF24" : `url(#half-gradient-${star})`}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
        >
            <div 
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                    {checkingExisting ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-main mx-auto"></div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isRTL ? "قيم تجربتك" : "Rate Your Experience"}
                                </h2>
                                <p className="text-gray-500">{sellerName}</p>
                            </div>

                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-green-800">
                                        {isRTL ? "تم إرسال التقييم بنجاح!" : "Review submitted successfully!"}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-sm text-red-800 text-center">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <StarRating
                                    rating={honestRating}
                                    setRating={setHonestRating}
                                    hoveredStar={hoveredHonestStar}
                                    setHoveredStar={setHoveredHonestStar}
                                    disabled={loading || success}
                                />
                                <p className="text-center text-gray-400 text-sm">
                                    {isRTL ? "اختر تقييمك" : "Select Rating"}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 bg-white border-main text-main shadow-sm flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {isRTL ? "امين" : "Honest"}
                                </div>
                                <div className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 bg-white border-main text-main shadow-sm flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    {isRTL ? "سهل التعامل" : "Easy to Deal"}
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isRTL ? "أضف تعليق (اختياري)" : "Add comment (optional)"}
                                    className="w-full px-4 py-3 pb-8 border-2 border-main/20 rounded-2xl outline-none focus:border-main transition-all resize-none text-sm bg-white"
                                    rows={3}
                                    maxLength={200}
                                    disabled={loading || success}
                                />
                                <div className={`absolute bottom-2 text-xs text-main ${isRTL ? 'left-4' : 'right-4'}`}>
                                    {comment.length}/200
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-main to-main hover:from-main/90 hover:to-main/90 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                disabled={loading || success || honestRating === 0 || easyToDealRating === 0}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        {isRTL ? "جاري الإرسال..." : "Submitting..."}
                                    </span>
                                ) : (
                                    isRTL ? "إرسال التقييم" : "Submit Review"
                                )}
                            </button>
                        </>
                    )}
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
            `}</style>
        </div>
    );
};

export default SellerRatingModal;