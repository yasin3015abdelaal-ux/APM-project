import React, { useState } from 'react'
import flag from '../assets/egypt flag.png'
import accPhoto from '../assets/WhatsApp Image 2025-07-23 at 18.03.38_cd179190.jpg'
import { useTranslation } from 'react-i18next'
import { dir } from 'i18next'



const ProfileHover = () => {
  const [signedUp , setsignedUp] = useState(true)
  const [promoted , setpromoted] = useState(true)
  const [langdropdown,setlangdropdown] = useState(false)
  const {t,i18n} = useTranslation();
  return (
    <div className=' h-[450px] w-[345px] max-[450px]:w-[200px] flex flex-col overflow-auto justify-top  border-2 rounded-lg px-2 pt-5 pb-1 bg-white z-10 border-main absolute top-[110%]'>
      {/* accont photo or make acc button */}
      {signedUp?  <div className='flex flex-col justify-center items-center'>
        <div className={`w-26 h-26 max-[450px]:w-18 max-[450px]:h-18 bg-gray-300 border-2 ${promoted?'border-main':'border-[#BF9300] border-r-transparent'}  rounded-full relative`} >
          <img src={accPhoto} className='w-full h-full object-cover rounded-full'/>
          <img src={flag} className='absolute w-8 max-[450px]:w-6 border rounded-full h-8 max-[450px]:h-6 top-[70%] left-[70%]'/>
        </div>  
        <div className='text-xl font-semibold'>75%</div>
        <div className='text-2xl font-semibold max-[450px]:text-[18px]'>محمد أشرف</div>
        <button className='border rounded-lg text-xl max-[450px]:text-[18px] text-white bg-main px-7 max-[450px]:px-2 py-2 mt-5'>{t('viewProfile')}</button>
      </div>:
      <div className='flex flex-col justify-center items-center mt-3'>
        <button className='w-40 max-[450px]:w-25 border rounded-4xl max-[450px]:rounded-lg text-[18px] text-white bg-main px-7 max-[450px]:p-1 py-2 mb-2 whitespace-nowrap'>{t("create account")}</button>
        <button className='w-40 max-[450px]:w-15 border rounded-4xl max-[450px]:rounded-lg text-[18px] text-main bg-white px-7 max-[450px]:p-1 py-2 whitespace-nowrap'>{t("log in")}</button>
      </div>}
      <div dir={i18n.language === "en" ? "ltr" : "rtl"} className={` w-full text-xl max-[450px]:text-[18px] border border-main rounded-lg flex justify-between items-center p-0.5 mt-4`}>
        {t("country")}
        <div className=' bg-main text-white border rounded-lg pr-2'>
          <span class="material-symbols-outlined text-[40px]! max-[450px]:text-[20px]! p-0! m-0!">
            arrow_drop_down
          </span>
          <select className='cursor-pointer bg-main px-1 text-white appearance-none outline-none focus:outline-none' name="selectedOption">
            <option value="en" >egypt</option>
            <option value="ar" >sudan</option>
          </select>
        </div>
      </div>
      <div dir={i18n.language === "en" ? "ltr" : "rtl"} className='w-full text-xl max-[450px]:text-[18px] border border-main rounded-lg flex justify-between items-center p-0.5 mt-1'>
        {t("language")}
        <div className={`${''} bg-main text-white border rounded-lg pr-2`}>
          <span class="material-symbols-outlined text-[40px]! max-[450px]:text-[20px]! p-0! m-0!">
            arrow_drop_down
          </span>
          <select className= 'cursor-pointer bg-main px-1 text-white appearance-none outline-none focus:outline-none' name="selectedOption">
            <option value="en" >English</option>
            <option value="ar" >عربي</option>
          </select>
        </div>
      </div>
      <div className='flex flex-col'>
        <div className='flex justify-between my-2 text-main'>
        <span class="material-symbols-outlined ">
          keyboard_arrow_left
        </span>
        <div className='flex gap-2 text-[20px]'>  
          {t("favorite ads")}
          <span class="material-symbols-outlined">
            favorite
          </span>
        </div>
      </div>
      <div className='flex justify-between my-2 text-main'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
        <div className='flex gap-2 text-[20px]'>  
          {t("subscriptions")}
          <span class="material-symbols-outlined">
            article
          </span>
        </div>
      </div>
      <div className='flex justify-between my-2 text-main'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
        <div className='flex gap-2 text-[20px]'>  
          {t("contact us")}
          <span class="material-symbols-outlined">
            call
          </span>
        </div>
      </div>
      <div className='flex justify-between my-2 text-main'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
        <div className='flex gap-2 text-[20px]'>  
          {t("share the app")}
          <span class="material-symbols-outlined">
            share
          </span>
        </div>
      </div>
      <div className='flex justify-between my-2 text-main'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
        <div className='flex gap-2 text-[20px]'>  
          {t("my ads")}
          <span class="material-symbols-outlined">
            add_ad
          </span>
        </div>
      </div>
      <div className='flex justify-between my-2 text-main text-[20px]'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
          {t("notifications")}
      </div>
      <div className='flex justify-between my-2 text-main text-[20px]'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
          {t("subscriptions and invoices")}
      </div>
      <div className='flex justify-between my-2 text-main text-[20px]'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
          {t("today's meat price")}
      </div>
      <div className='flex justify-between my-2 text-main text-[20px]'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
          {t("about us")}
      </div>
      <div className='flex justify-between my-2 text-main text-[20px]'>
        <span class="material-symbols-outlined">
          keyboard_arrow_left
        </span>
          {t("privacy, terms, and conditions")}
      </div>
      {signedUp?
        <button className='self-center w-40 max-[450px]:w-20 border rounded-lg text-[18px] text-main bg-white px-7 max-[450px]:p-1 py-2 cursor-pointer'>{t("log out")}</button>
        :''}
      </div>
    </div>
  )
}

export default ProfileHover
