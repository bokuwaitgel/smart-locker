import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { MessageSquare, Send, Phone } from 'lucide-react';

export function SMS() {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const sendSMSMutation = useMutation({
    mutationFn: (data: any) => apiClient.sms.send(data),
    onSuccess: () => {
      setIsSendModalOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Management</h1>
          <p className="mt-2 text-gray-600">Send notifications and manage SMS communications</p>
        </div>
        <button
          onClick={() => setIsSendModalOpen(true)}
          className="btn-primary"
        >
          <Send className="h-4 w-4 mr-2" />
          Send SMS
        </button>
      </div>

      {/* SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary-50">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Messages Sent Today</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-success-50">
              <MessageSquare className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Delivery Notifications</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-warning-50">
              <MessageSquare className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Payment Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Templates */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Common SMS Templates</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Pickup Code Notification</h4>
              <p className="text-sm text-gray-600 mb-3">
                "Таны илгээмж бэлэн боллоо! Байршил: [LOCATION] Код: [CODE]"
              </p>
              <button className="text-primary-600 text-sm hover:text-primary-700">
                Use Template
              </button>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Payment Confirmation</h4>
              <p className="text-sm text-gray-600 mb-3">
                "Таны захиалга амжилттай төлөгдлөө. Код: [CODE]"
              </p>
              <button className="text-primary-600 text-sm hover:text-primary-700">
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send SMS Modal */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send SMS"
      >
        <SendSMSForm
          onSubmit={(data) => sendSMSMutation.mutate(data)}
          isLoading={sendSMSMutation.isPending}
          result={sendSMSMutation.data}
        />
      </Modal>
    </div>
  );
}

function SendSMSForm({ 
  onSubmit, 
  isLoading, 
  result 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  result?: any;
}) {
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (result?.data) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4">
          <MessageSquare className="h-6 w-6 text-success-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Sent Successfully!</h3>
        <p className="text-sm text-gray-600">Message delivered to {formData.phone}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="input"
          placeholder="+976 XXXXXXXX"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="input"
          rows={4}
          placeholder="Enter your message..."
          required
        />
      </div>
      <div className="text-sm text-gray-500">
        Character count: {formData.message.length}/160
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Send SMS
        </button>
      </div>
    </form>
  );
}