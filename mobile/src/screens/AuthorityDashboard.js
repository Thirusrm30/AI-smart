import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { UPLOADS_URL } from '../services/config';

export default function AuthorityDashboard() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.reports.getAll();
      setReports(data.data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      Alert.alert('Error', 'Failed to load reports: ' + err.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  const getStats = () => {
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'Pending').length,
      inProgress: reports.filter(r => r.status === 'In Progress').length,
      resolved: reports.filter(r => r.status === 'Resolved').length
    };
  };

  const stats = getStats();

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.reports.updateStatus(id, newStatus);
      loadReports();
      Alert.alert('Success', `Report marked as "${newStatus}"`);
    } catch (err) {
      console.error('Failed to update status:', err);
      Alert.alert('Error', 'Failed to update status');
    }
    setUpdating(null);
  };

  const openReportDetails = (report) => {
    setSelectedReport(report);
    setResolutionNote('');
    setModalVisible(true);
  };

  const renderFilterButton = (value, label, count) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterCount]}>{count}</Text>
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderReport = ({ item }) => {
    const isUpdatingThis = updating === (item._id || item.id);
    
    return (
      <View style={styles.reportCard}>
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
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
            </View>
          </View>
          
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          
          {item.location ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          ) : null}
          
          {item.aiPrediction?.className ? (
            <View style={styles.aiTag}>
              <Text style={styles.aiText}>
                🤖 AI: {item.aiPrediction.className} ({(item.aiPrediction.probability * 100).toFixed(0)}%)
              </Text>
            </View>
          ) : null}
          
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>📅 {formatDate(item.createdAt)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => openReportDetails(item)}
          >
            <Text style={styles.detailsButtonText}>View Details & Manage</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No Reports Yet' : `No ${filter} Reports`}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'all' 
          ? 'Citizen reports will appear here for review'
          : 'All reports in this category have been handled'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Authority Dashboard</Text>
          <Text style={styles.subText}>Manage & Resolve Civic Issues</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#1a73e8' }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Text style={styles.statNumber}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', stats.total)}
        {renderFilterButton('Pending', 'Pending', stats.pending)}
        {renderFilterButton('In Progress', 'In Progress', stats.inProgress)}
        {renderFilterButton('Resolved', 'Resolved', stats.resolved)}
      </View>
      
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={item => item._id || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Report Details</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedReport.image && (
                  <Image
                    source={{ uri: `${UPLOADS_URL}${selectedReport.image}` }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                )}
                
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedReport.title}</Text>
                  
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedReport.description}</Text>
                  
                  {selectedReport.location && (
                    <>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{selectedReport.location}</Text>
                    </>
                  )}
                  
                  {selectedReport.latitude && selectedReport.longitude && (
                    <>
                      <Text style={styles.detailLabel}>Coordinates</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.latitude}, {selectedReport.longitude}
                      </Text>
                    </>
                  )}
                  
                  {selectedReport.aiPrediction?.className && (
                    <>
                      <Text style={styles.detailLabel}>AI Classification</Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.aiPrediction.className} 
                        ({(selectedReport.aiPrediction.probability * 100).toFixed(0)}% confidence)
                      </Text>
                    </>
                  )}
                  
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                    <Text style={styles.modalStatusText}>{selectedReport.status}</Text>
                  </View>
                  
                  <Text style={styles.detailLabel}>Reported On</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedReport.createdAt)}</Text>

                  <Text style={styles.detailLabel}>Actions</Text>
                  <View style={styles.actionButtons}>
                    {selectedReport.status === 'Pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.startBtn]}
                        onPress={() => {
                          handleStatusUpdate(selectedReport._id || selectedReport.id, 'In Progress');
                          setModalVisible(false);
                        }}
                      >
                        <Text style={styles.actionBtnText}>▶ Start Working</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedReport.status === 'In Progress' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.resolveBtn]}
                        onPress={() => {
                          handleStatusUpdate(selectedReport._id || selectedReport.id, 'Resolved');
                          setModalVisible(false);
                        }}
                      >
                        <Text style={styles.actionBtnText}>✓ Mark Resolved</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedReport.status === 'Resolved' && (
                      <View style={styles.resolvedBanner}>
                        <Text style={styles.resolvedText}>✓ This issue has been resolved</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5'
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  },
  header: {
    backgroundColor: '#dc3545',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 8
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  filterButtonActive: {
    backgroundColor: '#dc3545'
  },
  filterCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  filterText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  },
  filterTextActive: {
    color: '#fff'
  },
  listContent: {
    padding: 15,
    paddingTop: 0
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoIcon: {
    fontSize: 12,
    marginRight: 6
  },
  infoText: {
    fontSize: 12,
    color: '#666'
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
  dateRow: {
    marginBottom: 10
  },
  dateText: {
    fontSize: 12,
    color: '#999'
  },
  detailsButton: {
    backgroundColor: '#f0f2f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  detailsButtonText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 14
  },
  emptyState: {
    alignItems: 'center',
    padding: 60
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666'
  },
  modalImage: {
    width: '100%',
    height: 200
  },
  modalBody: {
    padding: 20
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  detailValue: {
    fontSize: 16,
    color: '#333'
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 5
  },
  modalStatusText: {
    color: '#fff',
    fontWeight: '600'
  },
  actionButtons: {
    marginTop: 10,
    gap: 10
  },
  actionBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  startBtn: {
    backgroundColor: '#3b82f6'
  },
  progressBtn: {
    backgroundColor: '#3b82f6'
  },
  resolveBtn: {
    backgroundColor: '#10b981'
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  resolvedBanner: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  resolvedText: {
    color: '#155724',
    fontWeight: '600',
    fontSize: 16
  }
});
