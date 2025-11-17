import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoLocationOutline } from "react-icons/io5";
import { FaRegEdit } from "react-icons/fa";
import Loader from "../../components/Ui/Loader/Loader";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../../api";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import { BiCategoryAlt } from "react-icons/bi";
import { TbListDetails } from "react-icons/tb";


function FilterAds({ setFilter, categories }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const statusOptions = [
    { id: "all", nameAr: "كل الحالات", nameEn: "All Status" },
    { id: "accepted", nameAr: "مقبول", nameEn: "Accepted" },
    { id: "rejected", nameAr: "مرفوض", nameEn: "Rejected" },
    { id: "pending", nameAr: "تحت المراجعة", nameEn: "Pending" },
  ];

  function handleFilterChange(e) {
    setFilter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Category Filter */}
      <select
        className="text-white bg-main focus:outline-none rounded-md px-3 py-1.5 text-sm cursor-pointer"
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
        className="text-white bg-main focus:outline-none rounded-md px-3 py-1.5 text-sm cursor-pointer"
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
  const { id, images, image, name, name_ar, name_en, governorate, price } = item;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  // Use the first image if available
  const imageUrl = images && images.length > 0 ? images[0] : image;
  const displayName = isRTL ? name_ar : name_en || name;

  return (
    <div className="flex rounded-lg border border-gray-200 gap-3 flex-col md:flex-row bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* image */}
      <div className="border-b border-l-0 border-gray-200 p-2 md:border-l md:border-b-0 bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`image-logo-for-${id}`}
            className="w-full object-cover rounded md:w-40 md:h-40"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div 
          className={`${imageUrl ? 'hidden' : 'block'} w-full md:w-40 md:h-40`}
          style={{ display: imageUrl ? 'none' : 'block' }}
        >
          <PlaceholderSVG />
        </div>
      </div>
      {/* text */}
      <div className="flex flex-col flex-1 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg md:text-xl">{displayName}</h3>
          {/* edit */}
          <button 
            onClick={() => navigate(`/ads/${id}/edit`)}
            className="cursor-pointer"
          >
            <FaRegEdit size={30} className="text-main p-1 hover:rounded-4xl hover:bg-gray-300" />
          </button>
        </div>
        <div className="flex items-center gap-1 mb-1.5">
          <IoLocationOutline className="text-main" size={16} />
          <p className="font-medium text-xs md:text-sm text-gray-700">
            {isRTL ? governorate?.name_ar : governorate?.name_en}
          </p>
        </div>
        
        {/* Sub Category (Type) */}
        {item.sub_category && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="font-semibold text-xs md:text-sm text-gray-600">
              {t("ads.type")}:
            </span>
            <p className="font-medium text-xs md:text-sm text-gray-700">
              <BiCategoryAlt className="text-main" size={16} />
              {isRTL ? item.sub_category.name_ar : item.sub_category.name_en}
            </p>
          </div>
        )}
        
        {/* Description */}
        {(item.description || item.description_ar || item.description_en) && (
          <div className="flex flex-col gap-1 mb-2">
            <span className="font-semibold text-xs md:text-sm text-gray-600">
              {t("ads.description")}:
            </span>
            <p className="font-medium text-xs md:text-sm text-gray-700 line-clamp-2">
              <TbListDetails className="text-main" size={16}/>
              {isRTL ? (item.description_ar || item.description) : (item.description_en || item.description)}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 flex-col md:flex-row gap-2">
          <h6 className="font-bold text-xl md:text-2xl text-main">
            {price} {t("ads.concurrency")}
          </h6>
          <button className="bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm cursor-pointer">
            {t("ads.sell")}
          </button>
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
        console.log("resss",response);
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
      filtered = filtered.filter((item) => item.status === filter.status);
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
      <section className="py-6">
        <div className="container">
          <h3 className="text-2xl font-bold text-main mb-4">{t("ads.title")}</h3>
          <div className="flex justify-center items-center min-h-64">
            <p className="text-center text-red-500 text-lg">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      <div className="container">
        <h3 className="text-2xl text-center font-bold text-main mb-3">{t("ads.title")}</h3>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          {/* filter section */}
          <FilterAds setFilter={setFilter} categories={categories} />
          {/* add new ads */}
          <button 
            onClick={() => navigate("/ads/create")}
            className="bg-main text-white py-2 px-4 rounded-lg hover:bg-green-700 transition text-sm cursor-pointer w-full md:w-auto"
          >
            {t("ads.makeAds")}
          </button>
        </div>
        {/* ads list */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAds.length === 0 ? (
            <p className="text-center text-xl md:text-2xl font-bold min-h-96 flex items-center justify-center text-gray-500">
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