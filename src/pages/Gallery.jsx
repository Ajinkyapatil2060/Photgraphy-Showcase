// src/pages/Gallery.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from "../supabase";
import { useAuth } from '../contexts/AuthContext';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      // First, fetch user's own images
      const { data: userImages, error: userError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_portfolio', false)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // If user has no images, fetch portfolio
      if (!userImages || userImages.length === 0) {
        setShowPortfolio(true);
        const { data: portfolioImages, error: portfolioError } = await supabase
          .from('images')
          .select('*')
          .eq('is_portfolio', true)
          .order('created_at', { ascending: false });

        if (portfolioError) throw portfolioError;
        setImages(portfolioImages || []);
      } else {
        setShowPortfolio(false);
        setImages(userImages);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath) => {
    const { data } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your gallery...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                {showPortfolio ? 'Photographer Portfolio' : 'My Gallery'}
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={signOut}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showPortfolio && (
          <div className="mb-4 px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-700">
                You don't have any photos yet. Here's our photographer's portfolio while you wait!
              </p>
            </div>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No images available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={getImageUrl(image.file_path)}
                  alt={image.file_name}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
                {image.caption && (
                  <div className="p-3">
                    <p className="text-sm text-gray-700">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;