// App.jsx - النسخة الكاملة المحدثة والمؤمنة بالكامل لمتجر رايزي ستور
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Store from './Store'; // تم تصحيح الاسم هنا ليتوافق مع ملف المتجر
import Wallet from './Wallet';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('store'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // دالة تسجيل الدخول (للعميل والأدمن معاً)
  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setAuthMessage('');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthMessage('✅ تم تسجيل الدخول بنجاح!');
    } catch (err) {
      setAuthMessage(`⚠️ خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // دالة إنشاء حساب جديد للعملاء الجدد
  async function handleSignUp(e) {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      setAuthMessage('');
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setAuthMessage('✅ تم إنشاء الحساب! يمكنك تسجيل الدخول الآن.');
    } catch (err) {
      setAuthMessage(`⚠️ خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // دالة تسجيل الخروج
  async function handleLogout() {
    await supabase.auth.signOut();
    setCurrentScreen('store');
  }

  // التحقق الفوري ما إذا كان المستخدم الحالي هو المدير محمد الصادق لحماية لوحة الإدارة
  const isAdmin = user && user.email === 'mohamedalsadiq@gmail.com'; 

  // دالة مخصصة للتنقل الآمن بين الصفحات
  const handleNavigate = (screenName) => {
    setCurrentScreen(screenName);
  };

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif', direction: 'rtl' }}>
      
      {/* شريط الإدارة والتنقل العلوي الرئيسي */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: '#1e1e1e', justifyContent: 'center', borderBottom: '1px solid #2d2d2d', flexWrap: 'wrap' }}>
        <button onClick={() => handleNavigate('store')} style={currentScreen === 'store' ? activeStyle : inactiveStyle}>🛒 المتجر</button>
        <button onClick={() => handleNavigate('wallet')} style={currentScreen === 'wallet' ? activeStyle : inactiveStyle}>💼 المحفظة بالجنيه</button>
        
        {/* تظهر لوحة التحكم فقط إذا كان الحساب المسجل هو حسابك كأدمن */}
        {isAdmin && (
          <button onClick={() => handleNavigate('admin')} style={currentScreen === 'admin' ? adminStyle : inactiveStyle}>🎛️ لوحة الإدارة</button>
        )}
        
        {user && (
          <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🚪 خروج</button>
        )}
      </div>

      <div style={{ padding: '15px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* إذا لم يكن المستخدم مسجلاً للدخول، تظهر له شاشة الحساب أولاً لحمايته وحمايتك */}
        {!user ? (
          <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #2d2d2d', maxWidth: '450px', margin: '40px auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2BED33', textAlign: 'center', fontSize: '18px' }}>🔐 بوابتك الآمنة لمتجر رايزي ستور</h3>
            
            {authMessage && (
              <div style={{ backgroundColor: '#141414', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', border: '1px solid #333' }}>
                {authMessage}
              </div>
            )}

            <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '5px' }}>البريد الإلكتروني:</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '5px' }}>كلمة المرور:</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" onClick={handleLogin} disabled={loading} style={{ flex: 1, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
                <button type="button" onClick={handleSignUp} disabled={loading} style={{ flex: 1, backgroundColor: '#333', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  إنشاء حساب جديد
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* توجيه المستخدم للشاشات بمجرد التحقق التام من هويته */
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {currentScreen === 'store' && <Store user={user} onNavigate={handleNavigate} />}
            {currentScreen === 'wallet' && <Wallet user={user} onNavigate={handleNavigate} />}
            {currentScreen === 'admin' && isAdmin && <AdminDashboard onNavigate={handleNavigate} />}
          </div>
        )}
      </div>

    </div>
  );
}

const activeStyle = { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' };
const adminStyle = { backgroundColor: '#ffcc00', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const inactiveStyle = { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' };
const inputStyle = { width: '100%', padding: '11px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box', textAlign: 'left', outline: 'none' };
