import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const MessagesPage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const startUserId = searchParams.get('to');

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations);
      return data.conversations;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId) => {
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/conversations/${conversationId}/messages`, {
        params: { page: 1, limit: 50 },
      });
      setMessages(data.messages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const convos = await fetchConversations();

      if (startUserId) {
        try {
          const { data } = await api.post('/conversations', { userId: Number(startUserId) });
          setActiveId(data.conversation.id);
          setSearchParams({});
          return;
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to start conversation');
        }
      }

      if (convos.length > 0) {
        setActiveId((prev) => prev ?? convos[0].id);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/conversations/${activeId}/messages`, { content: draft.trim() });
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <div className="mx-auto mt-6 max-w-4xl px-4">
        <div className="flex h-[70vh] overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="w-1/3 overflow-y-auto border-r border-gray-100">
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">Messages</h2>
            {loadingConversations ? (
              <p className="px-4 py-4 text-sm text-gray-500">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-500">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${
                    activeId === c.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-linkedin">
                    {c.otherUser?.profilePicture ? (
                      <img
                        src={getAssetUrl(c.otherUser.profilePicture)}
                        alt={c.otherUser.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      c.otherUser?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{c.otherUser?.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {c.lastMessage ? c.lastMessage.content : 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex w-2/3 flex-col">
            {!activeConversation ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-gray-500">Select a conversation to start messaging.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{activeConversation.otherUser?.name}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {loadingMessages ? (
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {messages.map((m) => {
                        const isMine = String(m.senderId) === String(currentUser.id);
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                                isMine ? 'bg-linkedin text-white' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p className="whitespace-pre-line">{m.content}</p>
                              <p className={`mt-1 text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                {formatTime(m.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {error && <p className="px-4 text-xs text-red-600">{error}</p>}

                <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 p-3">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-linkedin focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="rounded-full bg-linkedin px-5 py-2 text-sm font-semibold text-white hover:bg-linkedin-dark disabled:opacity-60"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
