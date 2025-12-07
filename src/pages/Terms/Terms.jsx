
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCachedTerms } from '../../api';
import Loader from '../../components/Ui/Loader/Loader';

const TermsPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
    const [content, setContent] = useState({ content_ar: '', content_en: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTerms();
    }, []);

    const fetchTerms = async () => {
        try {
            setLoading(true);
            const { data, fromCache } = await getCachedTerms();
            console.log(fromCache ? '📦 Terms من الكاش' : '🌐 Terms من API');
            
            setContent(data.data);
        } catch (err) {
            console.error('Error fetching terms:', err);
            setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchTerms}
                        className="bg-main hover:bg-green-800 text-white px-6 py-2 rounded-lg transition text-sm cursor-pointer"
                    >
                        {isRTL ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    const displayContent = isRTL ? content.content_ar : content.content_en;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-32 right-10 w-80 h-80 bg-main/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-60 left-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute bottom-32 right-1/4 w-72 h-72 bg-main/10 rounded-full blur-2xl animate-pulse-slow"></div>
                
                <div className="absolute top-20 left-20 w-16 h-16 border border-main/10 animate-spin-very-slow"></div>
                <div className="absolute bottom-40 right-32 w-12 h-12 border border-green-300/20 rotate-45 animate-spin-reverse"></div>
                
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-main/40 rounded-full animate-bounce-slow"></div>
                <div className="absolute top-2/3 left-1/3 w-4 h-4 bg-green-400/30 rounded-full animate-ping-slow"></div>
                <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-main/50 rounded-full animate-float"></div>
                
                <div className="absolute top-1/4 right-1/3 w-24 h-0.5 bg-gradient-to-r from-transparent via-main/20 to-transparent rotate-45 animate-pulse-slow"></div>
                <div className="absolute bottom-1/3 left-1/4 w-32 h-0.5 bg-gradient-to-r from-transparent via-green-300/30 to-transparent -rotate-45 animate-pulse-slow"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 relative z-10">
                <div className="text-center mb-8 sm:mb-10">
                    <h1 className="text-2xl sm:text-3xl font-bold text-main mb-2 relative">
                        {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-main to-transparent"></div>
                    </h1>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-main/5 to-transparent rounded-full -translate-y-16 -translate-x-16"></div>
                    <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tl from-green-100/50 to-transparent rounded-full translate-y-14 translate-x-14"></div>
                    
                    <div className="absolute top-6 right-6 w-2 h-2 border-t border-r border-main/30"></div>
                    <div className="absolute bottom-6 left-6 w-2 h-2 border-b border-l border-main/30"></div>
                    
                    <div 
                        className="relative z-10 text-gray-700 leading-relaxed text-sm sm:text-base"
                        style={{ 
                            direction: isRTL ? 'rtl' : 'ltr',
                            fontFamily: isRTL ? 'Cairo, sans-serif' : 'inherit'
                        }}
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                    />
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-30px) translateX(-15px); }
                }
                
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-30px); }
                }
                
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes spin-very-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes spin-reverse {
                    from { transform: rotate(45deg); }
                    to { transform: rotate(-315deg); }
                }
                
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
                .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin-very-slow { animation: spin-very-slow 20s linear infinite; }
                .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
            `}</style>
        </div>
    );
};

export default TermsPage;