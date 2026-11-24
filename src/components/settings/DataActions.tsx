import { useRef, useState } from 'react'
import { Copy, Download, FileText, Link2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/form'
import { exportJson, exportPdf, importJsonFile } from '@/services/exportImport'
import { buildShareUrl } from '@/services/share'
import { useTravelStore } from '@/store/useTravelStore'

export function DataActions() {
  const data = useTravelStore((s) => s.data)
  const importData = useTravelStore((s) => s.importData)
  const setNotice = useTravelStore((s) => s.setNotice)
  const fileRef = useRef<HTMLInputElement>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const onImport = async (file: File | undefined): Promise<void> => {
    if (!file) return
    try {
      importData(await importJsonFile(file))
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Falha ao importar.' })
    }
  }

  const copy = async (): Promise<void> => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setNotice({ kind: 'info', text: 'Link copiado.' })
    } catch {
      setNotice({ kind: 'error', text: 'Não foi possível copiar. Selecione o link e copie manualmente.' })
    }
  }

  const copyJson = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setNotice({ kind: 'info', text: 'Dados JSON copiados. Envie-os para outro usuário importar.' })
    } catch {
      setNotice({ kind: 'error', text: 'Não foi possível copiar o JSON. Use Exportar JSON para baixar o arquivo.' })
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => exportJson(data)}>
          <Download /> Exportar JSON
        </Button>
        <Button variant="outline" onClick={() => void copyJson()}>
          <Copy /> Copiar JSON
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            exportPdf(data).catch(() => setNotice({ kind: 'error', text: 'Falha ao gerar o PDF.' }))
          }
        >
          <FileText /> Exportar PDF
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload /> Importar JSON
        </Button>
        <Button variant="outline" onClick={() => setShareUrl(buildShareUrl(data))}>
          <Link2 /> Compartilhar link
        </Button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="application/json,.json"
          onChange={(e) => {
            void onImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Para compartilhar com outro usuário cadastrado, exporte ou copie o JSON. A outra pessoa deve entrar na própria conta e importar esses dados; uma cópia independente será criada.
      </p>

      <Dialog open={shareUrl !== null} onOpenChange={(o) => !o && setShareUrl(null)}>
        <DialogContent>
          <DialogTitle>Compartilhar viagem</DialogTitle>
          <DialogDescription>
            O link contém a viagem inteira (comprimida com LZ-String) no endereço. Quem abrir recebe uma cópia. Anexos não
            são incluídos. Use o JSON exportado para levar os documentos.
          </DialogDescription>
          {shareUrl && (
            <>
              <Input readOnly aria-label="Link de compartilhamento" value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
              <p className="text-xs text-muted-foreground">{shareUrl.length.toLocaleString('pt-BR')} caracteres.</p>
              <Button onClick={() => void copy()}>
                <Copy /> Copiar link
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
