import { test, expect } from '@playwright/test'
import { TOTP } from 'totp-generator'
import fs from 'fs'

test.beforeAll(async ({ page }) => {
  // load cookies if they exist
  if (fs.existsSync('auth.json')) {
    await page.context().storageState({ path: 'auth.json' })
  }

  await page.goto('https://github.com/login')

  await page.getByRole('textbox', { name: 'Username or email address' }).click()
  await page
    .getByRole('textbox', { name: 'Username or email address' })
    .fill(process.env.TEST_EMAIL || '')
  await page.getByRole('textbox', { name: 'Password' }).click()
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(process.env.TEST_PASSWORD || '')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  let { otp } = TOTP.generate(process.env.TEST_AUTH_SECRET || '')
  await page.getByRole('textbox', { name: 'Authentication code' }).click()
  await page.getByRole('textbox', { name: 'Authentication code' }).fill(otp)
})

test.beforeEach(async ({ page }) => {
  const sessionStorage = JSON.parse(
    fs.readFileSync('playwright/.auth/session.json', 'utf-8')
  )
  await page.context().addInitScript((storage) => {
    if (window.location.hostname === 'github.com') {
      for (const [key, value] of Object.entries(storage))
        window.sessionStorage.setItem(key, value)
    }
  }, sessionStorage)
  await page.goto('/')
})

test.describe('Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    test.setTimeout(120000) // 2 minutes timeout

    await page
      .locator('button')
      .filter({ hasText: /^Sign In$/ })
      .click()
    await page.getByRole('button', { name: 'Sign in with GitHub' }).click()

    await expect(page.locator('h1')).toContainText('meetingbotcapstone')
    await expect(page.getByRole('main')).toContainText('Create API Key')
    await expect(page.getByRole('main')).toContainText('Get Started')
  })
})
