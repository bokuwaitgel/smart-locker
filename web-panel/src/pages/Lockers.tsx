import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { formatDate } from '../lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Locker } from '../types/api';

export function Lockers() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const queryClient = useQueryClient();

  const { data: lockersData, isLoading } = useQuery({
    queryKey: ['lockers'],
    queryFn: () => apiClient.lockers.getStatus(),
  });

  const { data: containersData } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.lockers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiClient.lockers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      setIsEditModalOpen(false);
      setSelectedLocker(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.lockers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
    },
  });

  const lockers = lockersData?.data?.data || [];
  const containers = containersData?.data?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lockers</h1>
          <p className="mt-2 text-gray-600">Manage individual locker units</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Locker
        </button>
      </div>

      {/* Lockers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lockers.map((locker: Locker) => (
                <tr key={locker.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{locker.lockerNumber}
                      </div>
                      <div className="text-sm text-gray-500">ID: {locker.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {locker.boardId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={locker.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(locker.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLocker(locker);
                          setIsEditModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(locker.id)}
                        className="text-error-600 hover:text-error-900"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Locker Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Locker"
      >
        <CreateLockerForm
          containers={containers}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Locker Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLocker(null);
        }}
        title="Edit Locker"
      >
        {selectedLocker && (
          <EditLockerForm
            locker={selectedLocker}
            onSubmit={(data) => updateMutation.mutate({ id: selectedLocker.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}

function CreateLockerForm({ 
  containers, 
  onSubmit, 
  isLoading 
}: { 
  containers: any[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    boardId: '',
    lockerNumber: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Container
        </label>
        <select
          value={formData.boardId}
          onChange={(e) => setFormData({ ...formData, boardId: e.target.value })}
          className="input"
          required
        >
          <option value="">Select a container</option>
          {containers.map((container) => (
            <option key={container.id} value={container.boardId}>
              {container.boardId} - {container.location}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Locker Number
        </label>
        <input
          type="text"
          value={formData.lockerNumber}
          onChange={(e) => setFormData({ ...formData, lockerNumber: e.target.value })}
          className="input"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Create Locker
        </button>
      </div>
    </form>
  );
}

function EditLockerForm({ 
  locker, 
  onSubmit, 
  isLoading 
}: { 
  locker: Locker; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    status: locker.status,
    description: locker.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const statusOptions = ['AVAILABLE', 'OCCUPIED', 'PENDING', 'MAINTENANCE'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Locker Number
        </label>
        <input
          type="text"
          value={locker.lockerNumber}
          className="input bg-gray-50"
          disabled
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="input"
          required
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Update Locker
        </button>
      </div>
    </form>
  );
}