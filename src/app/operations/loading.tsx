export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-44px)] animate-pulse">
      <div className="w-[180px] border-r border-gray-200 p-3 space-y-2 flex-shrink-0">
        <div className="h-8 bg-gray-200 rounded mb-3"/>
        {[0,1,2,3,4].map(j => <div key={j} className="h-11 bg-gray-100 rounded"/>)}
      </div>
      <div className="w-[260px] border-r border-gray-200 p-3 space-y-2 flex-shrink-0">
        <div className="h-8 bg-gray-200 rounded mb-3"/>
        {[0,1,2,3,4].map(j => <div key={j} className="h-11 bg-gray-100 rounded"/>)}
      </div>
      <div className="flex-1 p-3 space-y-2">
        <div className="h-8 bg-gray-200 rounded mb-3"/>
        {[0,1,2,3,4].map(j => <div key={j} className="h-16 bg-gray-100 rounded"/>)}
      </div>
    </div>
  )
}
