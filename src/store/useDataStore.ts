import { create } from 'zustand'
import type { Patient, DataStore } from '../types'

export const useDataStore = create<DataStore>((set) => ({
  patients: [],
  loadTimestamp: null,
  setData: (patients: Patient[], timestamp: Date) =>
    set({ patients, loadTimestamp: timestamp }),
  clearData: () => set({ patients: [], loadTimestamp: null }),
}))
