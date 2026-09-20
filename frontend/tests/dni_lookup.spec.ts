import { test, expect } from '@playwright/test'

test.describe('Búsqueda de DNI y Validación RENIEC / Padrón Local', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[placeholder*="45892301"]', 'admin@semilla.pe')
    await page.fill('input[type="password"]', 'Admin2025!')
    await page.click('button:has-text("Iniciar Sesión e Ingresar al Puesto")')
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
  })

  test('1. Búsqueda por DNI carga los nombres y apellidos correctamente', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/admision')

    // Verificar que estamos en la página de admisión
    await expect(page.locator('h1')).toContainText('Registro de Beneficiario')

    // Localizar input de DNI y botón de búsqueda
    const dniInput = page.locator('input[placeholder*="8 dígitos"]')
    const searchBtn = page.locator('button:has-text("Buscar RENIEC")')

    // 1. Probar búsqueda con 45892104
    await dniInput.fill('45892104')
    await searchBtn.click()

    // Esperar mensaje de éxito
    await expect(page.locator('text=Identidad verificada')).toBeVisible({ timeout: 5000 })

    // Verificar que los campos de nombres y apellidos se auto-completaron
    const nombresInput = page.locator('input[value*="SANTOS FAUSTINO"]')
    const apellidosInput = page.locator('input[value*="QUISPE HUAMÁN"]')
    await expect(nombresInput).toBeVisible()
    await expect(apellidosInput).toBeVisible()

    // 2. Probar botón rápido de DNI: Rosa M. (02817462)
    const rosaBtn = page.locator('button:has-text("02817462")')
    await rosaBtn.click()

    // Esperar actualización
    await expect(page.locator('text=Identidad verificada')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[value="ROSA"]')).toBeVisible()
    await expect(page.locator('input[value="MAMANI QUISPE"]')).toBeVisible()

    // 3. Probar búsqueda con tecla Enter
    await dniInput.fill('42918274')
    await dniInput.press('Enter')

    await expect(page.locator('text=Identidad verificada')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[value="JUAN"]')).toBeVisible()
    await expect(page.locator('input[value="QUISPE CONDORI"]')).toBeVisible()

    // Capturar screenshot de éxito
    await page.screenshot({ path: 'tests/screenshots/dni_lookup_exitoso.png', fullPage: false })
  })
})
