import React, { useState } from 'react';
import { RoomType } from '../../types';
import Button from '../ui/Button';
import { X, ImageIcon, Loader2, Trash } from 'lucide-react';

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSubmit: (data: Partial<RoomType>) => void;
  onClose: () => void;
}

const ROOM_FACILITIES = [
  'AC', 'TV', 'WiFi', 'Lemari', 'Meja', 'Kursi', 'Kasur Single', 'Kasur Double'
];

const BATHROOM_FACILITIES = [
  'Kamar Mandi Dalam', 'Shower', 'Water Heater', 'Kloset Duduk', 'Wastafel'
];

const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  roomType,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<RoomType>>({
    name: roomType?.name || '',
    price: roomType?.price || 0,
    daily_price: roomType?.daily_price || 0,
    weekly_price: roomType?.weekly_price || 0,
    yearly_price: roomType?.yearly_price || 0,
    enable_daily_price: roomType?.enable_daily_price || false,
    enable_weekly_price: roomType?.enable_weekly_price || false,
    enable_yearly_price: roomType?.enable_yearly_price || false,
    description: roomType?.description || '',
    room_facilities: roomType?.room_facilities || [],
    bathroom_facilities: roomType?.bathroom_facilities || [],
    photos: roomType?.photos || [],
    max_occupancy: roomType?.max_occupancy || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFacilityChange = (facility: string, type: 'room' | 'bathroom') => {
    const field = type === 'room' ? 'room_facilities' : 'bathroom_facilities';
    const facilities = formData[field] || [];
    const newFacilities = facilities.includes(facility)
      ? facilities.filter(f => f !== facility)
      : [...facilities, facility];
    
    setFormData(prev => ({
      ...prev,
      [field]: newFacilities
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {roomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Tipe
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

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="enable_daily_price"
                  checked={formData.enable_daily_price}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Aktifkan Harga Harian
                </label>
              </div>
              {formData.enable_daily_price && (
                <input
                  type="number"
                  name="daily_price"
                  value={formData.daily_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Harga per hari"
                />
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="enable_weekly_price"
                  checked={formData.enable_weekly_price}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Aktifkan Harga Mingguan
                </label>
              </div>
              {formData.enable_weekly_price && (
                <input
                  type="number"
                  name="weekly_price"
                  value={formData.weekly_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Harga per minggu"
                />
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="enable_yearly_price"
                  checked={formData.enable_yearly_price}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Aktifkan Harga Tahunan
                </label>
              </div>
              {formData.enable_yearly_price && (
                <input
                  type="number"
                  name="yearly_price"
                  value={formData.yearly_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Harga per tahun"
                />
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapasitas Maksimal
              </label>
              <select
                name="max_occupancy"
                value={formData.max_occupancy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Orang</option>
                <option value={2}>2 Orang</option>
                <option value={3}>3 Orang</option>
                <option value={4}>4 Orang</option>
                <option value={5}>5 Orang</option>
              </select>
            </div>
          </div>

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
                  <span className="text-sm text-gray-700">{facility}</span>
                </label>
              ))}
            </div>
          </div>

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
                  <span className="text-sm text-gray-700">{facility}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {roomType ? 'Simpan Perubahan' : 'Tambah Tipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomTypeForm;