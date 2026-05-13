'use client'

import React from 'react'

interface FreeQuotaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FreeQuotaModal({ isOpen, onClose }: FreeQuotaModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid #333',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            lineHeight: 1,
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
        >
          ✕
        </button>

        {/* 图标 */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h3
            style={{
              fontSize: '1.75rem',
              color: '#ef4444',
              margin: '0 0 0.75rem 0',
              fontWeight: 'bold'
            }}
          >
            免费额度已耗尽
          </h3>
        </div>

        {/* 提示内容 */}
        <div
          style={{
            backgroundColor: '#0f1419',
            border: '1px solid #333',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <p
            style={{
              color: '#ccc',
              fontSize: '1rem',
              lineHeight: 1.6,
              margin: 0,
              textAlign: 'center'
            }}
          >
            您的免费使用额度已用完
            <br />
            如需继续使用，请前往获取 API 令牌
          </p>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a
            href="https://grsaiapi.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
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
            <span>🔑</span>
            <span>获取 API 令牌</span>
          </a>

          <button
            onClick={onClose}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: '#888',
              border: '1px solid #444',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#666'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444'
              e.currentTarget.style.color = '#888'
            }}
          >
            稍后再说
          </button>
        </div>

        {/* 帮助信息 */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#0f2419',
            border: '1px solid #10b981',
            borderRadius: '0.75rem'
          }}
        >
          <p
            style={{
              color: '#10b981',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              margin: 0,
              textAlign: 'center'
            }}
          >
            💡 获取 API 令牌后，可在设置中配置以继续使用
          </p>
        </div>
      </div>
    </div>
  )
}
