import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AppProvider, useAppContext } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';
import LoginScreen from './src/screens/LoginScreen';
import CustomTabBar from './src/components/common/CustomTabBar';
import NetworkErrorOverlay from './src/components/common/NetworkErrorOverlay';

export type RootTabParamList = {
  Home: undefined;
  Chat: undefined;
  Setting: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * NavigationContainer のテーマをカスタマイズ。
 * background を transparent にすることで、各画面の SafeAreaView が
 * 背景色を持ち、React Navigation が余分な色を描画しないようにする。
 * これにより下部に謎の紺色帯が出現するのを防ぐ。
 */
const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    border: 'transparent',
  },
};

/**
 * 認証状態に応じてログイン画面またはメインアプリを表示するルートコンポーネント。
 * AppProvider の内側に置くことで useTheme() が使用できる。
 */
function RootNavigator() {
  const { isAuthenticated, isLoading, userInfo } = useAuth();
  const { setUserName } = useAppContext();

  // アプリ起動時に SecureStore から復元したユーザー名を AppContext に反映
  useEffect(() => {
    if (userInfo?.name) setUserName(userInfo.name);
  }, [userInfo?.name]);

  // SecureStore の読み込み中はスピナーを表示
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FC2865" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <NavigationContainer theme={NAV_THEME}>
        <StatusBar style="auto" />
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
            },
          }}
          initialRouteName="Home"
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Setting" component={SettingScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <NetworkErrorOverlay />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </AppProvider>
    </AuthProvider>
  );
}
