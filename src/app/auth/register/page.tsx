'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Fuel, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', otp: '' });
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!form.name.trim()) {
        setError('Please enter your name');
        setIsLoading(false);
        return;
      }

      if (form.phone.length < 11) {
        setError('Please enter a valid 11-digit phone number');
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: form.phone,
        options: {
          channel: 'sms',
          data: {
            display_name: form.name.trim(),
          },
        },
      });

      if (otpError) {
        setError(otpError.message || 'Failed to send OTP. Please try again.');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (form.otp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: form.phone,
        token: form.otp,
        type: 'sms',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            display_name: form.name.trim(),
            trust_score: 50,
          });

        if (updateError) {
          console.error('Failed to update user profile:', updateError);
        }
      }

      router.push('/main/map');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setForm({ ...form, otp: '' });
    setError('');

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: form.phone,
        options: {
          channel: 'sms',
          data: { display_name: form.name.trim() },
        },
      });

      if (otpError) {
        setError(otpError.message || 'Failed to resend OTP.');
        return;
      }

      setResendCooldown(30);
      setError('');
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full relative overflow-hidden">
      {/* Mobile Dynamic Background (hidden on desktop) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
        <div className="absolute top-1/4 -left-1/4 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-float" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] bg-accent/15 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
      </div>

      {/* Left Panel - Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-surface-elevated border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-20">
        {/* Generated Futuristic Image Backdrop */}
        <div className="absolute inset-0">
          <img src="/auth-bg.png" alt="Fuel Rush Intelligent Map" className="w-full h-full object-cover opacity-60 mix-blend-screen grayscale-[30%]" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background/50 to-transparent" />
        </div>
        
        {/* Dynamic Desktop Meshes overlaid on image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-80">
          <div className="absolute top-1/4 -left-1/4 w-[60rem] h-[60rem] bg-primary/20 rounded-full blur-[150px] mix-blend-screen animate-float" />
          <div className="absolute bottom-0 -right-1/4 w-[60rem] h-[60rem] bg-accent/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow-orange">
            <Fuel className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-display font-extrabold text-white tracking-tight">Fuel Rush</span>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-display font-extrabold text-white leading-tight mb-6">
            Join the <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Intelligence Network.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed border-l-2 border-primary pl-4">
            Create your account to start reporting fuel queues, finding active stations, and managing your ration quota.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <div className="animate-slide-up w-full max-w-sm flex flex-col items-center">

        {/* Mobile-only Logo Container */}
        <div className="flex lg:hidden flex-col items-center gap-4 mb-10 w-full animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-[24px] flex items-center justify-center shadow-glow-orange hover:scale-105 transition-transform duration-300">
            <Fuel className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-secondary tracking-tight">
              Fuel Rush
            </h1>
            <p className="text-sm text-primary font-medium tracking-wide uppercase mt-1">Bangladesh Intelligence</p>
          </div>
        </div>

        <Card className="w-full relative backdrop-blur-2xl bg-surface/60 lg:bg-surface/30 border border-white/5 shadow-2xl overflow-hidden group">
          {/* Subtle inner highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-text-muted hover:text-white mb-6 transition-colors group/link w-max">
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover/link:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        {step === 'form' ? (
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1.5 tracking-tight">Create Account</h2>
            <p className="text-sm text-text-secondary mb-8">
              Join the fuel intelligence network.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1.5 tracking-tight">Verify Identity</h2>
            <p className="text-sm text-text-secondary mb-8">
              We&apos;ve sent a secure 6-digit code to <span className="text-white font-medium">{form.phone}</span>.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-btn text-sm text-danger">
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+8801XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              icon={<Phone className="w-4 h-4" />}
            />
            <Button type="submit" className="w-full shadow-glow-orange" loading={isLoading}>
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <Input
              type="text"
              label="Verification Code"
              placeholder="Enter 6-digit code"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
            />
            <Button type="submit" className="w-full shadow-glow-orange" loading={isLoading}>
              Verify & Create Account
            </Button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Use a different number
              </button>
              {resendCooldown > 0 ? (
                <span className="text-sm text-text-muted">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-primary hover:text-primary-light transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}
      </Card>
      <p className="mt-8 text-xs text-text-muted text-center max-w-xs animate-fade-in opacity-70">
        By continuing, you agree to Fuel Rush&apos;s <a href="#" className="underline hover:text-white transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>
      </p>
      
        </div>
      </div>
    </div>
  );
}
