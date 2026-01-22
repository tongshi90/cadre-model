import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApartmentOutlined,
  TrophyOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import Hero from '@/components/ui/Hero';
import ScrollReveal from '@/components/ui/ScrollReveal';
import './Home.css';

// 鼠标跟随光晕效果
const MouseGlow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="mouse-glow"
      style={{
        left: position.x,
        top: position.y
      }}
    />
  );
};

const Home = () => {
  const navigate = useNavigate();

  // 平台功能模块
  const modules = [
    {
      icon: <ApartmentOutlined />,
      title: '人才管理',
      description: '全面管理人才基本信息、能力评分、特质分析、动态信息等'
    },
    {
      icon: <SafetyOutlined />,
      title: '岗位管理',
      description: '维护岗位信息、能力权重配置、岗位要求等'
    },
    {
      icon: <BarChartOutlined />,
      title: '匹配分析',
      description: '智能匹配分析，生成详细报告，支持对比分析'
    },
    {
      icon: <TeamOutlined />,
      title: '数据看板',
      description: '可视化数据展示，大屏展示，实时掌握平台运行状态'
    }
  ];

  // 平台优势
  const advantages = [
    {
      icon: <StarOutlined />,
      title: '精准识别',
      description: '多维度评估人才能力，精准识别高潜人才，优化人才队伍结构'
    },
    {
      icon: <TrophyOutlined />,
      title: '全面数据分析',
      description: '提供能力评估、特质分析、潜力预测等多维度分析功能，为组织决策提供科学依据'
    },
    {
      icon: <CrownOutlined />,
      title: '风险预警机制',
      description: '智能识别关键岗位风险，提前预警空缺风险，帮助组织做好人才储备和梯队建设规划'
    }
  ];

  return (
    <div className="home-page">
      <MouseGlow />

      {/* Hero Section */}
      <Hero
        title="数据驱动的"
        titleHighlight="智能人才管理平台"
        description="运用先进的数据分析算法，实现人才与岗位的智能匹配，<br />为组织决策提供科学依据，提升管理效率。"
        badge={{
          icon: <ThunderboltOutlined />,
          text: '智能决策平台',
        }}
        actions={[
          {
            primary: true,
            children: (
              <>
                开始使用
                <ArrowRightOutlined />
              </>
            ),
            onClick: () => navigate('/cadre'),
          },
          {
            children: '了解更多',
            onClick: () => {
              document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
            },
          },
        ]}
      />

      {/* 平台介绍 */}
      <section className="intro-section">
        <div className="container">
          <ScrollReveal>
            <div className="intro-content">
              <div className="intro-text">
                <h2 className="intro-title">
                  <span className="title-accent">智能化</span>
                  人才管理解决方案
                </h2>
                <p className="intro-description">
                  本平台是一款面向企业人才管理的综合信息系统，通过数据分析与智能算法，
                  实现人才信息管理、岗位画像管理、人才岗位匹配度分析等核心功能，
                  为组织人事决策提供科学依据，助力企业建立可持续发展的人才梯队。
                </p>
                <div className="intro-features">
                  <div className="intro-feature-item">
                    <CheckCircleOutlined />
                    <span>数据驱动决策</span>
                  </div>
                  <div className="intro-feature-item">
                    <CheckCircleOutlined />
                    <span>智能匹配算法</span>
                  </div>
                  <div className="intro-feature-item">
                    <CheckCircleOutlined />
                    <span>全面分析评估</span>
                  </div>
                  <div className="intro-feature-item">
                    <CheckCircleOutlined />
                    <span>可视化呈现</span>
                  </div>
                </div>
              </div>
              <div className="intro-visual">
                <div className="intro-card-stack">
                  <div className="intro-card intro-card-1">
                    <TrophyOutlined />
                    <span>智能匹配</span>
                  </div>
                  <div className="intro-card intro-card-2">
                    <BarChartOutlined />
                    <span>数据分析</span>
                  </div>
                  <div className="intro-card intro-card-3">
                    <TeamOutlined />
                    <span>梯队建设</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 核心功能、模块与优势 - 综合展示 */}
      <section id="features-section" className="capabilities-section">
        <div className="container">
          <ScrollReveal threshold={0.01}>
            <h2 className="section-title">平台能力</h2>
            <p className="section-subtitle">功能模块与平台优势</p>
          </ScrollReveal>

          <div className="capabilities-wrapper">
            {/* 平台功能模块 */}
            <div className="capabilities-group">
              <div className="capabilities-group-header">
                <ApartmentOutlined />
                <h3>功能模块</h3>
              </div>
              <div className="capabilities-list">
                {modules.map((module, index) => (
                  <div key={index} className="capability-card-simple">
                    <div className="capability-icon-simple">
                      {module.icon}
                    </div>
                    <div className="capability-content-simple">
                      <h4>{module.title}</h4>
                      <p>{module.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 平台优势 */}
            <div className="capabilities-group">
              <div className="capabilities-group-header">
                <StarOutlined />
                <h3>平台优势</h3>
              </div>
              <div className="capabilities-list">
                {advantages.map((advantage, index) => (
                  <div key={index} className="capability-card-simple">
                    <div className="capability-icon-simple">
                      {advantage.icon}
                    </div>
                    <div className="capability-content-simple">
                      <h4>{advantage.title}</h4>
                      <p>{advantage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="cta-section">
        <div className="container">
          <ScrollReveal>
            <div className="cta-card">
              <div className="cta-glow"></div>
              <h2 className="cta-title">开始智能人才管理之旅</h2>
              <p className="cta-description">
                立即体验智能人才管理平台，运用数据分析为组织决策提供支持，提升管理效率
              </p>
              <div className="cta-actions">
                <button
                  className="cta-button cta-button-primary"
                  onClick={() => navigate('/cadre')}
                >
                  <RocketOutlined />
                  立即开始
                </button>
                <button
                  className="cta-button cta-button-secondary"
                  onClick={() => navigate('/match')}
                >
                  <BarChartOutlined />
                  匹配分析
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
