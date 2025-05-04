import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, Heart, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

const SavedProperties: React.FC = () => {
  const navigate = useNavigate();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<Record<string, RoomType[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      // Get saved properties from user metadata
      const savedIds = user.user_metadata?.saved_properties || [];
      
      if (savedIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Get property details
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .in('id', savedIds)
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      // Get room types for each property
      const roomTypesData: Record<string, RoomType[]> = {};
      for (const property of properties || []) {
        const { data: roomTypes, error: roomTypesError } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        if (roomTypesError) throw roomTypesError;
        roomTypesData[property.id] = roomTypes || [];
      }

      setSavedProperties(properties || []);
      setRoomTypes(roomTypesData);
    } catch (err) {
      console.error('Error loading saved properties:', err);
      setError('Failed to load saved properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromSaved = async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const savedIds = user.user_metadata?.saved_properties || [];
      const updatedSavedIds = savedIds.filter((id: string) => id !== propertyId);

      const { error } = await supabase.auth.updateUser({
        data: { saved_properties: updatedSavedIds }
      });

      if (error) throw error;

      setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Error removing property from saved:', err);
      setError('Failed to remove property from saved');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Marketplace
            </button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Masuk / Daftar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Properti Tersimpan</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat properti tersimpan...</p>
          </div>
        ) : savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property) => {
              const propertyRoomTypes = roomTypes[property.id] || [];
              const lowestPrice = Math.min(...propertyRoomTypes.map(rt => rt.price));
              const firstRoomType = propertyRoomTypes[0];

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Property Image */}
                  <div className="relative h-48">
                    {firstRoomType?.photos && firstRoomType.photos.length > 0 ? (
                      <img
                        src={firstRoomType.photos[0]}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : property.photos && property.photos.length > 0 ? (
                      <img
                        src={property.photos[0]}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Building2 size={48} className="text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromSaved(property.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart size={20} className="text-red-500" fill="currentColor" />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin size={16} className="mr-1" />
                      <p className="text-sm">{property.address}, {property.city}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Mulai dari</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(lowestPrice)}<span className="text-sm font-normal text-gray-500">/bulan</span>
                      </p>
                    </div>

                    <Button
                      className="w-full mt-4"
                      onClick={() => navigate(`/marketplace/property/${property.id}`)}
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada properti yang disimpan</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/marketplace')}
            >
              Jelajahi Properti
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedProperties;