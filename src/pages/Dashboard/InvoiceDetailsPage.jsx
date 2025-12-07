import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

// مكتبة تحويل الأرقام للعربي
const numberToArabicWords = (num) => {
  if (num === 0) return "صفر";

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];

  const convertChunk = (n) => {
    if (n === 0) return "";
    
    let result = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    if (h > 0) {
      result += hundreds[h];
      if (t > 0 || o > 0) result += " و";
    }

    if (t === 1) {
      result += teens[o];
    } else {
      if (t > 0) {
        result += tens[t];
        if (o > 0) result += " و";
      }
      if (o > 0 && t !== 1) {
        result += ones[o];
      }
    }

    return result;
  };

  let integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);

  let result = "";

  if (integer >= 1000000) {
    const millions = Math.floor(integer / 1000000);
    result += convertChunk(millions) + " مليون";
    integer = integer % 1000000;
    if (integer > 0) result += " و";
  }

  if (integer >= 1000) {
    const thousands = Math.floor(integer / 1000);
    result += convertChunk(thousands) + " ألف";
    integer = integer % 1000;
    if (integer > 0) result += " و";
  }

  if (integer > 0) {
    result += convertChunk(integer);
  }

  result += " جنيه";

  if (decimal > 0) {
    result += " و" + convertChunk(decimal) + " قرش";
  }

  return result;
};

const InvoiceDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.get(`/invoice-requests/${id}`);
        const data = response.data?.data ?? response.data;
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError("تعذر تحميل بيانات الفاتورة");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const services = useMemo(() => {
    if (!invoice?.items || invoice.items.length === 0) return [];
    
    return invoice.items.map(item => ({
      name: item.package_name,
      description: item.package_description,
      quantity: item.quantity,
      price: parseFloat(item.unit_price) || 0,
      subtotal: parseFloat(item.subtotal) || 0
    }));
  }, [invoice]);

  const total = parseFloat(invoice?.total_amount || 0);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <p className="mb-4 text-center text-lg text-slate-700">
            {error || "لا توجد بيانات متاحة لهذه الفاتورة"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            الرجوع
          </button>
        </div>
      </div>
    );
  }

  const customerName = invoice.user?.name || "عميل بدون اسم";
  const email = invoice.user?.email || invoice.email || "لا يوجد";
  const phone = invoice.user?.phone || "لا يوجد";
  const address = invoice.user?.address || "لا يوجد";
  const userCode = invoice.user?.code || "";
  const activityType = invoice.user?.activity_type?.name_ar || "";

  const getStatusText = (status) => {
    const statusMap = {
      pending: "قيد الانتظار",
      paid: "مدفوعة",
      cancelled: "ملغاة",
      rejected: "مرفوضة"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            .print-header {
              border-bottom: 3px solid #10b981;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .print-table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 20px;
            }
            .print-table th,
            .print-table td {
              border: 1px solid #e2e8f0;
              padding: 12px;
            }
            .print-table th {
              background-color: #f8fafc;
            }
            .print-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .print-amount-words {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              margin-top: 16px;
              border-radius: 8px;
            }
            @page {
              margin: 1.5cm;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-5xl">
          {/* Header with Print Button */}
          <div className="mb-6 flex items-center justify-between no-print">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">الفواتير</h1>
              <p className="mt-1 text-sm text-slate-600">
                بيانات الفاتورة {invoice.request_number}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                طباعة الفاتورة
              </button>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600"
              >
                العودة للفواتير
              </button>
            </div>
          </div>

          {/* Print Area */}
          <div className="print-area">
            {/* Print Header - Only visible when printing */}
            <div className="print-header hidden print:block">
              <div className="text-center">
                <h1 className="font-bold text-emerald-600">فاتورة / Invoice</h1>
              </div>
              <div className="flex justify-between header-info">
                <div>
                  <span className="font-semibold">رقم الفاتورة: </span>
                  <span>{invoice.request_number}</span>
                </div>
                <div>
                  <span className="font-semibold">التاريخ: </span>
                  <span>
                    {new Date(invoice.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">الحالة: </span>
                  <span>{getStatusText(invoice.status)}</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3 print:grid print:print-grid">
              {/* Customer Info */}
              <div className="lg:col-span-1">
                <div className="rounded-lg bg-white p-6 shadow-sm print:shadow-none print:p-0">
                  <h2 className="mb-4 text-lg font-semibold text-slate-800">
                    بيانات العميل
                  </h2>
                  
                  {/* Screen View */}
                  <div className="space-y-3 text-sm print:hidden">
                    <div>
                      <p className="font-medium text-slate-700">الاسم:</p>
                      <p className="text-slate-600">{customerName}</p>
                    </div>

                    {userCode && (
                      <div>
                        <p className="font-medium text-slate-700">كود العميل:</p>
                        <p className="text-slate-600">{userCode}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-slate-700">البريد الإلكتروني:</p>
                      <p className="text-slate-600">{email}</p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700">الهاتف:</p>
                      <p className="text-slate-600">{phone}</p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700">العنوان:</p>
                      <p className="text-slate-600">{address}</p>
                    </div>

                    {activityType && (
                      <div>
                        <p className="font-medium text-slate-700">نوع النشاط:</p>
                        <p className="text-slate-600">{activityType}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-slate-700">نوع الحساب:</p>
                      <p className="text-slate-600">
                        {invoice.user?.type === "individual" ? "فردي" : "شركة"}
                      </p>
                    </div>
                  </div>

                  {/* Print View - Table */}
                  <table className="hidden print:table customer-table">
                    <tbody>
                      <tr>
                        <th>الاسم</th>
                        <td>{customerName}</td>
                      </tr>
                      {userCode && (
                        <tr>
                          <th>كود العميل</th>
                          <td>{userCode}</td>
                        </tr>
                      )}
                      <tr>
                        <th>البريد الإلكتروني</th>
                        <td>{email}</td>
                      </tr>
                      <tr>
                        <th>الهاتف</th>
                        <td>{phone}</td>
                      </tr>
                      <tr>
                        <th>المحافظة</th>
                        <td>{address}</td>
                      </tr>
                      {activityType && (
                        <tr>
                          <th>نوع النشاط</th>
                          <td>{activityType}</td>
                        </tr>
                      )}
                      <tr>
                        <th>نوع الحساب</th>
                        <td>{invoice.user?.type === "individual" ? "فردي" : "شركة"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="lg:col-span-2">
                {/* Invoice Summary - Screen only */}
                <div className="mb-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg print:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">إجمالي المبلغ المستحق</p>
                      <p className="mt-1 text-4xl font-bold">
                        {total.toLocaleString("ar-EG")} ج.م
                      </p>
                    </div>
                    <div>
                      <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4 text-sm">
                    <div>
                      <p className="opacity-90">تاريخ الإصدار</p>
                      <p className="font-medium">
                        {new Date(invoice.created_at).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="opacity-90">رقم الفاتورة</p>
                      <p className="font-medium">{invoice.request_number}</p>
                    </div>
                  </div>
                </div>

                {/* Print Summary - Compact */}
                <div className="hidden print:block print-summary mb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">إجمالي المبلغ:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {total.toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                </div>

                {/* Services Table */}
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm print-table">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-right font-semibold text-slate-700">
                            الخدمة
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-slate-700">
                            العدد
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-slate-700">
                            السعر
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-700">
                            الإجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.map((service, index) => (
                          <tr key={index} className="transition hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-slate-800">
                                  {service.name}
                                </p>
                                {service.description && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">
                              {service.quantity}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">
                              {service.price.toLocaleString("ar-EG")} ج.م
                            </td>
                            <td className="px-6 py-4 text-left font-medium text-slate-800">
                              {service.subtotal.toLocaleString("ar-EG")} ج.م
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-right font-semibold text-slate-800">
                            المجموع الكلي
                          </td>
                          <td className="px-6 py-4 text-left text-lg font-bold text-emerald-600 print:text-slate-800">
                            {total.toLocaleString("ar-EG")} ج.م
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-200 print-amount-words">
                  <p className="text-sm font-medium text-slate-700 mb-1">المبلغ بالحروف:</p>
                  <p className="text-base text-slate-800 font-semibold print:text-xs">
                    {numberToArabicWords(total)} فقط لا غير
                  </p>
                </div>

                {/* Notes Section */}
                {(invoice.notes || invoice.admin_notes) && (
                  <div className="mt-6 rounded-lg bg-white p-6 shadow-sm print:shadow-none print:p-3 print:mt-3">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800 print:mb-2">
                      الملاحظات
                    </h2>
                    {invoice.notes && (
                      <div className="mb-3 print:mb-2">
                        <p className="text-sm font-medium text-slate-700">ملاحظات العميل:</p>
                        <p className="mt-1 text-sm text-slate-600 print:text-xs">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.admin_notes && (
                      <div>
                        <p className="text-sm font-medium text-slate-700">ملاحظات الإدارة:</p>
                        <p className="mt-1 text-sm text-slate-600 print:text-xs">{invoice.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Print Footer */}
                <div className="print-footer hidden print:block text-center">
                  <p>شكراً لتعاملكم معنا</p>
                  <p className="mt-1">هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع أو ختم</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetailsPage;