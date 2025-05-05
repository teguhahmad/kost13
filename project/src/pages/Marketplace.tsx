import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
import { Search, Loader2, Filter, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Marketplace() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<Record<string, RoomType[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      // Get unique cities
      const uniqueCities = [...new Set(propertiesData?.map(p => p.city) || [])];
      setCities(uniqueCities);

      // Fetch room types for each property
      const roomTypesData: Record<string, RoomType[]> = {};
      for (const property of propertiesData || []) {
        const { data: propertyRoomTypes } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        roomTypesData[property.id] = propertyRoomTypes || [];
      }

      setProperties(propertiesData || []);
      setRoomTypes(roomTypesData);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === 'all' || property.city === selectedCity;
    
    return matchesSearch && matchesCity;
  });

  const getLowestPrice = (propertyId: string): number => {
    const propertyRoomTypes = roomTypes[propertyId] || [];
    return Math.min(...propertyRoomTypes.map(rt => Number(rt.price)) || [0]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>

            {/* City Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <Button
                size="sm"
                variant={selectedCity === 'all' ? 'primary' : 'outline'}
                onClick={() => setSelectedCity('all')}
              >
                Semua Kota
              </Button>
              {cities.map(city => (
                <Button
                  key={city}
                  size="sm"
                  variant={selectedCity === city ? 'primary' : 'outline'}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/marketplace/property/${property.id}`)}
              >
                <div className="relative h-48">
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={property.photos[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <MapPin size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-lg font-semibold text-white">{property.name}</h3>
                    <p className="text-sm text-white/90">{property.city}</p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-2 text-gray-600 text-sm mb-2">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    <p>{property.address}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Mulai dari</p>
                      <p className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(getLowestPrice(property.id))}
                        <span className="text-sm font-normal text-gray-500">/bulan</span>
                      </p>
                    </div>
                    <Button size="sm">Lihat Detail</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? 'Tidak ada properti yang sesuai dengan pencarian Anda'
                : 'Belum ada properti yang tersedia'}
            </h3>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
}