import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const Invoices = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await userAPI.get("/invoice-requests");
            setInvoices(res.data?.data || []);
            console.log(res.data.data);
        } catch (err) {
            console.log(err);
            showToast(
                isRTL ? "فشل في تحميل الفواتير" : "Failed to load invoices",
                "error"
            );
        }
        setLoading(false);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
            case "completed":
                return "bg-green-500";
            case "pending":
                return "bg-yellow-500";
            case "cancelled":
            case "failed":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return isRTL ? "مدفوعة" : "Paid";
            case "pending":
                return isRTL ? "قيد الانتظار" : "Pending";
            case "completed":
                return isRTL ? "مكتملة" : "Completed";
            case "cancelled":
                return isRTL ? "ملغية" : "Cancelled";
            case "failed":
                return isRTL ? "فشلت" : "Failed";
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    const handlePrint = (invoice) => {
        const printWindow = window.open('', '_blank');
        const content = `
            <!DOCTYPE html>
            <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${isRTL ? 'فاتورة' : 'Invoice'} ${invoice.id}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: ${isRTL ? 'Arial, sans-serif' : 'Arial, sans-serif'};
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 2px solid #e5e7eb;
                        border-radius: 16px;
                        overflow: hidden;
                    }
                    .invoice-header {
                        background: linear-gradient(to right, #059669, #10b981);
                        color: white;
                        padding: 40px;
                    }
                    .invoice-title {
                        font-size: 32px;
                        font-weight: bold;
                        margin-bottom: 8px;
                    }
                    .request-number {
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 14px;
                        margin-top: 12px;
                    }
                    .invoice-body {
                        padding: 40px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid #e5e7eb;
                        margin-bottom: 8px;
                    }
                    .info-label {
                        font-size: 12px;
                        color: #6b7280;
                        font-weight: 600;
                    }
                    .info-value {
                        font-size: 14px;
                        font-weight: bold;
                        color: #1f2937;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #1f2937;
                        margin: 24px 0 16px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .note-box {
                        padding: 16px;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        border-left: 4px solid;
                    }
                    .note-box.customer {
                        background: #eff6ff;
                        border-left-color: #3b82f6;
                    }
                    .note-box.admin {
                        background: #faf5ff;
                        border-left-color: #a855f7;
                    }
                    .note-label {
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #1f2937;
                    }
                    .item-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        background: #f9fafb;
                        border-radius: 8px;
                        margin-bottom: 12px;
                    }
                    .item-name {
                        font-weight: 600;
                        color: #1f2937;
                    }
                    .item-desc {
                        font-size: 12px;
                        color: #6b7280;
                        margin-top: 4px;
                    }
                    .item-qty {
                        font-size: 12px;
                        color: #6b7280;
                        margin-top: 4px;
                    }
                    .item-price {
                        font-weight: bold;
                        color: #059669;
                        font-size: 16px;
                    }
                    .total-section {
                        background: #059669;
                        color: white;
                        padding: 24px;
                        border-radius: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 32px;
                    }
                    .total-label {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .total-amount {
                        font-size: 28px;
                        font-weight: 900;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .invoice-container {
                            border: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="invoice-header">
                        <div class="invoice-title">
                            ${isRTL ? 'فاتورة' : 'INVOICE'} ${invoice.id}
                        </div>
                        <div class="request-number">
                            ${isRTL ? 'رقم الطلب:' : 'Request #'} ${invoice.request_number}
                        </div>
                        <div class="status-badge" style="background: ${getStatusColor(invoice.status).replace('bg-', '')};">
                            ${getStatusText(invoice.status)}
                        </div>
                    </div>
                    
                    <div class="invoice-body">
                        <div class="info-row">
                            <span class="info-label">${isRTL ? 'تاريخ الإصدار' : 'Issue Date'}</span>
                            <span class="info-value">${formatDate(invoice.created_at)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">${isRTL ? 'آخر تحديث' : 'Last Updated'}</span>
                            <span class="info-value">${formatDate(invoice.updated_at)}</span>
                        </div>
                        ${invoice.email ? `
                        <div class="info-row">
                            <span class="info-label">${isRTL ? 'البريد الإلكتروني' : 'Email'}</span>
                            <span class="info-value">${invoice.email}</span>
                        </div>
                        ` : ''}
                        
                        ${invoice.notes || invoice.admin_notes ? `
                        <div class="section-title">${isRTL ? 'الملاحظات' : 'Notes'}</div>
                        ${invoice.notes ? `
                        <div class="note-box customer">
                            <div class="note-label">${isRTL ? 'ملاحظات العميل:' : 'Customer Notes:'}</div>
                            <div>${invoice.notes}</div>
                        </div>
                        ` : ''}
                        ${invoice.admin_notes ? `
                        <div class="note-box admin">
                            <div class="note-label">${isRTL ? 'ملاحظات الإدارة:' : 'Admin Notes:'}</div>
                            <div>${invoice.admin_notes}</div>
                        </div>
                        ` : ''}
                        ` : ''}
                        
                        ${invoice.items && invoice.items.length > 0 ? `
                        <div class="section-title">${isRTL ? 'تفاصيل الفاتورة' : 'Invoice Details'}</div>
                        ${invoice.items.map(item => `
                        <div class="item-row">
                            <div>
                                <div class="item-name">
                                    ${item.package?.name || item.name || (isRTL ? 'منتج' : 'Item')}
                                </div>
                                ${item.package?.description ? `
                                <div class="item-desc">${item.package.description}</div>
                                ` : ''}
                                <div class="item-qty">
                                    ${isRTL ? 'الكمية:' : 'Qty:'} ${item.quantity || 1}
                                </div>
                            </div>
                            <div class="item-price">
                                ${item.subtotal || item.price || 0} ${isRTL ? 'ج.م' : 'EGP'}
                            </div>
                        </div>
                        `).join('')}
                        ` : ''}
                        
                        <div class="total-section">
                            <span class="total-label">${isRTL ? 'الإجمالي' : 'Total Amount'}</span>
                            <span class="total-amount">${invoice.total_amount} ${isRTL ? 'ج.م' : 'EGP'}</span>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(content);
        printWindow.document.close();
    };

    if (loading && invoices.length === 0) {
        return <Loader />;
    }

    return (
        <div
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full max-w-6xl mx-auto p-4 sm:p-8"
        >
            {toast && (
                <div className={`fixed top-4 sm:top-5 ${isRTL ? "left-4 sm:left-5" : "right-4 sm:right-5"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
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

            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-main">
                    {isRTL ? "الفواتير" : "Invoices"}
                </h1>
            </div>

            {invoices.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2 text-gray-700">
                        {isRTL ? "لا توجد فواتير" : "No Invoices"}
                    </p>
                    <p className="text-sm text-gray-500">
                        {isRTL ? "لم تقم بإنشاء أي فواتير بعد" : "You haven't created any invoices yet"}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                            {/* Invoice Header */}
                            <div className="bg-gradient-to-r from-main to-green-600 text-white p-6 sm:p-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                                            {isRTL ? "فاتورة" : "INVOICE"} {invoice.id}
                                        </h2>
                                        <p className="text-green-100 text-sm sm:text-base mb-1">
                                            {isRTL ? "رقم الطلب:" : "Request #"} {invoice.request_number}
                                        </p>
                                    </div>
                                    <div className={`${getStatusColor(invoice.status)} text-white px-4 py-2 rounded-full font-bold text-sm`}>
                                        {getStatusText(invoice.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Body */}
                            <div className="p-6 sm:p-8">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 font-semibold">
                                            {isRTL ? "تاريخ الإصدار:" : "Issue Date:"}
                                        </span>
                                        <span className="text-gray-800 font-bold">
                                            {formatDate(invoice.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 font-semibold">
                                            {isRTL ? "آخر تحديث:" : "Last Updated:"}
                                        </span>
                                        <span className="text-gray-800 font-bold">
                                            {formatDate(invoice.updated_at)}
                                        </span>
                                    </div>
                                    {invoice.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 font-semibold">
                                                {isRTL ? "البريد:" : "Email:"}
                                            </span>
                                            <span className="text-gray-800 font-bold text-sm break-all">
                                                {invoice.email}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Notes Section */}
                                {(invoice.notes || invoice.admin_notes) && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                                            {isRTL ? "الملاحظات" : "Notes"}
                                        </h3>
                                        <div className="space-y-4">
                                            {invoice.notes && (
                                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                                    <p className="text-sm text-blue-700 font-semibold mb-2">
                                                        {isRTL ? "ملاحظات العميل:" : "Customer Notes:"}
                                                    </p>
                                                    <p className="text-gray-800">{invoice.notes}</p>
                                                </div>
                                            )}
                                            {invoice.admin_notes && (
                                                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                                                    <p className="text-sm text-purple-700 font-semibold mb-2">
                                                        {isRTL ? "ملاحظات الإدارة:" : "Admin Notes:"}
                                                    </p>
                                                    <p className="text-gray-800">{invoice.admin_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Items Section */}
                                {invoice.items && invoice.items.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                                            {isRTL ? "تفاصيل الفاتورة" : "Invoice Details"}
                                        </h3>
                                        <div className="space-y-3">
                                            {invoice.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {item.package?.name || item.name || (isRTL ? "منتج" : "Item")}
                                                        </p>
                                                        {item.package?.description && (
                                                            <p className="text-sm text-gray-600">
                                                                {item.package.description}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {isRTL ? "الكمية:" : "Qty:"} {item.quantity || 1}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-main text-lg">
                                                            {item.subtotal || item.price || 0} {isRTL ? "ج.م" : "EGP"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Total Section */}
                                <div className="border-t-2 border-gray-300 pt-6">
                                    <div className="flex justify-between items-center bg-main text-white p-6 rounded-xl">
                                        <span className="text-xl sm:text-2xl font-bold">
                                            {isRTL ? "الإجمالي" : "Total Amount"}
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-black">
                                            {invoice.total_amount} {isRTL ? "ج.م" : "EGP"}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                    {(invoice.pdf_url || invoice.invoice_url) && (
                                        <button
                                            onClick={() => window.open(invoice.pdf_url || invoice.invoice_url, '_blank')}
                                            className="flex-1 cursor-pointer bg-main text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {isRTL ? "عرض الفاتورة" : "View Invoice"}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handlePrint(invoice)}
                                        className="flex-1 cursor-pointer bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        {isRTL ? "طباعة" : "Print"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Invoices;