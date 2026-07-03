// Wallet.jsx
// صفحة المحفظة الذكية وإيداع الإيصالات لمتجر RAIZEY STORE
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Wallet({ user, onNavigate }) {
  const [balance, setBalance] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // حقول طلب شحن جديد
  const [amountUsd, setAmountUsd] = useState('');
  const [playerID, setPlayerID] = useState('');
  const [gameType, setGameType] = useState('PUBG MOBILE');
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. جلب سعر صرف الدولار بالسيستم
      const { data: rateData } = await supabase.from('exchange_rates').select('rate').eq('id', 1).single();
      if (rateData) setExchangeRate(rateData.rate);

      // 2. جلب رصيد محفظة المستخدم الحالي (بالدولار)
      const { data: profileData } = await supabase.from('profiles').select('balance_usd').eq('id', user.id).single();
      if (profileData) setBalance(profileData.balance_usd);

      // 3. جلب تاريخ طلبات الشحن الخاصة بهذا العميل
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!amountUsd || !playerID || !receiptFile) {
      alert('الرجاء تعبئة جميع الحقول ورفع صورة إيصال التحويل البنكي مسبقاً.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. رفع صورة الإيصال إلى حوض التخزين (Storage) في Supabase
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts-bucket')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      // الحصول على الرابط العام للصورة المرفوعة
      const { data: { publicUrl } } = supabase.storage.from('receipts-bucket').getPublicUrl(filePath);

      // 2. تسجيل الطلب في جدول الطلبات بالسيستم للمراجعة
      const totalSdg = parseFloat(amountUsd) * exchangeRate;
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        amount_usd: parseFloat(amountUsd),
        total_sdg: totalSdg,
        player_id: playerID.trim(),
        game_type: gameType,
        receipt_url: publicUrl,
        status: 'pending'
      });

      if (orderError) throw orderError;

      alert('تم إرسال طلب الشحن بنجاح! جاري مراجعة الإيصال وتفعيل رصيدك خلال دقائق من قبل الإدارة.');
      setAmountUsd('');
      setPlayerID('');
      setReceiptFile(null);
      fetchWalletData();

    } catch (err) {
      alert('حدث خطأ أثناء الرفع: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#2BED33', backgroundColor:'#141414', minHeight:'100vh'}}>جاري تحميل بيانات محفظتك الآمنة...</div>;

  return (
    <div style={styles.container}>
      {/* شريط علوي للرجوع للمتجر */}
      <div style={styles.topNav}>
        <button onClick={() => onNavigate('store')} style={styles.backBtn}>🛒 العودة للمتجر</button>
        <span style={styles.sectionTitle}>💼 إدارة الحساب والمحفظة</span>
      </div>

      {/* كارت عرض الرصيد الحالي للزبون */}
      <div style={styles.balanceCard}>
        <span style={styles.balanceLabel}>رصيدك الحالي المعتمد بالشحن</span>
        <h1 style={styles.balanceAmount}>{balance.toLocaleString()} <small>$</small></h1>
        <p style={styles.balanceSdg}>ما يعادل تقريباً: {(balance * exchangeRate).toLocaleString()} جنيه سوداني</p>
      </div>

      {/* نموذج شحن الرصيد بإرسال التحويلة البنكية */}
      <div style={styles.depositSection}>
        <h3 style={styles.subTitle}>📥 شحن المحفظة (تحويل بنكي / بنكك)</h3>
        
        <div style={styles.bankAlertBox}>
          <p style={{margin:'0 0 5px 0', fontWeight:'bold', color:'#2BED33'}}>⚠️ تعليمات الدفع المباشر:</p>
          <p style={{margin:'0 0 4px 0'}}>الرجاء التحويل أولاً عبر تطبيق بنكك إلى الحساب التالي:</p>
          <strong style={{color:'#ffffff'}}>رقم الحساب: 2905630</strong><br />
          <strong style={{color:'#ffffff'}}>الاسم: فايزه الصادق هارون البشاري</strong>
          <p style={{margin:'8px 0 0 0', fontSize:'11px', color:'#aaaaaa'}}>بعد التحويل، قم بتعبئة النموذج أدناه وارفق لقطة شاشة (إيصال التحويل).</p>
        </div>

        <form onSubmit={handleDepositSubmit} style={styles.form}>
          <label style={styles.label}>القيمة المطلوبة بالدولار ($):</label>
          <input 
            type="number" 
            placeholder="مثال: 10" 
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            style={styles.input} 
            required
          />
          {amountUsd && (
            <span style={styles.calcHint}>المبلغ المستحق للدفع: {(parseFloat(amountUsd) * exchangeRate).toLocaleString()} جنيه سوداني</span>
          )}

          <label style={styles.label}>نوع اللعبة المراد شحنها:</label>
          <select value={gameType} onChange={(e) => setGameType(e.target.value)} style={styles.select}>
            <option value="PUBG MOBILE">ببجي موبايل (PUBG MOBILE)</option>
            <option value="FREE FIRE">فري فاير (FREE FIRE)</option>
            <option value="OTHER">خدمات أخرى / رصيد عام</option>
          </select>

          <label style={styles.label}>الأي دي الخاص بك باللعبة (Player ID):</label>
          <input 
            type="text" 
            placeholder="اكتب الـ ID الخاص بك بدقة هنا" 
            value={playerID}
            onChange={(e) => setPlayerID(e.target.value)}
            style={styles.input} 
            required
          />

          <label style={styles.label}>ارفق صورة إيصال التحويل (بنكك):</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={styles.fileInput} 
            required
          />

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'جاري رفع الإيصال وتأمين الطلب...' : '🚀 إرسال طلب الشحن للإدارة'}
          </button>
        </form>
      </div>

      {/* جدول أو كروت لمتابعة حالة الطلبات السابقة */}
      <div style={styles.historySection}>
        <h3 style={styles.subTitle}>📑 سجل طلبات الشحن السابقة ومتابعة الحالة</h3>
        {orders.length === 0 ? (
          <p style={{color:'#aaaaaa', textAlign:'center', fontSize:'13px'}}>لم تقم بإرسال أي طلبات شحن بعد.</p>
        ) : (
          <div style={styles.ordersList}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderRow}>
                  <span>طلب شحن: <strong>{order.amount_usd} $</strong></span>
                  <span style={
                    order.status === 'approved' ? styles.statusApproved : 
                    order.status === 'rejected' ? styles.statusRejected : styles.statusPending
                  }>
                    {order.status === 'approved' ? '🟢 مكتمل ومكفول' : 
                     order.status === 'rejected' ? '🔴 مرفوض' : '🟡 قيد المراجعة'}
                  </span>
                </div>
                <div style={styles.orderRowDetails}>
                  <span>اللعبة: {order.game_type}</span>
                  <span>ID: {order.player_id}</span>
                </div>
                <div style={styles.orderDate}>
                  تاريخ الطلب: {new Date(order.created_at).toLocaleDateString('ar-SD')}
                </div>
                {order.status === 'pending' && (
                  <a href={`https://wa.me/249901815039?text=مرحبا برئيس المتجر، قمت برفع طلب شحن بقيمة ${order.amount_usd} دولار لحسابي.`} target="_blank" rel="noopener noreferrer" style={styles.waLink}>
                    ⚡ استعجال الطلب عبر الواتساب
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', direction: 'rtl', padding: '15px' },
  topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #2d2d2d', paddingBottom: '10px' },
  backBtn: { backgroundColor: '#1e1e1e', color: '#2BED33', border: '1px solid #2BED33', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold' },
  balanceCard: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #2d2d2d', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  balanceLabel: { color: '#aaaaaa', fontSize: '13px' },
  balanceAmount: { color: '#2BED33', fontSize: '36px', margin: '10px 0', fontWeight: 'bold' },
  balanceSdg: { color: '#888888', fontSize: '12px', margin: 0 },
  depositSection: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d2d', marginBottom: '20px' },
  subTitle: { margin: '0 0 15px 0', fontSize: '15px', borderBottom: '1px solid #333', paddingBottom: '8px', color: '#ffffff' },
  bankAlertBox: { backgroundColor: 'rgba(43, 237, 51, 0.05)', border: '1px dashed #2BED33', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', color: '#dddddd', marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', color: '#cccccc' },
  input: { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '10px', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  select: { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '10px', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  fileInput: { color: '#aaaaaa', fontSize: '13px', padding: '5px 0' },
  calcHint: { fontSize: '12px', color: '#2BED33', marginTop: '-4px' },
  submitBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' },
  historySection: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d2d' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d2d' },
  orderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '6px' },
  orderRowDetails: { display: 'flex', gap: '15px', fontSize: '12px', color: '#aaaaaa', marginBottom: '6px' },
  orderDate: { fontSize: '10px', color: '#666666' },
  statusPending: { color: '#ffcc00', fontWeight: 'bold', fontSize: '12px' },
  statusApproved: { color: '#2BED33', fontWeight: 'bold', fontSize: '12px' },
  statusRejected: { color: '#ff4d4d', fontWeight: 'bold', fontSize: '12px' },
  waLink: { display: 'inline-block', marginTop: '8px', color: '#2BED33', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }
};
