/**
 * Welcome Email Template
 */

const welcomeTemplate = {
  subject: 'مرحباً بك في نظام حِمام',
  html: `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">مرحباً {{name}}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">شكراً لانضمامك إلى نظام حِمام لإدارة المراكز الطبية.</p>
        <p style="font-size: 16px;">يمكنك الآن الوصول إلى حسابك باستخدام:</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>البريد الإلكتروني:</strong> {{email}}</p>
        </div>
        <p style="font-size: 16px;">نتمنى لك تجربة ممتعة معنا!</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{loginUrl}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">تسجيل الدخول</a>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 نظام حِمام. جميع الحقوق محفوظة.</p>
      </div>
    </body>
    </html>
  `,
  text: `
    مرحباً {{name}}
    
    شكراً لانضمامك إلى نظام حِمام لإدارة المراكز الطبية.
    
    يمكنك الآن الوصول إلى حسابك باستخدام:
    البريد الإلكتروني: {{email}}
    
    تسجيل الدخول: {{loginUrl}}
    
    نتمنى لك تجربة ممتعة معنا!
    
    © 2024 نظام حِمام. جميع الحقوق محفوظة.
  `,
}

export default welcomeTemplate
