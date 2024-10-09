
import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';

const ExpenseChartScreen = ({ route }) => {
  const { expenses } = route.params;

  const categories = {
    Food: 0,
    Shopping: 0,
    Transport: 0,
    Bills: 0,
    Others: 0,
  };

  let totalAmount = 0;

  // Calculate total amount and distribute into categories
  expenses.forEach(expense => {
    const category = expense.category;
    const amount = parseFloat(expense.amount) || 0;
    categories[category] += amount;
    totalAmount += amount;
  });

  // Calculate percentage for each category
  const percentageData = Object.keys(categories).map((category) => {
    const percentage = totalAmount > 0 ? (categories[category] / totalAmount) * 100 : 0;
    return { category, percentage: percentage.toFixed(2) }; 
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Expense Breakdown by Category</Text>
      
      <View style={styles.summary}>
        <Text style={styles.total}>Total Expenses: ₹ {totalAmount.toFixed(2)}</Text>
      </View>

      {percentageData.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
      ))}

      <View style={styles.note}>
        <Text style={styles.noteText}>* Long press on an expense in the main list to delete it.</Text>
      </View>
    </ScrollView>
  );
};

export default ExpenseChartScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#004d40',
  },
  summary: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#b2dfdb',
    borderRadius: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004d40',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 6,
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796b',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796b',
  },
  note: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#ffe0b2',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#e65100',
    textAlign: 'center',
  },
});
