import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Building2, MapPin, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PropertyCardProps {
  property: Property;
  lowestPrice: number;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, lowestPrice }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [property.id]);

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('saved_properties')
        .select('id')
        .eq('property_id', property.id)
        .eq('user_id', user.id)
        .single();

      setIsSaved(!!data);
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('property_id', property.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_properties')
          .insert([{
            property_id: property.id,
            user_id: user.id
          }]);

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
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
            <Building2 size={48} className="text-gray-400" />
          </div>
        )}
        <button
          onClick={handleSaveClick}
          disabled={isLoading}
          className={`absolute top-2 right-2 p-2 rounded-full ${
            isSaved 
              ? 'bg-red-500 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          } transition-colors`}
        >
          <Heart className={isSaved ? 'fill-current' : ''} size={20} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
        <div className="flex items-center text-gray-600 mt-1">
          <MapPin size={16} className="mr-1" />
          <p className="text-sm">{property.address}, {property.city}</p>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">Mulai dari</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(lowestPrice)}/bulan</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;