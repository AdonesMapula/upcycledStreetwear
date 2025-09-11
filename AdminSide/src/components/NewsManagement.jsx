import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Upload, X, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAlert } from "../contexts/alertContext";

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mainImage: '',
    secondaryImages: []
  });

  const [imageFiles, setImageFiles] = useState({
    mainImage: null,
    secondaryImages: []
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const newsCollection = collection(db, "news");
      const snapshot = await getDocs(newsCollection);

      const fetchedNews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));

      setNews(fetchedNews);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file, path) => {
    const storageRef = ref(storage, `news/${path}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleImageUpload = async () => {
    const urls = { ...formData };
    
    try {
      setUploadingImages(true);

      // Upload main image
      if (imageFiles.mainImage) {
        const mainImageUrl = await uploadImage(
          imageFiles.mainImage,
          `main-${Date.now()}-${imageFiles.mainImage.name}`
        );
        urls.mainImage = mainImageUrl;
      }

      // Upload secondary images
      if (imageFiles.secondaryImages.length > 0) {
        const secondaryUrls = [];
        for (let i = 0; i < imageFiles.secondaryImages.length; i++) {
          const file = imageFiles.secondaryImages[i];
          const url = await uploadImage(
            file,
            `secondary-${Date.now()}-${i}-${file.name}`
          );
          secondaryUrls.push(url);
        }
        urls.secondaryImages = [...urls.secondaryImages, ...secondaryUrls];
      }

      return urls;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalData = await handleImageUpload();

      if (editingNews) {
        await updateDoc(doc(db, 'news', editingNews.id), finalData);
        setNews(news.map(n => n.id === editingNews.id ? { ...n, ...finalData } : n));
      } else {
        const docRef = await addDoc(collection(db, 'news'), {
          ...finalData,
          createdAt: new Date()
        });
        setNews([{ id: docRef.id, ...finalData, createdAt: new Date() }, ...news]);
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving news:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      mainImage: item.mainImage || '',
      secondaryImages: item.secondaryImages || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
        setNews(news.filter(n => n.id !== id));
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mainImage: '',
      secondaryImages: []
    });
    setImageFiles({
      mainImage: null,
      secondaryImages: []
    });
    setEditingNews(null);
  };

  const removeSecondaryImage = (index) => {
    setFormData({
      ...formData,
      secondaryImages: formData.secondaryImages.filter((_, i) => i !== index)
    });
  };

  const removeSecondaryImageFile = (index) => {
    setImageFiles({
      ...imageFiles,
      secondaryImages: imageFiles.secondaryImages.filter((_, i) => i !== index)
    });
  };

  const filteredNews = news.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F1] p-6">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
              <p className="text-gray-500 mt-1">{news.length} articles published</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#2E6A2E] hover:bg-[#0F4713] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Article</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Main Image */}
              <div className="relative h-48 bg-gray-100">
                {item.mainImage ? (
                  <img
                    src={item.mainImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

                {/* Secondary Images Preview */}
                {item.secondaryImages && item.secondaryImages.length > 0 && (
                  <div className="flex space-x-2 mb-4">
                    {item.secondaryImages.slice(0, 3).map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Secondary ${index + 1}`}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ))}
                    {item.secondaryImages.length > 3 && (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">+{item.secondaryImages.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No articles found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingNews ? 'Edit Article' : 'Create New Article'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    required
                  />
                </div>

                {/* Main Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    {formData.mainImage ? (
                      <div className="relative">
                        <img src={formData.mainImage} alt="Main" className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, mainImage: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setImageFiles({ ...imageFiles, mainImage: file });
                              // Preview
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setFormData({ ...formData, mainImage: e.target.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="mainImage"
                        />
                        <label
                          htmlFor="mainImage"
                          className="cursor-pointer flex flex-col items-center justify-center py-4"
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-gray-500">Click to upload main image</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Images</label>
                  
                  {/* Existing secondary images */}
                  {formData.secondaryImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {formData.secondaryImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img src={img} alt={`Secondary ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeSecondaryImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New secondary images preview */}
                  {imageFiles.secondaryImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {imageFiles.secondaryImages.map((file, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`New ${index + 1}`} 
                            className="w-full h-20 object-cover rounded-lg" 
                          />
                          <button
                            type="button"
                            onClick={() => removeSecondaryImageFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload secondary images */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setImageFiles({ ...imageFiles, secondaryImages: [...imageFiles.secondaryImages, ...files] });
                      }}
                      className="hidden"
                      id="secondaryImages"
                    />
                    <label
                      htmlFor="secondaryImages"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-gray-500 text-sm">Add secondary images</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="flex-1 bg-[#2E6A2E] hover:bg-[#0F4713] disabled:bg-[#A5D6A7] text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {uploadingImages ? 'Uploading...' : (editingNews ? 'Update Article' : 'Create Article')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagement;