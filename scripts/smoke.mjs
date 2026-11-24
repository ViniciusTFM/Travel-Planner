import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge' })
const errors = []
const log = (...a) => console.log(...a)

async function run(name, viewport, fn) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`))
  await page.goto('http://localhost:5173/')
  await page.waitForSelector('main')
  await fn(page)
  await ctx.close()
}

await run('desktop', { width: 1440, height: 900 }, async (page) => {
  await page.waitForSelector('.fc')
  log('fc events (week):', await page.locator('.fc-event').count())
  await page.screenshot({ path: 'scripts/desktop-week.png' })
  for (const v of ['Agenda', 'Dia', 'Mês', 'Timeline', 'Semana']) {
    await page.getByRole('tab', { name: v, exact: true }).click()
    await page.waitForTimeout(250)
    log('view', v, 'events:', await page.locator('.fc-event, .fc-list-event').count())
    if (v === 'Mês' || v === 'Timeline') await page.screenshot({ path: `scripts/desktop-${v}.png` })
  }
  // criar evento via botão
  await page.getByRole('button', { name: 'Evento', exact: true }).click()
  await page.getByLabel('Título *').fill('Teste Evento')
  await page.getByLabel('Tipo').selectOption('flight')
  await page.getByLabel('Companhia aérea').fill('TAP')
  await page.getByRole('button', { name: 'Criar evento' }).click()
  await page.waitForSelector('h3:has-text("Teste Evento")')
  log('evento criado; detalhes ok')
  await page.screenshot({ path: 'scripts/desktop-detail.png' })
  // excluir
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Excluir' }).first().click()
  await page.waitForTimeout(200)
  log('após excluir, ainda existe?', await page.locator('text=Teste Evento').count())
  // busca
  await page.getByLabel('Busca global').fill('LATAM')
  await page.waitForTimeout(200)
  log('resultados busca:', await page.locator('ul[id] li button').count())
  await page.getByLabel('Busca global').fill('')
  // custos
  await page.getByRole('button', { name: /^Custos/ }).first().click()
  await page.waitForSelector('text=Dashboard financeiro')
  await page.waitForSelector('.recharts-surface')
  await page.screenshot({ path: 'scripts/desktop-costs.png' })
  log('recharts surfaces:', await page.locator('.recharts-surface').count())
  // dark
  await page.getByRole('button', { name: /^Tema/ }).click()
  await page.getByRole('button', { name: /^Tema/ }).click()
  log('dark class:', await page.evaluate(() => document.documentElement.classList.contains('dark')))
  // persistência
  await page.reload()
  await page.waitForSelector('main')
  log('trips in storage:', await page.evaluate(() => localStorage.getItem('travel-planner:index')?.length))
})

await run('mobile', { width: 390, height: 800 }, async (page) => {
  await page.screenshot({ path: 'scripts/mobile-home.png' })
  await page.getByRole('button', { name: 'Calendário' }).click()
  await page.waitForSelector('.fc')
  await page.screenshot({ path: 'scripts/mobile-cal.png' })
  await page.locator('.fc-event').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'scripts/mobile-detail.png' })
})

await run('tablet', { width: 820, height: 1000 }, async (page) => {
  await page.waitForSelector('.fc')
  await page.screenshot({ path: 'scripts/tablet.png' })
})

console.log('ERRORS:', errors.length ? errors : 'none')
await browser.close()

