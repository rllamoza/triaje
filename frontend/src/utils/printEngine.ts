/**
 * SEMILLA TRIAJE - Motor Universal de Impresión Térmica
 * Detecta inteligentemente el entorno del cliente (Windows, Android, iOS, Smartphone, Tablet)
 * y enruta la impresión al driver correcto de forma inmediata.
 */

export interface DeviceInfo {
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  isWindows: boolean
  isMac: boolean
  deviceType: 'Windows PC' | 'Android' | 'iPhone/iPad' | 'Mac' | 'Móvil / Tablet' | 'Escritorio'
  recommendedDriver: string
}

export function detectDevice(): DeviceInfo {
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || ''
  const isAndroid = /Android/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))
  const isMobile = isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  const isWindows = /Windows|Win32|Win64/i.test(ua)
  const isMac = !isIOS && /Macintosh|Mac OS X/i.test(ua)

  let deviceType: DeviceInfo['deviceType'] = 'Escritorio'
  let recommendedDriver = 'Driver Térmico Estándar'

  if (isAndroid) {
    deviceType = 'Android'
    recommendedDriver = 'Térmica Bluetooth / USB OTG (RawBT / Epson iPrint / Mopria)'
  } else if (isIOS) {
    deviceType = 'iPhone/iPad'
    recommendedDriver = 'AirPrint Térmico / Epson TM-T88 (Wi-Fi / BT)'
  } else if (isWindows) {
    deviceType = 'Windows PC'
    recommendedDriver = 'EPSON Advanced Printer Driver (TM-T88 USB/COM/Spooler)'
  } else if (isMac) {
    deviceType = 'Mac'
    recommendedDriver = 'Driver CUPS Epson TM-T88'
  } else if (isMobile) {
    deviceType = 'Móvil / Tablet'
    recommendedDriver = 'Servicio de Impresión Móvil'
  }

  return {
    isMobile,
    isAndroid,
    isIOS,
    isWindows,
    isMac,
    deviceType,
    recommendedDriver,
  }
}

/**
 * Imprime de forma inmediata y aislada el elemento térmico en el driver del dispositivo
 * (Sin imprimir la barra de navegación, menús ni el fondo de la página).
 */
export function printThermalElement(elementId = 'thermal-receipt-printable', paperWidth: '80mm' | '58mm' = '80mm'): Promise<boolean> {
  return new Promise((resolve) => {
    const targetElement = document.getElementById(elementId)
    if (!targetElement) {
      console.warn(`[PrintEngine] Elemento #${elementId} no encontrado. Intentando window.print()...`)
      window.print()
      resolve(true)
      return
    }

    const maxMm = paperWidth === '58mm' ? '54mm' : '78mm'

    // Crear un iframe invisible para aislar exclusivamente el ticket térmico
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('title', 'ThermalPrintFrame')
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      resolve(true)
      return
    }

    // Clonar estilos y fuentes del documento padre
    const headContent = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n')

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Ticket Clínico</title>
          ${headContent}
          <style>
            @page {
              size: ${paperWidth} auto;
              margin: 0mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .thermal-isolated-wrapper {
              width: ${maxMm} !important;
              max-width: ${maxMm} !important;
              margin: 0 auto !important;
              padding: 2mm 1.5mm !important;
              box-sizing: border-box !important;
              font-size: 13px;
              line-height: 1.35;
              color: #000000 !important;
              background: #ffffff !important;
            }
            .thermal-isolated-wrapper * {
              border-color: #000000 !important;
            }

            /* BLOQUES CON FONDO NEGRO: Fondo negro puro y texto 100% blanco nítido */
            .thermal-isolated-wrapper .thermal-inverted,
            .thermal-isolated-wrapper .ticket-inverted,
            .thermal-isolated-wrapper [class*="thermal-inverted"],
            .thermal-isolated-wrapper .bg-black,
            .thermal-isolated-wrapper .bg-\[\#000000\],
            .thermal-isolated-wrapper [class*="bg-black"],
            .thermal-isolated-wrapper [class*="bg-[#000000]"],
            .thermal-isolated-wrapper [style*="background-color: #000000"],
            .thermal-isolated-wrapper [style*="background-color:#000000"],
            .thermal-isolated-wrapper [style*="background-color: rgb(0, 0, 0)"],
            .thermal-isolated-wrapper [style*="background: #000000"],
            .thermal-isolated-wrapper [style*="background:#000000"],
            .thermal-isolated-wrapper [style*="background: rgb(0, 0, 0)"] {
              background-color: #000000 !important;
              background: #000000 !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* TODOS los textos e hijos dentro de bloques negros deben ser BLANCO PURO de alto contraste */
            .thermal-isolated-wrapper .thermal-inverted *,
            .thermal-isolated-wrapper .ticket-inverted *,
            .thermal-isolated-wrapper [class*="thermal-inverted"] *,
            .thermal-isolated-wrapper .bg-black *,
            .thermal-isolated-wrapper .bg-\[\#000000\] *,
            .thermal-isolated-wrapper [class*="bg-black"] *,
            .thermal-isolated-wrapper [class*="bg-[#000000]"] *,
            .thermal-isolated-wrapper [style*="background-color: #000000"] *,
            .thermal-isolated-wrapper [style*="background-color:#000000"] *,
            .thermal-isolated-wrapper [style*="background-color: rgb(0, 0, 0)"] *,
            .thermal-isolated-wrapper [style*="background: #000000"] *,
            .thermal-isolated-wrapper [style*="background:#000000"] *,
            .thermal-isolated-wrapper [style*="background: rgb(0, 0, 0)"] * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Elementos con clases o estilos de texto blanco explícito */
            .thermal-isolated-wrapper .text-white,
            .thermal-isolated-wrapper .text-\[\#ffffff\],
            .thermal-isolated-wrapper [class*="text-white"],
            .thermal-isolated-wrapper [class*="text-[#ffffff]"],
            .thermal-isolated-wrapper [style*="color: #ffffff"],
            .thermal-isolated-wrapper [style*="color:#ffffff"],
            .thermal-isolated-wrapper [style*="color: rgb(255, 255, 255)"] {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
            }
          </style>
        </head>
        <body>
          <div class="thermal-isolated-wrapper">
            ${targetElement.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    // Esperar a que las imágenes (QR, logos) se carguen y disparar impresión inmediata
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          resolve(true)
        }, 1500)
      } catch (err) {
        console.error('[PrintEngine] Falló print en iframe:', err)
        window.print()
        resolve(false)
      }
    }

    if (iframe.contentWindow) {
      iframe.contentWindow.onload = triggerPrint
      // Fallback de tiempo en caso de que onload no se dispare
      setTimeout(triggerPrint, 350)
    } else {
      window.print()
      resolve(true)
    }
  })
}
