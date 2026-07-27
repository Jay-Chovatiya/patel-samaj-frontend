import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { ReusableCard } from '../../components/ReusableCard';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';
import { Donor, Event, Expense } from '../../types/index';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const isFromLogin = useSelector((state: RootState) => state.auth.isFromLogin);
  const isAdmin = isFromLogin === true;

  // Fetch Dashboard Stats/Data in Parallel
  const { data: donors = [], isLoading: loadingDonors, refetch: refetchDonors } = useQuery<Donor[]>({
    queryKey: ['donors'],
    queryFn: async () => {
      const res = await apiClient.get('/donors');
      return res.data || [];
    },
  });

  const { data: allEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await apiClient.get('/events');
      return res.data || [];
    },
  });

  const { data: expenses = [], isLoading: loadingExpenses, refetch: refetchExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await apiClient.get('/expenses');
      return res.data || [];
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDonors(), refetchEvents(), refetchExpenses()]);
    setRefreshing(false);
  };

  // Compile calculations
  const totalDonorsCount = donors.length;

  const pendingEvents = allEvents.filter(e => !e.isClosed && (e.statusId === null || e.statusId === 1));
  const approvedEvents = allEvents.filter(e => !e.isClosed && e.statusId === 2);
  const inProgressEvents = allEvents.filter(e => !e.isClosed && e.statusId === 3);
  const closedEvents = allEvents.filter(e => e.isClosed || e.statusId === 4);

  const pendingCount = pendingEvents.length;
  const approvedCount = approvedEvents.length;
  const inProgressCount = inProgressEvents.length;
  const activeCount = approvedCount + inProgressCount;

  const totalExpenseSum = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Quick Action Handler
  const handleQuickAction = (route: string) => {
    switch (route) {
      case 'DonorForm':
        navigation.navigate('DonorsTab' as any, { screen: 'DonorForm' } as any);
        break;
      case 'EventForm':
        navigation.navigate('EventsTab' as any, { screen: 'EventForm' } as any);
        break;
      case 'ExpenseForm':
        navigation.navigate('ExpensesTab' as any, { screen: 'ExpenseForm' } as any);
        break;
      case 'ItemForm':
        navigation.navigate('ItemForm' as any);
        break;
      default:
        break;
    }
  };

  if (loadingDonors || loadingEvents || loadingExpenses) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader title="Dashboard" />
        <SkeletonLoader type="card" count={2} />
        <SkeletonLoader type="list" count={2} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Dashboard"
        subtitle="Leuva Patel Samaj Admin"
        rightActionIcon="calendar-multiselect"
        onRightAction={() => navigation.navigate('InventoryList')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        {/* Financial Header Section */}
        <View style={styles.financeHeader}>
          <Text style={styles.financeLabel}>Total Outflow (Expenses)</Text>
          <Text style={styles.financeAmount}>{formatCurrency(totalExpenseSum)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.primary, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'DonorsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="hand-heart" size={24} iconColor={themeColors.primary} />
                <Text style={styles.statVal}>{totalDonorsCount}</Text>
                <Text style={styles.statLabel}>Total Donors</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: '#3B82F6', borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="calendar-sync" size={24} iconColor="#3B82F6" />
                <Text style={styles.statVal}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active Events</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.warning, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="clock-outline" size={24} iconColor={themeColors.warning} />
                <Text style={styles.statVal}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending Events</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.success, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="check-circle-outline" size={24} iconColor={themeColors.success} />
                <Text style={styles.statVal}>{approvedCount}</Text>
                <Text style={styles.statLabel}>Approved Events</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card 
              style={[styles.statCard, { borderTopColor: '#A855F7', borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'EventsTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="progress-wrench" size={24} iconColor="#A855F7" />
                <Text style={styles.statVal}>{inProgressCount}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </Card.Content>
            </Card>

            <Card 
              style={[styles.statCard, { borderTopColor: themeColors.error, borderTopWidth: 4 }]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'ExpensesTab' })}
            >
              <Card.Content style={styles.statContent}>
                <IconButton icon="cash-remove" size={24} iconColor={themeColors.error} />
                <Text style={styles.statVal}>{formatCurrency(totalExpenseSum)}</Text>
                <Text style={styles.statLabel}>Total Expenses</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Quick Actions Panel */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('EventForm')}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabelText}>Add Event</Text>
          </TouchableOpacity>

          {isAdmin && (
            <>
              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('DonorForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: themeColors.saffronLight }]}>
                  <MaterialCommunityIcons name="hand-heart" size={24} color={themeColors.primary} />
                </View>
                <Text style={styles.actionLabelText}>Add Donor</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('ExpenseForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#FEF2F2' }]}>
                  <MaterialCommunityIcons name="cash-plus" size={24} color={themeColors.error} />
                </View>
                <Text style={styles.actionLabelText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => handleQuickAction('ItemForm')}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#FDF2F8' }]}>
                  <MaterialCommunityIcons name="package-variant-closed-plus" size={24} color="#EC4899" />
                </View>
                <Text style={styles.actionLabelText}>Add Item</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent Donors Section */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Donors</Text>
          <Button compact onPress={() => navigation.navigate('DonorsTab' as any)}>View All</Button>
        </View>

        {donors.slice(0, 3).map((donor) => (
          <ReusableCard key={donor.donorId} onPress={() => navigation.navigate('DonorDetails' as any, { id: String(donor.donorId) })}>
            <View style={styles.listRow}>
              <View>
                <Text style={styles.donorName}>{donor.fullName}</Text>
                <Text style={styles.dateLabel}>{formatDate(donor.donationDate)}</Text>
              </View>
              <Text style={styles.donorAmount}>₹{donor.amount.toLocaleString('en-IN')}</Text>
            </View>
          </ReusableCard>
        ))}
        {donors.length === 0 && (
          <Text style={styles.emptyText}>No donors added yet.</Text>
        )}

        {/* Upcoming Events Section */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Upcoming Events</Text>
          <Button compact onPress={() => navigation.navigate('EventsTab' as any)}>View All</Button>
        </View>

        {allEvents
          .filter(e => !e.isClosed && e.statusId !== 4)
          .slice(0, 3)
          .map((evt) => {
            const statusText = !evt.isClosed && evt.statusId === 2 ? 'APPROVED' : !evt.isClosed && evt.statusId === 3 ? 'IN_PROGRESS' : 'PENDING';
            return (
              <ReusableCard key={evt.eventId} onPress={() => navigation.navigate('EventDetails' as any, { id: String(evt.eventId) })}>
                <View style={styles.listRow}>
                  <View>
                    <Text style={styles.donorName}>{evt.eventType} - {evt.familyHeadName}</Text>
                    <Text style={styles.dateLabel}>{formatDate(evt.eventDate)}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{statusText}</Text>
                  </View>
                </View>
              </ReusableCard>
            );
          })}
        {allEvents.length === 0 && (
          <Text style={styles.emptyText}>No upcoming events registered.</Text>
        )}

        {/* Daily Expense Summary */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Daily Expense Summary</Text>
          <Button compact onPress={() => navigation.navigate('ExpensesTab' as any)}>View All</Button>
        </View>

        {expenses.slice(0, 3).map((exp) => (
          <ReusableCard key={exp.expenseId} onPress={() => navigation.navigate('ExpenseDetails' as any, { id: String(exp.expenseId) })}>
            <View style={styles.listRow}>
              <View>
                <Text style={styles.donorName}>{exp.description || 'Expense'}</Text>
                <Text style={styles.dateLabel}>{formatDate(exp.expenseDate)} ({exp.category})</Text>
              </View>
              <Text style={[styles.donorAmount, { color: themeColors.error }]}>- {formatCurrency(exp.amount)}</Text>
            </View>
          </ReusableCard>
        ))}
        {expenses.length === 0 && (
          <Text style={styles.emptyText}>No recent expenses recorded.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  financeHeader: {
    backgroundColor: themeColors.secondary, // Dark Navy
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  financeLabel: {
    color: themeColors.saffronLight,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  financeAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsGrid: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadows.soft,
  },
  statContent: {
    alignItems: 'center',
    padding: 8,
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginTop: -4,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.soft,
  },
  actionLabelText: {
    fontSize: 12,
    color: themeColors.text,
    fontWeight: '500',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  donorAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: themeColors.success,
  },
  dateLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: themeColors.saffronLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: themeColors.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: themeColors.textMuted,
    marginVertical: 12,
    fontSize: 13,
  },
});

export default DashboardScreen;
