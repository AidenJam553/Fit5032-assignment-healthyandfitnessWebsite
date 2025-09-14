// 简化的Google OAuth实现
export function initializeGoogleAuth(clientId, callback) {
  // 加载Google Identity Services
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  
  script.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: callback,
        auto_select: false,
        cancel_on_tap_outside: true
      })
    }
  }
  
  document.head.appendChild(script)
}

export function renderGoogleButton(elementId, options = {}) {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: 300,
        ...options
      }
    )
  }
}

export function promptGoogleLogin() {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.prompt()
  }
}

