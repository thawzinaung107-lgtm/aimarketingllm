import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
const mocks=vi.hoisted(()=>({user:vi.fn(),enabled:vi.fn(),client:vi.fn(),bucket:vi.fn(),upload:vi.fn(),remove:vi.fn(),rpc:vi.fn()}))
vi.mock('@/lib/auth',()=>({assertUser:mocks.user,AuthError:class extends Error{constructor(public status:number,message:string){super(message)}}}))
vi.mock('@/lib/feature-gates',()=>({sensitiveFeaturesEnabled:mocks.enabled}))
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}))
vi.mock('@/lib/private-storage',()=>({privateBucket:mocks.bucket}))
import { POST } from '@/app/api/payments/route'
beforeEach(()=>{
  vi.resetAllMocks();vi.stubEnv('MANUAL_PAYMENT_INSTRUCTIONS','Test fixture instructions only')
  mocks.user.mockResolvedValue({id:'student-id'});mocks.enabled.mockReturnValue(true)
  const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:{id:'course'},error:null})}
  mocks.client.mockResolvedValue({from:()=>query,rpc:mocks.rpc});mocks.rpc.mockResolvedValue({data:'payment',error:null})
  mocks.bucket.mockResolvedValue({upload:mocks.upload,remove:mocks.remove});mocks.upload.mockResolvedValue({error:null});mocks.remove.mockResolvedValue({error:null})
})
afterEach(()=>vi.unstubAllEnvs())
async function request(validImage=true){
  const f=new FormData();f.set('courseId','12345678-1234-4234-8234-123456789012');f.set('amount','1000');f.set('reference','TEST-REF')
  const bytes=validImage ? await sharp({create:{width:2,height:2,channels:3,background:'#ffffff'}}).png().toBuffer() : Buffer.from('<script>bad</script>')
  f.set('receipt',new File([new Uint8Array(bytes)],'receipt.png',{type:'image/png'}))
  return new Request('http://localhost/api/payments',{method:'POST',headers:{origin:'http://localhost'},body:f})
}
describe('payment upload boundary (mocked backend/storage)',()=>{
  it('rejects cross-origin submissions',async()=>{const r=await POST(new Request('http://localhost/api/payments',{method:'POST',headers:{origin:'https://evil.test'}}));expect(r.status).toBe(403);expect(mocks.user).not.toHaveBeenCalled()})
  it('fails closed before uploads when security is unverified',async()=>{mocks.enabled.mockReturnValue(false);expect((await POST(await request())).status).toBe(503);expect(mocks.upload).not.toHaveBeenCalled()})
  it('rejects a forged image MIME type',async()=>{expect((await POST(await request(false))).status).toBe(400);expect(mocks.upload).not.toHaveBeenCalled()})
  it('uploads under authenticated ownership, never client-selected paths',async()=>{const res=await POST(await request());expect(res.status).toBe(201);expect(mocks.upload.mock.calls[0][0]).toMatch(/^student-id\/[0-9a-f-]+\.webp$/);expect(mocks.rpc.mock.calls[0][0]).toBe('submit_manual_payment');expect((await res.json()).message).toContain('No course access');expect(mocks.rpc).not.toHaveBeenCalledWith('approve_manual_payment',expect.anything())})
  it('cleans up the uploaded receipt if the payment RPC rejects',async()=>{mocks.rpc.mockResolvedValue({error:{code:'LMS06'}});expect((await POST(await request())).status).toBe(409);expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]])})
  it('does not submit a payment if uploading fails',async()=>{mocks.upload.mockResolvedValue({error:{message:'offline'}});expect((await POST(await request())).status).toBe(503);expect(mocks.rpc).not.toHaveBeenCalled()})
})
