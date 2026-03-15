export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-44px)] animate-pulse">
      <div className="w-[256px] border-r border-gray-200 p-3 space-y-2 hidden md:flex flex-col flex-shrink-0">
        <div className="h-8 bg-gray-200 rounded mb-3"/>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg"/>
        ))}
      </div>
      <div className="flex-1 flex flex-col p-5 space-y-4">
        {[0,1,2,3].map(i => (
          <div key={i} className={`flex gap-3 ${i%2===0 ? '' : 'flex-row-reverse'}`}>
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0"/>
            <div className={`h-16 bg-gray-200 rounded-xl ${i%2===0 ? 'w-2/3' : 'w-1/2'}`}/>
          </div>
        ))}
        <div className="mt-auto h-14 bg-gray-100 rounded-xl"/>
      </div>
    </div>
  )
}
