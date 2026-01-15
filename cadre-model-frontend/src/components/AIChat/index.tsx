import { useState } from 'react';
import { RobotOutlined, CloseOutlined } from '@ant-design/icons';
import './index.css';

interface AIChatProps {
  iframeUrl?: string;
}

const AIChat: React.FC<AIChatProps> = ({ iframeUrl = 'http://localhost:5173/home' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* 悬浮按钮 */}
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

      {/* 对话框 */}
      {isOpen && (
        <div className="ai-chat-modal">
          <div className="ai-chat-modal-header">
            <div className="ai-chat-modal-title-wrapper">
              <RobotOutlined className="ai-chat-title-icon" />
              <span className="ai-chat-modal-title">AI语音助手</span>
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
