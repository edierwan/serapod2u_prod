'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { 
  canAcknowledgeDocument, 
  getDocumentTypeLabel,
  type Document 
} from '@/lib/document-permissions'

interface AcknowledgeButtonProps {
  document: Document
  userProfile: {
    id: string
    organization_id: string
    organizations: {
      org_type_code: string
    }
    roles: {
      role_level: number
    }
  }
  onSuccess: () => void
  requiresPaymentProof?: boolean
  paymentProofUrl?: string | null
}

export default function AcknowledgeButton({
  document,
  userProfile,
  onSuccess,
  requiresPaymentProof = false,
  paymentProofUrl = null
}: AcknowledgeButtonProps) {
  const [acknowledging, setAcknowledging] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Check if user can acknowledge this document
  const canAcknowledge = canAcknowledgeDocument(document, {
    organizationId: userProfile.organization_id,
    orgTypeCode: userProfile.organizations.org_type_code,
    roleLevel: userProfile.roles.role_level
  })

  // Don't show button if user can't acknowledge or document is not pending
  if (!canAcknowledge || document.status !== 'pending') {
    return null
  }

  async function handleAcknowledge() {
    try {
      // Pre-check for invoice acknowledgment with payment proof requirement
      if (document.doc_type === 'INVOICE' && requiresPaymentProof && !paymentProofUrl) {
        toast({
          title: 'Payment Proof Required',
          description: 'Please upload payment proof above before you can acknowledge this invoice.',
          variant: 'destructive'
        })
        return
      }

      setAcknowledging(true)

      let result
      let successMessage = ''

      switch (document.doc_type) {
        case 'PO':
          result = await supabase.rpc('po_acknowledge', {
            p_document_id: document.id
          })
          successMessage = 'Purchase Order acknowledged. Invoice has been automatically generated.'
          break

        case 'INVOICE':
          result = await supabase.rpc('invoice_acknowledge', {
            p_document_id: document.id,
            p_payment_proof_url: paymentProofUrl
          })
          successMessage = 'Invoice acknowledged. Payment document has been created.'
          break

        case 'PAYMENT':
          result = await supabase.rpc('payment_acknowledge', {
            p_document_id: document.id
          })
          successMessage = 'Payment acknowledged. Receipt has been generated and order is now closed.'
          break

        default:
          throw new Error('Invalid document type for acknowledgment')
      }

      if (result.error) throw result.error

      toast({
        title: `${getDocumentTypeLabel(document.doc_type)} Acknowledged`,
        description: successMessage
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error acknowledging document:', error)
      
      // Handle payment proof error specifically
      if (error.message && error.message.includes('Payment proof is required')) {
        toast({
          title: 'Payment Proof Required',
          description: 'Please upload payment proof above before acknowledging this invoice.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to acknowledge document',
          variant: 'destructive'
        })
      }
    } finally {
      setAcknowledging(false)
    }
  }

  // Determine if button should be disabled
  const isDisabled = acknowledging || 
    (document.doc_type === 'INVOICE' && requiresPaymentProof && !paymentProofUrl)

  return (
    <div className="space-y-3">
      {/* Show warning if payment proof is required but not uploaded */}
      {document.doc_type === 'INVOICE' && requiresPaymentProof && !paymentProofUrl && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                Payment Proof Required
              </h4>
              <p className="text-sm text-amber-800">
                Please upload your payment proof document above before you can acknowledge this invoice.
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleAcknowledge}
        disabled={isDisabled}
        className="w-full"
        size="lg"
      >
        {acknowledging ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Acknowledging...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Acknowledge {getDocumentTypeLabel(document.doc_type)}
          </>
        )}
      </Button>

      {isDisabled && !acknowledging && document.doc_type === 'INVOICE' && requiresPaymentProof && !paymentProofUrl && (
        <p className="text-xs text-center text-gray-500">
          Button will be enabled after uploading payment proof
        </p>
      )}
    </div>
  )
}
