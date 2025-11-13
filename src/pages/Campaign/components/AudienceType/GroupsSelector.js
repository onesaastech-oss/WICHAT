import React, { useState, useEffect } from 'react';
import { Users, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Encrypt } from '../../../encryption/payload-encryption';

// Color palette for group icons
const GROUP_COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

export default function GroupsSelector({ selectedGroups, setSelectedGroups }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  // Load auth tokens from storage
  useEffect(() => {
    const loadTokens = () => {
      try {
        if (typeof window === 'undefined') return;
        const storages = [localStorage, sessionStorage];
        for (const storage of storages) {
          try {
            const data = storage?.getItem('userData');
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed && typeof parsed === 'object') {
                setTokens(parsed);
                return;
              }
            }
          } catch (storageError) {
            console.error('Failed to parse tokens from storage:', storageError);
          }
        }
        setTokens(null);
      } catch (e) {
        console.error('Failed to load tokens:', e);
      }
    };
    loadTokens();
  }, []);

  // Load groups from API
  useEffect(() => {
    if (!tokens?.token || !tokens?.username) return;

    const loadGroups = async () => {
      try {
        setLoading(true);
        console.log('🌐 Loading groups from API...');

        const payload = {
          project_id: tokens.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          last_id: 0
        };

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/contact/group-list',
          data_pass,
          {
            headers: {
              'token': tokens.token,
              'username': tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response?.data?.error) {
          const apiList = response?.data?.data || [];
          console.log(`📥 Received ${apiList.length} groups from API`);

          // Map API response to component format with colors
          const mappedGroups = apiList.map((g, index) => ({
            id: g.group_id,
            name: g.name,
            count: g.contact_count || 0,
            color: GROUP_COLORS[index % GROUP_COLORS.length], // Cycle through colors
            remark: g.remark,
            createdOn: g.create_date
          }));

          setGroups(mappedGroups);
          console.log(`✅ Loaded ${mappedGroups.length} groups`);
        } else {
          console.warn('⚠️ API returned error:', response?.data?.message);
          setGroups([]);
        }
      } catch (error) {
        console.error('❌ Error loading groups:', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [tokens?.token, tokens?.username, tokens?.projects]);

  const handleToggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Select Groups ({selectedGroups.length} selected)</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading groups...</span>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Select Groups ({selectedGroups.length} selected)</h3>
        </div>
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No groups available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Select Groups ({selectedGroups.length} selected)</h3>
      </div>
      {groups.map(group => (
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

