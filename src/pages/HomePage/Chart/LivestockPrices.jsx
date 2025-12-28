import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Calendar, MapPin, Package, Check } from "lucide-react";
import { getCachedGovernorates, getCachedLivestockPrices } from "../../../api";
import CustomSelect from "../../../components/Ui/CustomSelect/CustomSelect";

const SkeletonLoader = () => (
    <div className="w-full h-64 md:h-96 bg-gray-100 rounded-lg animate-pulse"></div>
);

const LivestockPrices = () => {
    const isRTL = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';

    const [selectedProduct, setSelectedProduct] = useState("cow");
    const [selectedGovernorate, setSelectedGovernorate] = useState(null);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [pricesData, setPricesData] = useState([]);
    const [governorates, setGovernorates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    const [activeFilters, setActiveFilters] = useState({
        net: true,
        standing: true,
    });

    const productTypes = [
        { value: "cow", label_ar: "بقر", label_en: "Cow" },
        { value: "sheep", label_ar: "غنم", label_en: "Sheep" },
        { value: "camel", label_ar: "إبل", label_en: "Camel" },
    ];

    const monthsArabic = {
        1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
        5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
        9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
    };

    const monthsEnglish = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
        5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
        9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
    };

    const monthOptions = [
        { value: null, label_ar: "كل الشهور", label_en: "All Months" },
        { value: 1, label_ar: "يناير", label_en: "January" },
        { value: 2, label_ar: "فبراير", label_en: "February" },
        { value: 3, label_ar: "مارس", label_en: "March" },
        { value: 4, label_ar: "أبريل", label_en: "April" },
        { value: 5, label_ar: "مايو", label_en: "May" },
        { value: 6, label_ar: "يونيو", label_en: "June" },
        { value: 7, label_ar: "يوليو", label_en: "July" },
        { value: 8, label_ar: "أغسطس", label_en: "August" },
        { value: 9, label_ar: "سبتمبر", label_en: "September" },
        { value: 10, label_ar: "أكتوبر", label_en: "October" },
        { value: 11, label_ar: "نوفمبر", label_en: "November" },
        { value: 12, label_ar: "ديسمبر", label_en: "December" },
    ];

    const yearOptions = [
        { value: 2025, label: "2025" },
        { value: 2024, label: "2024" },
        { value: 2023, label: "2023" },
    ];

    useEffect(() => {
        fetchGovernorates();
    }, []);

    useEffect(() => {
        if (selectedGovernorate) {
            fetchPrices();
        }
    }, [selectedProduct, selectedGovernorate, selectedYear, selectedMonth, isRTL]);

    const fetchGovernorates = async () => {
        try {
            const { data } = await getCachedGovernorates();
            setGovernorates(data);
            if (data.length > 0) {
                setSelectedGovernorate(data[0].id);
            }
        } catch (err) {
            console.error("Error fetching governorates:", err);
        }
    };

    const fetchPrices = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                product_type: selectedProduct,
                governorate_id: selectedGovernorate,
                year: selectedYear,
            };

            if (selectedMonth !== null && selectedMonth !== "") {
                params.month = selectedMonth;
            }

            const { data: apiResponse } = await getCachedLivestockPrices(params);

            if (apiResponse && apiResponse.success && apiResponse.data && apiResponse.data.data) {
                const dataArray = apiResponse.data.data;

                if (!Array.isArray(dataArray) || dataArray.length === 0) {
                    setPricesData([]);
                    setMeta(null);
                    return;
                }

                const formattedData = dataArray
                    .map((item) => {
                        const netPrice = item.average_net_price
                            ? parseFloat(item.average_net_price)
                            : null;
                        const standingPrice = item.average_standing_price
                            ? parseFloat(item.average_standing_price)
                            : null;

                        let displayLabel;
                        if (item.week) {
                            displayLabel = isRTL
                                ? `الأسبوع ${item.week}`
                                : `Week ${item.week}`;
                        } else {
                            displayLabel = isRTL
                                ? monthsArabic[item.month] || item.month_name
                                : monthsEnglish[item.month] || item.month_name;
                        }

                        return {
                            month: displayLabel,
                            monthNumber: item.month,
                            week: item.week || null,
                            net: netPrice,
                            standing: standingPrice,
                            entries_count: item.entries_count,
                        };
                    })
                    .sort((a, b) => {
                        if (a.week && b.week) {
                            return a.week - b.week;
                        }
                        return a.monthNumber - b.monthNumber;
                    });

                setPricesData(formattedData);
                setMeta(apiResponse.data.meta);
            } else {
                setPricesData([]);
                setMeta(null);
            }
        } catch (err) {
            setError(isRTL ? "حدث خطأ أثناء تحميل البيانات" : "Error loading data");
            console.error("Error fetching prices:", err);
            setPricesData([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleFilter = (filterName) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterName]: !prev[filterName],
        }));
    };

    const FilterButton = ({ name, label_ar, label_en, activeColor }) => (
        <button
            onClick={() => toggleFilter(name)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg cursor-pointer text-white font-semibold text-xs md:text-sm transition-all duration-300 shadow-md hover:shadow-lg md:transform md:hover:scale-102 ${activeFilters[name] ? `${activeColor}` : "bg-gray-400 opacity-60"
                }`}
        >
            {activeFilters[name] ? "✓" : "○"} {isRTL ? label_ar : label_en}
        </button>
    );

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 md:p-3 rounded-lg shadow-xl border-2 border-gray-200">
                    <p className="font-bold text-gray-800 mb-1 text-xs md:text-sm">
                        {payload[0].payload.month}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                        {isRTL ? "عدد الإدخالات" : "Entries"}:{" "}
                        {payload[0].payload.entries_count}
                    </p>
                    {payload.map(
                        (entry, index) =>
                            entry.value !== null && (
                                <p
                                    key={index}
                                    className="text-xs md:text-sm font-semibold"
                                    style={{ color: entry.color }}
                                >
                                    <span>{entry.name}:</span> {entry.value.toFixed(2)}{" "}
                                    {isRTL ? "ج.م/كجم" : "EGP/kg"}
                                </p>
                            )
                    )}
                </div>
            );
        }
        return null;
    };

    const calculateStats = () => {
        if (pricesData.length === 0) return null;
        
        const standingPrices = pricesData.filter(d => d.standing !== null).map(d => d.standing);
        const netPrices = pricesData.filter(d => d.net !== null).map(d => d.net);
        
        const avgStanding = standingPrices.length > 0
            ? standingPrices.reduce((sum, price) => sum + price, 0) / standingPrices.length
            : null;
        
        const avgNet = netPrices.length > 0
            ? netPrices.reduce((sum, price) => sum + price, 0) / netPrices.length
            : null;
        
        return {
            avgStanding,
            avgNet,
        };
    };

    const stats = calculateStats();

    const getTimeLabel = () => {
        if (selectedMonth !== null) {
            const monthName = isRTL
                ? monthsArabic[selectedMonth]
                : monthOptions.find(m => m.value === selectedMonth)?.[isRTL ? "label_ar" : "label_en"];
            return `${monthName} ${selectedYear}`;
        }
        return selectedYear.toString();
    };

    const productSelectOptions = productTypes.map(p => ({
        value: p.value,
        label: isRTL ? p.label_ar : p.label_en
    }));

    const governorateSelectOptions = governorates.map(g => ({
        value: g.id,
        label: isRTL ? g.name_ar : g.name_en
    }));

    const monthSelectOptions = monthOptions.map(m => ({
        value: m.value === null ? "" : m.value,
        label: isRTL ? m.label_ar : m.label_en
    }));

    const yearSelectOptions = yearOptions.map(y => ({
        value: y.value,
        label: y.label
    }));

    if (loading && !pricesData.length) {
        return (
            <div className="mx-auto p-3 md:p-2" dir={isRTL ? "rtl" : "ltr"}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-3 md:mb-2">
                        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 md:mb-4 md:gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100">
                                <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-8 w-full bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
                        <SkeletonLoader />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto p-3 md:p-2" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-7xl mx-auto">
                <div className="mb-3 md:mb-2">
                    <h1 className="text-xl md:text-2xl font-bold text-green-600">
                        {isRTL ? "الأسعار" : "Prices"}
                    </h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 md:mb-4 md:gap-4">
                    <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100 md:shadow-lg">
                        <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-3">
                            <Package className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700 leading-tight">
                                {isRTL ? "النوع" : "Type"}
                            </label>
                        </div>
                        <CustomSelect
                            options={productSelectOptions}
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            isRTL={isRTL}
                        />
                    </div>

                    <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100 md:shadow-lg">
                        <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-3">
                            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700 leading-tight">
                                {isRTL ? "المحافظة" : "Gov"}
                            </label>
                        </div>
                        <CustomSelect
                            options={governorateSelectOptions}
                            value={selectedGovernorate}
                            onChange={(val) => setSelectedGovernorate(Number(val))}
                            isRTL={isRTL}
                        />
                    </div>

                    <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100 md:shadow-lg col-span-2 md:col-span-1">
                        <div className="flex items-center gap-1 md:gap-2 mb-1.5 md:mb-3">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                            <label className="text-[10px] md:text-sm font-bold text-gray-700 leading-tight">
                                {isRTL ? "الفترة" : "Period"}
                            </label>
                        </div>
                        <div className="flex gap-1.5 md:gap-2">
                            <CustomSelect
                                options={monthSelectOptions}
                                value={selectedMonth === null ? "" : selectedMonth}
                                onChange={(val) => setSelectedMonth(val === "" ? null : Number(val))}
                                isRTL={isRTL}
                                className="flex-1"
                            />
                            <CustomSelect
                                options={yearSelectOptions}
                                value={selectedYear}
                                onChange={(val) => setSelectedYear(Number(val))}
                                isRTL={isRTL}
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>

                {stats && pricesData.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                        {stats.avgStanding && (
                            <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-4 text-white text-center transform transition-all hover:scale-102 hover:shadow-2xl">
                                <div className="text-[10px] md:text-xs font-bold mb-1 md:mb-2 opacity-90 uppercase tracking-wide">
                                    {isRTL ? "متوسط السعر القائم" : "Avg Standing"}
                                </div>
                                <div className="text-xl md:text-2xl font-black mb-0.5 md:mb-1">
                                    {stats.avgStanding.toFixed(2)}
                                </div>
                                <div className="text-[9px] md:text-xs font-semibold opacity-90">
                                    {isRTL ? "ج.م / كجم" : "EGP / kg"}
                                </div>
                            </div>
                        )}
                        {stats.avgNet && (
                            <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-3 md:p-4 text-white text-center transform transition-all hover:scale-102 hover:shadow-2xl">
                                <div className="text-[10px] md:text-xs font-bold mb-1 md:mb-2 opacity-90 uppercase tracking-wide">
                                    {isRTL ? "متوسط السعر الصافي" : "Avg Net"}
                                </div>
                                <div className="text-xl md:text-2xl font-black mb-0.5 md:mb-1">
                                    {stats.avgNet.toFixed(2)}
                                </div>
                                <div className="text-[9px] md:text-xs font-semibold opacity-90">
                                    {isRTL ? "ج.م / كجم" : "EGP / kg"}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-2 md:mb-4">
                    <h2 className="text-base md:text-xl font-bold text-gray-800 mb-0.5 md:mb-1 text-center">
                        {isRTL ? "أسعار" : "Prices of"}{" "}
                        {productTypes.find((p) => p.value === selectedProduct)?.[isRTL ? "label_ar" : "label_en"]}
                        {" - "}
                        {getTimeLabel()}
                    </h2>
                    <div className="text-center text-[10px] md:text-xs text-gray-500 font-semibold">
                        {isRTL ? "ج.م / كجم" : "EGP / kg"}
                    </div>
                </div>

                <div className="bg-white rounded-lg md:rounded-xl shadow-lg py-2.5 md:p-4 border border-gray-100">
                    <div className="flex gap-2 justify-center mb-3 md:mb-4 px-4 md:px-0">
                        <FilterButton
                            name="standing"
                            label_ar="القائم"
                            label_en="Standing"
                            activeColor="bg-gradient-to-r from-red-500 to-red-600"
                        />
                        <FilterButton
                            name="net"
                            label_ar="الصافي"
                            label_en="Net"
                            activeColor="bg-gradient-to-r from-green-500 to-green-600"
                        />
                    </div>

                    {loading ? (
                        <SkeletonLoader />
                    ) : error ? (
                        <div className="text-center py-8 md:py-12 px-4">
                            <div className="text-red-500 text-sm md:text-lg font-semibold mb-2">
                                {error}
                            </div>
                            <button
                                onClick={fetchPrices}
                                className="mt-2 md:mt-3 px-4 md:px-5 py-1.5 md:py-2 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs md:text-sm font-semibold"
                            >
                                {isRTL ? "إعادة المحاولة" : "Retry"}
                            </button>
                        </div>
                    ) : pricesData.length === 0 ? (
                        <div className="text-center py-10 md:py-16 px-4">
                            <div className="inline-block p-6 md:p-8 bg-gray-50 rounded-2xl md:rounded-3xl mb-4 md:mb-6">
                                <svg className="w-20 md:w-24 h-20 md:h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-base md:text-xl font-bold text-gray-700 mb-2 md:mb-3">
                                {isRTL ? "لا توجد بيانات متاحة" : "No data available"}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 max-w-sm md:max-w-md mx-auto">
                                {isRTL
                                    ? "لم يتم تسجيل أي أسعار في هذه الفترة. جرب اختيار فترة زمنية أخرى أو محافظة مختلفة."
                                    : "No prices were recorded for this period. Try selecting a different time period or governorate."}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center px-0 md:px-0 h-70 md:h-100">
                            <ResponsiveContainer width="100%">
                                <LineChart
                                    data={pricesData}
                                    margin={{ top: 20, right: 30, left: -30, bottom: -10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 9, fontWeight: 600, fill: "#6b7280" }}
                                        stroke="#9ca3af"
                                        angle={pricesData.length > 4 ? -45 : 0}
                                        textAnchor={pricesData.length > 4 ? "end" : "middle"}
                                        height={pricesData.length > 4 ? 60 : 40}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 9, fontWeight: 600, fill: "#6b7280" }}
                                        stroke="#9ca3af"
                                    />
                                    <Tooltip content={<CustomTooltip />} />

                                    {activeFilters.standing && (
                                        <Line
                                            type="linear"
                                            dataKey="standing"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            name={isRTL ? "القائم" : "Standing"}
                                            dot={{
                                                fill: "#ef4444",
                                                r: 5,
                                                strokeWidth: 3,
                                                stroke: "#fff",
                                            }}
                                            activeDot={{ r: 7 }}
                                            connectNulls
                                            isAnimationActive={true}
                                        />
                                    )}
                                    {activeFilters.net && (
                                        <Line
                                            type="linear"
                                            dataKey="net"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            name={isRTL ? "الصافي" : "Net"}
                                            dot={{
                                                fill: "#22c55e",
                                                r: 5,
                                                strokeWidth: 3,
                                                stroke: "#fff",
                                            }}
                                            activeDot={{ r: 7 }}
                                            connectNulls
                                            isAnimationAsync={true}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LivestockPrices;