import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { UPLOADS_URL } from '../services/config';

export default function ReportList() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null);

  const isCitizen = user?.role !== 'authority';

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    setLoading(true);
    try {
      // Citizens see their own reports, authorities see all
      const data = isCitizen 
        ? await api.reports.getMyReports() 
        : await api.reports.getAll();
      setReports(data.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      // Fallback: if /reports/my fails (e.g. old reports without reportedBy) 
      // fall back to all reports
      if (isCitizen) {
        try {
          const data = await api.reports.getAll();
          setReports(data.data || []);
        } catch (fallbackErr) {
          Alert.alert('Error', 'Connection failed: ' + fallbackErr.message);
        }
      } else {
        Alert.alert('Error', 'Connection failed: ' + err.message);
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.reports.updateStatus(id, newStatus);
      loadReports();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setUpdating(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'In Progress': return '#3b82f6';
      case 'Resolved': return '#10b981';
      default: return '#666';
    }
  };

  const renderFilterButton = (value, label) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderReport = ({ item }) => {
    const reportId = item._id || item.id;
    return (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { report: item })}
      activeOpacity={0.8}
    >
      {item.image ? (
        <Image
          source={{ uri: `${UPLOADS_URL}${item.image}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.noImagePlaceholder]}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title || 'Untitled'}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description || 'No description'}</Text>
        {item.location ? (
          <Text style={styles.locationText}>📍 {item.location}</Text>
        ) : null}
        {item.aiPrediction?.className && item.aiPrediction.className !== 'unknown' ? (
          <View style={styles.aiTag}>
            <Text style={styles.aiText}>
              🤖 AI: {item.aiPrediction.className} ({(item.aiPrediction.probability * 100).toFixed(0)}%)
            </Text>
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        
        {user?.role === 'authority' && (
          <View style={styles.actionButtons}>
            {updating === reportId ? (
              <ActivityIndicator size="small" color="#1a73e8" />
            ) : (
              <>
                {(item.status === 'Pending' || !item.status) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      updateStatus(reportId, 'In Progress');
                    }}
                  >
                    <Text style={styles.actionButtonText}>Start Progress</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'In Progress' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      updateStatus(reportId, 'Resolved');
                    }}
                  >
                    <Text style={styles.actionButtonText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('Pending', 'Pending')}
        {renderFilterButton('In Progress', 'In Progress')}
        {renderFilterButton('Resolved', 'Resolved')}
      </View>

      <Text style={styles.countText}>
        {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
        {isCitizen ? ' (your reports)' : ''}
      </Text>
      
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={item => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading reports...' : isCitizen ? 'You haven\'t submitted any reports yet.' : 'No reports found with this filter.'}
            </Text>
            {!loading && (
              <TouchableOpacity 
                style={styles.reportButton} 
                onPress={() => navigation.navigate('Report')}
              >
                <Text style={styles.reportButtonText}>
                  {isCitizen ? 'Create Your First Report' : 'Create First Report'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    gap: 8
  },
  countText: {
    padding: 10,
    color: '#666',
    fontSize: 12,
    textAlign: 'center'
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#e8e8e8',
    alignItems: 'center'
  },
  filterButtonActive: {
    backgroundColor: '#1a73e8'
  },
  filterText: {
    fontSize: 12,
    color: '#333'
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500'
  },
  listContent: {
    padding: 15
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardImage: {
    width: '100%',
    height: 150
  },
  noImagePlaceholder: {
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  noImageText: {
    color: '#999',
    fontSize: 14
  },
  cardContent: {
    padding: 15
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  aiTag: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10
  },
  aiText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '500'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  dateText: {
    color: '#999',
    fontSize: 12
  },
  actionButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    backgroundColor: '#666',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  reportButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
