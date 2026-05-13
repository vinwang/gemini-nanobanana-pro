// 高级积分管理系统
interface UserCredits {
  email: string
  credits: number
  isUnlimited: boolean
  lastUpdated: string
  planId?: string
  userLevel: 'free' | 'pro' | 'unlimited'
}

// 使用内存存储（生产环境建议使用数据库）
const creditsStore = new Map<string, UserCredits>()

// 匿名用户免费使用次数 - 设为无限使用
const ANONYMOUS_FREE_USES = -1 // -1 表示无限使用

// 默认新用户积分（注册用户）
const DEFAULT_FREE_CREDITS = 5

// 用户等级配置
const USER_LEVELS = {
  free: {
    maxImages: 1,
    apiKey: process.env.GEMINI_FREE_API_KEY || process.env.GEMINI_API_KEY,
    priority: 'low'
  },
  pro: {
    maxImages: 4,
    apiKey: process.env.GEMINI_PRO_API_KEY || process.env.GEMINI_API_KEY,
    priority: 'high'
  },
  unlimited: {
    maxImages: 10,
    apiKey: process.env.GEMINI_PRO_API_KEY || process.env.GEMINI_API_KEY,
    priority: 'highest'
  }
}

export function getUserCredits(email: string): UserCredits {
  if (!creditsStore.has(email)) {
    const newUser: UserCredits = {
      email,
      credits: DEFAULT_FREE_CREDITS,
      isUnlimited: false,
      lastUpdated: new Date().toISOString(),
      userLevel: 'free'
    }
    creditsStore.set(email, newUser)
  }
  return creditsStore.get(email)!
}

export function addUserCredits(email: string, creditsToAdd: number, planId?: string): UserCredits {
  const user = getUserCredits(email)

  if (planId === 'unlimited') {
    user.isUnlimited = true
    user.credits = -1 // -1 表示无限积分
    user.userLevel = 'unlimited'
  } else if (planId === 'pro') {
    user.userLevel = 'pro'
    user.credits += creditsToAdd
  } else if (planId === 'starter') {
    user.userLevel = 'pro' // 体验版用户也可以使用付费功能
    user.credits += creditsToAdd
  } else {
    user.credits += creditsToAdd
  }

  user.lastUpdated = new Date().toISOString()
  user.planId = planId
  creditsStore.set(email, user)

  return user
}

// 获取用户等级信息
export function getUserLevel(email: string): 'free' | 'pro' | 'unlimited' {
  const user = getUserCredits(email)
  return user.userLevel
}

// 获取用户可用的最大生成数量
export function getUserMaxImages(email: string): number {
  const level = getUserLevel(email)
  return USER_LEVELS[level].maxImages
}

// 获取用户使用的API key
export function getUserApiKey(email: string): string {
  const level = getUserLevel(email)
  return USER_LEVELS[level].apiKey || process.env.MAYNOR_API_KEY || process.env.GEMINI_API_KEY || ''
}

// 获取或创建匿名用户
export function getAnonymousUser(sessionId: string): UserCredits {
  const anonymousEmail = `anonymous_${sessionId}`
  if (!creditsStore.has(anonymousEmail)) {
    const anonymousUser: UserCredits = {
      email: anonymousEmail,
      credits: ANONYMOUS_FREE_USES,
      isUnlimited: false,
      lastUpdated: new Date().toISOString(),
      userLevel: 'free'
    }
    creditsStore.set(anonymousEmail, anonymousUser)
  }
  return creditsStore.get(anonymousEmail)!
}

// 检查用户是否可以生成指定数量的图片
export function canGenerateImages(userIdentifier: string, count: number = 1): boolean {
  let user: UserCredits

  // 对于匿名用户，使用专门的处理逻辑
  if (userIdentifier.startsWith('anonymous_')) {
    const sessionId = userIdentifier.replace('anonymous_', '')
    user = getAnonymousUser(sessionId)
  } else {
    user = getUserCredits(userIdentifier)
  }

  const maxImages = getUserMaxImages(userIdentifier)

  // 检查是否有足够的积分
  if (!user.isUnlimited && user.credits < count) {
    return false
  }

  // 检查是否超过最大生成数量限制
  if (count > maxImages) {
    return false
  }

  return true
}

// 检查是否为匿名用户
export function isAnonymousUser(email: string): boolean {
  return email.startsWith('anonymous_')
}

// 获取匿名用户的剩余免费次数
export function getAnonymousRemainingUses(sessionId: string): number {
  const user = getAnonymousUser(sessionId)
  return user.credits === -1 ? 999 : user.credits // -1表示无限，显示为999
}

// 生成浏览器会话ID
export function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function deductUserCredits(email: string, creditsToDeduct: number): { success: boolean; remainingCredits: number } {
  let user: UserCredits

  // 对于匿名用户，使用专门的处理逻辑
  if (email.startsWith('anonymous_')) {
    const sessionId = email.replace('anonymous_', '')
    user = getAnonymousUser(sessionId)
    // 匿名用户无限使用，不扣除积分
    if (user.credits === -1) {
      return { success: true, remainingCredits: 999 }
    }
  } else {
    user = getUserCredits(email)
  }

  if (user.isUnlimited) {
    return { success: true, remainingCredits: -1 }
  }

  if (user.credits >= creditsToDeduct) {
    user.credits -= creditsToDeduct
    user.lastUpdated = new Date().toISOString()
    creditsStore.set(email, user)
    return { success: true, remainingCredits: user.credits }
  }

  return { success: false, remainingCredits: user.credits }
}

export function canUseService(email: string): boolean {
  let user: UserCredits

  // 对于匿名用户，使用专门的处理逻辑
  if (email.startsWith('anonymous_')) {
    const sessionId = email.replace('anonymous_', '')
    user = getAnonymousUser(sessionId)
    // 匿名用户无限使用，始终可以访问
    if (user.credits === -1) {
      return true
    }
  } else {
    user = getUserCredits(email)
  }

  return user.isUnlimited || user.credits > 0
}
