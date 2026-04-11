# AI Smart Civic Mobile

A React Native mobile application for reporting and tracking civic issues with AI-powered image classification.

## Tech Stack

- **Expo SDK 52** - Development framework
- **React Native** - Cross-platform mobile framework
- **React Navigation** - Navigation library
  - @react-navigation/native
  - @react-navigation/native-stack
  - @react-navigation/bottom-tabs
- **AsyncStorage** - Local data persistence
- **Expo Image Picker** - Camera and gallery access

## Features

- User authentication (Login/Register)
- Dashboard with report statistics
- Report civic issues with image upload
- AI-powered image analysis
- View all reports with filtering
- Authority role for status updates
- Pull-to-refresh functionality

## Setup

1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on device/emulator:
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── App.js                    # Main app entry
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── babel.config.js           # Babel configuration
└── src/
    ├── context/
    │   └── AuthContext.js    # Authentication state
    ├── navigation/
    │   └── AppNavigator.js   # Navigation setup
    ├── screens/
    │   ├── Home.js           # Dashboard screen
    │   ├── Login.js          # Login screen
    │   ├── Register.js        # Register screen
    │   ├── ReportForm.js      # Create report screen
    │   └── ReportList.js      # View reports screen
    └── services/
        └── api.js            # API integration
```

## API Connection

Update the API_URL in `src/services/api.js` to point to your backend server:

```javascript
const API_URL = 'http://localhost:5000'; // Change to your server URL
```
