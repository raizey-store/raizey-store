// Wallet.jsx
// تحديث شامل: المحفظة تعمل بالكامل بالجنيه السوداني (SDG) بناءً على طلب المدير محمد
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Wallet({ user, onNavigate }) {
  const [balanceSdg, setBalanceSdg] = useState(0);
  const [walletOrders, setWalletOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // حقول طلب شحن رصيد المحفظة بالجنيه
  const [amountSdg, setAmountSdg] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. جلب رصيد محفظة المستخدم الحالي بالجنيه السوداني
      const { data: profileData } = await supabase.from('profiles').select('balance_sdg').eq('id', user.id).single();
      if (profileData) setBalanceSdg(profileData.balance_sdg || 0);

      // 2. جلب تاريخ طلبات شحن المحفظة الخاصة بهذا العميل
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('order_type', 'wallet_deposit')
        .order('created_at', { ascending: false });
      if (ordersData) setWalletOrders(ordersData);

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
    if (!amountSdg || !transactionNumber || !receiptFile) {
      alert('الرجاء تعبئة جميع الحقول ورفع صورة إيصال تحويل بنكك وكتابة رقم العملية.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. رفع صورة الإيصال إلى الـ Storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts-bucket')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts-bucket').getPublicUrl(filePath);

      // 2. تسجيل طلب شحن الرصيد بالجنيه السوداني في السيستم
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: parseFloat(amountSdg),
        transaction_number: transactionNumber.trim(),
        receipt_url: publicUrl,
        status: 'pending',
        order_type: 'wallet_deposit'
      });

      if (orderError) throw orderError;

      alert('تم إرسال طلب شحن المحفظة بنجاح! سيقوم محمد بمطابقة رقم العملية وتفعيل رصيدك بالجنيه فوراً.');
      setAmountSdg('');
      setTransactionNumber('');
      setReceiptFile(null);
      fetchWalletData();

    } catch (err) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#2BED33', backgroundColor:'#141414', minHeight:'100vh'}}>جاري تحميل بيانات محفظتك...</div>;

  return (
    <div style={styles.container}>
      {/* شريط علوي للرجوع */}
      <div style={styles.topNav}>
        <button onClick={() => onNavigate('store')} style={styles.backBtn}>🛒 الذهاب للمتجر لشراء العروض</button>
        <span style={styles.sectionTitle}>💼 محفظتي الإلكترونية بالجنيه</span>
      </div>

      {/* كارت عرض الرصيد بالجنيه السوداني */}
      <div style={styles.balanceCard}>
        <span style={styles.balanceLabel}>رصيدك الحالي المتاح بالموقع</span>
        <h1 style={styles.balanceAmount}>{balanceSdg.toLocaleString()} <small style={{fontSize:'16px'}}>ج.س</small></h1>
      </div>

      {/* نموذج طلب شحن المحفظة بواسطة بنكك */}
      <div style={styles.depositSection}>
        <h3 style={styles.subTitle}>📥 شحن رصيد المحفظة عبر تطبيق (بنكك - بنك الخرطوم)</h3>
        
        <div style={styles.bankAlertBox}>
          <p style={{margin:'0 0 5px 0', fontWeight:'bold', color:'#2BED33'}}>💸 تفاصيل حساب تحويل الأموال:</p>
          <strong style={{color:'#ffffff'}}>رقم الحساب: 2905630</strong><br />
          <strong style={{color:'#ffffff'}}>بنك: الخرطوم (تطبيق بنكك)</strong><br />
          <strong style={{color:'#ffffff'}}>الاسم الكامل: فايزه الصادق هارون البشاري</strong>
          <p style={{margin:'8px 0 0 0', fontSize:'11px', color:'#aaaaaa'}}>حول أي مبلغ تريده بالجنيه السوداني أولاً، ثم املأ البيانات أدناه لتفعيل رصيدك فوراً.</p>
        </div>

        <form onSubmit={handleDepositSubmit} style={styles.form}>
          <label style={styles.label}>المبلغ الذي قمت بتحويله بالجنيه السوداني (ج.س):</label>
          <input 
            type="number" 
            placeholder="مثال: 25000" 
            value={amountSdg}
            onChange={(e) => setAmountSdg(e.target.value)}
            style={styles.input} 
            required
          />

          <label style={styles.label}>رقم العملية البنكية (الموجود في إشعار تطبيق بنكك):</label>
          <input 
            type="text" 
            placeholder="أدخل رقم العملية المكون من أرقام بدقة" 
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            style={styles.input} 
            required
          />

          <label style={styles.label}>ارفق لقطة شاشة لإشعار تحويل بنكك:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={styles.fileInput} 
            required
          />

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'جاري إرسال البيانات وتأمين الطلب...' : '🚀 إرسال طلب شحن رصيد المحفظة'}
          </button>
        </form>
      </div>

      {/* سجل طلبات شحن المحفظة */}
      <div style={styles.historySection}>
        <h3 style={styles.subTitle}>📑 طلبات شحن رصيد المحفظة السابقة</h3>
        {walletOrders.length === 0 ? (
          <p style={{color:'#aaaaaa', textAlign:'center', fontSize:'13px'}}>لم تقم بتقديم طلبات إيداع مسبقة.</p>
        ) : (
          <div style={styles.ordersList}>
            {walletOrders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderRow}>
                  <span>طلب إيداع: <strong style={{color:'#2BED33'}}>{order.total_sdg.toLocaleString()} ج.س</strong></span>
                  <span style={
                    order.status === 'approved' ? styles.statusApproved : 
                    order.status === 'rejected' ? styles.statusRejected : styles.statusPending
                  }>
                    {order.status === 'approved' ? '🟢 تم التأكيد وإيداع الرصيد' : 
                     order.status === 'rejected' ? '🔴 مرفوض' : '🟡 قيد المطابقة والبحث'}
                  </span>
                </div>
                <div style={styles.orderRowDetails}>
                  <span>رقم العملية: {order.transaction_number}</span>
                </div>
                {order.status === 'pending' && (
                  <a href={`https://wa.me/249901815039?text=مرحبا برئيس المتجر محمد، قمت بتحويل ${order.total_sdg} ج.س لرقم العملية ${order.transaction_number} لتفعيل محفظتي.`} target="_blank" rel="noopener noreferrer" style={styles.waLink}>
                    ⚡ استعجال الإيداع عبر واتساب الأدمن
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
  backBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold' },
  balanceCard: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #2d2d2d', marginBottom: '20px' },
  balanceLabel: { color: '#aaaaaa', fontSize: '13px' },
  balanceAmount: { color: '#2BED33', fontSize: '36px', margin: '10px 0', fontWeight: 'bold' },
  depositSection: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d2d', marginBottom: '20px' },
  subTitle: { margin: '0 0 15px 0', fontSize: '15px', borderBottom: '1px solid #333', paddingBottom: '8px' },
  bankAlertBox: { backgroundColor: 'rgba(43, 237, 51, 0.05)', border: '1px dashed #2BED33', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5', marginBottom: '15px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', color: '#cccccc' },
  input: { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '10px', borderRadius: '6px', fontSize: '14px' },
  fileInput: { color: '#aaaaaa', fontSize: '13px' },
  submitBtn: { backgroundColor: '#141414', color: '#2BED33', border: '1px solid #2BED33', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  historySection: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', border: '1px solid #2d2d2d' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d2d' },
  orderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' },
  orderRowDetails: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaaaaa', marginTop: '6px' },
  statusPending: { color: '#ffcc00', fontWeight: 'bold', fontSize: '12px' },
  statusApproved: { color: '#2BED33', fontWeight: 'bold', fontSize: '12px' },
  statusRejected: { color: '#ff4d4d', fontWeight: 'bold', fontSize: '12px' },
  waLink: { display: 'inline-block', marginTop: '8px', color: '#2BED33', fontSize: '12px', textDecoration: 'none' }
};
