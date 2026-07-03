import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paymentPin, setPaymentPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp && (paymentPin.length !== 4 || isNaN(paymentPin))) {
      setError('يجب أن يتكون رمز دفع PIN من 4 أرقام فقط.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (signUpError) throw signUpError;

        if (authData?.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: email.trim().toLowerCase(),
            balance_sdg: 0,
            is_admin: false,
            payment_pin: paymentPin.trim()
          });
          alert('تم إنشاء حسابك بنجاح! جاري التوجيه...');
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
        <div style={styles.logoArea}>
          <div style={styles.logoHex}>R</div>
          <h1 style={styles.logoText}>RAIZEY <span style={{ color: '#2BED33' }}>STORE</span></h1>
        </div>
        <p style={styles.subtitle}>{isSignUp ? 'أنشئ حسابك الجديد بلمح البصر' : 'سجل دخولك إلى منصتك الاحترافية'}</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleAuth} style={styles.form}>
          <input 
            type="email" placeholder="البريد الإلكتروني" value={email} 
            onChange={(e) => setEmail(e.target.value)} required style={styles.input} 
          />
          <input 
            type="password" placeholder="كلمة المرور" value={password} 
            onChange={(e) => setPassword(e.target.value)} required style={styles.input} 
          />
          {isSignUp && (
            <input 
              type="text" maxLength={4} placeholder="عيّن رمز دفع PIN الخاص بك (4 أرقام)" value={paymentPin} 
              onChange={(e) => setPaymentPin(e.target.value)} required style={styles.input} 
            />
          )}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'جاري التحقق للاتصال المباشر...' : isSignUp ? 'تأكيد إنشاء الحساب' : 'تسجيل الدخول الآمن'}
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
  container: { backgroundColor: '#070708', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: '"Cairo", system-ui, sans-serif', direction: 'rtl' },
  card: { backgroundColor: '#0f0f12', padding: '40px', borderRadius: '24px', border: '1px solid #1e1e24', width: '100%', maxWidth: '420px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)', textAlign: 'center' },
  logoArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  logoHex: { width: '50px', height: '50px', backgroundColor: '#2BED33', color: '#000', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold', transform: 'rotate(45deg)', margin: '10px 0' },
  logoText: { color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0, transform: 'rotate(0deg)' },
  subtitle: { color: '#626278', fontSize: '14px', margin: '0 0 32px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { backgroundColor: '#16161c', color: '#fff', border: '1px solid #252530', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', outline: 'none', textAlign: 'right', transition: 'all 0.3s' },
  submitBtn: { backgroundColor: '#2BED33', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px', transition: 'all 0.2s' },
  switchText: { color: '#2BED33', marginTop: '26px', fontSize: '13px', cursor: 'pointer', opacity: 0.8 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', textAlign: 'right' }
};
