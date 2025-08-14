import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type DropdownProps<T extends string> = {
  value: T | null; // ✅ allow null
  options: readonly T[];
  onSelect: (val: T) => void;
  labelFormatter?: (val: T | null) => string; // ✅ allow null
};

export function Dropdown<T extends string>({
  value,
  options,
  onSelect,
  labelFormatter = (v: T | null) => (v ?? 'Select')
  }: DropdownProps<T>) {
    const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.triggerText}>
          {labelFormatter(value)} ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.option}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{labelFormatter(opt)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  triggerText: {
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    paddingVertical: 4,
  },
  option: {
    padding: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#222',
  },
});
