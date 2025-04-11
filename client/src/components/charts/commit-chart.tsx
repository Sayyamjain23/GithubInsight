import { CommitActivity } from "@/lib/types";

interface CommitChartProps {
  commitActivity: CommitActivity[];
}

export default function CommitChart({ commitActivity }: CommitChartProps) {
  if (!commitActivity || commitActivity.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No commit data available</p>
      </div>
    );
  }

  // Find max value for scaling
  const maxCommitCount = Math.max(...commitActivity.map(item => item.count));

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex h-40 items-end space-x-2">
        {commitActivity.map((activity, index) => {
          const heightPercentage = (activity.count / (maxCommitCount || 1)) * 100;
          // Using style for both height and background color instead of Tailwind classes
          // This is because dynamic classes like bg-blue-${variable} don't work with Tailwind's purge
          
          return (
            <div 
              key={index}
              className="w-8 rounded-t" 
              style={{ 
                height: `${heightPercentage || 5}%`, 
                backgroundColor: `rgba(59, 130, 246, ${0.5 + (index * 0.07)})`
              }}
            ></div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {commitActivity.map((activity, index) => (
          <span key={index}>{activity.month}</span>
        ))}
      </div>
    </div>
  );
}
