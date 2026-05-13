import { getChatfireBaseUrl } from '@/app/lib/chatfire'

/**
 * OpenAI 图像请求配置
 * @param apiKey OpenAI 或兼容网关的 API Key
 * @param apiUrl OpenAI 或兼容网关的基础 URL
 * @param model 使用的图片模型名称
 * @returns 规范化后的配置对象
 */
export function getOpenAiImageConfig(
  apiKey?: string,
  apiUrl?: string,
  model?: string
): { apiKey: string; apiUrl: string; model: string } {
  return {
    apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    apiUrl: sanitizeApiUrl(apiUrl || process.env.OPENAI_API_URL || getChatfireBaseUrl()),
    model: model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
  }
}

/**
 * 规范化 API 基础地址
 * @param apiUrl 用户输入或环境变量中的 API URL
 * @returns 去掉末尾斜杠后的 URL
 */
export function sanitizeApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, '')
}

/**
 * 从 OpenAI 图片接口响应中提取图片数据
 * @param payload OpenAI 图片接口响应对象
 * @returns 提取后的图片数据、MIME 类型和补充文本
 */
export function parseOpenAiImageResponse(payload: unknown): {
  imageData?: string
  imageUrl?: string
  mimeType: string
  text?: string
} {
  const data = extractDataArray(payload)
  const firstItem = data[0]

  if (!firstItem) {
    throw new Error('OpenAI 图片接口未返回 data[0]')
  }

  if (typeof firstItem.b64_json === 'string' && firstItem.b64_json.length > 0) {
    return {
      imageData: firstItem.b64_json,
      mimeType: 'image/png',
      text: typeof firstItem.revised_prompt === 'string' ? firstItem.revised_prompt : undefined
    }
  }

  if (typeof firstItem.url === 'string' && firstItem.url.length > 0) {
    return {
      imageUrl: firstItem.url,
      mimeType: 'image/png',
      text: typeof firstItem.revised_prompt === 'string' ? firstItem.revised_prompt : undefined
    }
  }

  throw new Error('OpenAI 图片接口返回缺少 b64_json 或 url')
}

type OpenAiImageResponseItem = {
  b64_json?: string
  revised_prompt?: string
  url?: string
}

/**
 * 验证并读取 OpenAI 图片接口的 data 数组
 * @param payload 待解析的响应内容
 * @returns 响应中的 data 数组
 */
function extractDataArray(payload: unknown): OpenAiImageResponseItem[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new Error('OpenAI 图片接口响应格式无效')
  }

  const { data } = payload as { data?: unknown }
  if (!Array.isArray(data)) {
    throw new Error('OpenAI 图片接口响应缺少 data 数组')
  }

  return data as OpenAiImageResponseItem[]
}
