'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Eye, Search, EyeOff, Trash2 } from 'lucide-react'

interface Post {
  id: number
  title: string
  content: string
  postType: string
  status: string
  isPinned: boolean
  views: number
  likes: number
  comments: number
  createdAt: string
  user: {
    id: number
    name: string
    email: string
  }
  category: {
    id: number
    nameKo: string
  }
}

interface PostsResponse {
  data: Post[]
  total: number
  page: number
  totalPages: number
}

export default function AdminContentPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('published')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPosts()
  }, [statusFilter, page])

  async function loadPosts() {
    try {
      setIsLoading(true)
      const response = await axios.get<PostsResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/content/posts`,
        {
          params: {
            page,
            limit: 20,
            search: searchQuery || undefined,
            status: statusFilter || undefined,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )

      setPosts(response.data.data)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadPosts()
  }

  async function handleStatusChange(postId: number, newStatus: string) {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/content/posts/${postId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )
      loadPosts()
    } catch (error) {
      console.error('Failed to update post status:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  async function handleDelete(postId: number) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/content/posts/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      )
      loadPosts()
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const getPostTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: '일반',
      consultation_review: '상담 후기',
      consultation_request: '상담 요청',
      expert_intro: '전문가 소개',
    }
    return types[type] || type
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">컨텐츠 관리</h1>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 상태 필터 */}
          <div className="flex gap-2">
            {['published', 'hidden', 'deleted', ''].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === '' ? '전체' :
                 status === 'published' ? '게시됨' :
                 status === 'hidden' ? '숨김' : '삭제됨'}
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
                placeholder="제목, 내용 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>
        </div>
      </div>

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">게시글이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    게시글
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {post.isPinned && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                              고정
                            </span>
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {post.title}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {post.category.nameKo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{post.user.name}</div>
                        <div className="text-sm text-gray-500">{post.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getPostTypeLabel(post.postType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        조회 {post.views} · 좋아요 {post.likes} · 댓글 {post.comments}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === 'published' && (
                          <button
                            onClick={() => handleStatusChange(post.id, 'hidden')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="숨기기"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        {post.status === 'hidden' && (
                          <button
                            onClick={() => handleStatusChange(post.id, 'published')}
                            className="text-green-600 hover:text-green-900"
                            title="게시"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
