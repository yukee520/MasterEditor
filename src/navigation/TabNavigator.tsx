import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import ProjectsScreen from '../screens/ProjectsScreen';
import FilesScreen from '../screens/FilesScreen';
import EditorScreen from '../screens/EditorScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

type IconName = string;

function tabIcon(
  name: IconName,
  focused: boolean,
  color: string,
  size: number,
) {
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
          fontSize: 11,
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
            tabIcon(focused ? 'folder' : 'folder-outline', focused, color, size),
        }}
      />
      <Tab.Screen
        name="FilesTab"
        component={FilesScreen}
        options={{
          title: 'Files',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'document-text' : 'document-text-outline', focused, color, size),
        }}
      />
      <Tab.Screen
        name="EditorTab"
        component={EditorScreen}
        options={{
          title: 'Editor',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'create' : 'create-outline', focused, color, size),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused ? 'settings' : 'settings-outline', focused, color, size),
        }}
      />
    </Tab.Navigator>
  );
}
