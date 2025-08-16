// utils/colors.ts

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'bg-gray-200 text-gray-800';
    case 'in_progress':
      return 'bg-blue-200 text-blue-800';
    case 'review':
      return 'bg-purple-200 text-purple-800';
    case 'completed':
      return 'bg-green-200 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
