import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

import { themeColors, shadows } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { SearchBar } from '../../components/SearchBar';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/format';
import { Donor, PageResponse } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const DonorListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 5;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // TanStack Query for Donors
  const { data: pageData, isLoading, isFetching, refetch } = useQuery<PageResponse<Donor>>({
    queryKey: ['donors', page],
    queryFn: async () => {
      const res = await apiClient.get('/donors', {
        params: { page, size: pageSize },
      });
      return res.data;
    },
  });

  const donors = pageData?.content || [];
  const totalPages = pageData?.totalPages || 1;
  const totalElements = pageData?.totalElements || donors.length;

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredDonors = donors.filter((d) =>
    (d.fullName && d.fullName.toLowerCase().includes(search.toLowerCase())) ||
    (d.remarks && d.remarks.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Donors" />

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search donors by name..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredDonors}
          keyExtractor={(item) => String(item.donorId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard
              onPress={() => navigation.navigate('DonorDetails', { id: String(item.donorId) })}
              accentColor={themeColors.primary}
            >
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.donorName}>
                  {item.fullName}
                </Text>
                <Text variant="titleMedium" style={styles.donorAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text variant="bodyMedium" style={styles.dateLabel}>
                  Donated on: {formatDate(item.donationDate)}
                </Text>
                {item.remarks !== null && item.remarks !== undefined && item.remarks.trim() !== '' ? (
                  <Text variant="bodySmall" style={styles.remarksLabel} numberOfLines={1}>
                    {`"${item.remarks}"`}
                  </Text>
                ) : null}
              </View>
            </ReusableCard>
          )}
          ListFooterComponent={
            filteredDonors.length > 0 ? (
              <View style={styles.paginationContainer}>
                <IconButton
                  icon="chevron-left"
                  size={20}
                  disabled={page === 0 || isFetching}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                />
                <Text style={styles.paginationText}>
                  Page {page + 1} of {totalPages} ({totalElements} total)
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  disabled={page >= totalPages - 1 || isFetching}
                  onPress={() => setPage((p) => p + 1)}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="hand-heart-outline"
              title="No Donors Found"
              description={search ? "No donors matched your search criteria." : "There are currently no donors registered."}
              actionLabel={isAdmin ? "Add First Donor" : undefined}
              onAction={isAdmin ? () => navigation.navigate('DonorForm') : undefined}
            />
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          label="Add Donor"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('DonorForm')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  searchSection: {
    padding: 12,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 88, // Ensure space for FAB
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donorName: {
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
    marginRight: 8,
  },
  donorAmount: {
    fontWeight: 'bold',
    color: themeColors.success,
  },
  cardFooter: {
    marginTop: 4,
  },
  dateLabel: {
    color: themeColors.textMuted,
  },
  remarksLabel: {
    color: themeColors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...shadows.soft,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text,
    marginHorizontal: 8,
  },
});

export default DonorListScreen;
