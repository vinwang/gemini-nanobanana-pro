import './globals.css'
import { LanguageProvider } from './i18n/LanguageContext'
import AdsterraDirectLink from './components/AdsterraDirectLink'
import SmartlinksAd from './components/SmartlinksAd'

export const metadata = {
  title: '元图引擎 · AI商业视觉引擎',
  description: '元界跃迁自研AI智能体元图引擎，专为品牌营销与电商场景打造，快速生成白底图、场景图、海报等商业视觉素材。',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    other: [
      { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', url: '/icon-192.png', sizes: '192x192' }
    ]
  },
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  colorScheme: 'light',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID
  const adsterraEnabled = process.env.NEXT_PUBLIC_ADSTERRA_ENABLED === 'true'
  const smartlinksEnabled = process.env.NEXT_PUBLIC_SMARTLINKS_ENABLED === 'true'
  const isProduction = process.env.NODE_ENV === 'production'
  const isValidAdsenseId = adsenseId && adsenseId !== 'ca-pub-xxxxxxxxxxxxxxxxx' && adsenseId !== 'ca-pub-1500176085727924'

  return (
    <html lang="zh">
      <head>
        {/* Google AdSense 脚本 - 仅在生产环境且有效ID时加载 */}
        {isProduction && isValidAdsenseId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}

        {/* Adsterra 脚本 - 仅在生产环境且启用时加载 */}
        {isProduction && adsterraEnabled && (
          <script
            async
            src="//pl22089466.highrevenuenetwork.com/invoke.js"
          />
        )}
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        {/* Adsterra Direct Link 广告 */}
        <AdsterraDirectLink />

        {/* Smartlinks 广告 */}
        <SmartlinksAd />
      </body>
    </html>
  )
}
