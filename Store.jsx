import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Store({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('shop'); // shop | wallet | history | security
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({ balance_sdg: 0, is_admin: false, payment_pin: '0000' });
  const [settings, setSettings] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // حقول مستقلة لكل منتج للتخلص من تجميد الكتابة نهائياً
  const [inputIds, setInputIds] = useState({});
  const [inputPins, setInputPins] = useState({});

  // البانر المتحرك العلوي
  const carouselImages = [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80", // غلاف ببجي احترافي غير مباشر
    "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=800&q=80"
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // إعدادات تغيير كلمة المرور والـ PIN الآمن للعميل
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchSettings();
      fetchMyOrders();
    }
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  async function fetchUserData() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  }

  async function fetchSettings() {
    const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (data) setSettings(data);
  }

  async function fetchMyOrders() {
    const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setMyOrders(data);
  }

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    try {
      if (newPin) {
        if (newPin.length !== 4 || isNaN(newPin)) {
          alert('يجب أن يتكون رمز الدفع PIN الجديد من 4 أرقام فقط.');
          return;
        }
        await supabase.from('profiles').update({ payment_pin: newPin.trim() }).eq('id', user.id);
      }
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
      }
      alert('تم تحديث إعدادات الأمان الخاصة بحسابك بنجاح!');
      setNewPin('');
      setNewPassword('');
      fetchUserData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickPurchase = async (prod, prodId) => {
    const targetId = inputIds[prodId] || '';
    const targetPin = inputPins[prodId] || '';

    if (!targetId.trim() || !targetPin.trim()) {
      alert('الرجاء إدخال معرف اللاعب (ID) ورمز الـ PIN الخاص بحسابك لإتمام عملية الدفع.');
      return;
    }

    if (targetPin.trim() !== profile.payment_pin) {
      alert('رمز الدفع PIN الذي أدخلته غير صحيح! يرجى المحاولة مرة أخرى.');
      return;
    }

    if (profile.balance_sdg < prod.price) {
      alert('رصيد محفظتك غير كافٍ لتنفيذ هذا الطلب، يرجى تقديم طلب إيداع أموال أولاً.');
      return;
    }

    setLoading(true);
    try {
      const nextBalance = profile.balance_sdg - prod.price;
      await supabase.from('profiles').update({ balance_sdg: nextBalance }).eq('id', user.id);
      
      await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: prod.price,
        game_id: targetId.trim(),
        game_name: prod.game,
        package_name: prod.name,
        status: 'pending',
        order_type: 'game_recharge'
      });

      alert('تم تقديم طلب الشحن للمراجعة الفورية بنجاح!');
      setInputIds({ ...inputIds, [prodId]: '' });
      setInputPins({ ...inputPins, [prodId]: '' });
      fetchUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const products = [
    { id: 'p60', name: '60 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_60_price || 1500, img: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=300&q=80" },
    { id: 'p325', name: '325 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_325_price || 6800, img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80" },
    { id: 'p660', name: '660 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_660_price || 13500, img: "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=300&q=80" },
    { id: 'f100', name: '100 جوهرة', game: 'Free Fire', price: settings.ff_100_price || 1200, img: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=300&q=80" },
    { id: 'f210', name: '210 جوهرة', game: 'Free Fire', price: settings.ff_210_price || 2400, img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80" },
    { id: 'f530', name: '530 جوهرة', game: 'Free Fire', price: settings.ff_530_price || 5800, img: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80" },
  ];

  return (
    <div style={styles.container}>
      {/* هيدر عصري مسطح */}
      <header style={styles.header}>
        <button onClick={() => setIsSidebarOpen(true)} style={styles.menuTrigger}>
          <div style={styles.hamburgerLine}></div>
          <div style={styles.hamburgerLine}></div>
          <div style={styles.hamburgerLine}></div>
        </button>
        <div style={styles.brand}>RAIZEY STORE</div>
        <div style={styles.balanceBadge}>
          <span>{Number(profile.balance_sdg).toLocaleString()} ج.س</span>
        </div>
      </header>

      {/* شريط الملاحة الجانبي الاحترافي المخفي */}
      {isSidebarOpen && (
        <div style={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)}>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sidebarHeader}>
              <div style={styles.userProfileTitle}>حساب العميل الشخصي</div>
              <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.sidebarBalanceBox}>
              <p style={{ margin: 0, color: '#626278', fontSize: '13px' }}>رصيدك المتاح حالياً</p>
              <h3 style={{ margin: '4px 0 0 0', color: '#2BED33', fontSize: '20px' }}>{Number(profile.balance_sdg).toLocaleString()} ج.س</h3>
            </div>
            <div style={styles.sidebarNav}>
              <button onClick={() => { setActiveTab('shop'); setIsSidebarOpen(false); }} style={activeTab === 'shop' ? styles.activeSideLink : styles.sideLink}>🛒 تصفح العروض</button>
              <button onClick={() => { setActiveTab('wallet'); setIsSidebarOpen(false); }} style={activeTab === 'wallet' ? styles.activeSideLink : styles.sideLink}>📥 شحن الرصيد</button>
              <button onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} style={activeTab === 'history' ? styles.activeSideLink : styles.sideLink}>📜 سجل عملياتي</button>
              <button onClick={() => { setActiveTab('security'); setIsSidebarOpen(false); }} style={activeTab === 'security' ? styles.activeSideLink : styles.sideLink}>🛡️ إعدادات الأمان</button>
              {profile.is_admin && <button onClick={() => onNavigate('admin')} style={styles.adminSideLink}>🎛️ لوحة تحكم الأدمن</button>}
            </div>
          </div>
        </div>
      )}

      {/* تبويب المتجر الرئيسي الاحترافي */}
      {activeTab === 'shop' && (
        <div>
          {/* البانر الإعلاني الأوتوماتيكي المتحرك */}
          <div style={styles.carouselContainer}>
            <div style={{ ...styles.carouselSlider, transform: `translateX(${currentSlide * 100}%)` }}>
              {carouselImages.map((img, idx) => (
                <div key={idx} style={{ ...styles.slide, backgroundImage: `url(${img})` }}>
                  <div style={styles.slideOverlay}>
                    <h2>شحن فوري بالـ ID والـ PIN الآمن</h2>
                    <p>أسعار مباشرة متوافقة ومحدثة بالكامل بالجنيه السوداني</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* عرض المنتجات بشكل شبكي احترافي جنباً إلى جنب */}
          <div style={styles.productGrid}>
            {products.map((prod) => (
              <div key={prod.id} style={styles.classicCard}>
                <div style={{ ...styles.cardImage, backgroundImage: `url(${prod.img})` }}>
                  <span style={styles.gridBadge}>{prod.game}</span>
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.gridProdName}>{prod.name}</h3>
                  <div style={styles.gridPrice}>{Number(prod.price).toLocaleString()} ج.س</div>
                  
                  {/* الحقول مدمجة ومباشرة لحل مشكلة عدم القدرة على الكتابة */}
                  <div style={styles.inlineForm}>
                    <input 
                      type="text" 
                      placeholder="أدخل الـ ID" 
                      value={inputIds[prod.id] || ''} 
                      onChange={(e) => setInputIds({ ...inputIds, [prod.id]: e.target.value })}
                      style={styles.inlineInput}
                    />
                    <input 
                      type="password" 
                      maxLength={4}
                      placeholder="رمز الـ PIN" 
                      value={inputPins[prod.id] || ''} 
                      onChange={(e) => setInputPins({ ...inputPins, [prod.id]: e.target.value })}
                      style={styles.inlineInput}
                    />
                    <button onClick={() => handleQuickPurchase(prod, prod.id)} disabled={loading} style={styles.gridBuyBtn}>
                      شراء
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تبويب المحفظة وتحديث الرصيد */}
      {activeTab === 'wallet' && (
        <div style={styles.pageWrap}>
          <div style={styles.darkFormCard}>
            <h2 style={styles.pageTitle}>شحن رصيد المحفظة عبر بنكك</h2>
            <div style={styles.bankAlert}>
              <p style={{ margin: 0 }}>رقم حساب الإيداع: <strong style={{ color: '#2BED33', fontFamily: 'monospace' }}>{settings.bankak_account}</strong></p>
              <p style={{ margin: '6px 0 0 0' }}>باسم العميل: <strong>{settings.bankak_name}</strong></p>
            </div>
            {/* نموذج الإيداع المعتاد */}
          </div>
        </div>
      )}

      {/* تبويب إعدادات الأمان الخاصة بالعميل ورمز الـ PIN */}
      {activeTab === 'security' && (
        <div style={styles.pageWrap}>
          <div style={styles.darkFormCard}>
            <h2 style={styles.pageTitle}>🛡️ إدارة الأمان وحماية الحساب</h2>
            <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>تغيير رمز دفع PIN الخاص بالعمليات (4 أرقام):</label>
                <input type="password" maxLength={4} placeholder="اتركه فارغاً إذا كنت لا ترغب بتغييره" value={newPin} onChange={(e) => setNewPin(e.target.value)} style={styles.fullInput} />
              </div>
              <div>
                <label style={styles.label}>تغيير كلمة مرور الحساب الجديدة:</label>
                <input type="password" placeholder="اتركه فارغاً إذا كنت لا ترغب بتغييرها" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.fullInput} />
              </div>
              <button type="submit" style={styles.saveSecurityBtn}>تحديث بيانات الأمان</button>
            </form>
          </div>
        </div>
      )}

      {/* تبويب طلباتي وجدول مراجعة البيانات */}
      {activeTab === 'history' && (
        <div style={styles.historyWrap}>
          <h2 style={styles.pageTitle}>سجل العمليات والطلبات الشخصية</h2>
          {myOrders.map(ord => (
            <div key={ord.id} style={styles.historyRow}>
              <div>
                <h4 style={{ margin: 0 }}>{ord.order_type === 'wallet_deposit' ? 'إيداع أموال محفظة' : `شحن باقة ${ord.package_name}`}</h4>
                <p style={{ margin: '4px 0 0 0', color: '#626278', fontSize: '12px' }}>{ord.order_type === 'game_recharge' ? `المعرف المستهدف: ${ord.game_id}` : `الرقم المرجعي: ${ord.transaction_number}`}</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ color: '#2BED33', fontWeight: 'bold' }}>{Number(ord.total_sdg).toLocaleString()} ج.س</span>
                <span style={{ display: 'block', fontSize: '11px', color: ord.status === 'approved' ? '#2BED33' : '#ffcc00' }}>{ord.status === 'approved' ? 'مكتمل' : 'قيد التدقيق'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#070708', minHeight: '100vh', color: '#fff', fontFamily: '"Cairo", system-ui, sans-serif', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f0f12', padding: '16px 20px', borderBottom: '1px solid #1e1e24', position: 'sticky', top: 0, zIndex: 100 },
  menuTrigger: { backgroundColor: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer' },
  hamburgerLine: { width: '22px', height: '2px', backgroundColor: '#fff' },
  brand: { fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' },
  balanceBadge: { backgroundColor: 'rgba(43,237,51,0.1)', color: '#2BED33', border: '1px solid rgba(43,237,51,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' },
  sidebarOverlay: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', justifyContent: 'flex-start' },
  sidebar: { width: '280px', backgroundColor: '#0f0f12', height: '100%', borderLeft: '1px solid #1e1e24', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userProfileTitle: { fontWeight: 'bold', fontSize: '15px', color: '#fff' },
  closeBtn: { backgroundColor: 'transparent', color: '#626278', border: 'none', fontSize: '18px', cursor: 'pointer' },
  sidebarBalanceBox: { backgroundColor: '#16161c', padding: '16px', borderRadius: '12px', border: '1px solid #252530' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sideLink: { backgroundColor: 'transparent', color: '#9da0b7', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'right', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  activeSideLink: { backgroundColor: '#16161c', color: '#2BED33', border: 'none', padding: '12px', borderRadius: '10px', textAlign: 'right', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  adminSideLink: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '10px', textAlign: 'right', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginTop: '16px' },
  carouselContainer: { margin: '20px', height: '160px', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1px solid #1e1e24' },
  carouselSlider: { display: 'flex', width: '100%', height: '100%', transition: 'transform 0.5s ease-in-out', direction: 'ltr' },
  slide: { minWidth: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  slideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '16px', direction: 'rtl' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' },
  classicCard: { backgroundColor: '#0f0f12', border: '1px solid #1e1e24', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardImage: { height: '120px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  gridBadge: { position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#000', color: '#2BED33', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  cardContent: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  gridProdName: { fontSize: '16px', fontWeight: 'bold', margin: 0 },
  gridPrice: { color: '#2BED33', fontWeight: 'bold', fontSize: '15px' },
  inlineForm: { display: 'flex', gap: '6px', marginTop: '8px' },
  inlineInput: { flex: 1, backgroundColor: '#16161c', color: '#fff', border: '1px solid #252530', padding: '8px', borderRadius: '8px', fontSize: '12px', outline: 'none' },
  gridBuyBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '0 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
  pageWrap: { display: 'flex', justifyContent: 'center', padding: '40px 20px' },
  darkFormCard: { backgroundColor: '#0f0f12', border: '1px solid #1e1e24', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '440px' },
  pageTitle: { fontSize: '18px', marginBottom: '20px', textAlign: 'center' },
  label: { display: 'block', marginBottom: '6px', fontSize: '12px', color: '#626278' },
  fullInput: { width: '100%', backgroundColor: '#16161c', color: '#fff', border: '1px solid #252530', padding: '12px', borderRadius: '10px', boxSizing: 'border-box', outline: 'none' },
  saveSecurityBtn: { width: '100%', backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  historyWrap: { maxWidth: '640px', margin: '0 auto', padding: '20px' },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f0f12', border: '1px solid #1e1e24', padding: '16px', borderRadius: '12px', marginBottom: '10px' }
};
