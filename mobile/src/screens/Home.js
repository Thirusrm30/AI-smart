import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { UPLOADS_URL } from '../services/config';

export default function Home({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    setError('');
    try {
      const data = await api.reports.getAll();
      const reportList = (data && data.data) ? data.data : [];
      setReports(reportList);
      calculateStats(reportList);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load reports. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (reportList) => {
    setStats({
      total: reportList.length,
      pending: reportList.filter(r => r.status === 'Pending').length,
      inProgress: reportList.filter(r => r.status === 'In Progress').length,
      resolved: reportList.filter(r => r.status === 'Resolved').length
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'In Progress': return '#3b82f6';
      case 'Resolved': return '#10b981';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.name || 'User'}!</Text>
          <Text style={styles.subText}>Report and track civic issues</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadReports}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.statsGrid}>
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

      <Text style={styles.sectionTitle}>Recent Reports</Text>
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reports yet</Text>
          <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('Report')}>
            <Text style={styles.reportButtonText}>Create First Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        reports.slice(0, 6).map(report => (
          <View key={report._id} style={styles.reportCard}>
            {report.image && (
              <Image
                source={{ uri: `${UPLOADS_URL}${report.image}` }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{report.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>{report.description}</Text>
              {report.aiPrediction?.className && (
                <View style={styles.aiTag}>
                  <Text style={styles.aiText}>
                    AI: {report.aiPrediction.className}
                  </Text>
                </View>
              )}
              <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                  <Text style={styles.statusText}>{report.status}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
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
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorText: {
    color: '#dc3545',
    flex: 1
  },
  retryText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    marginLeft: 10
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff'
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  logoutText: {
    color: '#fff',
    fontWeight: '500'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 15,
    marginBottom: 10,
    color: '#333'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15
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
  },
  reportCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
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
    marginBottom: 10
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
  }
});
