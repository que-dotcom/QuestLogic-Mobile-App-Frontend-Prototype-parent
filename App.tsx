import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';
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

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={NAV_THEME}>
          <StatusBar style="auto" />
          <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              /**
               * position: 'absolute' により、タブバーが画面コンテンツの
               * 上に浮いてオーバーレイ表示される。
               * 各画面の ScrollView には paddingBottom を設定し、
               * 最下部コンテンツがタブバーで隠れないようにする。
               */
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

        {/*
         * ネットワークエラーオーバーレイ。
         * AppProvider の内側 / NavigationContainer の外側に配置することで
         * ナビゲーション・タブバーを含む全要素の上に表示される。
         */}
        <NetworkErrorOverlay />
      </SafeAreaProvider>
    </AppProvider>
  );
}
