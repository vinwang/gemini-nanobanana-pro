import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException
} from '@/app/lib/api-error'
import { getMaynorApiConfig } from '@/app/lib/maynor-api'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * 处理 Doubao 图片生成请求
 * @param request Next.js 请求对象
 * @returns 统一格式的图片生成结果
 */
async function doubaoHandler(request: NextRequest) {
  try {
    const { prompt, imageData, imageDataArray, size = 'adaptive', guidance_scale = 5.5, watermark = true, seed = -1, apiKey: customApiKey, apiUrl: customApiUrl } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供描述' }, { status: 400 })
    }

    // 优先使用前端传来的自定义配置，否则使用环境变量
    const { apiKey, apiUrl } = getMaynorApiConfig(customApiKey, customApiUrl)

    if (!apiKey) {
      return NextResponse.json({ error: 'Doubao API配置缺失，请在页面右上角配置 API 密钥' }, { status: 500 })
    }

    // 构建 doubao API 请求体
    const requestBody: any = {
      model: 'doubao-seedream-4-0-250828',
      prompt: prompt,
      response_format: 'url',
      size: size === 'adaptive' ? '1k' : size, // 将 adaptive 转换为 1k
      seed: seed,
      guidance_scale: guidance_scale,
      watermark: watermark
    }

    // 处理输入图像 - 豆包API只支持单图片输入
    let inputImageData = null
    if (imageDataArray && Array.isArray(imageDataArray) && imageDataArray.length > 0) {
      // 如果有多图片，使用第一张
      inputImageData = imageDataArray[0]
    } else if (imageData) {
      // 单图片模式（向后兼容）
      inputImageData = imageData
    }

    if (inputImageData) {
      // 确保 base64 数据格式正确
      const base64Data = inputImageData.startsWith('data:') ? inputImageData : `data:image/jpeg;base64,${inputImageData}`
      requestBody.image = base64Data
    } else {
      // 豆包API要求必须有image参数，对于文生图模式，我们创建一个1x1像素的透明图片
      const emptyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      requestBody.image = emptyImageBase64
    }

    console.log('Doubao API 请求:', {
      url: `${apiUrl}/v1/images/generations`,
      model: requestBody.model,
      hasImage: !!inputImageData,
      requestBody: JSON.stringify(requestBody, null, 2)
    })

    // 添加重试机制
    let response: Response | null = null
    let lastError: any = null
    const maxRetries = 2
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Doubao API 尝试 ${attempt}/${maxRetries}`)
        response = await fetch(`${apiUrl}/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(180000) // 3分钟超时
        })
        
        // 如果成功或者不是超时错误，跳出重试循环
        if (response.ok || response.status !== 524) {
          break
        }
        
        lastError = { status: response.status, statusText: response.statusText }
        console.log(`Doubao API 尝试 ${attempt} 失败:`, lastError)
        
        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
        }
      } catch (error) {
        lastError = error
        console.log(`Doubao API 尝试 ${attempt} 异常:`, error)
        
        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 等待5秒
        }
      }
    }

    // 检查最终响应
    if (!response || !response.ok) {
      let errorData: any = {}
      try {
        if (response) {
          errorData = await response.json()
        }
      } catch (e) {
        errorData = { error: { message: lastError?.message || '网络请求失败' } }
      }
      
      console.error('Doubao API错误:', errorData)

      return NextResponse.json(
        createApiErrorResponse(
          detectApiErrorCode(errorData, response?.status || 500),
          response?.status || 500
        ),
        { status: response?.status || 500 }
      )
    }

    const data = await response.json()
    console.log('Doubao API响应:', data)
    
    // 解析 doubao 响应格式
    if (data.data && data.data.length > 0) {
      const imageUrl = data.data[0].url
      
      if (imageUrl) {
        // 下载图片并转换为 base64
        try {
          const imageResponse = await fetch(imageUrl)
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer()
            const base64Image = Buffer.from(imageBuffer).toString('base64')
            
            return NextResponse.json({ 
              imageData: base64Image,
              mimeType: 'image/jpeg',
              originalUrl: imageUrl,
              model: 'doubao-seedream-4-0-250828',
              usage: data.usage
            })
          }
        } catch (downloadError) {
          console.error('图片下载失败:', downloadError)
          // 如果下载失败，返回原始URL
          return NextResponse.json({ 
            imageUrl: imageUrl,
            model: 'doubao-seedream-4-0-250828',
            usage: data.usage,
            note: '返回图片URL，下载失败'
          })
        }
      }
    }

    return NextResponse.json({ 
      ...createApiErrorResponse('UNAVAILABLE', 500)
    }, { status: 500 })
  } catch (error) {
    console.error('Doubao生成错误:', error)
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
  }
}

/**
 * 处理 Doubao 路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns Doubao 路由处理结果
 */
export async function POST(request: NextRequest) {
  return doubaoHandler(request)
}
