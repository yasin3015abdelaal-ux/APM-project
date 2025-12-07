import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const normalizeAuctions = (raw) => {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    const id = item.id ?? item.auction_id ?? String(index + 1);
    const dateValue = item.date ?? item.start_date ?? item.created_at ?? "";

    let dateLabel = "غير معروف";
    let dayName = "";

    if (dateValue) {
      const d = new Date(dateValue);
      if (!Number.isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString("ar-EG");
        dayName = d.toLocaleDateString("ar-EG", { weekday: "long" });
      }
    }

    return { id, dateLabel, dayName };
  });
};

const AuctionsList = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await adminAPI.get("/auctions");

        let data = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response.data?.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data?.data?.auctions)) {
          data = response.data.data.auctions;
        }

        setAuctions(normalizeAuctions(data));
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError("فشل في تحميل المزادات");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-3">
        <p className="text-lg font-semibold text-rose-600">{error}</p>
        <p className="text-sm text-slate-500">
          حاول إعادة تحميل الصفحة أو التحقق من الاتصال بالإنترنت.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600">
          تصدير
        </button>
        <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
          المزادات
        </h1>
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        {auctions.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            لا توجد مزادات متاحة حالياً.
          </p>
        ) : (
          auctions.map((auction, index) => (
            <button
              key={auction.id}
              onClick={() => navigate(`/dashboard/auctions/${auction.id}`)}
              className={`flex items-center justify-between rounded-lg border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 ${
                index === 0 ? "bg-emerald-500 text-white" : "bg-white"
              }`}
            >
              <span>{auction.dayName}</span>
              <span>{auction.dateLabel}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
};

export default AuctionsList;


