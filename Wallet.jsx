// Wallet.jsx - واجهة المحفظة السودانية المبسطة والمرتبة
import React, { useState } from 'react';

export default function Wallet({ user }) {
  const [depositAmount, setDepositAmount] = useState('');
  const [message, setMessage] = useState('');

  function handleDepositSubmit(e) {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) {
      setMessage('⚠️ الرجاء إدخال مبلغ صحيح!');
      return;
    }

    // رسالة توجيهية مبسطة للعميل لإتمام عملية التحويل يدوياً
    setMessage(`✅ تم تسجيل طلب إيداع بقيمة ${depositAmount} ج.س. يرجى التحويل عبر تطبيق (بنكك) إلى الحساب المعتمد وإرسال الإشعار للأدمن لتفعيل الرصيد فوراُ.`);
    setDepositAmount('');
  }

  return (
    <div style={{ padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #2d2d2d' }}>
      <h2 style={{ color: '#2BED33', margin: '0 0 15px 0', fontSize: '18px', textAlign: 'center' }}>💼 المحفظة السودانية الرقمية</h2>
      
      {/* عرض الرصيد الافتراضي المبسط */}
      <div style={{ backgroundColor: '#141414', padding: '15px', borderRadius: '6px', textAlign: 'center', marginBottom: '20px', border: '1px solid #333' }}>
        <p style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '13px' }}>رصيدك الحالي المتاح</p>
        <h3 style={{ margin: 0, color: '#2BED33', fontSize: '24px' }}>0 <span style={{ fontSize: '14px' }}>ج.س</span></h3>
      </div>

      {message && (
        <div style={{ backgroundColor: '#222', border: '1px solid #333', padding: '10px', borderRadius: '6px', marginBottom: '15px', color: '#fff', fontSize: '13px', lineHeight: '1.5' }}>
          {message}
        </div>
      )}

      {/* نموذج طلب شحن المحفظة */}
      <form onSubmit={handleDepositSubmit} style={{ backgroundColor: '#141414', padding: '12px', borderRadius: '6px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>➕ طلب شحن رصيد المحفظة</h4>
        
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#ccc' }}>المبلغ المراد شحنه (بالجنيه السوداني):</label>
        <input 
          type="number" 
          value={depositAmount} 
          onChange={(e) => setDepositAmount(e.target.value)} 
          placeholder="مثال: 5000" 
          required
          style={{ width: '100%', padding: '8px', backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '4px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }}
        />

        <button type="submit" style={{ width: '100%', backgroundColor: '#2BED33', color: '#141414', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          إرسال طلب الإيداع 💸
        </button>
      </form>

      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffcc0011', border: '1px solid #ffcc00', borderRadius: '6px' }}>
        <p style={{ margin: 0, color: '#ffcc00', fontSize: '11px', lineHeight: '1.4' }}>💡 تنبيه: لشحن محفظتك، يمكنك تحويل المبلغ يدوياً للأدمن عبر وسائل الدفع المحلية المتاحة في السودان وسيتم تحديث رصيدك مباشرة.</p>
      </div>
    </div>
  );
}
