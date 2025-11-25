import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const dummyUsers = [
  {
    id: "u1",
    accountNumber: "12546",
    name: "محمد مصطفى",
    email: "mohamed@example.com",
    phone: "0100 123 4567",
    registerDate: "15-12-2025",
    type: "تاجر",
    city: "القاهرة",
    adsCount: 22,
  },
  {
    id: "u2",
    accountNumber: "87421",
    name: "أحمد علي",
    email: "ahmed@example.com",
    phone: "0109 987 6543",
    registerDate: "10-11-2025",
    type: "مشتري",
    city: "الجيزة",
    adsCount: 10,
  },
];

const AuctionUserDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams();

  const user = dummyUsers.find((u) => u.id === userId) || dummyUsers[0];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-500">المزادات</p>
          <h1 className="text-2xl font-semibold text-slate-800">
            بيانات العميل في المزاد
          </h1>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          رجوع
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-emerald-700">
            البيانات الأساسية
          </h2>
          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">رقم الحساب</dt>
              <dd>{user.accountNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">الاسم</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">نوع التسجيل</dt>
              <dd>{user.type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">تاريخ التسجيل</dt>
              <dd>{user.registerDate}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-emerald-700">
            بيانات التواصل
          </h2>
          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">البريد الإلكتروني</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">رقم الهاتف</dt>
              <dd>{user.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">المدينة</dt>
              <dd>{user.city}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-slate-900">
                عدد الاعلانات المشترك بها
              </dt>
              <dd>{user.adsCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default AuctionUserDetails;


