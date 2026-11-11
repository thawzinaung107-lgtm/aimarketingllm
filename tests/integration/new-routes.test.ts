import { describe, expect, it } from 'vitest'
import { http, newStudent, endSession } from './helpers'
describe('new route boundaries (real local backend)',()=>{
  it('redirects every protected student/admin page when signed out',async()=>{
    for(const path of ['/redeem','/payments','/profile/devices','/checkout/123','/learn/123','/admin/courses','/admin/payments','/admin/redeem-codes','/admin/students','/admin/enrollments','/admin/devices','/admin/banners','/admin/audit-logs']) expect((await http(path)).status,path).toBe(307)
  })
  it('does not return playback or private receipts to anonymous callers',async()=>{
    const id='12345678-1234-4234-8234-123456789012'
    for(const path of [`/api/lessons/${id}/playback`,`/api/payments/${id}/receipt`]) expect((await http(path)).status).toBe(401)
  })
  it('rejects cross-origin payment submission',async()=>{expect((await http('/api/payments',{method:'POST',headers:{origin:'https://evil.example'}})).status).toBe(403)})
  it('denies direct RPCs after session revocation',async()=>{
    const s=await newStudent();await endSession(s.sessionId)
    const result=await s.client.rpc('redeem_code',{p_code:'ANY-CODE'})
    expect(result.error?.code).toBe('42501')
  })
})
