/**
 * Password Reset Email Template
 */

export default {
  subject: 'إعادة تعيين كلمة المرور',
  html: `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">إعادة تعيين كلمة المرور</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">عزيزي/عزيزتي {{name}},</p>
        <p style="font-size: 16px;">لقد طلبت إعادة تعيين كلمة المرور لحسابك.</p>
        <p style="font-size: 16px;">انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">إعادة تعيين كلمة المرور</a>
        </div>
        <p style="font-size: 14px; color: #666;">أو انسخ الرابط التالي إلى متصفحك:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">{{resetUrl}}</p>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">ملاحظة: هذا الرابط صالح لمدة {{expiryHours}} ساعة فقط.</p>
        <p style="font-size: 14px; color: #666;">إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 نظام حِمام. جميع الحقوق محفوظة.</p>
      </div>
    </body>
    </html>
  `,
  text: `
    عزيزي/عزيزتي {{name}},
    
    لقد طلبت إعادة تعيين كلمة المرور لحسابك.
    
    انقر على الرابط التالي لإعادة تعيين كلمة المرور:
    {{resetUrl}}
    
    ملاحظة: هذا الرابط صالح لمدة {{expiryHours}} ساعة فقط.
    
    إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.
    
    © 2024 نظام حِمام. جميع الحقوق محفوظة.
  `,
}
