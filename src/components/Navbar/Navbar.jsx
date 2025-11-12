import { useTranslation } from 'react-i18next'
import logo from '../../assets/images/logo.jpg'
import flag from '../../assets/images/flag.png'
import accPhoto from '../../assets/images/sadia-chicken.png'
import ProfileHover from './ProfileHover'
import { useEffect, useState } from 'react'

const Navbar = () => {
    const {t,i18n} = useTranslation();
    const [showProfileHover,setshowProfileHover] = useState(false);
    const [makeSearchChangePositin,setmakeSearchChangePositin] = useState(true);
    useEffect(() => {
    const onResize = () => setmakeSearchChangePositin(window.innerWidth >= 680);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
    }, []);
    return (
        <div className="w-full px-[90px] max-[1000px]:px-10 max-[680px]:px-4 flex flex-col gap-2 justify-center items-center py-5  border border-main rounded-md">
            <div className='flex items-center justify-center gap-3 w-full max-[680px]:justify-around max-[380px]:gap-1!'>
                <div className=" w-20  h-20 max-[450px]:w-15 max-[450px]:h-15  bg-gray-300 border-2 border-main rounded-full relative cursor-pointer" 
                    onMouseEnter={() => setshowProfileHover(true)}
                    onMouseLeave={() => setshowProfileHover(false)} 
                >
                    <img src={accPhoto} className='w-full h-full object-cover rounded-full'/>
                    <img src={flag} className='absolute w-8 max-[450px]:w-4 border rounded-full h-8 max-[450px]:h-4 top-[60%] left-[60%]'/>
                    <div className='h-7 w-[100px] bg-transparent'></div>
                    {showProfileHover?<ProfileHover/>:''}
                </div>
                <div className="text-main text-xl font-semibold max-[480px]:hidden!">Eg</div>
                <span className="material-symbols-outlined cursor-pointer text-main text-4xl! max-[1000px]:text-3xl! max-[450px]:text-xl! ">mark_unread_chat_alt</span>
                <span className=" material-symbols-outlined cursor-pointer text-main text-4xl! max-[1000px]:text-3xl! max-[450px]:text-xl! max-[480px]:hidden!">notifications_unread</span>
                <button 
                    className={`text-2xl max-[1200px]:text-[18px] max-[1100px]:text-[16px] border p-2 rounded-lg cursor-pointer text-main 
                                ${i18n.language === "ar" ?'':'text-[20px] max-[1200px]:text-[16px]! max-[1100px]:text-[12px]! max-[680px]:text-[18px]! max-[530px]:text-[12px]! '}`}
                    >{t('auction')}</button>
                <button
                    className={`text-2xl max-[1200px]:text-[18px] max-[1100px]:text-[16px] max-[1060px]:text-[12px] 
                                border p-2 rounded-lg cursor-pointer text-white bg-main 
                                whitespace-nowrap 
                                ${i18n.language === "ar" ? '' : 'text-[20px] max-[1400px]:text-[16px]! max-[1100px]:text-[12px]! max-[680px]:text-[18px]! max-[530px]:text-[12px]!'}
                    `}
                    >
                    {t('shareAdv')}
                </button>
                {makeSearchChangePositin && <div className='w-[612px] max-[1200px]:w-[400px] max-[780px]:w-[300px]  relative flex items-center'>
                    <i className={`fa-solid fa-magnifying-glass text-main text-3xl max-[780px]:text-2xl absolute left-1 ${
                            i18n.language === "ar" ? "" : "left-[92%]! max-[920px]:left-[88%]!"
                        }`} ></i>
                    <input      
                        type="text"
                        className={`h-[50px] w-full text-2xl  text-main border rounded-lg px-4 outline-none ${
                            i18n.language === "ar" ? "text-right shrink-0" : "text-left"
                        }`}
                        dir={i18n.language === "ar" ? "rtl" : "ltr"}
                        placeholder={t("search")}
                    />
                </div>}
                <div >
                    <img src={logo} alt='' className='w-20 h-full max-[450px]:w-15 '/>
                </div>
            </div>
            {makeSearchChangePositin?'':<div className='w-full   relative flex items-center'>
                    <i className={`fa-solid fa-magnifying-glass text-main text-3xl max-[780px]:text-2xl absolute left-1 
                        ${i18n.language === "ar" ? "" : "left-[93%] max-[430px]:left-[85%]!"}
                        `}></i>
                    <input
                        type="text"
                        className={`h-[50px] w-full text-2xl  text-main border rounded-lg px-4 outline-none ${
                            i18n.language === "ar" ? "text-right" : "text-left"
                        }`}
                        dir={i18n.language === "ar" ? "rtl" : "ltr"}
                        placeholder={t("search")}
                    />
                </div>}
        </div>
    )
}

export default Navbar


