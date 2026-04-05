import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function EmailVerification() {
  const [isVerified, setIsVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setVerificationSent(true);
        alert('Verification email sent! Check your inbox.');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const checkVerification = () => {
    const user = auth.currentUser;
    if (user) {
      user.reload().then(() => {
        if (user.emailVerified) {
          setIsVerified(true);
        }
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100">
      <div className="flex items-center gap-4">
        {isVerified ? (
          <>
            <CheckCircle className="text-green-500" size={32} />
            <div>
              <h3 className="font-bold text-green-600">Email Verified</h3>
              <p className="text-sm text-gray-600">Your email is verified. You can now purchase books.</p>
            </div>
          </>
        ) : (
          <>
            <Mail className="text-blue-500" size={32} />
            <div>
              <h3 className="font-bold text-gray-800">Verify Your Email</h3>
              <p className="text-sm text-gray-600">Verify your email to purchase books</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {!isVerified && (
          <>
            <button
              onClick={handleSendVerification}
              disabled={loading || verificationSent}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : verificationSent ? 'Email Sent' : 'Send Verification'}
            </button>
            <button
              onClick={checkVerification}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              Check Verification
            </button>
          </>
        )}
      </div>
    </div>
  );
}
