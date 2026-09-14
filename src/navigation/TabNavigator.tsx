import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ProjectsScreen from '../screens/ProjectsScreen';
import FilesScreen from '../screens/FilesScreen';
import EditorScreen from '../screens/EditorScreen';
import BuildsScreen from '../screens/BuildsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function tabIcon(name: string, color: string, size: number) {
  return <Ionicons name={name} size={size} color={color} />;
}

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
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'folder' : 'folder-outline', color, size),
        }}
      />
      <Tab.Screen
        name="FilesTab"
        component={FilesScreen}
        options={{
          title: 'Files',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'document-text' : 'document-text-outline', color, size),
        }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{
          title: 'Editor',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'create' : 'create-outline', color, size),
        }}
      />
      <Tab.Screen
        name="BuildsTab"
        component={BuildsScreen}
        options={{
          title: 'Builds',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'hammer' : 'hammer-outline', color, size),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'settings' : 'settings-outline', color, size),
        }}
      />
    </Tab.Navigator>
  );
}
