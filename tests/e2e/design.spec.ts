import { test, expect } from 'playwright/test'
import { serviceClient, newStudent, newAdmin } from '../integration/helpers'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const userIds: string[]=[]
const fixtureIds: string[]=[]
const bannerIds: string[]=[]
test.beforeAll(async()=>{
  const db=serviceClient()
  const stamp=Date.now()
  const {data,error}=await db.from('courses').insert([
    {title:'QA Marketing Course',slug:`qa-marketing-${stamp}`,category:'QA Marketing',description:'Test-only course for browser validation.',price:1000,currency:'MMK',access_duration_days:30,is_published:true},
    {title:'QA Content Course',slug:`qa-content-${stamp}`,category:'QA Content',description:'Test-only course for browser validation.',price:2000,currency:'MMK',access_duration_days:60,is_published:true},
  ]).select('id')
  if(error) throw error
  fixtureIds.push(...data.map(c=>c.id))
  const banners=await db.from('homepage_banners').insert([1,2,3].map(i=>({title:`QA Promotion ${i}`,description:'Test-only announcement.',image_url:'/images/design/reference-1.webp',link_url:'/courses',display_order:-1000+i,is_active:true}))).select('id')
  if(banners.error) throw banners.error
  bannerIds.push(...banners.data.map(b=>b.id))
})
test.afterAll(async()=>{ const db=serviceClient(); for(const id of userIds) await db.auth.admin.deleteUser(id); if(fixtureIds.length) await db.from('courses').delete().in('id',fixtureIds); if(bannerIds.length) await db.from('homepage_banners').delete().in('id',bannerIds) })
test('homepage order, responsive navigation and no viewport overflow',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'QA Promotion 1'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Courses built for real-world skills'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'A simple path to better skills.'})).toBeVisible()
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
  expect(overflow).toBe(false)
  if(page.viewportSize()!.width<=800){
    const toggle=page.getByRole('button',{name:'Open menu'});await toggle.click()
    await expect(page.getByRole('navigation',{name:'Main navigation'})).toBeVisible()
    await page.keyboard.press('Escape');await expect(toggle).toBeFocused()
    await expect(page.getByRole('navigation',{name:'Main navigation'})).not.toBeVisible()
  }
  const headings=await page.locator('main h1, main h2').allTextContents()
  expect(headings.indexOf('QA Promotion 1')).toBeLessThan(headings.indexOf('Courses built for real-world skills'))
  await page.screenshot({path:info.outputPath('homepage.png'),fullPage:true})
  // Capture the original independently, not a pixel-perfect assertion: real
  // database content intentionally differs from the prototype's fake content.
  await page.goto(pathToFileURL(path.resolve('design-reference/option2-v3.html')).href)
  await page.screenshot({path:info.outputPath('html-reference.png'),fullPage:true})
})
test('search, filters, empty state and course detail',async({page})=>{
  await page.goto('/courses')
  await page.getByRole('searchbox',{name:'Search courses'}).fill('QA Marketing')
  await expect(page.getByRole('heading',{name:'QA Marketing Course'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'QA Content Course'})).not.toBeVisible()
  await page.getByRole('searchbox').fill('')
  await page.getByRole('button',{name:'QA Content',exact:true}).click()
  await expect(page.getByRole('heading',{name:'QA Content Course'})).toBeVisible()
  await page.getByRole('searchbox').fill('does-not-exist-qa')
  await expect(page.getByRole('status')).toContainText('No matching courses')
  await page.getByRole('searchbox').fill('')
  await page.getByRole('article').filter({has:page.getByRole('heading',{name:'QA Content Course'})}).getByRole('link',{name:'View course'}).click()
  await expect(page.getByRole('heading',{name:'QA Content Course'})).toBeVisible()
  await expect(page.getByText('60 days of access after activation')).toBeVisible()
})
test('carousel advances at six seconds, pauses and supports keyboard',async({page})=>{
  await page.clock.install()
  await page.goto('/')
  await page.mouse.move(0,0)
  await expect(page.getByRole('heading',{name:'QA Promotion 1'})).toBeVisible()
  await page.clock.fastForward(6000)
  await expect(page.getByRole('heading',{name:'QA Promotion 2'})).toBeVisible()
  await page.getByRole('button',{name:'Pause autoplay'}).click()
  await page.clock.fastForward(12000)
  await expect(page.getByRole('heading',{name:'QA Promotion 2'})).toBeVisible()
  await page.getByRole('button',{name:'Next slide'}).focus();await page.keyboard.press('Enter')
  await expect(page.getByRole('heading',{name:'QA Promotion 3'})).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('heading',{name:'QA Promotion 2'})).toBeVisible()
  await page.getByRole('button',{name:'Resume autoplay'}).click()
  await page.getByRole('button',{name:'Resume autoplay'}).count() // focus stays on controls: must remain paused
  await page.clock.fastForward(6000)
  await expect(page.getByRole('heading',{name:'QA Promotion 2'})).toBeVisible()
})
test('reduced motion starts paused and hidden documents do not advance',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();await page.goto('/')
  await expect(page.getByRole('button',{name:'Resume autoplay'})).toBeVisible()
  await page.clock.fastForward(12000);await expect(page.getByRole('heading',{name:'QA Promotion 1'})).toBeVisible()
  await page.getByRole('button',{name:'Resume autoplay'}).click()
  await page.getByRole('searchbox').focus()
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))})
  await page.clock.fastForward(12000);await expect(page.getByRole('heading',{name:'QA Promotion 1'})).toBeVisible()
})
test('signed-out protected routes go to the sign-in page, not fake dashboards',async({page})=>{
  for(const route of ['/my-courses','/payments','/redeem','/profile/devices','/admin/payments']){
    await page.goto(route);await expect(page).toHaveURL(/\/login\?/)
    await expect(page.getByRole('button',{name:'Sign in'})).toBeVisible()
  }
})

