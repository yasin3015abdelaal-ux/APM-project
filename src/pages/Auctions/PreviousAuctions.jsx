import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { IoLocationOutline } from "react-icons/io5";
import { getCachedAuctionProducts, getCachedCategories } from "../../api";
import PlaceholderSVG from "../../assets/PlaceholderSVG";
import Loader from "../../components/Ui/Loader/Loader";
import CustomSelect from "../../components/Ui/CustomSelect/CustomSelect";
import { HeartIcon } from "lucide-react";

function ProductItem({ item }) {
    const { id, images, image, name, name_ar, name_en, governorate, price, auction_price, description, description_ar, description_en, added_at } = item;
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const imageUrl = images && images.length > 0 ? images[0] : image;
    const displayName = isRTL ? name_ar : name_en || name;
    const displayDescription = isRTL ? description_ar : description_en || description;
    const displayPrice = auction_price || price;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden opacity-90">
                <div className="h-36 bg-gray-100 relative">
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
                </div>

                <div className="p-3">
                    <h3 className="font-bold text-main text-sm mb-1 line-clamp-1">
                        {displayName}
                    </h3>

                    {displayDescription && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {displayDescription}
                        </p>
                    )}

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

                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="font-bold text-base text-main">
                                {displayPrice} {isRTL ? "جنيه" : "EGP"}
                            </h6>
                            {auction_price && price && auction_price !== price && (
                                <p className="text-xs text-gray-500 line-through">
                                    {price} {isRTL ? "جنيه" : "EGP"}
                                </p>
                            )}
                        </div>
                    </div>

                    {added_at && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                {isRTL ? "أضيف في:" : "Added on:"} {formatDate(added_at)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PreviousAuctionProducts() {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const location = useLocation();

    const currentAuctionId = location.state?.auctionId;
    const auctionData = location.state?.auction;

    const [filter, setFilter] = useState({ category_id: "all" });
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
                const { data, fromCache } = await getCachedCategories();
                console.log(fromCache ? '📦 Categories من الكاش' : '🌐 Categories من API');
                setCategories(data || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setCategories([]);
            }
        };

        fetchCategories();
    }, []);

    const fetchAuctionProducts = async () => {
        if (!currentAuctionId) {
            setError(isRTL ? "لا يوجد مزاد محدد" : "No auction selected");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, fromCache } = await getCachedAuctionProducts(currentAuctionId);
            console.log(fromCache ? '📦 Auction Products من الكاش' : '🌐 Auction Products من API');

            const auctionProducts = data || [];

            const formattedProducts = auctionProducts.map(item => ({
                ...item.product,
                auction_price: item.auction_price,
                added_at: item.added_at,
                auction_id: item.auction_id
            }));

            setProducts(formattedProducts);
            setFilteredProducts(formattedProducts);
        } catch (err) {
            console.error("Error fetching auction products:", err);
            setError(isRTL ? "فشل في تحميل المنتجات" : "Failed to load products");
            showToast(
                isRTL ? "فشل في تحميل المنتجات" : "Failed to load products",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctionProducts();
    }, [currentAuctionId]);

    useEffect(() => {
        let filtered = [...products];

        if (filter.category_id && filter.category_id !== "all") {
            filtered = filtered.filter(
                (item) => item.category?.id === parseInt(filter.category_id)
            );
        }

        setFilteredProducts(filtered);
    }, [filter, products]);

    const formatAuctionDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <section className="py-8">
                <div className="container">
                    <h3 className="text-2xl font-bold text-main mb-4 text-center">
                        {isRTL ? "المزاد السابق" : "Previous Auction"}
                    </h3>
                    <div className="flex justify-center items-center min-h-64">
                        <p className="text-center text-red-500 text-lg">{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    const categoryOptions = [
        { value: "all", label: isRTL ? "كل الفئات" : "All Categories" },
        ...categories.map(cat => ({
            value: cat.id.toString(),
            label: isRTL ? cat.name_ar : cat.name_en
        }))
    ];

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

                <h3 className="text-2xl font-bold text-main mb-2 text-center">
                    {isRTL ? "المزاد السابق" : "Previous Auction"}
                </h3>

                {auctionData && (
                    <p className="text-center text-sm text-gray-600">
                        {formatAuctionDate(auctionData.start_time)}
                    </p>
                )}

                {/* Filter Section with CustomSelect */}
                <div className="flex justify-start mb-6">
                    <CustomSelect
                        options={categoryOptions}
                        value={filter.category_id}
                        onChange={(value) => setFilter((prev) => ({ ...prev, category_id: value }))}
                        placeholder={isRTL ? "كل الفئات" : "All Categories"}
                        isRTL={isRTL}
                        className="min-w-[180px]"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <p className="text-xl font-bold text-gray-500 mb-4">
                                {isRTL ? "لا توجد منتجات في هذا المزاد" : "No products in this auction"}
                            </p>
                        </div>
                    ) : (
                        filteredProducts.map((item) => (
                            <ProductItem
                                key={item.id}
                                item={item}
                            />
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}