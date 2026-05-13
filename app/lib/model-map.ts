import { getDefaultProvider, type DefaultProvider } from '@/app/lib/provider-config'

type AppModel = 'gemini-3-pro-image-preview' | 'gemini' | 'gemini-2.5-flash-image'

const PROVIDER_MODEL_MAP: Readonly<Record<DefaultProvider, Readonly<Record<AppModel, string>>>> = {
  chatfire: {
    'gemini-3-pro-image-preview': 'gemini-3-pro-image-preview',
    'gemini': 'gemini-2.5-flash-image',
    'gemini-2.5-flash-image': 'gemini-2.5-flash-image'
  },
  grsai: {
    'gemini-3-pro-image-preview': 'nano-banana-pro',
    'gemini': 'nano-banana-2',
    'gemini-2.5-flash-image': 'nano-banana-2'
  }
}

/**
 * 将页面模型名解析为当前服务商可识别的真实模型名
 * @param requestedModel 页面传入或环境变量中的模型名
 * @returns 供应商实际使用的模型名
 */
export function resolveProviderModel(requestedModel?: string): string {
  const fallbackModel = process.env.GEMINI_MODEL || process.env.IMAGE_MODEL || 'gemini-2.5-flash-image'
  const modelName = requestedModel || fallbackModel
  const provider = getDefaultProvider()
  const providerMap = PROVIDER_MODEL_MAP[provider]

  if (isKnownAppModel(modelName)) {
    return providerMap[modelName]
  }

  return modelName
}

/**
 * 判断模型名是否为前端内置的抽象模型标识
 * @param modelName 待判断的模型名
 * @returns 是否属于内置抽象模型名
 */
function isKnownAppModel(modelName: string): modelName is AppModel {
  return modelName in PROVIDER_MODEL_MAP.chatfire
}
