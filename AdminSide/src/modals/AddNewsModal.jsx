import { useState, useEffect } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAlert } from "../contexts/alertContext";

const AddNewsModal = ({ showModal, setShowModal, editingNews, onSaveSuccess }) => {
    const { showAlert } = useAlert();
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
        if (editingNews) {
            setFormData({
                title: editingNews.title || '',
                description: editingNews.description || '',
                mainImage: editingNews.mainImage || '',
                secondaryImages: editingNews.secondaryImages || []
            });
            setImageFiles({
                mainImage: null,
                secondaryImages: []
            });
        } else {
            resetForm();
        }
    }, [editingNews]);

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
    };

    const uploadImage = async (file, path) => {
        const storageRef = ref(storage, `news/${path}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    const deleteImageFromStorage = async (url) => {
        if (!url || typeof url !== 'string') return;
        try {
            const imageRef = ref(storage, url);
            await deleteObject(imageRef);
            console.log("Image deleted from storage:", url);
        } catch (error) {
            console.error("Error deleting image from storage:", error);
        }
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
                urls.secondaryImages = [...(editingNews?.secondaryImages || []), ...secondaryUrls];
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
            onSaveSuccess(editingNews?.id, finalData);
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving news:', error);
            showAlert("error", "Failed to save article. Please try again.");
        }
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

    if (!showModal) return null;

    return (
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
    );
};

export default AddNewsModal;