import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../../api';
import Loader from '../../Ui/Loader/Loader';
import * as XLSX from 'xlsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Accounts = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        accountType: '',
        verification: '',
        dateFrom: '',
        dateTo: ''
    });
    const [toast, setToast] = useState(null);
    
    // Backend pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchUsers(1);

        const handleUserUpdate = () => {
            fetchUsers(currentPage);
        };

        window.addEventListener('userDataUpdated', handleUserUpdate);

        return () => {
            window.removeEventListener('userDataUpdated', handleUserUpdate);
        };
    }, []);

    // Fetch users when page changes
    useEffect(() => {
        if (currentPage > 0 && currentPage !== pagination.current_page) {
            fetchUsers(currentPage);
        }
    }, [currentPage]);

    useEffect(() => {
        applyFilters();
    }, [users, filters]);

    // Reset to page 1 when filters change and refetch
    useEffect(() => {
        const hasFilters = filters.accountType || filters.verification || filters.dateFrom || filters.dateTo;
        if (hasFilters && currentPage !== 1) {
            setCurrentPage(1);
        } else if (hasFilters) {
            fetchUsers(1);
        }
    }, [filters.accountType, filters.verification, filters.dateFrom, filters.dateTo]);

    // For backend pagination, we use users directly (already paginated from API)
    // filteredUsers is used for client-side filtering if needed
    const displayUsers = filteredUsers;

    const goToPage = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setCurrentPage(page);
            // Scroll to top of table
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderPagination = () => {
        if (pagination.last_page <= 1) return null;
        
        const totalPages = pagination.last_page;

        const pages = [];
        const showEllipsisStart = pagination.current_page > 3;
        const showEllipsisEnd = pagination.current_page < totalPages - 2;

        // First page
        pages.push(
            <button
                key={1}
                onClick={() => goToPage(1)}
                className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pagination.current_page === 1
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

        const startPage = Math.max(2, pagination.current_page - 1);
        const endPage = Math.min(totalPages - 1, pagination.current_page + 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`min-w-[35px] px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        pagination.current_page === i
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
                        pagination.current_page === totalPages
                            ? "bg-main text-white"
                            : "border border-gray-200 text-gray-700 hover:border-main hover:text-main"
                    }`}
                >
                    {totalPages}
                </button>
            );
        }

        const startIndex = (pagination.current_page - 1) * pagination.per_page;
        const endIndex = Math.min(startIndex + pagination.per_page, pagination.total);

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 bg-white">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                    {isRTL ? (
                        <>
                            عرض {startIndex + 1} - {endIndex} من {pagination.total}
                        </>
                    ) : (
                        <>
                            Showing {startIndex + 1} - {endIndex} of {pagination.total}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                        onClick={() => goToPage(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className={`p-2 rounded-lg border transition ${
                            pagination.current_page === 1
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-main text-main hover:bg-green-50"
                        }`}
                        aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                    >
                        {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <div className="flex gap-1">{pages}</div>

                    <button
                        onClick={() => goToPage(pagination.current_page + 1)}
                        disabled={pagination.current_page === totalPages}
                        className={`p-2 rounded-lg border transition ${
                            pagination.current_page === totalPages
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

    const fetchUsers = async (page = currentPage) => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = {
                page: page,
                per_page: itemsPerPage
            };

            // Add filters to params if they exist
            if (filters.accountType) {
                params.account_type = filters.accountType;
            }
            if (filters.verification) {
                params.verification = filters.verification;
            }
            if (filters.dateFrom) {
                params.date_from = filters.dateFrom;
            }
            if (filters.dateTo) {
                params.date_to = filters.dateTo;
            }

            const response = await adminAPI.get('/users', { params });

            let data = [];
            let paginationData = null;

            // Handle different response structures
            if (response.data?.data) {
                if (Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
                    data = response.data.data.data;
                    paginationData = response.data.data;
                }
                
                // Check for pagination in response
                if (response.data.pagination) {
                    paginationData = response.data.pagination;
                } else if (response.data.meta) {
                    paginationData = response.data.meta;
                } else if (response.data.data?.meta) {
                    paginationData = response.data.data.meta;
                }
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }

            setUsers(data);
            
            // Update pagination state
            if (paginationData) {
                setPagination({
                    current_page: paginationData.current_page || paginationData.page || page,
                    last_page: paginationData.last_page || paginationData.total_pages || 1,
                    per_page: paginationData.per_page || paginationData.items_per_page || itemsPerPage,
                    total: paginationData.total || data.length
                });
            } else {
                // Fallback pagination
                setPagination({
                    current_page: page,
                    last_page: 1,
                    per_page: itemsPerPage,
                    total: data.length
                });
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            // setError(err.response?.data?.message || err.message || t('dashboard.accounts.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Filter by account type
        if (filters.accountType) {
            filtered = filtered.filter(user =>
                (user.type || user.account_type || 'individual') === filters.accountType
            );
        }

        // Filter by verification
        if (filters.verification) {
            filtered = filtered.filter(user => {
                const isVerified = user.verified_account === 1 || user.email_verified_at;
                return filters.verification === 'verified' ? isVerified : !isVerified;
            });
        }

        // Filter by date range
        if (filters.dateFrom) {
            filtered = filtered.filter(user =>
                new Date(user.created_at) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(user =>
                new Date(user.created_at) <= new Date(filters.dateTo)
            );
        }

        // Filter by search text
        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filtered = filtered.filter(user =>
                (user.name || '').toLowerCase().includes(searchLower) ||
                (user.email || '').toLowerCase().includes(searchLower) ||
                (user.phone || '').toLowerCase().includes(searchLower) ||
                (user.code || '').toLowerCase().includes(searchLower)
            );
        }

        setFilteredUsers(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({
            accountType: '',
            verification: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    const exportToExcel = () => {
        try {
            // Prepare data for export
            const exportData = filteredUsers.map(user => ({
                [isRTL ? 'رقم الحساب' : 'Account Number']: user.code || user.id || '-',
                [isRTL ? 'تاريخ التسجيل' : 'Registration Date']: formatDate(user.created_at),
                [isRTL ? 'نوع الحساب' : 'Account Type']: getAccountType(user),
                [isRTL ? 'الاسم' : 'Name']: user.name || user.full_name || '-',
                [isRTL ? 'الهاتف' : 'Phone']: user.phone || '-',
                [isRTL ? 'البريد الإلكتروني' : 'Email']: user.email || '-',
                [isRTL ? 'التوثيق' : 'Verification']: (user.verified_account === 1 || user.email_verified_at)
                    ? (isRTL ? 'موثق' : 'Verified')
                    : (isRTL ? 'غير موثق' : 'Not Verified')
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            ws['!cols'] = [
                { wch: 15 }, // Account Number
                { wch: 18 }, // Registration Date
                { wch: 15 }, // Account Type
                { wch: 25 }, // Name
                { wch: 15 }, // Phone
                { wch: 30 }, // Email
                { wch: 15 }  // Verification
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, isRTL ? 'الحسابات' : 'Accounts');

            // Generate file name with date
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${isRTL ? 'الحسابات' : 'Accounts'}_${date}.xlsx`;

            // Download file
            XLSX.writeFile(wb, fileName);

            showToast(isRTL ? 'تم التصدير بنجاح' : 'Export successful', 'success');
        } catch (err) {
            console.error('Error exporting:', err);
            showToast(isRTL ? 'فشل التصدير' : 'Export failed', 'error');
        }
    };

    const handleRowClick = (user) => {
        if (!user || !user.id) {
            console.error('User ID is missing:', user);
            showToast(isRTL ? 'خطأ: معرف المستخدم غير موجود' : 'Error: User ID is missing', 'error');
            return;
        }
        sessionStorage.setItem('selectedUser', JSON.stringify(user));
        navigate(`update-account/${user.id}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isRTL
            ? date.toLocaleDateString('ar-EG')
            : date.toLocaleDateString('en-US');
    };

    const getAccountType = (user) => {
        const type = user.type || user.account_type || 'individual';
        if (isRTL) {
            return type === 'individual' ? 'فردي' : type === 'company' ? 'شركة' : type;
        }
        return type;
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <div className="text-xl text-red-600 mb-4">
                    {t('common.error')}: {error}
                </div>
                <button
                    onClick={fetchUsers}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-main transition-colors"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in`}>
                    <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
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

            <div className="max-w-full">
                {/* Header */}
                <div className="mb-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-main">
                        {t('dashboard.accounts.title')}
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToExcel}
                            className="bg-main cursor-pointer text-white px-3 text-sm rounded hover:bg-green-700 transition-colors py-1.5"
                        >
                            {t('dashboard.accounts.export')}
                        </button>
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="bg-white cursor-pointer text-main px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M37.5 15C37.5008 13.4484 37.0204 11.9347 36.1249 10.6675C35.2294 9.40041 33.9629 8.44221 32.5 7.925L32.5 1.5299e-06L27.5 1.31134e-06L27.5 7.925C26.0362 8.44151 24.7686 9.39935 23.872 10.6665C22.9754 11.9337 22.4939 13.4477 22.4939 15C22.4939 16.5523 22.9754 18.0664 23.872 19.3335C24.7686 20.6007 26.0362 21.5585 27.5 22.075L27.5 40L32.5 40L32.5 22.075C33.9629 21.5578 35.2294 20.5996 36.1249 19.3325C37.0204 18.0653 37.5008 16.5516 37.5 15ZM30 12.5C30.663 12.5 31.2989 12.7634 31.7678 13.2322C32.2366 13.7011 32.5 14.337 32.5 15C32.5 15.663 32.2366 16.2989 31.7678 16.7678C31.2989 17.2366 30.663 17.5 30 17.5C29.337 17.5 28.7011 17.2366 28.2322 16.7678C27.7634 16.2989 27.5 15.663 27.5 15C27.5 14.337 27.7634 13.7011 28.2322 13.2322C28.7011 12.7634 29.337 12.5 30 12.5ZM17.5 25C17.5008 23.4484 17.0204 21.9347 16.1249 20.6675C15.2294 19.4004 13.9629 18.4422 12.5 17.925L12.5 6.55672e-07L7.5 4.37115e-07L7.5 17.925C6.03617 18.4415 4.76858 19.3993 3.87197 20.6665C2.97536 21.9337 2.49387 23.4477 2.49387 25C2.49387 26.5523 2.97536 28.0663 3.87197 29.3335C4.76858 30.6007 6.03617 31.5585 7.5 32.075L7.5 40L12.5 40L12.5 32.075C13.9629 31.5578 15.2294 30.5996 16.1249 29.3325C17.0204 28.0653 17.5008 26.5516 17.5 25ZM10 22.5C10.663 22.5 11.2989 22.7634 11.7678 23.2322C12.2366 23.7011 12.5 24.337 12.5 25C12.5 25.663 12.2366 26.2989 11.7678 26.7678C11.2989 27.2366 10.663 27.5 10 27.5C9.33696 27.5 8.70108 27.2366 8.23223 26.7678C7.76339 26.2989 7.5 25.663 7.5 25C7.5 24.337 7.76339 23.7011 8.23223 23.2322C8.70108 22.7634 9.33696 22.5 10 22.5Z" fill="#4CAF50" />
                            </svg>
                        </button>
                       
                    </div>
                </div>

                <div className="text-main font-bold mb-4">
                    {t('dashboard.accounts.totalAccounts')}: <span>{pagination.total}</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white shadow">
                    <table className="min-w-full">
                        <thead className="border-b border-main">
                            <tr>
                                <th className={`px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right first:rounded-tr-lg' : 'text-left first:rounded-tl-lg'}`}>
                                    {t('dashboard.accounts.accountNumber')}
                                </th>
                                {/* إخفاء التاريخ في الموبايل */}
                                <th className={`hidden sm:table-cell px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.accounts.registrationDate')}
                                </th>
                                {/* إخفاء نوع الحساب في الموبايل */}
                                <th className={`hidden md:table-cell px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.accounts.accountType')}
                                </th>
                                <th className={`px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.accounts.name')}
                                </th>
                                <th className={`px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.accounts.phone')}
                                </th>
                                {/* إخفاء الإيميل في الموبايل */}
                                <th className={`hidden lg:table-cell px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.accounts.email')}
                                </th>
                                <th className={`px-2 py-2 text-xs font-bold text-gray-700 ${isRTL ? 'text-right last:rounded-tl-lg' : 'text-left last:rounded-tr-lg'}`}>
                                    {t('dashboard.accounts.verification')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500">
                                        {filters.accountType || filters.verification || filters.dateFrom || filters.dateTo
                                            ? (isRTL ? 'لا توجد نتائج تطابق الفلتر' : 'No results match your filter')
                                            : t('dashboard.accounts.noAccounts')
                                        }
                                    </td>
                                </tr>
                            ) : (
                                displayUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleRowClick(user)}
                                        className="hover:bg-green-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-2 py-2.5 text-xs text-gray-900 font-mono">
                                            {user.code || user.id || '-'}
                                        </td>
                                        <td className="hidden sm:table-cell px-2 py-2.5 text-xs text-gray-900">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="hidden md:table-cell px-2 py-2.5 text-xs text-gray-900">
                                            {getAccountType(user)}
                                        </td>
                                        <td className="px-2 py-2.5 text-xs text-gray-900 font-medium">
                                            {user.name || user.full_name || '-'}
                                        </td>
                                        <td className="px-2 py-2.5 text-xs text-gray-900" dir="ltr" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {user.phone || '-'}
                                        </td>
                                        <td className="hidden lg:table-cell px-2 py-2.5 text-xs text-gray-900 break-all">
                                            {user.email || '-'}
                                        </td>
                                        <td className="px-2 py-2.5">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${user.verified_account === 1 || user.email_verified_at
                                                    ? 'bg-green-100 text-main'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {user.verified_account === 1 || user.email_verified_at
                                                    ? t('dashboard.accounts.verified')
                                                    : t('dashboard.accounts.notVerified')
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {renderPagination()}
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-main mb-4">
                            {isRTL ? 'تصفية الحسابات' : 'Filter Accounts'}
                        </h3>

                        {/* Account Type */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? 'نوع الحساب' : 'Account Type'}
                            </label>
                            <select
                                value={filters.accountType}
                                onChange={(e) => handleFilterChange('accountType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">{isRTL ? 'الكل' : 'All'}</option>
                                <option value="individual">{isRTL ? 'فردي' : 'Individual'}</option>
                                <option value="company">{isRTL ? 'شركة' : 'Company'}</option>
                            </select>
                        </div>

                        {/* Verification */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? 'حالة التوثيق' : 'Verification Status'}
                            </label>
                            <select
                                value={filters.verification}
                                onChange={(e) => handleFilterChange('verification', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">{isRTL ? 'الكل' : 'All'}</option>
                                <option value="verified">{isRTL ? 'موثق' : 'Verified'}</option>
                                <option value="notVerified">{isRTL ? 'غير موثق' : 'Not Verified'}</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? 'من تاريخ' : 'From Date'}
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Date To */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isRTL ? 'إلى تاريخ' : 'To Date'}
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    resetFilters();
                                    setShowFilterModal(false);
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                {isRTL ? 'إعادة تعيين' : 'Reset'}
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 bg-main text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {isRTL ? 'تطبيق' : 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;