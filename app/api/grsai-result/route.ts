import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException,
  extractApiErrorDetail
} from '@/app/lib/api-error'
import {
  buildGrsaiResultRequest,
  getGrsaiResponseStatus,
  parseGrsaiImageResponse
} from '@/app/lib/grsai-image'
import { getMaynorApiConfig } from '@/app/lib/maynor-api'

export const runtime = 'nodejs'
export const maxDuration = 30

type GrsaiResultRequestBody = {
  apiKey?: string
  apiUrl?: string
  taskId?: string
}

/**
 * 处理 Grsai 异步图片任务结果查询
 * @param request Next.js 请求对象
 * @returns 已完成图片结果或仍在处理中的任务状态
 */
async function grsaiResultHandler(request: NextRequest) {
  try {
    const body = (await request.json()) as GrsaiResultRequestBody
    const taskId = body.taskId?.trim()

    if (!taskId) {
      return NextResponse.json({ error: '缺少生成任务 ID' }, { status: 400 })
    }

    const { apiKey, apiUrl } = getMaynorApiConfig(body.apiKey, body.apiUrl)
    if (!apiKey) {
      return NextResponse.json(
        createApiErrorResponse('CONFIG', 500),
        { status: 500 }
      )
    }

    const upstreamRequest = buildGrsaiResultRequest({ apiKey, apiUrl, taskId })
    const response = await fetch(upstreamRequest.url, {
      method: upstreamRequest.method,
      headers: upstreamRequest.headers
    })
    const payload = await readJsonPayload(response)

    if (!response.ok) {
      return NextResponse.json(
        createApiErrorResponse(
          detectApiErrorCode(payload, response.status),
          response.status,
          extractApiErrorDetail(payload)
        ),
        { status: response.status }
      )
    }

    const parsed = parseGrsaiImageResponse(payload)
    return NextResponse.json(parsed, { status: getGrsaiResponseStatus(parsed) })
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
  }
}

/**
 * 读取上游 JSON 响应内容
 * @param response 上游 HTTP 响应
 * @returns JSON 对象或原始文本包装对象
 */
async function readJsonPayload(response: Response): Promise<unknown> {
  const rawText = await response.text()
  if (!rawText) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    return { raw: rawText }
  }
}

/**
 * 处理 Grsai result 路由的 POST 请求
 * @param request Next.js 请求对象
 * @returns Grsai 任务查询结果
 */
export async function POST(request: NextRequest) {
  return grsaiResultHandler(request)
}
