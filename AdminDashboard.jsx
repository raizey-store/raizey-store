// AdminDashboard.jsx
// لوحة التحكم الخاصة بالمدير محمد الصادق لإدارة طلبات شحن المحفظة بالجنيه السوداني (SDG)
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onNavigate }) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('order_type', 'wallet_deposit') // جلب طلبات شحن المحفظة فقط
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setPendingOrders(data);
    } catch (err) {
      alert('خطأ في جلب طلبات الإيداع: ' + err.message);
    }
    setLoading(false);
  };

  // دالة تفعيل الرصيد بالجنيه السوداني للعميل بعد التأكد من تطبيق بنكك
  const handleApproveOrder = async (order) => {
    if (!window.confirm(`هل تأكدت من تطبيق بنكك ووصول مبلغ ${order.total_sdg.toLocaleString()} ج.س برقم العملية ${order.transaction_number}؟`)) return;
    
    setActionLoading(true);
    try {
      // 1. جلب رصيد العميل الحالي بالجنيه السوداني من جدول البروفايل
      const { data: profile, error: profileFetchErr } = await supabase
        .from('profiles')
        .select('balance_sdg')
        .eq('id', order.user_id)
        .single();

      if (profileFetchErr) throw profileFetchErr;

      const newBalanceSdg = (profile?.balance_sdg || 0) + order.total_sdg;

      // 2. تحديث الرصيد الجديد بالجنيه في حساب العميل فورياً
      const { error: profileUpdateErr } = await supabase
        .from('profiles')
        .update({ balance_sdg: newBalanceSdg })
        .eq('id', order.user_id);

      if (profileUpdateErr) throw profileUpdateErr;

      // 3. تحديث حالة الطلب إلى مكتمل (approved)
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', order.id);

      if (orderUpdateErr) throw orderUpdateErr;

      alert('🟢 تم تأكيد المعاملة بنجاح وإيداع الجنيهات في محفظة العميل فورياً!');
      fetchPendingOrders();
    } catch (err) {
      alert('حدث خطأ أثناء الاعتماد: ' + err.message);
    }
    setActionLoading(false);
  };

  // دالة رفض الطلب في حال كان الإيصال غير صحيح أو رقم العملية وهمي
  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('هل تريد رفض هذا الطلب؟')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (error) throw error;

      alert('🔴 تم رفض الطلب بنجاح وتحديث السجل للعميل.');
      fetchPendingOrders();
    } catch (err) {
      alert('حدث خطأ أثناء الرفض: ' + err.message);
    }
    setActionLoading(false);
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px', color:'#2BED33', backgroundColor:'#141414', minHeight:'100vh'}}>جاري تحميل طلبات الإيداع الواردة لـ RAIZEY STORE...</div>;

  return (
    <div style={styles.container}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #2d2d2d', paddingBottom:'10px', marginBottom:'20px'}}>
        <h2 style={styles.title}>🎛️ لوحة تحكم الإدارة - مراجعة إيداعات بنكك</h2>
        <button onClick={() => onNavigate('store')} style={styles.backBtn}>🛒 العودة للمتجر</button>
      </div>
      <p style={styles.sub}>تظهر هنا المبالغ التي شحنها الزبائن بالجنيه السوداني. طابق رقم العملية وصورة الإشعار مع تطبيق بنكك لديك قبل التفعيل المعياري.</p>

      {pendingOrders.length === 0 ? (
        <div style={styles.emptyBox}>👍 لا توجد طلبات شحن محفظة معلقة حالياً، جميع الإيداعات محدثة!</div>
      ) : (
        <div style={styles.list}>
          {pendingOrders.map(order => (
            <div key={order.id} style={styles.card}>
              <div style={styles.infoGrid}>
                <div>📧 <strong>إيميل العميل:</strong> {order.user_email}</div>
                <div>🔢 <strong>رقم العملية (بنكك):</strong> <span style={styles.idHighlight}>{order.transaction_number}</span></div>
                <div>💰 <strong>المبلغ المحوّل:</strong> <span style={{color:'#2BED33', fontWeight:'bold'}}>{order.total_sdg.toLocaleString()} ج.س</span></div>
                <div>📅 <strong>تاريخ الطلب:</strong> {new Date(order.created_at).toLocaleString('ar-SD')}</div>
              </div>

              <div style={styles.actionRow}>
                {/* زر لفتح صورة الإيصال المرفوعة */}
                <a href={order.receipt_url} target="_blank" rel="noopener noreferrer" style={styles.viewBtn}>
                  🖼️ فتح صورة إشعار بنكك في نافذة جديدة
                </a>

                <div style={styles.decisionBtns}>
                  <button 
                    onClick={() => handleApproveOrder(order)} 
                    disabled={actionLoading} 
                    style={styles.approveBtn}
                  >
                    ✅ اعتماد وإضافة الرصيد
                  </button>
                  <button 
                    onClick={() => handleRejectOrder(order.id)} 
                    disabled={actionLoading} 
                    style={styles.rejectBtn}
                  >
                    ❌ رفض الطلب
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', direction: 'rtl', padding: '20px' },
  title: { fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#2BED33' },
  backBtn: { backgroundColor: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  sub: { color: '#aaaaaa', fontSize: '12px', margin: '10px 0 20px 0' },
  emptyBox: { backgroundColor: '#1e1e1e', border: '1px solid #333', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#aaaaaa', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #2d2d2d', borderRadius: '10px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', fontSize: '13px', lineHeight: '1.6' },
  idHighlight: { backgroundColor: '#141414', color: '#ffcc00', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '14px' },
  actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid #2d2d2d' },
  viewBtn: { backgroundColor: '#141414', color: '#ffffff', textDecoration: 'none', border: '1px solid #444', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  decisionBtns: { display: 'flex', gap: '8px' },
  approveBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
  rejectBtn: { backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }
};
