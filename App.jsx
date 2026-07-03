// App.jsx - النسخة الكاملة المدمج بها نظام تسجيل الدخول والتحقق
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Storefront from './Storefront';
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

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' }}>
      
      {/* شريط الإدارة والتنقل العلوي الرئيسي */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: '#1e1e1e', justifyContent: 'center', borderBottom: '1px solid #2d2d2d', flexWrap: 'wrap' }}>
        <button onClick={() => setCurrentScreen('store')} style={currentScreen === 'store' ? activeStyle : inactiveStyle}>🛒 المتجر</button>
        <button onClick={() => setCurrentScreen('wallet')} style={currentScreen === 'wallet' ? activeStyle : inactiveStyle}>💼 المحفظة</button>
        <button onClick={() => setCurrentScreen('admin')} style={currentScreen === 'admin' ? adminStyle : inactiveStyle}>🎛️ لوحة الإدارة</button>
        {user && (
          <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🚪 خروج</button>
        )}
      </div>

      <div style={{ padding: '15px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* إذا لم يكن المستخدم مسجلاً للدخول، تظهر له شاشة الحساب أولاً لحمايته وحمايتك */}
        {!user ? (
          <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #2d2d2d' }}>
            <h3 style={{ textCenter: 'center', margin: '0 0 15px 0', color: '#2BED33', textAlign: 'center' }}>🔐 بوابتك الآمنة لمتجر رايزي</h3>
            
            {authMessage && (
              <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
                {authMessage}
              </div>
            )}

            <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="email" 
                placeholder="البريد الإلكتروني" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
              <input 
                type="password" 
                placeholder="كلمة المرور" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
              />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button onClick={handleLogin} disabled={loading} style={{ flex: 1, backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
                <button onClick={handleSignUp} disabled={loading} style={{ flex: 1, backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                  إنشاء حساب جديد
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* توجيه المستخدم للشاشات بمجرد التحقق التام من هويته كأدمن أو عميل */
          <div>
            {currentScreen === 'store' && <Storefront user={user} />}
            {currentScreen === 'wallet' && <Wallet user={user} />}
            {currentScreen === 'admin' && <AdminDashboard user={user} />}
          </div>
        )}
      </div>

    </div>
  );
}

const activeStyle = { backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const adminStyle = { backgroundColor: '#ffcc00', color: '#141414', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const inactiveStyle = { backgroundColor: '#141414', color: '#ffffff', border: '1px solid #333', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };
const inputStyle = { width: '100%', padding: '10px', backgroundColor: '#141414', border: '1px solid #333', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' };
