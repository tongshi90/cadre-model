import { useState, useRef, useEffect } from 'react';
import { RobotOutlined, CloseOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import apiClient from '@/utils/request';
import './index.css';

const { TextArea } = Input;

interface AIChatProps {
  iframeUrl?: string;
  mode?: 'analysis' | 'chat' | 'both'; // analysis: 只显示AI分析按钮, chat: 只显示AI聊天按钮, both: 显示两个按钮
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIChat: React.FC<AIChatProps> = ({ iframeUrl = 'http://localhost:5173/home', mode = 'both' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleAnalysis = () => {
    setIsAnalysisOpen(!isAnalysisOpen);
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 发送消息（流式）
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // 添加用户消息
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: 'user', content: userMessage }
    ];
    setChatMessages(newMessages);
    setIsLoading(true);

    // 添加一个空的助手消息用于流式更新
    const assistantMessageIndex = newMessages.length;
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // 获取 API 基础地址
    const apiBaseUrl = window.config?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${apiBaseUrl}/weekly-report/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message: userMessage,
          history: newMessages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 处理 SSE 格式的数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              setIsLoading(false);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // 更新消息内容
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[assistantMessageIndex]) {
                    newMessages[assistantMessageIndex] = {
                      role: 'assistant',
                      content: accumulatedContent
                    };
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('AI chat error:', error);
      let errorMsg = '抱歉，网络连接出现问题，请检查网络后重试。';

      if (error.message) {
        errorMsg = `请求失败: ${error.message}`;
      }

      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[assistantMessageIndex]) {
          newMessages[assistantMessageIndex] = {
            role: 'assistant',
            content: errorMsg
          };
        }
        return newMessages;
      });
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* AI分析按钮 - 只在 mode 为 analysis 或 both 时显示 */}
      {(mode === 'analysis' || mode === 'both') && (
        <div className="ai-analysis-float-button-wrapper">
        {/* 脉冲波纹效果 */}
        <div className="ai-analysis-pulse ai-analysis-pulse-1"></div>
        <div className="ai-analysis-pulse ai-analysis-pulse-2"></div>
        <div className="ai-analysis-pulse ai-analysis-pulse-3"></div>

        {/* 主按钮 */}
        <div
          className={`ai-analysis-float-button ${isAnalysisOpen ? 'ai-analysis-open' : ''}`}
          onClick={toggleAnalysis}
          title="AI分析"
        >
          {isAnalysisOpen ? (
            <CloseOutlined className="ai-analysis-icon" />
          ) : (
            <>
              <FileTextOutlined className="ai-analysis-icon ai-analysis-icon-main" />
              <div className="ai-analysis-wave">
                <span className="ai-analysis-wave-bar"></span>
                <span className="ai-analysis-wave-bar"></span>
                <span className="ai-analysis-wave-bar"></span>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* AI分析弹窗 */}
      {(mode === 'analysis' || mode === 'both') && isAnalysisOpen && (
        <div className="ai-analysis-modal">
          <div className="ai-analysis-modal-header">
            <div className="ai-analysis-modal-title-wrapper">
              <FileTextOutlined className="ai-analysis-title-icon" />
              <span className="ai-analysis-modal-title">AI分析</span>
            </div>
            <CloseOutlined className="ai-analysis-modal-close" onClick={toggleAnalysis} />
          </div>
          <div className="ai-analysis-modal-content">
            {/* 欢迎消息 */}
            {chatMessages.length === 0 && (
              <div className="ai-analysis-welcome">
                <FileTextOutlined className="welcome-icon" />
                <h3>AI智能问答助手</h3>
                <p>您可以询问关于周报数据的任何问题，例如：</p>
                <ul>
                  <li>查询某人才的项目进度</li>
                  <li>了解某个项目的工作内容</li>
                  <li>查看项目风险点</li>
                  <li>统计各人才的工作情况</li>
                </ul>
              </div>
            )}

            {/* 对话消息列表 */}
            {chatMessages.length > 0 && (
              <div className="ai-analysis-messages">
                {chatMessages.map((msg, index) => {
                  const isLastAssistant = index === chatMessages.length - 1 && msg.role === 'assistant';
                  const isStreaming = isLastAssistant && isLoading;
                  return (
                    <div key={index} className={`message ${msg.role}`}>
                      <div className="message-avatar">
                        {msg.role === 'user' ? <FileTextOutlined /> : <RobotOutlined />}
                      </div>
                      <div className="message-content">
                        {msg.content}
                        {isStreaming && <span className="streaming-cursor"></span>}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* 输入区域 */}
            <div className="ai-analysis-input-area">
              <TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题...（Enter发送，Shift+Enter换行）"
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={isLoading}
              />
              <button
                className={`send-button ${inputMessage.trim() && !isLoading ? 'active' : ''}`}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <SendOutlined />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI聊天按钮 - 只在 mode 为 chat 或 both 时显示 */}
      {(mode === 'chat' || mode === 'both') && (
        <div className="ai-chat-float-button-wrapper">
        {/* 脉冲波纹效果 */}
        <div className="ai-chat-pulse ai-chat-pulse-1"></div>
        <div className="ai-chat-pulse ai-chat-pulse-2"></div>
        <div className="ai-chat-pulse ai-chat-pulse-3"></div>

        {/* 主按钮 */}
        <div
          className={`ai-chat-float-button ${isOpen ? 'ai-chat-open' : ''}`}
          onClick={toggleChat}
          title="AI交互"
        >
          {isOpen ? (
            <CloseOutlined className="ai-chat-icon" />
          ) : (
            <>
              <RobotOutlined className="ai-chat-icon ai-chat-icon-main" />
              <div className="ai-chat-wave">
                <span className="ai-chat-wave-bar"></span>
                <span className=""></span>
                <span className="ai-chat-wave-bar"></span>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* AI聊天对话框 - 只在 mode 为 chat 或 both 时显示 */}
      {(mode === 'chat' || mode === 'both') && isOpen && (
        <div className="ai-chat-modal">
          <div className="ai-chat-modal-header">
            <div className="ai-chat-modal-title-wrapper">
              <RobotOutlined className="ai-chat-title-icon" />
              <span className="ai-chat-modal-title">AI交互</span>
            </div>
            <CloseOutlined className="ai-chat-modal-close" onClick={toggleChat} />
          </div>
          <div className="ai-chat-modal-content">
            <iframe
              src={iframeUrl}
              title="AI Chat"
              className="ai-chat-iframe"
              frameBorder="0"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
