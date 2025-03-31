
// Storing self-destructing messages in localStorage with expiration
const SELF_DESTRUCT_KEY = 'secret-messages-self-destruct';

interface DestructMessage {
  id: string;
  viewed: boolean;
  createdAt: number;
}

export const storeDestructMessage = (messageId: string): void => {
  try {
    const stored = getDestructMessages();
    const newMessage: DestructMessage = {
      id: messageId,
      viewed: false,
      createdAt: Date.now()
    };
    
    stored.push(newMessage);
    localStorage.setItem(SELF_DESTRUCT_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Error storing self-destruct message:', error);
  }
};

export const getDestructMessages = (): DestructMessage[] => {
  try {
    const stored = localStorage.getItem(SELF_DESTRUCT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting self-destruct messages:', error);
    return [];
  }
};

export const markMessageAsViewed = (messageId: string): boolean => {
  try {
    const stored = getDestructMessages();
    const message = stored.find(msg => msg.id === messageId);
    
    if (message) {
      if (message.viewed) {
        // Message was already viewed
        return true;
      }
      
      message.viewed = true;
      localStorage.setItem(SELF_DESTRUCT_KEY, JSON.stringify(stored));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking message as viewed:', error);
    return false;
  }
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

export const isMessageViewed = (messageId: string): boolean => {
  try {
    const stored = getDestructMessages();
    const message = stored.find(msg => msg.id === messageId);
    return message ? message.viewed : false;
  } catch (error) {
    console.error('Error checking if message was viewed:', error);
    return false;
  }
};
