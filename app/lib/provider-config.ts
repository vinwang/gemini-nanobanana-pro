export type DefaultProvider = 'chatfire' | 'grsai'

const PROVIDER_BASE_URLS: Readonly<Record<DefaultProvider, string>> = {
  chatfire: 'https://api.chatfire.site',
  grsai: 'https://grsaiapi.com'
}

/**
 * 读取默认服务商标识
 * @returns 当前默认服务商
 */
export function getDefaultProvider(): DefaultProvider {
  return process.env.DEFAULT_IMAGE_PROVIDER === 'chatfire' ? 'chatfire' : 'grsai'
}

/**
 * 判断当前默认服务商是否为指定 provider
 * @param provider 待判断的服务商标识
 * @returns 是否匹配当前默认服务商
 */
export function isDefaultProvider(provider: DefaultProvider): boolean {
  return getDefaultProvider() === provider
}

/**
 * 获取默认服务商对应的基础地址
 * @returns 当前默认服务商的 API 基础地址
 */
export function getDefaultProviderBaseUrl(): string {
  return PROVIDER_BASE_URLS[getDefaultProvider()]
}

/**
 * 根据服务商名称获取固定基础地址
 * @param provider 服务商标识
 * @returns 对应服务商基础地址
 */
export function getProviderBaseUrl(provider: DefaultProvider): string {
  return PROVIDER_BASE_URLS[provider]
}
