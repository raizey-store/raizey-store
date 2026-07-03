// Auth.jsx
// صفحة الحماية وتأمين الحسابات لمتجر RAIZEY STORE
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // دالة المعالجة لحماية المدخلات وتأمين الحسابات
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // تنظيف وفحص مبدئي للمدخلات قبل إرسالها
    if (!email.includes('@') || password.length < 6) {
      setErrorMessage('الرجاء إدخال بريد إلكتروني صحيح وكلمة مرور لا تقل عن 6 أحرف.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // عملية إنشاء حساب جديد آمن ومجاني في قاعدة البيانات
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim().toLowerCase(),
            full_name: fullName.trim(),
          }
        }
      });
      
      if (error) {
        setErrorMessage(error.message);
      } else {
        alert('تم تسجيل حسابك بنجاح! يمكنك الآن تبديل الخيار لتسجيل الدخول مباشرة وتفعيل محفظتك.');
        setIsSignUp(false);
      }
    } else {
      // تسجيل الدخول واستخراج توكن الحماية الآمن للعميل
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage('بيانات الدخول غير صحيحة، أو الحساب غير مسجل بالسيستم.');
      } else if (data?.user) {
        onLoginSuccess(data.user);
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>RAIZEY <span style={{ color: '#2BED33' }}>STORE</span></h1>
        <p style={styles.subtitle}>{isSignUp ? 'إنشاء حساب جديد مشفر' : 'تسجيل الدخول للمتجر الآمن'}</p>
        
        {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
        
        <form onSubmit={handleAuth} style={styles.form}>
          {isSignUp && (
            <>
              <input 
                type="text" 
                placeholder="اسم المستخدم (بالإنجليزي بدون فواصل)" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                style={styles.input}
              />
              <input 
                type="text" 
                placeholder="الاسم الكامل باللغة العربية" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                style={styles.input}
              />
            </>
          )}
          
          <input 
            type="email" 
            placeholder="البريد الإلكتروني للعميل" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={styles.input}
          />
          
          <input 
            type="password" 
            placeholder="كلمة المرور السرية" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.input}
          />
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'جاري التحقق وتأمين المدخلات...' : isSignUp ? 'تسجيل حساب جديد مجاناً' : 'دخول آمن للمتجر'}
          </button>
        </form>
        
        <div style={styles.switchText} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك هنا' : 'ليس لديك حساب؟ اضغط هنا لإنشاء حساب جديد في ثوانٍ'}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#141414',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'sans-serif',
    direction: 'rtl'
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    border: '1px solid #2d2d2d'
  },
  logo: {
    color: '#ffffff',
    fontSize: '28px',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: '14px',
    margin: '0 0 25px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    backgroundColor: '#141414',
    color: '#ffffff',
    border: '1px solid #333333',
    padding: '12px 15px',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    textAlign: 'right'
  },
  button: {
    backgroundColor: '#2BED33',
    color: '#141414',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  switchText: {
    color: '#2BED33',
    marginTop: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    color: '#ff4d4d',
    border: '1px solid #ff4d4d',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px',
    textAlign: 'right'
  }
};
