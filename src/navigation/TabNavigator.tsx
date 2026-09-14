import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ProjectsScreen from '../screens/ProjectsScreen';
import FilesScreen from '../screens/FilesScreen';
import EditorScreen from '../screens/EditorScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <Tab.Screen
        name="FilesTab"
        component={FilesScreen}
        options={{ title: 'Files' }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{ title: 'Editor' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
