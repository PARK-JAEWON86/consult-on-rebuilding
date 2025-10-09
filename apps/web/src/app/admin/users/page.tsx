'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Search, Shield, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface User {
  id: number
  email: string
  name: string
  roles: string | string[]
  avatarUrl: string | null
  createdAt: string
  emailVerifiedAt: string | null
  phoneVerified: boolean
  expert: {
    id: number
    displayId: string
    isActive: boolean
  } | null
}

interface UsersResponse {
  data: User[]
  total: number
  page: number
  totalPages: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadUsers()
  }, [roleFilter, page])

  async function loadUsers() {
    try {
      setIsLoading(true)
      const response = await api.get<UsersResponse>(
        '/admin/users',
        {
          params: {
            page,
            limit: 20,
            search: searchQuery || undefined,
            role: roleFilter || undefined,
          },
        }
      )

      setUsers(response.data?.data || [])
      setTotalPages(response.data?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  function getRoles(user: User): string[] {
    if (Array.isArray(user.roles)) return user.roles
    if (typeof user.roles === 'string') {
      try {
        return JSON.parse(user.roles)
      } catch {
        return [user.roles]
      }
    }
    return []
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">사용자 관리</h1>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 역할 필터 */}
          <div className="flex gap-2">
            {['', 'USER', 'EXPERT', 'ADMIN'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setRoleFilter(role)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role === '' ? '전체' : role}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이름, 이메일 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* 사용자 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">사용자가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    인증
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전문가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const roles = getRoles(user)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {user.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.emailVerifiedAt ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm text-gray-900">
                            {user.phoneVerified ? '전화' : '이메일'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.expert ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.expert.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.expert.isActive ? '활성' : '비활성'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}` as any)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                          상세보기
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    page === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
