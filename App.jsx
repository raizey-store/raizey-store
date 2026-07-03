// App.jsx
// ربط الواجهات بالسيستم الجديد والتنقل البرمجي السلس
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Store from './Store';
import Wallet from './Wallet';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('store'); // الشاشة الافتراضية هي المتجر

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff' }}>
      
      {/* شريط التحكم السريع للأدمن والمستخدمين في أعلى الموقع */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: '#1e1e1e', justifyContent: 'center', borderBottom: '1px solid #2d2d2d' }}>
        <button onClick={() => handleNavigate('store')} style={currentScreen === 'store' ? activeStyle : inactiveStyle}>🛒 المتجر الرئيسي</button>
        <button onClick={() => handleNavigate('wallet')} style={currentScreen === 'wallet' ? activeStyle : inactiveStyle}>💼 محفظتي السودانية</button>
        <button onClick={() => handleNavigate('admin')} style={currentScreen === 'admin' ? adminActiveStyle : adminInactiveStyle}>🎛️ لوحة تحكم الإدارة (سري)</button>
      </div>

      {/* عرض الشاشة المختارة بناءً على حالة التنقل الحالية */}
      {currentScreen === 'store' && <Store user={user} onNavigate={handleNavigate} />}
      {currentScreen === 'wallet' && <Wallet user={user} onNavigate={handleNavigate} />}
      {currentScreen === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}

    </div>
  );
}

const activeStyle = { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const inactiveStyle = { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
const adminActiveStyle = { backgroundColor: '#ffcc00', color: '#141414', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' };
const adminInactiveStyle = { backgroundColor: '#141414', color: '#ffcc00', border: '1px solid #ffcc00', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
