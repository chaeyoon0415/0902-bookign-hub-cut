import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim())
  .filter((e: string) => e);

export const useAdminAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setSession(session);
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser?.email) {
          setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser?.email) {
        setIsAdmin(ADMIN_EMAILS.includes(currentUser.email));
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  return { session, user, isAdmin, isLoading, logout };
};

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">예약 관리 허브</h1>
          <p className="text-center text-gray-600 mb-8">로그인이 필요합니다</p>
          <button
            onClick={() => {
              const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
              window.location.href = url;
            }}
            className="block w-full bg-blue-600 text-white py-3 rounded font-medium text-center hover:bg-blue-700"
          >
            구글로 로그인
          </button>
          <p className="text-sm text-gray-500 text-center mt-6">
            관리자 계정으로만 접근이 가능합니다
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-4 text-red-600">접근 거부</h1>
          <p className="text-center text-gray-700 mb-4">
            죄송합니다. 이메일 <strong>{session.user?.email}</strong>은 관리자로 등록되지 않았습니다.
          </p>
          <p className="text-center text-gray-600 mb-6">
            관리자에게 문의하여 계정을 등록해주세요.
          </p>
          <button
            onClick={async () => await supabase.auth.signOut()}
            className="block w-full bg-gray-600 text-white py-3 rounded font-medium hover:bg-gray-700"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
