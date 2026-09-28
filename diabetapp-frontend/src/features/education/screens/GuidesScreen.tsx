import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, Icon } from '@/src/shared/components/ui';
import { COLORS } from '@/src/shared/theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import { FAQS, GUIDES } from '../constants';

/** Guías y preguntas frecuentes (spec fase 10, RF-10.5): las preguntas empiezan plegadas. */
const GuidesScreen = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Guías y FAQs" />
      <ScrollView contentContainerStyle={styles.content}>
        {GUIDES.map((guide) => (
          <Card key={guide.title} padding="large" style={styles.card}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.body}>{guide.body}</Text>
          </Card>
        ))}

        <Text style={styles.section}>Preguntas frecuentes</Text>
        {FAQS.map((faq) => {
          const open = openId === faq.id;
          return (
            <Card key={faq.id} padding="large" style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenId(open ? null : faq.id)}
                style={styles.question}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Icon
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.gray[500]}
                />
              </TouchableOpacity>
              {open && <Text style={styles.answer}>{faq.answer}</Text>}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 4 },
  card: { marginBottom: 12 },
  guideTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900], marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 20, color: COLORS.gray[700] },
  section: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[800], marginVertical: 8 },
  question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginRight: 8,
  },
  answer: { fontSize: 14, lineHeight: 20, color: COLORS.gray[700], marginTop: 10 },
});

export default GuidesScreen;
