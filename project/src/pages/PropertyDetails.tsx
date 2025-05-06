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
  Wifi,
  Car,
  Coffee,
  MessageCircle,
  Send,
  ArrowLeft,
  CheckCircle,
  Share,
  Heart,
  ChevronLeft,
  ChevronRight,
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
        supabase.from('room_types').select('*').eq('property_id', id),
      ]);
      if (propertyData.error || !propertyData.data) throw propertyData.error || new Error('Properti tidak ditemukan');
      if (roomTypesData.error) throw roomTypesData.error;

      setProperty(propertyData.data);
      setRoomTypes(roomTypesData.data || []);
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Gagal memuat detail properti');
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
          .insert([{ property_id: id, user_id: user.id }]);
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
        text: `Lihat properti ini: ${property?.name} di ${property?.city}`,
        url: window.location.href,
      });
    }
  };

  const handlePrevImage = () => {
    if (!property) return;
    const allImages = [
      ...(property.photos || []),
      ...(property.common_amenities_photos || []),
      ...(property.parking_amenities_photos || []),
    ];
    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!property) return;
    const allImages = [
      ...(property.photos || []),
      ...(property.common_amenities_photos || []),
      ...(property.parking_amenities_photos || []),
    ];
    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Properti tidak ditemukan'}</h2>
        <Button onClick={() => navigate('/marketplace')}>Kembali ke Marketplace</Button>
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
    <div className="min-h-screen bg-gray-50 pb-24"> {/* Tambahkan padding bawah */}
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali
            </button>
            <div className="flex items-center gap-4">
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100">
                <Share className="h-5 w-5 text-gray-600" />
              </button>
              <button onClick={handleSaveProperty} className="p-2 rounded-full hover:bg-gray-100">
                <Heart
                  className={`h-5 w-5 ${isSaved ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column (Detail Properti) */}
            <div className="space-y-8">
              {/* Image Gallery */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={allImages[activeImageIndex]}
                      alt={`${property.name} - Gambar ${activeImageIndex + 1}`}
                      className="w-full object-cover aspect-[16/9]" // Aspek rasio 16:9
                    />
                    {/* Image Navigation */}
                    <div className="absolute inset-0 flex items-center justify-between p-4">
                      <button
                        onClick={handlePrevImage}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    {/* Dot Navigation */}
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
                  <div className="w-full h-[400px] flex items-center justify-center">
                    <Building2 size={64} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Property Details */}
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
                <h2 className="text-xl font-bold text-gray-900">Tipe Kamar Tersedia</h2>
                {roomTypes.map((roomType) => (
                  <div
                    key={roomType.id}
                    className={`bg-white rounded-2xl p-6 shadow-sm ${
                      selectedRoomType?.id === roomType.id ? 'ring-2 ring-blue-500' : ''
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
                          <span className="text-sm font-normal text-gray-500">/bulan</span>
                        </p>
                        {roomType.enable_daily_price && (
                          <p className="text-sm text-gray-600">
                            {formatCurrency(roomType.daily_price || 0)}/hari
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800 text-sm uppercase tracking-wide mb-2">
                        Fasilitas
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {[
                          ...(roomType.room_facilities || []),
                          ...(roomType.bathroom_facilities || [])
                        ].map((facility, index) => (
                          <span key={index} className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-500" />
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common Amenities */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Fasilitas Umum</h2>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {property.common_amenities?.map((amenity, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <CheckCircle size={12} className="text-green-500" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Info Tambahan) */}
            <div className="space-y-6">
              {/* House Rules */}
              {property.rules && property.rules.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Peraturan Kost</h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    {property.rules.map((rule, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle size={14} className="text-green-500 mr-2" />
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kontak</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Phone className="text-gray-400 mr-3" size={20} />
                    <span>{property.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="text-gray-400 mr-3" size={20} />
                    <span>{property.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
          <div className="max-w-7xl mx-auto flex gap-4">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/login')}
              icon={<MessageCircle size={20} />}
            >
              Chat dengan Pemilik
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