import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchAndFilter({ books, onFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterBooks(term, selectedCategory, priceRange);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterBooks(searchTerm, category, priceRange);
  };

  const handlePriceChange = (e) => {
    const newRange = [priceRange[0], parseInt(e.target.value)];
    setPriceRange(newRange);
    filterBooks(searchTerm, selectedCategory, newRange);
  };

  const filterBooks = (search, category, price) => {
    const filtered = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(search.toLowerCase()) ||
                           book.subject.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || book.category === category;
      const matchesPrice = book.price >= price[0] && book.price <= price[1];
      return matchesSearch && matchesCategory && matchesPrice;
    });
    onFilter(filtered);
  };

  const categories = [...new Set(books.map(b => b.category))];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">Search Books</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 p-3 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full p-3 border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">Max Price: ₹{priceRange[1]}</label>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={priceRange[1]}
            onChange={handlePriceChange}
            className="w-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
