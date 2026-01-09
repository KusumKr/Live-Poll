// Generate a unique tab ID that persists for this tab session
const getTabId = (): string => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

export const storage = {
  getStudentId: (): string | null => {
    const tabId = getTabId();
    return localStorage.getItem(`studentId_${tabId}`);
  },

  setStudentId: (id: string): void => {
    const tabId = getTabId();
    localStorage.setItem(`studentId_${tabId}`, id);
  },

  getStudentName: (): string | null => {
    const tabId = getTabId();
    return localStorage.getItem(`studentName_${tabId}`);
  },

  setStudentName: (name: string): void => {
    const tabId = getTabId();
    localStorage.setItem(`studentName_${tabId}`, name);
  },

  generateStudentId: (): string => {
    const tabId = getTabId();
    return `student_${tabId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};
