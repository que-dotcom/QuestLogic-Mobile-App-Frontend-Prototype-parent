import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CompletedTask } from '../../../types/home';
import { useTheme } from '../../../context/AppContext';

interface TasksContentProps {
  tasks: CompletedTask[];
  childName: string;
}

/** アコーディオン「今日の△△の終了タスク」の展開コンテンツ */
const TasksContent: React.FC<TasksContentProps> = ({ tasks }) => {
  const theme = useTheme();

  if (tasks.length === 0) {
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
      {tasks.map((task, index) => (
        <View
          key={task.id}
          style={[
            styles.row,
            { backgroundColor: theme.surface },
            index < tasks.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
          ]}
        >
          <Text style={[styles.taskText, { color: theme.text }]}>
            {task.child.name}：{task.earnedPoints}pt 獲得
          </Text>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  taskText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyRow: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
});

export default TasksContent;
