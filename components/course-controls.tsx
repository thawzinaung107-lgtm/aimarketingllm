'use client'
export function CourseSearch({ value, onChange }: { value:string; onChange:(value:string)=>void }) {
  return <input type="search" aria-label="Search courses" placeholder="Search courses by name or topic" value={value} onChange={e => onChange(e.target.value)} className="min-w-0 w-full flex-1 rounded-[10px] border border-[#dcdfe3] px-3.5 py-3 max-[480px]:basis-full min-[481px]:max-w-[440px]" />
}
export function CourseFilters({ categories, value, onChange }: { categories:string[]; value:string|null; onChange:(value:string|null)=>void }) {
  return <div className="flex flex-wrap gap-3" role="group" aria-label="Filter by category">{[null,...categories].map(c => <button key={c ?? 'all'} type="button" onClick={() => onChange(c)} aria-pressed={c === value} className={`rounded-[9px] border px-3.5 py-2.5 text-xs ${c === value ? 'border-ink bg-ink text-white' : 'border-[#dddfe2] bg-white text-[#45484d]'}`}>{c ?? 'All courses'}</button>)}</div>
}
