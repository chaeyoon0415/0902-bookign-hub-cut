import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export const LoginPage = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        onLoginSuccess();
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        onLoginSuccess();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [onLoginSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">예약 관리 허브</h1>
        <p className="text-center text-gray-600 mb-8">구글 계정으로 로그인해주세요</p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={window.location.origin}
        />

        <p className="text-sm text-gray-500 text-center mt-6">
          관리자 계정으로만 접근이 가능합니다
        </p>
      </div>
    </div>
  );
};
