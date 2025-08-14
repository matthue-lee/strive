// PillModal.tsx
import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';

type PillModalProps = {
  visible: boolean;
  color: string;              // activity color (outline + primary button)
  title: string;              // activity label
  completed: boolean;         // current completion state
  onToggleComplete: () => void;
  onDelete: () => void;
  onClose: () => void;
  onEdit?: () => void;        // optional: show "Change activity" if provided
  deleteColor?: string;       // optional: destructive color, defaults to Imperial Red
};

function PillModal({
  visible,
  color,
  title,
  completed,
  onToggleComplete,
  onDelete,
  onClose,
  onEdit,
  deleteColor = '#f94144', // Imperial red
}: PillModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.backdrop}>
        {/* Backdrop click to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Dialog card */}
        <View style={[styles.card, { borderColor: color }]}>
          <Text style={[styles.title, { color }]} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: color }]}
              onPress={onToggleComplete}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>
                {completed ? 'Mark as not done' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity style={styles.outlineBtn} onPress={onEdit} activeOpacity={0.8}>
                <Text style={styles.outlineBtnText}>Change activity</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.outlineDangerBtn, { borderColor: deleteColor }]}
              onPress={onDelete}
              activeOpacity={0.8}
            >
              <Text style={[styles.outlineDangerText, { color: deleteColor }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(PillModal);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '90%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2, // colored outline
    paddingVertical: 16,
    paddingHorizontal: 14,
    // soft shadow
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttons: {
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  outlineBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  outlineBtnText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  outlineDangerBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5, // slightly bolder
    backgroundColor: 'transparent',
  },
  outlineDangerText: {
    fontWeight: '700',
    fontSize: 15,
  },
  ghostBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
});
