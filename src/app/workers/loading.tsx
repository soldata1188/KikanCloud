export default function Loading() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between animate-pulse">
        <div className="h-6 bg-gray-200 rounded-lg w-40"/>
        <div className="h-9 bg-gray-200 rounded-lg w-28"/>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-16"/>
            <div className="h-7 bg-gray-200 rounded w-12"/>
            <div className="h-3 bg-gray-200 rounded w-20"/>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg animate-pulse h-10"/>
      <div className="bg-white border border-gray-200 rounded-lg animate-pulse h-96"/>
    </div>
  )
}
