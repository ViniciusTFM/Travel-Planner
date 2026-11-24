import { useState } from 'react'
import { CalendarDays, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/misc'
import { formatDate } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'

export function TripPicker() {
  const library = useTravelStore((s) => s.library)
  const enterTrip = useTravelStore((s) => s.enterTrip)
  const [busy, setBusy] = useState<string | null>(null)

  const choose = (id: string): void => {
    setBusy(id)
    void enterTrip(id).finally(() => setBusy(null))
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plane className="size-6" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-xl">Escolha uma viagem</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Selecione a agenda que deseja abrir.</p>
          </div>
        </CardHeader>
        <CardContent>
          {library.length === 0 ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Nenhuma viagem está disponível. Atualize a página ou crie uma viagem na agenda compartilhada.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {library.map((trip) => (
                <li key={trip.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-24 w-full justify-start p-4 text-left"
                    disabled={busy !== null}
                    onClick={() => choose(trip.id)}
                  >
                    <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{trip.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(trip.startDate)} até {formatDate(trip.endDate)}
                      </span>
                    </span>
                    {busy === trip.id && <span className="text-xs text-muted-foreground">Abrindo...</span>}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
