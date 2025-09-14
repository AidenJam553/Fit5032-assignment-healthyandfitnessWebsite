// 简化的Google OAuth实现
export function createSimpleGoogleLoginButton(elementId, clientId) {
  const button = document.getElementById(elementId)
  if (!button) {
    console.error(`Button element with id '${elementId}' not found`)
    return
  }
  
  if (!clientId) {
    console.error('Google Client ID not provided')
    button.innerHTML = `
      <div style="
        padding: 12px 16px; 
        border: 1px solid #d1d5db; 
        border-radius: 8px; 
        background: #f9fafb; 
        color: #6b7280; 
        text-align: center; 
        font-size: 14px;
      ">
        <div style="margin-bottom: 4px; font-weight: 600;">Google Sign-in not configured</div>
        <div style="font-size: 12px;">
          Set VITE_GOOGLE_CLIENT_ID in environment variables.
        </div>
      </div>
    `
    return
  }
  
  // 创建Google登录按钮
  button.innerHTML = `
    <button 
      type="button" 
      class="google-login-btn"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 48px;
        background: white;
        border: 1px solid #dadce0;
        border-radius: 8px;
        font-family: 'Google Sans', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #3c4043;
        cursor: pointer;
        transition: box-shadow 0.2s;
        margin-bottom: 16px;
      "
      onmouseover="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
      onmouseout="this.style.boxShadow='none'"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" style="margin-right: 12px;">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  `
  
  // 添加点击事件监听器
  const googleBtn = button.querySelector('.google-login-btn')
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      console.log('Google login button clicked')
      // 使用Google Identity Services
      if (window.google && window.google.accounts) {
        window.google.accounts.id.prompt()
      } else {
        // 如果Google Identity Services未加载，使用重定向方式
        const redirectUri = encodeURIComponent('http://localhost:5173/login')
        const scope = encodeURIComponent('openid email profile')
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${redirectUri}&` +
          `scope=${scope}&` +
          `response_type=code&` +
          `access_type=offline&` +
          `prompt=select_account&` +
          `state=google_oauth`
        
        console.log('Redirecting to Google OAuth:', authUrl)
        window.location.href = authUrl
      }
    })
  }
}

// 处理Google OAuth回调的简化版本
export async function handleSimpleGoogleCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const state = urlParams.get('state')
  
  console.log('=== Simple Google OAuth Callback ===')
  console.log('Code:', code ? 'Present' : 'Missing')
  console.log('Error:', error || 'None')
  console.log('State:', state || 'None')
  
  if (error) {
    console.error('Google OAuth error:', error)
    return { success: false, error: `Google OAuth error: ${error}` }
  }
  
  if (code && state === 'google_oauth') {
    try {
      console.log('Processing Google OAuth code...')
      
      const response = await fetch('http://localhost:5175/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', errorText)
        return { success: false, error: `API error: ${response.status} ${errorText}` }
      }
      
      const result = await response.json()
      console.log('API result:', result)
      
      if (result.ok) {
        localStorage.setItem('currentUser', JSON.stringify(result.user))
        window.history.replaceState({}, document.title, window.location.pathname)
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Network error:', err)
      return { success: false, error: `Network error: ${err.message}` }
    }
  }
  
  return { success: false, error: null }
}
