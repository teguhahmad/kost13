import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Bath,
  Home,
  Wifi,
  Car,
  Coffee,
  DoorClosed,
  MessageCircle,
  Send,
  ArrowLeft,
  Star,
  CheckCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';

const PropertyDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadPropertyDetails();
  }, [id]);

  const loadPropertyDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      // Load property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published')
        .single();

      if (propertyError) throw propertyError;
      if (!propertyData) throw new Error('Property not found');

      // Load room types
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('property_id', id);

      if (roomTypesError) throw roomTypesError;

      setProperty(propertyData);
      setRoomTypes(roomTypesData || []);
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!property) return;
    const message = `Halo, saya tertarik dengan properti ${property.name} di ${property.city}. Bisakah kita berdiskusi lebih lanjut?`;
    const phoneNumber = property.phone?.startsWith('0')
      ? '62' + property.phone.slice(1)
      : property.phone;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Property not found'}</h2>
        <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
      </div>
    );
  }

  // Combine all images
  const allImages = [
    ...(property.photos || []),
    ...(property.common_amenities_photos || []),
    ...(property.parking_amenities_photos || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="relative aspect-w-16 aspect-h-9 rounded-xl overflow-hidden mb-8 bg-gray-100">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[activeImageIndex]}
                alt={`${property.name} - Image ${activeImageIndex + 1}`}
                className="w-full h-[600px] object-cover"
              />
              {/* Image Navigation */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <div className="bg-black bg-opacity-50 p-2 rounded-lg flex gap-2">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === activeImageIndex ? 'bg-white' : 'bg-gray-400'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-[600px] flex items-center justify-center">
              <Building2 size={64} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Overview Card */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.name}</h1>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin size={20} className="mr-2" />
                <p>{property.address}, {property.city}</p>
              </div>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Common Amenities Card */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Fasilitas Umum</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.common_amenities?.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 bg-blue-50 rounded-lg"
                  >
                    <CheckCircle size={20} className="text-blue-500 mr-3" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parking Amenities Card */}
            {property.parking_amenities && property.parking_amenities.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Fasilitas Parkir</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.parking_amenities?.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-blue-50 rounded-lg"
                    >
                      <CheckCircle size={20} className="text-blue-500 mr-3" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Tipe Kamar</h2>
              {roomTypes.map((roomType) => (
                <div
                  key={roomType.id}
                  className={`bg-white rounded-xl p-8 shadow-sm cursor-pointer transition-all ${
                    selectedRoomType?.id === roomType.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedRoomType(roomType)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">{roomType.name}</h3>
                      <p className="text-gray-600 mt-1">{roomType.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(roomType.price)}
                        <span className="text-sm font-normal text-gray-500">/bulan</span>
                      </p>
                      {roomType.enable_daily_price && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(roomType.daily_price || 0)}/hari
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Fasilitas Kamar</h4>
                      <div className="space-y-3">
                        {roomType.room_facilities?.map((facility, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <CheckCircle size={16} className="text-green-500 mr-2" />
                            {facility}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Fasilitas Kamar Mandi</h4>
                      <div className="space-y-3">
                        {roomType.bathroom_facilities?.map((facility, index) => (
                          <div key={index} className="flex items-center text-gray-600">
                            <CheckCircle size={16} className="text-green-500 mr-2" />
                            {facility}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {roomType.photos && roomType.photos.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Foto Kamar</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {roomType.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`${roomType.name} photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => {
                              const photoIndex = allImages.indexOf(photo);
                              if (photoIndex !== -1) {
                                setActiveImageIndex(photoIndex);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* House Rules */}
            {property.rules && property.rules.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Peraturan Kost</h2>
                <div className="space-y-4">
                  {property.rules.map((rule, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-gray-700">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Card */}
          <div>
            <div className="bg-white rounded-xl p-8 shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Kontak</h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <Phone className="text-blue-500 mr-3" size={20} />
                  <p>{property.phone}</p>
                </div>
                <div className="flex items-center">
                  <Mail className="text-blue-500 mr-3" size={20} />
                  <p>{property.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Chat Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/login')}
              icon={<MessageCircle size={20} />}
            >
              Chat dengan Pengelola
            </Button>
            <Button
              variant="success"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleWhatsAppClick}
              icon={<Send size={20} />}
            >
              Hubungi via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
