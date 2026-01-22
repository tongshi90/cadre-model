import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useRef, useEffect, useState } from 'react';
import {
  TeamOutlined,
  BarChartOutlined,
  TrophyOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './Prototype.css';

// 滚动触发动画组件
const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// 数字增长动画组件
const CountUp = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

        setCount(Math.floor(progress * end));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// 特色卡片组件
const FeatureCard = ({ icon, title, description, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}) => (
  <ScrollReveal delay={delay}>
    <motion.div
      className="feature-card"
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
      <div className="feature-glow"></div>
    </motion.div>
  </ScrollReveal>
);

// 统计卡片组件
const StatCard = ({ icon, label, value, color, delay }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay?: number;
}) => (
  <ScrollReveal delay={delay}>
    <motion.div
      className="stat-card"
      style={{ borderColor: color }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="stat-icon" style={{ color, background: `${color}15` }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>
          <CountUp end={value} />
        </div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-glow" style={{ background: color }}></div>
    </motion.div>
  </ScrollReveal>
);

const Prototype = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="prototype-page">
      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        {/* 动态背景 */}
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div
            className="mouse-glow"
            style={{
              left: mousePosition.x,
              top: mousePosition.y,
            }}
          ></div>
        </div>

        {/* Hero 内容 */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ThunderboltOutlined />
            <span>智能决策平台</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            数据驱动的
            <span className="gradient-text">人才管理</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            运用先进的数据分析算法，实现人才与岗位的智能匹配，
            <br />为组织决策提供科学依据，提升管理效率。
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始使用
              <ArrowRightOutlined />
            </motion.button>
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              了解更多
            </motion.button>
          </motion.div>

          {/* 滚动提示 */}
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{
              opacity: { delay: 1 },
              y: { duration: 1.5, repeat: Infinity },
            }}
          >
            <span>向下滚动</span>
            <div className="scroll-arrow"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* 统计数据区域 */}
      <section className="stats-section">
        <div className="container">
          <ScrollReveal>
            <h2 className="section-title">平台数据概览</h2>
            <p className="section-subtitle">实时统计数据，全面掌握系统运行状态</p>
          </ScrollReveal>

          <div className="stats-grid">
            <StatCard
              icon={<UserOutlined />}
              label="在职人才"
              value={156}
              color="#4ade80"
              delay={0}
            />
            <StatCard
              icon={<ApartmentOutlined />}
              label="岗位总数"
              value={42}
              color="#60a5fa"
              delay={100}
            />
            <StatCard
              icon={<TeamOutlined />}
              label="部门数量"
              value={8}
              color="#fbbf24"
              delay={200}
            />
            <StatCard
              icon={<BarChartOutlined />}
              label="匹配分析"
              value={128}
              color="#d4af37"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* 功能特色区域 */}
      <section className="features-section">
        <div className="container">
          <ScrollReveal>
            <h2 className="section-title">核心功能</h2>
            <p className="section-subtitle">强大功能，助力科学决策</p>
          </ScrollReveal>

          <div className="features-grid">
            <FeatureCard
              icon={<TrophyOutlined />}
              title="智能匹配"
              description="基于多维度数据模型，精准匹配合适岗位，提高人岗匹配度"
              delay={0}
            />
            <FeatureCard
              icon={<BarChartOutlined />}
              title="数据分析"
              description="全面的数据分析能力，为决策提供支持，可视化呈现分析结果"
              delay={100}
            />
            <FeatureCard
              icon={<RocketOutlined />}
              title="快速部署"
              description="简洁高效的系统架构，快速上手使用，降低学习成本"
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* 干部展示区域 */}
      <section className="showcase-section">
        <div className="container">
          <ScrollReveal>
            <h2 className="section-title">精英团队</h2>
            <p className="section-subtitle">优秀人才，助力组织发展</p>
          </ScrollReveal>

          <div className="team-grid">
            {[
              { name: '张三', position: '技术总监', department: '技术部', match: 95 },
              { name: '李四', position: '产品经理', department: '产品部', match: 92 },
              { name: '王五', position: '设计主管', department: '设计部', match: 89 },
              { name: '赵六', position: '运营总监', department: '运营部', match: 96 },
            ].map((member, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <motion.div
                  className="team-card"
                  whileHover={{ y: -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="team-card-bg"></div>
                  <div className="team-avatar">
                    <UserOutlined />
                  </div>
                  <h4 className="team-name">{member.name}</h4>
                  <p className="team-position">{member.position}</p>
                  <div className="team-meta">
                    <span className="team-department">{member.department}</span>
                    <span className={`team-match match-${member.match >= 95 ? 'high' : member.match >= 90 ? 'medium' : 'low'}`}>
                      匹配度 {member.match}%
                    </span>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="cta-section">
        <div className="container">
          <ScrollReveal>
            <motion.div
              className="cta-card"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="cta-title">准备好开始了吗？</h2>
              <p className="cta-description">
                立即体验智能人才管理平台，提升组织决策效率
              </p>
              <motion.button
                className="cta-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                立即开始
                <RocketOutlined />
              </motion.button>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Prototype;
