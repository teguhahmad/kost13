import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, RoomType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Building2, MapPin, Phone, Mail, Users, Bath, Home, Wifi, Car, Coffee, DoorClosed } from 'lucide-react';
import Button from '../ui/Button';

interface PropertyDetailsProps {
  property: Property;
  roomTypes: RoomType[];
  onClose: () => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, roomTypes, onClose }) => {
  const navigate = useNavigate();

  const lowestPrice = Math.min(...roomTypes.map(rt => rt.price));
  const highestPrice = Math.max(...roomTypes.map(rt => rt.price));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        {/* Image Gallery */}
        <div className="relative h-96">
          {property.photos && property.photos.length > 0 ? (
            <img
              src={property.photos[0]}
              alt={property.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
              <Building2 size={64} className="text-gray-400" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center text-gray-600 mt-2">
              <MapPin size={20} className="mr-2" />
              <p>{property.address}, {property.city}</p>
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Harga Sewa</h2>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(lowestPrice)}
              {highestPrice > lowestPrice && ` - ${formatCurrency(highestPrice)}`}
              <span className="text-base font-normal text-blue-500">/bulan</span>
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fasilitas Umum</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {property.common_amenities.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Coffee className="text-blue-500" size={20} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Types */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipe Kamar</h2>
            <div className="space-y-4">
              {roomTypes.map(roomType => (
                <div key={roomType.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{roomType.name}</h3>
                      <p className="text-gray-600">{roomType.description}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(roomType.price)}<span className="text-sm font-normal">/bulan</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-gray-500" />
                      <span>Maks. {roomType.max_occupancy} orang</span>
                    </div>
                    {roomType.bathroom_facilities?.includes('Kamar Mandi Dalam') && (
                      <div className="flex items-center space-x-2">
                        <Bath size={16} className="text-gray-500" />
                        <span>Kamar Mandi Dalam</span>
                      </div>
                    )}
                    {roomType.room_facilities?.map((facility, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <DoorClosed size={16} className="text-gray-500" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Informasi Kontak</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="text-gray-500 mr-3" size={20} />
                <p>{property.phone}</p>
              </div>
              <div className="flex items-center">
                <Mail className="text-gray-500 mr-3" size={20} />
                <p>{property.email}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Pesan Sekarang
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Kembali
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;