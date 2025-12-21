import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { IoLocationOutline } from "react-icons/io5";
import {
  getCachedCategories,
  getCachedMyProducts,
  getCachedMyAuctionProducts,
  clearCache,
  auctionAPI,
} from "../../api";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import { MdOutlineAttachMoney, MdOutlineEdit } from "react-icons/md";
import Loader from "../../components/Ui/Loader/Loader";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";
import { HeartIcon } from "lucide-react";

function FilterProducts({ setFilter, filter, categories }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const categoryOptions = [
    {
      value: "all",
      label: isRTL ? "كل الفئات" : "All Categories",
    },
    ...categories.map((category) => ({
      value: category.id,
      label: isRTL ? category.name_ar : category.name_en,
    })),
  ];
  return (
    <div className="flex items-center gap-2 justify-start">
      <CustomSelect
        options={categoryOptions}
        value={filter.category_id}
        onChange={(value) =>
          setFilter((prev) => ({ ...prev, category_id: value }))
        }
        placeholder={isRTL ? "كل الفئات" : "All Categories"}
        isRTL={isRTL}
        className="min-w-[180px]"
      />
    </div>
  );
}

function ProductItem({
  item,
  currentAuctionId,
  onSuccess,
  isRegisteredAsSeller,
  showToast,
  isAddedToAuction = false,
  isPastAuction = false,
}) {
  const { id, images, image, name, name_ar, name_en, governorate, price } = item;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get all images
  const allImages = images && images.length > 0
    ? images
    : (image ? [image] : []);

  const hasMultipleImages = allImages.length > 1;

  // Auto-slide effect
  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, allImages.length]);

  const goToImage = (e, index) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const displayName = isRTL ? name_ar : name_en || name;
  const auctionPrice = item.auction_price;
  const displayPrice = auctionPrice || price;

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [currentAuctionPrice, setCurrentAuctionPrice] = useState(
    auctionPrice || ""
  );
  const [loading, setLoading] = useState(false);

  const handleAddOrUpdateAuction = async () => {
    if (isPastAuction) {
      showToast(
        isRTL
          ? "لا يمكن تعديل المزادات القديمة"
          : "Cannot modify past auctions",
        "error"
      );
      return;
    }

    if (!currentAuctionPrice) {
      showToast(
        isRTL ? "يرجى إدخال سعر المزاد" : "Please enter auction price",
        "error"
      );
      return;
    }

    if (parseFloat(currentAuctionPrice) >= parseFloat(price)) {
      showToast(
        isRTL
          ? "سعر المزاد يجب أن يكون أقل من السعر الأصلي"
          : "Auction price must be lower than the original price",
        "error"
      );
      return;
    }

    if (!currentAuctionId) {
      showToast(isRTL ? "لا يوجد مزاد محدد" : "No auction selected", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        auction_id: currentAuctionId,
        product_id: id,
        auction_price: parseFloat(currentAuctionPrice),
      };

      const response = await auctionAPI.addProductToAuction(
        currentAuctionId,
        payload
      );

      if (response.data.success) {
        clearCache(`my_auction_products_${currentAuctionId}`);

        showToast(
          isRTL
            ? isAddedToAuction
              ? "تم تعديل سعر المزاد بنجاح"
              : "تم إضافة المنتج إلى المزاد بنجاح"
            : isAddedToAuction
              ? "Auction price updated successfully"
              : "Product added to auction successfully",
          "success"
        );
        setShowAuctionModal(false);

        if (onSuccess) onSuccess();
      } else {
        const errorMessage =
          response.data.message ||
          (isRTL ? "فشل في العملية" : "Operation failed");
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error in auction operation:", error);

      let errorMessage = "";

      if (error.response?.status === 422) {
        errorMessage =
          error.response.data.message ||
          (isRTL ? "بيانات غير صالحة" : "Invalid data");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = isRTL ? "فشل في العملية" : "Operation failed";
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentAuctionPrice(auctionPrice || "");
  }, [auctionPrice]);

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || !isNaN(value)) {
      setCurrentAuctionPrice(value);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isPastAuction ? "opacity-90" : ""
          }`}
      >
        {/* Image with Auto Slider */}
        <div className="h-36 bg-gray-100 relative group">
          {allImages.length > 0 && allImages[currentImageIndex] ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-gray-100 absolute top-0 left-0">
                <PlaceholderSVG />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlaceholderSVG />
            </div>
          )}

          {isAddedToAuction && !isPastAuction && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
              {isRTL ? "مضاف للمزاد" : "Added to Auction"}
            </div>
          )}

          {/* Image Indicators (Dots) */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(e, index)}
                  className={`transition-all rounded-full cursor-pointer ${index === currentImageIndex
                      ? 'bg-white w-4 h-2'
                      : 'bg-white/50 hover:bg-white/75 w-2 h-2'
                    }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-main text-sm mb-1 line-clamp-1">
            {displayName}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <IoLocationOutline className="text-main" size={14} />
            <p className="font-medium text-xs text-gray-700">
              {isRTL ? governorate?.name_ar : governorate?.name_en}
            </p>
          </div>

          <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <svg className={`w-3.5 h-3.5 ${isRTL ? 'ml-0.5' : 'mr-0.5'} text-main`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{item.watchers_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="w-3 h-3 text-red-600" />
              <span>{item.interested_count || 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between">
              <h6 className="font-bold text-base text-main">
                {displayPrice} {isRTL ? "جنيه" : "EGP"}
              </h6>
              {auctionPrice && price && auctionPrice !== price && (
                <p className="text-xs text-gray-500 line-through">
                  {price} {isRTL ? "جنيه" : "EGP"}
                </p>
              )}
            </div>

            {!isPastAuction && (
              <button
                onClick={() => setShowAuctionModal(true)}
                className={`py-1.5 px-2.5 rounded-lg transition text-xs cursor-pointer flex items-center justify-center gap-1 w-full md:w-auto ${isAddedToAuction
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-main text-white hover:bg-green-700"
                  }`}
              >
                {isAddedToAuction ? (
                  <>
                    <MdOutlineEdit size={14} />
                    {isRTL ? "تعديل السعر" : "Edit Price"}
                  </>
                ) : (
                  <>
                    <MdOutlineAttachMoney size={14} />
                    {isRTL ? "إضافة للمزاد" : "Add to Auction"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showAuctionModal && !isPastAuction && (
        <div className="fixed inset-0 bg-[#00000062] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-main mb-4">
              {isRTL
                ? isAddedToAuction
                  ? "تعديل سعر المزاد"
                  : "إضافة المنتج للمزاد"
                : isAddedToAuction
                  ? "Edit Auction Price"
                  : "Add Product to Auction"}
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 justify-between flex">
                  {isRTL ? "السعر الأصلي للمنتج:" : "Original Product Price:"}
                  <span className="text-lg font-bold text-main">
                    {price} {isRTL ? "جنيه" : "EGP"}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {isRTL ? "سعر المزاد" : "Auction Price"}
                </label>
                <input
                  type="number"
                  value={currentAuctionPrice}
                  onChange={handlePriceChange}
                  max={price}
                  step="0.01"
                  placeholder={
                    isRTL ? "أدخل سعر المزاد" : "Enter auction price"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
                  disabled={!isRegisteredAsSeller}
                />
                {currentAuctionPrice &&
                  parseFloat(currentAuctionPrice) >= parseFloat(price) && (
                    <p className="text-red-500 text-xs mt-1">
                      {isRTL
                        ? "سعر المزاد يجب أن يكون أقل من السعر الأصلي"
                        : "Auction price must be lower than the original price"}
                    </p>
                  )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAuctionModal(false);
                    setCurrentAuctionPrice("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleAddOrUpdateAuction}
                  disabled={
                    loading ||
                    !currentAuctionPrice ||
                    !isRegisteredAsSeller ||
                    parseFloat(currentAuctionPrice) > parseFloat(price)
                  }
                  className="flex-1 bg-main text-white py-2 rounded-lg hover:bg-green-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? isAddedToAuction
                        ? "تحديث السعر"
                        : "إضافة"
                      : isAddedToAuction
                        ? "Update Price"
                        : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AuctionProducts() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const location = useLocation();

  const currentAuctionId = location.state?.auctionId;
  const isPastAuction = location.state?.isPastAuction || false;

  const [filter, setFilter] = useState({ category_id: "all" });
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegisteredAsSeller, setIsRegisteredAsSeller] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    if (!currentAuctionId) return;

    try {
      setLoading(true);
      setError(null);


      const { data: categoriesData, fromCache: catFromCache } = await getCachedCategories();
      console.log(catFromCache ? "📦 Categories من الكاش" : "🌐 Categories من API");

      let auctionProductsData = [];
      if (isPastAuction) {
        const userId = JSON.parse(localStorage.getItem("userData"))?.id;
        const { data, fromCache } = await getCachedMyAuctionProducts(currentAuctionId, userId);
        console.log(fromCache ? "📦 Previous Products من الكاش" : "🌐 Previous Products من API");
        auctionProductsData = data;
      } else {
        const { data, fromCache } = await getCachedMyAuctionProducts(currentAuctionId);
        console.log(fromCache ? "📦 Auction Products من الكاش" : "🌐 Auction Products من API");
        auctionProductsData = data;
      }

      const extractedAuctionProducts = auctionProductsData.map((item) => ({
        ...item.product,
        auction_price: item.auction_price,
        added_at: item.added_at,
        auction_id: item.auction_id,
        auction_status: item.auction_status,
        isAddedToAuction: true,
      }));

      let finalProducts = [];
      if (isPastAuction) {
        finalProducts = extractedAuctionProducts.filter(
          (p) => p.auction_id === currentAuctionId
        );
      } else {
        const { data: myProducts, fromCache } = await getCachedMyProducts();
        console.log(fromCache ? "📦 My Products من الكاش" : "🌐 My Products من API");

        finalProducts = myProducts.map((product) => {
          const auctionProduct = extractedAuctionProducts.find(
            (ap) => ap.id === product.id && ap.auction_id === currentAuctionId
          );

          return {
            ...product,
            auction_price: auctionProduct?.auction_price,
            isAddedToAuction: !!auctionProduct,
          };
        });
      }


      setCategories(categoriesData);
      setProducts(finalProducts);
      setFilteredProducts(finalProducts);

      if (!isPastAuction && extractedAuctionProducts.length >= 0) {
        setIsRegisteredAsSeller(true);
      }

    } catch (err) {
      setError(
        isRTL
          ? "فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقاً."
          : "Failed to load products. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [currentAuctionId, isPastAuction, isRTL]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    let filtered = [...products];

    if (filter.category_id && filter.category_id !== "all") {
      filtered = filtered.filter(
        (item) => item.category?.id === parseInt(filter.category_id)
      );
    }

    setFilteredProducts(filtered);
  }, [filter, products]);

  const refreshData = () => {
    clearCache(`my_auction_products_${currentAuctionId}`);
    clearCache("my_products");
    loadAllData();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container">
          <h3 className="text-2xl font-bold text-main mb-4 text-center">
            {isRTL ? "مزاداتي" : "My Auctions"}
          </h3>
          <div className="flex justify-center items-center min-h-64">
            <p className="text-center text-red-500 text-lg">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container">
        {toast && (
          <div
            className={`fixed top-4 ${isRTL ? "left-20" : "right-4"
              } z-50 animate-fade-in`}
          >
            <div
              className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success"
                  ? "bg-main text-white"
                  : "bg-red-500 text-white"
                }`}
            >
              {toast.type === "success" ? (
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="font-semibold">{toast.message}</span>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-bold text-main mb-6 text-center">
          {isPastAuction
            ? isRTL
              ? "مزاد سابق"
              : "Previous Auction"
            : isRTL
              ? "مزاداتي"
              : "My Auctions"}
        </h3>

        <div className="mb-6">
          {categories.length > 0 && (
            <FilterProducts
              setFilter={setFilter}
              filter={filter}
              categories={categories}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl font-bold text-gray-500">
                {isPastAuction
                  ? isRTL
                    ? "لا توجد منتجات في هذا المزاد"
                    : "No products in this auction"
                  : isRTL
                    ? "لا توجد منتجات متاحة"
                    : "No available products"}
              </p>
            </div>
          ) : (
            filteredProducts.map((item) => (
              <ProductItem
                key={item.id}
                item={item}
                currentAuctionId={currentAuctionId}
                onSuccess={refreshData}
                isRegisteredAsSeller={
                  isPastAuction ? false : isRegisteredAsSeller
                }
                showToast={showToast}
                isAddedToAuction={isPastAuction ? true : item.isAddedToAuction}
                isPastAuction={isPastAuction}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}