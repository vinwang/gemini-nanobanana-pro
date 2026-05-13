'use client'

import { useState, useEffect } from 'react'
import './nano.css'
import BrowserWarning from '../components/BrowserWarning'
import { useLanguage } from '../i18n/LanguageContext'
import ShareModal from '../components/ShareModal'
import FreeQuotaModal from '../components/FreeQuotaModal'
import { loadApiConfig, saveApiConfig, type ApiConfig } from '../lib/api-config'

type Mode = 'upload' | 'text'
type Style = 'none' | 'enhance' | 'artistic' | 'anime' | 'photo'
type Model = 'gemini-3-pro-image-preview' | 'gemini' | 'openai' | 'doubao'

export default function NanoPage() {
  const { language, setLanguage, t } = useLanguage()
  const [mode, setMode] = useState<Mode>('text')
  const [prompt, setPrompt] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [style, setStyle] = useState<Style>('none')
  const [model, setModel] = useState<Model>('gemini-3-pro-image-preview')
  const [imageSize, setImageSize] = useState<string>('1k')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorModalTitle, setErrorModalTitle] = useState('')
  const [errorModalMessage, setErrorModalMessage] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showQuotaModal, setShowQuotaModal] = useState(false)
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => loadApiConfig())

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

  const showcaseSections = [
    {
      title: '时光档案',
      subtitle: '复古胶片、年代海报、记忆修复与叙事感画面',
      prompts: [
        '1980年代街头肖像，胶片颗粒，暖黄路灯，纪实构图',
        '老照片修复成高质感彩色人像，保持年代氛围',
        '90年代校园宣传海报，中文标题，出版级排版'
      ]
    },
    {
      title: '高密度文字设计',
      subtitle: '杂志封面、展览主视觉、品牌排版与海报语言',
      prompts: [
        '先锋时尚杂志封面，黑白主图，大字号中文标题',
        '科技发布会海报，极简网格排版，橙色强调信息',
        '咖啡品牌菜单页，留白克制，细节精致'
      ]
    },
    {
      title: 'UI 与产品界面',
      subtitle: '高保真工作台、App 截图、运营看板与交互界面',
      prompts: [
        '深色模式 AI 图片工作台，简洁控件，专业产品截图',
        '电商数据分析后台，橙色状态标签，克制布局',
        '移动端拍照修图 App 首页，现代玻璃质感'
      ]
    },
    {
      title: '超写实场景',
      subtitle: '人物、产品、梗图与社交传播感强的高逼真画面',
      prompts: [
        '戴墨镜的柴犬坐在复古敞篷车里，夏日广告质感',
        '护肤品微距海报，水珠细节，棚拍灯光',
        '都市女性街拍，电影感逆光，真实肤质'
      ]
    }
  ]

  // 页面加载时检查是否需要显示额度耗尽弹窗（首次访问）
  useEffect(() => {
    const hasSeenQuotaModal = localStorage.getItem('hasSeenQuotaModal')
    if (!hasSeenQuotaModal) {
      // 延迟1秒后显示，让页面先加载
      const timer = setTimeout(() => {
        setShowQuotaModal(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

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

  // 显示错误弹窗的函数
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title)
    setErrorModalMessage(message)
    setShowErrorModal(true)
  }

  const handleGenerate = async () => {
    // 调试：显示当前配置
    console.log('🔍 当前 API 配置:', apiConfig)
    console.log('🎯 选择的模型:', model)

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
      const requestData: any = {
        ...requestBody
      }

      // 如果是豆包模型，添加尺寸参数
      if (model === 'doubao') {
        requestData.size = imageSize
      } else if (model === 'openai' && mode === 'text') {
        requestData.size = mapImageSizeToOpenAi(imageSize)
      }

      // 使用时间戳作为用户标识
      requestData.timestamp = Date.now()

      // 始终传递 API 配置（后端会自动 fallback 到环境变量）
      if (model === 'gemini' || model === 'gemini-3-pro-image-preview') {
        if (apiConfig.geminiApiKey) {
          requestData.apiKey = apiConfig.geminiApiKey
        }
        if (apiConfig.geminiApiUrl) {
          requestData.apiUrl = apiConfig.geminiApiUrl
        }
        // 添加模型标识
        if (model === 'gemini-3-pro-image-preview') {
          requestData.model = 'gemini-3-pro-image-preview'
        }
      } else if (model === 'openai') {
        if (apiConfig.openaiApiKey) {
          requestData.apiKey = apiConfig.openaiApiKey
        }
        if (shouldSendOpenAiUrl(apiConfig.openaiApiUrl, apiConfig.openaiApiKey)) {
          requestData.apiUrl = apiConfig.openaiApiUrl
        }
        requestData.model = 'gpt-image-2'
      } else if (model === 'doubao') {
        if (apiConfig.doubaoApiKey) {
          requestData.apiKey = apiConfig.doubaoApiKey
        }
        if (apiConfig.doubaoApiUrl) {
          requestData.apiUrl = apiConfig.doubaoApiUrl
        }
      }

      console.log('发送请求到:', apiEndpoint, '配置:', {
        hasApiKey: !!requestData.apiKey,
        apiUrl: requestData.apiUrl,
        model
      })

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
        showError('API解析错误', `API响应解析失败，请稍后重试。使用的模型：${getModelDisplayName(model)}`)
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
          const errorMsg = `服务器响应超时，请稍后重试。模型：${getModelDisplayName(model)}`
          showError('服务器超时', errorMsg)
          return
        } else if (response.status === 500) {
          const errorMsg = `服务器内部错误：${data.error || '未知错误'}。模型：${getModelDisplayName(model)}`
          showError('服务器错误', errorMsg)
          return
        }
        const errorMsg = `生成失败：${data.error || '未知错误'}。模型：${getModelDisplayName(model)}`
        showError('生成失败', errorMsg)
        return
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error('请求错误:', err)
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          showError('网络错误', `网络连接失败，请检查网络后重试。模型：${getModelDisplayName(model)}`)
        } else if (err.message.includes('timeout')) {
          showError('请求超时', `请求超时，请稍后重试。模型：${getModelDisplayName(model)}`)
        } else {
          showError('发生错误', `发生错误：${err.message}。模型：${getModelDisplayName(model)}`)
        }
      } else {
        showError('未知错误', `未知错误，请重试。模型：${getModelDisplayName(model)}`)
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
        return language === 'zh' ? 'NanoBanana2 (Gemini 3 Pro)' : 'NanoBanana2 (Gemini 3 Pro)'
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

  /**
   * 判断是否需要把 OpenAI URL 作为前端覆盖配置发送给后端
   * @param apiUrl 当前表单中的 OpenAI URL
   * @param apiKey 当前表单中的 OpenAI Key
   * @returns 是否发送 URL 覆盖值
   */
  const shouldSendOpenAiUrl = (apiUrl: string, apiKey: string): boolean => {
    const normalizedUrl = apiUrl.trim()
    if (!normalizedUrl) {
      return false
    }

    if (normalizedUrl !== 'https://api.chatfire.site') {
      return true
    }

    return Boolean(apiKey.trim())
  }

  /**
   * 将页面尺寸选项映射为 OpenAI 图片接口支持的尺寸
   * @param size 页面上的尺寸值
   * @returns OpenAI 图片接口可接受的尺寸字符串
   */
  const mapImageSizeToOpenAi = (size: string): string => {
    switch (size) {
      case '2k':
        return '1536x1024'
      case '4k':
        return '1024x1536'
      default:
        return '1024x1024'
    }
  }

  // 下载图片
  const downloadImage = (imageData: string, mimeType: string = 'image/png') => {
    const link = document.createElement('a')
    link.href = `data:${mimeType};base64,${imageData}`
    link.download = `generated-${Date.now()}.${mimeType.split('/')[1]}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 分享图片
  const shareImage = async (imageData: string, mimeType: string = 'image/png') => {
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(`data:${mimeType};base64,${imageData}`)).blob()
        const file = new File([blob], `generated-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType })
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'AI生成的图片',
            text: '查看这张AI生成的图片'
          })
        }
      } catch (error) {
        console.error('分享失败:', error)
        // 降级到复制链接
        copyToClipboard(`data:${mimeType};base64,${imageData}`)
      }
    } else {
      // 降级到复制链接
      copyToClipboard(`data:${mimeType};base64,${imageData}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showError('提示', '图片链接已复制到剪贴板')
    }).catch(() => {
      showError('提示', '复制失败，请手动复制')
    })
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, rgba(245, 158, 11, 0.16), transparent 28%), linear-gradient(180deg, #090909 0%, #0d0d0d 42%, #121212 100%)',
      color: '#ffffff',
      fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
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
            <div style={{
              width: '2.6rem',
              height: '2.6rem',
              borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, #f59e0b, #fb7185)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 10px 30px rgba(245, 158, 11, 0.32)'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🍌</span>
            </div>
            <div>
              <p style={{
                margin: 0,
                fontSize: '0.74rem',
                letterSpacing: '0.22em',
                color: '#fbbf24',
                textTransform: 'uppercase'
              }}>
                AIGC STUDIO
              </p>
              <h1 style={{
                margin: '0.2rem 0 0',
                fontSize: '1.15rem',
                fontWeight: 700,
                letterSpacing: '0.03em'
              }}>
                Nano Banana
              </h1>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              backgroundColor: 'rgba(255,255,255,0.04)',
              padding: '0.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
            <button
              onClick={() => setLanguage('zh')}
              style={{
                padding: '0.42rem 0.8rem',
                backgroundColor: language === 'zh' ? '#f59e0b' : 'transparent',
                color: language === 'zh' ? '#111' : '#9ca3af',
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
              onClick={() => setLanguage('en')}
              style={{
                padding: '0.42rem 0.8rem',
                backgroundColor: language === 'en' ? '#f59e0b' : 'transparent',
                color: language === 'en' ? '#111' : '#9ca3af',
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

          <button
            onClick={() => setShowApiConfig(true)}
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#e5e7eb',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b'
              e.currentTarget.style.color = '#fbbf24'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = '#e5e7eb'
            }}
          >
            ⚙️ API配置
          </button>
        </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.2rem 4rem' }}>
      <section style={{
        textAlign: 'center',
        margin: '0 auto 1.5rem',
        maxWidth: '780px'
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
          <span>Images Workflow</span>
          <span style={{ color: '#6b7280' }}>•</span>
          <span>{mode === 'text' ? 'Text to Image' : 'Image Editing'}</span>
        </div>
        <h2 style={{
          margin: '1rem 0 0.8rem',
          fontSize: 'clamp(2.6rem, 8vw, 5.2rem)',
          lineHeight: 0.95,
          letterSpacing: '-0.05em',
          fontWeight: 800
        }}>
          生成一张
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg, #f8fafc, #f59e0b 56%, #fb7185 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            更像作品的图片
          </span>
        </h2>
        <p style={{
          margin: '0 auto',
          maxWidth: '620px',
          color: '#9ca3af',
          fontSize: '1rem',
          lineHeight: 1.7
        }}>
          参考图库级工作流重构。把模型、比例、尺寸和输入动作压缩到一个工作台里，让生成、编辑和试错都更快。
        </p>
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
            color: 'white',
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
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.18)'
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'upload') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
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
            color: 'white',
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
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.18)'
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== 'text') {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {t.mode.text}
        </button>
      </div>


      <section style={{
        maxWidth: '1040px',
        margin: '0 auto',
        borderRadius: '2rem',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 26px 80px rgba(0,0,0,0.34)',
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
        {(model === 'doubao' || model === 'openai') && (
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
      <div className="main-content" style={{ display: 'flex', gap: '1.4rem', padding: '0 1.2rem 1.2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
                background: 'linear-gradient(135deg, #111111, #1a1a1a)',
                border: '2px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                minHeight: '400px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
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
                <>
                  <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>📸</div>
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
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '2rem' }}>
              {/* Quick Prompts */}
              <div style={{
                background: 'linear-gradient(135deg, #111111, #1a1a1a)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                minWidth: '200px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.1)'
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
                        border: '1px solid #333',
                        borderRadius: '0.75rem',
                        color: '#888',
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
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.color = '#10b981'
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333'
                        e.currentTarget.style.color = '#888'
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
              <div style={{ flex: 1 }}>
                <div className="text-input-area" style={{
                  background: 'linear-gradient(135deg, #111111, #1a1a1a)',
                  borderRadius: '1.5rem',
                  padding: '1.5rem',
                  minHeight: '400px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.1)'
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
                      background: 'linear-gradient(135deg, #1a1a1a, #222222)',
                      border: '1px solid #333',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      color: 'white',
                      fontSize: '1rem',
                      resize: 'vertical',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#333'
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
            <div style={{
              background: 'linear-gradient(135deg, #111111, #1a1a1a)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              marginTop: '1rem',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(16, 185, 129, 0.1)'
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
                    className="quick-prompt-button"
                    key={index}
                    onClick={() => setPrompt(item.value)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '0.75rem',
                      color: '#888',
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
                      e.currentTarget.style.borderColor = '#10b981'
                      e.currentTarget.style.color = '#10b981'
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333'
                      e.currentTarget.style.color = '#888'
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Options for Upload Mode */}
          {mode === 'upload' && (
            <div style={{
              background: 'linear-gradient(135deg, #111111, #1a1a1a)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              marginTop: '1rem',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(16, 185, 129, 0.1)'
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
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.color = '#10b981'
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.color = '#888'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >✨ 多图编辑</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.color = '#10b981'
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.color = '#888'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >🎨 风格迁移</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.color = '#10b981'
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.color = '#888'
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'none'
                  }}
                >🖼️ 图片合成</button>
                <button
                  style={{ ...tagStyle }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.color = '#10b981'
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.color = '#888'
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
            background: 'linear-gradient(135deg, #111111, #1a1a1a)',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(16, 185, 129, 0.1)'
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
                  className="style-button"
                  onClick={() => setStyle(style === 'enhance' ? 'none' : 'enhance')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'enhance' ? '#10b98120' : 'transparent',
                    borderColor: style === 'enhance' ? '#10b981' : '#333',
                    color: style === 'enhance' ? '#10b981' : '#888'
                  }}
                >
                  🔍 增强细节
                </button>
                <button
                  className="style-button"
                  onClick={() => setStyle(style === 'artistic' ? 'none' : 'artistic')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'artistic' ? '#10b98120' : 'transparent',
                    borderColor: style === 'artistic' ? '#10b981' : '#333',
                    color: style === 'artistic' ? '#10b981' : '#888'
                  }}
                >
                  🎨 艺术风格
                </button>
                <button
                  className="style-button"
                  onClick={() => setStyle(style === 'anime' ? 'none' : 'anime')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'anime' ? '#10b98120' : 'transparent',
                    borderColor: style === 'anime' ? '#10b981' : '#333',
                    color: style === 'anime' ? '#10b981' : '#888'
                  }}
                >
                  ✨ 动漫风格
                </button>
                <button
                  className="style-button"
                  onClick={() => setStyle(style === 'photo' ? 'none' : 'photo')}
                  style={{
                    ...styleButtonStyle,
                    backgroundColor: style === 'photo' ? '#10b98120' : 'transparent',
                    borderColor: style === 'photo' ? '#10b981' : '#333',
                    color: style === 'photo' ? '#10b981' : '#888'
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
                    background: 'linear-gradient(135deg, #1a1a1a, #222222)',
                    border: '1px solid #333',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    color: 'white',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              {/* 免费服务提示 */}
              <div style={{
                backgroundColor: '#0f2419',
                border: '1px solid #10b981',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {t.freeService.title}
                </div>
                <p style={{ color: '#ccc', fontSize: '0.8rem', margin: '0' }}>
                  {t.freeService.description}
                </p>
              </div>

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
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: '1rem',
            padding: '1.5rem',
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
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #10b981, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
            {t.result.title}
          </h3>
          </div>

          {/* 图片显示 */}
          {result.imageData || result.imageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img
                id="generated-image"
                className="result-image"
                src={result.imageUrl || `data:${result.mimeType};base64,${result.imageData}`}
                alt="Generated"
                style={{
                  maxWidth: '100%',
                  maxHeight: '600px',
                  borderRadius: '1.5rem',
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
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    const img = document.getElementById('generated-image') as HTMLImageElement
                    if (img) {
                      const canvas = document.createElement('canvas')
                      const ctx = canvas.getContext('2d')
                      canvas.width = img.naturalWidth
                      canvas.height = img.naturalHeight
                      ctx?.drawImage(img, 0, 0)

                      canvas.toBlob((blob) => {
                        if (blob) {
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `nano-banana-${Date.now()}.png`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }
                      }, 'image/png')
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease'
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
                  {t.result.download}
                </button>
                <button
                  onClick={() => {
                    // 打开分享弹窗
                    setShowShareModal(true)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {t.result.share}
                </button>
              </div>
            </div>
          ) : result.text || result.content || result.message ? (
            /* 文本响应显示 */
            <div style={{
              backgroundColor: '#111111',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '1rem' }}>💭</div>
              <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.6' }}>
                {result.text || result.content || result.message}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.text || result.content || result.message)
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
              backgroundColor: '#111111',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.1rem' }}>{result.text || result.content || result.message}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.text || result.content || result.message)
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
      )}

      <section style={{ marginTop: '3rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          alignItems: 'end',
          flexWrap: 'wrap',
          marginBottom: '1.4rem'
        }}>
          <div>
            <p style={{ margin: 0, color: '#f59e0b', letterSpacing: '0.18em', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              Prompt Gallery
            </p>
            <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.8rem', lineHeight: 1.1 }}>
              像参考站一样，把案例当成工作流入口
            </h3>
          </div>
          <p style={{ margin: 0, maxWidth: '480px', color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.7 }}>
            每组案例都能直接回填到输入框。与其堆很多说明卡片，不如让灵感素材自己解释模型适合做什么。
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {showcaseSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              style={{
                borderRadius: '1.6rem',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                padding: '1.25rem'
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    width: '1.9rem',
                    height: '1.9rem',
                    borderRadius: '999px',
                    background: sectionIndex % 2 === 0 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(99, 102, 241, 0.18)',
                    color: sectionIndex % 2 === 0 ? '#fbbf24' : '#a5b4fc',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}>
                    0{sectionIndex + 1}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{section.title}</h4>
                </div>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.92rem', lineHeight: 1.65 }}>
                  {section.subtitle}
                </p>
              </div>

              <div className="examples-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.85rem'
              }}>
                {section.prompts.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMode('text')
                      setPrompt(item)
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '1rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#f3f4f6',
                      cursor: 'pointer',
                      minHeight: '132px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)'
                      e.currentTarget.style.boxShadow = '0 14px 34px rgba(0,0,0,0.22)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '72px',
                      borderRadius: '0.8rem',
                      marginBottom: '0.85rem',
                      background: sectionIndex % 2 === 0
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(251,113,133,0.16), rgba(255,255,255,0.03))'
                        : 'linear-gradient(135deg, rgba(99,102,241,0.28), rgba(34,211,238,0.16), rgba(255,255,255,0.03))'
                    }} />
                    <p style={{
                      margin: 0,
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
                      color: '#e5e7eb'
                    }}>
                      {item}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      </main>

      {/* Error Modal */}
      {showErrorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #ef4444',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                ⚠️
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: '#ef4444',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                {errorModalTitle}
              </h3>
              <p style={{
                color: '#ccc',
                fontSize: '1rem',
                lineHeight: '1.5',
                margin: 0
              }}>
                {errorModalMessage}
              </p>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowErrorModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {result && result.imageData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageData={result.imageData}
          mimeType={result.mimeType || 'image/png'}
          t={t}
        />
      )}

      {/* Free Quota Modal */}
      <FreeQuotaModal
        isOpen={showQuotaModal}
        onClose={handleCloseQuotaModal}
      />

      {/* API Config Modal */}
      {showApiConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowApiConfig(false)}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            border: '1px solid #333',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#10b981',
                margin: 0
              }}>
                ⚙️ API 配置
              </h2>
              <button
                onClick={() => setShowApiConfig(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              color: '#888',
              fontSize: '0.95rem',
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              配置自定义的 API 密钥和中转服务地址。留空则使用默认服务。
              <br />
              <a
                href="https://api.chatfire.site"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#10b981', textDecoration: 'underline' }}
              >
                点击这里获取 API Key →
              </a>
            </p>

            {/* Gemini API Config */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: '#10b981',
                fontSize: '1.1rem',
                marginBottom: '1rem'
              }}>
                Gemini API
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiConfig.geminiApiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, geminiApiKey: e.target.value })}
                  placeholder="从 Chatfire 获取"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API URL
                </label>
                <input
                  type="text"
                  value={apiConfig.geminiApiUrl}
                  onChange={(e) => setApiConfig({ ...apiConfig, geminiApiUrl: e.target.value })}
                  placeholder="https://api.chatfire.site"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* OpenAI API Config */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: '#f59e0b',
                fontSize: '1.1rem',
                marginBottom: '1rem'
              }}>
                OpenAI API
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiConfig.openaiApiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, openaiApiKey: e.target.value })}
                  placeholder="输入 OpenAI 或兼容网关的 API Key"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API URL
                </label>
                <input
                  type="text"
                  value={apiConfig.openaiApiUrl}
                  onChange={(e) => setApiConfig({ ...apiConfig, openaiApiUrl: e.target.value })}
                  placeholder="https://api.chatfire.site"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Doubao API Config */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: '#10b981',
                fontSize: '1.1rem',
                marginBottom: '1rem'
              }}>
                Doubao API
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiConfig.doubaoApiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, doubaoApiKey: e.target.value })}
                  placeholder="从 Chatfire 获取"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  API URL
                </label>
                <input
                  type="text"
                  value={apiConfig.doubaoApiUrl}
                  onChange={(e) => setApiConfig({ ...apiConfig, doubaoApiUrl: e.target.value })}
                  placeholder="https://api.chatfire.site"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              backgroundColor: '#0a1a0a',
              border: '1px solid #10b981',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: '#888',
                fontSize: '0.85rem',
                margin: 0,
                lineHeight: '1.5'
              }}>
                💡 提示：配置保存在浏览器本地存储中，不会上传到服务器。自定义 API 密钥优先级高于默认服务。
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setApiConfig(loadApiConfig())
                  setShowApiConfig(false)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333'
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  saveApiConfig(apiConfig)
                  setShowApiConfig(false)
                  alert('配置已保存！')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const tagStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  backgroundColor: 'transparent',
  border: '1px solid #333',
  borderRadius: '1.5rem',
  color: '#888',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
}

const styleButtonStyle: React.CSSProperties = {
  padding: '0.75rem',
  border: '1px solid',
  borderRadius: '0.75rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden'
}
