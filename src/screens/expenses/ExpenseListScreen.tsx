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
import { Expense, PageResponse } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 5;

  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  // Fetch Expenses
  const { data: pageData, isLoading, isFetching, refetch } = useQuery<PageResponse<Expense>>({
    queryKey: ['expenses', page],
    queryFn: async () => {
      const res = await apiClient.get('/expenses', {
        params: { page, size: pageSize },
      });
      return res.data;
    },
  });

  const expenses = pageData?.content || [];
  const totalPages = pageData?.totalPages || 1;
  const totalElements = pageData?.totalElements || expenses.length;

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredExpenses = expenses.filter((e) =>
    (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
    (e.category && e.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Samaj Expenses"
        rightActionIcon="chart-donut"
        onRightAction={() => navigation.navigate('ExpenseSummary')}
      />

      <View style={styles.searchSection}>
        <SearchBar
          placeholder="Search expenses by name or category..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => String(item.expenseId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard
              onPress={() => navigation.navigate('ExpenseDetails', { id: String(item.expenseId) })}
              accentColor={themeColors.error}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={styles.title}>
                    {item.description || 'Expense'}
                  </Text>
                  <Text style={styles.categoryLabel}>{item.category || 'Uncategorized'}</Text>
                </View>
                <Text style={styles.amount}>
                  - {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.dateLabel}>Date: {formatDate(item.expenseDate)}</Text>
              </View>
            </ReusableCard>
          )}
          ListFooterComponent={
            filteredExpenses.length > 0 ? (
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
              icon="cash-remove"
              title="No Expenses Found"
              description={search ? "No records matched your search." : "No expense outflow recorded yet."}
              actionLabel={isAdmin ? "Add Expense" : undefined}
              onAction={isAdmin ? () => navigation.navigate('ExpenseForm') : undefined}
            />
          }
        />
      )}

      {isAdmin && (
        <FAB
          icon="plus"
          label="Add Expense"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          color="#FFFFFF"
          onPress={() => navigation.navigate('ExpenseForm')}
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
    paddingBottom: 88,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  categoryLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontWeight: 'bold',
    color: themeColors.error,
    fontSize: 16,
  },
  cardFooter: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingTop: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: themeColors.textMuted,
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

export default ExpenseListScreen;
