import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PropertyCard from '../components/marketplace/PropertyCard';
import type { Database } from '../types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];
type RoomType = Database['public']['Tables']['room_types']['Row'];

export default function Marketplace() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<Record<string, RoomType[]>>({});
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        return;
      }

      setProperties(propertiesData);
      setFilteredProperties(propertiesData); // Initialize filtered properties with all properties

      // Fetch room types for each property
      const roomTypesData: Record<string, RoomType[]> = {};
      for (const property of propertiesData) {
        const { data: propertyRoomTypes, error: roomTypesError } = await supabase
          .from('room_types')
          .select('*')
          .eq('property_id', property.id);

        if (roomTypesError) {
          console.error('Error fetching room types:', roomTypesError);
          continue;
        }

        roomTypesData[property.id] = propertyRoomTypes;
      }

      setRoomTypes(roomTypesData);
    }

    fetchProperties();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProperties.map((property) => {
          const propertyRoomTypes = roomTypes[property.id] || [];
          const lowestPrice = Math.min(...propertyRoomTypes.map((rt) => Number(rt.price)) || [0]);

          return (
            <PropertyCard
              key={property.id}
              property={property}
              lowestPrice={lowestPrice}
            />
          );
        })}
      </div>
    </div>
  );
}