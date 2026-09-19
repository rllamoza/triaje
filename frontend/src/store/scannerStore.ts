import { create } from 'zustand'
import type { DetailedPatient } from '../services/patientRegistry'
import { parsePatientFromQr } from '../services/patientRegistry'

interface ScannerState {
  isScannerOpen: boolean
  scannedPatient: DetailedPatient | null
  openScanner: () => void
  closeScanner: () => void
  handleScannedData: (rawData: string) => DetailedPatient | null
  showPatientDetail: (patient: DetailedPatient) => void
  closePatientDetail: () => void
}

export const useScannerStore = create<ScannerState>((set) => ({
  isScannerOpen: false,
  scannedPatient: null,
  openScanner: () => set({ isScannerOpen: true }),
  closeScanner: () => set({ isScannerOpen: false }),
  handleScannedData: (rawData: string) => {
    const patient = parsePatientFromQr(rawData)
    if (patient) {
      set({ isScannerOpen: false, scannedPatient: patient })
      return patient
    }
    return null
  },
  showPatientDetail: (patient: DetailedPatient) =>
    set({ scannedPatient: patient, isScannerOpen: false }),
  closePatientDetail: () => set({ scannedPatient: null }),
}))
