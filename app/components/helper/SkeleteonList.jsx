export default function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
        ></div>
      ))}
    </div>
  );
}
