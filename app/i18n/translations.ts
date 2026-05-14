export const translations = {
  zh: {
    // Header
    header: {
      title: '元图引擎 · AI商业视觉引擎',
      subtitle: '商业视觉生成',
      poweredBy: '由元图引擎提供支持',
      noLogin: '快速体验',
      unlimited: '无限生成'
    },

    // Mode Selector
    mode: {
      upload: '📷 通过对话编辑图像',
      text: '✨ 文生图模式'
    },

    // Model Selector
    model: {
      label: 'AI模型:',
      gemini3pro: '🚀 元图旗舰 (Gemini 3 Pro)',
      gemini: '🤖 Gemini 2.5 Flash',
      openai: '🖼️ OpenAI GPT Image 2',
      doubao: '🚧 豆包模型(待开发)',
      doubaoTip: '豆包模型功能正在开发中，敬请期待！目前请使用元图旗舰 (Gemini 3 Pro) 模型。',
      size: '尺寸:'
    },

    // Upload Area
    upload: {
      title: '拖拽图片到此处或点击上传',
      uploading: '正在上传图片...',
      uploadingDesc: '请稍候，正在处理您的图片',
      tips: '💡 支持多图上传，最多10张\n📏 单个文件最大 10MB\n🎨 支持 PNG, JPG, JPEG, WebP, GIF 格式\n🔄 上传后可通过对话描述编辑需求',
      addMore: '➕ 添加更多图片',
      clearAll: '🗑️ 清空全部',
      selectFiles: '📁 选择图片文件'
    },

    // Quick Prompts
    quickPrompts: {
      title: '⚡ 灵感启发',
      subtitle: '点击下方标签快速开始创作',
      landscape: '风景',
      portrait: '人像',
      architecture: '建筑',
      art: '艺术',
      scifi: '科幻',
      nature: '自然',
      animal: '动物',
      creative: '创意'
    },

    // Editing Quick Prompts
    editingPrompts: {
      title: '🎨 编辑风格',
      subtitle: '选择编辑方式快速处理图片',
      beautify: '智能美化',
      styleTransfer: '风格转换',
      addElement: '添加元素',
      colorOptimize: '色彩优化',
      lightEnhance: '光影增强',
      repair: '智能修复',
      outfit: '穿搭分析',
      analyze: '详细分析'
    },

    // Text Input
    textInput: {
      title: 'AI 图像生成',
      subtitle: '描述你想要生成的图像',
      placeholder: '例如: 一只可爱的卡通猫咪，坐在彩虹上，梦幻风格，柔和的色彩...',
      editPlaceholder: '描述你想要的编辑效果...',
      editExample: '例如: 将图片转换为油画风格，增加暖色调，让画面更加生动...'
    },

    // AI Options
    aiOptions: {
      title: '✨ AI 图像编辑',
      styleLabel: '快速风格',
      enhance: '🔍 增强细节',
      artistic: '🎨 艺术风格',
      anime: '✨ 动漫风格',
      photo: '📷 写实照片',
      tip: '💡 提示：描述越详细，生成的图像越接近你的想象'
    },

    // Service Hint
    freeService: {
      title: '🎉 商业视觉生成',
      description: '输入产品信息与卖点，快速生成营销视觉素材'
    },

    // Generate Button
    generate: {
      generating: '生成中...',
      uploading: '上传中...',
      button: '🎨 开始生成',
      badge: '商业素材',
      requirement: '请输入至少 3 个字符的描述'
    },

    // Multi-Image Editing
    multiImage: {
      title: '🎨 多图智能编辑',
      features: '✨ 支持上传最多10张图片作为参考\n🎯 通过自然对话描述编辑需求\n🚀 AI智能理解并合成创意内容\n📸 可进行风格迁移、合成创作等多种操作',
      multiEdit: '✨ 多图编辑',
      styleTransfer: '🎨 风格迁移',
      composition: '🖼️ 图片合成',
      aiEnhance: '🚀 AI增强'
    },

    // Result
    result: {
      title: '🎉 生成结果',
      download: '💾 下载图片',
      share: '📤 分享图片',
      copy: '🔗 复制链接',
      copyText: '📋 复制文本',
      copied: '复制成功',
      copiedMessage: '图片链接已复制到剪贴板！'
    },

    // Share Modal
    share: {
      title: '分享图片',
      uploading: '正在上传图片...',
      uploadFailed: '上传失败',
      download: '下载图片',
      generateLink: '生成分享链接',
      linkReady: '链接已生成',
      linkCopied: '链接已复制到剪贴板！',
      directShare: '直接分享到',
      twitter: 'X (Twitter)',
      jike: '即刻',
      xiaohongshu: '小红书',
      bilibili: 'B站',
      douyin: '抖音',
      tiktok: 'TikTok',
      instagram: 'Instagram',
      howToUse: '使用说明',
      downloadFor: '下载图片后可分享到：',
      downloadPlatforms: '小红书、抖音、B站、Instagram、TikTok 等平台',
      linkFor: '生成链接后可用于：',
      linkPlatforms: 'X(Twitter)、即刻、微信、网页、论坛 等支持链接的平台'
    },

    // Error Messages
    error: {
      title: '生成失败',
      uploadFailed: '上传失败',
      uploadFailedMessage: '图片上传失败，请重试',
      fileTypeError: '文件类型错误',
      fileTypeErrorMessage: '请上传图片文件',
      inputTip: '输入提示',
      inputTipMessage: '请输入至少3个字符的描述',
      uploadTip: '上传提示',
      uploadTipMessage: '请先上传图片',
      uploadingTip: '图片正在上传中，请稍候...',
      maxFiles: '最多只能上传10张图片',
      close: '关闭'
    },

    // Examples Section
    examples: {
      title: '🎨 使用示例',
      textToImage: {
        title: '✨ 文生图示例',
        prompt: '提示词：',
        promptExample: '"一只可爱的橘猫坐在窗台上，阳光透过窗户洒在它身上，温暖的午后时光"',
        style: '风格：',
        styleValue: '写实照片',
        count: '生成数量：',
        countValue: '1张'
      },
      imageEdit: {
        title: '🖼️ 图片编辑示例',
        operation: '操作：',
        step1: '1. 上传一张人物照片',
        step2: '2. 输入："把背景换成星空，添加魔法光效"',
        style: '风格：',
        styleValue: '艺术风格'
      },
      tips: {
        title: '💡 提示词技巧',
        good: '✅ 好的提示词：',
        goodTips: '描述具体细节：颜色、光线、构图\n指定风格：写实、动漫、油画等\n添加情感：温暖、神秘、活力等\n描述环境：室内、户外、特定场景',
        avoid: '❌ 避免：',
        avoidTips: '过于简单："猫"\n过于复杂：超长描述\n模糊概念：没有具体描述\n敏感内容：违规或不当内容'
      },
      templates: {
        title: '📝 常用提示词模板',
        landscape: '🏞️ 风景类：',
        landscapeExample: '"壮丽的山脉日出，金色阳光穿透云层，前景有清澈的湖水倒影，4K超高清"',
        portrait: '👤 人像类：',
        portraitExample: '"专业商务女性肖像，自然光线，现代办公室背景，专业摄影，高清细节"',
        art: '🎨 艺术类：',
        artExample: '"抽象几何艺术，鲜艳色彩搭配，现代艺术风格，高对比度，创意构图"',
        scifi: '🚀 科幻类：',
        scifiExample: '"未来城市天际线，霓虹灯光，飞行汽车，赛博朋克风格，夜景，高科技感"'
      }
    }
  },

  en: {
    // Header
    header: {
      title: 'YuanTu Engine - AI Commercial Visual Engine',
      subtitle: 'Commercial Visual Generation',
      poweredBy: 'Powered by YuanTu Engine',
      noLogin: 'Quick Trial',
      unlimited: 'Unlimited Generation'
    },

    // Mode Selector
    mode: {
      upload: '📷 Edit Images via Conversation',
      text: '✨ Text-to-Image Mode'
    },

    // Model Selector
    model: {
      label: 'AI Model:',
      gemini3pro: '🚀 YuanTu Flagship (Gemini 3 Pro)',
      gemini: '🤖 Gemini 2.5 Flash',
      openai: '🖼️ OpenAI GPT Image 2',
      doubao: '🚧 Doubao Model (Coming Soon)',
      doubaoTip: 'Doubao model is under development, stay tuned! Please use YuanTu Flagship (Gemini 3 Pro) model for now.',
      size: 'Size:'
    },

    // Upload Area
    upload: {
      title: 'Drag & drop images here or click to upload',
      uploading: 'Uploading images...',
      uploadingDesc: 'Please wait, processing your images',
      tips: '💡 Support multiple uploads, up to 10 images\n📏 Max 10MB per file\n🎨 Supports PNG, JPG, JPEG, WebP, GIF\n🔄 Describe editing requirements after upload',
      addMore: '➕ Add More Images',
      clearAll: '🗑️ Clear All',
      selectFiles: '📁 Select Image Files'
    },

    // Quick Prompts
    quickPrompts: {
      title: '⚡ Inspiration',
      subtitle: 'Click tags below to start creating',
      landscape: 'Landscape',
      portrait: 'Portrait',
      architecture: 'Architecture',
      art: 'Art',
      scifi: 'Sci-Fi',
      nature: 'Nature',
      animal: 'Animal',
      creative: 'Creative'
    },

    // Editing Quick Prompts
    editingPrompts: {
      title: '🎨 Editing Styles',
      subtitle: 'Select editing methods to process images quickly',
      beautify: 'Smart Beautify',
      styleTransfer: 'Style Transfer',
      addElement: 'Add Elements',
      colorOptimize: 'Color Optimize',
      lightEnhance: 'Light Enhance',
      repair: 'Smart Repair',
      outfit: 'Outfit Analysis',
      analyze: 'Detailed Analysis'
    },

    // Text Input
    textInput: {
      title: 'AI Image Generation',
      subtitle: 'Describe the image you want to generate',
      placeholder: 'E.g., A cute cartoon cat sitting on a rainbow, dreamy style, soft colors...',
      editPlaceholder: 'Describe the editing effects you want...',
      editExample: 'E.g., Convert the image to oil painting style, add warm tones, make it more vivid...'
    },

    // AI Options
    aiOptions: {
      title: '✨ AI Image Editing',
      styleLabel: 'Quick Styles',
      enhance: '🔍 Enhance Details',
      artistic: '🎨 Artistic Style',
      anime: '✨ Anime Style',
      photo: '📷 Realistic Photo',
      tip: '💡 Tip: More detailed descriptions lead to better results'
    },

    // Service Hint
    freeService: {
      title: '🎉 Commercial Visual Generation',
      description: 'Enter product information and selling points to create marketing visuals'
    },

    // Generate Button
    generate: {
      generating: 'Generating...',
      uploading: 'Uploading...',
      button: '🎨 Generate',
      badge: 'Commercial',
      requirement: 'Please enter at least 3 characters'
    },

    // Multi-Image Editing
    multiImage: {
      title: '🎨 Multi-Image Smart Editing',
      features: '✨ Upload up to 10 images as reference\n🎯 Describe editing needs naturally\n🚀 AI understands and synthesizes creative content\n📸 Style transfer, composition, and more',
      multiEdit: '✨ Multi-Image Edit',
      styleTransfer: '🎨 Style Transfer',
      composition: '🖼️ Image Composition',
      aiEnhance: '🚀 AI Enhance'
    },

    // Result
    result: {
      title: '🎉 Result',
      download: '💾 Download',
      share: '📤 Share',
      copy: '🔗 Copy Link',
      copyText: '📋 Copy Text',
      copied: 'Copied',
      copiedMessage: 'Image link copied to clipboard!'
    },

    // Share Modal
    share: {
      title: 'Share Image',
      uploading: 'Uploading image...',
      uploadFailed: 'Upload failed',
      download: 'Download Image',
      generateLink: 'Generate Share Link',
      linkReady: 'Link ready',
      linkCopied: 'Link copied to clipboard!',
      directShare: 'Share Directly to',
      twitter: 'X (Twitter)',
      jike: 'Jike',
      xiaohongshu: 'Xiaohongshu',
      bilibili: 'Bilibili',
      douyin: 'Douyin',
      tiktok: 'TikTok',
      instagram: 'Instagram',
      howToUse: 'How to Use',
      downloadFor: 'Download image to share on:',
      downloadPlatforms: 'Xiaohongshu, Douyin, Bilibili, Instagram, TikTok, etc.',
      linkFor: 'Generated link can be used on:',
      linkPlatforms: 'X(Twitter), Jike, WeChat, Websites, Forums, etc.'
    },

    // Error Messages
    error: {
      title: 'Generation Failed',
      uploadFailed: 'Upload Failed',
      uploadFailedMessage: 'Image upload failed, please retry',
      fileTypeError: 'File Type Error',
      fileTypeErrorMessage: 'Please upload image files',
      inputTip: 'Input Required',
      inputTipMessage: 'Please enter at least 3 characters',
      uploadTip: 'Upload Required',
      uploadTipMessage: 'Please upload an image first',
      uploadingTip: 'Images are being uploaded, please wait...',
      maxFiles: 'Maximum 10 images allowed',
      close: 'Close'
    },

    // Examples Section
    examples: {
      title: '🎨 Usage Examples',
      textToImage: {
        title: '✨ Text-to-Image Example',
        prompt: 'Prompt:',
        promptExample: '"A cute orange cat sitting on a windowsill, sunlight streaming through the window, warm afternoon moment"',
        style: 'Style:',
        styleValue: 'Realistic Photo',
        count: 'Count:',
        countValue: '1 image'
      },
      imageEdit: {
        title: '🖼️ Image Editing Example',
        operation: 'Operation:',
        step1: '1. Upload a portrait photo',
        step2: '2. Enter: "Change background to starry sky, add magical light effects"',
        style: 'Style:',
        styleValue: 'Artistic Style'
      },
      tips: {
        title: '💡 Prompt Tips',
        good: '✅ Good Prompts:',
        goodTips: 'Describe specific details: colors, lighting, composition\nSpecify style: realistic, anime, oil painting, etc.\nAdd emotions: warm, mysterious, energetic, etc.\nDescribe environment: indoor, outdoor, specific scenes',
        avoid: '❌ Avoid:',
        avoidTips: 'Too simple: "cat"\nToo complex: extremely long descriptions\nVague concepts: no specific description\nSensitive content: inappropriate or violating content'
      },
      templates: {
        title: '📝 Common Prompt Templates',
        landscape: '🏞️ Landscape:',
        landscapeExample: '"Majestic mountain sunrise, golden sunlight through clouds, clear lake reflection in foreground, 4K ultra HD"',
        portrait: '👤 Portrait:',
        portraitExample: '"Professional business woman portrait, natural lighting, modern office background, professional photography, high detail"',
        art: '🎨 Art:',
        artExample: '"Abstract geometric art, vibrant color matching, modern art style, high contrast, creative composition"',
        scifi: '🚀 Sci-Fi:',
        scifiExample: '"Futuristic city skyline, neon lights, flying cars, cyberpunk style, night scene, high-tech feel"'
      }
    }
  }
} as const

export type Language = keyof typeof translations
export type TranslationKeys = typeof translations.zh
