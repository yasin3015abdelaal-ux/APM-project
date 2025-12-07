import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getCachedArticles } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ArticlesPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const { data, fromCache } = await getCachedArticles();
            console.log(fromCache ? '📦 Articles من الكاش' : '🌐 Articles من API');
            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleArticleClick = (articleId) => {
        navigate(`/articles/${articleId}`);
    };

    const getPlainTextPreview = (html, maxLength = 120) => {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-main/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-40 right-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-main/10 rounded-full blur-2xl animate-pulse-slow"></div>
                
                <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-main/30 rounded-full animate-bounce-slow"></div>
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-green-400/40 rounded-full animate-ping-slow"></div>
                <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-main/20 rounded-full animate-float"></div>
                
                <div className="absolute top-1/2 left-10 w-8 h-8 border-2 border-main/20 rotate-45 animate-spin-very-slow"></div>
                <div className="absolute bottom-1/4 right-16 w-6 h-6 border-2 border-green-400/30 rotate-12 animate-spin-reverse"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 relative z-10">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-main mb-2 relative inline-block">
                        {isRTL ? "المقالات" : "Articles"}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-main to-transparent"></div>
                    </h1>
                </div>

                {/* Articles Grid */}
                {articles.length === 0 ? (
                    <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                        <p className="text-gray-600 text-lg">
                            {isRTL ? "لا توجد مقالات متاحة حالياً" : "No articles available"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <div
                                key={article.id}
                                onClick={() => handleArticleClick(article.id)}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative group"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-main/5 to-transparent rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500"></div>
                                
                                {/* Image */}
                                <div className="h-48 overflow-hidden relative border-b-2 border-gray-200">
                                    {article.image_url ? (
                                        <img
                                            src={article.image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-main/20 to-green-200/30 flex items-center justify-center">
                                            <svg
                                                className="w-16 h-16 text-main/40"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 relative">
                                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100/30 to-transparent rounded-full translate-y-10 -translate-x-10"></div>
                                    
                                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 relative z-10 group-hover:text-main transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 relative z-10">
                                        {getPlainTextPreview(article.content)}
                                    </p>
                                    <span className="text-main font-semibold text-sm hover:underline inline-flex items-center gap-1 relative z-10 group-hover:gap-2 transition-all">
                                        {isRTL ? "اقرأ المزيد" : "Read more"}
                                        <svg 
                                            className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

export default ArticlesPage;