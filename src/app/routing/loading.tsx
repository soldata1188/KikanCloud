export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-44px)] animate-pulse">
      <div className="w-[340px] border-r border-gray-200 p-3 space-y-3 hidden md:flex flex-col flex-shrink-0">
        <div className="h-24 bg-gray-200 rounded-lg"/>
        <div className="h-9 bg-gray-200 rounded"/>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded"/>
        ))}
      </div>
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto"/>
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto"/>
        </div>
      </div>
    </div>
  )
}
