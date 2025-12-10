/**
 * Appointment Confirmation Email Template
 */

export default {
  subject: 'تأكيد موعدك الطبي',
  html: `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">تأكيد الموعد</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">عزيزي/عزيزتي {{patientName}},</p>
        <p style="font-size: 16px;">تم تأكيد موعدك الطبي بنجاح:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>التاريخ:</strong> {{date}}</p>
          <p style="margin: 5px 0;"><strong>الوقت:</strong> {{time}}</p>
          <p style="margin: 5px 0;"><strong>الطبيب:</strong> {{doctorName}}</p>
          {{#if notes}}
          <p style="margin: 5px 0;"><strong>ملاحظات:</strong> {{notes}}</p>
          {{/if}}
        </div>
        <p style="font-size: 16px;">يرجى الحضور قبل الموعد بـ 15 دقيقة.</p>
        <p style="font-size: 16px;">في حالة الحاجة لإلغاء أو تعديل الموعد، يرجى التواصل معنا.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 نظام حِمام. جميع الحقوق محفوظة.</p>
      </div>
    </body>
    </html>
  `,
  text: `
    عزيزي/عزيزتي {{patientName}},
    
    تم تأكيد موعدك الطبي بنجاح:
    
    التاريخ: {{date}}
    الوقت: {{time}}
    الطبيب: {{doctorName}}
    {{#if notes}}
    الملاحظات: {{notes}}
    {{/if}}
    
    يرجى الحضور قبل الموعد بـ 15 دقيقة.
    
    في حالة الحاجة لإلغاء أو تعديل الموعد، يرجى التواصل معنا.
    
    © 2024 نظام حِمام. جميع الحقوق محفوظة.
  `,
}
