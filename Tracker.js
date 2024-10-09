import React, {useState, useEffect} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Button,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import SmsAndroid from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();


  const categories = {
    Food: [
      'restaurant',
      'food',
      'dinner',
      'lunch',
      'breakfast',
      'cafe',
      'uber eats',
      'swiggy',
      'zomato',
    ],
    Shopping: ['amazon', 'flipkart', 'ebay', 'shopping', 'store', 'mall'],
    Transport: [
      'uber',
      'ola',
      'metro',
      'taxi',
      'bus',
      'train',
      'flight',
      'transport',
    ],
    Bills: ['electricity', 'water', 'internet', 'bill', 'utility'],
    Others: [],
  };

  // Request SMS permission on component mount
  useEffect(() => {
    requestSmsPermission();
    loadExpensesFromStorage();
  }, []);

  // Poll for new SMS every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchSms(); // Fetch SMS periodically
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  // Function to request SMS permissions
  async function requestSmsPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message:
            'This app needs access to your SMS messages to track expenses.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('SMS permission granted');
        fetchSms(); // Fetch SMS after permission granted
      } else {
        console.log('SMS permission denied');
        Alert.alert('Permission denied', 'Unable to read SMS messages.');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  // Load expenses from AsyncStorage on mount
  const loadExpensesFromStorage = async () => {
    try {
      // (this helps in clearing duplicates)
      await AsyncStorage.clear();

      const storedExpenses = await AsyncStorage.getItem('@expenses');
      if (storedExpenses !== null) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (e) {
      console.error('Failed to load expenses.', e);
    }
  };

  // Save expenses to AsyncStorage whenever expenses change
  useEffect(() => {
    saveExpensesToStorage(expenses);
  }, [expenses]);

  const saveExpensesToStorage = async expensesToSave => {
    try {
      await AsyncStorage.setItem('@expenses', JSON.stringify(expensesToSave));
    } catch (e) {
      console.error('Failed to save expenses.', e);
    }
  };

  // Fetch and filter SMS messages related to expenses
  const fetchSms = () => {
    SmsAndroid.list(
      JSON.stringify({
        box: 'inbox',
        maxCount: 1000,
      }),
      fail => {
        console.log('Failed with this error: ' + fail);
      },
      (count, smsList) => {
        const messages = JSON.parse(smsList);
        const expenseMessages = messages
          .map(extractExpenseInfo)
          .filter(expense => expense.amount); // Only keep valid expenses

        // Avoid duplicates by checking existing descriptions and dates
        const uniqueExpenses = expenseMessages.filter(
          newExp => !expenses.some(exp => exp.id === newExp.id), // Now comparing using unique `id`
        );

        if (uniqueExpenses.length > 0) {
          setExpenses(prevExpenses => [...uniqueExpenses, ...prevExpenses]);
        }
      },
    );
  };

  // Function to extract expense-related information from SMS
  const extractExpenseInfo = sms => {
    const expensePattern = /(?:INR|₹)\s*([\d,]+\.\d{2})/i;
    const amountMatch = sms.body.match(expensePattern);

    const datePattern = /(\d{2}\/\d{2}\/\d{4})/; // Example pattern
    const dateMatch = sms.body.match(datePattern);

    const amount = amountMatch ? amountMatch[1].replace(/,/g, '') : null;
    const date = dateMatch
      ? dateMatch[1]
      : new Date(sms.date).toLocaleDateString();
    const description = sms.body;
    const category = categorizeExpense(description);

    // Generate a unique ID for each SMS based on thread_id and sms id
    const id = `${sms.thread_id || 'thread'}-${sms.id || 'sms'}`;

    return {
      id, // Use this unique identifier to filter duplicates
      amount: amount,
      date: date,
      description: description,
      category: category,
    };
  };

  // Function to categorize expense based on description keywords
  const categorizeExpense = description => {
    const lowerDesc = description.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }
    return 'Others';
  };

  // Function to delete an expense
  const deleteExpense = id => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            setExpenses(expenses.filter(exp => exp.id !== id));
          },
        },
      ],
    );
  };

  // Function to search expenses
  const searchExpenses = text => {
    setSearchText(text);
  };

  const filteredExpenses = expenses.filter(exp => {
    const description = exp.description ? exp.description.toLowerCase() : '';
    const category = exp.category ? exp.category.toLowerCase() : '';
    const amount = exp.amount ? exp.amount.toString() : '';
    const date = exp.date ? exp.date.toString() : '';

    return (
      description.includes(searchText.toLowerCase()) ||
      category.includes(searchText.toLowerCase()) ||
      amount.includes(searchText) ||
      date.includes(searchText)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="View All Expenses" onPress={fetchSms} />
      </View>

      <TextInput
        style={styles.searchBar}
        placeholderTextColor={"#00796b"}
        placeholder="Search expenses..."
        value={searchText}
        onChangeText={searchExpenses}
      />

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item, index) =>
          item.id ? `${item.id}-${index}` : index.toString()
        }
        renderItem={({item}) => (
          <TouchableOpacity onLongPress={() => deleteExpense(item.id)}>
            <View style={styles.expenseItem}>
              <Text style={styles.amount}>₹ {item.amount}</Text>
              <View style={styles.details}>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses found.</Text>
        }
      />

      <View style={styles.buttonContainer}>
        <Button
          title="View Expense Distribution"
          onPress={() => navigation.navigate('Expense Chart', {expenses})}
        />
      </View>
    </View>
  );
};

export default Tracker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00796b',
    marginRight: 16,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#004d40',
  },
  date: {
    fontSize: 12,
    color: '#00796b',
  },
  category: {
    fontSize: 12,
    color: '#00796b',
    fontStyle: 'italic',
  },
  searchBar: {
    height: 40,
    borderColor: '#00796b',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    color:'#00796b',
    backgroundColor:'#e0f7fa'
  },
  emptyText: {
    textAlign: 'center',
    color: '#00796b',
    fontSize: 16,
    marginVertical: 20,
  },
});
