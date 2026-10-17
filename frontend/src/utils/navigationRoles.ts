export function isRouteAllowedForRole(role: string | undefined, path: string): boolean {
  if (!role) return false
  if (role === 'admin') return true

  if (path === '/admision') {
    return role === 'admision' || role === 'acreditacion'
  }
  if (path === '/triaje') {
    return role === 'triaje'
  }
  if (path === '/consulta') {
    return role === 'medico'
  }
  if (path === '/queue' || path === '/cola') {
    return true
  }
  if (path === '/tickets') {
    return role === 'admision' || role === 'acreditacion' || role === 'triaje'
  }
  if (path.startsWith('/admin')) {
    return role === 'admin'
  }
  return true
}
