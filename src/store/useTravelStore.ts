import { create } from 'zustand'
import type {
  Checklist,
  Settings,
  TravelData,
  TravelDocument,
  TravelEvent,
  Trip,
  TripSummary,
} from '@/domain/types'
import { createEmptyData, createEvent, EMPTY_FILTERS, type EventFilters } from '@/domain/calc'
import { createSampleData } from '@/domain/sample'
import { STORAGE_PREFIX } from '@/domain/constants'
import { currentUserId } from '@/services/auth'
import { storageForUser, type StorageAdapter } from '@/storage'
import { clearShareHash, readSharedTripFromLocation } from '@/services/share'
import { uid } from '@/lib/utils'

export type Section = 'home' | 'calendar' | 'costs' | 'documents' | 'checklist' | 'settings'
export type CalView = 'agenda' | 'day' | 'week' | 'month' | 'timeline'
export type RightTab = 'details' | 'editor' | 'costs'

interface State {
  ready: boolean
  data: TravelData
  library: TripSummary[]
  notice: { kind: 'info' | 'error'; text: string } | null

  section: Section
  calView: CalView
  rightTab: RightTab
  selectedEventId: string | null
  draft: TravelEvent | null
  filters: EventFilters
  focusDate: string | null
  tripDialog: 'create' | 'edit' | null

  init: () => Promise<void>
  setNotice: (n: State['notice']) => void
  setSection: (s: Section) => void
  setCalView: (v: CalView) => void
  setRightTab: (t: RightTab) => void
  setFilters: (f: Partial<EventFilters>) => void
  resetFilters: () => void
  setTripDialog: (d: State['tripDialog']) => void
  focusOn: (date: string) => void

  selectEvent: (id: string | null) => void
  startDraft: (start?: string, end?: string, allDay?: boolean) => void
  cancelDraft: () => void

  createTrip: (t: Partial<Trip>) => void
  updateTrip: (t: Partial<Trip>) => void
  deleteTrip: (id: string) => Promise<void>
  switchTrip: (id: string) => Promise<void>
  importData: (data: TravelData) => void

  upsertEvent: (e: TravelEvent) => void
  duplicateEvent: (id: string) => void
  deleteEvent: (id: string) => void
  toggleFavorite: (id: string) => void

  addDocuments: (docs: TravelDocument[]) => void
  updateDocument: (id: string, patch: Partial<TravelDocument>) => void
  removeDocument: (id: string) => void

