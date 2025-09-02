import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import { CreditCard, Search, CheckCircle } from 'lucide-react';

export function Payments() {
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, deliveryId }: { paymentId: number; deliveryId: number }) => 
      apiClient.payment.verify(paymentId, deliveryId),
  });

  const checkMutation = useMutation({
    mutationFn: (invoiceId: string) => apiClient.payment.checkPayment(invoiceId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-gray-600">Monitor and verify payment transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="btn-primary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Verify Payment
          </button>
          <button
            onClick={() => setIsCheckModalOpen(true)}
            className="btn-secondary"
          >
            <Search className="h-4 w-4 mr-2" />
            Check Invoice
          </button>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-success-50">
              <CreditCard className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Successful Payments</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-warning-50">
              <CreditCard className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-error-50">
              <CreditCard className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed Payments</p>
              <p className="text-2xl font-semibold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Tools */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Management Tools</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Use the tools above to verify payments and check invoice status. 
            Payment verification ensures that QPay transactions are properly processed 
            and delivery orders are updated accordingly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Verify Payment</h4>
              <p className="text-sm text-gray-600">
                Verify a payment using payment ID and delivery ID to confirm transaction completion.
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Check Invoice</h4>
              <p className="text-sm text-gray-600">
                Check the status of a QPay invoice using the invoice ID.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Payment Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Verify Payment"
      >
        <VerifyPaymentForm
          onSubmit={(data) => verifyMutation.mutate(data)}
          isLoading={verifyMutation.isPending}
          result={verifyMutation.data}
        />
      </Modal>

      {/* Check Invoice Modal */}
      <Modal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        title="Check Invoice Status"
      >
        <CheckInvoiceForm
          onSubmit={(invoiceId) => checkMutation.mutate(invoiceId)}
          isLoading={checkMutation.isPending}
          result={checkMutation.data}
        />
      </Modal>
    </div>
  );
}

function VerifyPaymentForm({ 
  onSubmit, 
  isLoading, 
  result 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
  result?: any;
}) {
  const [formData, setFormData] = useState({
    paymentId: '',
    deliveryId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentId: parseInt(formData.paymentId),
      deliveryId: parseInt(formData.deliveryId),
    });
  };

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Verification Result</h3>
          <div className="p-4 bg-gray-50 rounded-lg text-left">
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
          Payment ID
        </label>
        <input
          type="number"
          value={formData.paymentId}
          onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
          className="input"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery ID
        </label>
        <input
          type="number"
          value={formData.deliveryId}
          onChange={(e) => setFormData({ ...formData, deliveryId: e.target.value })}
          className="input"
          required
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Verify Payment
        </button>
      </div>
    </form>
  );
}

function CheckInvoiceForm({ 
  onSubmit, 
  isLoading, 
  result 
}: { 
  onSubmit: (invoiceId: string) => void; 
  isLoading: boolean;
  result?: any;
}) {
  const [invoiceId, setInvoiceId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(invoiceId);
  };

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <Search className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Invoice Status</h3>
          <div className="p-4 bg-gray-50 rounded-lg text-left">
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
          Invoice ID
        </label>
        <input
          type="text"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          className="input"
          placeholder="Enter QPay invoice ID"
          required
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Check Invoice
        </button>
      </div>
    </form>
  );
}