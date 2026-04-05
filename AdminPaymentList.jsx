import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

export default function AdminPaymentList({ payments, onApprove, onReject }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('pending');
  
  const itemsPerPage = 10;

  const filtered = payments.filter(p => 
    filterStatus === 'all' || p.status === filterStatus
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'amount') return b.amount - a.amount;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentPayments = sorted.slice(start, start + itemsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b-2 border-orange-100">
        <h2 className="text-2xl font-bold mb-4">Payment Verification</h2>
        
        <div className="flex gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border-2 border-orange-100 rounded-lg focus:border-orange-500 outline-none"
          >
            <option value="pending">Pending ({payments.filter(p => p.status === 'pending').length})</option>
            <option value="approved">Approved</option>
            <option value="all">All Payments</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border-2 border-orange-100 rounded-lg focus:border-orange-500 outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-50 border-b-2 border-orange-100">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-gray-700">Student Email</th>
              <th className="px-6 py-3 text-left font-bold text-gray-700">Book</th>
              <th className="px-6 py-3 text-left font-bold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left font-bold text-gray-700">UTR No.</th>
              <th className="px-6 py-3 text-left font-bold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left font-bold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentPayments.map(payment => (
              <tr key={payment.id} className="border-b hover:bg-orange-50 transition">
                <td className="px-6 py-4 text-sm text-gray-800">{payment.userEmail}</td>
                <td className="px-6 py-4 text-sm text-gray-800 font-bold">{payment.bookTitle}</td>
                <td className="px-6 py-4 text-sm text-gray-800">₹{payment.amount}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{payment.utrNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-800">{new Date(payment.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 flex gap-2">
                  {payment.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => onApprove(payment.id)}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => onReject(payment.id)}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-green-600 font-bold text-sm">✓ Approved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t-2 border-orange-100 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 text-orange-600 disabled:text-gray-400 font-bold"
        >
          <ChevronLeft size={20} /> Previous
        </button>

        <span className="text-sm font-bold text-gray-600">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 text-orange-600 disabled:text-gray-400 font-bold"
        >
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
