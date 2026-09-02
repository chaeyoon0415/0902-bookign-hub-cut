import { useState, useEffect } from 'react'
import { BookingForm } from './components/BookingForm'
import { BookingTable } from './components/BookingTable'
import { StatCards } from './components/StatCards'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

type TabType = 'dashboard' | 'list' | 'add' | 'status' | 'location'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'list', label: '예약목록' },
    { id: 'add', label: '예약추가' },
    { id: 'status', label: '상태관리' },
    { id: 'location', label: '위치확인' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">예약 관리 허브</h1>
            <div className="flex items-center gap-4">
              {userEmail ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">로그인 계정</p>
                    <p className="font-medium text-gray-800">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  구글 로그인
                </button>
              )}
            </div>
          </div>

          {/* 대시보드 탭 */}
          {activeTab === 'dashboard' && (
            <div>
              <StatCards refreshKey={refreshKey} />
            </div>
          )}

          {/* 예약목록 탭 */}
          {activeTab === 'list' && (
            <div>
              <BookingTable refreshKey={refreshKey} />
            </div>
          )}

          {/* 예약추가 탭 */}
          {activeTab === 'add' && (
            <div>
              <BookingForm onSuccess={handleFormSuccess} />
            </div>
          )}

          {/* 상태관리 탭 */}
          {activeTab === 'status' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">상태 관리</h2>
              <p className="text-gray-600 mb-4">예약의 상태를 pending(대기) 또는 confirmed(확정)으로 변경하세요</p>
              <BookingTable refreshKey={refreshKey} />
            </div>
          )}

          {/* 위치확인 탭 */}
          {activeTab === 'location' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">위치 확인</h2>
              <p className="text-gray-600 mb-4">주소를 클릭하면 Google Maps에서 위치를 확인할 수 있습니다</p>
              <BookingTable refreshKey={refreshKey} />
            </div>
          )}
        </div>
      </div>

      {/* 하단 탭 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-center gap-8 p-4 max-w-6xl mx-auto w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
