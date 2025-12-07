import React, { useState, useEffect } from 'react';
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

            const response = await adminAPI.get(`/users/${userId}`);
            const data = response.data?.data || response.data;

            setUserData(data);
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
                    <button
                        onClick={() => navigate('/dashboard/accounts')}
                        className="bg-white text-main px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                    >
                        <svg width="30" height="30" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 5H10C7.25 5 5.025 7.25 5.025 10L5 55L15 45H50C52.75 45 55 42.75 55 40V10C55 7.25 52.75 5 50 5ZM42.5 35H17.5C16.125 35 15 33.875 15 32.5C15 31.125 16.125 30 17.5 30H42.5C43.875 30 45 31.125 45 32.5C45 33.875 43.875 35 42.5 35ZM42.5 27.5H17.5C16.125 27.5 15 26.375 15 25C15 23.625 16.125 22.5 17.5 22.5H42.5C43.875 22.5 45 23.625 45 25C45 26.375 43.875 27.5 42.5 27.5ZM42.5 20H17.5C16.125 20 15 18.875 15 17.5C15 16.125 16.125 15 17.5 15H42.5C43.875 15 45 16.125 45 17.5C45 18.875 43.875 20 42.5 20Z" fill="#4CAF50" />
                        </svg>
                    </button>
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
                            {t('dashboard.accounts.accountDetails.email')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.email || '-'}
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.phoneNumber')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm" dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {userData.phone || '-'}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.address')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.address || '-'}
                        </div>
                    </div>

                    {/* Governorate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.governorate')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.governorate ? (isRTL ? userData.governorate.name_ar : userData.governorate.name_en) : '-'}
                        </div>
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.accountType')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.type === 'individual'
                                ? t('dashboard.accounts.accountDetails.individual')
                                : t('dashboard.accounts.accountDetails.company')
                            }
                        </div>
                    </div>

                    {/* Ads Count */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.publishedAdsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.published_ads_count || userData.ads_count || 0}
                        </div>
                    </div>

                    {/* Rejected Ads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.rejectedAdsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.rejected_ads_count || 0}
                        </div>
                    </div>

                    {/* Under Review Ads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.underReviewAdsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.pending_ads_count || 0}
                        </div>
                    </div>

                    {/* Reserved Ads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.reservedAdsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.reserved_ads_count || 0}
                        </div>
                    </div>

                    {/* Expired Ads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.expiredAdsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.expired_ads_count || 0}
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.subscriptionsCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm">
                            {userData.subscriptions && userData.subscriptions.length > 0 ? (
                                <div className="text-sm space-y-1">
                                    {userData.subscriptions.map((sub, index) => (
                                        <div key={index}>
                                            {sub.name}: {sub.start_date} / {sub.end_date}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    {t('dashboard.accounts.accountDetails.noSubscriptions')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Services Count */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                            {t('dashboard.accounts.accountDetails.servicesCount')}
                        </label>
                        <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm text-center font-medium">
                            {userData.services_count || 0}
                        </div>
                    </div> */}
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
                            ? t('dashboard.accounts.accountDetails.deactivateAccount')
                            : t('dashboard.accounts.accountDetails.activateAccount')
                        }
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex-1 bg-red-500 cursor-pointer text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                        {t('dashboard.accounts.accountDetails.deleteAccount')}
                    </button>
                </div>

                {/* Verify/Unverify Confirmation Modal */}
                {showVerifyModal && (
                    <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                            <p className="text-center text-gray-800 mb-6">
                                {userData.verified_account === 1
                                    ? t('dashboard.accounts.accountDetails.confirmUnverify')
                                    : t('dashboard.accounts.accountDetails.confirmVerify')
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleToggleStatus}
                                    className="flex-1 cursor-pointer bg-main text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    {t('dashboard.additions.yes')}
                                </button>
                                <button
                                    onClick={() => setShowVerifyModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    {t('dashboard.additions.no')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-[#00000062] flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                            <p className="text-center text-gray-800 mb-6">
                                {t('dashboard.accounts.accountDetails.confirmDelete')}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 cursor-pointer bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    {t('dashboard.additions.yes')}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 cursor-pointer bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    {t('dashboard.additions.no')}
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