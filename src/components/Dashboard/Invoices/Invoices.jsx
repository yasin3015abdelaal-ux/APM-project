import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../../api';
import Loader from '../../Ui/Loader/Loader';
import * as XLSX from 'xlsx';

const Invoices = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';

    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        dateFrom: '',
        dateTo: ''
    });
    const [toast, setToast] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [invoices, filters]);

    useEffect(() => {
        calculateStats();
    }, [filteredInvoices]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminAPI.get('/invoices');

            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            } else if (response.data) {
                data = [response.data];
            }
            
            setInvoices(data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            // setError(err.response?.data?.message || err.message || t('dashboard.invoices.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const total = filteredInvoices.length;
        const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        
        setStats({ total, totalAmount });
    };

    const applyFilters = () => {
        let filtered = [...invoices];

        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(invoice => invoice.status === filters.status);
        }

        // Filter by date range
        if (filters.dateFrom) {
            filtered = filtered.filter(invoice => 
                new Date(invoice.created_at) >= new Date(filters.dateFrom)
            );
        }
        if (filters.dateTo) {
            filtered = filtered.filter(invoice => 
                new Date(invoice.created_at) <= new Date(filters.dateTo)
            );
        }

        setFilteredInvoices(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    const exportToExcel = () => {
        try {
            const exportData = filteredInvoices.map(invoice => ({
                [t('dashboard.invoices.table.invoiceNumber')]: invoice.invoice_number || invoice.id || '-',
                [t('dashboard.invoices.table.date')]: formatDate(invoice.created_at),
                [t('dashboard.invoices.table.userName')]: invoice.user_name || '-',
                [t('dashboard.invoices.table.subscriptionType')]: invoice.subscription_type || '-',
                [t('dashboard.invoices.table.paymentMethod')]: t(`invoices.paymentMethods.${invoice.payment_method}`) || '-',
                [t('dashboard.invoices.table.requestInvoice')]: invoice.requestInvoice || 0,
                [t('dashboard.invoices.table.status')]: t(`invoices.status.${invoice.status}`) || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            
            ws['!cols'] = [
                { wch: 15 },
                { wch: 15 },
                { wch: 20 },
                { wch: 20 },
                { wch: 15 },
                { wch: 12 },
                { wch: 15 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, t('dashboard.invoices.title'));

            const date = new Date().toISOString().split('T')[0];
            const fileName = `${t('dashboard.invoices.title')}_${date}.xlsx`;

            XLSX.writeFile(wb, fileName);

            showToast(t('dashboard.invoices.exportSuccess'), 'success');
        } catch (err) {
            console.error('Error exporting:', err);
            showToast(t('dashboard.invoices.exportError'), 'error');
        }
    };

    const handleRowClick = (invoice) => {
        if (!invoice || !invoice.id) {
            console.error('Invoice ID is missing:', invoice);
            showToast(t('dashboard.invoices.errors.missingId'));
            return;
        }
        sessionStorage.setItem('selectedInvoice', JSON.stringify(invoice));
        navigate(`invoice-details/${invoice.id}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isRTL
            ? date.toLocaleDateString('ar-EG')
            : date.toLocaleDateString('en-US');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: { bg: 'bg-green-100', text: 'text-green-800', label: t('dashboard.invoices.status.paid') },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('dashboard.invoices.status.pending') },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: t('dashboard.invoices.status.cancelled') }
        };

        const config = statusConfig[status] || statusConfig.pending;
        
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
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
                    onClick={fetchInvoices}
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

            <div className="max-w-full">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-main">
                        {t('dashboard.invoices.title')}
                    </h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={exportToExcel}
                            className="bg-main text-white px-4 py-2 text-sm rounded hover:bg-green-700 transition-colors"
                        >
                            {t('dashboard.invoices.export')}
                        </button>
                        <button 
                            onClick={() => setShowFilterModal(true)}
                            className="bg-white text-main px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M37.5 15C37.5008 13.4484 37.0204 11.9347 36.1249 10.6675C35.2294 9.40041 33.9629 8.44221 32.5 7.925L32.5 1.5299e-06L27.5 1.31134e-06L27.5 7.925C26.0362 8.44151 24.7686 9.39935 23.872 10.6665C22.9754 11.9337 22.4939 13.4477 22.4939 15C22.4939 16.5523 22.9754 18.0664 23.872 19.3335C24.7686 20.6007 26.0362 21.5585 27.5 22.075L27.5 40L32.5 40L32.5 22.075C33.9629 21.5578 35.2294 20.5996 36.1249 19.3325C37.0204 18.0653 37.5008 16.5516 37.5 15ZM30 12.5C30.663 12.5 31.2989 12.7634 31.7678 13.2322C32.2366 13.7011 32.5 14.337 32.5 15C32.5 15.663 32.2366 16.2989 31.7678 16.7678C31.2989 17.2366 30.663 17.5 30 17.5C29.337 17.5 28.7011 17.2366 28.2322 16.7678C27.7634 16.2989 27.5 15.663 27.5 15C27.5 14.337 27.7634 13.7011 28.2322 13.2322C28.7011 12.7634 29.337 12.5 30 12.5ZM17.5 25C17.5008 23.4484 17.0204 21.9347 16.1249 20.6675C15.2294 19.4004 13.9629 18.4422 12.5 17.925L12.5 6.55672e-07L7.5 4.37115e-07L7.5 17.925C6.03617 18.4415 4.76858 19.3993 3.87197 20.6665C2.97536 21.9337 2.49387 23.4477 2.49387 25C2.49387 26.5523 2.97536 28.0663 3.87197 29.3335C4.76858 30.6007 6.03617 31.5585 7.5 32.075L7.5 40L12.5 40L12.5 32.075C13.9629 31.5578 15.2294 30.5996 16.1249 29.3325C17.0204 28.0653 17.5008 26.5516 17.5 25ZM10 22.5C10.663 22.5 11.2989 22.7634 11.7678 23.2322C12.2366 23.7011 12.5 24.337 12.5 25C12.5 25.663 12.2366 26.2989 11.7678 26.7678C11.2989 27.2366 10.663 27.5 10 27.5C9.33696 27.5 8.70108 27.2366 8.23223 26.7678C7.76339 26.2989 7.5 25.663 7.5 25C7.5 24.337 7.76339 23.7011 8.23223 23.2322C8.70108 22.7634 9.33696 22.5 10 22.5Z" fill="#4CAF50" />
                            </svg>
                        </button>
                        <button className="bg-white text-main px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors">
                            <svg width="25" height="25" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 5H10C7.25 5 5.025 7.25 5.025 10L5 55L15 45H50C52.75 45 55 42.75 55 40V10C55 7.25 52.75 5 50 5ZM42.5 35H17.5C16.125 35 15 33.875 15 32.5C15 31.125 16.125 30 17.5 30H42.5C43.875 30 45 31.125 45 32.5C45 33.875 43.875 35 42.5 35ZM42.5 27.5H17.5C16.125 27.5 15 26.375 15 25C15 23.625 16.125 22.5 17.5 22.5H42.5C43.875 22.5 45 23.625 45 25C45 26.375 43.875 27.5 42.5 27.5ZM42.5 20H17.5C16.125 20 15 18.875 15 17.5C15 16.125 16.125 15 17.5 15H42.5C43.875 15 45 16.125 45 17.5C45 18.875 43.875 20 42.5 20Z" fill="#4CAF50" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">{t('dashboard.invoices.stats.totalInvoices')}</div>
                        <div className="text-2xl font-bold text-main">{stats.total}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">{t('dashboard.invoices.stats.totalAmount')}</div>
                        <div className="text-2xl font-bold text-main">
                            {stats.totalAmount.toLocaleString()} {t('dashboard.invoices.currency')}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white shadow rounded-lg">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.invoiceNumber')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.date')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.userName')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.subscriptionType')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.paymentMethod')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.requestInvoice')}
                                </th>
                                <th className={`px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('dashboard.invoices.table.status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500">
                                        {filters.status || filters.dateFrom || filters.dateTo
                                            ? t('dashboard.invoices.noFilterResults')
                                            : t('dashboard.invoices.noInvoices')
                                        }
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        onClick={() => handleRowClick(invoice)}
                                        className="hover:bg-green-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                                            {invoice.invoice_number || invoice.id || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatDate(invoice.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            {invoice.user_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {invoice.subscription_type || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {t(`invoices.paymentMethods.${invoice.payment_method}`) || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                                            {invoice.requestInvoice || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-main mb-4">
                            {t('dashboard.invoices.filterTitle')}
                        </h3>

                        {/* Status */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('dashboard.invoices.filter.status')}
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">{t('dashboard.invoices.filter.all')}</option>
                                <option value="paid">{t('dashboard.invoices.status.paid')}</option>
                                <option value="pending">{t('dashboard.invoices.status.pending')}</option>
                                <option value="cancelled">{t('dashboard.invoices.status.cancelled')}</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('dashboard.invoices.filter.dateFrom')}
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
                                {t('dashboard.invoices.filter.dateTo')}
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
                                {t('dashboard.invoices.filter.reset')}
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 bg-main text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {t('dashboard.invoices.filter.apply')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;