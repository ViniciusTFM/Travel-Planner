import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Checklist } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/misc'
import { uid } from '@/lib/utils'
import { useTravelStore } from '@/store/useTravelStore'

export function ChecklistView() {
  const checklists = useTravelStore((s) => s.data.checklists)
  const addChecklist = useTravelStore((s) => s.addChecklist)
  const [title, setTitle] = useState('')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Checklist</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) {
            addChecklist(title.trim())
            setTitle('')
          }
        }}
      >
        <Input aria-label="Título da nova lista" placeholder="Nova lista (ex.: Documentos, Mala)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit">
          <Plus /> Criar
        </Button>
      </form>
      {checklists.length === 0 && <EmptyState>Nenhuma lista ainda.</EmptyState>}
      <div className="grid gap-3 md:grid-cols-2">
        {checklists.map((c) => (
          <ChecklistCard key={c.id} list={c} />
        ))}
      </div>
    </div>
  )
}

function ChecklistCard({ list }: { list: Checklist }) {
  const update = useTravelStore((s) => s.updateChecklist)
  const remove = useTravelStore((s) => s.removeChecklist)
  const [text, setText] = useState('')
  const done = list.items.filter((i) => i.done).length
  const pct = list.items.length ? Math.round((done / list.items.length) * 100) : 0

  return (
    <section aria-label={`Checklist ${list.title}`} className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label="Título da lista"
          className="h-9 border-transparent px-1 font-semibold hover:border-input"
          value={list.title}
          onChange={(e) => update(list.id, { title: e.target.value })}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir lista ${list.title}`}
          onClick={() => confirm(`Excluir a lista "${list.title}"?`) && remove(list.id)}
        >
          <Trash2 />
        </Button>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso: ${done} de ${list.items.length}`}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1">
        {list.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              id={`ci-${item.id}`}
              type="checkbox"
              className="size-4 shrink-0 accent-[hsl(var(--primary))]"
              checked={item.done}
              onChange={(e) =>
                update(list.id, { items: list.items.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)) })
              }
            />
            <label htmlFor={`ci-${item.id}`} className={`flex-1 text-sm ${item.done ? 'text-muted-foreground line-through' : ''}`}>
              {item.text}
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Remover ${item.text}`}
              onClick={() => update(list.id, { items: list.items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          update(list.id, { items: [...list.items, { id: uid('ci'), text: text.trim(), done: false }] })
          setText('')
        }}
      >
        <Input aria-label={`Novo item em ${list.title}`} placeholder="Novo item..." value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" variant="outline" size="icon" aria-label="Adicionar item">
          <Plus />
        </Button>
      </form>
    </section>
  )
}
