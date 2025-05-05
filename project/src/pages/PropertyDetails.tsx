import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';
import FloatingNav from '../components/ui/FloatingNav';
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
  Share,
  Heart,
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
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadPropertyDetails();
    checkIfSaved();
  }, [id]);

  const loadPropertyDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [propertyData, roomTypesData] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .eq('marketplace_enabled', true)
          .eq('marketplace_status', 'published')
          .single(),
        supabase
          .from('room_types')
          .select('*')
          .eq('property_id', id)
      ]);

      if (propertyData.error) throw propertyData.error;
      if (roomTypesData.error) throw roomTypesData.error;
      if (!propertyData.data) throw new Error('Property not found');

      setProperty(propertyData.data);
      setRoomTypes(roomTypesData.data || []);
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Failed to load property details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('property_id', id)
        .eq('user_id', user.id)
        .single();

      setIsSaved(!!data);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveProperty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      if (isSaved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('property_id', id)
          .eq('user_id', user.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_properties')
          .insert([{
            property_id: id,
            user_id: user.id
          }]);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.name,
        text: `Check out this property: ${property?.name} in ${property?.city}`,
        url: window.location.href
      });
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100">
                <Share className="h-5 w-5 text-gray-600" />
              </button>
              <button 
                onClick={handleSaveProperty} 
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Heart 
                  className={`h-5 w-5 ${isSaved ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {/* Image Gallery */}
        <div className="relative aspect-w-16 aspect-h-9 bg-gray-100">
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[activeImageIndex]}
                alt={`${property.name} - Image ${activeImageIndex + 1}`}
                className="w-full h-[300px] object-cover"
              />
              {/* Image Navigation */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex gap-2">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-[300px] flex items-center justify-center">
              <Building2 size={64} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {/* Property Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.name}</h1>
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin size={18} className="mr-2" />
              <p>{property.address}, {property.city}</p>
            </div>
            <p className="text-gray-600">{property.description}</p>
          </div>

          {/* Room Types */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Available Rooms</h2>
            {roomTypes.map((roomType) => (
              <div
                key={roomType.id}
                className={`bg-white rounded-2xl p-6 shadow-sm ${
                  selectedRoomType?.id === roomType.id
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => setSelectedRoomType(roomType)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{roomType.name}</h3>
                    <p className="text-gray-600">{roomType.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(roomType.price)}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                    {roomType.enable_daily_price && (
                      <p className="text-sm text-gray-600">
                        {formatCurrency(roomType.daily_price || 0)}/day
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Room Features</h4>
                    <div className="space-y-2">
                      {roomType.room_facilities?.map((facility, index) => (
                        <div key={index} className="flex items-center text-gray-600">
                          <CheckCircle size={16} className="mr-2 text-green-500" />
                          {facility}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Bathroom</h4>
                    <div className="space-y-2">
                      {roomType.bathroom_facilities?.map((facility, index) => (
                        <div key={index} className="flex items-center text-gray-600">
                          <CheckCircle size={16} className="mr-2 text-green-500" />
                          {facility}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Facilities</h2>
            <div className="grid grid-cols-2 gap-4">
              {property.common_amenities?.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-xl"
                >
                  <Coffee className="text-blue-500 mr-3" size={20} />
                  <span className="text-gray-700">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* House Rules */}
          {property.rules && property.rules.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">House Rules</h2>
              <ul className="space-y-2">
                {property.rules.map((rule, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <CheckCircle size={16} className="mr-2 text-green-500" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
          <div className="max-w-7xl mx-auto flex gap-4">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/login')}
              icon={<MessageCircle size={20} />}
            >
              Chat with Owner
            </Button>
            <Button
              variant="success"
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={handleWhatsAppClick}
              icon={<Send size={20} />}
            >
              WhatsApp
            </Button>
          </div>
        </div>

        <FloatingNav />
      </div>
    </div>
  );
};

export default PropertyDetails;
