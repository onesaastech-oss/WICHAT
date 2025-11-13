import React from 'react';
import { Users, Check } from 'lucide-react';
import { contactGroups } from '../../data/campaignData';

export default function GroupsSelector({ selectedGroups, setSelectedGroups }) {
  const handleToggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Select Groups ({selectedGroups.length} selected)</h3>
      </div>
      {contactGroups.map(group => (
        <div
          key={group.id}
          onClick={() => handleToggleGroup(group.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedGroups.includes(group.id)
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${group.color} rounded-full flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-800">{group.name}</div>
                <div className="text-sm text-gray-500">{group.count} contacts</div>
              </div>
            </div>
            {selectedGroups.includes(group.id) && (
              <Check className="w-6 h-6 text-indigo-600" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

