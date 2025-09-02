import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, Database, MessageSquare, CreditCard } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'api', name: 'API Settings', icon: Server },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'sms', name: 'SMS Config', icon: MessageSquare },
    { id: 'payment', name: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Configure your smart locker system</p>
      </div>

      <div className="flex space-x-8">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'api' && <APISettings />}
            {activeTab === 'database' && <DatabaseSettings />}
            {activeTab === 'sms' && <SMSSettings />}
            {activeTab === 'payment' && <PaymentSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Name
          </label>
          <input
            type="text"
            defaultValue="Smart Locker System"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Location
          </label>
          <input
            type="text"
            defaultValue="Main Building"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select className="input">
            <option>Asia/Ulaanbaatar</option>
            <option>UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function APISettings() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Base URL
          </label>
          <input
            type="url"
            defaultValue="http://localhost:3030"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Version
          </label>
          <input
            type="text"
            defaultValue="v1"
            className="input"
          />
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Changes to API settings require application restart.
          </p>
        </div>
      </div>
    </div>
  );
}

function DatabaseSettings() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Database Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Database URL
          </label>
          <input
            type="text"
            defaultValue="postgresql://..."
            className="input"
            placeholder="Database connection string"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Pool Size
            </label>
            <input
              type="number"
              defaultValue="10"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query Timeout (ms)
            </label>
            <input
              type="number"
              defaultValue="5000"
              className="input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SMSSettings() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Twilio Account SID
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter Twilio Account SID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Twilio Auth Token
          </label>
          <input
            type="password"
            className="input"
            placeholder="Enter Twilio Auth Token"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Phone Number
          </label>
          <input
            type="tel"
            className="input"
            placeholder="+1234567890"
          />
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> SMS notifications are automatically sent for delivery codes and payment confirmations.
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Configuration</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            QPay Username
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter QPay username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            QPay Password
          </label>
          <input
            type="password"
            className="input"
            placeholder="Enter QPay password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Service Charge
          </label>
          <input
            type="number"
            defaultValue="100"
            className="input"
            placeholder="Amount in MNT"
          />
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Secure:</strong> Payment credentials are encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}