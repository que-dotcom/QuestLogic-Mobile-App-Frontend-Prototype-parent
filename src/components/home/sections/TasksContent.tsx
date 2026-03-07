import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import type { CompletedTask } from '../../../types/home';
import { useTheme } from '../../../context/AppContext';
import { apiFetch } from '../../../lib/apiClient';

interface TasksContentProps {
  tasks: CompletedTask[];
  childName: string;
}

/** アコーディオン「今日の△△の終了タスク」の展開コンテンツ */
const TasksContent: React.FC<TasksContentProps> = ({ tasks }) => {
  const theme = useTheme();
  const [taskList, setTaskList] = useState<CompletedTask[]>(tasks);
  const [bonusTargetId, setBonusTargetId] = useState<string | null>(null);
  const [bonusInput, setBonusInput] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // tasks propsが変わったらtaskListも更新
  React.useEffect(() => {
    setTaskList(tasks);
  }, [tasks]);

  const handleBonusConfirm = async () => {
    if (!bonusTargetId) return;
    const points = parseInt(bonusInput, 10);
    if (isNaN(points) || points <= 0) {
      Alert.alert('入力エラー', '1以上の数値を入力してください。');
      return;
    }

    setIsSending(true);
    const targetId = bonusTargetId;
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        earnedPoints: number;
        earnedMinutes: number;
        currentPoints: number;
        currentMinutes: number;
        minutesPerPoint: number;
      }>(`/api/quests/${targetId}/bonus`, {
        method: 'POST',
        body: JSON.stringify({ bonusPoints: points }),
      });
      if (res.success) {
        setTaskList((prev) =>
          prev.map((t) =>
            t.id === targetId ? { ...t, earnedPoints: res.earnedPoints } : t,
          ),
        );
        Alert.alert('付与完了', res.message);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'エラーが発生しました。';
      Alert.alert('付与失敗', message);
    } finally {
      setIsSending(false);
      setBonusTargetId(null);
      setBonusInput('');
    }
  };

  const handleBonusCancel = () => {
    setBonusTargetId(null);
    setBonusInput('');
  };

  if (taskList.length === 0) {
    return (
      <View style={[styles.emptyRow, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>
          今日の終了タスクはまだありません
        </Text>
      </View>
    );
  }

  return (
    <>
      {taskList.map((task, index) => (
        <View
          key={task.id}
          style={[
            styles.row,
            { backgroundColor: theme.surface },
            index < taskList.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
          ]}
        >
          <Text style={[styles.taskText, { color: theme.text }]}>
            {task.child.name}：{task.earnedPoints}pt 獲得
          </Text>
          <TouchableOpacity
            onPress={() => setBonusTargetId(task.id)}
            style={[styles.bonusButton, { borderColor: theme.accent }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.bonusLabel, { color: theme.accent }]}>
              ボーナス付与
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ボーナスポイント入力モーダル */}
      <Modal
        visible={bonusTargetId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleBonusCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              ボーナスポイント付与
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.text }]}>
              付与するポイント数を入力してください
            </Text>
            <TextInput
              value={bonusInput}
              onChangeText={setBonusInput}
              keyboardType="number-pad"
              placeholder="例: 10"
              placeholderTextColor={theme.textSecondary}
              style={[styles.bonusInput, { color: theme.text, borderColor: theme.border }]}
              editable={!isSending}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleBonusCancel}
                style={[styles.modalButton, { borderColor: theme.border }]}
                activeOpacity={0.7}
                disabled={isSending}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  キャンセル
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBonusConfirm}
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: theme.accent }]}
                activeOpacity={0.7}
                disabled={isSending}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {isSending ? '付与中...' : '付与する'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  bonusButton: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  bonusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyRow: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
  // モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  bonusInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default TasksContent;
