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
  createGrsaiRequestId,
  getGrsaiResponseStatus,
  logGrsaiTiming,
  parseGrsaiImageResponse,
  shouldUseGrsaiImageProtocol
} from '@/app/lib/grsai-image'
import {
  getMaynorApiConfig,
  shouldUseMaynorStandardProtocol
} from '@/app/lib/maynor-api'
import { resolveProviderModel } from '@/app/lib/model-map'

export const runtime = 'nodejs'
export const maxDuration = 60

type GeminiNativePart = {
  inlineData?: { data?: string; mimeType?: string }
  inline_data?: { data?: string; mime_type?: string }
  text?: string
}

type GeminiNativePayload = {
  candidates?: Array<{
    content?: {
      parts?: GeminiNativePart[]
    }
  }>
}

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: Array<{ image_url?: { url?: string }; text?: string; type?: string }> | string
    }
  }>
}

type GeminiResponsePayload = ChatCompletionPayload & GeminiNativePayload

type NormalizedInlineImage = {
  data: string
  mimeType: string
}

/**
 * 处理 Gemini / 第三方 MAYNOR 网关图片请求
 * @param request Next.js 请求对象
 * @returns 统一格式的图片生成结果
 */
async function geminiHandler(request: NextRequest) {
  const requestId = createGrsaiRequestId()
  const startedAt = Date.now()

  try {
    const { prompt, imageData, imageDataArray, apiKey: customApiKey, apiUrl: customApiUrl, model: customModel, size } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供描述' }, { status: 400 })
    }

    // 从服务端环境变量读取配置；保留请求值仅供内部调用复用。
    const { apiKey, apiUrl, protocol } = getMaynorApiConfig(customApiKey, customApiUrl)

    const model = resolveProviderModel(customModel)

    if (!apiKey) {
      return NextResponse.json({ error: 'API配置缺失，请先配置 API 密钥' }, { status: 500 })
    }

    // 构建请求内容 - 根据maynor API文档格式
    const parts: any[] = []
    const hasImageInput = Boolean(imageData || (imageDataArray && imageDataArray.length > 0))

    // 处理多图片输入
    if (imageDataArray && Array.isArray(imageDataArray) && imageDataArray.length > 0) {
      // 多图片模式
      parts.push({ text: prompt })
      imageDataArray.forEach((base64Data) => {
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        })
      })
    } else if (imageData) {
      // 单图片模式（向后兼容）
      parts.push({ text: prompt })
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageData
        }
      })
    } else {
      // 纯文生图模式
      parts.push({ text: prompt })
    }

    // 构建OpenAI兼容格式的消息
    const messages = [{
      role: "user",
      content: [] as any[]
    }]

    // 添加文本内容
    if (imageDataArray && Array.isArray(imageDataArray) && imageDataArray.length > 0) {
      messages[0].content.push({ type: "text", text: prompt })
      imageDataArray.forEach((base64Data) => {
        messages[0].content.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64Data}` }
        })
      })
    } else if (imageData) {
      messages[0].content.push({ type: "text", text: prompt })
      messages[0].content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageData}` }
      })
    } else {
      messages[0].content.push({ type: "text", text: prompt })
    }

    // 根据是否有图片选择合适的API格式
    let response: Response
    const useStandardProtocol = shouldUseMaynorStandardProtocol(protocol, hasImageInput)

    if (shouldUseGrsaiImageProtocol(apiUrl)) {
      const upstreamRequest = buildGrsaiImageRequest({
        apiKey,
        apiUrl,
        model,
        prompt,
        imageDataArray: normalizeGrsaiImages(imageData, imageDataArray),
        size
      })

      logGrsaiTiming('gemini:upstream_request_start', { requestId, startedAt }, {
        apiUrl,
        hasImageInput,
        imageCount: normalizeGrsaiImages(imageData, imageDataArray).length,
        model,
        payloadBytes: upstreamRequest.body.length,
        size,
        url: upstreamRequest.url
      })

      const upstreamStartedAt = Date.now()
      response = await fetch(upstreamRequest.url, {
        method: upstreamRequest.method,
        headers: upstreamRequest.headers,
        body: upstreamRequest.body
      })
      const upstreamElapsedMs = Date.now() - upstreamStartedAt

      logGrsaiTiming('gemini:upstream_response', { requestId, startedAt }, {
        status: response.status,
        upstreamElapsedMs
      })
    } else if (!useStandardProtocol) {
      const upstreamUrl = `${apiUrl}/v1beta/models/${model}:generateContent`
      const upstreamHeaders = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
      const upstreamBody = {
        contents: [{
          role: 'user',
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      }

      // 图片编辑使用 Gemini 原生格式
      response = await fetch(upstreamUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify(upstreamBody)
      })
    } else {
      const upstreamUrl = `${apiUrl}/v1/chat/completions`
      const upstreamHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
      const upstreamBody = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096
      }

      // 标准协议模式统一使用 OpenAI 兼容格式
      response = await fetch(upstreamUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify(upstreamBody)
      })
    }

    const payload = await readApiResponsePayload(response)

    if (!response.ok) {
      logGrsaiTiming('gemini:upstream_error', { requestId, startedAt }, {
        detail: extractApiErrorDetail(payload),
        status: response.status
      })
      console.error('API错误:', payload)
      return NextResponse.json(
        createApiErrorResponse(
          detectApiErrorCode(payload, response.status),
          response.status,
          extractApiErrorDetail(payload)
        ),
        { status: response.status }
      )
    }

    const data = payload as GeminiResponsePayload

    if (shouldUseGrsaiImageProtocol(apiUrl)) {
      const parsed = parseGrsaiImageResponse(data)
      logGrsaiTiming(
        parsed.taskId && !parsed.imageUrl ? 'gemini:task_created' : 'gemini:completed',
        { requestId, startedAt },
        {
          status: parsed.status,
          taskId: parsed.taskId
        }
      )
      return NextResponse.json(parsed, { status: getGrsaiResponseStatus(parsed) })
    }
    
    // 根据请求类型解析不同格式的响应
    if (!useStandardProtocol && hasImageInput) {
      // 解析 Gemini 原生格式响应
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content
        
        if (content.parts) {
          const imagePart = content.parts.find((part) => part.inlineData || part.inline_data)
          const textPart = content.parts.find((part: any) => part.text)
          
          if (imagePart) {
            const imageData = normalizeInlineImage(imagePart)
            if (!imageData) {
              return NextResponse.json(createApiErrorResponse('UNAVAILABLE', 500), { status: 500 })
            }

            return NextResponse.json({ 
              imageData: imageData.data,
              mimeType: imageData.mimeType,
              text: textPart?.text || '图片编辑已完成',
              success: true
            })
          } else if (textPart) {
            return NextResponse.json({ 
              text: textPart.text,
              message: '模型返回了文本响应，但没有生成图片'
            })
          }
        }
      }
    } else {
      // 解析 OpenAI 格式响应
      if (data.choices && data.choices[0]) {
        const choice = data.choices[0]
        const message = choice.message
        
        if (message && message.content) {
          if (Array.isArray(message.content)) {
            // 多部分内容
            const imagePart = message.content.find((part: any) => part.type === 'image_url')
            const textPart = message.content.find((part: any) => part.type === 'text')
            
            if (imagePart && imagePart.image_url) {
              return NextResponse.json({ 
                imageUrl: imagePart.image_url.url,
                text: textPart?.text || '图片已生成'
              })
            }
          } else if (typeof message.content === 'string') {
            // 文本内容，检查是否包含base64图片
            const text = message.content
            const base64Match = text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            
            if (base64Match) {
              return NextResponse.json({ 
                imageData: base64Match[1],
                mimeType: 'image/jpeg',
                text: text
              })
            } else {
              return NextResponse.json({ 
                text: text,
                message: '模型返回了文本响应'
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      ...createApiErrorResponse('UNAVAILABLE', 500)
    }, { status: 500 })
  } catch (error) {
    console.error('生成错误:', error)
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
  }
}

/**
 * 统一读取 Gemini 原生响应中的图片数据
 * @param part Gemini 原生 parts 中的一项
 * @returns 标准化后的图片数据
 */
function normalizeInlineImage(part: GeminiNativePart): NormalizedInlineImage | undefined {
  const inlineImage = part.inlineData
    ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType }
    : { data: part.inline_data?.data, mimeType: part.inline_data?.mime_type }

  if (!inlineImage.data) {
    return undefined
  }

  return {
    data: inlineImage.data,
    mimeType: inlineImage.mimeType || 'image/png'
  }
}

/**
 * 整理 Grsai 图片输入数组
 * @param imageData 单张图片 base64
 * @param imageDataArray 多张图片 base64
 * @returns 图片数组
 */
function normalizeGrsaiImages(
  imageData?: string,
  imageDataArray?: string[]
): string[] {
  if (Array.isArray(imageDataArray) && imageDataArray.length > 0) {
    return imageDataArray
  }

  return imageData ? [imageData] : []
}

/**
 * 处理 Gemini 路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns Gemini 路由处理结果
 */
export async function POST(request: NextRequest) {
  return geminiHandler(request)
}
