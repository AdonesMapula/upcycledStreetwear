import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { X, Loader2, List } from 'lucide-react';

// Import Toast components
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CategoryModal = ({ showModal, setShowModal, fetchCategories }) => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingCategories, setExistingCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // This function is the only way to close the modal
  const handleClose = () => {
    setShowModal(false);
    setCategoryName('');
    setError(null);
    setExistingCategories([]);
  };

  const fetchExistingCategories = async () => {
    setLoadingCategories(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesList = querySnapshot.docs.map(doc => doc.data().name);
      setExistingCategories(categoriesList);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchExistingCategories();
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'categories'), {
        name: categoryName,
        createdAt: new Date(),
      });
      
      // Replaced alert() with a success toast notification
      toast.success('Category added successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Fetch the updated list of categories to display it
      fetchExistingCategories(); 
      
      // Clear the input field for the next category
      setCategoryName(''); 
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) {
    return null;
  }

  return (
    // The ToastContainer component is required to display toasts
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
        <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-md w-full m-4">
          {/* The X button explicitly calls handleClose */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Category</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135918] focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#135918] hover:bg-[#0F4713] text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Category</span>
              )}
            </button>
          </form>

          <hr className="my-6 border-gray-200" />

          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <List className="h-5 w-5 text-gray-600 mr-2" />
              Existing Categories
            </h3>
            {loadingCategories ? (
              <p className="text-gray-500">Loading categories...</p>
            ) : existingCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {existingCategories.map((cat, index) => (
                  <span 
                    key={index} 
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No categories found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryModal;