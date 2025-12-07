import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const AuctionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [auction, setAuction] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tradersCount, setTradersCount] = useState(0);
  const [buyersCount, setBuyersCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [auctionsRes, participantsRes] = await Promise.all([
          adminAPI.get("/auctions"),
          adminAPI.get(`/auctions/${id}/participants`),
        ]);

        // Find current auction
        let auctionsData = [];
        if (Array.isArray(auctionsRes.data)) {
          auctionsData = auctionsRes.data;
        } else if (Array.isArray(auctionsRes.data?.data)) {
          auctionsData = auctionsRes.data.data;
        } else if (Array.isArray(auctionsRes.data?.data?.auctions)) {
          auctionsData = auctionsRes.data.data.auctions;
        }

        const currentAuction =
          auctionsData.find(
            (a) =>
              String(a.id ?? a.auction_id) === String(id)
          ) ?? null;

        setAuction(currentAuction);

        if (currentAuction) {
          setTradersCount(currentAuction.max_sellers ?? 0);
          setBuyersCount(currentAuction.max_buyers ?? 0);
        }

        // Normalize participants
        let participants = [];
        if (Array.isArray(participantsRes.data)) {
          participants = participantsRes.data;
        } else if (Array.isArray(participantsRes.data?.data)) {
          participants = participantsRes.data.data;
        } else if (Array.isArray(participantsRes.data?.data?.participants)) {
          participants = participantsRes.data.data.participants;
        }

        const normalizedUsers = participants.map((p, index) => {
          const user = p.user || p.account || {};
          const role = p.role || p.type || "";

          const isSeller =
            role === "seller" ||
            role === "trader" ||
            role === "seller_role";

          return {
            userId:
              user.id ||
              p.user_id ||
              p.account_id ||
              String(index + 1),
            accountNumber:
              user.account_number ||
              p.account_number ||
              user.id ||
              p.id ||
              "-",
            name: user.name || p.user_name || "عميل بدون اسم",
            registerDate: user.created_at || p.created_at || "",
            type: isSeller ? "تاجر" : "مشتري",
            email: user.email || p.email || "example@example.com",
            adsCount: p.ads_count || p.services_count || 0,
          };
        });

        setUsers(normalizedUsers);
      } catch (err) {
        console.error("Error loading auction details:", err);
        setError("فشل في تحميل بيانات المزاد");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const totalParticipants = useMemo(
    () => tradersCount + buyersCount,
    [tradersCount, buyersCount]
  );

  const handleExport = () => {
    if (!users.length) return;

    const exportData = users.map((user) => ({
      "رقم الحساب": user.accountNumber,
      "الاسم": user.name,
      "تاريخ التسجيل": user.registerDate,
      "نوع التسجيل": user.type,
      "البريد": user.email,
      "عدد الاعلانات المشترك بها": user.adsCount,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المشاركون في المزاد");
    XLSX.writeFile(wb, "auction-users.xlsx");
  };

  const remainingTime = useMemo(() => {
    if (!auction?.date) return null;
    const target = new Date(auction.date);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes };
  }, [auction?.date]);

  const handleSaveConfig = async () => {
    if (!auction) {
      setShowConfigModal(false);
      return;
    }

    try {
      setSaving(true);
      await adminAPI.put("/auctions", {
        date: auction.date,
        max_sellers: tradersCount,
        max_buyers: buyersCount,
      });
      setShowConfigModal(false);
    } catch (err) {
      console.error("Error updating auction settings:", err);
      alert("تعذر حفظ إعدادات المزاد، حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">{error}</h1>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          إعادة المحاولة
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            تصدير
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-200"
          >
            إضافة اعداد المزاد
          </button>
        </div>
        <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
          تفاصيل المزاد
        </h1>
      </header>

      {/* Countdown card */}
      <div className="rounded-2xl bg-emerald-500 px-6 py-6 text-center text-white shadow-sm">
        <p className="mb-4 text-lg font-semibold">
          الوقت المتبقي علي فتح المزاد
        </p>
        <div className="flex items-center justify-center gap-6 text-sm sm:text-base">
          <div>
            <p className="text-3xl font-bold">
              {remainingTime?.days ?? 0}
            </p>
            <p>أيام</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {remainingTime?.hours ?? 0}
            </p>
            <p>الساعات</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {remainingTime?.minutes ?? 0}
            </p>
            <p>الدقائق</p>
          </div>
        </div>
      </div>

      {/* Small stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm text-emerald-700">
            عدد التجار المشتركين في المزاد
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {tradersCount}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm text-emerald-700">
            عدد المشترين المشتركين في المزاد
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {buyersCount}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm text-emerald-700">إجمالي عدد المشتركين</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {totalParticipants}
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto rounded-xl border border-emerald-300 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-700">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                رقم الحساب
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                تاريخ التسجيل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الاسم
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                نوع التسجيل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                الايميل
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                عدد الاعلانات المشترك بها
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  لا يوجد مشاركون في هذا المزاد حالياً.
                </td>
              </tr>
            ) : (
              users.map((user) => (
              <tr
                key={user.userId}
                onClick={() =>
                  navigate(`/dashboard/accounts/update-account/${user.userId}`)
                }
                className="cursor-pointer border-t border-emerald-100 text-right text-slate-800 transition hover:bg-emerald-50"
              >
                <td className="px-4 py-3 font-medium">
                  {user.accountNumber}
                </td>
                <td className="px-4 py-3">{user.registerDate}</td>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.type}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.adsCount}</td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Config modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-400 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-emerald-700">
              تحديد اعداد المزاد
            </h2>
            <div className="space-y-4">
              <div className="text-right">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  عدد التجار
                </label>
                <input
                  type="number"
                  value={tradersCount}
                  onChange={(e) => setTradersCount(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="text-right">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  عدد المشترين
                </label>
                <input
                  type="number"
                  value={buyersCount}
                  onChange={(e) => setBuyersCount(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving ? "جاري الحفظ..." : "تحديد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuctionDetails;


