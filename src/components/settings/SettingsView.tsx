import { useState } from 'react'
import { X } from 'lucide-react'
import { CURRENCIES } from '@/domain/constants'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form'
import { Tabs } from '@/components/ui/misc'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { useTravelStore } from '@/store/useTravelStore'
import { DataActions } from './DataActions'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' },
]

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const settings = useTravelStore((s) => s.data.settings)
  const trip = useTravelStore((s) => s.data.trip)
  const update = useTravelStore((s) => s.updateSettings)
  const addTag = useTravelStore((s) => s.addTag)
  const setTripDialog = useTravelStore((s) => s.setTripDialog)
  const [tag, setTag] = useState('')

  const foreign = CURRENCIES.filter((c) => c !== trip.currency)

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold">Configurações</h2>

      <section className="space-y-2" aria-labelledby="set-theme">
        <h3 id="set-theme" className="text-sm font-medium">
          Tema
        </h3>
        <Tabs items={THEMES} value={theme} onChange={setTheme} label="Tema" />
      </section>

      <section className="space-y-3" aria-labelledby="set-home">
        <h3 id="set-home" className="text-sm font-medium">
          Ponto de partida e chegada (timeline)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" htmlFor="home-city">
            <Input id="home-city" value={settings.homeCity} onChange={(e) => update({ homeCity: e.target.value })} />
          </Field>
          <Field label="País" htmlFor="home-country">
            <Input id="home-country" value={settings.homeCountry} onChange={(e) => update({ homeCountry: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="set-rates">
        <h3 id="set-rates" className="text-sm font-medium">
          Câmbio (para o Total Geral em {trip.currency})
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {foreign.map((c) => (
            <Field key={c} label={`1 ${c} =`} htmlFor={`rate-${c}`}>
              <Input
                id={`rate-${c}`}
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={settings.exchangeRates[c] ?? ''}
                onChange={(e) =>
                  update({ exchangeRates: { ...settings.exchangeRates, [c]: Math.max(0, Number(e.target.value) || 0) } })
                }
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Valores em {trip.currency}. Atualize manualmente conforme a cotação.</p>
      </section>

      <section className="space-y-2" aria-labelledby="set-tags">
        <h3 id="set-tags" className="text-sm font-medium">
          Tags personalizadas
        </h3>
        <ul className="flex flex-wrap gap-1.5">
          {settings.customTags.map((t) => (
            <li key={t} className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs">
              {t}
              <button
                type="button"
                aria-label={`Remover tag ${t}`}
                onClick={() => update({ customTags: settings.customTags.filter((x) => x !== t) })}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          {settings.customTags.length === 0 && <li className="text-xs text-muted-foreground">Nenhuma tag personalizada.</li>}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addTag(tag)
            setTag('')
          }}
        >
          <Input aria-label="Nova tag personalizada" placeholder="Nova tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          <Button type="submit" variant="outline">
            Adicionar
          </Button>
        </form>
      </section>

      <section className="space-y-2" aria-labelledby="set-data">
        <h3 id="set-data" className="text-sm font-medium">
          Dados
        </h3>
        <DataActions />
        <Button variant="ghost" className="px-0" onClick={() => setTripDialog('edit')}>
          Editar ou excluir esta viagem
        </Button>
      </section>
    </div>
  )
}
