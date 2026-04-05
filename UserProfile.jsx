import React from 'react';
import { User } from 'lucide-react';
import EmailVerification from './EmailVerification';

export default function UserProfile({ currentUser, purchases }) {
  const totalSpent = purchases
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const purchaseHistory = purchases
    .filter(p => p.status === 'approved')
    .map(p => ({
      item: p.bookTitle,
      amount: p.amount,
      date: p.createdAt?.toDate?.() || new Date()
    }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            <p className="text-gray-600">{currentUser.email}</p>
            <p className={`text-sm font-bold ${currentUser.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
              {currentUser.emailVerified ? '✓ Email Verified' : '✗ Email Not Verified'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">📊 Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Books Purchased:</span>
              <span className="font-bold">{purchaseHistory.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Spent:</span>
              <span className="font-bold text-orange-600">₹{totalSpent}</span>
            </div>
          </div>
        </div>

        <EmailVerification />
      </div>

      {purchaseHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">📚 Purchase History</h3>
          <div className="space-y-3">
            {purchaseHistory.map((purchase, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-bold">{purchase.item}</span>
                <span className="text-orange-600 font-bold">₹{purchase.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
