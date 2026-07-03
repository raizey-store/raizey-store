import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { username: username.trim().toLowerCase(), full_name: fullName.trim() } }
        });
        if (signUpError) throw signUpError;

        if (authData?.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email.trim().toLowerCase(),
            username: username.trim().toLowerCase(),
            full_name: fullName.trim(),
            balance_sdg: 0,
            is_admin: false
          });
          alert('🟢 تم إنشاء حسابك بنجاح! جاري توجيهك...');
          onLoginSuccess(authData.user);
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (signInError) throw signInError;
        if (signInData?.user) onLoginSuccess(signInData.user);
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء المعالجة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🎮</span>
          <h1 style={styles.logoText}>RAIZEY <span style={{ color: '#2BED33' }}>STORE</span></h1>
        </div>
        <p style={styles.subtitle}>{isSignUp ? 'أنشئ حساباً مشفراً للبدء بالشحن' : 'سجل دخولك إلى بوابتك الآمنة'}</p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleAuth} style={styles.form}>
          {isSignUp && (
            <>
              <input 
                type="text" placeholder="اسم المستخدم (بالإنجليزي)" value={username} 
                onChange={(e) => setUsername(e.target.value)} required style={styles.input} 
              />
              <input 
                type="text" placeholder="الاسم الكامل باللغة العربية" value={fullName} 
                onChange={(e) => setFullName(e.target.value)} required style={styles.input} 
              />
            </>
          )}
          <input 
            type="email" placeholder="البريد الإلكتروني" value={email} 
            onChange={(e) => setEmail(e.target.value)} required style={styles.input} 
          />
          <input 
            type="password" placeholder="كلمة المرور (6 أحرف فأكثر)" value={password} 
            onChange={(e) => setPassword(e.target.value)} required style={styles.input} 
          />

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'جاري المعالجة والتحقق...' : isSignUp ? 'إنشاء حساب فوري' : 'تسجيل الدخول الآمن'}
          </button>
        </form>

        <p onClick={() => { setIsSignUp(!isSignUp); setError(''); }} style={styles.switchText}>
          {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك هنا' : 'ليس لديك حساب؟ اضغط هنا لإنشاء حساب جديد'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif', direction: 'rtl' },
  card: { backgroundColor: '#141414', padding: '40px', borderRadius: '16px', border: '1px solid #222', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)', textAlign: 'center' },
  logoContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' },
  logoIcon: { fontSize: '28px' },
  logoText: { color: '#fff', fontSize: '26px', fontWeight: '8px', margin: 0, letterSpacing: '1px' },
  subtitle: { color: '#666', fontSize: '14px', margin: '0 0 30px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { backgroundColor: '#1d1d1d', color: '#fff', border: '1px solid #333', padding: '14px 16px', borderRadius: '10px', fontSize: '14px', outline: 'none', textAlign: 'right', transition: 'border-color 0.2s' },
  submitBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'transform 0.1s' },
  switchText: { color: '#2BED33', marginTop: '24px', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' },
  errorBox: { backgroundColor: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'right' }
};
