'use client'

import { useState, useEffect } from 'react'
import './nano.css'
import BrowserWarning from '../components/BrowserWarning'
import { useLanguage } from '../i18n/LanguageContext'
import QuotaModal from '../components/QuotaModal'

type Mode = 'upload' | 'text'
type Style = 'none' | 'enhance' | 'artistic' | 'anime' | 'photo'
type Model = 'gemini-3-pro-image-preview' | 'gemini' | 'openai' | 'doubao'

const GRS_AI_POLL_INTERVAL_MS = 2500

type GenerationRequestData = {
  [key: string]: unknown
}

type GrsaiPendingTask = {
  taskId: string
}

type GrsaiTimingContext = {
  pollAttempt: number
  requestId: string
  startedAt: number
}

export default function NanoPage() {
  const { language, setLanguage, t } = useLanguage()
  const [mode, setMode] = useState<Mode>('text')
  const [prompt, setPrompt] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [style, setStyle] = useState<Style>('none')
  const [selectedEditingPrompt, setSelectedEditingPrompt] = useState<number | null>(null)
  const [model, setModel] = useState<Model>('gemini-3-pro-image-preview')
  const [imageSize, setImageSize] = useState<string>('1k')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalTitle, setErrorModalTitle] = useState('')
  const [errorModalMessage, setErrorModalMessage] = useState('')
  const [showQuotaModal, setShowQuotaModal] = useState(false)

  const quickPrompts = [
    { icon: '🏔️', text: '风景', value: '美丽的自然风景' },
    { icon: '👥', text: '人像', value: '专业人像摄影' },
    { icon: '🏛️', text: '建筑', value: '现代建筑设计' },
    { icon: '🎨', text: '艺术', value: '抽象艺术作品' },
    { icon: '🚀', text: '科幻', value: '科幻场景' },
    { icon: '🌿', text: '自然', value: '自然生态' },
    { icon: '🐾', text: '动物', value: '可爱的动物' },
    { icon: '💡', text: '创意', value: '创意设计' }
  ]

  // 图像编辑专用快速操作
  const editingQuickPrompts = [
    { icon: '✨', text: '智能美化', value: '智能美化图片，增强细节，提高画质，保持原有风格和色调' },
    { icon: '🎭', text: '风格转换', value: '将图片转换为艺术风格，如油画、水彩或素描效果，保持主要内容不变' },
    { icon: '🐛', text: '添加元素', value: '请为这张图片添加一个可爱的小动物在合适的位置，保持原图的风格和色调' },
    { icon: '🌈', text: '色彩优化', value: '优化图片色彩饱和度和对比度，使画面更加生动明亮' },
    { icon: '🌅', text: '光影增强', value: '优化图片的光影效果，增强层次感和立体感，使画面更有深度' },
    { icon: '🔧', text: '智能修复', value: '修复图片中的瑕疵和噪点，优化整体视觉效果' },
    { icon: '👗', text: '穿搭分析', value: '分析图片中的服装搭配，在原图基础上添加标注和建议' },
    { icon: '🔍', text: '详细分析', value: '在原图基础上添加详细的标注说明，分析图片内容和关键元素' }
  ]

  const valuePropositions = [
    {
      label: '文字生图',
      title: '输入文字，秒出好图',
      description: '产品描述、卖点文案直接生成高质量营销素材'
    },
    {
      label: '商业风格',
      title: '一套文案，多版产出',
      description: '白底图、场景图、海报等视觉方向快速切换'
    },
    {
      label: '降本增效',
      title: '低成本验证视觉创意',
      description: '传统拍摄3天/3000元，AI生成3秒完成首轮验证'
    },
    {
      label: '垂类优化',
      title: '更懂智能硬件与消费电子',
      description: '基于真实投放数据训练，贴近电商与营销场景'
    }
  ]

  // 关闭额度弹窗并记录到 localStorage
  const handleCloseQuotaModal = () => {
    setShowQuotaModal(false)
    localStorage.setItem('hasSeenQuotaModal', 'true')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // 检查是否超过最大限制（最多10张图片）
      const totalFiles = [...imageFiles, ...files]
      if (totalFiles.length > 10) {
        alert('最多只能上传10张图片')
        // 重置input值以允许重新选择相同的文件
        e.target.value = ''
        return
      }

      setIsUploading(true)

      try {
        // 同步更新文件列表
        const newImageFiles = [...imageFiles, ...files]
        
        // 批量处理所有文件的预览
        const previewPromises = files.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result as string)
            }
            reader.readAsDataURL(file)
          })
        })

        // 等待所有预览完成后一次性更新状态
        const newPreviews = await Promise.all(previewPromises)
        
        // 确保状态同步更新
        setImageFiles(newImageFiles)
        setImagePreviews(prev => [...prev, ...newPreviews])
        
        console.log('图片上传完成:', { 
          newFilesCount: files.length, 
          totalFiles: newImageFiles.length,
          totalPreviews: imagePreviews.length + newPreviews.length
        })
      } catch (error) {
        console.error('图片上传失败:', error)
        showError('上传失败', '图片上传失败，请重试')
      } finally {
        setIsUploading(false)
      }
    }

    // 重置input值以允许重新选择相同的文件
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      // 检查是否超过最大限制（最多10张图片）
      const totalFiles = [...imageFiles, ...files]
      if (totalFiles.length > 10) {
        alert('最多只能上传10张图片')
        return
      }

      setIsUploading(true)

      try {
        // 同步更新文件列表
        const newImageFiles = [...imageFiles, ...files]
        
        // 批量处理所有文件的预览
        const previewPromises = files.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result as string)
            }
            reader.readAsDataURL(file)
          })
        })

        // 等待所有预览完成后一次性更新状态
        const newPreviews = await Promise.all(previewPromises)
        
        // 确保状态同步更新
        setImageFiles(newImageFiles)
        setImagePreviews(prev => [...prev, ...newPreviews])
        
        console.log('拖拽上传完成:', { 
          newFilesCount: files.length, 
          totalFiles: newImageFiles.length,
          totalPreviews: imagePreviews.length + newPreviews.length
        })
      } catch (error) {
        console.error('拖拽上传失败:', error)
        showError('上传失败', '图片上传失败，请重试')
      } finally {
        setIsUploading(false)
      }
    } else {
      showError('文件类型错误', '请上传图片文件')
    }
  }

  const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        
        canvas.width = width * ratio
        canvas.height = height * ratio
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const convertToBase64 = async (file: File): Promise<string> => {
    // Compress large images first
    const maxSizeMB = 2
    let processedFile = file

    if (file.size > maxSizeMB * 1024 * 1024) {
      processedFile = await compressImage(file)
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(processedFile)
      reader.onload = () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = error => reject(error)
    })
  }

  const convertMultipleToBase64 = async (files: File[]): Promise<string[]> => {
    const promises = files.map(file => convertToBase64(file))
    return Promise.all(promises)
  }

  /**
   * 显示错误弹窗
   * @param title 弹窗标题
   * @param message 错误说明
   * @returns 无返回值
   */
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title)
    setErrorModalMessage(message)
    setShowErrorModal(true)
  }

  /**
   * 判断响应是否为 Grsai 异步任务
   * @param data API 响应数据
   * @returns 是否需要继续轮询任务结果
   */
  const isPendingGrsaiTask = (data: unknown): data is GrsaiPendingTask => {
    if (!data || typeof data !== 'object') {
      return false
    }

    const task = data as { imageUrl?: unknown; taskId?: unknown }
    return typeof task.taskId === 'string' && task.taskId.length > 0 && !task.imageUrl
  }

  /**
   * 等待指定毫秒数
   * @param delayMs 等待时长
   * @returns 等待完成的 Promise
   */
  const wait = (delayMs: number): Promise<void> => {
    return new Promise((resolve) => {
      window.setTimeout(resolve, delayMs)
    })
  }

  /**
   * 轮询 Grsai 异步图片任务
   * @param taskId Grsai 生成任务 ID
   * @param requestData 原始请求配置，用于沿用页面 API 设置
   * @returns 最终生成结果
   */
  const pollGrsaiTask = async (
    taskId: string,
    requestData: GenerationRequestData,
    timingContext: GrsaiTimingContext
  ): Promise<unknown> => {
    while (true) {
      await wait(GRS_AI_POLL_INTERVAL_MS)
      const nextAttempt = timingContext.pollAttempt + 1

      const response = await fetch('/api/grsai-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: requestData.apiKey,
          apiUrl: requestData.apiUrl,
          pollAttempt: nextAttempt,
          requestId: timingContext.requestId,
          startedAt: timingContext.startedAt,
          taskId
        })
      })
      const data = await response.json()
      timingContext.pollAttempt = nextAttempt

      if (isPendingGrsaiTask(data)) {
        continue
      }

      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : '生成失败，请稍后重试')
      }

      return data
    }
  }

  const handleGenerate = async () => {
    if (mode === 'text' && prompt.length < 3) {
      showError('输入提示', '请输入至少3个字符的描述')
      return
    }
    if (mode === 'upload' && imageFiles.length === 0) {
      showError('上传提示', '请先上传图片')
      return
    }

    if (isUploading) {
      showError('上传提示', '图片正在上传中，请稍候...')
      return
    }

    setLoading(true)
    setResult(null)
    setError('')

    try {
      let imageDataArray = null
      let finalPrompt = prompt

      if (mode === 'upload' && imageFiles.length > 0) {
        imageDataArray = await convertMultipleToBase64(imageFiles)
        const stylePrompt = getStylePrompt(style)
        const imageCountText = imageFiles.length > 1 ? `基于${imageFiles.length}张图片` : '基于上传的图片'
        finalPrompt = stylePrompt ? `${stylePrompt} ${imageCountText} ${prompt || '优化这些图片'}` : (prompt || '优化这些图片')
      } else {
        // 文生图模式不需要图片数据
        imageDataArray = null
        const stylePrompt = getStylePrompt(style)
        finalPrompt = stylePrompt ? `${stylePrompt} ${prompt}` : prompt
      }

      // 根据选择的模型决定API端点
      let apiEndpoint = '/api/gemini'
      if (model === 'doubao') {
        apiEndpoint = '/api/doubao'
      } else if (model === 'openai') {
        apiEndpoint = '/api/openai-image'
      } else if (model === 'gemini' && mode === 'text') {
        apiEndpoint = '/api/generate'
      } else if (model === 'gemini-3-pro-image-preview') {
        apiEndpoint = mode === 'text' ? '/api/generate' : '/api/gemini'
      }

      const requestBody = mode === 'text'
        ? { prompt: finalPrompt }
        : { prompt: finalPrompt, imageDataArray }

      // 添加用户标识到请求
      const requestData: GenerationRequestData = {
        ...requestBody
      }

      // 图片生成模型统一向后端传页面尺寸，后端按 provider 转换字段名和值
      if (model === 'doubao' || model === 'openai' || model === 'gemini' || model === 'gemini-3-pro-image-preview') {
        requestData.size = imageSize
      }

      // 使用时间戳作为用户标识
      requestData.timestamp = Date.now()

      // API credentials stay server-side and are read from .env.local by API routes.
      if (model === 'gemini' || model === 'gemini-3-pro-image-preview') {
        requestData.model = model
      } else if (model === 'openai') {
        requestData.model = 'gpt-image-2'
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('JSON解析错误:', parseError)
        showError('API解析错误', 'API响应解析失败，请稍后重试')
        return
      }

      if (isPendingGrsaiTask(data)) {
        const finalData = await pollGrsaiTask(data.taskId, requestData, {
          pollAttempt: 0,
          requestId: `client-${requestData.timestamp}`,
          startedAt: requestData.timestamp as number
        })
        setResult(finalData)
        return
      }

      if (!response.ok) {
        // 检查是否是额度不足错误
        if (response.status === 429 ||
            (data.error && (
              data.error.includes('额度') ||
              data.error.includes('quota') ||
              data.error.includes('limit') ||
              data.error.includes('insufficient')
            ))) {
          setShowQuotaModal(true)
          return
        }

        if (response.status === 524) {
          const errorMsg = '服务器响应超时，请稍后重试'
          showError('服务器超时', errorMsg)
          return
        } else if (response.status === 500) {
          const errorMsg = `服务器内部错误：${data.error || '未知错误'}`
          showError('服务器错误', errorMsg)
          return
        }
        const errorMsg = data.error || '未知错误'
        showError('生成失败', errorMsg)
        return
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error('请求错误:', err)
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          showError('网络错误', '网络连接失败，请检查网络后重试')
        } else if (err.message.includes('timeout')) {
          showError('请求超时', '请求超时，请稍后重试')
        } else {
          showError('发生错误', `发生错误：${err.message}`)
        }
      } else {
        showError('未知错误', '未知错误，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStylePrompt = (style: Style): string => {
    const styles = {
      none: '',
      enhance: '增强细节，提高画质',
      artistic: '艺术风格，油画效果',
      anime: '动漫风格，二次元',
      photo: '写实照片，真实感'
    }
    return styles[style]
  }

  const getModelDisplayName = (model: Model): string => {
    switch (model) {
      case 'gemini-3-pro-image-preview':
        return language === 'zh' ? '元图旗舰 (Gemini 3 Pro)' : 'YuanTu Flagship (Gemini 3 Pro)'
      case 'gemini':
        return language === 'zh' ? 'Gemini 2.5 Flash' : 'Gemini 2.5 Flash'
      case 'openai':
        return language === 'zh' ? 'OpenAI GPT Image 2' : 'OpenAI GPT Image 2'
      case 'doubao':
        return language === 'zh' ? '豆包模型(待开发)' : 'Doubao Model (Coming Soon)'
      default:
        return model
    }
  }

  const resultSummaryText = result?.text || result?.content || result?.message || ''

  return (
    <div className="yuantu-theme" style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fbff 0%, #edf6ff 100%)',
      color: '#ffffff',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    }}>
      {/* 浏览器兼容性警告 */}
      <BrowserWarning />
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(18px)',
        backgroundColor: 'rgba(9, 9, 9, 0.78)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.9rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem'
          }}>
            <div className="brand-mark" style={{
              width: '2.6rem',
              height: '2.6rem',
              borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, #f59e0b, #fb7185)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.32)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>元</span>
            </div>
            <div>
              <p style={{
                margin: 0,
                fontSize: '0.74rem',
                letterSpacing: '0.22em',
                color: '#fbbf24',
                textTransform: 'uppercase'
              }}>
                IMAGE ENGINE
              </p>
              <h1 style={{
                margin: '0.2rem 0 0',
                fontSize: '1.15rem',
                fontWeight: 700,
                letterSpacing: '0.03em'
              }}>
                元图引擎
              </h1>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div className="language-switch" data-current-language={language} style={{
              display: 'flex',
              gap: '0.35rem',
              backgroundColor: 'rgba(255,255,255,0.04)',
              padding: '0.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
            <button
              className={language === 'zh' ? 'language-button active selected-language' : 'language-button'}
              data-language="zh"
              aria-pressed={language === 'zh'}
              onClick={() => setLanguage('zh')}
              style={{
                padding: '0.42rem 0.8rem',
                background: language === 'zh' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'transparent',
                backgroundColor: language === 'zh' ? '#2563eb' : 'transparent',
                color: language === 'zh' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              中文
            </button>
            <button
              className={language === 'en' ? 'language-button active selected-language' : 'language-button'}
              data-language="en"
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
              style={{
                padding: '0.42rem 0.8rem',
                background: language === 'en' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 'transparent',
                backgroundColor: language === 'en' ? '#2563eb' : 'transparent',
                color: language === 'en' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              EN
            </button>
          </div>

        </div>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem clamp(1rem, 3vw, 2rem) 3rem' }}>
      <section className="hero-panel" style={{
        margin: '0 auto 1rem',
        maxWidth: '1040px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.8rem',
          borderRadius: '999px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: '#fbbf24',
          fontSize: '0.8rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          <span>Commercial Visual Engine</span>
          <span style={{ color: '#6b7280' }}>•</span>
          <span>{mode === 'text' ? 'Text to Image' : 'Image Editing'}</span>
        </div>
        <div className="hero-grid">
          <div>
            <h2 className="hero-title">
              元图引擎
              <span>AI商业视觉引擎</span>
            </h2>
            <p className="hero-copy">
              你的品牌还在为“拍图慢、改图贵、素材不够用”发愁吗？元界跃迁自研AI智能体元图引擎，专为品牌营销与电商场景打造。
            </p>
            <p className="hero-status">
              已内测上线，欢迎预约体验。
            </p>
          </div>
          <div className="hero-metrics" aria-label="商业视觉能力">
            <div>
              <strong>3s</strong>
              <span>首轮视觉验证</span>
            </div>
            <div>
              <strong>3+</strong>
              <span>商业图片方向</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>品牌营销智能体</span>
            </div>
          </div>
        </div>
        <div className="value-grid">
          {valuePropositions.map((item) => (
            <div
              key={item.title}
              className="value-card"
            >
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mode Selector */}
      <div className="mode-selector" style={{ display: 'flex', gap: '0.75rem', padding: '0 0 1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="mode-button"
          onClick={() => setMode('upload')}
          style={{
            minWidth: '220px',
            padding: '0.9rem 1.3rem',
            background: mode === 'upload'
              ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
              : 'rgba(255,255,255,0.03)',
            border: mode === 'upload' ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: mode === 'upload' ? 'white' : '#0f172a',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '0.96rem',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: mode === 'upload'
              ? '0 12px 32px rgba(245, 158, 11, 0.28)'
              : 'none',
            transform: mode === 'upload' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'upload') {
              e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.18)'
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'upload') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.86)'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {t.mode.upload}
        </button>
        <button
          className="mode-button"
          onClick={() => setMode('text')}
          style={{
            minWidth: '220px',
            padding: '0.9rem 1.3rem',
            background: mode === 'text'
              ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
              : 'rgba(255,255,255,0.03)',
            border: mode === 'text' ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: mode === 'text' ? 'white' : '#0f172a',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '0.96rem',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            boxShadow: mode === 'text'
              ? '0 12px 32px rgba(245, 158, 11, 0.28)'
              : 'none',
            transform: mode === 'text' ? 'translateY(-2px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (mode !== 'text') {
              e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.18)'
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'text') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.86)'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {t.mode.text}
        </button>
      </div>


      <section className="workbench-shell" style={{
        maxWidth: 'none',
        width: '100%',
        margin: '0 auto',
        borderRadius: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        overflow: 'hidden'
      }}>
      {/* Model Selector */}
      <div className="model-selector" style={{ display: 'flex', gap: '0.85rem', padding: '1.1rem 1.2rem 0.85rem', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.86rem', minWidth: 'fit-content' }}>{t.model.label}</span>
          <button
            onClick={() => setModel('gemini-3-pro-image-preview')}
            style={{
              padding: '0.55rem 0.95rem',
              background: model === 'gemini-3-pro-image-preview'
                ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                : 'rgba(255,255,255,0.03)',
              border: model === 'gemini-3-pro-image-preview' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: model === 'gemini-3-pro-image-preview'
                ? '0 8px 22px rgba(245, 158, 11, 0.24)'
                : 'none'
            }}
          >
            {t.model.gemini3pro}
          </button>
          <button
            onClick={() => setModel('gemini')}
            style={{
              padding: '0.55rem 0.95rem',
              background: model === 'gemini'
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : 'rgba(255,255,255,0.03)',
              border: model === 'gemini' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: model === 'gemini'
                ? '0 8px 22px rgba(79, 70, 229, 0.26)'
                : 'none'
            }}
          >
            {t.model.gemini}
          </button>
          <button
            onClick={() => setModel('openai')}
            style={{
              padding: '0.55rem 0.95rem',
              background: model === 'openai'
                ? 'linear-gradient(135deg, #fb7185, #f97316)'
                : 'rgba(255,255,255,0.03)',
              border: model === 'openai' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              boxShadow: model === 'openai'
                ? '0 8px 22px rgba(249, 115, 22, 0.24)'
                : 'none'
            }}
          >
            {t.model.openai}
          </button>
          <button
            onClick={() => {
              showError(t.model.doubao.replace('🚧 ', ''), t.model.doubaoTip)
            }}
            style={{
              padding: '0.55rem 0.95rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#6b7280',
              borderRadius: '999px',
              cursor: 'not-allowed',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              opacity: 0.6
            }}
            disabled
          >
            {t.model.doubao}
          </button>
        </div>
        
        {/* Size Selector for image APIs */}
        {(model === 'doubao' || model === 'openai' || model === 'gemini' || model === 'gemini-3-pro-image-preview') && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#9ca3af', fontSize: '0.84rem' }}>{t.model.size}</span>
            {['1k', '2k', '4k'].map((size) => (
              <button
                key={size}
                onClick={() => setImageSize(size)}
                style={{
                  padding: '0.45rem 0.78rem',
                  background: imageSize === size
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'rgba(255,255,255,0.03)',
                  border: imageSize === size ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: imageSize === size
                    ? '0 2px 8px rgba(245, 158, 11, 0.3)'
                    : 'none'
                }}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ display: 'flex', gap: '1.4rem', padding: '0 0 1.2rem', maxWidth: 'none', margin: '0 auto' }}>
        {/* Left Panel */}
        <div className="left-panel" style={{ flex: 1 }}>
          {mode === 'upload' ? (
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(240, 249, 255, 0.88))',
              border: '2px dashed rgba(37, 99, 235, 0.28)',
                borderRadius: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                minHeight: '400px',
              boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (imagePreviews.length === 0) {
                  document.getElementById('file-upload')?.click()
                }
              }}
            >
              {isUploading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#10b981' }}>
                    正在上传图片...
                  </h3>
                  <p style={{ color: '#888' }}>请稍候，正在处理您的图片</p>
                </div>
              ) : imagePreviews.length > 0 ? (
                <div>
                  <div className="image-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: imagePreviews.length === 1 ? '1fr' : imagePreviews.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          className="image-preview"
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '0.5rem',
                            border: '2px solid #10b981'
                          }}
                        />
                        <button
                          className="close-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const newFiles = imageFiles.filter((_, i) => i !== index)
                            const newPreviews = imagePreviews.filter((_, i) => i !== index)
                            setImageFiles(newFiles)
                            setImagePreviews(newPreviews)
                          }}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                        <div className="image-number" style={{
                          position: 'absolute',
                          bottom: '5px',
                          left: '5px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '0.25rem',
                          fontSize: '12px'
                        }}>
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="action-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    <label
                      className="action-button"
                      htmlFor="file-upload"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'inline-block',
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.3s ease',
                        fontSize: '0.9rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      ➕ 添加更多图片
                    </label>
                    <button
                      className="action-button"
                      onClick={() => {
                        setImageFiles([])
                        setImagePreviews([])
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ 清空全部
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-empty-state">
                  <div className="upload-camera-icon" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>📸</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#10b981' }}>拖拽图片到此处或点击上传</h3>
                  <p style={{ color: '#888', marginBottom: '1rem', lineHeight: '1.5' }}>
                    💡 支持多图上传，最多10张<br />
                    📏 单个文件最大 10MB<br />
                    🎨 支持 PNG, JPG, JPEG, WebP, GIF 格式<br />
                    🔄 上传后可通过对话描述编辑需求
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{
                      padding: '0.75rem 2rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-block',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    📁 选择图片文件
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="text-mode-layout" style={{ display: 'flex', gap: '2rem' }}>
              {/* Quick Prompts */}
              <div className="prompt-sidebar" style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86))',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                minWidth: '200px',
                boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
                border: '1px solid rgba(37, 99, 235, 0.14)'
              }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚡ 灵感启发
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  点击下方标签快速开始创作
                </p>
                <div className="quick-prompts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {quickPrompts.map((item, index) => (
                    <button
                      className="quick-prompt-button"
                      key={index}
                      onClick={() => setPrompt(item.value)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(37, 99, 235, 0.18)',
                        borderRadius: '0.75rem',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                        e.currentTarget.style.color = '#1d4ed8'
                        e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.18)'
                        e.currentTarget.style.color = '#334155'
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'none'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="prompt-editor-wrap" style={{ flex: 1 }}>
                <div className="text-input-area" style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86))',
                  borderRadius: '1.5rem',
                  padding: '1.5rem',
                  minHeight: '400px',
                  boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
                  border: '1px solid rgba(37, 99, 235, 0.14)'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    AI 图像生成
                  </h3>
                  <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#888' }}>
                    描述你想要生成的图像
                  </h4>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如: 一只可爱的卡通猫咪，坐在彩虹上，梦幻风格，柔和的色彩..."
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      background: 'rgba(255, 255, 255, 0.96)',
                      border: '1px solid rgba(99, 102, 241, 0.22)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      color: '#0f172a',
                      fontSize: '1rem',
                      resize: 'vertical',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.72)'
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.22)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <div style={{ 
                    marginTop: '0.5rem', 
                    textAlign: 'right',
                    color: '#666',
                    fontSize: '0.9rem'
                  }}>
                    {prompt.length}/5000
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Editing Styles for Upload Mode */}
          {mode === 'upload' && (
            <div className="edit-style-panel" style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86))',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              marginTop: '1rem',
              boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
              border: '1px solid rgba(37, 99, 235, 0.14)'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎨 编辑风格
              </h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                选择编辑方式快速处理图片
              </p>

              <div className="quick-prompts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                {editingQuickPrompts.map((item, index) => (
                  <button
                    className={selectedEditingPrompt === index ? 'quick-prompt-button selected-edit-prompt' : 'quick-prompt-button'}
                    key={index}
                    aria-pressed={selectedEditingPrompt === index}
                    onClick={() => {
                      setSelectedEditingPrompt(index)
                      setPrompt(item.value)
                    }}
                    style={{
                      padding: '0.75rem 0.5rem',
                      backgroundColor: selectedEditingPrompt === index ? 'rgba(37, 99, 235, 0.10)' : 'transparent',
                      border: selectedEditingPrompt === index ? '1px solid rgba(37, 99, 235, 0.68)' : '1px solid rgba(37, 99, 235, 0.18)',
                      borderRadius: '0.75rem',
                      color: selectedEditingPrompt === index ? '#1d4ed8' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                      e.currentTarget.style.color = '#1d4ed8'
                      e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = selectedEditingPrompt === index ? 'rgba(37, 99, 235, 0.68)' : 'rgba(37, 99, 235, 0.18)'
                      e.currentTarget.style.color = selectedEditingPrompt === index ? '#1d4ed8' : '#334155'
                      e.currentTarget.style.backgroundColor = selectedEditingPrompt === index ? 'rgba(37, 99, 235, 0.10)' : 'transparent'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = selectedEditingPrompt === index ? '0 10px 24px rgba(37, 99, 235, 0.16)' : 'none'
                    }}
                  >
                    {selectedEditingPrompt === index && (
                      <span className="selected-check" aria-hidden="true">✓</span>
                    )}
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Options for Upload Mode */}
          {mode === 'upload' && (
            <div className="multi-edit-panel" style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86))',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              marginTop: '1rem',
              boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
              border: '1px solid rgba(37, 99, 235, 0.14)'
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🎨 多图智能编辑</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ✨ 支持上传最多10张图片作为参考<br />
                🎯 通过自然对话描述编辑需求<br />
                🚀 AI智能理解并合成创意内容<br />
                📸 可进行风格迁移、合成创作等多种操作
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                    e.currentTarget.style.color = '#1d4ed8'
                    e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.18)'
                    e.currentTarget.style.color = '#334155'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >✨ 多图编辑</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                    e.currentTarget.style.color = '#1d4ed8'
                    e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.18)'
                    e.currentTarget.style.color = '#334155'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >🎨 风格迁移</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                    e.currentTarget.style.color = '#1d4ed8'
                    e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.18)'
                    e.currentTarget.style.color = '#334155'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >🖼️ 图片合成</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.55)'
                    e.currentTarget.style.color = '#1d4ed8'
                    e.currentTarget.style.backgroundColor = 'rgba(239, 246, 255, 0.98)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.18)'
                    e.currentTarget.style.color = '#334155'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >🚀 AI增强</button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - AI Options */}
        <div className="right-panel" style={{ width: '320px' }}>
          
          <div style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 251, 255, 0.86))',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            boxShadow: '0 18px 54px rgba(37, 99, 235, 0.10)',
            border: '1px solid rgba(37, 99, 235, 0.14)'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              marginBottom: '1.5rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ✨ AI 图像编辑
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#888' }}>快速风格</h4>
              <div className="style-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  className={style === 'enhance' ? 'style-button selected-style-button' : 'style-button'}
                  aria-pressed={style === 'enhance'}
                  onClick={() => setStyle(style === 'enhance' ? 'none' : 'enhance')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'enhance' ? 'rgba(37, 99, 235, 0.10)' : 'rgba(255, 255, 255, 0.86)',
                    borderColor: style === 'enhance' ? '#2563eb' : 'rgba(37, 99, 235, 0.18)',
                    color: style === 'enhance' ? '#1d4ed8' : '#334155'
                  }}
                >
                  🔍 增强细节
                </button>
                <button
                  className={style === 'artistic' ? 'style-button selected-style-button' : 'style-button'}
                  aria-pressed={style === 'artistic'}
                  onClick={() => setStyle(style === 'artistic' ? 'none' : 'artistic')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'artistic' ? 'rgba(37, 99, 235, 0.10)' : 'rgba(255, 255, 255, 0.86)',
                    borderColor: style === 'artistic' ? '#2563eb' : 'rgba(37, 99, 235, 0.18)',
                    color: style === 'artistic' ? '#1d4ed8' : '#334155'
                  }}
                >
                  🎨 艺术风格
                </button>
                <button
                  className={style === 'anime' ? 'style-button selected-style-button' : 'style-button'}
                  aria-pressed={style === 'anime'}
                  onClick={() => setStyle(style === 'anime' ? 'none' : 'anime')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'anime' ? 'rgba(37, 99, 235, 0.10)' : 'rgba(255, 255, 255, 0.86)',
                    borderColor: style === 'anime' ? '#2563eb' : 'rgba(37, 99, 235, 0.18)',
                    color: style === 'anime' ? '#1d4ed8' : '#334155'
                  }}
                >
                  ✨ 动漫风格
                </button>
                <button
                  className={style === 'photo' ? 'style-button selected-style-button' : 'style-button'}
                  aria-pressed={style === 'photo'}
                  onClick={() => setStyle(style === 'photo' ? 'none' : 'photo')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'photo' ? 'rgba(37, 99, 235, 0.10)' : 'rgba(255, 255, 255, 0.86)',
                    borderColor: style === 'photo' ? '#2563eb' : 'rgba(37, 99, 235, 0.18)',
                    color: style === 'photo' ? '#1d4ed8' : '#334155'
                  }}
                >
                  📷 写实照片
                </button>
              </div>
            </div>

            {mode === 'upload' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  例如: 将图片转换为油画风格，增加暖色调，让画面更加生动...
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要的编辑效果..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid rgba(99, 102, 241, 0.22)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.72)'
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.22)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
                {t.aiOptions.tip}
              </p>
            </div>

            <button
              className={`generate-button ${loading ? 'loading' : 'button-glow'}`}
              onClick={handleGenerate}
              disabled={loading || isUploading}
              style={{
                width: '100%',
                padding: '1rem',
                background: (loading || isUploading)
                  ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: (loading || isUploading) ? 'not-allowed' : 'pointer',
                opacity: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: loading
                  ? 'none'
                  : '0 8px 25px rgba(16, 185, 129, 0.3)',
                transform: loading ? 'none' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)'
                }
              }}
            >
              {loading ? (
                <>
                  <span className="rotating">⚙️</span> {t.generate.generating}
                </>
              ) : isUploading ? (
                <>
                  <span className="rotating">📤</span> {t.generate.uploading}
                </>
              ) : (
                <>
                  {t.generate.button}
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.9rem'
                  }}>
                    {t.generate.badge}
                  </span>
                </>
              )}
            </button>

            <p style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.9rem',
              color: '#ef4444'
            }}>
              {mode === 'text' ? t.generate.requirement : ''}
            </p>
          </div>
        </div>
      </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="error-section" style={{
          padding: '0 1.2rem 1.2rem',
          maxWidth: '1040px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: '1.4rem',
            padding: '1.25rem 1.5rem',
            textAlign: 'center',
            border: '1px solid #ef4444'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>
              生成失败
            </h3>
            <p style={{ color: '#fecaca', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {error}
            </p>
            <button
              onClick={() => setError('')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="result-section" style={{
          padding: '0 1.2rem 1.5rem',
          maxWidth: '1040px',
          margin: '0 auto'
        }}>
          <div style={{
            borderRadius: '1.8rem',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
            padding: '1.35rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              gap: '1rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <p style={{
                  margin: 0,
                  color: '#f59e0b',
                  letterSpacing: '0.18em',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase'
                }}>
                  Result
                </p>
                <h3 style={{
                  fontSize: '1.45rem',
                  margin: '0.35rem 0 0',
                  color: '#f8fafc'
                }}>
                  {t.result.title}
                </h3>
              </div>
            </div>

          {/* 图片显示 */}
          {result.imageData || result.imageUrl ? (
            <div style={{
              display: 'grid',
              gap: '1rem',
              justifyItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <img
                  className="result-image"
                  src={result.imageUrl || `data:${result.mimeType};base64,${result.imageData}`}
                  alt="Generated"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '620px',
                    borderRadius: '1.4rem',
                    boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.7)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 15px 50px rgba(0,0,0,0.6)'
                  }}
                />
              </div>
              {resultSummaryText && (
                <div style={{
                  maxWidth: '760px',
                  fontSize: '0.92rem',
                  lineHeight: '1.7',
                  color: '#475569',
                  textAlign: 'center'
                }}>
                  {resultSummaryText}
                </div>
              )}
            </div>
          ) : resultSummaryText ? (
            /* 文本响应显示 */
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '1.2rem',
              padding: '2rem',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '1rem' }}>💭</div>
              <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.6' }}>
                {resultSummaryText}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resultSummaryText)
                  showError('复制成功', '文本已复制到剪贴板！')
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 复制文本
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '1.2rem',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.1rem' }}>{resultSummaryText}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resultSummaryText)
                  showError('复制成功', '文本已复制到剪贴板！')
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 复制文本
              </button>
            </div>
          )}
          </div>
        </div>
      )}

      <section className="examples-section" style={{ marginTop: '3rem' }}>
        <h2>{t.examples.title}</h2>
        <div className="examples-grid">
          <div className="example-card">
            <h3>{t.examples.textToImage.title}</h3>
            <p><strong>{t.examples.textToImage.prompt}</strong>{t.examples.textToImage.promptExample}</p>
            <p><strong>{t.examples.textToImage.style}</strong>{t.examples.textToImage.styleValue}</p>
            <p><strong>{t.examples.textToImage.count}</strong>{t.examples.textToImage.countValue}</p>
          </div>
          <div className="example-card">
            <h3>{t.examples.imageEdit.title}</h3>
            <p><strong>{t.examples.imageEdit.operation}</strong></p>
            <p>{t.examples.imageEdit.step1}</p>
            <p>{t.examples.imageEdit.step2}</p>
            <p><strong>{t.examples.imageEdit.style}</strong>{t.examples.imageEdit.styleValue}</p>
          </div>
          <div className="example-card">
            <h3>{t.examples.tips.title}</h3>
            <p><strong>{t.examples.tips.good}</strong></p>
            <p>{t.examples.tips.goodTips}</p>
            <p><strong>{t.examples.tips.avoid}</strong></p>
            <p>{t.examples.tips.avoidTips}</p>
          </div>
          <div className="example-card">
            <h3>{t.examples.templates.title}</h3>
            <p><strong>{t.examples.templates.landscape}</strong>{t.examples.templates.landscapeExample}</p>
            <p><strong>{t.examples.templates.portrait}</strong>{t.examples.templates.portraitExample}</p>
            <p><strong>{t.examples.templates.art}</strong>{t.examples.templates.artExample}</p>
            <p><strong>{t.examples.templates.scifi}</strong>{t.examples.templates.scifiExample}</p>
          </div>
        </div>
      </section>
      </main>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="error-modal-overlay" role="presentation">
          <section
            className="error-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="error-modal-title"
          >
            <div className="error-modal-mark" aria-hidden="true">!</div>
            <h3 id="error-modal-title" className="error-modal-title">
              {errorModalTitle}
            </h3>
            <p className="error-modal-message">
              {errorModalMessage}
            </p>
            <div className="error-modal-actions">
              <button
                className="error-modal-primary"
                onClick={() => setShowErrorModal(false)}
              >
                确定
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Quota Modal */}
      <QuotaModal
        isOpen={showQuotaModal}
        onClose={handleCloseQuotaModal}
      />
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  backgroundColor: 'rgba(255, 255, 255, 0.86)',
  border: '1px solid rgba(37, 99, 235, 0.18)',
  borderRadius: '1.5rem',
  color: '#334155',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
}

const styleButtonStyle: React.CSSProperties = {
  padding: '0.75rem',
  border: '1px solid',
  backgroundColor: 'rgba(255, 255, 255, 0.86)',
  borderRadius: '0.75rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
}
