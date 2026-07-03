// Storefront.jsx - واجهة عرض المنتجات وشحن الـ ID المرتبة
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Storefront({ user }) {
  const [playerId, setPlayerId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // قائمة المنتجات الثابتة والمنظمة بالجنيه السوداني
  const products = [
    { id: 'pubg_60', name: '60 شدة (UC)', category: 'PUBG MOBILE', price: 1500 },
    { id: 'pubg_325', name: '325 شدة (UC)', category: 'PUBG MOBILE', price: 6800 },
    { id: 'pubg_660', name: '660 شدة (UC)', category: 'PUBG MOBILE', price: 13500 },
    { id: 'ff_100', name: '100 جوهرة', category: 'Free Fire', price: 1200 },
    { id: 'ff_210', name: '210 جوهرة', category: 'Free Fire', price: 2400 },
    { id: 'ff_530', name: '530 جوهرة', category: 'Free Fire', price: 5800 }
  ];

  // إرسال طلب الشحن إلى قاعدة البيانات
  async function handleOrder(e) {
    e.preventDefault();
    if (!playerId) {
      setMessage('⚠️ الرجاء إدخال معرف اللاعب (ID) أولاً!');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // إدخال الطلب بالأعمدة المتوافقة تماماً مع الجدول المتوفر
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            product_name: selectedProduct.name,
            player_id: playerId,
            price: selectedProduct.price,
            status: 'pending' // الطلب يبدأ قيد الانتظار
          }
        ]);

      if (error) throw error;

      setMessage('✅ تم إرسال طلب الشحن بنجاح! سيقوم الأدمن بالتنفيذ فوراً.');
      setPlayerId('');
      setSelectedProduct(null);
    } catch (err) {
      setMessage(`⚠️ فشل إرسال الطلب: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '5px' }}>
      <h2 style={{ textCenter: 'center', color: '#2BED33', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>🎮 متجر رايزي لشحن الألعاب</h2>
      
      {message && (
        <div style={{ backgroundColor: '#222', border: '1px solid #333', padding: '10px', borderRadius: '6px', marginBottom: '15px', color: '#fff', textAlign: 'center', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* عرض قائمة المنتجات */}
      {!selectedProduct ? (
        <div>
          {['PUBG MOBILE', 'Free Fire'].map((cat) => (
            <div key={cat} style={{ marginBottom: '25px' }}>
              <h3 style={{ color: cat === 'PUBG MOBILE' ? '#2BED33' : '#ffcc00', borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '16px' }}>👑 {cat}</h3>
              {products.filter(p => p.category === cat).map((product) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '6px', marginBottom: '8px', border: '1px solid #2d2d2d' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{product.name}</div>
                    <div style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>{product.price} ج.س</div>
                  </div>
                  <button onClick={() => setSelectedProduct(product)} style={{ backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    شراء ⚡
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        // نافذة طلب الشحن وإدخال الـ ID
        <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #2d2d2d' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '15px' }}>تأكيد طلب: <span style={{ color: '#2BED33' }}>{selectedProduct.name}</span></h3>
          <p style={{ margin: '0 0 15px 0', color: '#aaa', fontSize: '13px' }}>السعر: {selectedProduct.price} جنيه سوداني</p>
          
          <form onSubmit={handleOrder}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#ccc' }}>أدخل معرف اللاعب (ID):</label>
            <input 
              type="text" 
              value={playerId} 
              onChange={(e) => setPlayerId(e.target.value)} 
              placeholder="مثال: 54129883" 
              required
              style={{ width: '100%', padding: '10px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '4px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }}
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'جاري الإرسال...' : 'تأكيد وإرسال الطلب 🚀'}
              </button>
              <button type="button" onClick={() => setSelectedProduct(null)} style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
