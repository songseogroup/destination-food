export function LoadingSpinner() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" />
    </div>
  )
}
