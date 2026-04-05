import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy } from "firebase/firestore";
import { BookOpen, Lock, ShoppingCart, Upload, LogIn, LogOut, User, Eye, EyeOff, CheckCircle, AlertCircle, FileText, Shield, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';

// ===== IMPORT CUSTOM COMPONENTS =====
import SearchAndFilter from './components/SearchAndFilter';
import EmailVerification from './components/EmailVerification';
import UserProfile from './components/UserProfile';
import AdminPaymentList from './components/AdminPaymentList';
import { validateEmail, validateUTR, validatePrice, validatePassword } from './utils/validation';
import { sanitizeHTML } from './utils/sanitizeContent';

// ===== FIREBASE CONFIG (from environment variables) =====
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function PDSUDigitalLibrary() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [books, setBooks] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBooks, setFilteredBooks] = useState([]);

  // ===== AUTH & DATA SYNC =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = user.email === import.meta.env.VITE_ADMIN_EMAIL;
        setCurrentUser({ 
          uid: user.uid, 
          email: user.email, 
          isAdmin, 
          name: user.displayName || 'Student',
          emailVerified: user.emailVerified
        });
        fetchPurchases(user.uid);
      } else {
        setCurrentUser(null);
        setPurchases([]);
      }
      fetchBooks();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchBooks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "books"));
      const booksData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBooks(booksData);
      setFilteredBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
      alert("Error loading books. Please try again.");
    }
  };

  const fetchPurchases = async (uid) => {
    try {
      const q = query(collection(db, "purchases"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      setPurchases(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('home');
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-orange-50 text-orange-600 font-bold text-xl">
      Loading PDSU Library...
    </div>
  );

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900">
      <Header currentUser={currentUser} setCurrentView={setCurrentView} logout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'home' && <HomePage setCurrentView={setCurrentView} currentUser={currentUser} />}
        {currentView === 'login' && <LoginPage setCurrentView={setCurrentView} />}
        {currentView === 'register' && <RegisterPage setCurrentView={setCurrentView} />}
        
        {currentView === 'library' && (
          <LibraryPage 
            books={filteredBooks} 
            currentUser={currentUser} 
            purchases={purchases} 
            setCurrentView={setCurrentView} 
            refreshPurchases={fetchPurchases}
            onFilter={setFilteredBooks}
            allBooks={books}
          />
        )}
        
        {currentView === 'my-books' && (
          <MyBooksPage 
            books={books} 
            currentUser={currentUser} 
            purchases={purchases} 
            setCurrentView={setCurrentView} 
          />
        )}
        
        {currentView === 'profile' && currentUser && (
          <UserProfilePage currentUser={currentUser} purchases={purchases} />
        )}
        
        {currentView === 'admin' && currentUser?.isAdmin && (
          <AdminPanel 
            books={books} 
            purchases={purchases}
            refreshBooks={fetchBooks} 
            refreshPurchases={() => fetchPurchases(currentUser.uid)}
          />
        )}
        
        {currentView.startsWith('view-') && (
          <BookViewer 
            bookId={currentView.split('-')[1]} 
            books={books} 
            currentUser={currentUser} 
            purchases={purchases} 
            setCurrentView={setCurrentView} 
          />
        )}
      </main>

      <footer className="text-center py-10 text-gray-400 text-sm border-t border-orange-200">
        © 2026 PDSU Digital Library | Secure Platform Powered by Firebase
      </footer>
    </div>
  );
}

// ===== HEADER COMPONENT =====
function Header({ currentUser, setCurrentView, logout }) {
  return (
    <header className="bg-gradient-to-r from-orange-700 to-red-800 text-white shadow-xl p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="cursor-pointer" onClick={() => setCurrentView('home')}>
          <h1 className="text-xl font-black tracking-tighter">PDSU LIBRARY</h1>
          <p className="text-[10px] opacity-80 uppercase font-bold">Shekhawati University</p>
        </div>
        <nav className="flex gap-3 items-center flex-wrap">
          {currentUser ? (
            <>
              <button onClick={() => setCurrentView('library')} className="text-xs font-bold uppercase hover:underline">Library</button>
              <button onClick={() => setCurrentView('my-books')} className="text-xs font-bold uppercase hover:underline">My Books</button>
              <button onClick={() => setCurrentView('profile')} className="flex items-center gap-1 text-xs font-bold uppercase hover:underline">
                <User size={14} /> Profile
              </button>
              {currentUser.isAdmin && (
                <button onClick={() => setCurrentView('admin')} className="bg-white text-red-700 px-3 py-1 rounded-full text-xs font-bold shadow-lg">ADMIN</button>
              )}
              <button onClick={logout} className="bg-red-600 p-2 rounded-lg hover:bg-red-700 transition" title="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => setCurrentView('login')} className="bg-white text-orange-700 px-6 py-2 rounded-xl font-bold">Login</button>
          )}
        </nav>
      </div>
    </header>
  );
}

// ===== HOME PAGE =====
function HomePage({ setCurrentView, currentUser }) {
  return (
    <div className="text-center py-20">
      <h2 className="text-5xl font-black text-orange-900 mb-4 tracking-tighter">SUCCESS STARTS HERE.</h2>
      <p className="text-xl text-orange-700 mb-8 opacity-80">Access Important Questions for PDSU Shekhawati University Exam 2026</p>
      {!currentUser ? (
        <button 
          onClick={() => setCurrentView('register')} 
          className="bg-orange-600 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-2xl shadow-orange-300 hover:scale-105 transition-transform"
        >
          REGISTER & START STUDYING
        </button>
      ) : (
        <button 
          onClick={() => setCurrentView('library')} 
          className="bg-orange-600 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-2xl shadow-orange-300 hover:scale-105 transition-transform"
        >
          BROWSE LIBRARY
        </button>
      )}
    </div>
  );
}

// ===== LIBRARY PAGE WITH SEARCH & FILTER =====
function LibraryPage({ books, currentUser, purchases, setCurrentView, refreshPurchases, onFilter, allBooks }) {
  const [selectedBook, setSelectedBook] = useState(null);

  const getStatus = (bookId) => {
    const p = purchases.find(p => p.bookId === bookId);
    return p ? p.status : null;
  };

  return (
    <div>
      <SearchAndFilter books={allBooks} onFilter={onFilter} />
      
      {books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500 font-bold">No books found matching your criteria</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {books.map(book => {
            const status = getStatus(book.id);
            return (
              <div key={book.id} className="bg-white p-6 rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-400 transition-all">
                <div className="bg-orange-50 h-40 rounded-xl mb-4 flex items-center justify-center text-orange-200">
                  <FileText size={64} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{book.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{book.subject} • {book.category}</p>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-2xl font-black text-orange-600">₹{book.price}</span>
                  {status === 'approved' && <span className="text-green-600 font-bold text-sm flex items-center gap-1"><CheckCircle size={16}/> Owned</span>}
                  {status === 'pending' && <span className="text-orange-500 font-bold text-sm">Verifying...</span>}
                </div>

                {status === 'approved' ? (
                  <button 
                    onClick={() => setCurrentView(`view-${book.id}`)} 
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
                  >
                    Open Book
                  </button>
                ) : status === 'pending' ? (
                  <button disabled className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-bold">
                    Payment Processing
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (!currentUser?.emailVerified) {
                        alert("Please verify your email first!");
                        return;
                      }
                      setSelectedBook(book);
                    }} 
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg shadow-orange-200 transition"
                  >
                    Get it Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {selectedBook && (
        <PaymentModal 
          book={selectedBook} 
          currentUser={currentUser} 
          onClose={() => setSelectedBook(null)} 
          refreshPurchases={refreshPurchases} 
        />
      )}
    </div>
  );
}

// ===== PAYMENT MODAL =====
function PaymentModal({ book, currentUser, onClose, refreshPurchases }) {
  const [utr, setUtr] = useState('');
  const [loading, setLoading] = useState(false);
  const upiId = "7727867614@postbank";

  const handlePay = async () => {
    if (!validateUTR(utr)) {
      alert("Please enter a valid 12-digit UTR number");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "purchases"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        bookId: book.id,
        bookTitle: book.title,
        amount: book.price,
        utrNumber: utr,
        status: 'pending',
        createdAt: new Date()
      });
      alert("Verification Request Sent! Admin will verify in 1-2 hours.");
      refreshPurchases(currentUser.uid);
      onClose();
    } catch (e) {
      alert("Error! Try again: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
        <h3 className="text-xl font-black mb-4">SECURE PAYMENT</h3>
        <div className="bg-gray-100 p-4 rounded-2xl mb-4 inline-block">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${upiId}%26pn=GIRIRAJ%20PAREEK%26am=${book.price}%26cu=INR`} 
            alt="QR Code" 
          />
        </div>
        <p className="text-xs text-gray-400 mb-6 uppercase font-bold tracking-widest">GIRIRAJ PAREEK • IPPB</p>
        <div className="text-left mb-6">
          <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">UTR Number (12 Digits)</label>
          <input 
            maxLength="12" 
            type="text" 
            value={utr} 
            onChange={e => setUtr(e.target.value.replace(/\D/g,''))} 
            className="w-full p-4 bg-orange-50 border-2 border-orange-100 rounded-xl font-mono text-center text-lg outline-none focus:border-orange-500" 
            placeholder="0000 0000 0000" 
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 font-bold text-gray-400 hover:text-gray-600"
          >
            Back
          </button>
          <button 
            onClick={handlePay} 
            disabled={utr.length < 12 || loading} 
            className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-xl disabled:bg-gray-300 uppercase text-xs hover:bg-orange-700 transition"
          >
            {loading ? 'Processing...' : 'Verify Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MY BOOKS PAGE =====
function MyBooksPage({ books, currentUser, purchases, setCurrentView }) {
  const approvedIds = purchases.filter(p => p.status === 'approved').map(p => p.bookId);
  const myBooks = books.filter(b => approvedIds.includes(b.id));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Purchased Content</h2>
      {myBooks.length === 0 ? (
        <p className="text-gray-400">No books owned yet.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {myBooks.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-sm hover:shadow-lg transition">
              <h3 className="font-bold mb-4">{b.title}</h3>
              <button 
                onClick={() => setCurrentView(`view-${b.id}`)} 
                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
              >
                Open Access
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== USER PROFILE PAGE =====
function UserProfilePage({ currentUser, purchases }) {
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

// ===== ADMIN PANEL =====
function AdminPanel({ books, purchases, refreshBooks, refreshPurchases }) {
  const [view, setView] = useState('payments');
  const pendingPayments = purchases.filter(p => p.status === 'pending');

  const handleApprove = async (paymentId) => {
    try {
      await updateDoc(doc(db, "purchases", paymentId), { status: 'approved' });
      alert("Payment approved!");
      refreshPurchases();
    } catch (error) {
      alert("Error approving payment: " + error.message);
    }
  };

  const handleReject = async (paymentId) => {
    try {
      await updateDoc(doc(db, "purchases", paymentId), { status: 'rejected' });
      alert("Payment rejected!");
      refreshPurchases();
    } catch (error) {
      alert("Error rejecting payment: " + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setView('payments')} 
          className={`flex-1 py-3 rounded-xl font-bold transition ${view === 'payments' ? 'bg-orange-600 text-white' : 'bg-white'}`}
        >
          Payments ({pendingPayments.length})
        </button>
        <button 
          onClick={() => setView('upload')} 
          className={`flex-1 py-3 rounded-xl font-bold transition ${view === 'upload' ? 'bg-orange-600 text-white' : 'bg-white'}`}
        >
          Upload Book
        </button>
      </div>

      {view === 'payments' && (
        <AdminPaymentList 
          payments={pendingPayments} 
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {view === 'upload' && (
        <UploadForm refresh={refreshBooks} />
      )}
    </div>
  );
}

// ===== UPLOAD FORM =====
function UploadForm({ refresh }) {
  const [data, setData] = useState({ title: '', subject: '', price: '', content: '', category: 'Important Questions' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    
    if (!data.title || !data.subject || !data.price || !data.content) {
      alert("Please fill all fields");
      return;
    }

    if (!validatePrice(data.price)) {
      alert("Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "books"), {
        title: data.title,
        subject: data.subject,
        price: parseInt(data.price),
        content: sanitizeHTML(data.content),
        category: data.category,
        createdAt: new Date()
      });
      alert("Book Uploaded Successfully!");
      setData({ title: '', subject: '', price: '', content: '', category: 'Important Questions' });
      refresh();
    } catch (error) {
      alert("Error uploading book: " + error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={save} className="bg-white p-8 rounded-3xl shadow-xl grid gap-4">
      <input 
        placeholder="Book Title" 
        className="p-4 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none" 
        value={data.title} 
        onChange={e => setData({...data, title: e.target.value})} 
        required 
      />
      <input 
        placeholder="Subject" 
        className="p-4 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none" 
        value={data.subject} 
        onChange={e => setData({...data, subject: e.target.value})} 
        required 
      />
      <input 
        type="number" 
        placeholder="Price (₹)" 
        className="p-4 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none" 
        value={data.price} 
        onChange={e => setData({...data, price: e.target.value})} 
        required 
      />
      <select 
        className="p-4 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none"
        value={data.category}
        onChange={e => setData({...data, category: e.target.value})}
      >
        <option>Important Questions</option>
        <option>Study Notes</option>
        <option>Previous Papers</option>
        <option>Guides</option>
      </select>
      <textarea 
        placeholder="HTML Content or PDF Link" 
        className="p-4 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none h-40" 
        value={data.content} 
        onChange={e => setData({...data, content: e.target.value})} 
        required 
      />
      <button 
        disabled={loading}
        className="bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Uploading...' : 'Save Book'}
      </button>
    </form>
  );
}

// ===== LOGIN PAGE =====
function LoginPage({ setCurrentView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (ev) => {
    ev.preventDefault();
    
    if (!validateEmail(email)) {
      alert("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentView('library');
    } catch (error) {
      alert("Login failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-2xl mt-10">
      <h2 className="text-2xl font-black text-center mb-6">LOGIN</h2>
      <form onSubmit={handleLogin} className="grid gap-4">
        <input 
          type="email" 
          placeholder="Email Address" 
          className="p-4 bg-gray-50 border-2 border-orange-100 rounded-xl outline-none focus:ring-2 ring-orange-500" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            className="w-full p-4 bg-gray-50 border-2 border-orange-100 rounded-xl outline-none focus:ring-2 ring-orange-500" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button 
          disabled={loading}
          className="bg-orange-600 text-white py-4 rounded-xl font-bold mt-2 hover:bg-orange-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Logging in...' : 'Login to Library'}
        </button>
        <p className="text-center text-xs text-gray-500">
          New student? <span className="text-orange-600 font-bold cursor-pointer hover:underline" onClick={() => setCurrentView('register')}>Create Account</span>
        </p>
      </form>
    </div>
  );
}

// ===== REGISTER PAGE =====
function RegisterPage({ setCurrentView }) {
  const [form, setForm] = useState({ name: '', email: '', pass: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (ev) => {
    ev.preventDefault();
    
    if (!form.name || !form.email || !form.pass) {
      alert("Please fill all fields");
      return;
    }

    if (!validateEmail(form.email)) {
      alert("Please enter a valid email");
      return;
    }

    if (!validatePassword(form.pass)) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.pass);
      alert("Account Created! Please verify your email.");
      setCurrentView('login');
    } catch (error) {
      alert("Registration failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto bg-white p-8 rounded-3xl shadow-2xl mt-10">
      <h2 className="text-2xl font-black text-center mb-6">SIGN UP</h2>
      <form onSubmit={handleRegister} className="grid gap-4">
        <input 
          placeholder="Full Name" 
          className="p-4 bg-gray-50 border-2 border-orange-100 rounded-xl outline-none focus:ring-2 ring-orange-500"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          required
        />
        <input 
          type="email" 
          placeholder="Email Address" 
          className="p-4 bg-gray-50 border-2 border-orange-100 rounded-xl outline-none focus:ring-2 ring-orange-500"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          required
        />
        <div className="relative">
          <input 
            type={showPassword ? "text" : "password"}
            placeholder="Create Password (min 8 chars)" 
            className="w-full p-4 bg-gray-50 border-2 border-orange-100 rounded-xl outline-none focus:ring-2 ring-orange-500"
            value={form.pass}
            onChange={e => setForm({...form, pass: e.target.value})}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button 
          disabled={loading}
          className="bg-orange-600 text-white py-4 rounded-xl font-bold mt-2 hover:bg-orange-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Creating Account...' : 'Register Now'}
        </button>
      </form>
    </div>
  );
}

// ===== BOOK VIEWER =====
function BookViewer({ bookId, books, currentUser, purchases, setCurrentView }) {
  const book = books.find(b => b.id === bookId);
  const isApproved = purchases.some(p => p.bookId === bookId && p.status === 'approved');

  useEffect(() => {
    if (isApproved) {
      const lock = (e) => e.preventDefault();
      document.addEventListener('contextmenu', lock);
      return () => document.removeEventListener('contextmenu', lock);
    }
  }, [isApproved]);

  if (!isApproved) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
        <p className="font-bold text-red-600 text-xl">Access Restricted. Payment Not Verified.</p>
        <button 
          onClick={() => setCurrentView('my-books')}
          className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg font-bold"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (!book) {
    return <div className="text-center py-20 text-red-600 font-bold">Book not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-2xl border-2 border-green-50">
      <button 
        onClick={() => setCurrentView('my-books')} 
        className="text-gray-400 mb-6 font-bold uppercase text-xs tracking-widest hover:text-gray-600"
      >
        ← Back to My Library
      </button>
      <h2 className="text-3xl font-black mb-1 text-gray-800 uppercase">{book.title}</h2>
      <p className="text-xs font-bold text-green-600 mb-10 tracking-widest uppercase italic">
        Secure Reader Active • {currentUser.email}
      </p>
      
      <div className="prose max-w-none text-gray-700 leading-relaxed select-none" style={{ userSelect: 'none' }}>
        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(book.content) }} />
      </div>

      <div className="mt-20 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
        <Shield className="text-gray-300 flex-shrink-0" size={32} />
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-tight">
          Warning: Unauthorized sharing or screenshots will result in immediate account termination. Your IP and email are logged for security.
        </p>
      </div>
    </div>
  );
}
