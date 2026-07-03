// Wallet.jsx - واجهة المحفظة السودانية الرقمية المربوطة بالكامل بقاعدة البيانات
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Wallet({ user, onNavigate }) {
  const [balanceSdg, setBalanceSdg] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [transNumber, setTransNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserBalance();
  }, [user]);

  // جلب رصيد المستخدم الحقيقي من جدول profiles
  async function fetchUserBalance() {
    if (!user) return;
    try {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('balance_sdg')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setBalanceSdg(Number(data.balance_sdg) || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  }

  // إرسال طلب الشحن الفعلي للأدمن برقم العملية
  async function handleDepositSubmit(e) {
    e.preventDefault();
    if (!user) return;
    if (Number(depositAmount) <= 0 || !transNumber.trim()) {
      alert('الرجاء إدخال مبلغ صحيح ورقم عملية تحويل بنكك.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.from('orders').insert({
        user_id: user.id,
        user_email: user.email,
        total_sdg: Number(depositAmount),
        transaction_number: transNumber.trim(),
        order_type: 'wallet_deposit', // نوع الطلب: شحن محفظة
        status: 'pending'
      });

      if (error) throw error;

      setMessage('✅ تم إرسال طلب شحن المحفظة بنجاح للأدمن محمد الصادق! سيتم التحقق من تطبيق بنكك وإضافة الرصيد لحسابك فوراً.');
      setDepositAmount('');
      setTransNumber('');
    } catch (err) {
      setMessage(`⚠️ فشل إرسال الطلب: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #2d2d2d', direction: 'rtl' }}>
      <h2 style={{ color: '#2BED33', margin: '0 0 15px 0', fontSize: '18px', textAlign: 'center' }}>💼 المحفظة السودانية الرقمية</h2>
      
      {/* عرض الرصيد الحقيقي المتاح */}
      <div style={{ backgroundColor: '#141414', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', border: '1px solid #333' }}>
        <p style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '13px' }}>رصيدك الحالي المتاح</p>
        <h3 style={{ margin: 0, color: '#2BED33', fontSize: '26px' }}>
          {fetchLoading ? '...' : balanceSdg.toLocaleString()} <span style={{ fontSize: '14px' }}>ج.س</span>
        </h3>
      </div>

      {/* تعليمات دفع بنكك الثابتة للعميل */}
      <div style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d2d', marginBottom: '15px', fontSize: '13px', lineHeight: '1.6' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#ffcc00' }}>📥 خطوات الشحن عبر تطبيق بنكك:</h4>
        <p style={{ margin: '4px 0' }}>1. حوّل المبلغ الذي تريده إلى حساب المتجر المعتمد:</p>
        <p style={{ margin: '4px 0', color: '#2BED33', fontSize: '14px', fontFamily: 'monospace', padding: '4px', backgroundColor: '#1e1e1e', borderRadius: '4px', display: 'inline-block' }}>
          رقم الحساب: 1234567 (ضع رقم حسابك الفعلي هنا)
        </p>
        <p style={{ margin: '4px 0' }}>بإسم: <strong>محمد الصادق</strong></p>
        <p style={{ margin: '4px 0' }}>2. بعد إتمام التحويل بنجاح، املأ النموذج بالأسفل برقم العملية بدقة.</p>
      </div>

      {message && (
        <div style={{ backgroundColor: '#222', border: '1px solid #2bed33', padding: '10px', borderRadius: '6px', marginBottom: '15px', color: '#fff', fontSize: '13px', lineHeight: '1.5' }}>
          {message}
        </div>
      )}

      {/* نموذج طلب شحن المحفظة الفعلي للـ Database */}
      <form onSubmit={handleDepositSubmit} style={{ backgroundColor: '#141414', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>➕ إرسال إشعار تحويل جديد للأدمن</h4>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#ccc' }}>المبلغ الذي قمت بتحويله (ج.س):</label>
          <input 
            type="number" 
            value={depositAmount} 
            onChange={(e) => setDepositAmount(e.target.value)} 
            placeholder="مثال: 15000" 
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#ccc' }}>رقم عملية التحويل (الرقم المرجعي ببنكك):</label>
          <input 
            type="text" 
            value={transNumber} 
            onChange={(e) => setTransNumber(e.target.value)} 
            placeholder="أدخل رقم العملية المكون من أرقام هنا..." 
            required
            style={inputStyle}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          {loading ? 'جاري إرسال الطلب للأدمن...' : 'تأكيد وإرسال طلب الشحن 💸'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box', outline: 'none' };
