import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException
} from '@/app/lib/api-error'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * 处理图片上传请求
 * @param request Next.js 请求对象
 * @returns 图片上传结果
 */
async function uploadImageHandler(request: NextRequest) {
  try {
    const { imageData, mimeType } = await request.json()

    if (!imageData) {
      return NextResponse.json({ error: '请提供图片数据' }, { status: 400 })
    }

    // ImgBB API配置
    const apiKey = process.env.IMGBB_API_KEY
    const apiUrl = 'https://api.imgbb.com/1/upload'

    if (!apiKey) {
      return NextResponse.json(createApiErrorResponse('CONFIG', 500), { status: 500 })
    }

    // 准备表单数据
    const formData = new FormData()
    formData.append('key', apiKey)
    formData.append('image', imageData) // base64数据（不带前缀）

    // 设置过期时间（可选，单位：秒，最大365天）
    // formData.append('expiration', '2592000') // 30天

    // 上传到ImgBB
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('ImgBB API错误:', errorData)
      return NextResponse.json(
        createApiErrorResponse(detectApiErrorCode(errorData, response.status), response.status),
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.success && data.data) {
      // 返回图片信息
      return NextResponse.json({
        success: true,
        url: data.data.url,          // 图片直链
        displayUrl: data.data.display_url, // 显示链接
        deleteUrl: data.data.delete_url,   // 删除链接
        imageId: data.data.id,
        title: data.data.title,
        size: data.data.size,
        expiration: data.data.expiration,
        width: data.data.width,
        height: data.data.height
      })
    }

    return NextResponse.json({
      ...createApiErrorResponse('UNAVAILABLE', 500)
    }, { status: 500 })

  } catch (error) {
    console.error('上传错误:', error)
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
  }
}

/**
 * 处理图片上传路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns 图片上传路由结果
 */
export async function POST(request: NextRequest) {
  return uploadImageHandler(request)
}
