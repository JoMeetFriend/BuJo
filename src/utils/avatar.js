export function toAvatarSrc(url, apiBaseUrl = import.meta.env.VITE_API_URL || '') {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }
  if (!url.startsWith('/') || !apiBaseUrl) return url

  return `${apiBaseUrl.replace(/\/+$/, '')}${url}`
}
