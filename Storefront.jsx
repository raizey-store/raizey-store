// Storefront.jsx
// واجهة عرض المنتجات والأقسام الذكية لمتجر RAIZEY STORE
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Storefront({ user, onNavigate, onLogout, isAdmin }) {
  const [exchangeRate, setExchangeRate] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      // 1. جلب سعر صرف الدولار الحالي مقابل الجنيه من السيستم
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('id', 1)
        .single();
      
      if (rateData) setExchangeRate(rateData.rate);

      // 2. جلب الأقسام الفعالة بالمتجر
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('id');
      if (catData) setCategories(catData);

      // 3. جلب المنتجات والعروض المتوفرة بالمخزن
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);
      if (prodData) setProducts(prodData);

    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{textAlign:'center', padding:'50px', color:'#2BED33', backgroundColor:'#141414', minHeight:'100vh'}}>جاري جلب العروض وتحديث الأسعار فورياً...</div>;
  }

  return (
    <div style={styles.container}>
      {/* رأس الصفحة والهيدر */}
      <header style={styles.header}>
        <div style={styles.brandZone}>
          <h1 style={styles.logo}>RAIZEY <span style={{color:'#2BED33'}}>STORE</span></h1>
          <p style={styles.rateBadge}>💲 سعر الدولار اليوم بالسيستم: {exchangeRate.toLocaleString()} ج.س</p>
        </div>
        
        {/* أزرار التحكم والملف الشخصي للعميل */}
        <div style={styles.actionNav}>
          <button onClick={() => onNavigate('wallet')} style={styles.walletBtn}>💼 محفظتي وطلباتي</button>
          {!isAdmin && <button onClick={onLogout} style={styles.logoutBtn}>🚪 تسجيل خروج</button>}
        </div>
      </header>

      {/* شريط الأقسام المتاحة بالمتجر (ببجي، فري فاير، إلخ) */}
      <div style={styles.categoryBar}>
        <button 
          onClick={() => setSelectedCategory('all')} 
          style={selectedCategory === 'all' ? styles.activeCategoryBtn : styles.categoryBtn}
        >
          🔥 الكل
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={selectedCategory === cat.id ? styles.activeCategoryBtn : styles.categoryBtn}
          >
            {cat.name_ar}
          </button>
        ))}
      </div>

      {/* شبكة عرض كروت العروض والمنتجات المتاحة */}
      <main style={styles.grid}>
        {products
          .filter(p => selectedCategory === 'all' || p.category_id === selectedCategory)
          .map(product => {
            const priceInSDG = product.price_usd * exchangeRate;
            return (
              <div key={product.id} style={styles.productCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.categoryLabel}>{product.tag_label || 'شحن فوري'}</span>
                  <h3 style={styles.productTitle}>{product.title}</h3>
                </div>
                
                <p style={styles.description}>{product.description_ar}</p>
                
                <div style={styles.priceContainer}>
                  <div style={styles.priceBox}>
                    <small style={styles.currencyLabel}>بالجنيه السوداني</small>
                    <span style={styles.priceSDG}>{priceInSDG.toLocaleString()} <small>ج.س</small></span>
                  </div>
                  <div style={styles.usdBox}>
                    <span>{product.price_usd} $</span>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate('wallet')} 
                  style={styles.buyBtn}
                >
                  🛒 اطلب شحن العرض الآن
                </button>
              </div>
            );
          })}
      </main>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', direction: 'rtl', paddingBottom: '40px' },
  header: { backgroundColor: '#1e1e1e', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid #2d2d2d' },
  brandZone: { display: 'flex', flexDirection: 'column', gap: '5px' },
  logo: { fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ffffff' },
  rateBadge: { fontSize: '12px', color: '#aaaaaa', margin: 0, backgroundColor: '#141414', padding: '4px 8px', borderRadius: '4px', border: '1px solid #333' },
  actionNav: { display: 'flex', gap: '10px' },
  walletBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  logoutBtn: { backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  categoryBar: { display: 'flex', gap: '10px', padding: '15px 20px', overflowX: 'auto', borderBottom: '1px solid #1e1e1e' },
  categoryBtn: { backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #333', padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '13px' },
  activeCategoryBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px' },
  productCard: { backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid #2d2d2d', justifyContent: 'space-between' },
  cardHeader: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' },
  categoryLabel: { color: '#2BED33', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
  productTitle: { color: '#ffffff', fontSize: '18px', margin: 0, fontWeight: 'bold' },
  description: { color: '#aaaaaa', fontSize: '13px', lineHeight: '1.5', margin: '0 0 15px 0', minHeight: '40px' },
  priceContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141414', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #2d2d2d' },
  priceBox: { display: 'flex', flexDirection: 'column' },
  currencyLabel: { color: '#aaaaaa', fontSize: '10px' },
  priceSDG: { color: '#2BED33', fontSize: '18px', fontWeight: 'bold' },
  usdBox: { color: '#aaaaaa', fontSize: '13px', borderRight: '1px solid #333', paddingRight: '10px' },
  buyBtn: { backgroundColor: '#141414', color: '#2BED33', border: '1px solid #2BED33', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', fontSize: '14px', transition: 'all 0.2s' }
};
