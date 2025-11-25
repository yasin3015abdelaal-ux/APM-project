import React from "react";

const subscriptions = [
  {
    id: "SUB-2001",
    customerName: "أحمد علي",
    customerNumber: "+20 101 234 5678",
    startDate: "01-05-2024",
    endDate: "01-05-2025",
    status: "مفعل",
  },
  {
    id: "SUB-2002",
    customerName: "سارة محمد",
    customerNumber: "+20 109 876 5432",
    startDate: "15-03-2024",
    endDate: "15-03-2025",
    status: "منتهي",
  },
];

const statusStyles = {
  مفعل: "bg-emerald-100 text-emerald-700",
  منتهي: "bg-rose-100 text-rose-700",
};

const SubscriptionsPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-emerald-500">
          الاشتراكات
        </p>
        <h1 className="text-2xl font-semibold text-slate-800">
          إدارة اشتراكات العملاء
        </h1>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                رقم الاشتراك
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                اسم العميل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                رقم العميل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                تاريخ البداية
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                تاريخ الانتهاء
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr
                key={subscription.id}
                className="border-t border-slate-100 text-right text-slate-700"
              >
                <td className="px-4 py-4 font-medium">{subscription.id}</td>
                <td className="px-4 py-4">{subscription.customerName}</td>
                <td className="px-4 py-4">{subscription.customerNumber}</td>
                <td className="px-4 py-4">{subscription.startDate}</td>
                <td className="px-4 py-4">{subscription.endDate}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[subscription.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SubscriptionsPage;

