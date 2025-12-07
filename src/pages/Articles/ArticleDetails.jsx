import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getCachedArticleDetails } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";

const ArticleDetailsPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    const { articleId } = useParams();

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (articleId) {
            fetchArticleDetails();
        }
    }, [articleId]);

    const fetchArticleDetails = async () => {
        try {
            setLoading(true);
            const { data, fromCache } = await getCachedArticleDetails(articleId);
            console.log(fromCache ? '📦 Article Details من الكاش' : '🌐 Article Details من API');
            setArticle(data);
        } catch (error) {
            console.error("Error fetching article details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-gray-500">{isRTL ? "المقال غير موجود" : "Article not found"}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
            {/* Animated Background Shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-main/5 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-40 right-20 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-main/10 rounded-full blur-2xl animate-pulse-slow"></div>

                <div className="absolute top-1/2 left-10 w-8 h-8 border-2 border-main/20 rotate-45 animate-spin-very-slow"></div>
                <div className="absolute bottom-1/4 right-16 w-6 h-6 border-2 border-green-400/30 rotate-12 animate-spin-reverse"></div>
            </div>

            {/* Article Content */}
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 ">
                <article className="overflow-hidden bg-white shadow-md rounded-lg">
                    {/* Article Image */}
                    {article.image_url && (
                        <div className="w-full h-48">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Header */}
                    <div className="p-4 md:p-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {article.title}
                        </h1>

                        <div className="w-12 h-1 bg-main mb-6"></div>

                        {/* Article Body */}
                        <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    </div>
                </article>
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

export default ArticleDetailsPage;