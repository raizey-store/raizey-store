import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Store({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('shop'); // shop | wallet | history
  const [profile, setProfile] = useState({ balance_sdg: 0, is_admin: false });
  const [settings, setSettings] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [gameId, setGameId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [transNumber, setTransNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchSettings();
      fetchMyOrders();
    }
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

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (profile.balance_sdg < selectedItem.price) {
      alert('⚠️ رصيد محفظتك غير كافٍ لهذا العرض، يرجى شحن المحفظة أولاً.');
      return;
    }
    setLoading(true);
    try {
      const nextBalance = profile.balance_sdg - selectedItem.price;
      await supabase.from('profiles').update({ balance_sdg: nextBalance }).eq('id', user.id);
      
      await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: selectedItem.price,
        game_id: gameId.trim(),
        game_name: selectedItem.game,
        package_name: selectedItem.name,
        status: 'pending',
        order_type: 'game_recharge'
      });

      alert('⚡ تم تقديم طلب الشحن بنجاح! سيقوم الإشراف بالتنفيذ فوراً.');
      setSelectedItem(null);
      setGameId('');
      fetchUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: Number(depositAmount),
        transaction_number: transNumber.trim(),
        order_type: 'wallet_deposit',
        status: 'pending'
      });
      alert('✅ تم إرسال إشعار التحويل. سيتم تدقيق العملية وإضافة الرصيد فوراً.');
      setDepositAmount('');
      setTransNumber('');
      setActiveTab('history');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const products = [
    { name: '60 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_60_price || 1500 },
    { name: '325 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_325_price || 6800 },
    { name: '660 شدة (UC)', game: 'PUBG MOBILE', price: settings.pubg_660_price || 13500 },
    { name: '100 جوهرة', game: 'Free Fire', price: settings.ff_100_price || 1200 },
    { name: '210 جوهرة', game: 'Free Fire', price: settings.ff_210_price || 2400 },
    { name: '530 جوهرة', game: 'Free Fire', price: settings.ff_530_price || 5800 },
  ];

  return (
    <div style={styles.container}>
      {/* هيدر تصفح علوي احترافي */}
      <header style={styles.header}>
        <div style={styles.brand}>🎮 RAIZEY STORE</div>
        <nav style={styles.nav}>
          <button onClick={() => setActiveTab('shop')} style={activeTab === 'shop' ? styles.activeNavLink : styles.navLink}>🛒 المتجر</button>
          <button onClick={() => setActiveTab('wallet')} style={activeTab === 'wallet' ? styles.activeNavLink : styles.navLink}>💼 المحفظة</button>
          <button onClick={() => setActiveTab('history')} style={activeTab === 'history' ? styles.activeNavLink : styles.navLink}>📜 طلباتي</button>
          {profile.is_admin && <button onClick={() => onNavigate('admin')} style={styles.adminLink}>🎛️ الإدارة</button>}
        </nav>
        <div style={styles.userBadge}>
          <span style={styles.balanceText}>المحفظة: <strong style={{ color: '#2BED33' }}>{Number(profile.balance_sdg).toLocaleString()} ج.س</strong></span>
        </div>
      </header>

      {/* تبويب المتجر الاستعراضي */}
      {activeTab === 'shop' && (
        <div>
          <div style={styles.sectionTitleContainer}>
            <h2 style={styles.sectionTitle}>العروض المتوفرة حالياً</h2>
            <p style={styles.sectionSubtitle}>اختر الباقة المناسبة للشحن المباشر عبر الـ ID الخاص بك</p>
          </div>
          <div style={styles.grid}>
            {products.map((prod, index) => (
              <div key={index} style={styles.productCard}>
                <span style={styles.categoryBadge}>{prod.game}</span>
                <h3 style={styles.productName}>{prod.name}</h3>
                <div style={styles.cardFooter}>
                  <span style={styles.priceTag}>{Number(prod.price).toLocaleString()} ج.س</span>
                  <button onClick={() => setSelectedItem(prod)} style={styles.buyBtn}>⚡ شراء</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تبويب إيداع الأموال */}
      {activeTab === 'wallet' && (
        <div style={styles.centerContainer}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>📥 شحن المحفظة عبر تطبيق بنكك</h2>
            <div style={styles.bankDetails}>
              <p style={{ margin: '4px 0' }}>رقم الحساب المعتمد: <strong style={{ color: '#2BED33', fontFamily: 'monospace' }}>{settings.bankak_account}</strong></p>
              <p style={{ margin: '4px 0' }}>باسم: <strong>{settings.bankak_name}</strong></p>
            </div>
            <form onSubmit={handleDeposit} style={styles.verticalForm}>
              <input type="number" placeholder="المبلغ المراد شحنه (ج.س)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} required style={styles.input} />
              <input type="text" placeholder="رقم عملية التحويل (المرجعي)" value={transNumber} onChange={(e) => setTransNumber(e.target.value)} required style={styles.input} />
              <button type="submit" disabled={loading} style={styles.submitBtn}>إرسال إشعار التحويل 💸</button>
            </form>
          </div>
        </div>
      )}

      {/* تبويب قائمة الطلبات للزبون */}
      {activeTab === 'history' && (
        <div style={styles.historyContainer}>
          <h2 style={styles.formTitle}>📜 سجل العمليات والطلبات الخاصة بك</h2>
          {myOrders.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>لم تقم بأي عمليات بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myOrders.map((ord) => (
                <div key={ord.id} style={styles.orderRow}>
                  <div>
                    <h4 style={{ margin: 0, color: '#fff' }}>{ord.order_type === 'wallet_deposit' ? '📥 طلب إيداع محفظة' : `🎮 شحن ${ord.package_name}`}</h4>
                    <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '12px' }}>{ord.order_type === 'game_recharge' ? `ID: ${ord.game_id}` : `عملية رقم: ${ord.transaction_number}`}</p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ color: '#2BED33', fontWeight: 'bold', display: 'block' }}>{Number(ord.total_sdg).toLocaleString()} ج.س</span>
                    <span style={{ fontSize: '12px', color: ord.status === 'approved' ? '#2BED33' : ord.status === 'pending' ? '#ffcc00' : '#ff4d4d' }}>
                      {ord.status === 'approved' ? '✅ مكتمل' : ord.status === 'pending' ? '⏳ قيد الانتظار' : '🔴 مرفوض'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* مودال الشراء وإدخال الـ ID لتبدو العملية احترافية */}
      {selectedItem && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: '#2BED33', margin: '0 0 8px 0' }}>🎮 تأكيد طلب الشحن بالـ ID</h3>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 16px 0' }}>أنت تفعل الآن: {selectedItem.name} ({selectedItem.game})</p>
            <form onSubmit={handlePurchase} style={styles.verticalForm}>
              <input type="text" placeholder="أدخل معرف اللاعب (ID) بعناية" value={gameId} onChange={(e) => setGameId(e.target.value)} required style={styles.input} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading} style={styles.confirmBtn}>تأكيد وخصم {Number(selectedItem.price).toLocaleString()} ج.س</button>
                <button type="button" onClick={() => setSelectedItem(null)} style={styles.cancelBtn}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif', direction: 'rtl', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414', padding: '16px 24px', borderRadius: '12px', border: '1px solid #222', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
  brand: { fontSize: '20px', fontWeight: 'bold', color: '#2BED33', letterSpacing: '0.5px' },
  nav: { display: 'flex', gap: '8px' },
  navLink: { backgroundColor: 'transparent', color: '#aaa', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  activeNavLink: { backgroundColor: '#222', color: '#2BED33', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  adminLink: { backgroundColor: '#ff4d4d22', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  userBadge: { backgroundColor: '#1d1d1d', padding: '8px 16px', borderRadius: '8px', border: '1px solid #333' },
  balanceText: { fontSize: '14px' },
  sectionTitleContainer: { marginBottom: '24px' },
  sectionTitle: { fontSize: '22px', margin: '0 0 6px 0', color: '#fff' },
  sectionSubtitle: { color: '#666', fontSize: '14px', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  productCard: { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '14px', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' },
  categoryBadge: { position: 'absolute', top: '16px', left: '16px', backgroundColor: '#222', color: '#aaa', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  productName: { fontSize: '16px', fontWeight: 'bold', marginTop: '24px', marginBottom: '16px', color: '#fff' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceTag: { color: '#2BED33', fontWeight: 'bold', fontSize: '16px' },
  buyBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  centerContainer: { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  formCard: { backgroundColor: '#141414', border: '1px solid #222', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '440px' },
  formTitle: { fontSize: '18px', margin: '0 0 16px 0', color: '#fff', textAlign: 'center' },
  bankDetails: { backgroundColor: '#1d1d1d', padding: '14px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px', fontSize: '14px', lineHeight: '1.6' },
  verticalForm: { display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' },
  input: { backgroundColor: '#1d1d1d', color: '#fff', border: '1px solid #333', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  submitBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  historyContainer: { maxWidth: '700px', margin: '0 auto', backgroundColor: '#141414', border: '1px solid #222', padding: '24px', borderRadius: '16px' },
  orderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1d1d1d', padding: '14px 16px', borderRadius: '10px', border: '1px solid #2d2d2d' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '20px' },
  modal: { backgroundColor: '#141414', border: '1px solid #333', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' },
  confirmBtn: { flex: 2, backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { flex: 1, backgroundColor: '#222', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }
};
