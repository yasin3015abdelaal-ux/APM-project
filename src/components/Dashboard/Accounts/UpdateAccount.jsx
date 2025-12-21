import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../../api';
import Loader from '../../Ui/Loader/Loader';

const UpdateAccount = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { userId } = useParams();
    const isRTL = i18n.language === 'ar';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reports, setReports] = useState([]);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Always fetch fresh data from API
    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Force fresh data by adding timestamp to prevent caching
            const response = await adminAPI.get(`/users/${userId}?_t=${Date.now()}`);
            const apiData = response.data?.data;
            
            // Combine user data with statistics
            const combinedData = {
                ...apiData.user,
                statistics: apiData.statistics
            };

            setUserData(combinedData);
            setProducts(apiData.products || []);
            setReviews(apiData.reviews || []);
            setReports(apiData.reports || []);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err.response?.data?.message || err.message || t('dashboard.accounts.accountDetails.errorFetching'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        setShowVerifyModal(false);
        try {
            const currentVerified = userData.verified_account === 1;
            const newStatus = currentVerified ? 0 : 1;

            await adminAPI.put(`/users/${userId}/update-verification-status`, {
                verified_account: newStatus
            });

            const message = currentVerified
                ? t('dashboard.accounts.accountDetails.accountUnverified')
                : t('dashboard.accounts.accountDetails.accountVerified');

            showToast(message, 'success');

            // Fetch fresh data after update
            fetchUserData();

            // Trigger update in Accounts list
            window.dispatchEvent(new Event('userDataUpdated'));

        } catch (err) {
            console.error('Error toggling account status:', err);
            const errorMsg = err.response?.data?.message || t('dashboard.accounts.accountDetails.errorVerifying');
            showToast(errorMsg, 'error');
        }
    };

    const handleDeleteAccount = async () => {
        setShowDeleteModal(false);
        try {
            await adminAPI.delete(`/users/${userId}`);

            // Trigger update in Accounts list
            window.dispatchEvent(new Event('userDataUpdated'));

            showToast(t('dashboard.accounts.accountDetails.accountDeleted'), 'success');

            setTimeout(() => {
                navigate('/dashboard/accounts');
            }, 1500);

        } catch (err) {
            console.error('Error deleting account:', err);
            const errorMsg = err.response?.data?.message || t('dashboard.accounts.accountDetails.errorDeleting');
            showToast(errorMsg, 'error');
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <div className="text-xl text-red-600 mb-4">{error}</div>
                <button
                    onClick={fetchUserData}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-main transition-colors"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    return (
        <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-main">
                        {t('dashboard.accounts.accountDetails.title')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/dashboard/messages?user_id=${userId}`)}
                            className="bg-main text-white px-4 py-2 text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            title={isRTL ? 'بدء محادثة' : 'Start Chat'}
                        >
                            <i className="fas fa-comments"></i>
                            <span className="hidden sm:inline">{isRTL ? 'محادثة' : 'Chat'}</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/accounts')}
                            className="bg-white text-main px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i>
                            <span className="hidden sm:inline">{isRTL ? 'الحسابات' : 'Accounts'}</span>
                        </button>
                    </div>
                </div>

                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                            {userData.image ? (
                                <img
                                    src={userData.image}
                                    alt={userData.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                                    👤
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Name */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{userData.name}</h2>
                    <h2 className="text-sm font-medium text-gray-800">{userData.code}</h2>
                </div>

                {/* User Info - Display Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.email || '-'}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm" dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {userData.phone || '-'}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'العنوان' : 'Address'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.address || '-'}
                        </div>
                    </div>

                    {/* Governorate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المحافظة' : 'Governorate'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.governorate ? (isRTL ? userData.governorate.name_ar : userData.governorate.name_en) : '-'}
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'الدولة' : 'Country'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.country ? (isRTL ? userData.country.name_ar : userData.country.name_en) : '-'}
                        </div>
                    </div>

                    {/* Activity Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'نوع النشاط' : 'Activity Type'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.activity_type ? (isRTL ? userData.activity_type.name_ar : userData.activity_type.name_en) : '-'}
                        </div>
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'نوع الحساب' : 'Account Type'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.type === 'individual'
                                ? (isRTL ? 'فردي' : 'Individual')
                                : userData.type === 'admin'
                                ? (isRTL ? 'أدمن' : 'Admin')
                                : (isRTL ? 'شركة' : 'Company')
                            }
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'الجنس' : 'Gender'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.gender === 'male' 
                                ? (isRTL ? 'ذكر' : 'Male') 
                                : userData.gender === 'female' 
                                ? (isRTL ? 'أنثى' : 'Female') 
                                : '-'}
                        </div>
                    </div>

                    {/* Commercial Registration - Only for companies */}
                    {userData.type !== 'individual' && userData.type !== 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                                {isRTL ? 'السجل التجاري' : 'Commercial Registration'}
                            </label>
                            <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                                {userData.commercial_registration || '-'}
                            </div>
                        </div>
                    )}

                    {/* Tax Number - Only for companies */}
                    {userData.type !== 'individual' && userData.type !== 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                                {isRTL ? 'الرقم الضريبي' : 'Tax Number'}
                            </label>
                            <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                                {userData.tax_number || '-'}
                            </div>
                        </div>
                    )}

                    {/* Is Trusted */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'حساب موثوق' : 'Trusted Account'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.is_trusted ? (
                                <span className="text-green-600">
                                    ✓ {isRTL ? 'موثوق' : 'Trusted'}
                                </span>
                            ) : (
                                <span className="text-gray-500">
                                    {isRTL ? 'غير موثوق' : 'Not Trusted'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Rating Average */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'متوسط التقييم' : 'Average Rating'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.rating_avg || '0.00'} ⭐
                        </div>
                    </div>

                    {/* Reviews Count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'عدد المراجعات' : 'Reviews Count'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.reviews_count || 0}
                        </div>
                    </div>

                    {/* Products Sold Count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات المباعة' : 'Products Sold'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.products_sold_count || 0}
                        </div>
                    </div>

                    {/* Published Products (Active) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات المنشورة' : 'Published Products'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.active_products || 0}
                        </div>
                    </div>

                    {/* Rejected Products */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات المرفوضة' : 'Rejected Products'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.rejected_products || 0}
                        </div>
                    </div>

                    {/* Pending Products (Under Review) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات تحت المراجعة' : 'Pending Products'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.pending_products || 0}
                        </div>
                    </div>

                    {/* Auction Count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'عدد المزادات' : 'Auctions Count'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.auction_count || 0}
                        </div>
                    </div>

                    {/* Expired Products */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات المنتهية' : 'Expired Products'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.expired_products || 0}
                        </div>
                    </div>

                    {/* Deleted Products */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {isRTL ? 'المنتجات المحذوفة' : 'Deleted Products'}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.statistics?.deleted_products || 0}
                        </div>
                    </div>
                </div>

                {/* View Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                    <button
                        onClick={() => navigate(`/dashboard/accounts/${userId}/products`, { state: { products } })}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-box"></i>
                        <span>{isRTL ? 'عرض المنتجات' : 'View Products'}</span>
                        {products.length > 0 && (
                            <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                {products.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => navigate(`/dashboard/accounts/${userId}/reviews`, { state: { reviews } })}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-star"></i>
                        <span>{isRTL ? 'عرض المراجعات' : 'View Reviews'}</span>
                        {reviews.length > 0 && (
                            <span className="bg-white text-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                {reviews.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => navigate(`/dashboard/accounts/${userId}/reports`, { state: { reports } })}
                        className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-flag"></i>
                        <span>{isRTL ? 'عرض البلاغات' : 'View Reports'}</span>
                        {reports.length > 0 && (
                            <span className="bg-white text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">
                                {reports.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setShowVerifyModal(true)}
                        className={`flex-1 cursor-pointer text-white py-3 rounded-lg font-medium transition-colors text-sm ${userData.verified_account === 1
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : 'bg-main hover:bg-green-600'
                            }`}
                    >
                        {userData.verified_account === 1
                            ? (isRTL ? 'إلغاء تفعيل الحساب' : 'Deactivate Account')
                            : (isRTL ? 'تفعيل الحساب' : 'Activate Account')
                        }
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex-1 bg-red-500 cursor-pointer text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                        {isRTL ? 'حذف الحساب' : 'Delete Account'}
                    </button>
                </div>

                {/* Verify/Unverify Confirmation Modal */}
                {showVerifyModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                            <p className="text-center text-gray-800 mb-6">
                                {userData.verified_account === 1
                                    ? (isRTL ? 'هل أنت متأكد من إلغاء تفعيل هذا الحساب؟' : 'Are you sure you want to deactivate this account?')
                                    : (isRTL ? 'هل أنت متأكد من تفعيل هذا الحساب؟' : 'Are you sure you want to activate this account?')
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleToggleStatus}
                                    className="flex-1 cursor-pointer bg-main text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    {isRTL ? 'نعم' : 'Yes'}
                                </button>
                                <button
                                    onClick={() => setShowVerifyModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    {isRTL ? 'لا' : 'No'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                            <p className="text-center text-gray-800 mb-6">
                                {isRTL ? 'هل أنت متأكد من حذف هذا الحساب نهائياً؟' : 'Are you sure you want to permanently delete this account?'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 cursor-pointer bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    {isRTL ? 'نعم' : 'Yes'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    {isRTL ? 'لا' : 'No'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateAccount;