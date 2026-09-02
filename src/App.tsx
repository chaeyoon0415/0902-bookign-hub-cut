import { useState, useEffect } from 'react'
import { BookingForm } from './components/BookingForm'
import { BookingTable } from './components/BookingTable'
import { StatCards } from './components/StatCards'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  SlidersHorizontal,
  MapPin,
  LogOut,
  LogIn,
  CalendarDays
} from 'lucide-react'

type TabType = 'dashboard' | 'list' | 'add' | 'status' | 'location'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [, setSession] = useState<Session | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session)
      setSession(session)
      setUserEmail(session?.user?.email || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      setSession(session)
      setUserEmail(session?.user?.email || null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserEmail(null)
  }

  const handleFormSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('list')
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'list', label: '예약목록', icon: ClipboardList },
    { id: 'add', label: '예약추가', icon: PlusCircle },
    { id: 'status', label: '상태관리', icon: SlidersHorizontal },
    { id: 'location', label: '위치확인', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-28 font-sans antialiased">
      {/* 상단 네비게이션 바 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">예약 관리 허브</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">SaaS 통합 예약 및 주소 관리 플랫폼</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userEmail ? (
              <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">로그인 계정</p>
                  <p className="font-semibold text-sm text-slate-900">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer shadow-blue-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>구글 로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">현황 대시보드</h2>
              <p className="text-xs text-slate-500">예약 지표 및 실시간 현황 요약입니다</p>
            </div>
            <StatCards refreshKey={refreshKey} />

            {/* 빠른 작업 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">빠른 작업</h3>
                <p className="text-sm text-slate-500">새로운 예약을 등록해보세요.</p>
              </div>
              <button
                onClick={() => setActiveTab('add')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-blue-500/20 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>＋ 예약 추가하기</span>
              </button>
            </div>
          </div>
        )}

        {/* 예약목록 탭 */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">전체 예약 목록</h2>
                <p className="text-xs text-slate-500">등록된 모든 예약 목록을 확인하세요</p>
              </div>
            </div>
            <BookingTable refreshKey={refreshKey} />
          </div>
        )}

        {/* 예약추가 탭 */}
        {activeTab === 'add' && (
          <div className="max-w-3xl mx-auto">
            <BookingForm onSuccess={handleFormSuccess} />
          </div>
        )}

        {/* 상태관리 탭 */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">상태 관리</h2>
              <p className="text-xs text-slate-500">예약의 상태 배지를 클릭하여 대기(pending) 또는 확정(confirmed)으로 변경하세요</p>
            </div>
            <BookingTable refreshKey={refreshKey} />
          </div>
        )}

        {/* 위치확인 탭 */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">위치 확인</h2>
              <p className="text-xs text-slate-500">목록의 주소 아이콘을 클릭하면 Google Maps 지도가 열립니다</p>
            </div>
            <BookingTable refreshKey={refreshKey} />
          </div>
        )}
      </main>

      {/* 하단 5개 탭 고정 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 shadow-xl z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-around px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 transition-all ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400'}`} />
                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

