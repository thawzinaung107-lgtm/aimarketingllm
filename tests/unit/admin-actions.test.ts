import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({ admin:vi.fn(),enabled:vi.fn(),client:vi.fn(),rpc:vi.fn() }))
vi.mock('@/lib/auth',()=>({assertAdmin:mocks.admin}))
vi.mock('@/lib/feature-gates',()=>({sensitiveFeaturesEnabled:mocks.enabled}))
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
import { adminAction } from '@/app/admin/actions'
beforeEach(()=>{vi.resetAllMocks();mocks.enabled.mockReturnValue(true);mocks.admin.mockResolvedValue({id:'admin'});mocks.client.mockResolvedValue({rpc:mocks.rpc})})
const form=(values:Record<string,string>)=>{const f=new FormData();Object.entries(values).forEach(([k,v])=>f.set(k,v));return f}
describe('admin mutations',()=>{
  it('rechecks authorization inside the action',async()=>{mocks.admin.mockRejectedValue(new Error('Admin access required'));await expect(adminAction({message:''},form({operation:'approve'}))).rejects.toThrow('Admin access');expect(mocks.client).not.toHaveBeenCalled()})
  it('blocks unverified releases before connecting to DB',async()=>{mocks.enabled.mockReturnValue(false);expect((await adminAction({message:''},form({operation:'approve'}))).ok).not.toBe(true);expect(mocks.client).not.toHaveBeenCalled()})
  it('requires explicit receipt verification before approving',async()=>{const r=await adminAction({message:''},form({operation:'approve'}));expect(r.message).toContain('verified');expect(mocks.rpc).not.toHaveBeenCalled()})
  it('does not manufacture success on a rejected operation',async()=>{mocks.rpc.mockResolvedValue({error:{message:'denied'}});const r=await adminAction({message:''},form({operation:'reject',id:'12345678-1234-4234-8234-123456789012',reason:'Receipt not valid'}));expect(r.ok).not.toBe(true)})
  it('requires an explicit future access expiry',async()=>{const r=await adminAction({message:''},form({operation:'grant',expires_at:'2020-01-01T00:00:00Z'}));expect(r.message).toContain('future');expect(mocks.rpc).not.toHaveBeenCalled()})
})
