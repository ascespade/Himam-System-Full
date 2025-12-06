import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import { ArrowRight, Star, Shield, Activity, Users, Clock, MapPin, Heart, Brain, Ear, Baby, Stethoscope, Award, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] overflow-x-hidden selection:bg-orange-100 font-arabic" dir="rtl">
      <Header />
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/30 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
             {/* Text Content */}
             <div className="flex-1 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-full mb-8 shadow-sm animate-fade-in-up">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   <span className="text-sm font-bold text-gray-600">جدة - حي الصفا</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.2] mb-6 tracking-tight">
                   رعاية متخصصة <br/>
                   <span className="text-primary relative inline-block">
                      لذوي الهمم
                      <svg className="absolute w-full h-3 -bottom-2 left-0 text-orange-200" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg>
                   </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 font-medium">
                   المركز الأول من نوعه في جدة لتقديم خدمات التأهيل الشامل (تخاطب، سلوك، وظيفي) بأحدث البرامج العالمية تحت إشراف نخبة من الاستشاريين.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                   <Link href="#appointment" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                      احجز استشارة مجانية
                      <ArrowRight size={20} className="rtl:rotate-180" />
                   </Link>
                   <Link href="#services" className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center">
                      تعرف على خدماتنا
                   </Link>
                </div>
             </div>

             {/* Hero Visual - Using Logo as requested for missing images */}
             <div className="flex-1 relative w-full max-w-lg lg:max-w-xl animate-float">
                <div className="relative aspect-square bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-8 flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white/50 opacity-50"></div>
                    {/* Placeholder for Hero Image - Using Logo */}
                   <Image 
                      src="/logo.png" 
                      alt="Hemam Center Logo" 
                      width={300} 
                      height={300}
                      className="object-contain relative z-10 drop-shadow-xl"
                      priority
                   />
                   
                   {/* Floating Stats */}
                   <div className="absolute bottom-8 right-8 bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex items-center gap-3 animate-float-delayed">
                      <div className="bg-green-100 p-2 rounded-xl text-green-600">
                         <Users size={24} />
                      </div>
                      <div>
                         <div className="font-bold text-gray-900">+1000</div>
                         <div className="text-xs text-gray-500">حالة تم تأهيلها</div>
                      </div>
                   </div>
                   
                   <div className="absolute top-8 left-8 bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex items-center gap-3 animate-float">
                      <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                         <Star size={24} />
                      </div>
                      <div>
                         <div className="font-bold text-gray-900">4.9/5</div>
                         <div className="text-xs text-gray-500">تقييم العملاء</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden relative shadow-lg">
                      {/* Placeholder for About Image - Using Logo again as requested */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                         <Image src="/logo.png" alt="About Hemam" width={150} height={150} className="opacity-50 grayscale" />
                      </div>
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-primary text-white p-8 rounded-3xl shadow-xl hidden lg:block">
                     <p className="text-3xl font-bold mb-1">10+</p>
                     <p className="text-sm opacity-90">سنوات من الخبرة</p>
                  </div>
               </div>
               
               <div>
                  <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-2">من نحن</h2>
                  <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">نحن نؤمن بقدرات كل طفل</h3>
                  <p className="text-gray-600 leading-loose text-lg mb-6">
                     مركز الهمم بجدة هو صرح طبي تأهيلي متكامل، يقع في قلب حي الصفا بشارع التحلية. نحن متخصصون في تقديم أحدث البرامج العلاجية لذوي الاحتياجات الخاصة، بما يشمل التوحد، فرط الحركة، صعوبات التعلم، ومشاكل النطق.
                  </p>
                  <p className="text-gray-600 leading-loose text-lg mb-8">
                     رؤيتنا هي تمكين كل فرد من الوصول إلى أقصى إمكاناته من خلال خطط علاجية فردية مصممة بعناية فائقة.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6">
                     <div className="flex items-center gap-3">
                        <Award className="text-primary w-6 h-6" />
                        <span className="font-bold text-gray-800">مرخص من وزارة الصحة</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Users className="text-primary w-6 h-6" />
                        <span className="font-bold text-gray-800">طاقم استشاري متخصص</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Activity className="text-primary w-6 h-6" />
                        <span className="font-bold text-gray-800">أحدث الأجهزة التأهيلية</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Heart className="text-primary w-6 h-6" />
                        <span className="font-bold text-gray-800">رعاية أسرية شاملة</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- SERVICES GRID --- */}
      <section id="services" className="py-24 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-extrabold text-gray-900 mb-4">خدماتنا العلاجية</h2>
               <p className="text-gray-500 max-w-2xl mx-auto text-lg">برامجنا شاملة وتغطي كافة جوانب النمو والتطور</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                  { title: "علاج النطق والتخاطب", icon: <MessageCircle size={32} />, desc: "علاج التأتأة، تأخر الكلام، ومشاكل الصوت.", color: "bg-blue-50 text-blue-600" },
                  { title: "تعديل السلوك", icon: <Brain size={32} />, desc: "التعامل مع فرط الحركة، العناد، والسلوكيات النمطية.", color: "bg-orange-50 text-orange-600" },
                  { title: "العلاج الوظيفي", icon: <Activity size={32} />, desc: "تنمية المهارات الحركية الدقيقة والاعتماد على النفس.", color: "bg-green-50 text-green-600" },
                  { title: "التكامل الحسي", icon: <Ear size={32} />, desc: "معالجة الاضطرابات الحسية (اللمس، السمع، الحركة).", color: "bg-purple-50 text-purple-600" },
                  { title: "التدخل المبكر", icon: <Baby size={32} />, desc: "برامج مكثفة للأطفال من عمر الولادة وحتى 5 سنوات.", color: "bg-pink-50 text-pink-600" },
                  { title: "تنمية المهارات", icon: <Star size={32} />, desc: "برامج تعليمية وإدراكية لتجهيز الطفل للمدرسة.", color: "bg-yellow-50 text-yellow-600" },
               ].map((service, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1 hover:border-primary/20 group">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${service.color}`}>
                        {service.icon}
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{service.title}</h3>
                     <p className="text-gray-500 leading-relaxed mb-6">
                        {service.desc}
                     </p>
                     <Link href="#appointment" className="inline-flex items-center text-sm font-bold text-gray-900 hover:text-primary transition-colors">
                        احجز موعد
                        <ArrowRight size={16} className="mr-2 rtl:rotate-180" />
                     </Link>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- MEDICAL TEAM (Caroussel Placeholder) --- */}
      <section id="team" className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
               <div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-2">فريقنا الطبي</h2>
                  <p className="text-gray-500 text-lg">نخبة من الاستشاريين والأخصائيين المعتمدين</p>
               </div>
               <Link href="#appointment" className="text-primary font-bold hidden md:flex items-center gap-2 hover:gap-4 transition-all">
                  انضم لفريقنا <ArrowRight className="rtl:rotate-180" />
               </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-3xl overflow-hidden group">
                     <div className="aspect-[4/5] bg-gray-200 relative">
                        {/* Placeholder for Doctor Image */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                           <Stethoscope size={48} />
                        </div>
                     </div>
                     <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900">د. اسم الطبيب</h3>
                        <p className="text-primary text-sm mb-2">استشاري نطق وتخاطب</p>
                        <p className="text-xs text-gray-500">خبرة 15 سنة في تأهيل الأطفال</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- COMMUNITY & BLOG --- */}
      <section id="community" className="py-20 bg-gray-900 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 clip-diagonal"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-extrabold mb-4">مجتمع الهمم</h2>
               <p className="text-gray-400 max-w-2xl mx-auto">نشارككم المعرفة والنصائح الطبية لأسرة أكثر وعياً</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  "كيف تتعامل مع نوبات الغضب لدى طفل التوحد؟",
                  "علامات تأخر النطق المبكرة التي يجب الانتباه لها",
                  "أهمية التدخل المبكر: قصص نجاح حقيقية"
               ].map((title, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors cursor-pointer">
                     <div className="text-primary mb-4 text-sm font-bold">تثقيف صحي</div>
                     <h3 className="text-xl font-bold mb-4 leading-relaxed">{title}</h3>
                     <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>5 دقائق قراءة</span>
                        <span>•</span>
                        <span>د. سارة</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- ACCREDITATIONS --- */}
      <section id="accreditation" className="py-12 bg-white border-b border-gray-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400 font-bold mb-8 uppercase tracking-widest text-sm">اعتماداتنا وشركاؤنا</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Text Logos as placeholders */}
               <div className="text-xl font-extrabold text-gray-900">وزارة الصحة</div>
               <div className="text-xl font-extrabold text-gray-900">الهيئة السعودية للتخصصات الصحية</div>
               <div className="text-xl font-extrabold text-gray-900">المركز الوطني للتوحد</div>
               <div className="text-xl font-extrabold text-gray-900">جمعية الأطفال المعوقين</div>
            </div>
         </div>
      </section>

      {/* --- CONTACT & MAP --- */}
      <section id="contact" className="py-0 relative h-[500px] lg:h-[600px] flex items-center bg-gray-100">
         {/* Fake Map Background */}
         <div className="absolute inset-0 bg-gray-200">
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
               GOOGLE MAP (Jeddah, Tahlia St)
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pointer-events-none">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md mr-auto pointer-events-auto">
               <h3 className="text-2xl font-bold text-gray-900 mb-6">تفضل بزيارتنا</h3>
               
               <div className="space-y-6">
                  <div className="flex items-start gap-4">
                     <MapPin className="text-primary mt-1" />
                     <div>
                        <div className="font-bold text-gray-900">العنوان</div>
                        <p className="text-gray-500 text-sm">جدة، حي الصفا، شارع الأمير محمد بن عبدالعزيز (التحلية)، فندق وا (WA)، الدور الثامن</p>
                     </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                     <Clock className="text-primary mt-1" />
                     <div>
                        <div className="font-bold text-gray-900">أوقات العمل</div>
                        <p className="text-gray-500 text-sm">السبت - الخميس: 9:00 ص - 9:00 م</p>
                        <p className="text-gray-500 text-sm">الجمعة: مغلق</p>
                     </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                     <Link href="tel:+966123456789" className="block w-full bg-primary text-white text-center py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors mb-3">
                        اتصل الآن
                     </Link>
                     <Link href="https://wa.me/966500000000" className="block w-full bg-green-500 text-white text-center py-3 rounded-xl font-bold hover:bg-green-600 transition-colors">
                        واتساب
                     </Link>
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
