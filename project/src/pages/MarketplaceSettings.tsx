import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Property } from '../types';
import { useProperty } from '../contexts/PropertyContext';
import { supabase } from '../lib/supabase';
import { Store, Plus, X, Loader2, Image as ImageIcon, Globe, CheckCircle, Trash } from 'lucide-react';
import FeatureGuard from '../components/ui/FeatureGuard';

// Common facilities categories
const COMMON_FACILITIES = {
  common: {
    title: 'Fasilitas Umum',
    items: [
      'Balcon', 'CCTV', 'Dapur', 'Dispenser', 'Duplikat Gerbang Kos', 'Gazebo',
      'Jemuran', 'Joglo', 'Jual Makanan', 'K. Mandi Luar', 'Kamar Mandi Luar - WC Duduk',
      'Kamar Mandi Luar - WC Jongkok', 'Kartu Akses', 'Kompor', 'Kulkas', 'Laundry',
      'Locker', 'Mesin Cuci', 'Mushola', 'Pengurus Kos', 'Penjaga Kos', 'R. Cuci',
      'R. Jemur', 'R. Keluarga', 'R. Makan', 'R. Santai', 'R. Tamu', 'Rice Cooker',
      'Rooftop', 'TV', 'Taman', 'WiFi'
    ]
  },
  parking: {
    title: 'Fasilitas Parkir',
    items: [
      'Parkir Mobil', 'Parkir Motor', 'Parkir Motor & Sepeda', 'Parkir Sepeda'
    ]
  }
};

interface ImageUploadProps {
  type: 'common' | 'parking';
  images: string[];
  onUpload: (url: string) => void;
  onDelete: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ type, images, onUpload, onDelete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }

      const { url } = await response.json();
      onUpload(url);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete image');
      }

      onDelete(url);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            Upload Gambar
          </div>
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`${type} facility ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => handleDelete(url)}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketplaceSettings: React.FC = () => {
  const { selectedProperty } = useProperty();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFacilitiesForm, setShowFacilitiesForm] = useState(false);
  
  const [settings, setSettings] = useState({
    marketplace_enabled: false,
    marketplace_status: 'draft' as 'draft' | 'published',
    description: '',
    common_amenities: [] as string[],
    parking_amenities: [] as string[],
    rules: [] as string[],
    photos: [] as string[]
  });

  useEffect(() => {
    if (selectedProperty?.id) {
      loadSettings();
    }
  }, [selectedProperty]);

  const loadSettings = async () => {
    if (!selectedProperty) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', selectedProperty.id)
        .single();

      if (propertyError) throw propertyError;

      setSettings({
        marketplace_enabled: property.marketplace_enabled || false,
        marketplace_status: property.marketplace_status || 'draft',
        description: property.description || '',
        common_amenities: property.common_amenities || [],
        parking_amenities: property.parking_amenities || [],
        rules: property.rules || [],
        photos: property.photos || []
      });
    } catch (err) {
      console.error('Error loading marketplace settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMarketplace = async () => {
    if (!selectedProperty) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('properties')
        .update({
          marketplace_enabled: !settings.marketplace_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        marketplace_enabled: !prev.marketplace_enabled
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error toggling marketplace:', err);
      setError('Failed to update marketplace status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedProperty) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('properties')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedProperty?.id) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please select a property to manage marketplace settings
      </div>
    );
  }

  return (
    <FeatureGuard 
      feature="marketplace_listing"
      fallback={
        <div className="p-6 text-center text-gray-500">
          Marketplace listing is not available in your current plan.
          Please upgrade to list your property in the marketplace.
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Marketplace</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketplace_enabled}
                  onChange={handleToggleMarketplace}
                  className="sr-only peer"
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {settings.marketplace_enabled ? 'Aktif di Marketplace' : 'Nonaktif di Marketplace'}
              </span>
            </div>
            <Button
              variant={settings.marketplace_status === 'published' ? 'success' : 'primary'}
              onClick={() => setSettings(prev => ({
                ...prev,
                marketplace_status: prev.marketplace_status === 'published' ? 'draft' : 'published'
              }))}
              icon={<Globe size={16} />}
              disabled={!settings.marketplace_enabled || isSaving}
            >
              {settings.marketplace_status === 'published' ? 'Published' : 'Draft'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative flex items-center">
            <CheckCircle size={20} className="mr-2" />
            Settings saved successfully!
          </div>
        )}

        {/* Common Facilities */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Fasilitas Umum & Parkir</h2>
            <Button
              onClick={() => setShowFacilitiesForm(true)}
              icon={<Plus size={16} />}
            >
              Edit Fasilitas
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fasilitas Umum</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.common_amenities.map(facility => (
                    <span
                      key={facility}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fasilitas Parkir</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.parking_amenities.map(facility => (
                    <span
                      key={facility}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Facilities Form Modal */}
        {showFacilitiesForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Edit Fasilitas</h2>
                <button
                  onClick={() => setShowFacilitiesForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Common Facilities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fasilitas Umum</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {COMMON_FACILITIES.common.items.map(facility => (
                      <label key={facility} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.common_amenities.includes(facility)}
                          onChange={() => {
                            const newAmenities = settings.common_amenities.includes(facility)
                              ? settings.common_amenities.filter(f => f !== facility)
                              : [...settings.common_amenities, facility];
                            setSettings(prev => ({ ...prev, common_amenities: newAmenities }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Parking Facilities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fasilitas Parkir</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {COMMON_FACILITIES.parking.items.map(facility => (
                      <label key={facility} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.parking_amenities.includes(facility)}
                          onChange={() => {
                            const newAmenities = settings.parking_amenities.includes(facility)
                              ? settings.parking_amenities.filter(f => f !== facility)
                              : [...settings.parking_amenities, facility];
                            setSettings(prev => ({ ...prev, parking_amenities: newAmenities }));
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFacilitiesForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleSaveSettings();
                      setShowFacilitiesForm(false);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
};

export default MarketplaceSettings;