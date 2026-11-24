import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:5173/')
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForSelector('.fc')
await page.getByRole('button', { name: 'Evento', exact: true }).click()
await page.getByLabel('Título *').fill('Evento com data livre')
const dates = page.locator('input[type="date"]')
const times = page.locator('input[type="time"]')
if (await dates.count() !== 2 || await times.count() !== 2) throw new Error('Controles de data/hora não encontrados')
await dates.nth(0).fill('2030-12-31')
await times.nth(0).fill('23:45')
await dates.nth(1).fill('2031-01-02')
await times.nth(1).fill('01:15')
if (await dates.nth(0).inputValue() !== '2030-12-31') throw new Error('Data de início não foi aplicada')
if (await times.nth(0).inputValue() !== '23:45') throw new Error('Hora de início não foi aplicada')
if (await dates.nth(1).inputValue() !== '2031-01-02') throw new Error('Data de fim não foi aplicada')
if (await times.nth(1).inputValue() !== '01:15') throw new Error('Hora de fim não foi aplicada')
await page.getByRole('button', { name: 'Criar evento' }).click()
await page.waitForSelector('text=Evento com data livre')
await page.waitForTimeout(500)
const saved = await page.evaluate(() => {
  const index = JSON.parse(localStorage.getItem('travel-planner:index') ?? '[]')
  const raw = localStorage.getItem(`travel-planner:trip:${index[0]?.id}`)
  return raw ? JSON.parse(raw) : null
})
const event = saved?.events.find((e) => e.title === 'Evento com data livre')
if (event?.start !== '2030-12-31T23:45:00' || event?.end !== '2031-01-02T01:15:00') {
  throw new Error(`Valores persistidos incorretos: ${event?.start} / ${event?.end}`)
}
console.log('time smoke: ok', event.start, event.end, 'errors:', errors.length)
await browser.close()
