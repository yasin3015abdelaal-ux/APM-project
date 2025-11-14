import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import fakeImage from "../../assets/images/sadia-chicken.png";
import { IoLocationOutline } from "react-icons/io5";
import { FaEye, FaRegEdit, FaRegHeart } from "react-icons/fa";
import IconButton from "../../components/Ui/IconButtons/IconButton";
import Button from "../../components/Ui/Button/Button";
import Loader from "../../components/Ui/Loader/Loader";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";

function FilterAds({ setFilter, categories }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const statusOptions = [
    { id: "all", nameAr: "كل الحالات", nameEn: "All Status" },
    { id: 1, nameAr: "مقبول", nameEn: "Accepted" },
    { id: 2, nameAr: "مرفوض", nameEn: "Rejected" },
    { id: 3, nameAr: "تحت المراجعة", nameEn: "Under Review" },
    { id: 4, nameAr: "انتظار", nameEn: "Pending" }
  ];

  function handleFilterChange(e) {
    setFilter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Category Filter */}
      <select
        className="text-white bg-main focus:outline-none rounded-md px-3 py-2"
        name="category_id"
        onChange={handleFilterChange}
      >
        <option value="all">{t("ads.filterSection.allCategories")}</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {isRTL ? category.name_ar : category.name_en}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        className="text-white bg-main focus:outline-none rounded-md px-3 py-2"
        name="status"
        onChange={handleFilterChange}
      >
        {statusOptions.map((option) => (
          <option value={option.id} key={option.id}>
            {isRTL ? option.nameAr : option.nameEn}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdsItem({ item }) {
  const { id, images, name, governorate, views, likes, price } = item;
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Use the first image if available, otherwise use fakeImage
  const imageUrl = images && images.length > 0 ? images[0] : fakeImage;

  return (
    <div className="flex rounded-xl border-2 border-main gap-2 flex-col md:flex-row">
      {/* image */}
      <div className="border-b-2 border-l-0 border-main p-2 md:border-l-2 md:border-b-0">
        <img
          src={imageUrl}
          alt={`image-logo-for-${id}`}
          className="w-full object-cover md:w-48 md:h-48"
        />
      </div>
      {/* text */}
      <div className="flex flex-col ms-3 md:ms-0 flex-1 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-2xl md:text-3xl my-1">{name}</h3>
          {/* edit */}
          <IconButton 
            size="medium" 
            onClick={() => navigate(`/ads/${id}/edit`)}
          >
            <FaRegEdit />
          </IconButton>
        </div>
        <div className="flex items-center gap-1">
          <IoLocationOutline className="text-main" size={20} />
          <p className="font-semibold text-sm md:text-base">
            {governorate?.name_a || "موقع غير محدد"}
          </p>
        </div>
        <div className="flex items-center my-2 gap-1">
          <FaEye className="text-main" size={20} />
          <p className="font-semibold text-sm md:text-base">
            {t("ads.watcher")}: {views || 0}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <FaRegHeart className="text-main" size={20} />
          <p className="font-semibold text-sm md:text-base">
            {t("ads.interested")}: {likes || 0}
          </p>
        </div>
        <div className="flex items-center justify-between mt-auto mb-2 me-2 flex-col md:flex-row gap-2">
          <h6 className="font-bold text-2xl md:text-3xl">
            {price} {t("ads.concurrency")}
          </h6>
          <Button>{t("ads.sell")}</Button>
        </div>
      </div>
    </div>
  );
}

export default function Ads() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ status: "all", category_id: "all" });
  const [adsItems, setAdsItems] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await userAPI.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch ads data from API
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userAPI.get("/products/my-products");
        setAdsItems(response.data.data || []);
        setFilteredAds(response.data.data || []);
      } catch (err) {
        console.error("Error fetching ads:", err);
        setError("فشل في تحميل الإعلانات. يرجى المحاولة مرة أخرى لاحقاً.");
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...adsItems];

    // Filter by category
    if (filter.category_id && filter.category_id !== "all") {
      filtered = filtered.filter(
        (item) => item.category_id === parseInt(filter.category_id)
      );
    }

    // Filter by status
    if (filter.status && filter.status !== "all") {
      filtered = filtered.filter(
        (item) => item.status === parseInt(filter.status)
      );
    }

    setFilteredAds(filtered);
  }, [filter, adsItems]);

  // Handle loading state
  if (loading) {
    return <Loader />;
  }

  // Handle error state
  if (error) {
    return (
      <section>
        <div className="container">
          <h3 className="section__title">{t("ads.title")}</h3>
          <div className="flex justify-center items-center min-h-64">
            <p className="text-center text-red-500 text-xl">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="container">
        <h3 className="section__title">{t("ads.title")}</h3>
        <div className="flex items-center justify-between flex-wrap gap-3 my-4">
          {/* filter section */}
          <FilterAds setFilter={setFilter} categories={categories} />
          {/* add new ads */}
          <Button onClick={() => navigate("/ads/create")}>
            {t("ads.makeAds")}
          </Button>
        </div>
        {/* ads list */}
        <div className="grid grid-cols-1 gap-4 my-3">
          {filteredAds.length === 0 ? (
            <p className="text-center text-2xl md:text-3xl font-bold min-h-screen flex items-center justify-center">
              {t("ads.noContent")}
            </p>
          ) : (
            filteredAds.map((item) => <AdsItem key={item.id} item={item} />)
          )}
        </div>
      </div>
    </section>
  );
}