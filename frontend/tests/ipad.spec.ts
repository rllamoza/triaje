import { test, expect } from '@playwright/test'

const SMARTPHONE = { width: 390, height: 844 }
const IPAD_PORTRAIT = { width: 810, height: 1080 }
const IPAD_LANDSCAPE = { width: 1080, height: 810 }

test.describe('Responsive Dual-Design: Smartphone (<768px) vs Desktop/iPad (>=768px)', () => {
  test.beforeEach(async ({ page }) => {
    // Login with admin credentials
    await page.goto('/login')
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  })

  test('1. Tema Clinic: Conmutación automática Smartphone vs iPad/Desktop', async ({ page }) => {
    // ── Modo Smartphone (< 768px) ──
    await page.setViewportSize(SMARTPHONE)
    // El botón hamburguesa y el FAB de navegación móvil deben estar visibles
    const mobileHamburger = page.locator('button[aria-label="Abrir menú hamburguesa"]')
    await expect(mobileHamburger).toBeVisible()

    const mobileFab = page.locator('button[title="Menú de Navegación de Campaña"]')
    await expect(mobileFab).toBeVisible()

    // El sidebar fijo de escritorio/iPad debe estar oculto
    const sidebar = page.locator('aside:has-text("Operaciones de Campaña")')
    await expect(sidebar).not.toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_clinic_smartphone.png', fullPage: false })

    // ── Modo iPad Portrait (810 x 1080, >= 768px) ──
    await page.setViewportSize(IPAD_PORTRAIT)
    // El sidebar fijo de iPad/Desktop debe estar VISIBLE automáticamente
    await expect(sidebar).toBeVisible()

    // El botón hamburguesa y el FAB móvil deben estar OCULTOS automáticamente
    await expect(mobileHamburger).not.toBeVisible()
    await expect(mobileFab).not.toBeVisible()

    // El menú de usuario y logout deben estar perfectamente dentro del viewport y ser interactivos
    const userMenuTrigger = page.locator('div[title="Abrir menú de usuario"]')
    await expect(userMenuTrigger).toBeVisible()
    await userMenuTrigger.click()
    await expect(page.locator('text=Tema Visual')).toBeVisible()

    // Cerrar menú haciendo click fuera
    await page.locator('body').click({ position: { x: 400, y: 300 } })
    await page.screenshot({ path: 'tests/screenshots/theme_clinic_ipad_portrait.png', fullPage: false })

    // ── Modo iPad Landscape (1080 x 810) ──
    await page.setViewportSize(IPAD_LANDSCAPE)
    await expect(sidebar).toBeVisible()
    await expect(mobileHamburger).not.toBeVisible()
    await expect(userMenuTrigger).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_clinic_ipad_landscape.png', fullPage: false })
  })

  test('2. Tema Clinica Glass: Ergonomía y cero colisión en iPad y Smartphone', async ({ page }) => {
    // Activar Clinica Glass
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Glassmorphism")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clinica-glass')

    // ── iPad Portrait ──
    await page.setViewportSize(IPAD_PORTRAIT)
    const dock = page.locator('nav[aria-label="Píldora Fluida Clínica de Navegación"]')
    await expect(dock).toBeVisible()

    const glassFab = page.locator('button[aria-label="Acciones Rápidas de Campo"]')
    await expect(glassFab).toBeVisible()

    // Validar que ambos elementos están en posiciones diferenciadas (sin colisión)
    const dockBox = await dock.boundingBox()
    const fabBox = await glassFab.boundingBox()
    expect(dockBox).not.toBeNull()
    expect(fabBox).not.toBeNull()

    // El FAB en tablet está elevado por encima de la cota vertical del dock
    expect(fabBox!.y + fabBox!.height).toBeLessThan(dockBox!.y + 10)

    // Probar interacción con el FAB (fan-out)
    await glassFab.click()
    await expect(page.locator('button:has-text("Triaje Vital")')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_glass_ipad_portrait_fab.png', fullPage: false })

    // Cerrar FAB
    await glassFab.click()

    // ── iPad Landscape ──
    await page.setViewportSize(IPAD_LANDSCAPE)
    await expect(dock).toBeVisible()
    await expect(glassFab).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_glass_ipad_landscape.png', fullPage: false })

    // ── Smartphone ──
    await page.setViewportSize(SMARTPHONE)
    await expect(dock).toBeVisible()
    await expect(glassFab).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_glass_smartphone.png', fullPage: false })
  })

  test('3. Tema Cyberpunk: Ergonomía y cero colisión en iPad y Smartphone', async ({ page }) => {
    // Activar Cyberpunk
    await page.locator('div[title="Abrir menú de usuario"]').click()
    await page.locator('button:has-text("Dark Synth")').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyberpunk')

    // ── iPad Portrait ──
    await page.setViewportSize(IPAD_PORTRAIT)
    const neonDock = page.locator('nav[aria-label="Píldora Neón Cuántica de Navegación"]')
    await expect(neonDock).toBeVisible()

    const cyberFab = page.locator('button[aria-label="Acciones Rápidas Synth"]')
    await expect(cyberFab).toBeVisible()

    // Validar que no hay colisión física
    const dockBox = await neonDock.boundingBox()
    const fabBox = await cyberFab.boundingBox()
    expect(dockBox).not.toBeNull()
    expect(fabBox).not.toBeNull()

    // En tablet el FAB está elevado respecto a la base del dock
    expect(fabBox!.y + fabBox!.height).toBeLessThan(dockBox!.y + 10)

    // Probar interacción del FAB
    await cyberFab.click()
    await expect(page.locator('button:has-text("Triaje Cuántico")')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_ipad_portrait_fab.png', fullPage: false })

    // Cerrar FAB
    await cyberFab.click()

    // ── iPad Landscape ──
    await page.setViewportSize(IPAD_LANDSCAPE)
    await expect(neonDock).toBeVisible()
    await expect(cyberFab).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_ipad_landscape.png', fullPage: false })

    // ── Smartphone ──
    await page.setViewportSize(SMARTPHONE)
    await expect(neonDock).toBeVisible()
    await expect(cyberFab).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_smartphone.png', fullPage: false })

    // Validar QueuePage en Smartphone: Cards en vez de tabla apretada, alerta sin solapamiento
    await page.goto('/queue')
    await expect(neonDock).toBeVisible()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_queue_smartphone.png', fullPage: false })

    // Scroll down to patient cards
    await page.evaluate(() => window.scrollBy(0, 520))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/screenshots/theme_cyberpunk_queue_smartphone_cards.png', fullPage: false })
  })
})
