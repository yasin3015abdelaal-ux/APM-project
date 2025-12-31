import { useState } from 'react';
import { Trash2, Mail } from 'lucide-react';

export default function AccountDeletion() {
    const [currentLang, setCurrentLang] = useState('ar');

    const translations = {
        ar: {
            mainTitle: 'حذف الحساب',
            step1Title: 'كيفية حذف الحساب',
            step1Content: 'يمكن للمستخدم حذف حسابه من داخل التطبيق عبر المسار التالي:',
            step2Title: 'مدة الحذف',
            step2Content: 'بعد طلب الحذف يتم حذف الحساب وجميع البيانات المرتبطة به ',
            step2Bold: 'فوراً ونهائياً',
            contactTitle: 'في حالة وجود أي استفسار',
            langButton: 'English'
        },
        en: {
            mainTitle: 'Delete Account',
            step1Title: 'How to Delete Your Account',
            step1Content: 'Users can delete their account from within the app via:',
            step2Title: 'Deletion Timeline',
            step2Content: 'After requesting deletion, the account and all associated data will be ',
            step2Bold: 'permanently deleted immediately',
            contactTitle: 'For any inquiries',
            langButton: 'العربية'
        }
    };

    const lang = translations[currentLang];
    const isRTL = currentLang === 'ar';

    const toggleLanguage = () => {
        setCurrentLang(currentLang === 'ar' ? 'en' : 'ar');
    };

    return (
        <div className={`min-h-screen bg-green-500 flex justify-center items-center p-2.5 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <button
                onClick={toggleLanguage}
                className="fixed top-5 left-5 bg-white border-none py-3 px-6 rounded-full cursor-pointer font-semibold text-green-800 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:bg-green-500 hover:text-white z-50"
            >
                {lang.langButton}
            </button>

            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full py-8 px-10">
                <h1 className="text-green-500 text-center mb-8 text-3xl font-bold flex items-center justify-center gap-3">
                    <Trash2 className="w-8 h-8" />
                    <span>{lang.mainTitle}</span>
                </h1>

                <div className={`bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6 ${isRTL ? 'border-r-4' : 'border-l-4'} border-green-500`}>
                    <div className="mb-5">
                        <div className="text-green-900 text-lg font-semibold mb-3 flex items-center gap-2.5">
                            <span className="bg-green-500 text-white min-w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                            <span>{lang.step1Title}</span>
                        </div>
                        <div className="text-gray-700 text-base leading-relaxed">
                            <span>{lang.step1Content}</span>
                            <div className="bg-white py-3 px-4 rounded-lg inline-block mt-2.5 font-mono text-green-900 font-semibold shadow-sm text-sm">
                                Account → Delete Account
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-green-900 text-lg font-semibold mb-3 flex items-center gap-2.5">
                            <span className="bg-green-500 text-white min-w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            <span>{lang.step2Title}</span>
                        </div>
                        <div className="text-gray-700 text-base leading-relaxed">
                            {lang.step2Content}
                            <strong>{lang.step2Bold}</strong>.
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-green-500 rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500"></div>
                    <h3 className="mb-4 text-lg font-semibold text-green-900">{lang.contactTitle}</h3>
                    <a
                        href="mailto:support@world-apm.com"
                        className="bg-gradient-to-br from-green-500 to-green-600 text-white no-underline py-3 px-8 rounded-xl inline-flex items-center gap-2 font-semibold text-base transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:from-green-600 hover:to-green-500"
                    >
                        <Mail className="w-5 h-5" />
                        support@world-apm.com
                    </a>
                </div>
            </div>
        </div>
    );
}