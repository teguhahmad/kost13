import React, { useState } from 'react';
import { RoomType } from '../../types';
import Button from '../ui/Button';
import { X } from 'lucide-react';

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSubmit: (data: Partial<RoomType>) => void;
  onClose: () => void;
}

const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  roomType,
  onSubmit,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<RoomType>>({
    name: roomType?.name || '',
    price: roomType?.price || 0,
    description: roomType?.description || '',
    facilities: roomType?.facilities || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  const handleFacilityChange = (facility: string) => {
    const facilities = formData.facilities || [];
    const newFacilities = facilities.includes(facility)
      ? facilities.filter(f => f !== facility)
      : [...facilities, facility];
    
    setFormData(prev => ({
      ...prev,
      facilities: newFacilities
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {roomType ? 'Edit Tipe Kamar' : 'Tambah Tipe Kamar'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              Harga Dasar
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fasilitas
            </label>
            <div className="space-y-2">
              {[
                'AC', 'TV', 'WiFi', 'Kamar Mandi Dalam', 'Lemari', 'Meja',
                'Kursi', 'Kasur Single', 'Kasur Double', 'Dapur'
              ].map(facility => (
                <label key={facility} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facilities?.includes(facility)}
                    onChange={() => handleFacilityChange(facility)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{facility}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
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