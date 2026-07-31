import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';
import { Event } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type TabType = 'PENDING' | 'APPROVED' | 'IN_PROGRESS';

const getEventStatusText = (item: Event) => {
  if (item.isClosed === true || item.statusId === 4) {
    return 'CLOSED';
  }
  if (item.statusId === 2) {
    return 'APPROVED';
  }
  if (item.statusId === 3) {
    return 'IN_PROGRESS';
  }
  return 'PENDING';
};

export const EventListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [activeTab, setActiveTab] = useState<TabType>(isAdmin ? 'PENDING' : 'IN_PROGRESS');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setActiveTab('IN_PROGRESS');
    }
  }, [isAdmin]);

  // Map tabs to status-specific API endpoints
  const getEndpoint = (tab: TabType) => {
    if (!isAdmin) return '/events/in-progress';
    switch (tab) {
      case 'PENDING':
        return '/events/pending';
      case 'APPROVED':
        return '/events/approved';
      default:
      case 'IN_PROGRESS':
        return '/events/in-progress';
    }
  };

  const currentTab = isAdmin ? activeTab : 'IN_PROGRESS';

  const { data: events = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['events', currentTab],
    queryFn: async () => {
      const res = await apiClient.get(getEndpoint(currentTab));
      return res.data || [];
    },
  });

  // Refetch events data whenever user navigates to Events tab
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Filter events client-side to ensure closed events are excluded from status-specific tabs
  const filteredEvents = events.filter((item) => {
    const status = getEventStatusText(item);
    if (activeTab === 'PENDING') return status === 'PENDING';
    if (activeTab === 'APPROVED') return status === 'APPROVED';
    if (activeTab === 'IN_PROGRESS') return status === 'IN_PROGRESS';
    return true;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return themeColors.warning;
      case 'APPROVED':
        return themeColors.success;
      case 'IN_PROGRESS':
        return '#3B82F6'; // Blue
      case 'CLOSED':
        return themeColors.textMuted;
      default:
        return themeColors.primary;
    }
  };

  const renderTab = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Events & Hall Bookings" />

      {/* Top Tabs Custom bar - shown for Admin */}
      {isAdmin && (
        <View style={styles.tabsContainer}>
          {renderTab('PENDING', 'Pending')}
          {renderTab('APPROVED', 'Approved')}
          {renderTab('IN_PROGRESS', 'In Progress')}
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => String(item.eventId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => {
            const itemsCount = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
            const statusStr = getEventStatusText(item);
            return (
              <ReusableCard
                onPress={() => navigation.navigate('EventDetails', { id: String(item.eventId) })}
                accentColor={getStatusColor(statusStr)}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.eventType}>
                      {item.eventType}
                    </Text>
                    <Text variant="bodyMedium" style={styles.familyHead}>
                      {item.familyHeadName} Head
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusStr) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(statusStr) }]}>
                      {statusStr}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="phone-outline" size={16} color={themeColors.textMuted} />
                    <Text style={styles.metaText}>{item.contactNumber}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color={themeColors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(item.eventDate)}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <View style={styles.infoCol}>
                    <Text style={styles.footerLabel}>Items Count</Text>
                    <Text style={styles.footerValue}>{itemsCount} items</Text>
                  </View>
                  <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.footerLabel}>Total Bill</Text>
                    <Text style={[styles.footerValue, { color: themeColors.primary, fontWeight: 'bold' }]}>
                      {formatCurrency(item.totalAmount)}
                    </Text>
                  </View>
                </View>
              </ReusableCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-blank-outline"
              title="No Events Found"
              description={`There are currently no ${activeTab.toLowerCase()} events recorded.`}
              actionLabel="Book New Event"
              onAction={() => navigation.navigate('EventForm')}
            />
          }
        />
      )}

      <FAB
        icon="plus"
        label="Book Event"
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('EventForm')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: themeColors.primary,
  },
  tabLabel: {
    fontSize: 13,
    color: themeColors.textMuted,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: themeColors.primary,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 88, // Space for FAB
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventType: {
    fontWeight: 'bold',
    color: themeColors.text,
    fontSize: 16,
  },
  familyHead: {
    color: themeColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 14,
    color: themeColors.text,
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: themeColors.border,
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {},
  footerLabel: {
    fontSize: 11,
    color: themeColors.textMuted,
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 14,
    color: themeColors.text,
    marginTop: 2,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
  },
});

export default EventListScreen;
