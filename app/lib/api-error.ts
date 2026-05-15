type ApiErrorCode = 'AUTH' | 'CONFIG' | 'NETWORK' | 'RATE_LIMIT' | 'TIMEOUT' | 'UNAVAILABLE' | 'INVALID_INPUT' | 'UNKNOWN'

type UpstreamErrorShape = {
  error?: {
    code?: string
    message?: string
    type?: string
  } | string
  raw?: string
}

const RAW_ERROR_PREVIEW_LIMIT = 500

/**
 * 创建统一的 API 错误响应
 * @param code 错误分类代码
 * @param status HTTP 状态码
 * @returns 标准化错误响应对象
 */
export function createApiErrorResponse(
  code: ApiErrorCode,
  status: number,
  detail?: string
): ResponsePayload {
  return {
    error: mapErrorCodeToMessage(code),
    code,
    detail,
    status
  }
}

/**
 * 从上游返回内容推断错误分类
 * @param payload 上游接口返回体
 * @param status 上游 HTTP 状态码
 * @returns 归一化后的错误分类
 */
export function detectApiErrorCode(payload: unknown, status: number): ApiErrorCode {
  if (status === 400) {
    return 'INVALID_INPUT'
  }
  if (status === 401 || status === 403) {
    return 'AUTH'
  }
  if (status === 408 || status === 524) {
    return 'TIMEOUT'
  }
  if (status === 429) {
    return 'RATE_LIMIT'
  }
  if (status >= 500) {
    return 'UNAVAILABLE'
  }

  const errorPayload = payload as UpstreamErrorShape
  const message = typeof errorPayload?.error === 'string'
    ? errorPayload.error
    : errorPayload?.error?.message || errorPayload?.raw || ''

  const normalizedMessage = message.toLowerCase()
  if (normalizedMessage.includes('invalid token') || normalizedMessage.includes('incorrect api key')) {
    return 'AUTH'
  }
  if (normalizedMessage.includes('timeout')) {
    return 'TIMEOUT'
  }
  if (normalizedMessage.includes('quota') || normalizedMessage.includes('rate limit')) {
    return 'RATE_LIMIT'
  }
  if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch failed')) {
    return 'NETWORK'
  }

  return 'UNKNOWN'
}

/**
 * 提取可安全展示的上游错误摘要
 * @param payload 上游接口返回体
 * @returns 错误摘要字符串
 */
export function extractApiErrorDetail(payload: unknown): string | undefined {
  const errorPayload = payload as UpstreamErrorShape
  if (typeof errorPayload?.error === 'string') {
    return errorPayload.error
  }

  const parts = [
    errorPayload?.error?.code,
    errorPayload?.error?.type,
    errorPayload?.error?.message,
    errorPayload?.raw
  ].filter((part): part is string => typeof part === 'string' && part.length > 0)

  return parts.length > 0 ? parts.join(' | ') : undefined
}

/**
 * 读取 API 响应内容，JSON 解析失败时保留原始文本摘要
 * @param response fetch 返回的响应对象
 * @returns JSON 对象或 raw 文本包装对象
 */
export async function readApiResponsePayload(response: Response): Promise<unknown> {
  const rawText = await response.text()
  if (!rawText) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    return { raw: rawText.slice(0, RAW_ERROR_PREVIEW_LIMIT) }
  }
}

/**
 * 从异常对象推断错误分类
 * @param error 捕获到的异常
 * @returns 归一化后的错误分类
 */
export function detectApiErrorCodeFromException(error: unknown): ApiErrorCode {
  if (!(error instanceof Error)) {
    return 'UNKNOWN'
  }

  const message = error.message.toLowerCase()
  if (message.includes('api配置缺失') || message.includes('未配置')) {
    return 'CONFIG'
  }
  if (message.includes('timeout')) {
    return 'TIMEOUT'
  }
  if (message.includes('fetch')) {
    return 'NETWORK'
  }
  if (message.includes('generate failed') || message.includes('图片生成失败')) {
    return 'UNAVAILABLE'
  }

  return 'UNKNOWN'
}

/**
 * 将错误分类映射为面向用户的简洁文案
 * @param code 错误分类代码
 * @returns 用户可读的提示文案
 */
export function mapErrorCodeToMessage(code: ApiErrorCode): string {
  switch (code) {
    case 'AUTH':
      return 'API 密钥无效或已过期，请检查配置后重试'
    case 'CONFIG':
      return 'API 配置缺失，请先配置密钥'
    case 'NETWORK':
      return '连接图片服务失败，请稍后重试'
    case 'RATE_LIMIT':
      return '请求过于频繁，请稍后再试'
    case 'TIMEOUT':
      return '生成超时，请简化描述后重试'
    case 'UNAVAILABLE':
      return '图片服务暂时不可用，请稍后重试'
    case 'INVALID_INPUT':
      return '请求参数无效，请检查输入内容'
    default:
      return '生成失败，请稍后重试'
  }
}

type ResponsePayload = {
  code: ApiErrorCode
  detail?: string
  error: string
  status: number
}
