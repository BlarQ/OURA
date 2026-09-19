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
      try {
        const supabase = await createClient();
        await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            shouldCreateUser: true,
          },
        });
      } catch (sbError) {
        console.warn('Supabase signInWithOtp notice (proceeding with OTP service):', sbError);
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

      // 1. Check in-memory OTP store
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

      // 2. Dual check: verify with Supabase Auth OTP if local failed
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: cleanCode,
          type: 'email',
        });

        if (!error && data?.user) {
          const token = `otp_authorized_${Date.now()}_${encodeURIComponent(targetEmail)}`;
          return NextResponse.json({
            success: true,
            verified: true,
            token,
            email: targetEmail,
          });
        }
      } catch (sbVerifyError) {
        console.warn('Supabase verifyOtp check:', sbVerifyError);
      }

      return NextResponse.json(
        {
          success: false,
          error: localResult.reason || 'Invalid or expired security OTP. Please check your inbox and try again.',
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
