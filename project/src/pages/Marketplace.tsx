import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, Room, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import { Building2, MapPin, Phone, Mail, Search, Filter, Bed, Users, Bath, Star, Home, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import PropertyDetails from '../components/marketplace/PropertyDetails';

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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ambil data properti
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      // Ambil tipe kamar untuk setiap properti
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

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = cityFilter === 'all' || property.city === cityFilter;

    const propertyRoomTypes = roomTypes[property.id] || [];
    const lowestPrice = Math.min(...propertyRoomTypes.map((rt) => rt.price));
    const highestPrice = Math.max(...propertyRoomTypes.map((rt) => rt.price));

    const matchesPrice =
      (!priceRange.min || lowestPrice >= parseInt(priceRange.min)) &&
      (!priceRange.max || highestPrice <= parseInt(priceRange.max));

    return matchesSearch && matchesCity && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Kostopia</h1>
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50"
                onClick={() => navigate('/login')}
              >
                Masuk / Daftar
              </Button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="py-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Temukan Kost Impian Anda</h2>
            <p className="text-blue-100 text-lg mb-8">
              Berbagai pilihan kost dengan fasilitas lengkap di lokasi strategis
            </p>
            {/* Search Box */}
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 -mb-24">
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
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Harga min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Harga max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const propertyRoomTypes = roomTypes[property.id] || [];
              const lowestPrice = Math.min(...propertyRoomTypes.map((rt) => rt.price));
              const firstRoomType = propertyRoomTypes[0];

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProperty(property)}
                >
                  {/* Property Image */}
                  <div className="relative h-64">
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
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <h3 className="text-xl font-bold text-white">{property.name}</h3>
                      <div className="flex items-center text-white text-sm">
                        <MapPin size={16} className="mr-1" />
                        {property.address}, {property.city}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Room Types */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tipe Kamar Tersedia:</h4>
                      <div className="space-y-2">
                        {propertyRoomTypes.map((type) => (
                          <div key={type.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{type.name}</span>
                            <span className="text-sm font-medium text-blue-600">
                              {formatCurrency(type.price)}/bulan
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Facilities */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Fasilitas Umum:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {property.common_amenities.slice(0, 4).map((amenity, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <Star size={16} className="mr-1 text-blue-500" />
                            {amenity}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Facilities */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Fasilitas Kamar:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {propertyRoomTypes[0]?.room_facilities?.slice(0, 4).map((facility, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle size={16} className="mr-1 text-green-500" />
                            {facility}
                          </div>
                        ))}
                      </div>
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

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          roomTypes={roomTypes[selectedProperty.id] || []}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
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
