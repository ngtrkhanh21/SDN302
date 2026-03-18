import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import courseService from '../../services/course-service';
import categoryService from '../../services/category-service';

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [courseData, catData] = await Promise.all([
        courseService.getCourses(),
        categoryService.getCategories(),
      ]);
      const courseList = courseData?.data || courseData || [];
      const catList = catData?.data || catData || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
      setCategories(Array.isArray(catList) ? catList : []);
    } catch (error) {
      console.warn('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = courses.filter(course => {
    const name = (course.name || course.title || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const courseCatId = course.category?._id || course.category_id;
    const matchCat = !selectedCategory || courseCatId === selectedCategory;
    return matchSearch && matchCat;
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('CourseDetail', { courseId: item._id || item.id })
      }
    >
      <Text style={styles.cardTitle}>{item.name || 'Unnamed course'}</Text>
      <Text style={styles.cardMeta}>
        {item.category?.name || item.category_id || 'Art for kids'}
      </Text>
      <Text style={styles.cardPrice}>
        {item.price != null ? `${item.price} VND` : 'Free'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let's draw something new</Text>

      <TextInput
        style={styles.search}
        placeholder="Search courses..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {/* Category filter chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={{ paddingVertical: 4, alignItems: 'center' }}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const cid = cat._id || cat.id;
            const active = selectedCategory === cid;
            return (
              <TouchableOpacity
                key={String(cid)}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(active ? null : cid)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name || 'Category'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#e17055" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No courses found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffeaa7',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e17055',
    marginBottom: 12,
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  categoryRow: {
    marginTop: 8,
    flexShrink: 0,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  chipActive: {
    backgroundColor: '#e17055',
    borderColor: '#e17055',
  },
  chipText: {
    fontSize: 11,
    color: '#636e72',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  cardMeta: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d63031',
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    color: '#636e72',
    marginTop: 32,
    fontSize: 15,
  },
});
