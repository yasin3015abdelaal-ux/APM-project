import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { IoLocationOutline } from "react-icons/io5";
import { userAPI, auctionAPI } from "../../api";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import Loader from "../../components/Ui/Loader/Loader";

function FilterProducts({ setFilter, categories }) {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    function handleFilterChange(e) {
        setFilter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <div className={`flex flex-wrap gap-4 mb-6 justify-start`}>
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

            <select
                className="text-white bg-main focus:outline-none rounded-md px-4 py-2 text-sm cursor-pointer"
                name="date_filter"
                onChange={handleFilterChange}
            >
                <option value="all">{isRTL ? "كل التواريخ" : "All Dates"}</option>
                <option value="last_week">{isRTL ? "الأسبوع الماضي" : "Last Week"}</option>
                <option value="last_month">{isRTL ? "الشهر الماضي" : "Last Month"}</option>
                <option value="last_3_months">{isRTL ? "آخر 3 أشهر" : "Last 3 Months"}</option>
            </select>
        </div>
    );
}

function ProductItem({ item }) {
    const { id, images, image, name, name_ar, name_en, governorate, price, auction_price, auction, added_at } = item;
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const imageUrl = images && images.length > 0 ? images[0] : image;
    const displayName = isRTL ? name_ar : name_en || name;
    const displayPrice = auction_price || price;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden opacity-90">
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

                <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {isRTL ? "مزاد سابق" : "Previous Auction"}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">
                    {displayName}
                </h3>

                <div className="flex items-center gap-1 mb-2">
                    <IoLocationOutline className="text-main" size={16} />
                    <p className="font-medium text-sm text-gray-700">
                        {isRTL ? governorate?.name_ar : governorate?.name_en}
                    </p>
                </div>

                {auction && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                            {isRTL ? "تاريخ المزاد:" : "Auction Date:"} {formatDate(auction.start_time)}
                        </p>
                    </div>
                )}

                {added_at && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-500">
                            {isRTL ? "أضيف في:" : "Added on:"} {formatDate(added_at)}
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h6 className="font-bold text-xl text-main">
                            {displayPrice} {isRTL ? "جنيه" : "EGP"}
                        </h6>
                        {auction_price && price && auction_price !== price && (
                            <p className="text-xs text-gray-500 line-through">
                                {price} {isRTL ? "جنيه" : "EGP"}
                            </p>
                        )}
                    </div>

                    <span className="bg-gray-100 text-gray-600 py-2 px-3 rounded-lg text-sm font-medium">
                        {isRTL ? "مباع" : "Sold"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function PreviousAuctions() {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const [filter, setFilter] = useState({
        category_id: "all",
        date_filter: "all"
    });
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
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
    }, []);

    const fetchPreviousProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await auctionAPI.getPreviousProducts();
            console.log("🔍 [DEBUG] Previous Products Response:", response.data);

            const previousProducts = response.data.data || [];
            setProducts(previousProducts);
            setFilteredProducts(previousProducts);
        } catch (err) {
            console.error("Error fetching previous products:", err);
            setError(isRTL ? "فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقاً." : "Failed to load products. Please try again later.");
            showToast(
                isRTL ? "فشل في تحميل المنتجات" : "Failed to load products",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreviousProducts();
    }, [isRTL]);

    useEffect(() => {
        let filtered = [...products];

        if (filter.category_id && filter.category_id !== "all") {
            filtered = filtered.filter(
                (item) => item.category?.id === parseInt(filter.category_id)
            );
        }

        if (filter.date_filter && filter.date_filter !== "all") {
            const now = new Date();
            let startDate = new Date();

            switch (filter.date_filter) {
                case "last_week":
                    startDate.setDate(now.getDate() - 7);
                    break;
                case "last_month":
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case "last_3_months":
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                default:
                    startDate = null;
            }

            if (startDate) {
                filtered = filtered.filter((item) => {
                    const itemDate = new Date(item.added_at || item.auction?.start_time);
                    return itemDate >= startDate;
                });
            }
        }

        setFilteredProducts(filtered);
    }, [filter, products]);

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
                        {isRTL ? "المزادات السابقة" : "Previous Auctions"}
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
                        <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"
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
                    {isRTL ? "المزادات السابقة" : "Previous Auctions"}
                </h3>

                <FilterProducts setFilter={setFilter} categories={categories} />

                {filteredProducts.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-main">
                                    {filteredProducts.length}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isRTL ? "إجمالي المنتجات" : "Total Products"}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-green-600">
                                    {categories.length}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isRTL ? "الفئات" : "Categories"}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-blue-600">
                                    {new Set(filteredProducts.map(p => p.auction?.id)).size}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isRTL ? "عدد المزادات" : "Auctions Count"}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                                <div className="text-lg font-bold text-orange-600">
                                    {new Set(filteredProducts.map(p => p.governorate?.id)).size}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isRTL ? "المحافظات" : "Governorates"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-xl font-bold text-gray-500 mb-4">
                                {isRTL ? "لا توجد منتجات في المزادات السابقة" : "No products in previous auctions"}
                            </p>
                            <p className="text-gray-600">
                                {isRTL
                                    ? "لم تشارك في أي مزادات سابقة أو لم تقم بإضافة منتجات"
                                    : "You haven't participated in any previous auctions or added products"
                                }
                            </p>
                        </div>
                    ) : (
                        filteredProducts.map((item) => (
                            <ProductItem
                                key={`${item.id}-${item.auction?.id}`}
                                item={item}
                            />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}