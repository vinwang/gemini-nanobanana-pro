import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException
} from '@/app/lib/api-error'
import {
  buildGrsaiImageRequest,
  getGrsaiResponseStatus,
  parseGrsaiImageResponse,
  shouldUseGrsaiImageProtocol
} from '@/app/lib/grsai-image'
import { getMaynorApiConfig } from '@/app/lib/maynor-api'
import { resolveProviderModel } from '@/app/lib/model-map'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 处理 Gemini 文生图生成请求
 * @param request Next.js 请求对象
 * @returns 统一格式的文生图结果
 */
async function generateHandler(request: NextRequest) {
  try {
    const { prompt, apiKey: customApiKey, apiUrl: customApiUrl, model: customModel, size } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供描述' }, { status: 400 })
    }

    // 优先使用前端传来的自定义配置，否则使用环境变量
    const { apiKey, apiUrl } = getMaynorApiConfig(customApiKey, customApiUrl)

    if (!apiKey) {
      return NextResponse.json({ error: 'API配置缺失，请在页面右上角配置 API 密钥' }, { status: 500 })
    }

    const model = resolveProviderModel(customModel)

    const upstreamRequest = shouldUseGrsaiImageProtocol(apiUrl)
      ? buildGrsaiImageRequest({ apiKey, apiUrl, model, prompt, size })
      : buildChatCompletionsRequest(apiUrl, apiKey, model, prompt)

    const response = await fetch(upstreamRequest.url, {
      method: upstreamRequest.method,
      headers: upstreamRequest.headers,
      body: upstreamRequest.body
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('API错误:', errorData)
      return NextResponse.json(
        createApiErrorResponse(detectApiErrorCode(errorData, response.status), response.status),
        { status: response.status }
      )
    }

    const data = await response.json()

    if (shouldUseGrsaiImageProtocol(apiUrl)) {
      const parsed = parseGrsaiImageResponse(data)
      return NextResponse.json(parsed, { status: getGrsaiResponseStatus(parsed) })
    }
    
    // 解析 OpenAI 格式响应
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0]
      const message = choice.message
      
      if (message && message.content) {
        // 检查是否有图片内容
        if (Array.isArray(message.content)) {
          const imagePart = message.content.find((part: any) => part.type === 'image_url')
          const textPart = message.content.find((part: any) => part.type === 'text')
          
          if (imagePart && imagePart.image_url) {
            return NextResponse.json({ 
              imageUrl: imagePart.image_url.url,
              content: textPart?.text || '图片已生成',
              message: '成功生成图片'
            })
          }
        } else if (typeof message.content === 'string') {
          // 文本响应，尝试从文本中提取URL或base64图片
          const text = message.content
          
          // 检查是否包含base64图片数据
          const base64Match = text.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
          if (base64Match) {
            return NextResponse.json({ 
              imageData: base64Match[1],
              mimeType: 'image/jpeg',
              content: text,
              message: '成功生成图片'
            })
          }
          
          // 检查是否包含图片URL
          const imageUrlMatch = text.match(/!\[.*?\]\((.*?)\)/);
          const urlMatch = text.match(/https?:\/\/[^\s]+/);
          
          if (imageUrlMatch && imageUrlMatch[1]) {
            return NextResponse.json({ 
              imageUrl: imageUrlMatch[1],
              content: text 
            })
          } else if (urlMatch) {
            return NextResponse.json({ 
              imageUrl: urlMatch[0],
              content: text 
            })
          } else {
            return NextResponse.json({ 
              message: '模型响应了文本内容',
              content: text
            })
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
 * 构造 OpenAI 兼容 chat/completions 文生图请求
 * @param apiUrl API 基础地址
 * @param apiKey 鉴权密钥
 * @param model 上游模型名
 * @param prompt 用户提示词
 * @returns 可传给 fetch 的 JSON 请求
 */
function buildChatCompletionsRequest(
  apiUrl: string,
  apiKey: string,
  model: string,
  prompt: string
): { body: string; headers: Record<string, string>; method: string; url: string } {
  return {
    url: `${apiUrl}/v1/chat/completions`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt }
        ]
      }],
      temperature: 0.7,
      max_tokens: 4096
    })
  }
}

/**
 * 处理 generate 路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns generate 路由处理结果
 */
export async function POST(request: NextRequest) {
  return generateHandler(request)
}
