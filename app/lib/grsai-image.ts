import { getDefaultProvider } from '@/app/lib/provider-config'

export type UpstreamJsonRequest = {
  body: string
  headers: Record<string, string>
  method: string
  url: string
}

export type UpstreamRequest = {
  body?: string
  headers: Record<string, string>
  method: string
  url: string
}

type GrsaiGenerateOptions = {
  apiKey: string
  apiUrl: string
  imageDataArray?: string[]
  model: string
  prompt: string
  size?: string
}

type GrsaiResultOptions = {
  apiKey: string
  apiUrl: string
  taskId: string
}

export type ParsedGrsaiImageResponse = {
  imageUrl?: string
  mimeType: string
  success: boolean
  status?: string
  taskId?: string
  text?: string
}

export type GrsaiTimingMeta = {
  pollAttempt?: number
  requestId: string
  startedAt: number
}

const GRS_AI_GENERATE_PATH = '/v1/api/generate'
const GRS_AI_RESULT_PATH = '/v1/api/result'
const DEFAULT_NANO_ASPECT_RATIO = '1:1'
const DEFAULT_GPT_IMAGE_ASPECT_RATIO = '1024x1024'
const DEFAULT_IMAGE_SIZE = '1K'
const GRS_AI_HOST_KEYWORDS = ['grsaiapi.com', 'grsai.dakka.com.cn']

/**
 * 判断当前请求是否应使用 Grsai 图片生成协议
 * @param apiUrl 当前 API 基础地址
 * @returns 是否匹配 Grsai 服务商
 */
export function shouldUseGrsaiImageProtocol(apiUrl: string): boolean {
  if (getDefaultProvider() === 'grsai') {
    return true
  }

  return GRS_AI_HOST_KEYWORDS.some((host) => apiUrl.includes(host))
}

/**
 * 构造 Grsai 图片生成请求
 * @param options Grsai 请求配置
 * @returns 可传给 fetch 的上游请求对象
 */
export function buildGrsaiImageRequest(options: GrsaiGenerateOptions): UpstreamJsonRequest {
  const images = (options.imageDataArray || []).map((imageData) => normalizeImageDataUrl(imageData))
  const body = isGptImageModel(options.model)
    ? buildGptImageBody(options.model, options.prompt, images, options.size)
    : buildNanoBananaBody(options.model, options.prompt, images, options.size)

  return {
    url: `${options.apiUrl}${GRS_AI_GENERATE_PATH}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`
    },
    body: JSON.stringify(body)
  }
}

/**
 * 构造 Grsai 异步任务结果查询请求
 * @param options Grsai 查询请求配置
 * @returns 可传给 fetch 的上游查询请求对象
 */
export function buildGrsaiResultRequest(options: GrsaiResultOptions): UpstreamRequest {
  const resultUrl = new URL(`${options.apiUrl}${GRS_AI_RESULT_PATH}`)
  resultUrl.searchParams.set('id', options.taskId)

  return {
    url: resultUrl.toString(),
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.apiKey}`
    }
  }
}

/**
 * 解析 Grsai 图片生成响应
 * @param payload Grsai 返回的 JSON 内容
 * @returns 前端统一可消费的图片结果
 */
export function parseGrsaiImageResponse(payload: unknown): ParsedGrsaiImageResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Grsai 图片接口响应格式无效')
  }

  const response = payload as {
    error?: unknown
    id?: unknown
    message?: unknown
    results?: unknown
    status?: unknown
  }

  const statusText = readString(response.status)
  const taskId = readString(response.id)
  if (statusText === 'failed') {
    throw new Error(normalizeGrsaiErrorMessage(response.error))
  }

  const imageUrl = extractFirstResultUrl(response.results)
  if (imageUrl) {
    return {
      imageUrl,
      mimeType: 'image/png',
      status: statusText || 'succeeded',
      success: true,
      taskId,
      text: typeof response.message === 'string' ? response.message : undefined
    }
  }

  if (taskId) {
    return {
      mimeType: 'image/png',
      status: statusText || 'pending',
      success: false,
      taskId,
      text: '图片正在生成中'
    }
  }

  throw new Error('Grsai 图片接口未返回图片结果')
}

/**
 * 获取 Grsai 解析结果对应的 HTTP 状态码
 * @param result Grsai 统一解析结果
 * @returns 异步任务返回 202，已完成结果返回 200
 */
export function getGrsaiResponseStatus(result: ParsedGrsaiImageResponse): number {
  return result.taskId && !result.imageUrl ? 202 : 200
}

/**
 * 创建 Grsai 计时请求 ID
 * @returns 可用于日志串联的请求 ID
 */
export function createGrsaiRequestId(): string {
  return `grsai-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

/**
 * 记录 Grsai 生成链路耗时
 * @param stage 当前阶段名称
 * @param meta 请求计时元数据
 * @param fields 附加日志字段
 * @returns 无返回值
 */
export function logGrsaiTiming(
  stage: string,
  meta: GrsaiTimingMeta,
  fields: Record<string, unknown> = {}
): void {
  const now = Date.now()
  console.log('[grsai-timing]', {
    ...fields,
    elapsedMs: now - meta.startedAt,
    pollAttempt: meta.pollAttempt,
    requestId: meta.requestId,
    stage,
    timestamp: new Date(now).toISOString()
  })
}

/**
 * 构造 nano-banana 请求体
 * @param model Grsai 实际模型名
 * @param prompt 用户提示词
 * @param images 输入图片数组
 * @param size 页面选择的尺寸
 * @returns Grsai nano-banana 请求体
 */
function buildNanoBananaBody(
  model: string,
  prompt: string,
  images: string[],
  size?: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    aspectRatio: DEFAULT_NANO_ASPECT_RATIO,
    imageSize: normalizeGrsaiImageSize(size),
    replyType: 'json'
  }

  return withOptionalImages(body, images)
}

