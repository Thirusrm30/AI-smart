import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function ReportForm({ navigation }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: ''
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. You can enter coordinates manually.');
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude.toFixed(6),
        longitude: location.coords.longitude.toFixed(6)
      }));
    } catch (err) {
      console.error('Location error:', err);
      setError('Could not get location. Please enter manually.');
    }
    setGettingLocation(false);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined
      };

      const result = await api.upload.uploadImageWithReport(image, reportData);
      console.log('Upload result:', result);

      setSuccess('Report submitted successfully!');

      setTimeout(() => {
        setSuccess('');
        setFormData({ title: '', description: '', location: '', latitude: '', longitude: '' });
        setImage(null);
        navigation.navigate('Reports');
      }, 2000);
    } catch (err) {
      console.error('Submit error:', err);
      let errorMessage = 'Failed to submit report';
      
      if (err.message.includes('Network request failed')) {
        errorMessage = 'Cannot connect to server. Check your internet connection.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Server not responding. Make sure backend is running.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Report a Civic Issue</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Text style={styles.label}>Title * (min 3 characters)</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(v) => handleChange('title', v)}
          placeholder="Brief title of the issue"
        />

        <Text style={styles.label}>Description * (min 10 characters)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(v) => handleChange('description', v)}
          placeholder="Describe the issue in detail"
          multiline
          numberOfLines={4}
        />
        <Text style={styles.charCount}>
          {formData.description.length}/10 minimum
        </Text>

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(v) => handleChange('location', v)}
          placeholder="Street address or area name"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={formData.latitude}
              onChangeText={(v) => handleChange('latitude', v)}
              placeholder="e.g., 13.0827"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={formData.longitude}
              onChangeText={(v) => handleChange('longitude', v)}
              placeholder="e.g., 80.2707"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={gettingLocation}>
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.locationButtonText}>📍 Get Current Location</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Image (for AI analysis)</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeButton} onPress={() => setImage(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {image ? 'Submit Report (with AI Analysis)' : 'Submit Report'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  form: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  halfInput: {
    flex: 1
  },
  locationButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  imageButtonText: {
    color: '#333',
    fontWeight: '500'
  },
  imagePreview: {
    marginBottom: 15
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  removeButton: {
    marginTop: 10,
    alignSelf: 'center'
  },
  removeText: {
    color: '#dc3545'
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  error: {
    color: '#dc3545',
    marginBottom: 15,
    textAlign: 'center'
  },
  success: {
    color: '#28a745',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
