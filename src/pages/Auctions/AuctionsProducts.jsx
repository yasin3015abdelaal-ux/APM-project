import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { IoLocationOutline } from "react-icons/io5";
import { userAPI, auctionAPI } from "../../api";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import { MdOutlineAttachMoney, MdOutlineEdit } from "react-icons/md";
import Loader from "../../components/Ui/Loader/Loader";

function FilterProducts({ setFilter, categories }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  function handleFilterChange(e) {
    setFilter((prev) => ({ ...prev, category_id: e.target.value }));
  }

  return (
    <div className={`flex items-center gap-2 justify-start`}>
      <select
        className="text-white bg-main focus:outline-none rounded-md px-4 py-2 text-sm cursor-pointer"
        name="category_id"
        onChange={handleFilterChange}
      >
        <option value="all">{isRTL ? "كل الفئات" : "All Categories"}</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {isRTL ? category.name_ar : category.name_en}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProductItem({ item, currentAuctionId, onSuccess, isRegisteredAsSeller, showToast, isAddedToAuction = false, isPastAuction = false }) {
  const { id, images, image, name, name_ar, name_en, governorate, price } = item;
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const imageUrl = images && images.length > 0 ? images[0] : image;
  const displayName = isRTL ? name_ar : name_en || name;
  
  const auctionPrice = item.auction_price;
  const displayPrice = auctionPrice || price;

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [currentAuctionPrice, setCurrentAuctionPrice] = useState(auctionPrice || "");
  const [loading, setLoading] = useState(false);

  const handleAddOrUpdateAuction = async () => {
    if (isPastAuction) {
      showToast(
        isRTL ? "لا يمكن تعديل المزادات القديمة" : "Cannot modify past auctions",
        "error"
      );
      return;
    }

    if (!isRegisteredAsSeller) {
      showToast(
        isRTL ? "يجب أن تكون مسجلاً كبائع في هذا المزاد أولاً" : "You must be registered as a seller in this auction first",
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

    if (!currentAuctionId) {
      showToast(
        isRTL ? "لا يوجد مزاد محدد" : "No auction selected",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        auction_id: currentAuctionId,
        product_id: id,
        auction_price: parseFloat(currentAuctionPrice)
      };
      
      console.log("🔍 [DEBUG] Sending payload:", payload);
      
      const response = await auctionAPI.addProductToAuction(currentAuctionId, payload);
      
      console.log("🔍 [DEBUG] API Response:", response.data);
      
      if (response.data.success) {
        showToast(
          isRTL 
            ? isAddedToAuction ? "تم تعديل سعر المزاد بنجاح" : "تم إضافة المنتج إلى المزاد بنجاح"
            : isAddedToAuction ? "Auction price updated successfully" : "Product added to auction successfully",
          "success"
        );
        setShowAuctionModal(false);
        
        if (onSuccess) onSuccess();
      } else {
        const errorMessage = response.data.message || 
          (isRTL ? "فشل في العملية" : "Operation failed");
        showToast(errorMessage, "error");
      }
      
    } catch (error) {
      console.error("Error in auction operation:", error);
      console.error("Error details:", error.response?.data);
      
      let errorMessage = "";
      
      if (error.response?.status === 403) {
        errorMessage = isRTL 
          ? "يجب أن تكون مسجلاً كبائع في هذا المزاد لإضافة منتجات. يرجى التسجيل كبائع أولاً." 
          : "You must be registered as a seller in this auction to add products. Please register as a seller first.";
      } else if (error.response?.status === 422) {
        errorMessage = error.response.data.message || 
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

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
        isPastAuction ? 'opacity-90' : ''
      }`}>
        <div className="h-48 bg-gray-100 relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`image-logo-for-${id}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`${imageUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gray-100`}
          >
            <PlaceholderSVG />
          </div>
          
          {isAddedToAuction && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {isRTL ? "مضاف للمزاد" : "Added to Auction"}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-1">
            {displayName}
          </h3>
          
          <div className="flex items-center gap-1 mb-3">
            <IoLocationOutline className="text-main" size={16} />
            <p className="font-medium text-sm text-gray-700">
              {isRTL ? governorate?.name_ar : governorate?.name_en}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h6 className="font-bold text-xl text-main">
                {displayPrice} {isRTL ? "جنيه" : "EGP"}
              </h6>
              {auctionPrice && price && auctionPrice !== price && (
                <p className="text-xs text-gray-500 line-through">
                  {price} {isRTL ? "جنيه" : "EGP"}
                </p>
              )}
            </div>
            
            {!isPastAuction ? (
              <button 
                onClick={() => setShowAuctionModal(true)}
                className={`py-2 px-3 rounded-lg transition text-sm cursor-pointer flex items-center gap-1 ${
                  isAddedToAuction 
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
            ) : (
              <span className="bg-gray-100 text-gray-600 py-2 px-3 rounded-lg text-sm font-medium">
                {isRTL ? "مضاف" : "Added"}
              </span>
            )}
          </div>
        </div>
      </div>

      {showAuctionModal && !isPastAuction && (
        <div className="fixed inset-0 bg-[#00000062] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-main mb-4">
              {isRTL 
                ? isAddedToAuction ? "تعديل سعر المزاد" : "إضافة المنتج للمزاد"
                : isAddedToAuction ? "Edit Auction Price" : "Add Product to Auction"
              }
            </h3>
            
            {!isRegisteredAsSeller && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  {isRTL 
                    ? "يجب التسجيل كبائع في المزاد أولاً قبل إضافة المنتجات" 
                    : "You must register as a seller in the auction first before adding products"
                  }
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  {isRTL ? "سعر المزاد" : "Auction Price"}
                </label>
                <input
                  type="number"
                  value={currentAuctionPrice}
                  onChange={(e) => setCurrentAuctionPrice(e.target.value)}
                  placeholder={isRTL ? "أدخل سعر المزاد" : "Enter auction price"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main"
                  disabled={!isRegisteredAsSeller}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAuctionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleAddOrUpdateAuction}
                  disabled={loading || !currentAuctionPrice || !isRegisteredAsSeller}
                  className="flex-1 bg-main text-white py-2 rounded-lg hover:bg-green-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (isRTL ? "جاري الحفظ..." : "Saving...") 
                    : (isRTL 
                        ? isAddedToAuction ? "تحديث السعر" : "إضافة" 
                        : isAddedToAuction ? "Update Price" : "Add"
                      )
                  }
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
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  
  const currentAuctionId = location.state?.auctionId;
  const isPastAuction = location.state?.isPastAuction || false;
  
  const [filter, setFilter] = useState({ category_id: "all" });
  const [products, setProducts] = useState([]);
  const [auctionProducts, setAuctionProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auctionProductsLoading, setAuctionProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegisteredAsSeller, setIsRegisteredAsSeller] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAuctionProducts = async () => {
    if (!currentAuctionId) return;
    
    setAuctionProductsLoading(true);
    try {
      const response = await auctionAPI.getMyProducts(currentAuctionId);
      const auctionProductsData = response.data.data || [];
      
      console.log("🔍 [DEBUG] Auction Products Data:", auctionProductsData);
      
      const extractedProducts = auctionProductsData.map(item => ({
        ...item.product,
        auction_price: item.auction_price,
        added_at: item.added_at,
        auction_id: item.auction_id,
        auction_status: item.auction_status,
        isAddedToAuction: true
      }));
      
      setAuctionProducts(extractedProducts);
    } catch (error) {
      console.error("Error fetching auction products:", error);
      setAuctionProducts([]);
    } finally {
      setAuctionProductsLoading(false);
    }
  };

  const checkSellerRegistration = async () => {
    if (!currentAuctionId || isPastAuction) return;
    
    try {
      await fetchAuctionProducts();
      setIsRegisteredAsSeller(true);
    } catch (error) {
      console.error("Error checking seller registration:", error);
      setIsRegisteredAsSeller(false);
    }
  };

  const registerAsSeller = async () => {
    if (!currentAuctionId) {
      showToast(
        isRTL ? "لا يوجد مزاد محدد" : "No auction selected",
        "error"
      );
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await auctionAPI.participate(currentAuctionId, 'seller');
      
      if (response.data.success) {
        setIsRegisteredAsSeller(true);
        showToast(
          isRTL ? "تم التسجيل كبائع في المزاد بنجاح" : "Successfully registered as seller",
          "success"
        );
        fetchAuctionProducts();
      } else {
        showToast(
          response.data.message || (isRTL ? "فشل في التسجيل" : "Registration failed"),
          "error"
        );
      }
    } catch (error) {
      console.error("Error registering as seller:", error);
      
      let errorMessage = "";
      if (error.response?.status === 403) {
        errorMessage = isRTL ? "غير مسموح بالتسجيل كبائع" : "Not allowed to register as seller";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = isRTL ? "فشل في التسجيل كبائع" : "Failed to register as seller";
      }
      
      showToast(errorMessage, "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await userAPI.get('/categories');
        setCategories(response.data.data.product_categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
    if (!isPastAuction) {
      checkSellerRegistration();
    }
  }, [currentAuctionId, isPastAuction]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.get("/products/my-products");
      const myProducts = response.data.data || [];
      
      console.log("🔍 [DEBUG] My Products:", myProducts);
      
      if (isPastAuction) {
        const productsInThisAuction = auctionProducts.filter(auctionProduct => 
          auctionProduct.auction_id === currentAuctionId
        );
        
        setProducts(productsInThisAuction);
        setFilteredProducts(productsInThisAuction);
      } else {
        const productsWithStatus = myProducts.map(product => {
          const auctionProduct = auctionProducts.find(ap => 
            ap.id === product.id && ap.auction_id === currentAuctionId
          );
          
          return {
            ...product,
            auction_price: auctionProduct?.auction_price, 
            isAddedToAuction: !!auctionProduct
          };
        });
        
        setProducts(productsWithStatus);
        setFilteredProducts(productsWithStatus);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(isRTL ? "فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقاً." : "Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isRTL, auctionProducts, currentAuctionId, isPastAuction]);

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
    fetchAuctionProducts().then(() => {
      fetchProducts();
    });
  };

  if (loading) {
    return (
      <Loader />
    );
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
          <div className={`fixed top-4 ${isRTL ? "left-20" : "right-4"} z-50 animate-fade-in`}>
            <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"
            }`}>
              {toast.type === "success" ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-semibold">{toast.message}</span>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-bold text-main mb-6 text-center">
          {isPastAuction 
            ? (isRTL ? "مزاد سابق" : "Previous Auction") 
            : (isRTL ? "مزاداتي" : "My Auctions")
          }
        </h3>

        {!isPastAuction && !isRegisteredAsSeller && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <h4 className="text-lg font-bold text-yellow-800 mb-3">
                {isRTL ? "التسجيل كبائع في المزاد" : "Register as Seller in Auction"}
              </h4>
              <p className="text-yellow-700 mb-4">
                {isRTL 
                  ? "يجب التسجيل كبائع في هذا المزاد قبل إضافة المنتجات" 
                  : "You must register as a seller in this auction before adding products"
                }
              </p>
              <button
                onClick={registerAsSeller}
                disabled={registerLoading}
                className="bg-main text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition cursor-pointer disabled:opacity-50"
              >
                {registerLoading 
                  ? (isRTL ? "جاري التسجيل..." : "Registering...") 
                  : (isRTL ? "سجل كبائع في المزاد" : "Register as Seller")
                }
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          {categories.length > 0 && (
            <FilterProducts setFilter={setFilter} categories={categories} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-xl font-bold text-gray-500">
                {isPastAuction 
                  ? (isRTL ? "لا توجد منتجات في هذا المزاد" : "No products in this auction") 
                  : (isRTL ? "لا توجد منتجات متاحة" : "No available products")
                }
              </p>
            </div>
          ) : (
            filteredProducts.map((item) => (
              <ProductItem 
                key={item.id} 
                item={item}
                currentAuctionId={currentAuctionId}
                onSuccess={refreshData}
                isRegisteredAsSeller={isPastAuction ? false : isRegisteredAsSeller}
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