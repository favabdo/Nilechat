import { create } from 'zustand';
import { scheduledTasksApi } from '../services/scheduledTasks.service';

const useScheduledTasksStore = create((set, get) => ({
  tasks: [],
  loaded: false,
  modalOpen: false,
  modalMode: 'card', // 'card' | 'page'

  async loadTasks() {
    try {
      const tasks = await scheduledTasksApi.listAll();
      set({ tasks, loaded: true });
    } catch (err) {
      console.error('[API] loadScheduledTasksPage error:', err);
      throw err;
    }
  },

  openModal: (mode) => set({ modalOpen: true, modalMode: mode }),
  closeModal: () => set({ modalOpen: false }),

  async addTask(contactId, taskText, dueDate, customerName) {
    const data = await scheduledTasksApi.add(contactId, taskText, dueDate, customerName);
    set((state) => ({ tasks: [data.task, ...state.tasks] }));
    return data.task;
  },

  async endTask(taskId, contactId) {
    const data = await scheduledTasksApi.end(contactId, taskId);
    set((state) => ({ tasks: state.tasks.map((t) => (String(t.id) === String(taskId) ? data.task : t)) }));
  },

  openCount: () => get().tasks.filter((t) => t.status === 'open').length,
}));

export default useScheduledTasksStore;
