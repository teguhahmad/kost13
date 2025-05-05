// Update the imports section to add PropertyCard
import PropertyCard from '../components/marketplace/PropertyCard';

// Find the property card rendering section in the grid and replace it with:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {filteredProperties.map((property) => {
    const propertyRoomTypes = roomTypes[property.id] || [];
    const lowestPrice = Math.min(...propertyRoomTypes.map((rt) => rt.price));

    return (
      <PropertyCard
        key={property.id}
        property={property}
        lowestPrice={lowestPrice}
      />
    );
  })}
</div>

export default PropertyCard