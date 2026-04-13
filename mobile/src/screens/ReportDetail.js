import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import { UPLOADS_URL } from '../services/config';

export default function ReportDetail({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const [report, setReport] = useState(route.params?.report);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'In Progress': return '#3b82f6';
      case 'Resolved': return '#10b981';
      default: return '#666';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Pending': return '#fef3c7';
      case 'In Progress': return '#dbeafe';
      case 'Resolved': return '#d1fae5';
      default: return '#f3f4f6';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.reports.delete(report._id || report.id);
              Alert.alert('Deleted', 'Report has been deleted successfully.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete report: ' + err.message);
            }
            setDeleting(false);
          }
        }
      ]
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.reports.updateStatus(report._id || report.id, newStatus);
      setReport({ ...report, status: newStatus });
      Alert.alert('Updated', `Report marked as "${newStatus}"`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update status: ' + err.message);
    }
    setUpdating(false);
  };

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorMessage}>Report not found</Text>
      </View>
    );
  }

  const isOwner = user && report.reportedBy && (report.reportedBy === user._id || report.reportedBy === user.id);
  const isAuthority = user?.role === 'authority';

  return (
    <ScrollView style={styles.container}>
      {report.image ? (
        <Image
          source={{ uri: `${UPLOADS_URL}${report.image}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.noImagePlaceholder]}>
          <Text style={styles.noImageText}>📷 No Image Attached</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusContainer, { backgroundColor: getStatusBg(report.status) }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
          <Text style={[styles.statusLabel, { color: getStatusColor(report.status) }]}>
            {report.status || 'Pending'}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{report.title || 'Untitled Report'}</Text>

        {/* Date */}
        <Text style={styles.date}>📅 {formatDate(report.createdAt)}</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{report.description || 'No description provided.'}</Text>
        </View>

        {/* Location */}
        {report.location ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationBox}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{report.location}</Text>
            </View>
          </View>
        ) : null}

        {/* Coordinates */}
        {report.latitude && report.longitude ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coordinates</Text>
            <Text style={styles.coordText}>
              Lat: {report.latitude}, Lng: {report.longitude}
            </Text>
          </View>
        ) : null}

        {/* AI Prediction */}
        {report.aiPrediction?.className && report.aiPrediction.className !== 'unknown' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Classification</Text>
            <View style={styles.aiBox}>
              <Text style={styles.aiEmoji}>🤖</Text>
              <View style={styles.aiContent}>
                <Text style={styles.aiClassName}>{report.aiPrediction.className}</Text>
                <Text style={styles.aiProb}>
                  {(report.aiPrediction.probability * 100).toFixed(0)}% confidence
                </Text>
              </View>
            </View>
            {report.aiPrediction.allPredictions?.length > 1 && (
              <View style={styles.allPredictions}>
                {report.aiPrediction.allPredictions.slice(1).map((p, i) => (
                  <Text key={i} style={styles.altPrediction}>
                    • {p.className} ({(p.probability * 100).toFixed(0)}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Authority Action Buttons */}
        {isAuthority && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Authority Actions</Text>
            {updating ? (
              <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 10 }} />
            ) : (
              <View style={styles.actionButtons}>
                {(report.status === 'Pending' || !report.status) && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleStatusUpdate('In Progress')}
                  >
                    <Text style={styles.actionBtnText}>▶ Start Working</Text>
                  </TouchableOpacity>
                )}
                {report.status === 'In Progress' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => handleStatusUpdate('Resolved')}
                  >
                    <Text style={styles.actionBtnText}>✓ Mark Resolved</Text>
                  </TouchableOpacity>
                )}
                {report.status === 'Resolved' && (
                  <View style={styles.resolvedBanner}>
                    <Text style={styles.resolvedText}>✓ This issue has been resolved</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Delete Button (owner or authority) */}
        {(isOwner || isAuthority) && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑 Delete Report</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorMessage: {
    fontSize: 16,
    color: '#666'
  },
  image: {
    width: '100%',
    height: 250
  },
  noImagePlaceholder: {
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  noImageText: {
    fontSize: 16,
    color: '#999'
  },
  content: {
    padding: 20
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  statusLabel: {
    fontWeight: '600',
    fontSize: 13
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 10
  },
  locationText: {
    fontSize: 15,
    color: '#333',
    flex: 1
  },
  coordText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace'
  },
  aiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 14,
    borderRadius: 10
  },
  aiEmoji: {
    fontSize: 28,
    marginRight: 12
  },
  aiContent: {
    flex: 1
  },
  aiClassName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    textTransform: 'capitalize'
  },
  aiProb: {
    fontSize: 13,
    color: '#388e3c',
    marginTop: 2
  },
  allPredictions: {
    marginTop: 10,
    paddingLeft: 8
  },
  altPrediction: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  actionButtons: {
    gap: 10
  },
  actionBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  resolvedBanner: {
    backgroundColor: '#d1fae5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  resolvedText: {
    color: '#065f46',
    fontWeight: '600',
    fontSize: 16
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
