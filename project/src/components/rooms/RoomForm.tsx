// src/components/rooms/RoomForm.tsx

// Update the imports
import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../../types';
import Button from '../ui/Button';
import { X, Settings } from 'lucide-react';
import { useProperty } from '../../contexts/PropertyContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionFeatures } from '../../hooks/useSubscriptionFeatures';

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: Partial<Room>) => void;
  onClose: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ room, onSubmit, onClose }) => {
  const navigate = useNavigate();
  const { selectedProperty } = useProperty();
  const { hasFeature } = useSubscriptionFeatures();
  const hasMarketplace = hasFeature('marketplace_listing');
  
  const [formData, setFormData] = useState<Partial<Room>>({
    name: room?.name || '',
    floor: room?.floor || '',
    type: room?.type || '',
    price: room?.price || 0,
    status: room?.status || 'vacant',
    property_id: selectedProperty?.id
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProperty?.id) {
      loadRoomTypes();
    }
  }, [selectedProperty]);

  const loadRoomTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('property_id', selectedProperty?.id)
        .order('name');

      if (error) throw error;
      setRoomTypes(data || []);
    } catch (err) {
      console.error('Error loading room types:', err);
      setError('Failed to load room types');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type' && hasMarketplace) {
      // If room type is selected and marketplace is enabled, set price from room type
      const selectedType = roomTypes.find(type => type.name === value);
      if (selectedType) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          price: selectedType.price
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddRoomType = () => {
    navigate('/marketplace-settings');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {room ? 'Edit Room' : 'Add New Room'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number
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
              Floor
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Room Type
              </label>
              {hasMarketplace && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRoomType}
                  icon={<Settings size={14} />}
                >
                  Manage Types
                </Button>
              )}
            </div>
            {hasMarketplace ? (
              roomTypes.length > 0 ? (
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select room type</option>
                  {roomTypes.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name} - {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(type.price)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 mb-2">
                  No room types defined. Please add room types in Marketplace Settings first.
                </div>
              )
            ) : (
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select room type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="deluxe">Deluxe</option>
              </select>
            )}
          </div>

          {(!hasMarketplace || roomTypes.length === 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (per month)
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
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {room ? 'Save Changes' : 'Add Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;
