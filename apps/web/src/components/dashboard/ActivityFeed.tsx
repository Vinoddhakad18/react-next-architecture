/**
 * ActivityFeed Component
 * Displays a feed of recent activity with color-coded indicators
 */

interface Activity {
  id: string;
  message: string;
  time: string;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red';
}

interface ActivityFeedProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  { id: '1', message: 'New order received', time: '2 minutes ago', color: 'green' },
  { id: '2', message: 'User registration', time: '15 minutes ago', color: 'blue' },
  { id: '3', message: 'Product updated', time: '1 hour ago', color: 'purple' },
];

export function ActivityFeed({ activities = defaultActivities }: ActivityFeedProps) {
  const getColorClass = (color: Activity['color']) => {
    const colorMap = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return colorMap[color] || 'bg-slate-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-2 h-2 ${getColorClass(activity.color)} rounded-full mt-2`}></div>
            <div>
              <p className="text-sm text-slate-900 font-medium">{activity.message}</p>
              <p className="text-xs text-slate-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