/**
 * 构造 gpt-image-2 请求体
 * @param model Grsai 实际模型名
 * @param prompt 用户提示词
 * @param images 输入图片数组
 * @param size 页面选择的尺寸
 * @returns Grsai gpt-image-2 请求体
 */
function buildGptImageBody(
  model: string,
  prompt: string,
  images: string[],
  size?: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    aspectRatio: mapGptImageAspectRatio(size),
    replyType: 'json'
  }

  return withOptionalImages(body, images)
}

/**
 * 仅在图生图时附加 images 字段
 * @param body 基础请求体
 * @param images 输入图片数组
 * @returns 符合 Grsai 文档的请求体
 */
function withOptionalImages(
  body: Record<string, unknown>,
  images: string[]
): Record<string, unknown> {
  if (images.length === 0) {
    return body
  }

  return {
    ...body,
    images
  }
}

/**
 * 判断模型是否为 gpt-image 系列
 * @param model 模型名
 * @returns 是否属于 gpt-image 模型
 */
function isGptImageModel(model: string): boolean {
  return model.startsWith('gpt-image-')
}

/**
 * 规范化 Grsai nano-banana 图片尺寸
 * @param size 页面或接口传入的尺寸
 * @returns Grsai 支持的 1K、2K、4K
 */
function normalizeGrsaiImageSize(size?: string): string {
  const normalized = (size || DEFAULT_IMAGE_SIZE).toUpperCase()
  if (normalized === '2K' || normalized === '4K') {
    return normalized
  }

  return DEFAULT_IMAGE_SIZE
}

/**
 * 将页面尺寸映射为 Grsai gpt-image-2 的 aspectRatio
 * @param size 页面或接口传入的尺寸
 * @returns Grsai gpt-image-2 支持的像素尺寸
 */
function mapGptImageAspectRatio(size?: string): string {
  switch ((size || '').toLowerCase()) {
    case '2k':
      return '2048x1360'
    case '1536x1024':
      return '1536x1024'
    case '4k':
      return '3504x2336'
    case '1024x1536':
      return '1024x1536'
    case '1024x1024':
      return DEFAULT_GPT_IMAGE_ASPECT_RATIO
    default:
      return DEFAULT_GPT_IMAGE_ASPECT_RATIO
  }
}

/**
 * 将 base64 图片规范化为 data URL
 * @param imageData 原始 base64 或 data URL
 * @returns 可放入 Grsai images 数组的图片地址
 */
function normalizeImageDataUrl(imageData: string): string {
  if (imageData.startsWith('data:image/')) {
    return imageData
  }

  return `data:image/jpeg;base64,${imageData}`
}

/**
 * 提取 Grsai results 数组中的首个图片 URL
 * @param results Grsai 响应中的 results 字段
 * @returns 首个图片 URL
 */
function extractFirstResultUrl(results: unknown): string | undefined {
  if (!Array.isArray(results)) {
    return undefined
  }

  const firstResult = results[0]
  if (!firstResult || typeof firstResult !== 'object') {
    return undefined
  }

  const { url } = firstResult as { url?: unknown }
  return typeof url === 'string' && url.length > 0 ? url : undefined
}

/**
 * 从未知值中读取非空字符串
 * @param value 待读取的未知值
 * @returns 非空字符串或 undefined
 */
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * 标准化 Grsai 失败错误文案
 * @param error Grsai error 字段
 * @returns 可用于异常的简洁错误信息
 */
function normalizeGrsaiErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  return 'Grsai 图片生成失败'
}
