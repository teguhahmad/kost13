import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Search, MapPin, Phone, Mail, Building2, Bed, Bath, Wifi, Fan, DoorClosed, Loader2, LogIn } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../lib/supabase';

interface KostListing {
  id: string;
  property_id: string;
  room_type_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  price: number;
  type: string;
  room_facilities: string[];
  bathroom_facilities: string[];
  photos: string[];
  contact: {
    phone: string;
    email: string;
  };
  available_rooms: number;
  max_occupancy: number;
  renter_gender: 'male' | 'female' | 'any';
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [typeFilter, setTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<KostListing[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    loadListings();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const loadListings = async () => {
    try {
      setIsLoading(true);

      // Get all properties that are enabled for marketplace
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          city,
          phone,
          email,
          description,
          marketplace_enabled,
          marketplace_status,
          room_types (
            id,
            name,
            price,
            description,
            room_facilities,
            bathroom_facilities,
            photos,
            max_occupancy,
            renter_gender
          ),
          rooms (
            id,
            type,
            status
          )
        `)
        .eq('marketplace_enabled', true)
        .eq('marketplace_status', 'published');

      if (propertiesError) throw propertiesError;

      if (!properties || properties.length === 0) {
        setListings([]);
        return;
      }

      // Transform the data into listings
      const transformedListings = properties.reduce((acc: KostListing[], property) => {
        if (!property.room_types) return acc;

        property.room_types.forEach(roomType => {
          // Count available rooms of this type
          const availableRooms = property.rooms?.filter(
            room => room.type === roomType.name && room.status === 'vacant'
          ).length || 0;

          // Include in listings even if no rooms are currently available
          acc.push({
            id: `${property.id}-${roomType.id}`,
            property_id: property.id,
            room_type_id: roomType.id,
            name: `${property.name} - ${roomType.name}`,
            description: roomType.description || property.description || '',
            address: property.address,
            city: property.city,
            price: roomType.price,
            type: roomType.name,
            room_facilities: roomType.room_facilities || [],
            bathroom_facilities: roomType.bathroom_facilities || [],
            photos: roomType.photos || [],
            contact: {
              phone: property.phone || '',
              email: property.email || ''
            },
            available_rooms: availableRooms,
            max_occupancy: roomType.max_occupancy,
            renter_gender: roomType.renter_gender
          });
        });

        return acc;
      }, []);

      setListings(transformedListings);
    } catch (err) {
      console.error('Error loading listings:', err);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = !cityFilter || listing.city.toLowerCase() === cityFilter.toLowerCase();
    const matchesPrice = listing.price >= priceRange.min && listing.price <= priceRange.max;
    const matchesType = typeFilter === 'all' || listing.type === typeFilter;
    const matchesGender = genderFilter === 'all' || listing.renter_gender === genderFilter || listing.renter_gender === 'any';

    return matchesSearch && matchesCity && matchesPrice && matchesType && matchesGender;
  });

  const cities = [...new Set(listings.map(listing => listing.city))];
  const types = [...new Set(listings.map(listing => listing.type))];

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case 'wifi':
        return <Wifi size={16} />;
      case 'ac':
        return <Fan size={16} />;
      case 'bathroom':
        return <Bath size={16} />;
      default:
        return <DoorClosed size={16} />;
    }
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="mt-2 text-gray-600">Loading available rooms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Kost</h1>
            {!isAuthenticated && (
              <p className="text-gray-500 mt-2">
                <LogIn className="inline-block mr-2" size={16} />
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Login to contact property owners
                </Button>
              </p>
            )}
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="relative h-48">
                {listing.photos && listing.photos.length > 0 ? (
                  <img
                    src={listing.photos[0]}
                    alt={listing.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Building2 size={48} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {listing.available_rooms} Available
                  </Badge>
                  <Badge className={
                    listing.renter_gender === 'male' ? 'bg-blue-100 text-blue-800' :
                    listing.renter_gender === 'female' ? 'bg-pink-100 text-pink-800' :
                    'bg-purple-100 text-purple-800'
                  }>
                    {listing.renter_gender === 'male' ? 'Male Only' :
                     listing.renter_gender === 'female' ? 'Female Only' :
                     'All Gender'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.name}</h3>
                <div className="flex items-start gap-2 text-gray-500 mb-4">
                  <MapPin size={16} className="mt-1" />
                  <p>{listing.address}, {listing.city}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.room_facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm text-gray-600"
                    >
                      {getFacilityIcon(facility)}
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Starting from</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(listing.price)}</p>
                    <p className="text-sm text-gray-500">per month</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContactClick}
                      icon={<Phone size={16} />}
                    >
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContactClick}
                      icon={<Mail size={16} />}
                    >
                      Email
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleContactClick}
                  icon={<Building2 size={16} />}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">
              Try adjusting your search filters or check back later for new listings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
