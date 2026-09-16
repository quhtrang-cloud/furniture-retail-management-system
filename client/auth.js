window.escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
}[char]))

window.logout = async () => {
  try {
    await fetch('/api/logout', { method: 'POST' })
  } finally {
    localStorage.clear()
    window.location.href = 'login.html'
  }
}

window.requireRole = async (...allowedRoles) => {
  const response = await fetch('/api/session')
  const { user } = await response.json()

  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = 'login.html'
    return null
  }

  localStorage.setItem('role', user.role)
  if (user.customer_id) localStorage.setItem('customer_id', user.customer_id)
  if (user.employee_id) localStorage.setItem('employee_id', user.employee_id)
  return user
}
