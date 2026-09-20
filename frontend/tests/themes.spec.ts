import { test, expect } from '@playwright/test'

test.describe('Autenticación y Sistema Multi-Tema (Playwright E2E)', () => {
  test('1. Inicio de sesión con Credencial Médica y navegación a Cola/Triaje', async ({ page }) => {
    await page.goto('/login')

    // Llenar credenciales de administrador
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')

    // Click en botón de iniciar sesión
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')

    // Esperar navegación fuera de login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
    expect(page.url()).not.toContain('/login')
  })

  test('2. Inicio de sesión con PIN de contingencia (1234)', async ({ page }) => {
    await page.goto('/login')

    // Cambiar a pestaña Guardia / PIN Rápido
    await page.click('button:has-text("Guardia / PIN Rápido")')

    // Click en chip de acceso rápido para 1234 (Admin)
    const presetBtn = page.locator('button:has-text("1234")')
    await expect(presetBtn).toBeVisible({ timeout: 5000 })
    await presetBtn.click()

    // Submit PIN
    await page.click('button:has-text("Acceso Urgente Sin Conexión")')

    // Esperar navegación exitosa
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
    expect(page.url()).not.toContain('/login')
  })

  test('3. Cambio dinámico de temas: Clinic -> Clinica Glass -> Cyberpunk', async ({ page }) => {
    // Login primero
    await page.goto('/login')
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })

    // Abrir menú de usuario en la barra superior
    const userMenuTrigger = page.locator('div[title="Abrir menú de usuario"]')
    await userMenuTrigger.click()

    // Verificar que el menú desplegable esté abierto con la sección Tema Visual
    await expect(page.locator('text=Tema Visual')).toBeVisible()

    // ── Probar Tema: Clinica Glass ──────────────────────────────
    const glassBtn = page.locator('button:has-text("Glassmorphism")')
    await expect(glassBtn).toBeVisible()
    await glassBtn.click()

    // Validar atributo data-theme y que el Dock con Píldora Fluida esté visible
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')
    await expect(page.locator('nav[aria-label*="Píldora Fluida"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_clinica_glass.png', fullPage: true })

    // ── Probar Tema: Cyberpunk (abrir menú en GlassHeader) ───────
    await page.locator('div[title="Abrir menú de usuario"]').click()
    const cyberpunkBtn = page.locator('button:has-text("Dark Synth")')
    await expect(cyberpunkBtn).toBeVisible()
    await cyberpunkBtn.click()

    // Validar atributo data-theme, clase dark y que el Dock Neón esté visible
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('nav[aria-label*="Píldora Neón"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk.png', fullPage: true })

    // ── Probar Tema: Clinic (abrir menú en CyberHeader) ──────────
    await page.locator('div[title="Abrir menú de usuario"]').click()
    const clinicBtn = page.locator('button:has-text("IBM Carbon")')
    await expect(clinicBtn).toBeVisible()
    await clinicBtn.click()

    // Validar atributo data-theme y que regrese a Clinic
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinic')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.screenshot({ path: 'tests/screenshots/theme_clinic.png', fullPage: true })

    // ── Probar Persistencia en localStorage tras recarga F5 ─────
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Glassmorphism")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')
    await expect(page.locator('nav[aria-label*="Píldora Fluida"]')).toBeVisible()
  })

  test('4. Pruebas de Interacción: Drawer deslizable y Botón Flotante Radial (FAB)', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })

    // Cambiar a Clinica Glass
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Glassmorphism")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')

    // 1. Probar Drawer en Clinica Glass
    const hamburgerGlass = page.locator('button[aria-label="Abrir Menú Clínico"]')
    await expect(hamburgerGlass).toBeVisible()
    await hamburgerGlass.click()

    // El drawer debe ser visible con sus enlaces y badge
    await expect(page.locator('text=Módulos de Campaña')).toBeVisible()
    await expect(page.locator('text=120 FPS Spring Phys')).toBeVisible()

    // Cerrar el drawer
    await page.locator('button[aria-label="Cerrar menú"]').click()
    await expect(page.locator('text=Módulos de Campaña')).not.toBeVisible()

    // 2. Probar FAB Radial en Clinica Glass
    const fabTrigger = page.locator('button[aria-label="Acciones Rápidas de Campo"]')
    await expect(fabTrigger).toBeVisible()
    await fabTrigger.click()

    // Subitems visibles
    await expect(page.locator('button:has-text("Triaje Vital")')).toBeVisible()
    await expect(page.locator('button:has-text("Ticket Térmico")')).toBeVisible()

    // Click en Ticket Térmico mediante el FAB
    await page.locator('button:has-text("Ticket Térmico")').click()
    await page.waitForURL((url) => url.pathname.includes('/tickets'), { timeout: 5000 })
    expect(page.url()).toContain('/tickets')

    // 3. Probar Drawer en Cyberpunk
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Dark Synth")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk')

    // Probar Drawer Cyberpunk
    const hamburgerCyber = page.locator('button[aria-label="Abrir Menú Cuántico"]')
    await expect(hamburgerCyber).toBeVisible()
    await hamburgerCyber.click()

    await expect(page.locator('text=NEXUS • SYNTH')).toBeVisible()
    await expect(page.locator('text=NEXUS-99 CORE')).toBeVisible()
    await page.locator('button[aria-label="Cerrar menú"]').click()
    await expect(page.locator('text=NEXUS-99 CORE')).not.toBeVisible()

    // 4. Probar Cyber FAB
    const cyberFabTrigger = page.locator('button[aria-label="Acciones Rápidas Synth"]')
    await expect(cyberFabTrigger).toBeVisible()
    await cyberFabTrigger.click()
    await expect(page.locator('button:has-text("Triaje Cuántico")')).toBeVisible()

    // Captura de pantalla de la estética interactiva
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_interactive.png', fullPage: true })
  })

  test('5. Verificación de Cero Duplicidad de Contenido en todos los temas', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })

    // Navegar a Telemetría (donde el usuario observó la duplicidad)
    await page.goto('/admin/telemetria')
    await page.waitForSelector('text=NOC-08')

    // 1. Probar en Clinica Glass
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Glassmorphism")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')

    // Validar que los encabezados y secciones existan EXACTAMENTE 1 VEZ (no duplicados)
    await expect(page.locator('text=NOC-08')).toHaveCount(1)
    await expect(page.locator('text=Topología de Estaciones en Campaña (P2P Local)')).toHaveCount(1)
    await expect(page.locator('text=Registro de Eventos y Sincronización en Tiempo Real')).toHaveCount(1)
    await page.screenshot({ path: 'tests/screenshots/telemetria_clinica_glass_sin_duplicidad.png', fullPage: true })

    // 2. Probar en Cyberpunk
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Dark Synth")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk')

    await expect(page.locator('text=NOC-08')).toHaveCount(1)
    await expect(page.locator('text=Topología de Estaciones en Campaña (P2P Local)')).toHaveCount(1)
    await expect(page.locator('text=Registro de Eventos y Sincronización en Tiempo Real')).toHaveCount(1)
    await page.screenshot({ path: 'tests/screenshots/telemetria_cyberpunk_sin_duplicidad.png', fullPage: true })

    // 3. Probar en Clinic
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("IBM Carbon")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinic')

    await expect(page.locator('text=NOC-08')).toHaveCount(1)
    await expect(page.locator('text=Topología de Estaciones en Campaña (P2P Local)')).toHaveCount(1)
    await expect(page.locator('text=Registro de Eventos y Sincronización en Tiempo Real')).toHaveCount(1)
  })
})
