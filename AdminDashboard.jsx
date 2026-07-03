// AdminDashboard.jsx - النسخة الاحترافية المحدثة لـ محمد الصادق لإدارة الإيداعات وطلبات الشحن بالـ ID
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('deposits'); // deposits أو games
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // اعتماد طلبات شحن المحفظة (بنكك) وإضافة الرصيد لحساب العميل
  async function handleApproveDeposit(order) {
    if (!window.confirm(`هل تأكدت من تطبيق بنكك ووصول مبلغ ${order.total_sdg.toLocaleString()} ج.س برقم العملية ${order.transaction_number}؟`)) return;
    
    setActionLoading(true);
    try {
      // 1. جلب رصيد العميل الحالي
      const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('balance_sdg')
        .eq('id', order.user_id)
        .single();

      if (fetchErr) throw fetchErr;

      const newBalance = (profile?.balance_sdg || 0) + Number(order.total_sdg);

      // 2. تحديث الرصيد الجديد في البروفايل
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ balance_sdg: newBalance })
        .eq('id', order.user_id);

      if (profileErr) throw profileErr;

      // 3. تحديث حالة الطلب إلى مكتمل
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      alert('🟢 تم اعتماد الإيداع بنجاح وإضافة الرصيد لمحفظة العميل!');
      fetchOrders();
    } catch (err) {
      alert('حدث خطأ أثناء الاعتماد: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // إكمال طلبات شحن الألعاب بالـ ID (بعد أن تشحن له يدوياً باللعبة)
  async function handleCompleteGameOrder(orderId) {
    if (!window.confirm('هل قمت بشحن حساب اللاعب في اللعبة بالفعل وتريد إكمال الطلب؟')) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', orderId);

      if (error) throw error;
      alert('✅ تم تحديد طلب شحن اللعبة كمكتمل بنجاح!');
      fetchOrders();
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // رفض أي طلب (سواء إيداع وهمي أو مشكلة في ID اللعبة)
  async function handleRejectOrder(orderId) {
    if (!window.confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (error) throw error;
      alert('🔴 تم رفض الطلب بنجاح.');
      fetchOrders();
    } catch (err) {
      alert('حدث خطأ أثناء الرفض: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  // تصفية الطلبات بناءً على التبويب المختار
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'deposits') return order.order_type === 'wallet_deposit';
    return order.order_type === 'game_recharge';
  });

  return (
    <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #2d2d2d', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#2BED33', margin: 0, fontSize: '18px' }}>🎛️ لوحة تحكم الإدارة - RAIZEY STORE</h2>
        <button onClick={fetchOrders} style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🔄 تحديث</button>
      </div>

      {/* أزرار التبويبات والتحكم */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('deposits')} 
          style={activeTab === 'deposits' ? tabActiveStyle : tabInactiveStyle}
        >
          💰 إيداعات بنكك المعلقة ({orders.filter(o => o.order_type === 'wallet_deposit' && o.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('games')} 
          style={activeTab === 'games' ? tabActiveStyle : tabInactiveStyle}
        >
          🎮 طلبات الألعاب بالـ ID ({orders.filter(o => o.order_type === 'game_recharge' && o.status === 'pending').length})
        </button>
      </div>

      {loading && <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>جاري جلب البيانات والتأكد من العمليات...</p>}
      {error && <p style={{ color: '#ff4d4d', textAlign: 'center' }}>⚠️ خطأ: {error}</p>}

      {!loading && filteredOrders.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center', padding: '30px' }}>لا توجد طلبات في هذا القسم حالياً.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredOrders.map((order) => (
          <div key={order.id} style={{ backgroundColor: '#141414', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
            
            {/* معلومات مشتركة */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '5px' }}>
              <span style={{ fontSize: '13px', color: '#aaa' }}>📧 العميل: <strong>{order.user_email}</strong></span>
              <span style={{ 
                fontSize: '12px', 
                padding: '3px 8px', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                backgroundColor: order.status === 'pending' ? '#ffcc0022' : order.status === 'approved' ? '#2bed3322' : '#ff4d4d22',
                color: order.status === 'pending' ? '#ffcc00' : order.status === 'approved' ? '#2BED33' : '#ff4d4d'
              }}>
                {order.status === 'pending' ? '⏳ معلق' : order.status === 'approved' ? '✅ مكتمل' : '🔴 مرفوض'}
              </span>
            </div>

            {/* تفاصيل بناءً على نوع التبويب المختار */}
            {activeTab === 'deposits' ? (
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ margin: '4px 0' }}>🔢 رقم العملية المرسل: <strong style={{ color: '#ffcc00', fontFamily: 'monospace' }}>{order.transaction_number}</strong></p>
                <p style={{ margin: '4px 0' }}>💰 المبلغ المحول: <strong style={{ color: '#2BED33' }}>{Number(order.total_sdg).toLocaleString()} ج.س</strong></p>
                {order.receipt_url && (
                  <a href={order.receipt_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', margin: '8px 0', color: '#00ccff', textDecoration: 'underline', fontSize: '12px' }}>
                    🖼️ فتح صورة إشعار التحويل في نافذة جديدة
                  </a>
                )}
                
                {order.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button onClick={() => handleApproveDeposit(order)} disabled={actionLoading} style={btnApproveStyle}>✅ اعتماد وإيداع الرصيد</button>
                    <button onClick={() => handleRejectOrder(order.id)} disabled={actionLoading} style={btnRejectStyle}>❌ رفض</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ margin: '4px 0' }}>🎮 اللعبة: <strong style={{ color: '#2BED33' }}>{order.game_name}</strong> - {order.package_name}</p>
                <p style={{ margin: '4px 0' }}>🆔 معرف اللاعب (ID): <strong style={{ color: '#ffcc00', fontFamily: 'monospace', fontSize: '14px' }}>{order.game_id}</strong></p>
                <p style={{ margin: '4px 0' }}>💰 التكلفة المخصومة: {Number(order.total_sdg).toLocaleString()} ج.س</p>
                
                {order.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button onClick={() => handleCompleteGameOrder(order.id)} disabled={actionLoading} style={btnApproveStyle}>✔️ تم الشحن الفوري للاعب</button>
                    <button onClick={() => handleRejectOrder(order.id)} disabled={actionLoading} style={btnRejectStyle}>❌ رفض وإرجاع الرصيد يدويًا</button>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ fontSize: '10px', color: '#666', marginTop: '8px', textAlign: 'left' }}>
              {new Date(order.created_at).toLocaleString('ar-SD')}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

const tabActiveStyle = { flex: 1, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const tabInactiveStyle = { flex: 1, backgroundColor: '#141414', color: '#fff', border: '1px solid #333', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnApproveStyle = { flex: 2, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const btnRejectStyle = { flex: 1, backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
