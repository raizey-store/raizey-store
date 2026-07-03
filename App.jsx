// App.jsx
// الملف الرئيسي لتوجيه الصفحات والأمان لمتجر RAIZEY STORE
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Storefront from './Storefront';
import Wallet from './Wallet';
import OrderDetails from './OrderDetails';
import AdminDashboard from './AdminDashboard';
import AdminExchangeManager from './AdminExchangeManager';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState('store'); // store | wallet | order | admin | exchange
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من الجلسة الحالية للمستخدم فوراً عند فتح الموقع
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdminStatus(currentUser);
    });

    // الاستماع الفوري لأي تغيير في حالة الحساب (تسجيل دخول / خروج)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdminStatus(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  // دالة الأمان للتحقق من هوية الأدمن ومطابقة البريد الإلكتروني
  const checkAdminStatus = (currentUser) => {
    if (currentUser && currentUser.email === 'czgdfdx42@gmail.com') {
      setIsAdmin(true);
      setCurrentPage('admin'); // توجيه الأدمن تلقائياً للوحة التحكم عند الدخول
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const handleNavigation = (page, data = {}) => {
    setCurrentPage(page);
    if (data.orderId) setSelectedOrderId(data.orderId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('store');
  };

  if (loading) {
    return (
      <div style={{backgroundColor: '#141414', minHeight: '100vh', color: '#2BED33', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif'}}>
        <h2>جاري فتح RAIZEY STORE الآمن...</h2>
      </div>
    );
  }

  // إذا لم يكن العميل مسجلاً، تظهر له صفحة الدخول والحماية أولاً
  if (!user) {
    return <Auth onLoginSuccess={(loggedInUser) => { setUser(loggedInUser); checkAdminStatus(loggedInUser); }} />;
  }

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff' }}>
      {/* شريط الإدارة السري - يظهر لك أنت فقط لحرية التنقل وتحديث أسعار الدولار مقابل الجنيه */}
      {isAdmin && (
        <div style={styles.adminNavbar}>
          <button onClick={() => setCurrentPage('admin')} style={currentPage === 'admin' ? styles.activeAdminBtn : styles.adminBtn}>🎛️ إدارة الطلبات</button>
          <button onClick={() => setCurrentPage('exchange')} style={currentPage === 'exchange' ? styles.activeAdminBtn : styles.adminBtn}>💲 تعديل أسعار الدولار</button>
          <button onClick={() => setCurrentPage('store')} style={currentPage === 'store' ? styles.activeAdminBtn : styles.adminBtn}>🛒 تصفح كزبون</button>
          <button onClick={handleLogout} style={styles.logoutBtn}>🚪 خروج</button>
        </div>
      )}

      {/* عرض الصفحة المطلوبة بناءً على اختيار المستخدم أو الأدمن */}
      {currentPage === 'store' && <Storefront user={user} onNavigate={handleNavigation} onLogout={handleLogout} isAdmin={isAdmin} />}
      {currentPage === 'wallet' && <Wallet user={user} onNavigate={handleNavigation} />}
      {currentPage === 'order' && <OrderDetails user={user} orderId={selectedOrderId} onNavigate={handleNavigation} />}
      {currentPage === 'admin' && isAdmin && <AdminDashboard onNavigate={handleNavigation} />}
      {currentPage === 'exchange' && isAdmin && <AdminExchangeManager />}
    </div>
  );
}

const styles = {
  adminNavbar: {
    backgroundColor: '#1e1e1e',
    padding: '10px',
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    borderBottom: '2px solid #2BED33',
    overflowX: 'auto',
    direction: 'rtl'
  },
  adminBtn: { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333333', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  activeAdminBtn: { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { backgroundColor: '#ff4d4d', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginRight: 'auto' }
};
