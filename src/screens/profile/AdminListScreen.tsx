import React, { useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, Switch, FAB, IconButton, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { ReusableCard } from '../../components/ReusableCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { UserDTO } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const AdminListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all admins (UserDTO)
  const { data: admins = [], isLoading, refetch } = useQuery<UserDTO[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      const res = await apiClient.get('/user/all');
      const list = res.data || [];
      return list.map((item: any) => ({
        userId: item.userId || item.id || 0,
        fullName: item.fullName || item.name || '',
        mobileNumber: item.mobileNumber || item.phone || '',
        isActive: item.isActive !== undefined ? item.isActive : (item.active !== undefined ? item.active : true),
      }));
    },
  });

  // Toggle Admin Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      let resData: any;
      try {
        resData = (await apiClient.put(`/user/toggle/${userId}`)).data;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          resData = (await apiClient.post(`/user/toggle/${userId}`)).data;
        } else {
          throw err;
        }
      }
      return resData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleStatus = (userId: number) => {
    toggleMutation.mutate(userId);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Admin Management" showBack={true} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
          }
          renderItem={({ item }) => (
            <ReusableCard accentColor={themeColors.secondary}>
              <View style={styles.row}>
                <View style={styles.infoCol}>
                  <Text variant="titleMedium" style={styles.name}>
                    {item.fullName}
                  </Text>
                  <Text style={styles.mobile}>{item.mobileNumber}</Text>
                  
                  <View style={styles.badgeRow}>
                    <Badge
                      style={[
                        styles.statusBadge,
                        { backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2',
                          color: item.isActive ? themeColors.success : themeColors.error }
                      ]}
                    >
                      {item.isActive ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                  </View>
                </View>

                <View style={styles.switchCol}>
                  <Text style={styles.switchLabel}>Access</Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleStatus(item.userId)}
                    color={themeColors.primary}
                    disabled={toggleMutation.isPending}
                  />
                </View>
              </View>
            </ReusableCard>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="account-group"
              title="No Admins Found"
              description="There are no other admin profiles in the system."
              actionLabel="Invite Admin"
              onAction={() => navigation.navigate('InviteAdmin')}
            />
          }
        />
      )}

      <FAB
        icon="account-plus"
        label="Invite Admin"
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate('InviteAdmin')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 88,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontWeight: 'bold',
    color: themeColors.text,
  },
  mobile: {
    color: themeColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  email: {
    color: themeColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: themeColors.navyLight,
    color: themeColors.secondary,
    marginRight: 6,
    paddingHorizontal: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
  },
  switchCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 11,
    color: themeColors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
  },
});

export default AdminListScreen;