  addChecklist: (title: string) => void
  updateChecklist: (id: string, patch: Partial<Checklist>) => void
  removeChecklist: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  addTag: (tag: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
let activeStorage: StorageAdapter | null = null
let activeUserId: string | null = null

const scopedKey = (suffix: string): string => `${STORAGE_PREFIX}:user:${activeUserId}:${suffix}`

function requireStorage(): StorageAdapter {
  if (!activeStorage) throw new Error('A sessão do usuário ainda não foi inicializada.')
  return activeStorage
}

export const useTravelStore = create<State>((set, get) => {
  /** Aplica uma mudança no documento único e agenda a persistência. */
  const commit = (updater: (d: TravelData) => TravelData): void => {
    set((s) => ({ data: updater(s.data) }))
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void persistNow(), 250)
  }

  const persistNow = async (): Promise<void> => {
    clearTimeout(saveTimer)
    try {
      await requireStorage().save(get().data)
      set({ library: await requireStorage().list() })
    } catch (err) {
      set({ notice: { kind: 'error', text: err instanceof Error ? err.message : 'Falha ao salvar.' } })
    }
  }

  const activate = async (data: TravelData): Promise<void> => {
    localStorage.setItem(scopedKey('active'), data.trip.id)
    set({ data, selectedEventId: null, draft: null, filters: EMPTY_FILTERS, focusDate: data.trip.startDate })
    await persistNow()
  }

  return {
    ready: false,
    data: createEmptyData(),
    library: [],
    notice: null,
    section: 'calendar',
    calView: 'week',
    rightTab: 'details',
    selectedEventId: null,
    draft: null,
    filters: EMPTY_FILTERS,
    focusDate: null,
    tripDialog: null,

    init: async () => {
      const userId = currentUserId()
      if (!userId) {
        set({ ready: true, notice: { kind: 'error', text: 'Sessão inválida. Entre novamente.' } })
        return
      }
      activeUserId = userId
      activeStorage = storageForUser(userId)
      set({ calView: (localStorage.getItem(scopedKey('calview')) as CalView | null) ?? 'week' })

      let library = await requireStorage().list()
      let shared: TravelData | null = null
      try {
        shared = readSharedTripFromLocation()
      } catch (err) {
        set({ notice: { kind: 'error', text: err instanceof Error ? err.message : 'Link inválido.' } })
        clearShareHash()
      }
      if (shared) {
        const exists = library.some((t) => t.id === shared!.trip.id)
        const data = exists ? { ...shared, trip: { ...shared.trip, id: uid('trip') } } : shared
        clearShareHash()
        await requireStorage().save(data)
        localStorage.setItem(scopedKey('active'), data.trip.id)
        library = await requireStorage().list()
        set({ notice: { kind: 'info', text: `Viagem "${data.trip.title}" restaurada a partir do link.` } })
      } else if (library.length === 0) {
        await requireStorage().save(createSampleData())
        library = await requireStorage().list()
      }
      const wanted = localStorage.getItem(scopedKey('active'))
      const id = library.find((t) => t.id === wanted)?.id ?? library[0]?.id
      const data = id ? await requireStorage().load(id) : null
      const finalData = data ?? createEmptyData()
      set({ library, data: finalData, ready: true, focusDate: finalData.trip.startDate })
      localStorage.setItem(scopedKey('active'), finalData.trip.id)
    },

    setNotice: (notice) => set({ notice }),
    setSection: (section) => set({ section }),
    setCalView: (calView) => {
      if (activeUserId) localStorage.setItem(scopedKey('calview'), calView)
      set({ calView })
    },
    setRightTab: (rightTab) => set({ rightTab }),
    setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
    resetFilters: () => set({ filters: EMPTY_FILTERS }),
    setTripDialog: (tripDialog) => set({ tripDialog }),
    focusOn: (focusDate) => set({ focusDate }),

    selectEvent: (id) =>
      set({ selectedEventId: id, draft: null, rightTab: 'details' }),
    startDraft: (start, end, allDay) => {
      const draft = createEvent(get().data.trip, start, end, allDay)
      set({ draft, selectedEventId: null, rightTab: 'editor' })
    },
    cancelDraft: () => set({ draft: null, selectedEventId: null }),

    createTrip: (t) => {
      void (async () => {
        await persistNow()
        const data = createEmptyData(t)
        await activate(data)
        set({ section: 'calendar' })
      })()
    },
    updateTrip: (t) => commit((d) => ({ ...d, trip: { ...d.trip, ...t } })),
    deleteTrip: async (id) => {
      await requireStorage().remove(id)
      let library = await requireStorage().list()
      let next = library[0] ? await requireStorage().load(library[0].id) : null
      if (!next) {
        next = createEmptyData({ title: 'Minha viagem' })
        await requireStorage().save(next)
        library = await requireStorage().list()
      }
      set({ library })
      await activate(next)
    },
    switchTrip: async (id) => {
      if (id === get().data.trip.id) return
      await persistNow()
      const data = await requireStorage().load(id)
      if (data) {
        await activate(data)
        set({ section: 'calendar' })
      }
    },
    importData: (incoming) => {
      void (async () => {
        await persistNow()
        const data = { ...incoming, trip: { ...incoming.trip, id: uid('trip') } }
        await activate(data)
        set({ section: 'calendar', notice: { kind: 'info', text: `Viagem "${data.trip.title}" importada como uma cópia.` } })
      })()
    },

    upsertEvent: (e) => {
      commit((d) => {
        const exists = d.events.some((x) => x.id === e.id)
        return { ...d, events: exists ? d.events.map((x) => (x.id === e.id ? e : x)) : [...d.events, e] }
      })
      set({ draft: null, selectedEventId: e.id, rightTab: 'details' })
    },
    duplicateEvent: (id) => {
      const original = get().data.events.find((e) => e.id === id)
      if (!original) return
      const copy: TravelEvent = {
        ...original,
        id: uid('evt'),
        title: `${original.title} (cópia)`,
        tags: [...original.tags],
        metadata: { ...original.metadata },
      }
      commit((d) => ({ ...d, events: [...d.events, copy] }))
      // A cópia começa sem documentos associados e sem favorito.
      set({ draft: null, selectedEventId: copy.id, rightTab: 'details' })
    },
    deleteEvent: (id) => {
      commit((d) => ({
        ...d,
        events: d.events.filter((e) => e.id !== id),
        documents: d.documents.map((doc) => (doc.eventId === id ? { ...doc, eventId: null } : doc)),
        settings: { ...d.settings, favorites: d.settings.favorites.filter((f) => f !== id) },
      }))
      set({ selectedEventId: null, draft: null })
    },
    toggleFavorite: (id) =>
      commit((d) => {
        const fav = d.settings.favorites
        return {
          ...d,
          settings: { ...d.settings, favorites: fav.includes(id) ? fav.filter((f) => f !== id) : [...fav, id] },
        }
      }),

    addDocuments: (docs) => commit((d) => ({ ...d, documents: [...d.documents, ...docs] })),
    updateDocument: (id, patch) =>
      commit((d) => ({ ...d, documents: d.documents.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    removeDocument: (id) => commit((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== id) })),

    addChecklist: (title) =>
      commit((d) => ({ ...d, checklists: [...d.checklists, { id: uid('chk'), title, items: [] }] })),
    updateChecklist: (id, patch) =>
      commit((d) => ({ ...d, checklists: d.checklists.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    removeChecklist: (id) => commit((d) => ({ ...d, checklists: d.checklists.filter((c) => c.id !== id) })),

    updateSettings: (patch) => commit((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    addTag: (tag) => {
      const t = tag.trim()
      if (!t) return
      commit((d) =>
        d.settings.customTags.includes(t) ? d : { ...d, settings: { ...d.settings, customTags: [...d.settings.customTags, t] } },
      )
    },
  }
})

export function allTags(settings: Settings, defaults: string[]): string[] {
  return [...defaults, ...settings.customTags.filter((t) => !defaults.includes(t))]
}

// Garante a gravação ao fechar a aba.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const { ready, data } = useTravelStore.getState()
    if (ready) void activeStorage?.save(data)
  })
}
