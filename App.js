import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Tracker from './Tracker';
import ExpenseChartScreen from './ExpenseChartScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Tracker">
        <Stack.Screen 
          name="Tracker" 
          component={Tracker} 
          options={{ title: 'Expense Tracker' }}
        />
        <Stack.Screen 
          name="Expense Chart" 
          component={ExpenseChartScreen} 
          options={{ title: 'Expense Distribution' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
