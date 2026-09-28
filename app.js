import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'expenses_v1';
const CATEGORIES = ['Food', 'Travel', 'Bills', 'Fun', 'Other'];
const COLORS = {
  Food: '#FFC978',
  Travel: '#8FB6E8',
  Bills: '#F28B82',
  Fun: '#B39DDB',
  Other: '#81C7A9',
};

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [error, setError] = useState('');

  // Load saved expenses once when the app opens
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setExpenses(JSON.parse(saved));
      } catch (e) {
        // ignore read errors, start empty
      }
      setLoaded(true);
    })();
  }, []);

  // Save whenever the list changes (after the first load)
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)).catch(() => {});
    }
  }, [expenses, loaded]);

  const addExpense = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    setError('');
    const item = {
      id: Date.now().toString(),
      title: title.trim() || category,
      amount: value,
      category,
    };
    setExpenses([item, ...expenses]);
    setTitle('');
    setAmount('');
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = CATEGORIES.map((c) => ({
    name: c,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.value > 0);
  const maxValue = Math.max(...byCategory.map((c) => c.value), 1);

  const header = (
    <View>
      <Text style={styles.eyebrow}>This is what you've spent</Text>
      <Text style={styles.total}>₹{total.toFixed(2)}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="What was it for? (optional)"
          placeholderTextColor="rgba(238,243,251,0.4)"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (₹)"
          placeholderTextColor="rgba(238,243,251,0.4)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.chip,
                category === c && { backgroundColor: COLORS[c], borderColor: COLORS[c] },
              ]}
            >
              <Text style={[styles.chipText, category === c && { color: '#0f1b3d' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.addButton} onPress={addExpense}>
          <Text style={styles.addButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>

      {byCategory.length > 0 && (
        <View style={styles.chart}>
          <Text style={styles.sectionTitle}>By category</Text>
          {byCategory.map((c) => (
            <View key={c.name} style={styles.barRow}>
              <Text style={styles.barLabel}>{c.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(c.value / maxValue) * 100}%`, backgroundColor: COLORS[c.name] },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>₹{c.value.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>No expenses yet. Add your first one above.</Text>}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.dot, { backgroundColor: COLORS[item.category] }]} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
            <Text style={styles.itemAmount}>₹{item.amount.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1b3d' },
  content: { paddingTop: 64, paddingHorizontal: 22, paddingBottom: 40 },
  eyebrow: { fontSize: 13, color: 'rgba(238,243,251,0.55)' },
  total: { fontSize: 46, fontWeight: '700', color: '#fff', marginTop: 2, marginBottom: 24 },
  form: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16 },
  input: {
    color: '#fff',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238,243,251,0.25)',
    paddingVertical: 8,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(238,243,251,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: '#eef3fb', fontSize: 13 },
  error: { color: '#ffc9b8', fontSize: 13, marginBottom: 8 },
  addButton: {
    backgroundColor: '#FFC978',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: { color: '#0f1b3d', fontWeight: '700', fontSize: 15 },
  chart: { marginTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { width: 60, color: 'rgba(238,243,251,0.7)', fontSize: 13 },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: 10, borderRadius: 5 },
  barValue: { width: 64, textAlign: 'right', color: '#fff', fontSize: 13 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(238,243,251,0.1)',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTitle: { color: '#fff', fontSize: 15 },
  itemCategory: { color: 'rgba(238,243,251,0.5)', fontSize: 12, marginTop: 2 },
  itemAmount: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteButton: { paddingLeft: 14, paddingVertical: 4 },
  deleteText: { color: 'rgba(238,243,251,0.5)', fontSize: 16 },
  empty: { color: 'rgba(238,243,251,0.45)', textAlign: 'center', marginTop: 20 },
});
