import {
  getDefaultProviderBaseUrl,
  isDefaultProvider
} from '@/app/lib/provider-config'

export type MaynorApiProtocol = 'hybrid' | 'standard'

/**
 * 读取并规范化 MAYNOR 第三方网关配置
 * @param customApiKey 前端传入的自定义 API Key
 * @param customApiUrl 前端传入的自定义 API URL
 * @returns 标准化后的网关配置
 */
export function getMaynorApiConfig(
  customApiKey?: string,
  customApiUrl?: string
): { apiKey: string; apiUrl: string; protocol: MaynorApiProtocol } {
  const useGenericGrsaiConfig = isDefaultProvider('grsai')
  const apiKey = customApiKey || process.env.MAYNOR_API_KEY || process.env.GEMINI_API_KEY || ''
  const apiUrl = normalizeMaynorApiUrl(
    customApiUrl || getPreferredMaynorApiUrl(useGenericGrsaiConfig) || getDefaultProviderBaseUrl()
  )
  const protocol = getMaynorApiProtocol()

  return {
    apiKey: apiKey || getPreferredMaynorApiKey(useGenericGrsaiConfig),
    apiUrl,
    protocol
  }
}

/**
 * 读取 MAYNOR 网关协议模式
 * @returns `hybrid` 表示保留 Gemini 原生图编链路，`standard` 表示统一走标准 chat/completions
 */
export function getMaynorApiProtocol(): MaynorApiProtocol {
  return process.env.MAYNOR_API_PROTOCOL === 'standard' ? 'standard' : 'hybrid'
}

/**
 * 规范化 MAYNOR API 基础地址
 * @param apiUrl 用户填写或环境变量中的地址
 * @returns 去掉末尾斜杠以及已知接口路径后的基础地址
 */
export function normalizeMaynorApiUrl(apiUrl: string): string {
  const trimmedUrl = apiUrl.trim().replace(/\/+$/, '')
  return trimmedUrl
    .replace(/\/v1\/chat\/completions$/i, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/v1\/images\/generations$/i, '')
    .replace(/\/images\/generations$/i, '')
    .replace(/\/v1$/i, '')
}

/**
 * 获取 MAYNOR/Gemini 路由优先使用的 API Key
 * @param useGenericGrsaiConfig 当前是否优先读取 Grsai 通用配置
 * @returns 可用的 API Key
 */
function getPreferredMaynorApiKey(useGenericGrsaiConfig: boolean): string {
  if (useGenericGrsaiConfig) {
    return process.env.IMAGE_API_KEY || process.env.MAYNOR_API_KEY || process.env.GEMINI_API_KEY || ''
  }

  return process.env.MAYNOR_API_KEY || process.env.GEMINI_API_KEY || process.env.IMAGE_API_KEY || ''
}

/**
 * 获取 MAYNOR/Gemini 路由优先使用的 API URL
 * @param useGenericGrsaiConfig 当前是否优先读取 Grsai 通用配置
 * @returns 可用的 API URL
 */
function getPreferredMaynorApiUrl(useGenericGrsaiConfig: boolean): string {
  if (useGenericGrsaiConfig) {
    return process.env.IMAGE_API_URL || process.env.MAYNOR_API_URL || ''
  }

  return process.env.MAYNOR_API_URL || process.env.IMAGE_API_URL || ''
}


/**
 * 判断当前请求是否应当走第三方标准协议
 * @param protocol MAYNOR 协议模式
 * @param hasImage 当前请求是否包含图片输入
 * @returns 是否走标准 chat/completions 协议
 */
export function shouldUseMaynorStandardProtocol(
  protocol: MaynorApiProtocol,
  hasImage: boolean
): boolean {
  if (protocol === 'standard') {
    return true
  }

  return !hasImage
}
