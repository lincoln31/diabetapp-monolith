import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Icon, Screen } from '@/src/shared/components/ui';
import ScreenHeader from '@/src/shared/components/ui/ScreenHeader';
import { color, space, touch, type } from '@/src/shared/theme/tokens';
import { FAQS, GUIDES } from '../constants';

/** Guías y preguntas frecuentes (spec fase 10, RF-10.5): las preguntas empiezan plegadas. */
const GuidesScreen = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Screen
      header={<ScreenHeader title="Guías y FAQs" safeTop={false} />}
      contentStyle={styles.content}
    >
      {GUIDES.map((guide) => (
        <Card key={guide.title} padding="large" style={styles.card}>
          <Text style={styles.guideTitle} accessibilityRole="header">
            {guide.title}
          </Text>
          <Text style={styles.body}>{guide.body}</Text>
        </Card>
      ))}

      <Text style={styles.section} accessibilityRole="header">
        Preguntas frecuentes
      </Text>
      {FAQS.map((faq) => {
        const open = openId === faq.id;
        return (
          <Card key={faq.id} padding="large" style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : faq.id)}
              style={styles.question}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={color.textMuted} />
            </Pressable>
            {open ? <Text style={styles.answer}>{faq.answer}</Text> : null}
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: { rowGap: space.md },
  card: { rowGap: space.sm },
  guideTitle: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
  },
  body: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: color.text },
  section: {
    fontSize: type.heading.fontSize,
    lineHeight: type.heading.lineHeight,
    fontWeight: '700',
    color: color.text,
    marginTop: space.sm,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space.sm,
    minHeight: touch.min,
  },
  questionText: {
    flex: 1,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    fontWeight: '600',
    color: color.text,
  },
  answer: { fontSize: type.body.fontSize, lineHeight: type.body.lineHeight, color: color.text },
});

export default GuidesScreen;
