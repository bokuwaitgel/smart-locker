import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { formatDate } from '../lib/utils';
import { Plus, Package, Phone } from 'lucide-react';

export function Deliveries() {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: containersData } = useQuery({
    queryKey: ['containers'],
    queryFn: () => apiClient.containers.getAll(),
  });

  const startDeliveryMutation = useMutation({
    mutationFn: (data: any) => apiClient.delivery.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] });
      setIsStartModalOpen(false);
    },
  });

  const pickupRequestMutation = useMutation({
    mutationFn: (data: any) => apiClient.delivery.requestPickup(data),
  });

  const containers = containersData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
          <p className="mt-2 text-gray-600">Manage delivery operations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start Delivery
          </button>
          <button
            onClick={() => setIsPickupModalOpen(true)}
            className="btn-secondary"
          >
            <Package className="h-4 w-4 mr-2" />
            Process Pickup
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary-50">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Deliveries</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-success-50">
              <Package className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-warning-50">
              <Package className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Pickup</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Start Delivery Modal */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Start New Delivery"
        maxWidth="lg"
      >
        <StartDeliveryForm
          containers={containers}
          onSubmit={(data) => startDeliveryMutation.mutate(data)}
          isLoading={startDeliveryMutation.isPending}
          result={startDeliveryMutation.data}
        />
      </Modal>

      {/* Pickup Request Modal */}
      <Modal
        isOpen={isPickupModalOpen}
        onClose={() => setIsPickupModalOpen(false)}
        title="Process Pickup Request"
      >
        <PickupRequestForm
          onSubmit={(data) => pickupRequestMutation.mutate(data)}
          isLoading={pickupRequestMutation.isPending}
          result={pickupRequestMutation.data}
        />
      </Modal>
    </div>
  );
}

function StartDeliveryForm({ 
  containers, 
  onSubmit, 
  isLoading, 
  result 
}: { 
  containers: any[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  result?: any;
}) {
  const [formData, setFormData] = useState({
    boardId: '',
    lockerId: '',
    deliveryMobile: '',
    pickupMobile: '',
  });

  const [availableLockers, setAvailableLockers] = useState<any[]>([]);

  const { data: lockersData } = useQuery({
    queryKey: ['container-lockers', formData.boardId],
    queryFn: () => apiClient.containers.getLockers(formData.boardId),
    enabled: !!formData.boardId,
  });

  React.useEffect(() => {
    if (lockersData?.data?.data) {
      const available = lockersData.data.data.filter((l: any) => l.status === 'AVAILABLE');
      setAvailableLockers(available);
    }
  }, [lockersData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (result?.data) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
          <Package className="h-6 w-6 text-success-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Started Successfully!</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Pickup Code:</strong> {result.data.data.pickupCode}</p>
          <p><strong>Locker ID:</strong> {result.data.data.lockerId}</p>
          <p><strong>Order ID:</strong> {result.data.data.id}</p>
        </div>
        <p className="mt-4 text-sm text-gray-500">SMS notification has been sent to the recipient.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Container
        </label>
        <select
          value={formData.boardId}
          onChange={(e) => setFormData({ ...formData, boardId: e.target.value, lockerId: '' })}
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

      {formData.boardId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Locker
          </label>
          <select
            value={formData.lockerId}
            onChange={(e) => setFormData({ ...formData, lockerId: e.target.value })}
            className="input"
            required
          >
            <option value="">Select an available locker</option>
            {availableLockers.map((locker) => (
              <option key={locker.id} value={locker.id}>
                Locker #{locker.lockerNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Mobile
        </label>
        <input
          type="tel"
          value={formData.deliveryMobile}
          onChange={(e) => setFormData({ ...formData, deliveryMobile: e.target.value })}
          className="input"
          placeholder="+976 XXXXXXXX"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pickup Mobile
        </label>
        <input
          type="tel"
          value={formData.pickupMobile}
          onChange={(e) => setFormData({ ...formData, pickupMobile: e.target.value })}
          className="input"
          placeholder="+976 XXXXXXXX"
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Start Delivery
        </button>
      </div>
    </form>
  );
}

function PickupRequestForm({ 
  onSubmit, 
  isLoading, 
  result 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  result?: any;
}) {
  const [pickupCode, setPickupCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ pickupCode });
  };

  if (result?.data) {
    return (
      <div className="text-center py-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Pickup Request Result</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pickup Code
        </label>
        <input
          type="text"
          value={pickupCode}
          onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
          className="input"
          placeholder="Enter pickup code"
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Process Pickup
        </button>
      </div>
    </form>
  );
}