test('authenticated student screens and learning failure states remain honest',async({page,context},info)=>{
  const student=await newStudent({full_name:'QA Learner'});userIds.push(student.id)
  await context.addCookies(student.cookieHeader.split('; ').map(part=>{const i=part.indexOf('=');return {name:part.slice(0,i),value:part.slice(i+1),url:'http://127.0.0.1:3100',httpOnly:true}}))
  const db=serviceClient()
  const lesson=await db.from('lessons').insert({course_id:fixtureIds[0],title:'QA Lesson',is_published:true}).select('id').single()
  if(lesson.error) throw lesson.error
  const enrollment=await db.from('enrollments').insert({user_id:student.id,course_id:fixtureIds[0],status:'active',source:'admin',enrolled_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString()})
  if(enrollment.error) throw enrollment.error
  for(const route of ['/my-courses','/profile','/profile/devices','/payments','/redeem']){
    await page.goto(route);await expect(page).not.toHaveURL(/\/login/)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),route).toBe(false)
  }
  await page.goto(`/learn/${fixtureIds[0]}/${lesson.data.id}`)
  await page.getByRole('button',{name:'Play lesson',exact:true}).click()
  await expect(page.getByRole('status')).toContainText('security verification')
  await expect(page.locator('video')).toHaveCount(0)
  await page.screenshot({path:info.outputPath('learning-unconfigured.png'),fullPage:true})
  await page.goto('/admin/payments');await expect(page).toHaveURL('/')
})
test('admin routes are responsive and writes stay disabled before verification',async({page,context},info)=>{
  const admin=await newAdmin();userIds.push(admin.id)
  await context.addCookies(admin.cookieHeader.split('; ').map(part=>{const i=part.indexOf('=');return {name:part.slice(0,i),value:part.slice(i+1),url:'http://127.0.0.1:3100',httpOnly:true}}))
  for(const route of ['/admin','/admin/courses','/admin/lessons','/admin/payments','/admin/redeem-codes','/admin/students','/admin/enrollments','/admin/devices','/admin/banners','/admin/audit-logs']){
    await page.goto(route)
    await expect(page.getByRole('navigation',{name:'Admin navigation'})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),route).toBe(false)
  }
  await page.goto('/admin/redeem-codes')
  await expect(page.getByRole('button',{name:'Generate codes',exact:true})).toBeDisabled()
  await page.screenshot({path:info.outputPath('admin.png'),fullPage:true})
})
