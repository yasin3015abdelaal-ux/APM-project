import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

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

  // تنسيق حالة الفاتورة
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
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">الفواتير</h1>
            <p className="mt-1 text-sm text-slate-600">
              بيانات الفاتورة {invoice.request_number}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600"
          >
            العودة للفواتير
          </button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                بيانات العميل
              </h2>
              
              <div className="space-y-3 text-sm">
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
            </div>
          </div>

          {/* Invoice Details */}
          <div className="lg:col-span-2">
            {/* Invoice Summary */}
            <div className="mb-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
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

            {/* Services Table */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                      <td className="px-6 py-4 text-left text-lg font-bold text-emerald-600">
                        {total.toLocaleString("ar-EG")} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes Section */}
            {(invoice.notes || invoice.admin_notes) && (
              <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  الملاحظات
                </h2>
                {invoice.notes && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-slate-700">ملاحظات العميل:</p>
                    <p className="mt-1 text-sm text-slate-600">{invoice.notes}</p>
                  </div>
                )}
                {invoice.admin_notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-700">ملاحظات الإدارة:</p>
                    <p className="mt-1 text-sm text-slate-600">{invoice.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;