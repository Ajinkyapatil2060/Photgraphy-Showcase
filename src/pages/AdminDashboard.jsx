// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from "../supabase";
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedUser) return;

    setUploading(true);
    const totalFiles = files.length;
    let uploaded = 0;

    try {
      for (const file of files) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${selectedUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create database record
        const { error: dbError } = await supabase
          .from('images')
          .insert({
            user_id: selectedUser.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          });

        if (dbError) throw dbError;

        uploaded++;
        setUploadProgress((uploaded / totalFiles) * 100);
      }

      alert(`Successfully uploaded ${uploaded} image(s)`);
      e.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create database record with is_portfolio flag
        // Use admin's ID as user_id for portfolio images
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error: dbError } = await supabase
          .from('images')
          .insert({
            user_id: user.id, // Admin's ID
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            is_portfolio: true,
          });

        if (dbError) throw dbError;
      }

      alert('Portfolio images uploaded successfully');
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading portfolio:', error);
      alert('Error uploading portfolio: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
        <div className="px-4 py-6 sm:px-0">
          {/* Portfolio Upload Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Upload Portfolio Images</h2>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePortfolioUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium">Users</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                    selectedUser?.id === user.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'No name'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Upload Section */}
          {selectedUser && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">
                Upload Images for {selectedUser.full_name || selectedUser.email}
              </h2>
              
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;