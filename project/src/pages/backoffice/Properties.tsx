import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Search, Building2, MapPin, Phone, Mail, Loader2, Eye, Users, DoorClosed, CreditCard, TrendingUp, AlertTriangle, Calendar, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PropertyStats {
  id: string;
  total_revenue: number;
  total_tenants: number;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  pending_payments: number;
  monthly_revenue: number;
  yearly_revenue: number;
  maintenance_costs: number;
  avg_room_price: number;
  payment_collection_rate: number;
  overdue_payments: number;
  avg_tenant_stay: number;
  tenant_turnover_rate: number;
  maintenance_requests_open: number;
  maintenance_requests_total: number;
}

interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  owner_id: string;
  owner_email?: string;
  owner_name?: string;
  stats?: PropertyStats;
  tenants?: any[];
  rooms?: any[];
  payments?: any[];
  created_at: string;
  updated_at: string;
}

const BackofficeProperties: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [propertyStats, setPropertyStats] = useState<Record<string, PropertyStats>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetails | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [totalActiveTenants, setTotalActiveTenants] = useState<number>(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthorized(false);
        navigate('/login');
        return;
      }

      const { data: backofficeUser, error: roleError } = await supabase
        .from('backoffice_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !backofficeUser || !['admin', 'superadmin'].includes(backofficeUser.role)) {
        setIsAuthorized(false);
        setError('You do not have permission to access this page');
        return;
      }

      setIsSuperAdmin(backofficeUser.role === 'superadmin');

      if (backofficeUser.role === 'superadmin') {
        const { count, error: countError } = await supabase
          .from('tenants')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (!countError && count !== null) {
          setTotalActiveTenants(count);
        }
      }

      loadProperties();
    } catch (err) {
      console.error('Authorization check failed:', err);
      setIsAuthorized(false);
      setError('Failed to verify permissions');
    }
  };

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*');

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        throw new Error('Failed to fetch properties');
      }

      if (!propertiesData || propertiesData.length === 0) {
        setProperties([]);
        return;
      }

      const ownerIds = propertiesData.map(p => p.owner_id);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        throw new Error('No active session found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: ownerIds }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('User details fetch failed:', errorData);
        throw new Error(errorData.error || 'Failed to fetch user details');
      }

      const { users: ownerDetails, errors: userErrors } = await response.json();

      if (userErrors?.length > 0) {
        console.warn('Some user details could not be fetched:', userErrors);
      }

      if (!ownerDetails || !Array.isArray(ownerDetails)) {
        throw new Error('Invalid user details response');
      }

      const propertiesWithOwners = propertiesData.map(property => {
        const owner = ownerDetails.find((u: any) => u.id === property.owner_id) || {
          email: 'Unknown',
          name: 'Unknown User'
        };
        
        return {
          ...property,
          owner_email: owner.email,
          owner_name: owner.name || owner.email
        };
      });

      setProperties(propertiesWithOwners);

      const stats: Record<string, PropertyStats> = {};
      
      for (const property of propertiesData) {
        try {
          const { data: rooms } = await supabase
            .from('rooms')
            .select('*')
            .eq('property_id', property.id);

          const totalRooms = rooms?.length || 0;
          const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
          const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
          const avgRoomPrice = rooms?.reduce((sum, room) => sum + Number(room.price), 0) / totalRooms || 0;

          const { data: tenants } = await supabase
            .from('tenants')
            .select('*')
            .eq('property_id', property.id);

          const activeTenants = tenants?.filter(t => t.status === 'active') || [];
          const totalTenants = activeTenants.length;

          const avgTenantStay = activeTenants.reduce((sum, tenant) => {
            const start = new Date(tenant.start_date);
            const end = new Date(tenant.end_date);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
            return sum + months;
          }, 0) / (activeTenants.length || 1);

          const { data: historicalTenants } = await supabase
            .from('tenants')
            .select('*')
            .eq('property_id', property.id)
            .eq('status', 'inactive');
          
          const turnoverRate = historicalTenants 
            ? (historicalTenants.length / (historicalTenants.length + activeTenants.length)) * 100 
            : 0;

          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('property_id', property.id);

          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const yearStart = new Date(now.getFullYear(), 0, 1);

          const monthlyPayments = payments?.filter(p => {
            const paymentDate = p.date ? new Date(p.date) : null;
            return paymentDate && paymentDate >= monthStart;
          }) || [];

          const yearlyPayments = payments?.filter(p => {
            const paymentDate = p.date ? new Date(p.date) : null;
            return paymentDate && paymentDate >= yearStart;
          }) || [];

          const totalRevenue = payments?.reduce((sum, payment) => 
            payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0) || 0;

          const monthlyRevenue = monthlyPayments.reduce((sum, payment) => 
            payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0);

          const yearlyRevenue = yearlyPayments.reduce((sum, payment) => 
            payment.status === 'paid' ? sum + Number(payment.amount) : sum, 0);

          const pendingPayments = payments?.reduce((sum, payment) => 
            payment.status === 'pending' ? sum + Number(payment.amount) : sum, 0) || 0;

          const overduePayments = payments?.reduce((sum, payment) => 
            payment.status === 'overdue' ? sum + Number(payment.amount) : sum, 0) || 0;

          const totalPayments = payments?.length || 0;
          const paidPayments = payments?.filter(p => p.status === 'paid').length || 0;
          const paymentCollectionRate = totalPayments > 0 
            ? (paidPayments / totalPayments) * 100 
            : 0;

          const { data: maintenanceRequests } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('property_id', property.id);

          const openRequests = maintenanceRequests?.filter(r => 
            r.status === 'pending' || r.status === 'in-progress'
          ).length || 0;

          const maintenanceCosts = maintenanceRequests?.reduce((sum, request) => {
            const estimatedCost = 
              request.priority === 'high' ? 1000000 :
              request.priority === 'medium' ? 500000 :
              250000;
            return sum + estimatedCost;
          }, 0) || 0;
          
          stats[property.id] = {
            id: property.id,
            total_revenue: totalRevenue,
            monthly_revenue: monthlyRevenue,
            yearly_revenue: yearlyRevenue,
            total_tenants: totalTenants,
            total_rooms: totalRooms,
            occupied_rooms: occupiedRooms,
            occupancy_rate: occupancyRate,
            pending_payments: pendingPayments,
            maintenance_costs: maintenanceCosts,
            avg_room_price: avgRoomPrice,
            payment_collection_rate: paymentCollectionRate,
            overdue_payments: overduePayments,
            avg_tenant_stay: Math.round(avgTenantStay),
            tenant_turnover_rate: Math.round(turnoverRate),
            maintenance_requests_open: openRequests,
            maintenance_requests_total: maintenanceRequests?.length || 0
          };
        } catch (statsError) {
          console.error(`Error calculating stats for property ${property.id}:`, statsError);
          stats[property.id] = {
            id: property.id,
            total_revenue: 0,
            monthly_revenue: 0,
            yearly_revenue: 0,
            total_tenants: 0,
            total_rooms: 0,
            occupied_rooms: 0,
            occupancy_rate: 0,
            pending_payments: 0,
            maintenance_costs: 0,
            avg_room_price: 0,
            payment_collection_rate: 0,
            overdue_payments: 0,
            avg_tenant_stay: 0,
            tenant_turnover_rate: 0,
            maintenance_requests_open: 0,
            maintenance_requests_total: 0
          };
        }
      }

      setPropertyStats(stats);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to load properties');
      setProperties([]);
      setPropertyStats({});
    } finally {
      setIsLoading(false);
    }
  };

  const loadPropertyDetails = async (propertyId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId);

      if (roomsError) throw roomsError;

      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('property_id', propertyId);

      if (tenantsError) throw tenantsError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No session found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: [property.owner_id] }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch owner details');
      }

      const { users } = await response.json();
      const owner = users[0];

      const propertyDetails: PropertyDetails = {
        ...property,
        owner_email: owner?.email,
        owner_name: owner?.name || owner?.email,
        stats: propertyStats[propertyId],
        rooms,
        tenants,
        payments
      };

      setSelectedProperty(propertyDetails);
    } catch (err) {
      console.error('Error loading property details:', err);
      setError('Failed to load property details');
      setSelectedProperty(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (propertyId: string) => {
    setShowPropertyDetails(propertyId);
    await loadPropertyDetails(propertyId);
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
        {isSuperAdmin && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Active Tenants</p>
                <p className="text-2xl font-bold text-blue-900">{totalActiveTenants}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          {!isAuthorized && (
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="mr-2"
              >
                Go to Homepage
              </Button>
            </div>
          )}
        </div>
      )}

      {isAuthorized && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">All Properties</h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                <p className="mt-2 text-gray-500">Loading properties...</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(property.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                          <p className="text-sm text-gray-500">{property.city}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {propertyStats[property.id]?.occupancy_rate}% Occupied
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <CreditCard size={16} />
                            Monthly Revenue
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(propertyStats[property.id]?.monthly_revenue || 0)}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users size={16} />
                            Active Tenants
                          </div>
                          <p className="font-semibold text-gray-900">
                            {propertyStats[property.id]?.total_tenants || 0}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <DoorClosed size={16} />
                            Rooms
                          </div>
                          <p className="font-semibold text-gray-900">
                            {propertyStats[property.id]?.occupied_rooms || 0}/{propertyStats[property.id]?.total_rooms || 0}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <AlertTriangle size={16} />
                            Pending Payments
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(propertyStats[property.id]?.pending_payments || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Owner</span>
                          <span className="font-medium text-gray-900">
                            {property.owner_name || property.owner_email}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          icon={<Eye size={16} />}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {searchQuery
                  ? 'No properties match your search.'
                  : 'No properties found.'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showPropertyDetails && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedProperty.name}</h2>
              <button 
                onClick={() => {
                  setShowPropertyDetails(null);
                  setSelectedProperty(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Property Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedProperty.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{selectedProperty.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{selectedProperty.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{selectedProperty.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{selectedProperty.owner_name}</p>
                    <p className="text-sm text-gray-500">{selectedProperty.owner_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="font-medium">
                      {new Date(selectedProperty.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                    <p className="text-xl font-semibold text-blue-900">
                      {formatCurrency(selectedProperty.stats?.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">Monthly Revenue</p>
                    <p className="text-xl font-semibold text-green-900">
                      {formatCurrency(selectedProperty.stats?.monthly_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Yearly Revenue</p>
                    <p className="text-xl font-semibold text-purple-900">
                      {formatCurrency(selectedProperty.stats?.yearly_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-yellow-600">Pending Payments</p>
                    <p className="text-xl font-semibold text-yellow-900">
                      {formatCurrency(selectedProperty.stats?.pending_payments || 0)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-600">Overdue Payments</p>
                    <p className="text-xl font-semibold text-red-900">
                      {formatCurrency(selectedProperty.stats?.overdue_payments || 0)}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-indigo-600">Maintenance Costs</p>
                    <p className="text-xl font-semibold text-indigo-900">
                      {formatCurrency(selectedProperty.stats?.maintenance_costs || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Occupancy & Tenant Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Occupancy Rate</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedProperty.stats?.occupancy_rate}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Room Price</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(selectedProperty.stats?.avg_room_price || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Tenant Stay</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedProperty.stats?.avg_tenant_stay} months
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Turnover Rate</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedProperty.stats?.tenant_turnover_rate}%
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Payment Collection Rate</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {Math.round(selectedProperty.stats?.payment_collection_rate || 0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Open Maintenance Requests</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedProperty.stats?.maintenance_requests_open} / {selectedProperty.stats?.maintenance_requests_total}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Active Tenants</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {selectedProperty.stats?.total_tenants}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {selectedProperty.payments?.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={
                        payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100  text-red-800'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackofficeProperties;