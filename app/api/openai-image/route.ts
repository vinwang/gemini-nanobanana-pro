import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException,
  extractApiErrorDetail,
  readApiResponsePayload
} from '@/app/lib/api-error'
import {
  buildGrsaiImageRequest,
  getGrsaiResponseStatus,
  parseGrsaiImageResponse,
  shouldUseGrsaiImageProtocol
} from '@/app/lib/grsai-image'
import { getOpenAiImageConfig, parseOpenAiImageResponse } from '@/app/lib/openai-image'

export const runtime = 'nodejs'
export const maxDuration = 60

type OpenAiImageRequest = {
  prompt?: string
  imageData?: string
  imageDataArray?: string[]
  apiKey?: string
  apiUrl?: string
  model?: string
  size?: string
}

/**
 * 处理 OpenAI 图片生成与编辑请求
 * @param request Next.js 请求对象
 * @returns 统一格式的图像生成结果
 */
async function openAiImageHandler(request: NextRequest) {
  try {
    const body = (await request.json()) as OpenAiImageRequest
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: '请提供描述' }, { status: 400 })
    }

    const { apiKey, apiUrl, model } = getOpenAiImageConfig(
      body.apiKey,
      body.apiUrl,
      body.model
    )

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 配置缺失，请先配置 API 密钥' },
        { status: 500 }
      )
    }

    const imageData = resolveSingleImage(body.imageData, body.imageDataArray)

    const upstreamRequest = imageData
      ? buildOpenAiEditUpstreamRequest(apiUrl, apiKey, model, prompt, imageData, body.size)
      : buildOpenAiGenerateUpstreamRequest(apiUrl, apiKey, model, prompt, body.size)

    const response = await fetch(upstreamRequest.url, {
      method: upstreamRequest.method,
      headers: upstreamRequest.headers,
      body: upstreamRequest.body
    })

    const payload = await readApiResponsePayload(response)
    if (!response.ok) {
      console.error('OpenAI 图片接口错误:', payload)
      return NextResponse.json(
        createApiErrorResponse(
          detectApiErrorCode(payload, response.status),
          response.status,
          extractApiErrorDetail(payload)
        ),
        { status: response.status }
      )
    }

    if (shouldUseGrsaiImageProtocol(apiUrl)) {
      const parsed = parseGrsaiImageResponse(payload)
      return NextResponse.json({
        ...parsed,
        model
      }, { status: getGrsaiResponseStatus(parsed) })
    }

    const parsed = parseOpenAiImageResponse(payload)
    return NextResponse.json({
      ...parsed,
      success: true,
      model
    }, { status: 200 })
  } catch (error) {
    console.error('OpenAI 图片处理错误:', error)
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
  }
}

/**
 * 发起 OpenAI 文生图请求
 * @param apiUrl OpenAI 或兼容网关基础地址
 * @param apiKey 鉴权密钥
 * @param model 图片模型名称
 * @param prompt 用户提示词
 * @param size 可选图片尺寸
 * @returns 上游接口响应
 */
function buildOpenAiGenerateUpstreamRequest(
  apiUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  size?: string
): { url: string; method: string; headers: Record<string, string>; body: string } {
  if (shouldUseGrsaiImageProtocol(apiUrl)) {
    return buildGrsaiImageRequest({ apiKey, apiUrl, model, prompt, size })
  }

  return {
    url: `${apiUrl}/v1/images/generations`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      size: mapOpenAiImageSize(size),
      response_format: 'b64_json'
    })
  }
}

/**
 * 发起 OpenAI 图生图编辑请求
 * @param apiUrl OpenAI 或兼容网关基础地址
 * @param apiKey 鉴权密钥
 * @param model 图片模型名称
 * @param prompt 用户提示词
 * @param imageData 单张 base64 图片
 * @returns 上游接口响应
 */
function buildOpenAiEditUpstreamRequest(
  apiUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  imageData: string,
  size?: string
): { url: string; method: string; headers: Record<string, string>; body: FormData | string } {
  if (shouldUseGrsaiImageProtocol(apiUrl)) {
    return buildGrsaiImageRequest({
      apiKey,
      apiUrl,
      model,
      prompt,
      imageDataArray: [imageData],
      size
    })
  }

  const formData = new FormData()
  formData.append('model', model)
  formData.append('prompt', prompt)
  formData.append('response_format', 'b64_json')
  formData.append('image', buildImageBlob(imageData), 'input.png')

  return {
    url: `${apiUrl}/v1/images/edits`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  }
}

/**
 * 规范化图片输入，只允许 OpenAI 路径处理单图编辑
 * @param imageData 单图 base64 数据
 * @param imageDataArray 多图 base64 数据
 * @returns 可用于 OpenAI 编辑接口的单张图片
 */
function resolveSingleImage(
  imageData?: string,
  imageDataArray?: string[]
): string | undefined {
  if (imageData) {
    return imageData
  }

  if (!imageDataArray || imageDataArray.length === 0) {
    return undefined
  }

  if (imageDataArray.length > 1) {
    throw new Error('OpenAI 图片编辑接口当前仅支持单图输入')
  }

  return imageDataArray[0]
}

/**
 * 构造图片编辑接口使用的 Blob
 * @param imageData base64 图片数据
 * @returns 二进制图片 Blob
 */
function buildImageBlob(imageData: string): Blob {
  const normalized = imageData.includes(',') ? imageData.split(',')[1] : imageData
  const buffer = Buffer.from(normalized, 'base64')
  return new Blob([buffer], { type: 'image/png' })
}

/**
 * 将 OpenAI 图片尺寸规范化为非 Grsai Images API 可接受的值
 * @param size 页面选择或接口传入的尺寸
 * @returns OpenAI Images API 尺寸字符串
 */
function mapOpenAiImageSize(size?: string): string {
  switch ((size || '').toLowerCase()) {
    case '2k':
    case '1536x1024':
      return '1536x1024'
    case '4k':
    case '1024x1536':
      return '1024x1536'
    case '1024x1024':
      return '1024x1024'
    default:
      return '1024x1024'
  }
}

/**
 * 处理 OpenAI 图片路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns OpenAI 图片接口处理结果
 */
export async function POST(request: NextRequest) {
  return openAiImageHandler(request)
}
