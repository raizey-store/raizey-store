// App.jsx - الهيكل الرئيسي المنظم للمتجر
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Storefront from './Storefront';
import Wallet from './Wallet';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('store'); 

  useEffect(() => {
    // جلب جلسة المستخدم عند فتح الموقع
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // الاستماع لأي تغيير في حالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      
      {/* شريط التنقل العلوي البسيط والمنظم */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px', backgroundColor: '#1e1e1e', justifyContent: 'center', borderBottom: '1px solid #2d2d2d' }}>
        <button onClick={() => setCurrentScreen('store')} style={currentScreen === 'store' ? activeStyle : inactiveStyle}>🛒 المتجر</button>
        <button onClick={() => setCurrentScreen('wallet')} style={currentScreen === 'wallet' ? activeStyle : inactiveStyle}>💼 المحفظة</button>
        <button onClick={() => setCurrentScreen('admin')} style={currentScreen === 'admin' ? adminStyle : inactiveStyle}>🎛️ لوحة الإدارة</button>
      </div>

      {/* عرض الواجهات بناءً على التبويب المفتوح */}
      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        {currentScreen === 'store' && <Storefront user={user} />}
        {currentScreen === 'wallet' && <Wallet user={user} />}
        {currentScreen === 'admin' && <AdminDashboard />}
      </div>

    </div>
  );
}

// التنسيقات البرمجية المرتبة للأزرار
const activeStyle = { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const adminStyle = { backgroundColor: '#ffcc00', color: '#141414', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const inactiveStyle = { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };
