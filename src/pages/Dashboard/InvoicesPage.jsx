import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const statusStyles = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.get("/invoice-requests");

        let data = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response.data?.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data?.data?.invoice_requests)) {
          data = response.data.data.invoice_requests;
        } else if (response.data) {
          data = [response.data];
        }

        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoice requests:", err);
        setError("فشل في تحميل الفواتير");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleRowClick = (invoiceId) => {
    if (!invoiceId) return;
    navigate(`/dashboard/invoice/${invoiceId}`);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <p className="text-sm text-slate-500">
          حاول إعادة تحميل الصفحة أو التحقق من الاتصال بالإنترنت.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm uppercase tracking-widest text-emerald-500">
          الفواتير
        </p>
        <h1 className="text-2xl font-semibold text-slate-800">
          إدارة فواتير العملاء
        </h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                رقم الفاتورة
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                اسم العميل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                قيمة الفاتورة
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                التاريخ
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  لا توجد فواتير متاحة حالياً.
                </td>
              </tr>
            ) : (
              invoices.slice(0, 2).map((invoice) => {
                const id = invoice.id || invoice.invoice_number;
                const customerName =
                  invoice.user_name || invoice.customer_name || "عميل بدون اسم";
                const totalAmount =
                  invoice.total ||
                  invoice.total_amount ||
                  invoice.amount ||
                  0;
                const date =
                  invoice.created_at ||
                  invoice.date ||
                  invoice.paid_at ||
                  "";
                const status = invoice.status || "pending";

                const formattedAmount =
                  typeof totalAmount === "number"
                    ? `${totalAmount.toLocaleString("ar-EG")} ج.م`
                    : totalAmount;

                const formattedDate = date
                  ? new Date(date).toLocaleDateString("ar-EG")
                  : "-";

                return (
                  <tr
                    key={id}
                    onClick={() => handleRowClick(id)}
                    className="cursor-pointer border-t border-slate-100 text-right text-slate-700 transition hover:bg-emerald-50"
                  >
                    <td className="px-4 py-4 font-medium">
                      {id || "—"}
                    </td>
                    <td className="px-4 py-4">{customerName}</td>
                    <td className="px-4 py-4">{formattedAmount}</td>
                    <td className="px-4 py-4">{formattedDate}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[status] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default InvoicesPage;

