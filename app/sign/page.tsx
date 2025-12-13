'use client'

import { useRef, useEffect, useState } from 'react'
import type SignaturePad from 'signature_pad'
import Footer from '../../components/Footer'
import { toastError } from '@/shared/utils/toast'

export default function SignaturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const SignaturePadClassRef = useRef<typeof SignaturePad | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    const initSignaturePad = async () => {
      if (canvasRef.current && !SignaturePadClassRef.current) {
        const SignaturePadModule = await import('signature_pad')
        SignaturePadClassRef.current = SignaturePadModule.default
        
        const canvas = canvasRef.current
        const signaturePad = new SignaturePadClassRef.current(canvas, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
        })

        signaturePadRef.current = signaturePad

        const resizeCanvas = () => {
          const ratio = Math.max(window.devicePixelRatio || 1, 1)
          canvas.width = canvas.offsetWidth * ratio
          canvas.height = canvas.offsetHeight * ratio
          canvas.getContext('2d')?.scale(ratio, ratio)
          signaturePad.clear()
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
      }
    }

    initSignaturePad()

    return () => {
      window.removeEventListener('resize', () => {})
      signaturePadRef.current?.clear()
    }
  }, [])

  const handleClear = () => {
    signaturePadRef.current?.clear()
  }

  const handleSave = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toastError('يرجى التوقيع أولاً')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const dataURL = signaturePadRef.current.toDataURL('image/png')
      
      const response = await fetch('/api/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: dataURL }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          signaturePadRef.current?.clear()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">التوقيع الإلكتروني</h1>
            <p className="text-gray-600 mb-8">
              يرجى التوقيع في المربع أدناه للموافقة على التقرير الطبي أو خطة العلاج
            </p>

            <div className="mb-6">
              <canvas
                ref={canvasRef}
                className="border-2 border-gray-300 rounded-lg w-full"
                style={{ height: '300px', touchAction: 'none' }}
              />
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                مسح
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التوقيع'}
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg">
                تم حفظ التوقيع بنجاح!
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                حدث خطأ أثناء حفظ التوقيع. يرجى المحاولة مرة أخرى.
              </div>
            )}

            <div className="mt-8 p-4 bg-primary-light rounded-lg">
              <h3 className="font-semibold mb-2 text-primary-dark">معلومات مهمة:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-primary-dark">
                <li>التوقيع الإلكتروني له نفس القوة القانونية للتوقيع اليدوي</li>
                <li>سيتم حفظ التوقيع بشكل آمن ومشفر</li>
                <li>يمكنك مراجعة التوقيع قبل الحفظ</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
