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

        const data =
          response.data?.data ??
          response.data?.invoice ??
          response.data ??
          null;

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

  const services = useMemo(
    () => [
      { name: "اشتراك أساسي", quantity: 1, price: invoice?.total || 0 },
      { name: "رسوم خدمة", quantity: 1, price: 0 },
    ],
    [invoice]
  );

  const total = services.reduce(
    (sum, service) => sum + (service.price || 0) * (service.quantity || 0),
    0
  );

  if (loading) {
    return <Loader />;
  }

  if (error || !invoice) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">
          {error || "لا توجد بيانات متاحة لهذه الفاتورة"}
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          الرجوع
        </button>
      </section>
    );
  }

  const customerName =
    invoice.user_name || invoice.customer_name || "عميل بدون اسم";
  const email = invoice.user_email || invoice.email || "example@example.com";
  const phone = invoice.user_phone || invoice.phone || "01000000000";
  const city = invoice.city || "القاهرة، مصر";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">
            الفواتير
          </p>
          <h1 className="text-2xl font-semibold text-slate-800">
            بيانات الفاتورة {invoice.id || id}
          </h1>
          <p className="text-sm text-slate-500">العميل: {customerName}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600"
        >
          العودة للفواتير
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            بيانات الاتصال
          </h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-800">البريد:</span>{" "}
              {email}
            </p>
            <p>
              <span className="font-medium text-slate-800">الهاتف:</span>{" "}
              {phone}
            </p>
            <p>
              <span className="font-medium text-slate-800">المدينة:</span>{" "}
              {city}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">ملخص الفاتورة</h2>
          <p className="mt-4 text-3xl font-bold text-emerald-600">
            {total.toLocaleString("ar-EG")} ج.م
          </p>
          <p className="text-sm text-slate-500">إجمالي المبلغ المستحق</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الخدمة
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                العدد
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                السعر
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody>
            {services.slice(0, 2).map((service) => (
              <tr
                key={service.name}
                className="border-t border-slate-100 text-right text-slate-700"
              >
                <td className="px-4 py-4 font-medium">{service.name}</td>
                <td className="px-4 py-4">{service.quantity}</td>
                <td className="px-4 py-4">
                  {service.price.toLocaleString("ar-EG")} ج.م
                </td>
                <td className="px-4 py-4">
                  {(service.price * service.quantity).toLocaleString("ar-EG")} ج.م
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default InvoiceDetailsPage;

