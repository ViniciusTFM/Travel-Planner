# Travel Planner

Aplicação web para planejamento completo de viagens nacionais e internacionais. O Travel Planner centraliza calendário, voos, hospedagens, passeios, restaurantes, transportes, compras, gastos, reservas, documentos, checklist e cronograma em uma única aplicação.

A aplicação foi projetada para substituir planilhas, notas, PDFs e mensagens dispersas por um documento único de viagem, com uma experiência inspirada em Google Travel, TripIt, Wanderlog, Notion, Outlook Calendar e Microsoft Teams Calendar.

> **Estado atual:** aplicação frontend funcional, com persistência local no navegador. Não existe backend, API, banco SQL ou sincronização em nuvem neste momento.

## Sumário

- [Principais características](#principais-características)
- [Stack](#stack)
- [Executar o projeto](#executar-o-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Modelo de dados](#modelo-de-dados)
- [Modelo universal de eventos](#modelo-universal-de-eventos)
- [Cores personalizadas](#cores-personalizadas)
- [Voos pagos com dinheiro e milhas](#voos-pagos-com-dinheiro-e-milhas)
- [Persistência e StorageAdapter](#persistência-e-storageadapter)
- [Autenticação local](#autenticação-local)
- [Calendário](#calendário)
- [Timeline da viagem](#timeline-da-viagem)
- [Dashboard financeiro](#dashboard-financeiro)
- [Documentos](#documentos)
- [Busca, filtros e tags](#busca-filtros-e-tags)
- [Exportação, importação e compartilhamento](#exportação-importação-e-compartilhamento)
- [Responsividade e acessibilidade](#responsividade-e-acessibilidade)
- [Validação e qualidade](#validação-e-qualidade)
- [Limitações atuais](#limitações-atuais)
- [Próximos passos](#próximos-passos)

## Principais características

- Criação, edição, exclusão e alternância entre várias viagens.
- Documento JSON único como fonte da verdade.
- Modelo universal para todos os registros de viagem.
- Calendário com modos Agenda, Dia, Semana, Mês e Timeline.
- Criação de evento clicando ou selecionando uma faixa de horário.
- Drag and drop e redimensionamento de eventos.
- Datas e horários de início e fim independentes.
- Eventos de hotel com check-in e check-out visualizados separadamente.
- Cópia de eventos com novo ID, preservando os dados do evento original.
- Cor personalizada por evento, com fallback para a cor padrão do tipo.
- Contraste automático de texto no calendário para cores claras e escuras.
- Busca global por cidade, país, voo, hotel, reserva, companhia aérea, endereço, metadata e tags.
- Filtros por tipo de evento e tag.
- Favoritos.
- Timeline por país, cidade, datas, noites, eventos e custos.
- Dashboard financeiro com totais por moeda, categorias, evolução temporal e milhas.
- Voos pagos com dinheiro, milhas ou combinação dos dois.
- Upload de documentos PDF, PNG, JPG, WEBP e TXT.
- Checklists com progresso.
- Tema claro, escuro e sistema.
- Exportação JSON e PDF.
- Importação de JSON previamente exportado.
- Compartilhamento por URL comprimida com LZ-String.
- Arquitetura preparada para trocar o LocalStorage por Supabase, Firebase ou AWS S3.

## Stack

### Frontend

- React 19
- TypeScript em strict mode
- Vite
- Tailwind CSS
- Componentes próprios inspirados em Shadcn/UI
- Radix UI para diálogo e composição de componentes
- Lucide React para ícones

### Estado e dados

- Zustand
- Um documento `TravelData` por viagem
- `StorageAdapter` como abstração de persistência
- `LocalStorageAdapter` como implementação atual

### Calendário e visualizações

- FullCalendar
- Day Grid
- Time Grid
- List
- Interaction
- Recharts para gráficos financeiros

### Exportação e compartilhamento

- jsPDF
- jsPDF AutoTable
- LZ-String

## Executar o projeto

### Pré-requisitos

- Node.js instalado
- npm instalado
- Navegador moderno com suporte a Web Crypto, `localStorage`, `sessionStorage` e `crypto.subtle`

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O Vite exibirá a URL local, normalmente:

```text
http://localhost:5173
```

### Build de produção

```bash
npm run build
```

### Servir o build localmente

```bash
npm run preview
```

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite. |
| `npm run typecheck` | Executa `tsc --noEmit` em TypeScript strict mode. |
| `npm run build` | Executa o typecheck e gera o build de produção. |
| `npm run preview` | Serve o conteúdo gerado em `dist`. |

Não há scripts npm oficiais de lint, Jest, Vitest ou Playwright no momento.

## Arquitetura

A aplicação é uma SPA React organizada por domínio, estado, persistência, serviços e componentes de interface.

```text
App
├── AuthGate
│   └── AuthenticatedApp
│       └── AppShell
│           ├── Sidebar / BottomNav
│           ├── GlobalSearch
│           ├── CalendarPanel
│           │   ├── CalendarView
│           │   └── TripTimeline
│           ├── EventPanel
│           │   ├── EventDetails
│           │   └── EventForm
│           ├── FinanceDashboard
│           ├── DocumentsView
│           ├── ChecklistView
│           ├── SettingsView
│           └── TripDialog
│
├── useTravelStore (Zustand)
│   └── TravelData ativo e comandos de negócio
│
├── StorageAdapter
│   └── LocalStorageAdapter
│
└── Serviços
    ├── auth.ts
    ├── documents.ts
    ├── exportImport.ts
    └── share.ts
```

### Princípios

1. **JSON como fonte única da verdade:** a lógica da aplicação deriva os dados de `TravelData`.
2. **Evento universal:** voo, hotel, passeio, restaurante, gasto e transporte são eventos especializados por `type` e `metadata`.
3. **Sem SQL:** não há tabelas, migrations, entidades de negócio separadas ou dependência de banco relacional.
4. **Persistência desacoplada:** a lógica de negócio conhece apenas `StorageAdapter`.
5. **Datas locais:** eventos usam strings locais sem timezone para evitar conversões automáticas de UTC.
6. **Componentização:** telas e recursos ficam separados por domínio.
7. **Mobile first:** o layout se adapta a desktop, tablet e mobile.

## Estrutura de pastas

```text
.
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── scripts/
│   ├── check.ts
│   ├── smoke.mjs
│   ├── time-smoke.mjs
│   └── screenshots gerados pelos smoke tests
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── domain/
    │   ├── types.ts
    │   ├── constants.ts
    │   ├── calc.ts
    │   ├── eventStyle.ts
    │   ├── sample.ts
    │   └── validate.ts
    ├── store/
    │   └── useTravelStore.ts
    ├── storage/
    │   ├── StorageAdapter.ts
    │   ├── LocalStorageAdapter.ts
    │   └── index.ts
    ├── services/
    │   ├── auth.ts
    │   ├── documents.ts
    │   ├── exportImport.ts
    │   └── share.ts
    ├── hooks/
    │   ├── useMediaQuery.ts
    │   └── useTheme.ts
    ├── lib/
    │   └── utils.ts
    └── components/
        ├── auth/
        ├── calendar/
        ├── checklist/
        ├── documents/
        ├── events/
        ├── finance/
        ├── layout/
        ├── search/
        ├── settings/
        ├── trips/
        └── ui/
```

## Modelo de dados

`TravelData` é o documento completo de uma viagem:

```ts
interface TravelData {
  trip: Trip
  events: TravelEvent[]
  documents: TravelDocument[]
  checklists: Checklist[]
  settings: Settings
}
```

O formato geral é:

```json
{
  "trip": {},
  "events": [],
  "documents": [],
  "checklists": [],
  "settings": {}
}
```

### Trip

```ts
interface Trip {
  id: string
  title: string
  owner: string
  startDate: string
  endDate: string
  currency: string
  notes: string
}
```

Exemplo:

```json
{
  "trip": {
    "id": "trip-001",
    "title": "Espanha e Marrocos 2027",
    "owner": "Vinicius",
    "startDate": "2027-03-19",
    "endDate": "2027-04-06",
    "currency": "BRL",
    "notes": "Viagem de exemplo"
  }
}
```

### TravelDocument

```ts
interface TravelDocument {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  eventId: string | null
  createdAt: string
}
```

`eventId: null` representa um documento geral da viagem. Quando o documento está associado a um voo, hotel, passeio ou outro evento, `eventId` contém o ID desse evento.

### Checklist

```ts
interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}
```

### Settings

```ts
interface Settings {
  exchangeRates: Record<string, number>
  customTags: string[]
  favorites: string[]
  homeCity: string
  homeCountry: string
}
```

As taxas de câmbio representam quanto vale uma unidade da moeda estrangeira na moeda principal da viagem.

## Modelo universal de eventos

Todos os registros operacionais são `TravelEvent`. Não existem interfaces próprias para voo, hotel, passeio ou restaurante.

```ts
interface TravelEvent {
  id: string
  type: EventType
  title: string
  description: string
  start: string
  end: string
  allDay: boolean
  city: string
  country: string
  address: string
  cost: number
  currency: string
  tags: string[]
  notes: string
  color?: string
  metadata: Record<string, string>
}
```

`start` e `end` usam o formato local:

```text
YYYY-MM-DDTHH:mm:ss
```

Exemplo:

```json
{
  "id": "evt-001",
  "type": "flight",
  "title": "LATAM LA8085",
  "description": "Voo de retorno",
  "start": "2027-04-05T23:55:00",
  "end": "2027-04-06T08:30:00",
  "allDay": false,
  "city": "São Paulo",
  "country": "Brasil",
  "address": "Aeroporto de Guarulhos",
  "cost": 1200,
  "currency": "BRL",
  "tags": ["Família"],
  "notes": "Chegar com antecedência",
  "color": "#2563eb",
  "metadata": {
    "airline": "LATAM",
    "flightNumber": "LA8085",
    "originAirport": "MAD",
    "destinationAirport": "GRU"
  }
}
```

### Tipos permitidos

| Tipo | Uso |
|---|---|
| `flight` | Voos |
| `hotel` | Hospedagens |
| `tour` | Passeios e excursões |
| `restaurant` | Restaurantes e reservas gastronômicas |
| `transport` | Trem, ônibus, carro, táxi e outros transportes |
| `ticket` | Ingressos |
| `museum` | Museus e atrações culturais |
| `shopping` | Compras |
| `expense` | Gastos sem outro tipo específico |
| `custom` | Evento livre/personalizado |

### Metadata por tipo

A metadata é um `Record<string, string>`. O formulário mostra campos conforme o tipo selecionado.

#### Flight

```json
{
  "airline": "LATAM",
  "flightNumber": "LA8085",
  "bookingCode": "XK29PL",
  "seat": "23A",
  "terminal": "3",
  "originAirport": "GRU",
  "destinationAirport": "LIS",
  "boardingTime": "2027-03-19T21:10",
  "paymentMethod": "both",
  "milesUsed": "30000"
}
```

#### Hotel

```json
{
  "hotelName": "Hotel Baixa Chiado",
  "confirmationNumber": "BK-88123",
  "provider": "Booking",
  "checkin": "2027-03-20T15:00",
  "checkout": "2027-03-21T08:00",
  "phone": "+351000000000",
  "website": "https://example.com"
}
```

#### Tour e ticket

```json
{
  "operator": "GetYourGuide",
  "ticketNumber": "GYG-3321",
  "meetingPoint": "Praça principal",
  "voucher": "VOUCHER-001"
}
```

#### Transport

```json
{
  "provider": "Renfe AVE",
  "bookingCode": "RENFE-001",
  "origin": "Madrid Atocha",
  "destination": "Barcelona Sants"
}
```

## Cores personalizadas

Cada evento pode ter uma cor própria em `TravelEvent.color`.

```json
{
  "type": "restaurant",
  "title": "Mercado San Miguel",
  "color": "#ea580c"
}
```

A cor deve ser hexadecimal RGB no formato `#RRGGBB`. Se `color` estiver ausente ou for inválida, o sistema usa a cor padrão definida para o tipo do evento.

O formulário oferece:

- Seletor nativo de cor.
- Paleta de sugestões.
- Opção para voltar à cor padrão do tipo.

No calendário, o sistema calcula automaticamente se o texto deve ser preto ou branco para melhorar o contraste com a cor escolhida.

As cores personalizadas são preservadas em:

- LocalStorage.
- Exportação JSON.
- Importação JSON.
- Links compartilhados.
- Duplicação de eventos.

As cores usadas na legenda e nos filtros continuam representando as cores padrão dos tipos.

## Voos pagos com dinheiro e milhas

O valor financeiro universal continua no campo `cost`. Para voos, `cost` representa somente o valor pago em dinheiro.

A quantidade de milhas fica em:

```text
metadata.milesUsed
```

A forma de pagamento fica em:

```text
metadata.paymentMethod
```

Valores permitidos:

| `paymentMethod` | Significado |
|---|---|
| `cash` | Pago em dinheiro |
| `miles` | Pago somente com milhas |
| `both` | Pago com dinheiro e milhas |

Exemplo de voo pago somente com milhas:

```json
{
  "type": "flight",
  "title": "TAP TP103",
  "cost": 0,
  "currency": "BRL",
  "metadata": {
    "paymentMethod": "miles",
    "milesUsed": "42000"
  }
}
```

Exemplo de voo pago com dinheiro e milhas:

```json
{
  "type": "flight",
  "title": "LATAM LA8085",
  "cost": 1200,
  "currency": "BRL",
  "metadata": {
    "paymentMethod": "both",
    "milesUsed": "30000"
  }
}
```

Regras do formulário:

- Milhas são inteiras e não negativas.
- Pagamento somente em dinheiro não aceita milhas positivas.
- Pagamento somente em milhas não aceita custo em dinheiro.
- Pagamento misto exige valor em dinheiro e milhas.
- Milhas não são convertidas para dinheiro.
- Milhas não entram no total monetário geral.

A dashboard apresenta:

- Total de milhas utilizadas.
- Gráfico de milhas utilizadas por voo.
- Milhas mesmo quando o custo em dinheiro do voo é zero.

## Persistência e StorageAdapter

A aplicação não conhece diretamente uma implementação de banco. A lógica usa a interface:

```ts
interface StorageAdapter {
  load(tripId: string): Promise<TravelData | null>
  save(data: TravelData): Promise<void>
  list(): Promise<TripSummary[]>
  remove(tripId: string): Promise<void>
}
```

A implementação atual é `LocalStorageAdapter`.

### Chaves atuais

As chaves usam o prefixo `travel-planner`:

```text
travel-planner:index
travel-planner:active
travel-planner:calview
travel-planner:trip:<trip-id>
travel-planner:local-credentials
travel-planner:session
```

O índice armazena resumos das viagens. O documento completo de cada viagem é salvo separadamente por ID.

### Gravação

Mutations do Zustand passam pelo método `commit`, que:

1. Atualiza o `TravelData` em memória.
2. Cancela uma gravação pendente.
3. Agenda uma nova gravação após 250 ms.
4. Persiste o documento completo pelo `StorageAdapter`.

O `beforeunload` também tenta salvar o documento atual.

### Migração futura

Para migrar para Supabase, Firebase ou AWS S3, a ideia é criar outra implementação de `StorageAdapter` e trocar o adapter em:

```text
src/storage/index.ts
```

A estrutura `TravelData` e a lógica de negócio não precisam criar tabelas ou entidades específicas para isso.

## Autenticação local

Na primeira abertura, o `AuthGate` solicita a criação de um usuário e senha local.

Regras atuais:

- Usuário com pelo menos 3 caracteres.
- Senha com pelo menos 6 caracteres.
- Confirmação da senha no primeiro cadastro.

A senha não é armazenada em texto claro. O serviço `src/services/auth.ts` usa:

- Web Crypto API.
- Salt aleatório.
- PBKDF2.
- SHA-256.
- 120.000 iterações.

As credenciais derivadas ficam no `localStorage`. O estado da sessão fica somente no `sessionStorage`.

A sessão contém usuário, nonce e data de criação. O logout remove o registro da sessão e recarrega a aplicação.

### Limitação de segurança

Essa autenticação é local e não substitui um sistema de autenticação de backend. Ela não oferece:

- Usuários remotos.
- Recuperação de senha.
- Rate limiting.
- Revogação server-side.
- Autorização por viagem.
- Sessão em cookie HttpOnly.
- Criptografia dos documentos e viagens no LocalStorage.

Qualquer pessoa com acesso ao perfil do navegador ou ao DevTools pode ler e alterar os dados locais. Para proteção real, a aplicação deve integrar um provedor server-side, como Firebase, Supabase ou Seg.ID.

## Calendário

O calendário usa FullCalendar e oferece:

- Agenda.
- Dia.
- Semana.
- Mês.
- Timeline da viagem.
- Ordenação por horário.
- Múltiplos eventos no mesmo dia.
- Seleção de horários em intervalos de 15 minutos.
- Criação por seleção de uma faixa.
- Criação de eventos de dia inteiro.
- Clique para detalhes.
- Drag and drop.
- Resize.
- Filtros por tipo e tag.
- Busca global.
- Cores por evento.
- Indicador de horário atual.

### Datas e horários

O domínio usa horário local sem offset de timezone. Por exemplo:

```text
2027-04-05T23:55:00
```

A tela de edição possui controles independentes para:

- Data inicial.
- Horário inicial.
- Data final.
- Horário final.

Não existe limite obrigatório baseado nas datas da viagem. Um evento pode ser criado fora do intervalo de `trip.startDate` e `trip.endDate`.

### Eventos de hotel

Um hotel continua sendo um único `TravelEvent`. Na visualização do calendário, eventos de hotel não marcados como dia inteiro geram dois marcadores visuais:

- Check-in.
- Check-out.

A persistência continua contendo apenas o evento de hotel original.

## Timeline da viagem

A timeline agrupa eventos consecutivos pela combinação de cidade e país.

Cada parada exibe:

- País.
- Cidade.
- Data de chegada.
- Data de saída.
- Quantidade de noites.
- Quantidade de eventos.
- Custos convertidos para a moeda principal.

A cidade e o país configurados em Configurações podem aparecer como ponto de saída e retorno da viagem.

## Dashboard financeiro

A dashboard deriva seus dados diretamente de `TravelData.events`.

### Totais

- Total BRL.
- Total EUR.
- Total USD.
- Total geral convertido para a moeda principal.
- Outras moedas usadas nos eventos.
- Total de milhas utilizadas em voos.

### Categorias

- Voos.
- Hospedagem.
- Passeios.
- Restaurantes.
- Transporte.
- Compras.
- Outros.

### Gráficos

- Pizza por categoria.
- Barras por categoria.
- Evolução diária e acumulada dos gastos.
- Milhas utilizadas por voo.

### Câmbio

As taxas são configuradas manualmente em Configurações. Os valores iniciais são:

```json
{
  "EUR": 6,
  "USD": 5.5,
  "MAD": 0.55,
  "GBP": 7
}
```

A aplicação não consulta cotações externas.

## Documentos

Tipos aceitos:

- PDF.
- PNG.
- JPG/JPEG.
- WEBP.
- TXT.

Limite atual:

```text
1,5 MB por arquivo
```

Os arquivos são convertidos para `dataUrl` e gravados no documento JSON da viagem. Por isso, documentos aumentam rapidamente o consumo do LocalStorage.

Um documento pode ser associado a:

- Viagem inteira.
- Voo.
- Hotel.
- Passeio.
- Qualquer outro evento.

Quando um evento é excluído, os documentos associados deixam de apontar para o evento e passam a ser documentos gerais da viagem.

## Busca, filtros e tags

A busca global considera:

- Título.
- Descrição.
- Cidade.
- País.
- Endereço.
- Notas.
- Tipo do evento.
- Tags.
- Valores do `metadata`.

A busca remove acentos e ignora diferenças entre maiúsculas e minúsculas.

Tags padrão:

- Gastronomia.
- Museu.
- Praia.
- Compras.
- Família.
- Romântico.
- Aventura.

Também é possível criar tags personalizadas.

## Exportação, importação e compartilhamento

### JSON

A exportação JSON grava o `TravelData` completo e formatado. A importação:

1. Lê o arquivo.
2. Faz o parse do JSON.
3. Valida e normaliza os dados.
4. Gera IDs ausentes.
5. Preserva metadata desconhecida.
6. Importa como nova viagem quando o ID já existe.

### PDF

O PDF inclui:

- Título da viagem.
- Período.
- Responsável.
- Moeda principal.
- Total geral.
- Timeline.
- Tabela de eventos.
- Totais por categoria.

### Link compartilhável

O link compartilhável:

1. Remove o conteúdo binário dos documentos.
2. Mantém as referências dos documentos.
3. Serializa o `TravelData`.
4. Comprime o conteúdo com LZ-String.
5. Grava o payload no hash da URL:

```text
#trip=<payload-comprimido>
```

Ao abrir o link, o sistema restaura uma cópia da viagem. Se o ID já existir localmente, um novo ID é gerado para evitar sobrescrever a viagem existente.

> O conteúdo dos anexos não é incluído no link. Para transportar anexos, use a exportação JSON.

## Responsividade e acessibilidade

### Desktop

A partir de 1024 px:

- Sidebar esquerda.
- Calendário/conteúdo central.
- Painel direito de detalhes, editor e custos.

### Tablet

Entre 768 e 1023 px:

- Sidebar esquerda.
- Conteúdo central.
- Painel de evento como diálogo lateral.

### Mobile

Abaixo de 768 px:

- Uma coluna.
- Menu inferior.
- Painel de evento como diálogo inferior.

Menu inferior:

- Home.
- Calendário.
- Custos.
- Documentos.
- Configurações.

### Acessibilidade

- Labels associados aos campos.
- Foco visível.
- Link para pular ao conteúdo.
- `aria-label`, `aria-current`, `aria-expanded` e `aria-selected`.
- Mensagens com roles `alert` e `status`.
- Navegação por teclado nos controles principais.
- Tema claro e escuro.
- Contraste automático dos textos dos eventos.

## Validação e qualidade

### TypeScript

O projeto usa TypeScript strict mode e validação sem emissão:

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

O build executa primeiro o typecheck e depois o Vite.

### Scripts auxiliares

Os scripts em `scripts/` não estão registrados no `package.json`.

#### `scripts/check.ts`

Valida funções de domínio:

- Timeline.
- Totais por moeda.
- Total geral.
- Categorias.
- Busca com e sem acento.
- Filtro por tag.
- Encode/decode de link compartilhado.
- Rejeição de JSON inválido.

Pode ser executado com um runner TypeScript disponível, por exemplo:

```bash
npx tsx scripts/check.ts
```

#### `scripts/smoke.mjs`

Smoke test visual e funcional usando Playwright Core e Microsoft Edge. Cobre:

- Calendário desktop.
- Modos de visualização.
- Criação e exclusão de evento.
- Busca.
- Dashboard financeiro.
- Tema escuro.
- Persistência após reload.
- Mobile.
- Tablet.

#### `scripts/time-smoke.mjs`

Valida criação de evento com datas e horários independentes e verifica a persistência no JSON do LocalStorage.

Os smoke scripts dependem de `playwright-core`, Edge instalado e do servidor Vite em execução. Essa dependência não está declarada como script ou dependência oficial em `package.json`.

## Limitações atuais

- Não há backend ou API.
- Não há banco de dados relacional.
- Não há SQL, tabelas ou migrations.
- Não há sincronização com nuvem.
- Não há colaboração em tempo real.
- Não há múltiplos usuários reais.
- As viagens são compartilhadas entre usuários do mesmo perfil do navegador porque o armazenamento não é namespaceado por usuário.
- O login local não cifra o conteúdo do `TravelData`.
- O LocalStorage tem cota limitada pelo navegador.
- Anexos são armazenados como data URLs no JSON.
- Links compartilháveis não incluem anexos.
- URLs muito longas podem limitar o tamanho de viagens compartilhadas.
- Taxas de câmbio são manuais.
- Datas não possuem timezone explícito.
- Não há recuperação de senha.
- Não há rate limiting ou bloqueio de tentativas.
- Não há lixeira ou desfazer para exclusões.
- Não há suíte de testes automatizados integrada aos scripts npm.
- A viagem de demonstração é criada automaticamente quando não há viagens locais.

## Próximos passos

Possíveis evoluções compatíveis com a arquitetura atual:

1. Implementar um `SupabaseStorageAdapter`.
2. Implementar um `FirebaseStorageAdapter`.
3. Implementar um adapter para AWS S3.
4. Namespacear viagens por usuário autenticado.
5. Migrar a autenticação local para Seg.ID, Firebase Auth ou outro provedor.
6. Armazenar documentos em object storage em vez de data URLs.
7. Adicionar sincronização e resolução de conflitos.
8. Adicionar testes unitários de domínio.
9. Adicionar testes de componentes e E2E ao pipeline.
10. Adicionar schema versioning e migrações de JSON.
11. Adicionar recuperação de senha e gerenciamento de conta.
12. Adicionar fuso horário explícito por viagem ou evento.
13. Adicionar impressão e PDF com suporte completo a Unicode.

## Licença

O projeto ainda não define um arquivo de licença. Antes de distribuir ou publicar o código, escolha e adicione uma licença compatível com o uso pretendido.
