import { useTranslation } from "react-i18next";

const Loader = () =>{
        const { t } = useTranslation();
    
            return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
                    <div className="text-xl text-gray-600">{t('common.loading')}</div>
                </div>
            </div>
        );
}
export default Loader;