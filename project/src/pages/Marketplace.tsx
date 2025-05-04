import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, Room, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { Building2, MapPin, Phone, Mail, DoorClosed, Search, Filter, Bed, Users, Bath } from 'lucide-react';
import Button from '../components/ui/Button';

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<Record<string, RoomType[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get published properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      // Get room types for each property
      const roomTypesData: Record<string, RoomType[]> = {};
      const uniqueCities = new Set<string>();

      for (const property of propertiesData || []) {
        uniqueCities.add(property.city);

        const { data: roomTypes, error: roomTypesError } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        if (roomTypesError) throw roomTypesError;
        roomTypesData[property.id] = roomTypes || [];
      }

      setProperties(propertiesData || []);
      setRoomTypes(roomTypesData);
      setCities(Array.from(uniqueCities).sort());
    } catch (err) {
      console.error('Error loading marketplace data:', err);
      setError('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = cityFilter === 'all' || property.city === cityFilter;

    const propertyRoomTypes = roomTypes[property.id] || [];
    const lowestPrice = Math.min(...propertyRoomTypes.map(rt => rt.price));
    const highestPrice = Math.max(...propertyRoomTypes.map(rt => rt.price));

    const matchesPrice = 
      (!priceRange.min || lowestPrice >= parseInt(priceRange.min)) &&
      (!priceRange.max || highestPrice <= parseInt(priceRange.max));

    return matchesSearch && matchesCity && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Kostopia</h1>
            <Button onClick={() => navigate('/login')}>
              Masuk / Daftar
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Temukan Kost Impian Anda
            </h2>
            <p className="text-blue-100">
              Berbagai pilihan kost dengan fasilitas lengkap di lokasi strategis
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, kota, atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Kota</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Harga min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Harga max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat properti...</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const propertyRoomTypes = roomTypes[property.id] || [];
              const lowestPrice = Math.min(...propertyRoomTypes.map(rt => rt.price));
              
              return (
                <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Property Images */}
                  <div className="relative h-48">
                    {property.photos && property.photos.length > 0 ? (
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
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {property.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin size={16} className="mr-2" />
                        {property.address}, {property.city}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone size={16} className="mr-2" />
                        {property.phone}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-2" />
                        {property.email}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Tipe Kamar Tersedia:</h4>
                      <div className="space-y-2">
                        {propertyRoomTypes.map((roomType) => (
                          <div key={roomType.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{roomType.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Users size={14} className="mr-1" />
                                  {roomType.max_occupancy} orang
                                </span>
                                {roomType.room_facilities?.includes('AC') && (
                                  <span>AC</span>
                                )}
                                {roomType.bathroom_facilities?.includes('Kamar Mandi Dalam') && (
                                  <span className="flex items-center">
                                    <Bath size={14} className="mr-1" />
                                    K.M Dalam
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(roomType.price)}/bln
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button className="w-full" onClick={() => navigate('/login')}>
                        Pesan Sekarang
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {searchQuery || cityFilter !== 'all' || priceRange.min || priceRange.max
                ? 'Tidak ada properti yang sesuai dengan filter Anda.'
                : 'Belum ada properti yang tersedia.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tentang Kostopia</h3>
              <p className="text-gray-600">
                Platform manajemen kost modern yang memudahkan pemilik kost dan pencari kost untuk terhubung.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontak</h3>
              <div className="space-y-2 text-gray-600">
                <p>Email: info@kostopia.com</p>
                <p>Phone: (021) 1234-5678</p>
                <p>WhatsApp: +62 812-3456-7890</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ikuti Kami</h3>
              <div className="space-y-2 text-gray-600">
                <p>Instagram: @kostopia</p>
                <p>Facebook: Kostopia Indonesia</p>
                <p>Twitter: @kostopia_id</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Kostopia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Marketplace;