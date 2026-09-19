import crypto from 'crypto';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// In-memory store for OTP codes during verification
// Key: normalized email address
const otpStore = new Map<string, OtpRecord>();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Clean up expired OTPs periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [email, record] of otpStore.entries()) {
      if (record.expiresAt < now) {
        otpStore.delete(email);
      }
    }
  }, 60 * 1000);
}

/**
 * Generate a dynamic 6-digit random OTP and store it with expiration
 */
export function generateOtp(email: string): { code: string; expiresAt: number } {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Generate cryptographically secure 6-digit code (100000 - 999999)
  const randomNum = crypto.randomInt(100000, 1000000);
  const code = randomNum.toString().padStart(6, '0');
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
    createdAt: now,
  });

  // Log in development console for easy debugging
  console.log(`\n========================================`);
  console.log(`🔐 [ADMIN OTP] Security OTP generated for: ${normalizedEmail}`);
  console.log(`👉 CODE: ${code}`);
  console.log(`⏳ Valid for 10 minutes (expires at: ${new Date(expiresAt).toLocaleTimeString()})`);
  console.log(`========================================\n`);

  return { code, expiresAt };
}

/**
 * Verify the submitted 6-digit OTP for a given email
 */
export function verifyOtp(
  email: string,
  code: string
): { valid: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      valid: false,
      reason: 'No active OTP found for this email. Please request a new code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      reason: 'The security OTP has expired. Please request a new code.',
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      valid: false,
      reason: 'Too many failed verification attempts. Please request a new code.',
    };
  }

  if (record.code !== cleanCode) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      reason: `Incorrect security OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Verification succeeded - remove used OTP
  otpStore.delete(normalizedEmail);
  return { valid: true };
}

/**
 * Clear any active OTP for an email
 */
export function clearOtp(email: string): void {
  otpStore.delete(email.trim().toLowerCase());
}
