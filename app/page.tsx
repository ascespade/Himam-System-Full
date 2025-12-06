import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import { ArrowRight, Star, Shield, Activity, Users, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] overflow-x-hidden selection:bg-orange-100">
      <Header />
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             {/* Text Content */}
             <div className="flex-1 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-100 px-4 py-2 rounded-full mb-8 shadow-sm animate-fade-in-up">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   <span className="text-sm font-bold text-gray-600">نستقبل الحالات الآن</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.15] mb-6 tracking-tight font-arabic">
                   نصنع <span className="text-primary italic relative">
                      الهمم
                      <svg className="absolute w-full h-3 -bottom-1 right-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
                   </span><br />
                   ونبني المستقبل
                </h1>
                
                <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
                   نقدم رعاية طبية وتأهيلية متكاملة بأحدث المعايير العالمية. في مركز الهمم، نؤمن بأن كل فرد يمتلك قدرات استثنائية تحتاج فقط إلى الدعم المناسب لتزهر.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                   <Link href="#appointment" className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all hover:scale-105 shadow-xl shadow-gray-900/20 flex items-center justify-center gap-3">
                      احجز موعدك الآن
                      <ArrowRight size={20} className="rtl:rotate-180" />
                   </Link>
                   <Link href="#services" className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center">
                      استكشف خدماتنا
                   </Link>
                </div>

                <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                   {/* Trusted Logos Placeholder */}
                   <span className="font-bold text-xl text-gray-300">وزارة الصحة</span>
                   <span className="font-bold text-xl text-gray-300">الهيئة السعودية</span>
                </div>
             </div>

             {/* Hero Visual */}
             <div className="flex-1 relative w-full max-w-lg lg:max-w-xl">
                <div className="relative aspect-square">
                   <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-blue-50 rounded-[3rem] rotate-3 transform transition-transform duration-1000 animate-float"></div>
                   <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                      {/* Abstract Medical Graphic */}
                      <div className="text-center p-12">
                         <div className="w-24 h-24 bg-primary/10 rounded-3xl mx-auto mb-6 flex items-center justify-center text-primary">
                            <Activity size={48} />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">رعاية متقدمة</h3>
                         <p className="text-gray-400">تجهيزات حديثة وفريق متميز</p>
                         
                         {/* Stats Badge */}
                         <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                               <div className="text-2xl font-bold text-gray-900">+500</div>
                               <div className="text-xs text-gray-500">حالة ناجحة</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl">
                               <div className="text-2xl font-bold text-gray-900">100%</div>
                               <div className="text-xs text-gray-500">رضا العملاء</div>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   {/* Floating Elements */}
                   <div className="absolute -right-8 top-1/4 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float-delayed">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                         <Shield size={20} />
                      </div>
                      <div>
                         <p className="text-xs text-gray-400 font-bold">معتمد من</p>
                         <p className="font-bold text-sm">وزارة الصحة</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- SERVICES (BENTO GRID) --- */}
      <section id="services" className="py-24 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <span className="text-primary font-bold tracking-wider text-sm uppercase mb-2 block">خدماتنا</span>
               <h2 className="text-4xl font-extrabold text-gray-900">حلول علاجية متكاملة</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Large Item */}
               <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-100 transition-colors"></div>
                  <div className="relative z-10">
                     <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-6 text-primary">
                        <Users size={28} />
                     </div>
                     <h3 className="text-2xl font-bold mb-3">علاج النطق والتخاطب</h3>
                     <p className="text-gray-500 leading-relaxed max-w-md">نستخدم أحدث التقنيات لمساعدة الأطفال والبالغين على تجاوز صعوبات الكلام والتواصل بثقة.</p>
                     
                     <Link href="#" className="inline-flex items-center gap-2 text-primary font-bold mt-8 group-hover:gap-4 transition-all">
                        اقرأ المزيد <ArrowRight size={18} className="rtl:rotate-180" />
                     </Link>
                  </div>
               </div>

               {/* Tall Item */}
               <div className="bg-primary text-white rounded-[2.5rem] p-10 shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                  <Users size={32} className="mb-6 opacity-90" />
                  <h3 className="text-2xl font-bold mb-3">تعديل السلوك</h3>
                  <p className="text-white/80 leading-relaxed text-sm">برامج مخصصة لتحسين السلوكيات الاجتماعية وتعزيز الاستقلالية لدى الأطفال.</p>
               </div>
               
               {/* Regular Items */}
               <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-primary/30 transition-colors">
                  <h3 className="text-xl font-bold mb-2">العلاج الوظيفي</h3>
                  <p className="text-gray-500 text-sm">تنمية المهارات الحركية الدقيقة.</p>
               </div>
               
               <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-primary/30 transition-colors">
                   <h3 className="text-xl font-bold mb-2">التدخل المبكر</h3>
                   <p className="text-gray-500 text-sm">برامج للأطفال دون 3 سنوات.</p>
               </div>
               
               <div className="bg-teal-50 rounded-[2.5rem] p-8 border border-teal-100 flex items-center justify-center text-center">
                   <div>
                      <div className="font-bold text-teal-800 text-3xl mb-1">+15</div>
                      <div className="text-teal-600 text-sm font-bold">خدمة متخصصة</div>
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- INFO / CONTACT --- */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden relative">
         <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12">
               <div>
                  <h2 className="text-3xl font-bold mb-4">جاهز للبدء في رحلة التحسن؟</h2>
                  <p className="text-gray-400 max-w-xl">فريقنا جاهز للإجابة على جميع استفساراتك وتقديم الاستشارة المناسبة لحالتك.</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-6 py-4 rounded-2xl">
                     <Clock className="text-primary" />
                     <div>
                        <div className="text-xs text-gray-400">ساعات العمل</div>
                        <div className="font-bold">9:00 ص - 5:00 م</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-6 py-4 rounded-2xl">
                     <MapPin className="text-primary" />
                     <div>
                        <div className="text-xs text-gray-400">موقعنا</div>
                        <div className="font-bold">جدة، شارع الأمير سلطان</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  )
}
