import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Send, User } from 'lucide-react';
import Button from '../../components/ui/Button';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChatUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      markMessagesAsRead(selectedUser.id);
    }
  }, [selectedUser]);

  const loadChatUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/marketplace/auth');
        return;
      }

      // Get all chat messages to/from the current user
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unique user IDs from messages
      const userIds = new Set([
        ...messages.map(m => m.sender_id),
        ...messages.map(m => m.receiver_id)
      ].filter(id => id !== user.id));

      // Get user details
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error('No session found');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-details`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds: Array.from(userIds) }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch user details');
      const { users: userDetails } = await response.json();

      // Process users with their last messages
      const chatUsers: ChatUser[] = userDetails.map((u: any) => {
        const userMessages = messages.filter(m => 
          m.sender_id === u.id || m.receiver_id === u.id
        );
        const lastMessage = userMessages[0];
        const unreadCount = userMessages.filter(m => 
          m.sender_id === u.id && !m.read
        ).length;

        return {
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          last_message: lastMessage?.content,
          last_message_time: lastMessage?.created_at,
          unread_count: unreadCount
        };
      });

      setUsers(chatUsers);
    } catch (err) {
      console.error('Error loading chat users:', err);
      setError('Failed to load chat users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update unread count in users list
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, unread_count: 0 } : u
      ));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
          read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedUser.id);
      loadChatUsers(); // Refresh user list to update last messages
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Marketplace
            </button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Masuk / Daftar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Users List */}
            <div className="border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pesan</h2>
              </div>

              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : users.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {users.map(user => (
                    <button
                      key={user.id}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user.unread_count ? (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                {user.unread_count}
                              </span>
                            ) : null}
                          </div>
                          {user.last_message && (
                            <p className="text-sm text-gray-500 truncate">
                              {user.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Belum ada percakapan
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col h-[calc(100vh-12rem)]">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{selectedUser.name}</p>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => {
                      const isSender = message.sender_id === selectedUser.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSender ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                              isSender
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isSender ? 'text-gray-500' : 'text-blue-100'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim()}
                        icon={<Send size={16} />}
                      >
                        Kirim
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Pilih percakapan untuk mulai chat
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;