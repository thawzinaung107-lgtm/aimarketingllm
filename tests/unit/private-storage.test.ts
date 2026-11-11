import { beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({getBucket:vi.fn(),from:vi.fn(),sign:vi.fn()}))
vi.mock('server-only',()=>({}))
vi.mock('@/lib/supabase/server',()=>({createServiceClient:()=>({storage:{getBucket:mocks.getBucket,from:mocks.from}})}))
import { signPrivateObject } from '@/lib/private-storage'
beforeEach(()=>{vi.resetAllMocks();mocks.getBucket.mockResolvedValue({data:{public:false},error:null});mocks.from.mockReturnValue({createSignedUrl:mocks.sign});mocks.sign.mockResolvedValue({data:{signedUrl:'https://test.invalid/signed?token=temporary'},error:null})})
it('refuses to sign objects in a public bucket',async()=>{mocks.getBucket.mockResolvedValue({data:{public:true},error:null});await expect(signPrivateObject('lesson-videos','lesson.mp4',60)).rejects.toThrow('Private storage');expect(mocks.sign).not.toHaveBeenCalled()})
it('refuses an unverifiable bucket',async()=>{mocks.getBucket.mockResolvedValue({data:null,error:{message:'offline'}});await expect(signPrivateObject('lesson-videos','lesson.mp4',60)).rejects.toThrow();expect(mocks.sign).not.toHaveBeenCalled()})
it('enforces bounded TTL even when called directly',async()=>{await expect(signPrivateObject('lesson-videos','lesson.mp4',3600)).rejects.toThrow('Invalid expiry');expect(mocks.sign).not.toHaveBeenCalled()})
it('returns only the short-lived URL after private-bucket validation',async()=>{expect(await signPrivateObject('lesson-videos','lesson.mp4',60)).toContain('token=temporary');expect(mocks.sign).toHaveBeenCalledWith('lesson.mp4',60)})
