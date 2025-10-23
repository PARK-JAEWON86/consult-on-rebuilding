import { User } from '@/lib/auth'

/**
 * 사용자의 프로필 사진 URL을 가져옵니다.
 * 전문가로 승인된 경우 전문가 프로필 사진을 우선 반환합니다.
 *
 * @param user - 사용자 객체
 * @returns 프로필 사진 URL 또는 undefined
 */
export function getUserAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined

  // 전문가 프로필 사진 우선 (전문가로 승인된 경우)
  if (user.expert?.avatarUrl) {
    return user.expert.avatarUrl
  }

  // 일반 사용자 프로필 사진
  return user.avatarUrl
}

/**
 * 사용자의 표시 이름을 가져옵니다.
 * 전문가로 승인된 경우 전문가 이름을 우선 반환합니다.
 *
 * @param user - 사용자 객체
 * @returns 표시 이름
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return '사용자'

  // 전문가 이름 우선 (전문가로 승인된 경우)
  if (user.expert?.name) {
    return user.expert.name
  }

  // 일반 사용자 이름
  return user.name || user.email || '사용자'
}

/**
 * 프로필 사진이 없을 때 표시할 이니셜을 가져옵니다.
 *
 * @param user - 사용자 객체
 * @returns 이니셜 (한 글자)
 */
export function getUserInitial(user: User | null | undefined): string {
  if (!user) return 'U'

  const displayName = getUserDisplayName(user)
  return displayName.charAt(0).toUpperCase()
}
