import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Store from './Store';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('store'); // store | admin
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // التحقق من حالة التوثيق الحالية وحفظ الجلسة
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user || null);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#2BED33', fontSize: '18px', fontWeight: 'bold' }}>
        🚀 جاري تحميل RAIZEY STORE وتأمين الاتصال...
      </div>
    );
  }

  // إذا لم يسجل الدخول، يتم نقله تلقائياً لواجهة المصادقة الأنيقة
  if (!sessionUser) {
    return <Auth onLoginSuccess={(user) => setSessionUser(user)} />;
  }

  return (
    <div>
      {currentPage === 'store' ? (
        <Store user={sessionUser} onNavigate={(page) => setCurrentPage(page)} />
      ) : (
        <AdminDashboard onNavigate={(page) => setCurrentPage(page)} />
      )}
    </div>
  );
}
