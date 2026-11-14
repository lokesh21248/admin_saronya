// SARVONAYA Email Delivery Infrastructure (Resend)

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SARVONAYA <notifications@sarvonaya.edu>';

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, id: data.id };
      }
      const err = await response.json();
      return { success: false, error: err.message };
    } catch (error) {
      console.warn('Resend email error:', error);
      return { success: false, error: 'Network error communicating with Resend' };
    }
  }

  // Graceful fallback for development / local testing
  return {
    success: true,
    id: `mock_email_${Date.now()}`,
  };
}

