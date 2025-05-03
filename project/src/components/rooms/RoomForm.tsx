import React, { useState, useRef } from 'react';
import { Room } from '../../types';
import Button from '../ui/Button';
import { X, Upload, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useProperty } from '../../contexts/PropertyContext';
import { supabase } from '../../lib/supabase';

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: Partial<Room>) => void;
  onClose: () => void;
}

// Room facilities configuration
const ROOM_FACILITIES = [
  'ac', 'pillow', 'mirror', 'cleaning_service', 'private_kitchen', 'dispenser',
  'bolster', 'window', 'bed', 'toilet_mat', 'fan', 'weekly_hygiene',
  'refrigerator', 'chair', 'wardrobe', 'table', 'dressing_table',
  'dining_table', 'sofa', 'tv', 'cable_tv', 'no_bed', 'ventilation',
  'sink', 'water_heater', 'microwave'
];

// Bathroom facilities configuration
const BATHROOM_FACILITIES = [
  'hot_water', 'bathtub', 'bucket', 'inside_bathroom', 'outside_bathroom',
  'sitting_toilet', 'squat_toilet', 'shower', 'sink'
];

// Facility name mappings
const FACILITY_NAMES: Record<string, string> = {
  ac: 'AC',
  pillow: 'Bantal',
  mirror: 'Cermin',
  cleaning_service: 'Cleaning Service',
  private_kitchen: 'Dapur Pribadi',
  dispenser: 'Dispenser',
  bolster: 'Guling',
  window: 'Jendela',
  bed: 'Kasur',
  toilet_mat: 'Keset Toilet',
  fan: 'Kipas Angin',
  weekly_hygiene: 'Kos Higienis Mingguan',
  refrigerator: 'Kulkas',
  chair: 'Kursi',
  wardrobe: 'Lemari Baju',
  table: 'Meja',
  dressing_table: 'Meja Rias',
  dining_table: 'Meja Makan',
  sofa: 'Sofa',
  tv: 'TV',
  cable_tv: 'TV Kabel',
  no_bed: 'Tidak ada Kasur',
  ventilation: 'Ventilasi',
  sink: 'Wastafel',
  water_heater: 'Water Heater',
  microwave: 'Microwave',
  hot_water: 'Air Panas',
  bathtub: 'Bathtub',
  bucket: 'Ember Mandi',
  inside_bathroom: 'K. Mandi Dalam',
  outside_bathroom: 'K. Mandi Luar',
  sitting_toilet: 'Kloset Duduk',
  squat_toilet: 'Kloset Jongkok',
  shower: 'Shower'
};

const RoomForm: React.FC<RoomFormProps> = ({ room, onSubmit, onClose }) => {
  const { selectedProperty } = useProperty();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Room>>({
    name: room?.name || '',
    floor: room?.floor || '',
    type: room?.type || 'single',
    price: room?.price || 0,
    daily_price: room?.daily_price || 0,
    weekly_price: room?.weekly_price || 0,
    yearly_price: room?.yearly_price || 0,
    enable_daily_price: room?.enable_daily_price || false,
    enable_weekly_price: room?.enable_weekly_price || false,
    enable_yearly_price: room?.enable_yearly_price || false,
    status: room?.status || 'vacant',
    room_facilities: room?.room_facilities || [],
    bathroom_facilities: room?.bathroom_facilities || [],
    photos: room?.photos || [],
    max_occupancy: room?.max_occupancy || 1,
    property_id: selectedProperty?.id
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else if (name === 'price' || name.includes('_price')) {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFacilityChange = (facility: string, type: 'room' | 'bathroom') => {
    const facilitiesKey = type === 'room' ? 'room_facilities' : 'bathroom_facilities';
    const currentFacilities = formData[facilitiesKey] || [];
    const newFacilities = currentFacilities.includes(facility)
      ? currentFacilities.filter(f => f !== facility)
      : [...currentFacilities, facility];
    setFormData(prev => ({ ...prev, [facilitiesKey]: newFacilities }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setIsUploading(true);
      setError(null);

      const newPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload only image files (JPG/PNG)');
        }

        // Validate file size (1MB = 1024 * 1024 bytes)
        if (file.size > 1024 * 1024) {
          throw new Error('Image size must be less than 1MB');
        }

        // Get session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated');

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'room');

        // Upload using edge function
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
          throw new Error(error.error || 'Failed to upload image');
        }

        const { url } = await response.json();
        newPhotos.push(url);
      }

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos]
      }));
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (url: string) => {
    try {
      setIsUploading(true);
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
        throw new Error(error.error || 'Failed to delete image');
      }

      setFormData(prev => ({
        ...prev,
        photos: prev.photos?.filter(photo => photo !== url) || []
      }));
    } catch (err) {
      console.error('Error removing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (!selectedProperty) {
        throw new Error('No property selected');
      }

      await onSubmit({
        ...formData,
        property_id: selectedProperty.id
      });

      onClose();
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err instanceof Error ? err.message : 'Failed to save room');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {room ? 'Ubah Kamar' : 'Tambah Kamar Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Kamar
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lantai
              </label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimal Penghuni
              </label>
              <select
                name="max_occupancy"
                value={formData.max_occupancy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num} orang</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Harga Sewa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga per Bulan
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_daily_price"
                    checked={formData.enable_daily_price}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Aktifkan harga harian</span>
                </label>

                {formData.enable_daily_price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga per Hari
                    </label>
                    <input
                      type="number"
                      name="daily_price"
                      value={formData.daily_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_weekly_price"
                    checked={formData.enable_weekly_price}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Aktifkan harga mingguan</span>
                </label>

                {formData.enable_weekly_price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga per Minggu
                    </label>
                    <input
                      type="number"
                      name="weekly_price"
                      value={formData.weekly_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enable_yearly_price"
                    checked={formData.enable_yearly_price}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Aktifkan harga tahunan</span>
                </label>

                {formData.enable_yearly_price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga per Tahun
                    </label>
                    <input
                      type="number"
                      name="yearly_price"
                      value={formData.yearly_price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room Facilities */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fasilitas Kamar</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ROOM_FACILITIES.map(facility => (
                <label key={facility} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.room_facilities?.includes(facility)}
                    onChange={() => handleFacilityChange(facility, 'room')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{FACILITY_NAMES[facility]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bathroom Facilities */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fasilitas Kamar Mandi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {BATHROOM_FACILITIES.map(facility => (
                <label key={facility} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.bathroom_facilities?.includes(facility)}
                    onChange={() => handleFacilityChange(facility, 'bathroom')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{FACILITY_NAMES[facility]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Foto Kamar</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || (formData.photos?.length || 0) >= 10}
                  icon={isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                >
                  Upload Foto
                </Button>
                <p className="text-sm text-gray-500">
                  Format: JPG/PNG, Maks: 1MB, Maks jumlah: 10 foto
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />

              {formData.photos && formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Room photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada foto yang diunggah</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Menyimpan...' : room ? 'Simpan Perubahan' : 'Tambah Kamar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;