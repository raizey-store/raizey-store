// Store.jsx
// واجهة متجر RAIZEY STORE المحدثة بالكامل بالجنيه السوداني والشراء الفوري عبر رصيد المحفظة والـ ID
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Store({ user, onNavigate }) {
  const [balanceSdg, setBalanceSdg] = useState(0);
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [gameId, setGameId] = useState('');
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [user]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      // 1. جلب رصيد حساب العميل بالجنيه السوداني لعرضه في الأعلى
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('balance_sdg').eq('id', user.id).single();
        if (profile) setBalanceSdg(profile.balance_sdg || 0);
      }

      // 2. قائمة عروض الألعاب الافتراضية بالجنيه السوداني (ويمكنك لاحقاً جلبها من قاعدة البيانات)
      const mockGames = [
        {
          id: 1,
          name: 'PUBG MOBILE 👑',
          items: [
            { id: 101, name: '60 شدة (UC)', price_sdg: 1500 },
            { id: 102, name: '325 شدة (UC)', price_sdg: 6800 },
            { id: 103, name: '660 شدة (UC)', price_sdg: 13500 },
          ]
        },
        {
          id: 2,
          name: 'Free Fire 🔥',
          items: [
            { id: 201, name: '100 جوهرة', price_sdg: 1200 },
            { id: 202, name: '210 جوهرة', price_sdg: 2400 },
            { id: 203, name: '530 جوهرة', price_sdg: 5800 },
          ]
        }
      ];
      setGames(mockGames);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً لتتمكن من الشراء.');
      return;
    }
    if (!gameId.trim()) {
      alert('الرجاء إدخال الـ ID الخاص باللعبة بدقة.');
      return;
    }

    // التأكد من أن الرصيد في المحفظة كافٍ لشراء العرض
    if (balanceSdg < selectedItem.price_sdg) {
      alert(`رصيد محفظتك الحالي (${balanceSdg.toLocaleString()} ج.س) غير كافٍ لشراء هذا العرض بقيمة (${selectedItem.price_sdg.toLocaleString()} ج.س). الرجاء الذهاب للمحفظة وشحن حسابك أولاً.`);
      return;
    }

    setBuying(true);
    try {
      const nextBalance = balanceSdg - selectedItem.price_sdg;

      // 1. خصم الجنيهات فوراً من محفظة العميل في جدول الـ profiles
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ balance_sdg: nextBalance })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      // 2. تسجيل طلب شحن اللعبة في جدول الطلبات للأدمن بالـ ID وتفاصيل الخدمة
      const { error: orderErr } = await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: selectedItem.price_sdg,
        game_id: gameId.trim(), // حفظ الـ ID الخاص باللاعب
        game_name: selectedGame.name,
        package_name: selectedItem.name,
        status: 'pending',
        order_type: 'game_recharge' // نوع الطلب: شحن ألعاب من رصيد المحفظة
      });

      if (orderErr) throw orderErr;

      alert(`🟢 تم خصم المبلغ بنجاح وإرسال طلب شحن ${selectedItem.name} بالـ ID: ${gameId} للأدمن محمد وجاري التنفيذ!`);
      
      // إعادة تعيين الواجهة وتحديث البيانات
      setGameId('');
      setSelectedItem(null);
      fetchStoreData();

    } catch (err) {
      alert('حدث خطأ أثناء الشراء: ' + err.message);
    }
    setBuying(false);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#2BED33', backgroundColor:'#141414', minHeight:'100vh'}}>جاري تحميل المتجر والعروض...</div>;

  return (
    <div style={styles.container}>
      {/* هيدر المتجر العلوي ومحفظة العميل */}
      <div style={styles.header}>
        <div style={styles.brand}>🎮 RAIZEY STORE</div>
        <div style={styles.walletBar}>
          <span style={styles.walletText}>رصيد محفظتك: <strong style={{color:'#2BED33'}}>{balanceSdg.toLocaleString()} ج.س</strong></span>
          <button onClick={() => onNavigate('wallet')} style={styles.walletBtn}>📥 شحن المحفظة (بنكك)</button>
        </div>
      </div>

      <p style={styles.welcomeHint}>مرحباً بك! اختر اللعبة ثم العرض المناسب، وسيتم الخصم مباشرة من رصيد محفظتك الرقمية بالجنيه.</p>

      {/* قسم عرض الألعاب المتاحة للموقع */}
      <div style={styles.gamesGrid}>
        {games.map(game => (
          <div key={game.id} style={styles.gameCard}>
            <h3 style={styles.gameName}>{game.name}</h3>
            <div style={styles.itemsList}>
              {game.items.map(item => (
                <div key={item.id} style={styles.itemRow}>
                  <div style={styles.itemInfo}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemPrice}>{item.price_sdg.toLocaleString()} ج.س</span>
                  </div>
                  <button 
                    onClick={() => { setSelectedGame(game); setSelectedItem(item); }} 
                    style={styles.buyBtn}
                  >
                    ⚡ شراء
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* نافذة منبثقة (Popup) تفتح عند الضغط على زر الشراء لطلب الـ ID */}
      {selectedItem && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{margin:'0 0 10px 0', color:'#2BED33'}}>🛒 تأكيد عملية الشحن من المحفظة</h3>
            <p style={{fontSize:'13px', margin:'5px 0', color:'#aaaaaa'}}>أنت الآن تقوم بشراء: <strong>{selectedItem.name}</strong> من لعبة <strong>{selectedGame.name}</strong></p>
            <p style={{fontSize:'13px', margin:'5px 0'}}>التكلفة: <strong style={{color:'#2BED33'}}>{selectedItem.price_sdg.toLocaleString()} ج.س</strong></p>

            <form onSubmit={handlePurchaseSubmit} style={{marginTop:'15px', display:'flex', flexDirection:'column', gap:'12px'}}>
              <label style={{fontSize:'12px', color:'#cccccc'}}>أدخل الـ ID الخاص بحسابك في اللعبة (بدقة):</label>
              <input 
                type="text" 
                placeholder="أدخل الـ ID هنا..." 
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                style={styles.modalInput}
                required
              />

              <div style={styles.modalBtns}>
                <button type="submit" disabled={buying} style={styles.confirmBtn}>
                  {buying ? 'جاري معالجة الخصم...' : '✅ تأكيد وخصم الرصيد'}
                </button>
                <button type="button" onClick={() => { setSelectedItem(null); setGameId(''); }} style={styles.cancelBtn}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', direction: 'rtl', padding: '15px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2d2d2d', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
  brand: { fontSize: '18px', fontWeight: 'bold', color: '#2BED33' },
  walletBar: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1e1e1e', padding: '6px 12px', borderRadius: '8px', border: '1px solid #2d2d2d' },
  walletText: { fontSize: '13px' },
  walletBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  welcomeHint: { fontSize: '12px', color: '#aaaaaa', marginBottom: '20px' },
  gamesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  gameCard: { backgroundColor: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: '12px', padding: '15px' },
  gameName: { margin: '0 0 15px 0', fontSize: '15px', color: '#2BED33', borderBottom: '1px solid #2d2d2d', paddingBottom: '8px' },
  itemsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414', padding: '10px', borderRadius: '8px', border: '1px solid #222' },
  itemInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  itemName: { fontSize: '13px', fontWeight: 'bold' },
  itemPrice: { fontSize: '12px', color: '#aaaaaa' },
  buyBtn: { backgroundColor: '#1e1e1e', color: '#2BED33', border: '1px solid #2BED33', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', zIndex: 999 },
  modal: { backgroundColor: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px' },
  modalInput: { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '10px', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  modalBtns: { display: 'flex', gap: '10px', marginTop: '10px' },
  confirmBtn: { flex: 2, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
  cancelBtn: { flex: 1, backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }
};
