import { NextRequest, NextResponse } from 'next/server'
import {
  createApiErrorResponse,
  detectApiErrorCode,
  detectApiErrorCodeFromException,
  extractApiErrorDetail,
  readApiResponsePayload
} from '@/app/lib/api-error'
import {
  buildGrsaiResultRequest,
  createGrsaiRequestId,
  getGrsaiResponseStatus,
  logGrsaiTiming,
  parseGrsaiImageResponse
} from '@/app/lib/grsai-image'
import { getMaynorApiConfig } from '@/app/lib/maynor-api'

export const runtime = 'nodejs'
export const maxDuration = 30

type GrsaiResultRequestBody = {
  apiKey?: string
  apiUrl?: string
  pollAttempt?: number
  requestId?: string
  startedAt?: number
  taskId?: string
}

/**
 * 处理 Grsai 异步图片任务结果查询
 * @param request Next.js 请求对象
 * @returns 已完成图片结果或仍在处理中的任务状态
 */
async function grsaiResultHandler(request: NextRequest) {
  const routeStartedAt = Date.now()

  try {
    const body = (await request.json()) as GrsaiResultRequestBody
    const taskId = body.taskId?.trim()
    const timingMeta = {
      pollAttempt: body.pollAttempt,
      requestId: body.requestId || createGrsaiRequestId(),
      startedAt: typeof body.startedAt === 'number' ? body.startedAt : routeStartedAt
    }

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
    logGrsaiTiming('result:poll_start', timingMeta, {
      apiUrl,
      taskId,
      url: upstreamRequest.url
    })

    const upstreamStartedAt = Date.now()
    const response = await fetch(upstreamRequest.url, {
      method: upstreamRequest.method,
      headers: upstreamRequest.headers
    })
    const upstreamElapsedMs = Date.now() - upstreamStartedAt
    const payload = await readApiResponsePayload(response)

    logGrsaiTiming('result:poll_response', timingMeta, {
      status: response.status,
      taskId,
      upstreamElapsedMs
    })

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
    logGrsaiTiming(parsed.imageUrl ? 'result:completed' : 'result:pending', timingMeta, {
      status: parsed.status,
      taskId: parsed.taskId || taskId
    })

    return NextResponse.json(parsed, { status: getGrsaiResponseStatus(parsed) })
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(detectApiErrorCodeFromException(error), 500),
      { status: 500 }
    )
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
