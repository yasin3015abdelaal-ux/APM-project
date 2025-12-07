import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { useCart } from "../../contexts/CartContext";

const Cart = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const { cartItems, total, loading, removeItem } = useCart();
    
    const [wantInvoice, setWantInvoice] = useState(false);
    const [email, setEmail] = useState("");
    const [toast, setToast] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [removingItem, setRemovingItem] = useState(null);
    
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleRemoveItem = async (itemId) => {
        setRemovingItem(itemId);
        const result = await removeItem(itemId);
        
        if (result.success) {
            showToast(
                isRTL ? "تم حذف المنتج من السلة" : "Item removed from cart",
                "success"
            );
        } else {
            showToast(
                isRTL ? "فشل في حذف المنتج" : "Failed to remove item",
                "error"
            );
        }
        setRemovingItem(null);
    };

    const handleCheckout = async () => {
        if (wantInvoice && !email) {
            showToast(
                isRTL ? "يرجى إدخال البريد الإلكتروني" : "Please enter email address",
                "error"
            );
            return;
        }

        setCheckoutLoading(true);
        try {
            if (wantInvoice && email) {
                await userAPI.post("/invoice-requests", { email });
            }
            window.location.href = "/invoices";
        } catch (err) {
            console.log(err);
            showToast(
                isRTL ? "فشل في إتمام الطلب" : "Failed to complete order",
                "error"
            );
        }
        setCheckoutLoading(false);
    };

    if (loading && cartItems.length === 0) {
        return <Loader />;
    }

    return (
        <div 
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full max-w-3xl mx-auto p-4 sm:p-6"
        >
            {toast && (
                <div className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 animate-slide-in max-w-[90%] sm:max-w-md`}>
                    <div className={`px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === "success" ? "bg-main text-white" : "bg-red-500 text-white"}`}>
                        {toast.type === "success" ? (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium text-sm">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md border border-gray-200">
                {/* Header */}
                <div className="text-main text-center py-3 border-b border-gray-200">
                    <h1 className="text-2xl font-bold">
                        {isRTL ? "عربة التسوق" : "Shopping Cart"}
                    </h1>
                </div>

                <div className="p-4 sm:p-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-base font-semibold mb-1">
                                {isRTL ? "السلة فارغة" : "Cart is Empty"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {isRTL ? "لم تقم بإضافة أي منتجات بعد" : "You haven't added any items yet"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="space-y-3 mb-5">
                                {cartItems.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-base text-gray-800 mb-0.5">
                                                    {item.package.name}
                                                </h3>
                                                <p className="text-gray-600 text-xs">
                                                    {item.package.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={removingItem === item.id}
                                                className="text-red-500 cursor-pointer hover:text-red-700 p-1.5 disabled:opacity-50 ml-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex justify-end items-center">
                                            <div className={`${isRTL ? "text-right" : "text-left"}`}>
                                                <div className="text-main font-bold text-base">
                                                    {item.subtotal} {isRTL ? "ج.م" : "EGP"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="border-t-2 border-gray-300 pt-3 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 font-bold text-lg">
                                        {isRTL ? "الإجمالي" : "Total"}
                                    </span>
                                    <span className="text-main font-black text-xl">
                                        {total} {isRTL ? "ج.م" : "EGP"}
                                    </span>
                                </div>
                            </div>

                            {/* Invoice Option */}
                            <div className="mb-5">
                                <label className="flex items-start gap-2.5 cursor-pointer mb-2.5">
                                    <input
                                        type="checkbox"
                                        checked={wantInvoice}
                                        onChange={(e) => setWantInvoice(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-main border-gray-300 rounded focus:ring-main cursor-pointer"
                                    />
                                    <span className="text-gray-700 font-medium text-xs">
                                        {isRTL 
                                            ? "اذا كنت تريد الفاتورة برجاء ادخال البريد الالكتروني"
                                            : "If you want the invoice, please enter your email"}
                                    </span>
                                </label>

                                {wantInvoice && (
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={isRTL ? "البريد الإلكتروني" : "Email Address"}
                                        className={`w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-main transition ${
                                            isRTL ? "text-right" : "text-left"
                                        }`}
                                        required={wantInvoice}
                                    />
                                )}
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={checkoutLoading || (wantInvoice && !email)}
                                className="w-full bg-main cursor-pointer text-white font-bold text-base py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {checkoutLoading 
                                    ? (isRTL ? "جاري المعالجة..." : "Processing...")
                                    : (isRTL ? "استكمال الدفع" : "Complete Payment")
                                }
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cart;