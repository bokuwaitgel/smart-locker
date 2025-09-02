import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { Package, Archive, Truck, CreditCard } from 'lucide-react';

export function Dashboard() {
  const { data: containers, isLoading: containersLoading } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.getAll(),
  });

  const { data: lockers, isLoading: lockersLoading } = useQuery({
    queryKey: ['lockers'],
    queryFn: () => apiClient.lockers.getStatus(),
  });

  if (containersLoading || lockersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const containerData = containers?.data?.data || [];
  const lockerData = lockers?.data?.data || [];

  const stats = [
    {
      name: 'Total Containers',
      value: containerData.length,
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Total Lockers',
      value: lockerData.length,
      icon: Archive,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      name: 'Available Lockers',
      value: lockerData.filter((l: any) => l.status === 'AVAILABLE').length,
      icon: Archive,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      name: 'Occupied Lockers',
      value: lockerData.filter((l: any) => l.status === 'OCCUPIED').length,
      icon: Truck,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your smart locker system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Container Status */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Container Status</h3>
          </div>
          <div className="p-6">
            {containerData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No containers found</p>
            ) : (
              <div className="space-y-4">
                {containerData.slice(0, 5).map((container: any) => (
                  <div key={container.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{container.location}</p>
                      <p className="text-sm text-gray-500">Board ID: {container.boardId}</p>
                    </div>
                    <StatusBadge status={container.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Locker Overview */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Locker Overview</h3>
          </div>
          <div className="p-6">
            {lockerData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No lockers found</p>
            ) : (
              <div className="space-y-4">
                {lockerData.slice(0, 5).map((locker: any) => (
                  <div key={locker.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Locker #{locker.lockerNumber}</p>
                      <p className="text-sm text-gray-500">ID: {locker.id}</p>
                    </div>
                    <StatusBadge status={locker.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}