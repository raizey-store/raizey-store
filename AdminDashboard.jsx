import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeSubTab, setActiveSubTab] = useState('orders_recharge'); // orders_recharge | orders_wallet | pricing
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [activeSubTab]);

  async function fetchAdminData() {
    setLoading(true);
    const { data: settle } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (settle) setSettings(settle);

    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ords) setOrders(ords);
    setLoading(false);
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    await supabase.from('store_settings').update(settings).eq('id', 1);
    alert('✅ تم تحديث إعدادات وأسعار المتجر بنجاح!');
  };

  const handleAction = async (order, newStatus) => {
    if (!window.confirm('هل أنت متأكد من تغيير حالة هذا الطلب؟')) return;
    try {
      if (order.order_type === 'wallet_deposit' && newStatus === 'approved') {
        const { data: prof } = await supabase.from('profiles').select('balance_sdg').eq('id', order.user_id).single();
        const currentBalance = Number(prof?.balance_sdg || 0);
        await supabase.from('profiles').update({ balance_sdg: currentBalance + Number(order.total_sdg) }).eq('id', order.user_id);
      }
      await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter(o => activeSubTab === 'orders_recharge' ? o.order_type === 'game_recharge' : o.order_type === 'wallet_deposit');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ margin: 0, color: '#ffcc00' }}>🎛️ غُرفة تحكّم الإدارة العليا</h2>
        <button onClick={() => onNavigate('store')} style={styles.backBtn}>🛒 العودة للمتجر</button>
      </header>

      <div style={styles.subTabs}>
        <button onClick={() => setActiveSubTab('orders_recharge')} style={activeSubTab === 'orders_recharge' ? styles.activeTab : styles.tab}>🎮 طلبات الـ ID ({orders.filter(o => o.order_type === 'game_recharge' && o.status === 'pending').length})</button>
        <button onClick={() => setActiveSubTab('orders_wallet')} style={activeSubTab === 'orders_wallet' ? styles.activeTab : styles.tab}>💰 طلبات بنكك ({orders.filter(o => o.order_type === 'wallet_deposit' && o.status === 'pending').length})</button>
        <button onClick={() => setActiveSubTab('pricing')} style={activeSubTab === 'pricing' ? styles.activeTab : styles.tab}>⚙️ الإعدادات والأسعار</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>جاري المزامنة مع قاعدة البيانات...</p>
      ) : activeSubTab === 'pricing' ? (
        <form onSubmit={handleUpdateSettings} style={styles.settingsForm}>
          <h3>💰 حساب بنكك المعتمد للتحويل</h3>
          <input type="text" placeholder="رقم حساب بنكك" value={settings.bankak_account || ''} onChange={(e) => setSettings({ ...settings, bankak_account: e.target.value })} style={styles.input} />
          <input type="text" placeholder="اسم صاحب الحساب" value={settings.bankak_name || ''} onChange={(e) => setSettings({ ...settings, bankak_name: e.target.value })} style={styles.input} />
          
          <h3>💵 تسعير باقات ببجي موبايل (ج.س)</h3>
          <input type="number" placeholder="سعر 60 شدة" value={settings.pubg_60_price || ''} onChange={(e) => setSettings({ ...settings, pubg_60_price: Number(e.target.value) })} style={styles.input} />
          <input type="number" placeholder="سعر 325 شدة" value={settings.pubg_325_price || ''} onChange={(e) => setSettings({ ...settings, pubg_325_price: Number(e.target.value) })} style={styles.input} />
          <input type="number" placeholder="سعر 660 شدة" value={settings.pubg_660_price || ''} onChange={(e) => setSettings({ ...settings, pubg_660_price: Number(e.target.value) })} style={styles.input} />

          <h3>🔥 تسعير باقات فري فاير (ج.س)</h3>
          <input type="number" placeholder="سعر 100 جوهرة" value={settings.ff_100_price || ''} onChange={(e) => setSettings({ ...settings, ff_100_price: Number(e.target.value) })} style={styles.input} />
          <input type="number" placeholder="سعر 210 جوهرة" value={settings.ff_210_price || ''} onChange={(e) => setSettings({ ...settings, ff_210_price: Number(e.target.value) })} style={styles.input} />
          <input type="number" placeholder="سعر 530 جوهرة" value={settings.ff_530_price || ''} onChange={(e) => setSettings({ ...settings, ff_530_price: Number(e.target.value) })} style={styles.input} />

          <button type="submit" style={styles.saveBtn}>حفظ التغييرات وتحديث المتجر فوراً</button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((ord) => (
            <div key={ord.id} style={styles.adminOrderRow}>
              <div>
                <p style={{ margin: 0 }}>📧 العميل: <strong>{ord.user_email}</strong></p>
                <p style={{ margin: '4px 0 0 0', color: '#ffcc00' }}>
                  {ord.order_type === 'game_recharge' ? `🎮 شحن ${ord.package_name} لـ ID: [ ${ord.game_id} ]` : `🔢 رقم عملية بنكك: ${ord.transaction_number}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#2BED33', fontWeight: 'bold' }}>{Number(ord.total_sdg).toLocaleString()} ج.س</span>
                {ord.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleAction(ord, 'approved')} style={styles.approveBtn}>اعتماد ✅</button>
                    <button onClick={() => handleAction(ord, 'rejected')} style={styles.rejectBtn}>رفض ❌</button>
                  </div>
                ) : (
                  <span style={{ color: ord.status === 'approved' ? '#2BED33' : '#ff4d4d', fontSize: '13px' }}>
                    {ord.status === 'approved' ? 'مكتمل' : 'مرفوض'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'system-ui, sans-serif', direction: 'rtl' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#141414', padding: '16px', borderRadius: '12px', border: '1px solid #222' },
  backBtn: { backgroundColor: '#222', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  subTabs: { display: 'flex', gap: '10px', marginBottom: '24px' },
  tab: { flex: 1, backgroundColor: '#141414', color: '#aaa', border: '1px solid #222', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  activeTab: { flex: 1, backgroundColor: '#ffcc00', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  settingsForm: { backgroundColor: '#141414', padding: '24px', borderRadius: '16px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' },
  input: { backgroundColor: '#1d1d1d', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '8px', outline: 'none' },
  saveBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  adminOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414', border: '1px solid #222', padding: '16px', borderRadius: '12px' },
  approveBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  rejectBtn: { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }
};
