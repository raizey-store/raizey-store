// AdminDashboard.jsx - لوحة التحكم المبسطة والمنظمة
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // جلب الطلبات بشكل سليم دون استدعاء أعمدة غير موجودة
  async function fetchOrders() {
    try {
      setLoading(true);
      setError(null);
      
      // جلب الأعمدة الأساسية المتوفرة دائماً لتفادي أخطاء السيرفر
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, product_name, player_id, price, status');

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // تحديث حالة الطلب يدوياً (مكتمل / معلق)
  async function updateStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      fetchOrders(); // إعادة تحديث القائمة فوراً
    }
  }

  return (
    <div style={{ padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #2d2d2d' }}>
      <h2 style={{ color: '#ffcc00', margin: '0 0 15px 0', fontSize: '18px', textAlign: 'center' }}>🎛️ لوحة إدارة متجر رايزي</h2>
      
      <button onClick={fetchOrders} style={{ width: '100%', backgroundColor: '#333', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', marginBottom: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
        🔄 تحديث قائمة الطلبات الواردة
      </button>

      {loading && <p style={{ color: '#aaa', textAlign: 'center' }}>جاري تحميل الطلبات...</p>}
      
      {error && (
        <div style={{ backgroundColor: '#ff4d4d22', border: '1px solid #ff4d4d', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
          <p style={{ color: '#ff4d4d', margin: 0, fontSize: '12px' }}>⚠️ خطأ في قاعدة البيانات: {error}</p>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p style={{ color: '#aaa', textAlign: 'center' }}>لا توجد طلبات شحن واردة حالياً.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#2BED33' }}>{order.product_name}</span>
            <span style={{ fontSize: '12px', color: order.status === 'completed' ? '#2BED33' : '#ffcc00' }}>
              {order.status === 'completed' ? '✅ مكتمل' : '⏳ قيد الانتظار'}
            </span>
          </div>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#ccc' }}>🆔 معرف اللاعب (ID): <strong style={{ color: '#fff' }}>{order.player_id}</strong></p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#ccc' }}>💰 القيمة: {order.price} ج.س</p>
          
          {order.status !== 'completed' && (
            <button onClick={() => updateStatus(order.id, 'completed')} style={{ marginTop: '8px', width: '100%', backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '6px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
              ✔️ تأكيد الشحن وإكمال الطلب
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
