import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
  color: #fff200;
  text-shadow: 0 0 20px rgba(255, 242, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  color: #ccc;
`;

const ComingSoonSection = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  border: 1px solid #444;
`;

const ComingSoonText = styled.h2`
  color: #fff200;
  font-size: 1.8rem;
  margin-bottom: 20px;
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 242, 0, 0.05);
  border: 1px solid rgba(255, 242, 0, 0.2);
  border-radius: 8px;
  padding: 20px;
  text-align: left;
`;

const FeatureTitle = styled.h3`
  color: #fff200;
  margin-bottom: 10px;
  font-size: 1.1rem;
`;

const FeatureDescription = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ComingSoonDescription = styled.p`
  color: #ccc;
  font-size: 1rem;
  margin-bottom: 30px;
`;

const AdvancedAnalysisPage: React.FC = () => {
  const features = [
    {
      title: "Machine Learning Models",
      description: "AI-powered analysis using machine learning for option pricing predictions"
    },
    {
      title: "Volatility Surface",
      description: "3D volatility surface visualization and analysis across strikes and time"
    },
    {
      title: "Greeks Heat Map",
      description: "Interactive heat maps showing Greeks distribution across the option chain"
    },
    {
      title: "Monte Carlo Simulation",
      description: "Run Monte Carlo simulations for strategy testing and risk analysis"
    },
    {
      title: "Correlation Analysis",
      description: "Analyze correlations between different assets and option strategies"
    },
    {
      title: "Advanced Charting",
      description: "Professional-grade charts with 50+ technical indicators and drawing tools"
    },
    {
      title: "Risk Management",
      description: "Advanced risk management tools with VaR, CVaR, and stress testing"
    },
    {
      title: "Market Microstructure",
      description: "Deep dive into market microstructure analysis and order flow"
    }
  ];

  return (
    <PageContainer>
      <HeaderSection>
        <Title>Advanced Analysis</Title>
        <Subtitle>Professional-grade analytics with AI-powered insights and advanced modeling</Subtitle>
      </HeaderSection>

      <ComingSoonSection>
        <ComingSoonText>⚡ Coming Soon</ComingSoonText>
        <ComingSoonDescription>
          Advanced Analysis will provide institutional-grade analytics and AI-powered insights.
        </ComingSoonDescription>

        <FeatureList>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeatureList>
      </ComingSoonSection>
    </PageContainer>
  );
};

export default AdvancedAnalysisPage;
