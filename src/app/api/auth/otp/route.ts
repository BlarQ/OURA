import { NextResponse } from 'next/server';
import { generateOtp, verifyOtp } from '@/lib/services/otpService';
import { createClient } from '@/lib/supabase/server';

const MASTER_ADMIN_EMAIL = (
  process.env.ADMIN_MASTER_EMAIL || 'Collinsogunlala@gmail.com'
).trim().toLowerCase();

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}${'•'.repeat(Math.min(name.length - 2, 8))}${name[name.length - 1]}@${domain}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, code } = body;

    // Use the single configured Master Admin Email
    const targetEmail = MASTER_ADMIN_EMAIL;

    // ACTION: SEND OTP
    if (action === 'send') {
      const { code: generatedCode, expiresAt } = generateOtp(targetEmail);

      // Trigger Supabase Auth OTP delivery directly to the Master Admin Email
      let supabaseError: string | null = null;
      try {
        const supabase = await createClient();
        const { error: sbError } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo:
              process.env.NEXT_PUBLIC_APP_URL ||
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://oura-one.vercel.app'),
          },
        });
        if (sbError) {
          console.error('Supabase signInWithOtp error:', sbError);
          supabaseError = sbError.message;
        }
      } catch (sbError: any) {
        console.warn('Supabase signInWithOtp notice (proceeding with OTP service):', sbError);
        supabaseError = sbError?.message || null;
      }

      if (supabaseError) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to dispatch security OTP: ${supabaseError}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Security OTP has been dispatched to Master Admin`,
        maskedEmail: maskEmail(targetEmail),
        fullEmail: targetEmail,
        expiresAt,
      });
    }

    // ACTION: VERIFY OTP
    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json(
          { success: false, error: '6-digit OTP code is required.' },
          { status: 400 }
        );
      }

      const cleanCode = code.trim().replace(/\D/g, '');
      if (cleanCode.length !== 6) {
        return NextResponse.json(
          { success: false, error: 'OTP code must be exactly 6 digits.' },
          { status: 400 }
        );
      }

      // 1. First check Supabase Auth OTP (from the email received by Master Admin)
      let sbErrorMessage: string | null = null;
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: cleanCode,
          type: 'email',
        });

        if (!error && (data?.user || data?.session)) {
          const token = `otp_authorized_${Date.now()}_${encodeURIComponent(targetEmail)}`;
          return NextResponse.json({
            success: true,
            verified: true,
            token,
            email: targetEmail,
          });
        }

        if (error) {
          console.warn('Supabase verifyOtp returned error:', error.message);
          sbErrorMessage = error.message;
        }
      } catch (sbVerifyError: any) {
        console.warn('Supabase verifyOtp check failed:', sbVerifyError);
        sbErrorMessage = sbVerifyError?.message || null;
      }

      // 2. Fallback check: in-memory OTP store (for development)
      const localResult = verifyOtp(targetEmail, cleanCode);
      if (localResult.valid) {
        const token = `otp_authorized_${Date.now()}_${encodeURIComponent(targetEmail)}`;
        return NextResponse.json({
          success: true,
          verified: true,
          token,
          email: targetEmail,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error:
            sbErrorMessage ||
            localResult.reason ||
            'Invalid or expired security OTP. Please check your inbox and try again.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action specified.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error in /api/auth/otp:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error processing OTP request.' },
      { status: 500 }
    );
  }
}
