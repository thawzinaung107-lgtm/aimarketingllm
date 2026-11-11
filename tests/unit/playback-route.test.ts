import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user:vi.fn(),client:vi.fn(),enabled:vi.fn(),provider:vi.fn(),sign:vi.fn(),rpc:vi.fn() }))
vi.mock('@/lib/auth',() => ({ getCurrentUser:mocks.user }))
vi.mock('@/lib/supabase/server',() => ({ createClient:mocks.client }))
vi.mock('@/lib/feature-gates',() => ({ sensitiveFeaturesEnabled:mocks.enabled }))
vi.mock('@/lib/streaming',() => ({ streamingProvider:mocks.provider }))
vi.mock('@/lib/http-security',() => ({ privateJson:(body:unknown,status=200) => Response.json(body,{ status,headers:{'Cache-Control':'private, no-store'} }) }))
import { GET } from '@/app/api/lessons/[lessonId]/playback/route'
const lessonId='12345678-1234-4234-8234-123456789012'
const request = () => GET(new Request(`http://localhost/api/lessons/${lessonId}/playback`), { params:Promise.resolve({ lessonId }) })
beforeEach(() => {
  vi.resetAllMocks(); mocks.enabled.mockReturnValue(true); mocks.user.mockResolvedValue({id:'student',role:'student'})
  mocks.provider.mockReturnValue({ sign:mocks.sign }); mocks.rpc.mockResolvedValue({data:'courses/a/lesson.mp4',error:null})
  const query = { select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue({data:{course_id:'course'}}),maybeSingle:vi.fn().mockResolvedValue({ data:{expires_at:new Date(Date.now()+20000).toISOString()} }) }
  mocks.client.mockResolvedValue({ rpc:mocks.rpc,from:() => query })
  mocks.sign.mockResolvedValue({url:'https://test.invalid/short-lived',expiresAt:new Date(Date.now()+20000).toISOString()})
})
describe('playback route access boundary (mocked dependencies)', () => {
  it('denies anonymous requests before any media query', async () => { mocks.user.mockResolvedValue(null); expect((await request()).status).toBe(401); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.sign).not.toHaveBeenCalled() })
  it('fails closed until security verification', async () => { mocks.enabled.mockReturnValue(false); expect((await request()).status).toBe(503); expect(mocks.rpc).not.toHaveBeenCalled() })
  it('does not sign when database denies enrollment/device access', async () => { mocks.rpc.mockResolvedValue({data:null,error:{code:'42501'}}); expect((await request()).status).toBe(403); expect(mocks.sign).not.toHaveBeenCalled() })
  it('does not return or sign legacy permanent URLs', async () => { mocks.rpc.mockResolvedValue({data:'https://private.example/permanent.mp4',error:null}); const res=await request(); expect(res.status).toBe(503); expect(await res.text()).not.toContain('private.example'); expect(mocks.sign).not.toHaveBeenCalled() })
  it('never chooses an unconfigured provider', async () => { mocks.provider.mockReturnValue(null); expect((await request()).status).toBe(503); expect(mocks.sign).not.toHaveBeenCalled() })
  it('signs only after authorization and bounds expiry, with no-store', async () => { const res=await request(); expect(res.status).toBe(200); expect(res.headers.get('cache-control')).toContain('no-store'); expect(mocks.sign).toHaveBeenCalled(); expect(mocks.sign.mock.calls[0][1]).toBeLessThanOrEqual(20); expect(mocks.sign.mock.calls[0][1]).toBeGreaterThan(0); expect(await res.text()).not.toContain('courses/a/lesson.mp4') })
  it('denies expired enrollment even after RPC permission', async () => { const query={ select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue({data:{course_id:'course'}}),maybeSingle:vi.fn().mockResolvedValue({data:{expires_at:'2020-01-01'}}) }; mocks.client.mockResolvedValue({rpc:mocks.rpc,from:()=>query}); expect((await request()).status).toBe(403); expect(mocks.sign).not.toHaveBeenCalled() })
})
